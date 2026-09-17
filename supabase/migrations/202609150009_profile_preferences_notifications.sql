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