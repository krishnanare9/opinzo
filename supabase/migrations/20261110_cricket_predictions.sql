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

-- Admin can stop a live cricket question immediately when play changes.
create or replace function public.admin_close_cricket_market(p_market_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin access required';end if;
 update public.markets set ends_at=least(ends_at,now())
 where id=p_market_id and cricket_match_id is not null and status='open';
 if not found then raise exception 'Open cricket question not found';end if;
end;$$;
revoke all on function public.admin_close_cricket_market(uuid) from public,anon,authenticated;
grant execute on function public.admin_close_cricket_market(uuid) to authenticated;
