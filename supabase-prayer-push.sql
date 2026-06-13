-- DAR AL TAWḤID: stabile Gebetszeiten-Push-Registrierungen
-- Einmal im Supabase SQL Editor ausführen.
-- Danach speichert die App pro Gerät OneSignal-Subscription + Standort,
-- und GitHub Actions plant echte Gebetszeiten-Pushs serverseitig.

create table if not exists public.prayer_push_registrations (
  device_id text primary key,
  subscription_id text not null,
  push_token text,
  enabled boolean not null default true,
  lat double precision not null,
  lon double precision not null,
  city text,
  timezone text not null default 'Europe/Berlin',
  method_angle double precision not null default 12,
  asr_factor double precision not null default 1,
  advance_minutes integer not null default 15 check (advance_minutes in (5, 10, 15)),
  tahajjud_mode text not null default 'off' check (tahajjud_mode in ('off', 'before30', 'before60', 'before90', 'lastThird')),
  user_agent text,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists prayer_push_registrations_enabled_idx
on public.prayer_push_registrations (enabled, timezone, last_synced_at desc);

alter table public.prayer_push_registrations enable row level security;

drop policy if exists "anon can upsert prayer push registrations" on public.prayer_push_registrations;
drop policy if exists "anon can read prayer push registrations for scheduler" on public.prayer_push_registrations;
drop policy if exists "anon can disable own prayer push registration" on public.prayer_push_registrations;

create policy "anon can upsert prayer push registrations"
on public.prayer_push_registrations
for insert
to anon, authenticated
with check (true);

create policy "anon can read prayer push registrations for scheduler"
on public.prayer_push_registrations
for select
to anon, authenticated
using (true);

create policy "anon can disable own prayer push registration"
on public.prayer_push_registrations
for update
to anon, authenticated
using (true)
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.prayer_push_registrations to anon, authenticated;
