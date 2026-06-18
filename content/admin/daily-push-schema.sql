-- DAR AL TAWḤID – Supabase Erweiterung für tägliche Pushs
-- Tabelle: prayer_push_registrations (bestehend)
-- Einmal im Supabase SQL Editor ausführen.

ALTER TABLE prayer_push_registrations
  ADD COLUMN IF NOT EXISTS daily_dua_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_recommendation_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_opted_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_dua_push_date text,
  ADD COLUMN IF NOT EXISTS last_recommendation_push_date text,
  ADD COLUMN IF NOT EXISTS last_dua_content_id text,
  ADD COLUMN IF NOT EXISTS last_recommendation_content_id text,
  ADD COLUMN IF NOT EXISTS daily_push_error text;

CREATE INDEX IF NOT EXISTS idx_ppr_daily_dua
  ON prayer_push_registrations (daily_dua_enabled)
  WHERE daily_dua_enabled = true AND subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ppr_daily_rec
  ON prayer_push_registrations (daily_recommendation_enabled)
  WHERE daily_recommendation_enabled = true AND subscription_id IS NOT NULL;
