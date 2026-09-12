begin;
alter table public.payment_events add column normalized jsonb;
alter table public.subscriptions add column event_at timestamptz not null default '-infinity';
alter table public.entitlements add column subscription_external_id text;
create index entitlements_subscription on public.entitlements(provider,subscription_external_id);
create table private.app_configuration (
 singleton boolean primary key default true check(singleton), billing_enforced boolean not null default false
);
insert into private.app_configuration(singleton) values(true);
create function public.has_product_access() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 not (select billing_enforced from private.app_configuration where singleton)
 or exists(select 1 from public.entitlements where user_id=auth.uid() and status='ACTIVE' and access_until>now())
 )
$$;
revoke all on function public.has_product_access() from public,anon;
grant execute on function public.has_product_access() to authenticated;
do $$ declare t text; begin
 foreach t in array array['financial_accounts','bank_connections','import_jobs','transactions','budgets','budget_categories','goals','debts','financial_snapshots','financial_insights','ai_conversations','ai_messages'] loop
 execute format('create policy paid_access on public.%I as restrictive for all to authenticated using ((select public.has_product_access())) with check ((select public.has_product_access()))',t);
 end loop;
end $$;
create function public.process_payment_event(p_event jsonb) returns text language plpgsql security definer set search_path='' as $$
declare evt public.payment_events; uid uuid; action_name text:=p_event->>'action';
 event_time timestamptz:=(p_event->>'occurredAt')::timestamptz;
 expiry timestamptz:=(p_event->>'accessUntil')::timestamptz;
 subscription_code text:=p_event->>'subscriptionId'; sub public.subscriptions;
begin
 if p_event->>'id' is null or action_name not in ('ACTIVATE','REVOKE','CANCEL','OVERDUE','REVIEW','IGNORE') then raise exception 'Invalid event'; end if;
 insert into public.payment_events(provider,external_id,type,occurred_at,normalized)
 values('hotmart',p_event->>'id',p_event->>'type',event_time,p_event) on conflict(provider,external_id) do nothing;
 select * into evt from public.payment_events where provider='hotmart' and external_id=p_event->>'id' for update;
 if evt.status in ('APPLIED','IGNORED','REVIEW_REQUIRED') then return 'DUPLICATE'; end if;
 if evt.normalized is not null and evt.normalized<>p_event then raise exception 'Conflicting event';end if;
 if action_name='IGNORE' then update public.payment_events set status='IGNORED',normalized=null where id=evt.id;return 'IGNORED';end if;
 if action_name='REVIEW' then update public.payment_events set status='REVIEW_REQUIRED' where id=evt.id;return 'REVIEW_REQUIRED';end if;
 select id into uid from auth.users where lower(email)=lower(p_event->>'email') and email_confirmed_at is not null;
 if uid is null then update public.payment_events set status='UNMATCHED' where id=evt.id;return 'UNMATCHED';end if;
 -- Serializes different event IDs for the same purchaser, including refunds and renewals.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if subscription_code is not null then
  select * into sub from public.subscriptions where provider='hotmart' and external_id=subscription_code for update;
  if sub.id is not null and sub.user_id<>uid then raise exception 'Subscription owner mismatch';end if;
 end if;
 if action_name='ACTIVATE' then
  if expiry is null then raise exception 'Access expiry required';end if;
  if sub.status='CANCELLED' and sub.event_at>=event_time then expiry:=least(expiry,sub.access_until);end if;
  insert into public.entitlements(user_id,provider,purchase_id,status,access_until,event_at,subscription_external_id)
  values(uid,'hotmart',p_event->>'purchaseId','ACTIVE',expiry,event_time,subscription_code)
  on conflict(provider,purchase_id) do update set access_until=greatest(public.entitlements.access_until,excluded.access_until),event_at=excluded.event_at
  where public.entitlements.user_id=uid and public.entitlements.status<>'REVOKED' and public.entitlements.event_at<=excluded.event_at;
 elsif action_name='REVOKE' then
  insert into public.entitlements(user_id,provider,purchase_id,status,access_until,event_at,subscription_external_id)
  values(uid,'hotmart',p_event->>'purchaseId','REVOKED',event_time,event_time,subscription_code)
  on conflict(provider,purchase_id) do update set status='REVOKED',access_until=event_time,event_at=greatest(public.entitlements.event_at,event_time)
  where public.entitlements.user_id=uid;
 elsif action_name='CANCEL' then
  if expiry is null then expiry:=sub.access_until;end if;
  if expiry is null then update public.payment_events set status='REVIEW_REQUIRED' where id=evt.id;return 'REVIEW_REQUIRED';end if;
  if sub.id is null or sub.event_at<=event_time then
   update public.entitlements set access_until=least(access_until,expiry)
   where user_id=uid and provider='hotmart' and subscription_external_id=subscription_code and status='ACTIVE';
  end if;
 end if;
 if subscription_code is not null then
  insert into public.subscriptions(user_id,provider,external_id,plan,status,purchased_at,renewal_at,access_until,event_at)
  values(uid,'hotmart',subscription_code,p_event->>'plan',
   case action_name when 'CANCEL' then 'CANCELLED' when 'OVERDUE' then 'OVERDUE' when 'REVOKE' then 'PAYMENT_REVOKED' else 'ACTIVE' end,
   (p_event->>'purchasedAt')::timestamptz,(p_event->>'renewalAt')::timestamptz,coalesce(expiry,sub.access_until),event_time)
  on conflict(provider,external_id) do update set
   status=excluded.status,event_at=excluded.event_at,
   access_until=case when action_name='ACTIVATE' then greatest(public.subscriptions.access_until,excluded.access_until) else coalesce(excluded.access_until,public.subscriptions.access_until) end,
   renewal_at=excluded.renewal_at,plan=excluded.plan,
   purchased_at=coalesce(public.subscriptions.purchased_at,excluded.purchased_at)
  where public.subscriptions.user_id=uid and public.subscriptions.event_at<=excluded.event_at;
 end if;
 update public.payment_events set status='APPLIED',normalized=null where id=evt.id;
 insert into public.activity_events(user_id,type) values(uid,'PAYMENT_'||action_name);
 return 'APPLIED';
end $$;
revoke all on function public.process_payment_event(jsonb) from public,anon,authenticated;
grant execute on function public.process_payment_event(jsonb) to service_role;
create function public.claim_pending_payments() returns integer language plpgsql security definer set search_path='' as $$
declare address text; item record; count_items integer:=0;
begin
 select email into address from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if address is null then return 0;end if;
 for item in select normalized from public.payment_events where status='UNMATCHED' and lower(normalized->>'email')=lower(address) limit 100 loop
 perform public.process_payment_event(item.normalized);count_items:=count_items+1;
 end loop;
 return count_items;
end $$;
revoke all on function public.claim_pending_payments() from public,anon;
grant execute on function public.claim_pending_payments() to authenticated;
commit;
