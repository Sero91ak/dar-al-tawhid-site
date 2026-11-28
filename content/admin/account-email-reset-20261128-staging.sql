-- DĀR AL TAWḤĪD · Haupt-App: optionale E-Mail für PIN-Zurücksetzen (STAGING, noch nicht angewendet)
-- Prinzip: Die E-Mail-Adresse wird über Supabase Auth (E-Mail-Einmalcode) BEWIESEN. Der Server speichert
-- nur die Verknüpfung Profil <-> Auth-Benutzer. Zurücksetzen geht nur mit gültigem Auth-JWT UND passender Verknüpfung.
-- Antworten sind neutral: kein Rückschluss, ob ein Benutzername oder eine E-Mail existiert.
-- Voraussetzung: content/admin/account-rpc-hardening-20261128-part1.sql ist angewendet.
begin;

create table if not exists public.acct_email_links (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (char_length(email) between 5 and 254 and email = lower(btrim(email))),
  verified_at timestamptz not null default now()
);
create index if not exists acct_email_links_auth_idx on public.acct_email_links(auth_user_id);
alter table public.acct_email_links enable row level security;
revoke all on public.acct_email_links from public, anon, authenticated;
grant select, insert, update, delete on public.acct_email_links to service_role;

alter table public.acct_auth_attempts drop constraint if exists acct_auth_attempts_kind_check;
alter table public.acct_auth_attempts add constraint acct_auth_attempts_kind_check
  check (kind in ('login','register','email_link','pin_reset'));

-- Auth-Benutzer ohne weitere Verwendung nach Kontolöschung mit entfernen (Datensparsamkeit)
create or replace function public.acct_email_link_cleanup()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare used boolean := false;
begin
  if exists (select 1 from public.acct_email_links where auth_user_id = old.auth_user_id) then return old; end if;
  if to_regclass('public.kids_children') is not null then
    execute 'select exists(select 1 from public.kids_children where parent_id = $1)' into used using old.auth_user_id;
    if used then return old; end if;
  end if;
  delete from auth.users where id = old.auth_user_id;
  return old;
end $$;
drop trigger if exists acct_email_link_cleanup_trg on public.acct_email_links;
create trigger acct_email_link_cleanup_trg after delete on public.acct_email_links
  for each row execute function public.acct_email_link_cleanup();
revoke all on function public.acct_email_link_cleanup() from public, anon, authenticated;

create or replace function public.acct_email_status(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); e text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  select email into e from public.acct_email_links where user_id = uid;
  if e is null then return jsonb_build_object('ok', true, 'linked', false); end if;
  return jsonb_build_object('ok', true, 'linked', true,
    'email_masked', left(split_part(e,'@',1),1) || '***@' || split_part(e,'@',2));
end $$;

-- Verknüpft die per Einmalcode bestätigte E-Mail (Auth-JWT im Authorization-Header) mit dem eingeloggten Profil.
create or replace function public.acct_email_link(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := public.acct_session_user(p_token);
  aid uuid := auth.uid();
  em text := lower(btrim(coalesce(auth.jwt() ->> 'email','')));
  ik text := public.acct_client_key();
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  if aid is null or em = '' then return jsonb_build_object('ok', false, 'error', 'email_unverified'); end if;
  if (select count(*) from public.acct_auth_attempts where kind='email_link' and ip_hash=ik and created_at > now() - interval '1 hour') >= 20 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;
  insert into public.acct_auth_attempts(kind, subject_hash, ip_hash, ok) values ('email_link', public.acct_hash('mail', em), ik, true);
  if (select count(*) from public.acct_email_links where auth_user_id = aid and user_id <> uid) >= 5 then
    return jsonb_build_object('ok', false, 'error', 'too_many_profiles');
  end if;
  insert into public.acct_email_links(user_id, auth_user_id, email) values (uid, aid, em)
  on conflict (user_id) do update set auth_user_id = excluded.auth_user_id, email = excluded.email, verified_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.acct_email_unlink(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token);
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  delete from public.acct_email_links where user_id = uid;
  return jsonb_build_object('ok', true);
end $$;

-- PIN zurücksetzen: Auth-JWT der bestätigten E-Mail + Benutzername. Neuer PIN-Hash/Salt kommen vom Client
-- (gleiches Verfahren wie bei der Registrierung). Jede Ablehnung antwortet identisch.
create or replace function public.acct_pin_reset_by_email(p_username text, p_pin_hash text, p_pin_salt text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  u text := lower(btrim(coalesce(p_username,'')));
  aid uuid := auth.uid();
  ik text := public.acct_client_key();
  sh text := public.acct_hash('reset', u);
  pid uuid;
begin
  if aid is null or u !~ '^[a-z0-9._-]{3,24}$' or coalesce(p_pin_hash,'') !~ '^[0-9a-f]{64}$' or coalesce(p_pin_salt,'') !~ '^[0-9a-f]{16,64}$' then
    return jsonb_build_object('ok', false, 'error', 'failed');
  end if;
  if (select count(*) from public.acct_auth_attempts where kind='pin_reset' and not ok and (ip_hash=ik or subject_hash=sh) and created_at > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('ok', false, 'error', 'failed');
  end if;
  select p.id into pid
    from public.user_profiles p join public.acct_email_links l on l.user_id = p.id
   where p.username = u and l.auth_user_id = aid;
  if pid is null then
    insert into public.acct_auth_attempts(kind, subject_hash, ip_hash, ok) values ('pin_reset', sh, ik, false);
    return jsonb_build_object('ok', false, 'error', 'failed');
  end if;
  update public.user_profiles set pin_hash = p_pin_hash, pin_salt = p_pin_salt where id = pid;
  delete from public.acct_sessions where user_id = pid;
  delete from public.acct_auth_attempts where kind = 'login' and subject_hash = public.acct_hash('user', u);
  insert into public.acct_auth_attempts(kind, subject_hash, ip_hash, ok) values ('pin_reset', sh, ik, true);
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.acct_email_status(text), public.acct_email_unlink(text) from public;
revoke all on function public.acct_email_link(text) from public, anon;
revoke all on function public.acct_pin_reset_by_email(text, text, text) from public, anon;
grant execute on function public.acct_email_status(text), public.acct_email_unlink(text) to anon, authenticated;
grant execute on function public.acct_email_link(text) to authenticated;
grant execute on function public.acct_pin_reset_by_email(text, text, text) to authenticated;

commit;
