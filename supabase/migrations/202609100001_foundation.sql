-- MAYORDOMO: apply to a fresh Supabase project using migrations.
begin;
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
commit;
