-- CRITICAL RELEASE GATE for mandatory verified parent email.
-- STAGE ONLY. Apply ATOMICALLY with verified-parent backend, not earlier.
-- Replaces legacy public kids_register so old clients CANNOT create children
-- anonymously without a verified parental address. Legacy authenticated
-- accounts and their progress remain accessible via kids_login / kids_save.
begin;

create or replace function public.kids_register(
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
  k text := lower(btrim(coalesce(p_name, '')));
  a public.kids_accounts%rowtype;
begin
  if char_length(k) < 2 or char_length(k) > 24
    or coalesce(p_hash,'') !~ '^[a-f0-9]{64}$'
  then
    return jsonb_build_object('ok',false,'error','Bitte Namen und Passwort prüfen.');
  end if;

  select * into a from public.kids_accounts where name_key = k;
  if found and a.status = 'active' and a.pass_hash = p_hash then
    -- Historical linking feature; never overwrite an existing learning record.
    return jsonb_build_object('ok',true,'linked',true);
  end if;

  -- Generic response, does not reveal whether this name exists.
  return jsonb_build_object('ok',false,
    'error','Neue Konten benötigen eine bestätigte Eltern-E-Mail. Bitte die App aktualisieren.');
end;
$func$;

-- Retain execute privileges for existing clients; the RPC is no longer
-- capable of INSERTing a NEW account under any anonymous request.
-- DO NOT reinstate the former INSERT INTO public.kids_accounts branch.
commit;
