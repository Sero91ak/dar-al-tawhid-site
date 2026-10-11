-- DĀR AL TAWḤĪD KIDS: stage-only verified parent registration.
-- DO NOT APPLY BEFORE SMTP, end-to-end tests and the legacy RPC cutover.
-- Additive: creates a service-role-only registration RPC and a nullable proof binding.
-- The existing kids_register / kids_login / kids_save remain UNMODIFIED here.
begin;

alter table public.kids_parent_contacts
  add column if not exists auth_user_id uuid;

create index if not exists kids_parent_contacts_auth_user_idx
  on public.kids_parent_contacts (auth_user_id)
  where auth_user_id is not null;

create or replace function public.kids_register_verified_parent(
  p_auth_user_id uuid,
  p_parent_email text,
  p_name text,
  p_hash text,
  p_gender text,
  p_age text,
  p_data jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  k text := lower(btrim(coalesce(p_name,'')));
  e text := lower(btrim(coalesce(p_parent_email,'')));
  count_recent int;
begin
  if p_auth_user_id is null or length(k) < 2 or length(k) > 24
    or char_length(btrim(coalesce(p_name,''))) > 24
    or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
    or length(e) > 254
    or coalesce(p_hash,'') !~ '^[a-f0-9]{64}$'
    or coalesce(p_gender,'') not in ('boy','girl')
    or coalesce(p_age,'') not in ('4–5','6–8','9–10')
    or octet_length(coalesce(p_data,'{}'::jsonb)::text) > 65536
  then
    return jsonb_build_object('ok',false,'error','Registrierung konnte nicht abgeschlossen werden.');
  end if;

  -- Do not rely on request-supplied email, user ID or a client-side "verified" flag.
  -- Supabase Auth, as source of truth, must confirm this exact email and user.
  if not exists (
    select 1 from auth.users u
    where u.id = p_auth_user_id
      and lower(u.email) = e
      and u.email_confirmed_at is not null
      and u.deleted_at is null
  ) then
    return jsonb_build_object('ok',false,'error','Eltern-E-Mail nicht bestätigt.');
  end if;

  -- Serialize attempts for the same child name to avoid two concurrent creates.
  perform pg_advisory_xact_lock(hashtext(k));
  if exists (select 1 from public.kids_accounts a where a.name_key = k) then
    return jsonb_build_object('ok',false,'error','Registrierung konnte nicht abgeschlossen werden.');
  end if;
  select count(*) into count_recent
    from public.kids_parent_contacts c
    where c.auth_user_id = p_auth_user_id
      and c.enrolled_at > now() - interval '1 hour';
  if count_recent >= 5 then
    return jsonb_build_object('ok',false,'error','Zu viele neue Konten. Bitte später erneut versuchen.');
  end if;

  -- All-or-nothing transaction: either BOTH records exist, or NEITHER.
  insert into public.kids_accounts
      (name_key,display_name,pass_hash,gender,age,progress)
    values (k,btrim(p_name),p_hash,p_gender,p_age,coalesce(p_data,'{}'::jsonb));
  insert into public.kids_parent_contacts
      (account_name_key,parent_email,verified_at,proof_method,auth_user_id)
    values (k,e,now(),'authenticated_account',p_auth_user_id);
  return jsonb_build_object('ok',true,'verified',true);
exception
  when unique_violation or check_violation or foreign_key_violation then
    return jsonb_build_object('ok',false,'error','Registrierung konnte nicht abgeschlossen werden.');
end;
$func$;

-- SECURITY DEFINER may expose data if callable by anonymous users. Service-role only.
revoke all on function public.kids_register_verified_parent(
  uuid,text,text,text,text,text,jsonb
) from public,anon,authenticated;
grant execute on function public.kids_register_verified_parent(
  uuid,text,text,text,text,text,jsonb
) to service_role;

commit;
