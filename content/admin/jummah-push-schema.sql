-- DAR AL TAWḤID – Supabase Erweiterung für Jumuʿah-Push (Freitag)
-- Tabelle: prayer_push_registrations (bestehend)
-- Einmal im Supabase SQL Editor ausführen.

ALTER TABLE prayer_push_registrations
  ADD COLUMN IF NOT EXISTS jummah_notifications boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS jummah_use_manual_time boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS jummah_manual_time text DEFAULT '13:30',
  ADD COLUMN IF NOT EXISTS jummah_morning_time text DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS jummah_advance_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_jummah_push_date text,
  ADD COLUMN IF NOT EXISTS jummah_push_error text;

CREATE INDEX IF NOT EXISTS idx_ppr_jummah
  ON prayer_push_registrations (jummah_notifications)
  WHERE jummah_notifications = true AND subscription_id IS NOT NULL;
