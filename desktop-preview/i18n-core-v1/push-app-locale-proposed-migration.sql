-- DĀR AL TAWḤĪD · PROPOSED ONLY, NOT APPLIED
-- Push language per OneSignal *subscription*, not OneSignal user and not OS language.
-- Important: public.prayer_push_registrations currently allows anon SELECT/UPDATE/INSERT.
-- Do not add app_locale to that publicly exposed table without security remediation.
-- This new isolated table MUST only be read/written by the trusted server.
-- Stage in a reviewed migration AFTER resolving push-secret / authentication requirements.

BEGIN;

CREATE TABLE IF NOT EXISTS public.dar_push_subscription_locales (
  onesignal_app_id uuid NOT NULL,
  subscription_id text NOT NULL,
  app_locale text NOT NULL,
  selection_source text NOT NULL DEFAULT 'explicit_app_setting'
    CHECK (selection_source = 'explicit_app_setting'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (onesignal_app_id, subscription_id),
  CONSTRAINT locale_format_check CHECK (
    length(app_locale) BETWEEN 2 AND 32
    AND app_locale ~ '^[a-z]{2,3}(-[a-z0-9]{2,8})*$'
  ),
  CONSTRAINT nonempty_subscription_check CHECK (
    length(trim(subscription_id)) BETWEEN 8 AND 255
  )
);

ALTER TABLE public.dar_push_subscription_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dar_push_subscription_locales FORCE ROW LEVEL SECURITY;

-- No anon/authenticated access to mappings. Even if future defaults grant it,
-- RLS contains no matching policy for client roles.
REVOKE ALL PRIVILEGES ON TABLE public.dar_push_subscription_locales FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.dar_push_subscription_locales FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.dar_push_subscription_locales FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dar_push_subscription_locales TO service_role;

-- No anonymous policies: only the trusted backend with separate server secret
-- may validate ownership, app installation, consent, and set this preference.
-- Clients NEVER receive the Supabase service role key or direct write access.

COMMIT;

-- Post-migration gate: confirm privilege and RLS status. No user rows returned.
-- select rolname,
--   has_table_privilege(rolname,'public.dar_push_subscription_locales','SELECT') can_read,
--   has_table_privilege(rolname,'public.dar_push_subscription_locales','INSERT') can_insert,
--   has_table_privilege(rolname,'public.dar_push_subscription_locales','UPDATE') can_update
-- from pg_roles where rolname in ('anon','authenticated','service_role');
-- select relrowsecurity,relforcerowsecurity from pg_class
--  where oid='public.dar_push_subscription_locales'::regclass;
--
-- ROLLBACK (only after switching the sender off and proving nobody depends on it):
-- drop table if exists public.dar_push_subscription_locales;
