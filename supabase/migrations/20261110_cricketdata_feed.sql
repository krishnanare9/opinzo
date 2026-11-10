begin;

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
 if p_match_id is null or p_match_id !~ '^(cricapi:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9]{5,12})$' then raise exception 'Invalid cricket match';end if;
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

-- Shared cache prevents every browser / Edge instance consuming provider quota.
create table if not exists public.cricket_feed_cache (
 cache_key text primary key,
 data jsonb,
 fetched_at timestamptz,
 next_attempt_at timestamptz not null default '-infinity',
 claim_id uuid,
 usage_day date not null default (now() at time zone 'UTC')::date,
 attempts integer not null default 0
);
alter table public.cricket_feed_cache enable row level security;
revoke all on public.cricket_feed_cache from public,anon,authenticated;

create or replace function public.cricket_feed_claim(p_key text,p_refresh_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cached_data jsonb; next_attempt timestamptz; used_day date; attempt_count integer; token uuid; today date := (now() at time zone 'UTC')::date;
begin
 if p_key <> 'cricketdata-current-v1' then raise exception 'Invalid cache key'; end if;
 insert into public.cricket_feed_cache(cache_key) values(p_key) on conflict do nothing;
 select data,next_attempt_at,usage_day,attempts into cached_data,next_attempt,used_day,attempt_count from public.cricket_feed_cache where cache_key=p_key for update;
 if used_day <> today then
  attempt_count := 0;
  update public.cricket_feed_cache set usage_day=today,attempts=0 where cache_key=p_key;
 end if;
 if next_attempt > now() or attempt_count >= 96 then
  return jsonb_build_object('fetch',false,'data',cached_data,'nextAttemptAt',next_attempt);
 end if;
 token := gen_random_uuid();
 update public.cricket_feed_cache set claim_id=token,attempts=attempt_count+1,
 next_attempt_at=now()+make_interval(secs=>greatest(900,least(coalesce(p_refresh_seconds,900),3600)))
 where cache_key=p_key;
 return jsonb_build_object('fetch',true,'claim',token,'data',cached_data);
end;$$;
create or replace function public.cricket_feed_store(p_key text,p_claim uuid,p_data jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_key <> 'cricketdata-current-v1' or jsonb_typeof(p_data->'matches') <> 'array' then raise exception 'Invalid feed'; end if;
 update public.cricket_feed_cache set data=p_data,fetched_at=now()
 where cache_key=p_key and claim_id=p_claim;
 if not found then raise exception 'Expired cache claim'; end if;
end;$$;
revoke all on function public.cricket_feed_claim(text,integer) from public,anon,authenticated;
revoke all on function public.cricket_feed_store(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cricket_feed_claim(text,integer) to service_role;
grant execute on function public.cricket_feed_store(text,uuid,jsonb) to service_role;

commit;
