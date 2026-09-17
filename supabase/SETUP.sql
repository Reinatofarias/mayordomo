-- MAYORDOMO: instalação inicial. Executar uma vez no SQL Editor do Supabase.
-- Não remove dados. Para atualizações, aplicar somente migrations pendentes.
begin;
do $$ begin
  if to_regclass('public.profiles') is not null then
    raise exception 'Schema existente: aplique somente as migrations pendentes.';
  end if;
end $$;
-- Migration: 202609100001_foundation.sql
-- MAYORDOMO: apply to a fresh Supabase project using migrations.

create schema if not exists private;
revoke all on schema private from public;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '', phone text, country text not null default 'MX',
 currency text not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
 locale text not null default 'es-MX', timezone text not null default 'America/Mexico_City',
 monthly_income_minor bigint not null default 0 check(monthly_income_minor >= 0),
 fixed_expenses_minor bigint not null default 0 check(fixed_expenses_minor >= 0),
 opening_debt_minor bigint not null default 0 check(opening_debt_minor >= 0),
 reserve_minor bigint not null default 0 check(reserve_minor >= 0),
 objective text, onboarding_completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.financial_accounts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, currency text not null check(currency ~ '^[A-Z]{3}$'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.bank_connections (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null, external_id text not null, status text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider,external_id)
);
create table public.import_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'UPLOADED' check(status in ('UPLOADED','PARSING','REVIEW_REQUIRED','CONFIRMED','IMPORTED','FAILED')),
 file_name text not null, content_hash text not null, preview jsonb not null default '[]',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
 unique(user_id,content_hash)
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 account_id uuid, category_id uuid not null references public.categories(id),
 import_job_id uuid, merchant text not null default '', description text not null,
 occurred_at date not null, amount_minor bigint not null check(amount_minor > 0),
 currency text not null check(currency ~ '^[A-Z]{3}$'), kind text not null check(kind in ('INCOME','EXPENSE')),
 source text not null check(source in ('MANUAL','WHATSAPP','IMPORT','BANK','RECEIPT')),
 external_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(account_id,user_id) references public.financial_accounts(id,user_id),
 foreign key(import_job_id,user_id) references public.import_jobs(id,user_id),
 unique(user_id,source,external_id)
);
create index transactions_user_date on public.transactions(user_id,occurred_at desc);
create index transactions_category on public.transactions(category_id);
create index transactions_account on public.transactions(account_id);
create table public.budgets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 month date not null check(extract(day from month)=1), amount_minor bigint not null check(amount_minor > 0),
 currency text not null check(currency ~ '^[A-Z]{3}$'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,month,currency), unique(id,user_id)
);
create table public.budget_categories (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 budget_id uuid not null, category_id uuid not null references public.categories(id), amount_minor bigint not null check(amount_minor > 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(budget_id,user_id) references public.budgets(id,user_id), unique(budget_id,category_id)
);
create table public.goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, target_amount_minor bigint not null check(target_amount_minor > 0),
 current_amount_minor bigint not null default 0 check(current_amount_minor >= 0),
 currency text not null check(currency ~ '^[A-Z]{3}$'), target_date date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.debts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, balance_minor bigint not null check(balance_minor >= 0),
 monthly_payment_minor bigint not null check(monthly_payment_minor >= 0),
 currency text not null check(currency ~ '^[A-Z]{3}$'), interest_rate_basis_points integer check(interest_rate_basis_points >= 0),
 due_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.biblical_principles (
 id uuid primary key default gen_random_uuid(), theme text not null unique, reference text not null,
 principle text not null, application text not null, risk_context text not null, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.financial_snapshots (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 data jsonb not null, created_at timestamptz not null default now()
);
create table public.financial_insights (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null, data jsonb not null, created_at timestamptz not null default now()
);
create table public.ai_conversations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'Conversación', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.ai_messages (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 conversation_id uuid not null, role text not null check(role in ('user','assistant')), parts jsonb not null,
 created_at timestamptz not null default now(),
 foreign key(conversation_id,user_id) references public.ai_conversations(id,user_id)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 message text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.activity_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 type text not null, created_at timestamptz not null default now()
);
create table public.consents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in ('TERMS','PRIVACY','AI_FINANCIAL_INFORMATION','BANK_DATA')),
 version text not null, accepted_at timestamptz not null default now(), unique(user_id,type,version)
);
create table public.support_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 subject text not null, message text not null, status text not null default 'OPEN',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null, external_id text not null, plan text not null, status text not null,
 purchased_at timestamptz, renewal_at timestamptz, access_until timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider,external_id)
);
create table public.entitlements (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null, purchase_id text not null, status text not null check(status in ('ACTIVE','REVOKED')),
 access_until timestamptz, event_at timestamptz not null, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(provider,purchase_id)
);
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), provider text not null, external_id text not null,
 type text not null, occurred_at timestamptz not null, status text not null default 'RECEIVED',
 created_at timestamptz not null default now(), unique(provider,external_id)
);
create table private.rate_limits (
 key text primary key, window_at timestamptz not null, count integer not null
);
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
do $$
declare t text;
begin
 foreach t in array array['profiles','categories','financial_accounts','bank_connections','import_jobs','transactions','budgets','budget_categories','goals','debts','biblical_principles','ai_conversations','support_requests','subscriptions','entitlements'] loop
 execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()', t);
 end loop;
 foreach t in array array['financial_accounts','bank_connections','import_jobs','transactions','budgets','budget_categories','goals','debts','financial_snapshots','financial_insights','ai_conversations','ai_messages','notifications','activity_events','consents','support_requests','subscriptions','entitlements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create index on public.%I(user_id)',t);
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
 foreach t in array array['financial_accounts','import_jobs','transactions','budgets','budget_categories','goals','debts','ai_conversations','support_requests'] loop
 execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 end loop;
 foreach t in array array['transactions','budgets','budget_categories','goals','debts'] loop
 execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end $$;
alter table public.profiles enable row level security;
create policy owner_read on public.profiles for select to authenticated using((select auth.uid())=id);
create policy owner_update on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);
alter table public.categories enable row level security;
create policy category_read on public.categories for select to authenticated using(true);
alter table public.biblical_principles enable row level security;
create policy principle_read on public.biblical_principles for select to authenticated using(active);
alter table public.payment_events enable row level security;
-- No client policy permits entitlement, subscription, principle, or payment-event writes.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id);
 insert into public.activity_events(user_id,type) values(new.id,'ACCOUNT_CREATED');
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
create function public.record_activity(event_type text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 if event_type not in ('ONBOARDING_STARTED','REPORT_VIEWED','AI_CONVERSATION_STARTED','SUPPORT_REQUEST_CREATED') then raise exception 'Invalid event'; end if;
 insert into public.activity_events(user_id,type) values(auth.uid(),event_type);
end $$;
revoke all on function public.record_activity(text) from public,anon;
grant execute on function public.record_activity(text) to authenticated;
insert into public.categories(name) values
('Alimentación'),('Supermercado'),('Vivienda'),('Transporte'),('Salud'),('Educación'),('Entretenimiento'),('Compras'),('Servicios'),('Suscripciones'),('Deudas'),('Donaciones'),('Familia'),('Viajes'),('Ingresos'),('Otros');
insert into public.biblical_principles(theme,reference,principle,application,risk_context) values
('sabiduría','Proverbios 4:7','Buscar sabiduría ayuda a tomar decisiones responsables.','Revisa la información antes de decidir.','No garantiza un resultado financiero.'),
('prudencia','Proverbios 22:3','La prudencia reconoce los riesgos.','Identifica compromisos antes de asumir nuevos gastos.','Evita atribuir problemas económicos a falta de fe.'),
('planificación','Lucas 14:28','Antes de construir, conviene calcular el costo.','Compara tus recursos con el costo de tu objetivo.','Paráfrasis contextual; no es una promesa.'),
('deuda','Proverbios 22:7','La deuda puede limitar la libertad de decisión.','Conoce el saldo y las condiciones de tus deudas.','No juzgar a quien necesita crédito.'),
('ahorro','Proverbios 21:20','La sabiduría valora conservar recursos.','Considera una reserva según tus posibilidades.','No exigir ahorro cuando faltan recursos básicos.'),
('generosidad','2 Corintios 9:7','La generosidad debe ser libre y sin presión.','Decide si puedes dar respetando tus necesidades.','Nunca prometer retorno económico por donar.'),
('contentamiento','Hebreos 13:5','El contentamiento invita a revisar el apego al dinero.','Distingue necesidades y deseos sin culpa.','No normalizar la privación.'),
('trabajo','Proverbios 14:23','El trabajo diligente tiene valor.','Reconoce tus esfuerzos y planifica de forma realista.','No culpar a personas desempleadas.'),
('responsabilidad','Lucas 16:10','La fidelidad se practica también en lo pequeño.','Registra movimientos para comprender tus hábitos.','No medir la fe por los resultados.'),
('dominio propio','Gálatas 5:22-23','El dominio propio ayuda a actuar con intención.','Haz una pausa antes de una compra impulsiva.','No usar culpa religiosa.'),
('mayordomía','1 Pedro 4:10','Administrar los recursos puede servir a otros.','Relaciona tus decisiones con tus valores.','No constituye asesoría de inversión.');

-- Migration: 202609100002_onboarding.sql
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

-- Migration: 202609100003_operations.sql
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

-- Migration: 202609100004_imports.sql
create policy ai_consent_insert on public.consents for insert to authenticated with check((select auth.uid())=user_id and type='AI_FINANCIAL_INFORMATION' and version='draft-1');
create function public.confirm_import(job_id uuid) returns integer language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); job public.import_jobs; row_data jsonb; count_rows integer:=0; profile_currency text;
begin
 if uid is null then raise exception 'Unauthorized'; end if;
 if not public.has_product_access() or not public.consume_rate_limit('import') then raise exception 'Access unavailable';end if;
 select * into job from public.import_jobs where id=job_id and user_id=uid for update;
 if not found then raise exception 'Not found'; end if;
 if job.status='IMPORTED' then return 0; end if;
 if job.status<>'REVIEW_REQUIRED' or jsonb_typeof(job.preview->'rows') is distinct from 'array' then raise exception 'Not ready'; end if;
 if jsonb_array_length(job.preview->'rows') not between 1 and 500 then raise exception 'Invalid rows'; end if;
 select currency into profile_currency from public.profiles where id=uid;
 update public.import_jobs set status='CONFIRMED' where id=job_id;
 for row_data in select value from jsonb_array_elements(job.preview->'rows') loop
 if row_data->>'currency'<>profile_currency or length(row_data->>'description') not between 1 and 250 then raise exception 'Invalid row'; end if;
 insert into public.transactions(user_id,category_id,import_job_id,description,merchant,occurred_at,amount_minor,currency,kind,source,external_id)
 values(uid,(row_data->>'category_id')::uuid,job_id,row_data->>'description',coalesce(row_data->>'merchant',''),(row_data->>'occurred_at')::date,(row_data->>'amount_minor')::bigint,row_data->>'currency',row_data->>'kind','IMPORT',job_id::text||':'||count_rows::text);
 count_rows:=count_rows+1;
 end loop;
 update public.import_jobs set status='IMPORTED',preview=preview-'rawRows' where id=job_id;
 insert into public.activity_events(user_id,type) values(uid,'TRANSACTIONS_IMPORTED');
 return count_rows;
end $$;
revoke all on function public.confirm_import(uuid) from public,anon;
grant execute on function public.confirm_import(uuid) to authenticated;

-- Migration: 202609110005_payments.sql
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

-- Migration: 202609110006_security.sql
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
grant update(name,phone,country,currency,locale,timezone) on public.profiles to authenticated;
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

-- Migration: 202609150008_support_chat.sql
alter table public.support_requests add constraint support_requests_id_user_unique unique(id,user_id);
create table public.support_messages (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 sender text not null check(sender in ('user','assistant','admin','system')),
 message text not null check(length(message) between 1 and 3000),
 created_at timestamptz not null default now(),
 foreign key(request_id,user_id) references public.support_requests(id,user_id) on delete cascade
);
alter table public.support_messages enable row level security;
create index on public.support_messages(user_id);
create index support_messages_request_created on public.support_messages(request_id,created_at);
create policy owner_read on public.support_messages for select to authenticated using((select auth.uid())=user_id);
create policy owner_insert on public.support_messages for insert to authenticated with check((select auth.uid())=user_id and sender='user');
grant select,insert on public.support_messages to authenticated;

-- Migration: 202609150009_profile_preferences_notifications.sql
grant update(name,phone,country,currency,locale,timezone) on public.profiles to authenticated;
create table public.notification_dismissals (
 user_id uuid not null references auth.users(id) on delete cascade,
 key text not null check(length(key) between 1 and 120),
 dismissed_at timestamptz not null default now(),
 primary key(user_id,key)
);
alter table public.notification_dismissals enable row level security;
create policy owner_read on public.notification_dismissals for select to authenticated using((select auth.uid())=user_id);
create policy owner_insert on public.notification_dismissals for insert to authenticated with check((select auth.uid())=user_id);
create policy owner_update on public.notification_dismissals for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant select,insert,update on public.notification_dismissals to authenticated;
-- Migration: 202609110007_messaging.sql
create table private.messaging_events (
 id uuid primary key default gen_random_uuid(),provider text not null,external_id text not null,
 status text not null default 'PENDING_LINK',payload jsonb not null,created_at timestamptz not null default now(),
 unique(provider,external_id)
);
create function public.receive_whatsapp_event(event_data jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if event_data->>'externalId' is null or event_data->>'from' is null then raise exception 'Invalid message';end if;
 insert into private.messaging_events(provider,external_id,payload)
 values('whatsapp',event_data->>'externalId',event_data) on conflict(provider,external_id) do nothing;
end $$;
revoke all on function public.receive_whatsapp_event(jsonb) from public,anon,authenticated;
grant execute on function public.receive_whatsapp_event(jsonb) to service_role;
commit;
