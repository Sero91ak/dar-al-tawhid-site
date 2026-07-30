-- DAR AL TAWḤĪD — Qurʾān-Lesestand pro Konto (geräteübergreifend)
-- In Supabase SQL Editor ausführen. RLS: gleiches Muster wie user_saved_items.

create table if not exists public.user_quran_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  progress_type text not null check (progress_type in ('manual', 'automatic')),
  surah_number integer not null,
  surah_name text not null default '',
  ayah_number integer not null,
  juz_number integer,
  translation_id text,
  language text,
  scroll_offset integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, progress_type)
);

create index if not exists user_quran_progress_user_id_idx on public.user_quran_progress(user_id);
create index if not exists user_quran_progress_updated_idx on public.user_quran_progress(user_id, updated_at desc);

alter table public.user_quran_progress enable row level security;

drop policy if exists "user_quran_progress_select" on public.user_quran_progress;
create policy "user_quran_progress_select" on public.user_quran_progress for select using (true);

drop policy if exists "user_quran_progress_insert" on public.user_quran_progress;
create policy "user_quran_progress_insert" on public.user_quran_progress for insert with check (true);

drop policy if exists "user_quran_progress_update" on public.user_quran_progress;
create policy "user_quran_progress_update" on public.user_quran_progress for update using (true);

drop policy if exists "user_quran_progress_delete" on public.user_quran_progress;
create policy "user_quran_progress_delete" on public.user_quran_progress for delete using (true);

comment on table public.user_quran_progress is 'Qurʾān-Lesestand pro Konto — App filtert nach user_id aus lokaler Session.';
