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
