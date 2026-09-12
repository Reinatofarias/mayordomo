begin;
create function public.consume_rate_limit(action_name text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); n integer; max_count integer;
begin
 if uid is null or action_name not in ('ai','import','support','write') then return false; end if;
 max_count:=case action_name when 'ai' then 10 when 'import' then 5 else 60 end;
 insert into private.rate_limits(key,window_at,count) values(uid::text||':'||action_name,date_trunc('minute',now()),1)
 on conflict(key) do update set count=case when private.rate_limits.window_at=date_trunc('minute',now()) then private.rate_limits.count+1 else 1 end,window_at=date_trunc('minute',now()) returning count into n;
 return n<=max_count;
end $$;
revoke all on function public.consume_rate_limit(text) from public,anon;
grant execute on function public.consume_rate_limit(text) to authenticated;
create policy message_insert on public.ai_messages for insert to authenticated with check((select auth.uid())=user_id);
create function private.log_mutation() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; event_name text;
begin
 owner_id:=case when TG_OP='DELETE' then OLD.user_id else NEW.user_id end;
 event_name:=case TG_TABLE_NAME when 'transactions' then 'TRANSACTION' when 'budgets' then 'BUDGET' when 'goals' then 'GOAL' when 'debts' then 'DEBT' else 'SUPPORT_REQUEST' end;
 insert into public.activity_events(user_id,type) values(owner_id,event_name||case TG_OP when 'INSERT' then '_CREATED' when 'UPDATE' then '_UPDATED' else '_DELETED' end);
 return coalesce(NEW,OLD);
end $$;
do $$ declare t text; begin
 foreach t in array array['transactions','budgets','goals','debts','support_requests'] loop
 execute format('create trigger log_mutation after insert or update or delete on public.%I for each row execute function private.log_mutation()',t);
 end loop;
end $$;
commit;
