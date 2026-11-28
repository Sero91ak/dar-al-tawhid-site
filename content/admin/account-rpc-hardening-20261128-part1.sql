-- DĀR AL TAWḤĪD · Konto-Härtung Teil 1 (additiv, löscht nichts, ändert keine Zeile)
-- Zweck: Anmeldung, Favoriten, Qurʾān-Lesestand und Zakāt-Berechnungen laufen künftig
-- ausschließlich über SECURITY-DEFINER-RPCs mit serverseitigem Sitzungs-Token und Ratenbegrenzung.
-- Die bestehenden anon-Policies bleiben in Teil 1 unverändert, damit ältere App-Versionen weiterlaufen.
-- Teil 2 (account-rpc-hardening-20261128-part2.sql) sperrt danach die direkten Tabellenzugriffe.
begin;

-- 0. Sicherung der aktuellen Policies und Rechte (nur Metadaten, service_role-only)
create table if not exists public.security_backup_20261128 (
  id bigserial primary key,
  kind text not null,
  taken_at timestamptz not null default now(),
  data jsonb not null
);
alter table public.security_backup_20261128 enable row level security;
revoke all on public.security_backup_20261128 from public, anon, authenticated;
revoke all on sequence public.security_backup_20261128_id_seq from public, anon, authenticated;
grant select, insert on public.security_backup_20261128 to service_role;
grant usage, select on sequence public.security_backup_20261128_id_seq to service_role;

insert into public.security_backup_20261128(kind, data)
select 'policy', to_jsonb(p)
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in ('user_profiles','user_saved_items','user_quran_progress','user_zakat_calculations')
  and not exists (select 1 from public.security_backup_20261128 b where b.kind = 'policy');

insert into public.security_backup_20261128(kind, data)
select 'grant', jsonb_build_object('table', g.table_name, 'grantee', g.grantee, 'privileges', g.privs)
from (
  select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type) privs
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('user_profiles','user_saved_items','user_quran_progress','user_zakat_calculations')
    and grantee in ('anon','authenticated')
  group by table_name, grantee
) g
where not exists (select 1 from public.security_backup_20261128 b where b.kind = 'grant');

-- 1. Sitzungen, Versuchsprotokoll, geheimer Schlüssel (nie über die API erreichbar)
create table if not exists public.acct_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);
create index if not exists acct_sessions_user_idx on public.acct_sessions(user_id);
create index if not exists acct_sessions_expiry_idx on public.acct_sessions(expires_at);

create table if not exists public.acct_auth_attempts (
  id bigserial primary key,
  kind text not null check (kind in ('login','register')),
  subject_hash text not null,
  ip_hash text not null,
  ok boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists acct_attempts_subject_idx on public.acct_auth_attempts(kind, subject_hash, created_at desc);
create index if not exists acct_attempts_ip_idx on public.acct_auth_attempts(kind, ip_hash, created_at desc);

create table if not exists public.acct_private_config (
  key text primary key,
  value text not null
);
insert into public.acct_private_config(key, value)
values ('enum_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

alter table public.acct_sessions enable row level security;
alter table public.acct_auth_attempts enable row level security;
alter table public.acct_private_config enable row level security;
revoke all on public.acct_sessions, public.acct_auth_attempts, public.acct_private_config from public, anon, authenticated;
revoke all on sequence public.acct_auth_attempts_id_seq from public, anon, authenticated;
grant select, insert, update, delete on public.acct_sessions, public.acct_auth_attempts, public.acct_private_config to service_role;
grant usage, select on sequence public.acct_auth_attempts_id_seq to service_role;

-- 2. Interne Helfer (nicht über die API aufrufbar)
create or replace function public.acct_secret()
returns text language sql stable security definer set search_path = ''
as $$ select value from public.acct_private_config where key = 'enum_secret' $$;

create or replace function public.acct_hash(p_kind text, p_value text)
returns text language sql stable security definer set search_path = ''
as $$ select encode(extensions.hmac(coalesce(p_value,''), public.acct_secret() || ':' || p_kind, 'sha256'), 'hex') $$;

create or replace function public.acct_client_key()
returns text language plpgsql stable security definer set search_path = ''
as $$
declare h json; ip text; parts text[];
begin
  begin
    h := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  exception when others then h := '{}'::json;
  end;
  ip := nullif(btrim(coalesce(h->>'cf-connecting-ip','')), '');
  if ip is null then ip := nullif(btrim(coalesce(h->>'x-real-ip','')), ''); end if;
  if ip is null then
    parts := string_to_array(coalesce(h->>'x-forwarded-for',''), ',');
    if array_length(parts, 1) is not null then ip := nullif(btrim(parts[array_length(parts, 1)]), ''); end if;
  end if;
  return public.acct_hash('ip', coalesce(ip, 'unknown'));
end $$;

create or replace function public.acct_session_user(p_token text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare uid uuid;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
  update public.acct_sessions
     set last_used_at = now()
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and expires_at > now()
  returning user_id into uid;
  return uid;
end $$;

-- 3. Öffentliche RPCs
create or replace function public.acct_login_salt(p_username text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare u text := lower(btrim(coalesce(p_username,''))); s text;
begin
  select pin_salt into s from public.user_profiles where username = u;
  if s is null then
    -- gleiche Antwortform für unbekannte Namen: kein Rückschluss auf vorhandene Konten
    s := substr(public.acct_hash('salt', u), 1, 32);
  end if;
  return jsonb_build_object('salt', s);
end $$;

create or replace function public.acct_register(p_username text, p_pin_hash text, p_pin_salt text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  u text := lower(btrim(coalesce(p_username,'')));
  ik text := public.acct_client_key();
  uid uuid; tok text;
begin
  if u !~ '^[a-z0-9._-]{3,24}$' or coalesce(p_pin_hash,'') !~ '^[0-9a-f]{64}$' or coalesce(p_pin_salt,'') !~ '^[0-9a-f]{16,64}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  delete from public.acct_auth_attempts where created_at < now() - interval '2 days';
  if (select count(*) from public.acct_auth_attempts where kind='register' and ip_hash=ik and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from public.acct_auth_attempts where kind='register' and created_at > now() - interval '1 hour') >= 300 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;
  insert into public.acct_auth_attempts(kind, subject_hash, ip_hash, ok)
  values ('register', public.acct_hash('user', u), ik, true);
  begin
    insert into public.user_profiles(username, pin_hash, pin_salt) values (u, p_pin_hash, p_pin_salt) returning id into uid;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end;
  tok := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.acct_sessions(token_hash, user_id) values (encode(extensions.digest(tok, 'sha256'), 'hex'), uid);
  return jsonb_build_object('ok', true, 'id', uid, 'username', u, 'token', tok);
end $$;

create or replace function public.acct_login(p_username text, p_pin_hash text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  u text := lower(btrim(coalesce(p_username,'')));
  sh text := public.acct_hash('user', lower(btrim(coalesce(p_username,''))));
  ik text := public.acct_client_key();
  prof public.user_profiles%rowtype;
  tok text;
begin
  delete from public.acct_auth_attempts where created_at < now() - interval '2 days';
  if (select count(*) from public.acct_auth_attempts where kind='login' and subject_hash=sh and not ok and created_at > now() - interval '15 minutes') >= 8
     or (select count(*) from public.acct_auth_attempts where kind='login' and ip_hash=ik and not ok and created_at > now() - interval '15 minutes') >= 40 then
    return jsonb_build_object('ok', false, 'error', 'locked', 'retry_after_seconds', 900);
  end if;
  select * into prof from public.user_profiles where username = u;
  if found and coalesce(p_pin_hash,'') ~ '^[0-9a-f]{64}$' and prof.pin_hash = p_pin_hash then
    delete from public.acct_auth_attempts where kind='login' and subject_hash=sh and not ok;
    insert into public.acct_auth_attempts(kind, subject_hash, ip_hash, ok) values ('login', sh, ik, true);
    tok := encode(extensions.gen_random_bytes(32), 'hex');
    insert into public.acct_sessions(token_hash, user_id) values (encode(extensions.digest(tok, 'sha256'), 'hex'), prof.id);
    return jsonb_build_object('ok', true, 'id', prof.id, 'username', prof.username, 'token', tok);
  end if;
  insert into public.acct_auth_attempts(kind, subject_hash, ip_hash, ok) values ('login', sh, ik, false);
  return jsonb_build_object('ok', false, 'error', 'invalid');
end $$;

create or replace function public.acct_logout(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  if p_token is not null and p_token ~ '^[0-9a-f]{64}$' then
    delete from public.acct_sessions where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.acct_saved_get(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); items jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  select coalesce(jsonb_agg(item_id order by created_at desc, item_id), '[]'::jsonb) into items
    from public.user_saved_items where user_id = uid and item_type = 'post';
  return jsonb_build_object('ok', true, 'items', items);
end $$;

create or replace function public.acct_saved_replace(p_token text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); ids text[];
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  select coalesce(array_agg(distinct left(v, 200)), '{}') into ids
    from jsonb_array_elements_text(p_items) v where btrim(v) <> '';
  delete from public.user_saved_items where user_id = uid and item_type = 'post' and not (item_id = any(ids));
  insert into public.user_saved_items(user_id, item_type, item_id)
    select uid, 'post', x from unnest(ids) x
    on conflict (user_id, item_type, item_id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.acct_quran_get(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); rows_ jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'progress_type', progress_type, 'surah_number', surah_number, 'surah_name', surah_name,
      'ayah_number', ayah_number, 'juz_number', juz_number, 'translation_id', translation_id,
      'language', language, 'scroll_offset', scroll_offset, 'updated_at', updated_at) order by updated_at desc), '[]'::jsonb)
    into rows_ from public.user_quran_progress where user_id = uid;
  return jsonb_build_object('ok', true, 'rows', rows_);
end $$;

create or replace function public.acct_quran_replace(p_token text, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); types text[];
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_rows) as r(progress_type text, surah_number int, surah_name text,
        ayah_number int, juz_number int, translation_id text, language text, scroll_offset int, updated_at timestamptz)
    where progress_type is null or progress_type not in ('manual','automatic')
       or surah_number is null or surah_number not between 1 and 114
       or ayah_number is null or ayah_number not between 1 and 286
       or coalesce(scroll_offset, 0) < 0 or length(coalesce(surah_name, '')) > 80) then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  select coalesce(array_agg(progress_type), '{}') into types
    from jsonb_to_recordset(p_rows) as r(progress_type text);
  delete from public.user_quran_progress where user_id = uid and not (progress_type = any(types));
  insert into public.user_quran_progress(user_id, progress_type, surah_number, surah_name, ayah_number, juz_number,
      translation_id, language, scroll_offset, updated_at)
    select uid, progress_type, surah_number, coalesce(surah_name, ''), ayah_number, juz_number,
           left(translation_id, 40), left(language, 20), coalesce(scroll_offset, 0), coalesce(updated_at, now())
    from jsonb_to_recordset(p_rows) as r(progress_type text, surah_number int, surah_name text, ayah_number int,
        juz_number int, translation_id text, language text, scroll_offset int, updated_at timestamptz)
  on conflict (user_id, progress_type) do update set
    surah_number = excluded.surah_number, surah_name = excluded.surah_name, ayah_number = excluded.ayah_number,
    juz_number = excluded.juz_number, translation_id = excluded.translation_id, language = excluded.language,
    scroll_offset = excluded.scroll_offset, updated_at = excluded.updated_at;
  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false, 'error', 'invalid');
end $$;

create or replace function public.acct_zakat_list(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); rows_ jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.calculated_at desc), '[]'::jsonb) into rows_ from (
    select id, zakat_year, calculated_at, zakat_due, payment_status
    from public.user_zakat_calculations where user_id = uid order by calculated_at desc limit 20) t;
  return jsonb_build_object('ok', true, 'rows', rows_);
end $$;

create or replace function public.acct_zakat_save(p_token text, p_record jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token); nid uuid;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  if p_record is null or jsonb_typeof(p_record) <> 'object' or length(p_record::text) > 200000 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if (select count(*) from public.user_zakat_calculations where user_id = uid) >= 200 then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;
  insert into public.user_zakat_calculations(user_id, zakat_year, payload, total_wealth, debts_due, zakatable_wealth,
      zakat_due, hawl_next_date, payment_status)
  values (uid, left(coalesce(p_record->>'zakat_year',''), 8), coalesce(p_record->'payload','{}'::jsonb),
      nullif(p_record->>'total_wealth','')::numeric, nullif(p_record->>'debts_due','')::numeric,
      nullif(p_record->>'zakatable_wealth','')::numeric, nullif(p_record->>'zakat_due','')::numeric,
      nullif(p_record->>'hawl_next_date','')::date, 'open')
  returning id into nid;
  return jsonb_build_object('ok', true, 'id', nid);
exception when others then
  return jsonb_build_object('ok', false, 'error', 'invalid');
end $$;

create or replace function public.acct_zakat_delete(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token);
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  delete from public.user_zakat_calculations where id = p_id and user_id = uid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.acct_delete_account(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid := public.acct_session_user(p_token);
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'session'); end if;
  delete from public.user_profiles where id = uid;  -- Fremdschlüssel löschen Sitzungen, Favoriten, Lesestand, Zakāt mit
  return jsonb_build_object('ok', true);
end $$;

-- 4. Rechte: interne Helfer sperren, öffentliche RPCs freigeben
revoke all on function public.acct_secret() from public, anon, authenticated;
revoke all on function public.acct_hash(text, text) from public, anon, authenticated;
revoke all on function public.acct_client_key() from public, anon, authenticated;
revoke all on function public.acct_session_user(text) from public, anon, authenticated;

revoke all on function public.acct_login_salt(text) from public;
revoke all on function public.acct_register(text, text, text) from public;
revoke all on function public.acct_login(text, text) from public;
revoke all on function public.acct_logout(text) from public;
revoke all on function public.acct_saved_get(text) from public;
revoke all on function public.acct_saved_replace(text, jsonb) from public;
revoke all on function public.acct_quran_get(text) from public;
revoke all on function public.acct_quran_replace(text, jsonb) from public;
revoke all on function public.acct_zakat_list(text) from public;
revoke all on function public.acct_zakat_save(text, jsonb) from public;
revoke all on function public.acct_zakat_delete(text, uuid) from public;
revoke all on function public.acct_delete_account(text) from public;
grant execute on function
  public.acct_login_salt(text), public.acct_register(text, text, text), public.acct_login(text, text),
  public.acct_logout(text), public.acct_saved_get(text), public.acct_saved_replace(text, jsonb),
  public.acct_quran_get(text), public.acct_quran_replace(text, jsonb), public.acct_zakat_list(text),
  public.acct_zakat_save(text, jsonb), public.acct_zakat_delete(text, uuid), public.acct_delete_account(text)
to anon, authenticated;

commit;
