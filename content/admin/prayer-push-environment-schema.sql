-- DAR AL TAWḤĪD – eindeutige Trennung von Test- und Live-Push-Installationen
-- Produktion wurde am 22.07.2026 über Supabase Migration aktiviert.

ALTER TABLE public.prayer_push_registrations
  ADD COLUMN IF NOT EXISTS app_environment text NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS app_name text NOT NULL DEFAULT 'DAR AL TAWHID',
  ADD COLUMN IF NOT EXISTS installation_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prayer_push_registrations_app_environment_check'
      AND conrelid = 'public.prayer_push_registrations'::regclass
  ) THEN
    ALTER TABLE public.prayer_push_registrations
      ADD CONSTRAINT prayer_push_registrations_app_environment_check
      CHECK (app_environment IN ('production', 'test'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ppr_live_push_targets
  ON public.prayer_push_registrations (app_environment, enabled, push_opted_in)
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ppr_subscription_id
  ON public.prayer_push_registrations (subscription_id)
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ppr_installation_id
  ON public.prayer_push_registrations (installation_id)
  WHERE installation_id IS NOT NULL;

-- Der produktive Scheduler darf ausschließlich folgende Zeilen verwenden:
-- enabled = true
-- push_opted_in = true
-- app_environment = 'production'
