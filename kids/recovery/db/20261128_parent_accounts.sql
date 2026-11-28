-- DĀR AL TAWḤĪD KIDS · Elternkonto V1 (STAGING, nicht aktiv in Produktion)
-- Eltern melden sich per E-Mail-Einmalcode über Supabase Auth an (kein Passwort).
-- Kinder sind Profile UNTER dem Elternkonto (kein eigener Login, keine eigene E-Mail).
-- Rein additiv: bestehende Tabellen (kids_accounts, kids_parent_contacts, ...) bleiben unberührt.
begin;

create table if not exists public.kids_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  -- Datensparsamkeit: nur ein frei gewählter Spitzname, kein echter Name, kein Geburtsdatum.
  display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
  avatar text not null default 'star' check (avatar in ('star','moon','book','palm','lantern','heart','leaf','sun')),
  age_band text not null default '7-9' check (age_band in ('4-6','7-9','10-12','13+')),
  progress jsonb not null default '{}'::jsonb check (jsonb_typeof(progress) = 'object' and pg_column_size(progress) <= 16384),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists kids_children_parent_name_uq
  on public.kids_children(parent_id, lower(btrim(display_name)));
create index if not exists kids_children_parent_idx on public.kids_children(parent_id);

-- höchstens 8 Kinderprofile je Elternkonto
create or replace function public.kids_children_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.kids_children where parent_id = new.parent_id) >= 8 then
      raise exception 'child_limit' using errcode = 'P0001';
    end if;
  end if;
  new.display_name := btrim(new.display_name);
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.parent_id := old.parent_id; new.created_at := old.created_at; end if;
  return new;
end $$;
drop trigger if exists kids_children_guard_trg on public.kids_children;
create trigger kids_children_guard_trg before insert or update on public.kids_children
  for each row execute function public.kids_children_guard();

alter table public.kids_children enable row level security;
revoke all on public.kids_children from public, anon, authenticated;
grant select, insert, update, delete on public.kids_children to authenticated;
grant select, insert, update, delete on public.kids_children to service_role;

drop policy if exists kids_children_own_select on public.kids_children;
drop policy if exists kids_children_own_insert on public.kids_children;
drop policy if exists kids_children_own_update on public.kids_children;
drop policy if exists kids_children_own_delete on public.kids_children;
create policy kids_children_own_select on public.kids_children for select to authenticated using (parent_id = (select auth.uid()));
create policy kids_children_own_insert on public.kids_children for insert to authenticated with check (parent_id = (select auth.uid()));
create policy kids_children_own_update on public.kids_children for update to authenticated using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
create policy kids_children_own_delete on public.kids_children for delete to authenticated using (parent_id = (select auth.uid()));

-- Konto in der App vollständig löschen (Pflicht für App-Store-Apps mit Kontoerstellung).
-- Löscht den Auth-Benutzer; Kinderprofile gehen per ON DELETE CASCADE mit.
create or replace function public.kids_delete_my_account()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  delete from auth.users where id = uid;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.kids_delete_my_account() from public, anon;
grant execute on function public.kids_delete_my_account() to authenticated;
revoke all on function public.kids_children_guard() from public, anon, authenticated;

commit;
