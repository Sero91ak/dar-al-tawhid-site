-- DAR AL TAWḤID – Supabase Erweiterung für tägliche Pushs
-- Tabelle: prayer_push_registrations (bestehend)
-- Einmal im Supabase SQL Editor ausführen.

ALTER TABLE prayer_push_registrations
  ADD COLUMN IF NOT EXISTS daily_dua_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_recommendation_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_dua_time text NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS daily_recommendation_time text NOT NULL DEFAULT '12:00',
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

ALTER TABLE prayer_push_registrations
  DROP CONSTRAINT IF EXISTS prayer_push_daily_dua_time_format,
  ADD CONSTRAINT prayer_push_daily_dua_time_format
    CHECK (daily_dua_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'),
  DROP CONSTRAINT IF EXISTS prayer_push_daily_recommendation_time_format,
  ADD CONSTRAINT prayer_push_daily_recommendation_time_format
    CHECK (daily_recommendation_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$');
