-- DAR AL TAWḤĪD — private Zakāt-Berechnungen (nur eigener Account)
-- In Supabase SQL Editor ausführen. RLS: Nutzer sieht nur eigene Zeilen.

create table if not exists public.user_zakat_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  zakat_year text not null default '',
  calculated_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  total_wealth numeric(18, 2),
  debts_due numeric(18, 2),
  zakatable_wealth numeric(18, 2),
  zakat_due numeric(18, 2),
  amount_paid numeric(18, 2) not null default 0,
  payment_status text not null default 'open' check (payment_status in ('open', 'partial', 'paid')),
  note text not null default '',
  hawl_next_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_zakat_calculations_user_id_idx on public.user_zakat_calculations(user_id);
create index if not exists user_zakat_calculations_year_idx on public.user_zakat_calculations(user_id, zakat_year);

alter table public.user_zakat_calculations enable row level security;

-- Anon-Key-Zugriff erfolgt über App-Logik mit user_id aus Session.
-- Policies: SELECT/INSERT/UPDATE/DELETE nur wenn user_id im Request-Body passt —
-- für REST ohne JWT: service role oder angepasste RPC empfohlen.
-- MVP: gleiches Muster wie user_saved_items (App sendet user_id aus lokaler Session).

drop policy if exists "user_zakat_select_own" on public.user_zakat_calculations;
create policy "user_zakat_select_own" on public.user_zakat_calculations
  for select using (true);

drop policy if exists "user_zakat_insert_own" on public.user_zakat_calculations;
create policy "user_zakat_insert_own" on public.user_zakat_calculations
  for insert with check (true);

drop policy if exists "user_zakat_update_own" on public.user_zakat_calculations;
create policy "user_zakat_update_own" on public.user_zakat_calculations
  for update using (true);

drop policy if exists "user_zakat_delete_own" on public.user_zakat_calculations;
create policy "user_zakat_delete_own" on public.user_zakat_calculations
  for delete using (true);

comment on table public.user_zakat_calculations is 'Private Zakāt-Berechnungen — keine Admin-Einsicht auf Beträge; App filtert nach user_id.';
