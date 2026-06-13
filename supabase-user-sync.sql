-- DAR AL TAWḤID: einfacher Favoriten-Sync mit Anmeldename + PIN
-- In Supabase im SQL Editor ausführen, bevor "Mein Bereich" live benutzt wird.
-- Hinweis: Diese Lösung ist für Favoriten-Sync gedacht, nicht für sensible private Daten.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9._-]{3,24}$'),
  pin_hash text not null,
  pin_salt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_saved_items (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  item_type text not null default 'post',
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

alter table public.user_profiles enable row level security;
alter table public.user_saved_items enable row level security;

drop policy if exists "anon can read profiles for pin login" on public.user_profiles;
drop policy if exists "anon can create profiles" on public.user_profiles;
drop policy if exists "anon can manage saved items" on public.user_saved_items;

create policy "anon can read profiles for pin login"
on public.user_profiles
for select
to anon
using (true);

create policy "anon can create profiles"
on public.user_profiles
for insert
to anon
with check (true);

create policy "anon can manage saved items"
on public.user_saved_items
for all
to anon
using (true)
with check (true);
