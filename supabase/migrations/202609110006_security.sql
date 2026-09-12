begin;
-- Explicit grants: public key requests still pass RLS on every row.
do $$ declare t text; begin
 foreach t in array array['profiles','categories','financial_accounts','bank_connections','import_jobs','transactions','budgets','budget_categories','goals','debts','biblical_principles','financial_snapshots','financial_insights','ai_conversations','ai_messages','notifications','activity_events','consents','support_requests','subscriptions','entitlements'] loop
 execute format('grant select on public.%I to authenticated',t);
 end loop;
 foreach t in array array['financial_accounts','import_jobs','transactions','budgets','budget_categories','goals','debts','ai_conversations','support_requests','ai_messages','consents'] loop
 execute format('grant insert on public.%I to authenticated',t);
 end loop;
 foreach t in array array['financial_accounts','import_jobs','budgets','budget_categories','goals','debts','ai_conversations','support_requests'] loop
 execute format('grant update on public.%I to authenticated',t);
 end loop;
 foreach t in array array['transactions','budgets','budget_categories','goals','debts'] loop
 execute format('grant delete on public.%I to authenticated',t);
 end loop;
end $$;
revoke update on public.profiles from authenticated;
grant update(name,phone,locale,timezone) on public.profiles to authenticated;
revoke update on public.transactions from authenticated;
grant update(description,merchant,category_id,occurred_at,amount_minor,currency,kind,account_id) on public.transactions to authenticated;
drop policy owner_insert on public.transactions;
create policy owner_insert on public.transactions for insert to authenticated with check((select auth.uid())=user_id and source='MANUAL');
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create or replace function public.complete_onboarding(profile_data jsonb,snapshot_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.profiles; snapshot jsonb;
begin
 if uid is null then raise exception 'Unauthorized';end if;
 select * into p from public.profiles where id=uid for update;
 if p.id is null then raise exception 'Profile missing';end if;
 if p.onboarding_completed_at is not null then return;end if;
 if coalesce(length(profile_data->>'name'),0) not between 1 and 80 or coalesce(profile_data->>'currency','') !~ '^[A-Z]{3}$' then raise exception 'Invalid profile';end if;
 update public.profiles set name=profile_data->>'name',country=profile_data->>'country',currency=profile_data->>'currency',locale=profile_data->>'locale',timezone=profile_data->>'timezone',
 monthly_income_minor=(profile_data->>'monthly_income_minor')::bigint,fixed_expenses_minor=(profile_data->>'fixed_expenses_minor')::bigint,opening_debt_minor=(profile_data->>'opening_debt_minor')::bigint,reserve_minor=(profile_data->>'reserve_minor')::bigint,objective=profile_data->>'objective',onboarding_completed_at=now()
 where id=uid returning * into p;
 snapshot:=jsonb_build_object('basis','ESTIMATE',
 'income',jsonb_build_object('amountMinor',p.monthly_income_minor::text,'currency',p.currency),
 'committed',jsonb_build_object('amountMinor',p.fixed_expenses_minor::text,'currency',p.currency),
 'available',jsonb_build_object('amountMinor',(p.monthly_income_minor-p.fixed_expenses_minor)::text,'currency',p.currency),
 'debt',jsonb_build_object('amountMinor',p.opening_debt_minor::text,'currency',p.currency),
 'reserve',jsonb_build_object('amountMinor',p.reserve_minor::text,'currency',p.currency),
 'status',case when p.fixed_expenses_minor>p.monthly_income_minor then 'Necesitas actuar' when (p.monthly_income_minor::numeric-p.fixed_expenses_minor)*10<p.monthly_income_minor then 'Atención' else 'Bajo control' end);
 insert into public.financial_snapshots(user_id,data) values(uid,snapshot);
 insert into public.consents(user_id,type,version) values(uid,'TERMS','draft-1'),(uid,'PRIVACY','draft-1') on conflict do nothing;
 insert into public.activity_events(user_id,type) values(uid,'ONBOARDING_STARTED'),(uid,'TERMS_ACCEPTED'),(uid,'FINANCIAL_PROFILE_CREATED'),(uid,'ONBOARDING_COMPLETED'),(uid,'FIRST_VALUE_COMPLETED');
end $$;
create function private.enforce_write_rate() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_TABLE_NAME='transactions' then
  if coalesce(NEW.source,OLD.source)<>'MANUAL' then return coalesce(NEW,OLD);end if;
 end if;
 if auth.uid() is not null and not public.consume_rate_limit('write') then raise exception 'Rate limit exceeded';end if;
 return coalesce(NEW,OLD);
end $$;
do $$ declare t text; begin
 foreach t in array array['budgets','budget_categories','goals','debts','support_requests','financial_accounts'] loop
 execute format('create trigger enforce_write_rate before insert or update or delete on public.%I for each row execute function private.enforce_write_rate()',t);
 end loop;
end $$;
create trigger enforce_write_rate before insert or update or delete on public.transactions for each row execute function private.enforce_write_rate();
commit;
