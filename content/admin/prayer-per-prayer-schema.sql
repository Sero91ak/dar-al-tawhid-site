-- DAR AL TAWḤID – Supabase Erweiterung für Einzel-Gebets-Push
-- Tabelle: prayer_push_registrations (bestehend)
-- Einmal im Supabase SQL Editor ausführen.

ALTER TABLE prayer_push_registrations
  ADD COLUMN IF NOT EXISTS prayer_fajr_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS prayer_dhuhr_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS prayer_asr_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS prayer_maghrib_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS prayer_isha_enabled boolean DEFAULT true;
