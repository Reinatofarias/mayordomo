begin;
create function public.complete_onboarding(profile_data jsonb,snapshot_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); already_done timestamptz;
begin
 if uid is null then raise exception 'Unauthorized'; end if;
 select onboarding_completed_at into already_done from public.profiles where id=uid for update;
 if already_done is not null then return; end if;
 if length(profile_data->>'name') not between 1 and 80 or profile_data->>'currency' !~ '^[A-Z]{3}$' then raise exception 'Invalid profile'; end if;
 update public.profiles set name=profile_data->>'name',country=profile_data->>'country',currency=profile_data->>'currency',locale=profile_data->>'locale',timezone=profile_data->>'timezone',
 monthly_income_minor=(profile_data->>'monthly_income_minor')::bigint,fixed_expenses_minor=(profile_data->>'fixed_expenses_minor')::bigint,opening_debt_minor=(profile_data->>'opening_debt_minor')::bigint,reserve_minor=(profile_data->>'reserve_minor')::bigint,objective=profile_data->>'objective',onboarding_completed_at=now() where id=uid;
 insert into public.financial_snapshots(user_id,data) values(uid,snapshot_data);
 insert into public.consents(user_id,type,version) values(uid,'TERMS','draft-1'),(uid,'PRIVACY','draft-1') on conflict do nothing;
 insert into public.activity_events(user_id,type) values(uid,'TERMS_ACCEPTED'),(uid,'FINANCIAL_PROFILE_CREATED'),(uid,'ONBOARDING_COMPLETED'),(uid,'FIRST_VALUE_COMPLETED');
end $$;
revoke all on function public.complete_onboarding(jsonb,jsonb) from public,anon;
grant execute on function public.complete_onboarding(jsonb,jsonb) to authenticated;
commit;
