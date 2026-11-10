-- OPINZO / Supabase schema (run ONCE in a NEW, dedicated Supabase project).
-- Free-to-play virtual points only. No payment, purchase, redemption or cash-out.
-- All wallet changes, market creation and settlement happen in trusted SQL functions.
-- Do NOT run this against an existing production database without reviewing migrations.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 30),
  coin_balance integer not null default 500 check (coin_balance >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 15 and 220),
  description text not null check (char_length(description) between 15 and 1000),
  category text not null check (category in ('Crypto','Sports','Technology','Markets','World')),
  ends_at timestamptz not null,
  status text not null default 'open' check (status in ('open','resolved','void')),
  outcome text check (outcome in ('yes','no')),
  resolution_source text,
  yes_votes integer not null default 0 check (yes_votes >= 0),
  no_votes integer not null default 0 check (no_votes >= 0),
  created_at timestamptz not null default now(),
  constraint valid_resolution check (
    (status = 'open' and outcome is null and resolution_source is null) or
    (status = 'resolved' and outcome is not null and resolution_source is not null) or
    (status = 'void' and outcome is null and resolution_source is not null)
  )
);
create index if not exists markets_end_idx on public.markets(ends_at);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete restrict,
  choice text not null check (choice in ('yes','no')),
  stake integer not null check (stake in (10,25,50,100)),
  payout integer not null default 0 check (payout >= 0),
  status text not null default 'pending' check (status in ('pending','won','lost','refunded')),
  created_at timestamptz not null default now(),
  unique(user_id,market_id)
);
create index if not exists predictions_user_idx on public.predictions(user_id,created_at desc);
create index if not exists predictions_market_idx on public.predictions(market_id);

create table if not exists public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid references public.markets(id) on delete restrict,
  amount integer not null check (amount <> 0),
  reason text not null,
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.coin_ledger(user_id,created_at desc);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

-- Expose only reads allowed by row-level security. Client writes are denied;
-- all point movements require the SQL transactions below.
alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.predictions enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.app_admins enable row level security;

-- Policies are idempotent when setup is re-run.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Read public markets" on public.markets;
create policy "Read public markets" on public.markets for select to anon, authenticated using (true);

drop policy if exists "Read own predictions" on public.predictions;
create policy "Read own predictions" on public.predictions for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Read own ledger" on public.coin_ledger;
create policy "Read own ledger" on public.coin_ledger for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.profiles, public.markets, public.predictions, public.coin_ledger, public.app_admins from anon, authenticated;
grant select on public.markets to anon, authenticated;
grant select on public.profiles, public.predictions, public.coin_ledger to authenticated;

-- Invoked automatically by Supabase Auth when a NEW account is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(nullif(new.raw_user_meta_data->>'username',''),
                    nullif(split_part(coalesce(new.email,''),'@',1),''), 'Player');
  v_name := trim(left(regexp_replace(v_name,'[^[:alnum:] _.-]','','g'),20));
  if char_length(v_name)<3 then v_name := 'Player_' || left(new.id::text,8); end if;
  insert into public.profiles(id,username,coin_balance) values(new.id,v_name,500)
  on conflict (id) do nothing;
  insert into public.coin_ledger(user_id,amount,reason,balance_after)
  values(new.id,500,'Welcome bonus',500);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_opinzo on auth.users;
create trigger on_auth_user_created_opinzo after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.app_admins where user_id = (select auth.uid()));
$$;

-- Returns a read-only public ranking; does not expose emails or user IDs.
create or replace function public.get_leaderboard()
returns table(username text, wins bigint, predictions bigint, coins integer)
language sql stable security definer set search_path = ''
as $$
  select p.username,
         count(pr.id) filter (where pr.status = 'won') as wins,
         count(pr.id) as predictions,
         p.coin_balance as coins
  from public.profiles p
  left join public.predictions pr on pr.user_id = p.id
  group by p.id, p.username, p.coin_balance
  order by wins desc, p.coin_balance desc, predictions desc, p.created_at asc
  limit 50;
$$;

-- Atomic lock order: market -> account. One pick per market per user.
-- Wrong result: stake already lost; correct result: pay 2x stake.
create or replace function public.place_prediction(
  p_market_id uuid,
  p_choice text,
  p_stake integer
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_market public.markets%rowtype;
  v_balance integer;
  v_prediction_id uuid;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if p_choice not in ('yes','no') or p_choice is null then raise exception 'Invalid choice'; end if;
  if p_stake not in (10,25,50,100) or p_stake is null then raise exception 'Invalid stake'; end if;

  select * into v_market from public.markets where id = p_market_id for update;
  if not found then raise exception 'Market not found'; end if;
  if v_market.status <> 'open' or v_market.ends_at <= now() then
    raise exception 'Market is closed';
  end if;
  select coin_balance into v_balance from public.profiles where id=v_uid for update;
  if not found then raise exception 'Account not ready'; end if;
  if v_balance < p_stake then raise exception 'Insufficient virtual points'; end if;
  if exists(select 1 from public.predictions where user_id=v_uid and market_id=p_market_id) then
    raise exception 'You already predicted this market';
  end if;

  insert into public.predictions(user_id,market_id,choice,stake)
  values(v_uid,p_market_id,p_choice,p_stake) returning id into v_prediction_id;
  update public.profiles set coin_balance=coin_balance-p_stake where id=v_uid
  returning coin_balance into v_balance;
  insert into public.coin_ledger(user_id,market_id,amount,reason,balance_after)
  values(v_uid,p_market_id,-p_stake,'Prediction stake · '||left(v_market.question,100),v_balance);
  update public.markets set
    yes_votes=yes_votes+case when p_choice='yes' then 1 else 0 end,
    no_votes=no_votes+case when p_choice='no' then 1 else 0 end
  where id=p_market_id;
  return v_prediction_id;
end;
$$;

create or replace function public.admin_create_market(
  p_question text,
  p_description text,
  p_category text,
  p_ends_at timestamptz
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_question is null or char_length(trim(p_question)) not between 15 and 220 then raise exception 'Question must be 15–220 characters'; end if;
  if p_description is null or char_length(trim(p_description)) not between 15 and 1000 then raise exception 'Settlement criteria must be 15–1000 characters'; end if;
  if p_category is null or p_category not in ('Crypto','Sports','Technology','Markets','World') then raise exception 'Invalid category'; end if;
  if p_ends_at is null or p_ends_at <= now()+interval '5 minutes' then raise exception 'Closing time must be at least 5 minutes in the future'; end if;
  insert into public.markets(question,description,category,ends_at)
  values(trim(p_question),trim(p_description),p_category,p_ends_at) returning id into v_id;
  return v_id;
end;
$$;

-- Admin-only settlement; VOID refunds the original stakes on unresolvable events.
-- Locking market first serializes settlement with any in-flight predictions.
create or replace function public.admin_settle_market(
  p_market_id uuid,
  p_outcome text,
  p_resolution_source text
)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  v_market public.markets%rowtype;
  v_pick record;
  v_balance integer;
  v_paid integer := 0;
  v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_outcome is null or p_outcome not in ('yes','no','void') then raise exception 'Invalid outcome'; end if;
  if p_resolution_source is null or p_resolution_source !~* '^https://[^[:space:]]+$' or length(p_resolution_source) > 1000 then
    raise exception 'A valid https:// public resolution link is required';
  end if;
  select * into v_market from public.markets where id=p_market_id for update;
  if not found then raise exception 'Market not found'; end if;
  if v_market.status <> 'open' then raise exception 'Market already settled'; end if;
  if v_market.ends_at > now() then raise exception 'Wait until the market closes'; end if;

  update public.markets
  set status=case when p_outcome='void' then 'void' else 'resolved' end,
      outcome=case when p_outcome='void' then null else p_outcome end,
      resolution_source=p_resolution_source
  where id=p_market_id;

  for v_pick in select id,user_id,choice,stake from public.predictions
                where market_id=p_market_id and status='pending' for update
  loop
    v_paid := case when p_outcome='void' then v_pick.stake
                   when v_pick.choice=p_outcome then v_pick.stake*2 else 0 end;
    update public.predictions set
      status=case when p_outcome='void' then 'refunded'
                  when v_pick.choice=p_outcome then 'won' else 'lost' end,
      payout=v_paid where id=v_pick.id;
    if v_paid>0 then
      update public.profiles set coin_balance=coin_balance+v_paid where id=v_pick.user_id
      returning coin_balance into v_balance;
      insert into public.coin_ledger(user_id,market_id,amount,reason,balance_after)
      values(v_pick.user_id,p_market_id,v_paid,
             case when p_outcome='void' then 'Voided market refund · ' else 'Correct prediction · ' end || left(v_market.question,100),
             v_balance);
    end if;
    v_count := v_count+1;
  end loop;
  return v_count;
end;
$$;

-- PostgreSQL functions default to PUBLIC EXECUTE: explicitly restrict entrypoints.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.get_leaderboard() from public, anon, authenticated;
revoke all on function public.place_prediction(uuid,text,integer) from public, anon, authenticated;
revoke all on function public.admin_create_market(text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.admin_settle_market(uuid,text,text) from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_leaderboard() to anon, authenticated;
grant execute on function public.place_prediction(uuid,text,integer) to authenticated;
grant execute on function public.admin_create_market(text,text,text,timestamptz) to authenticated;
grant execute on function public.admin_settle_market(uuid,text,text) to authenticated;

-- ADMIN SETUP (run separately AFTER you have signed up and confirmed your email):
-- 1. In Supabase > Authentication > Users, copy YOUR USER ID (UUID).
-- 2. Uncomment the next line and replace the placeholder with YOUR UUID:
-- insert into public.app_admins(user_id) values ('YOUR-USER-UUID-HERE') on conflict do nothing;
-- 3. Refresh Opinzo and the admin dashboard will become available.

-- Cricket prediction metadata; existing questions remain valid.
alter table public.markets add column if not exists cricket_match_id text;
alter table public.markets add column if not exists cricket_kind text;
alter table public.markets add column if not exists cricket_subject text;
alter table public.markets add column if not exists cricket_line numeric;
alter table public.markets add column if not exists cricket_period text;

create or replace function public.admin_create_cricket_market(
 p_match_id text,p_kind text,p_subject text,p_line numeric,p_period text,
 p_question text,p_description text,p_ends_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'Admin access required';end if;
 if p_match_id is null or p_match_id !~ '^[0-9]{5,12}$' then raise exception 'Invalid cricket match';end if;
 if p_kind is null or p_kind not in ('match_winner','session_runs','innings_runs','wickets','player_runs','player_wickets') then raise exception 'Invalid cricket market type';end if;
 if p_subject is null or char_length(trim(p_subject)) not between 2 and 80 then raise exception 'Choose the exact team or player';end if;
 if p_period is null or char_length(trim(p_period)) not between 3 and 100 then raise exception 'Specify innings and measurement period';end if;
 if p_kind<>'match_winner' and (p_line is null or p_line<0 or p_line>1000 or mod(p_line*2,1)<>0) then raise exception 'Line must be a whole or half number from 0 to 1000';end if;
 if p_kind in ('wickets','player_wickets') and p_line>=10 then raise exception 'Wicket line must be below 10';end if;
 v_id:=public.admin_create_market(p_question,p_description,'Sports',p_ends_at);
 update public.markets set cricket_match_id=p_match_id,cricket_kind=p_kind,
 cricket_subject=trim(p_subject),cricket_line=case when p_kind='match_winner' then null else p_line end,
 cricket_period=trim(p_period) where id=v_id;
 return v_id;
end;$$;
revoke all on function public.admin_create_cricket_market(text,text,text,numeric,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_create_cricket_market(text,text,text,numeric,text,text,text,timestamptz) to authenticated;
