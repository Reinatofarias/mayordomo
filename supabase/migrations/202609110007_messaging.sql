begin;
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

