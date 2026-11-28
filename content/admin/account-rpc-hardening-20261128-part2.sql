-- DĀR AL TAWḤĪD · Konto-Härtung Teil 2: direkte Tabellenzugriffe für anon/authenticated sperren.
-- Voraussetzung: Die App nutzt die RPCs aus Teil 1 (index.html, assets/dar-account-visibility.js, assets/zakat-app.js).
-- Es werden KEINE Daten gelöscht oder geändert. Die alten Policies stehen als JSON in public.security_backup_20261128.
-- Rückgängig (nur im Notfall): Policies aus security_backup_20261128 (kind='policy') neu anlegen und
--   grant select, insert, update, delete on <tabelle> to anon, authenticated;
begin;

drop policy if exists "anon can create profiles" on public.user_profiles;
drop policy if exists "anon can read profiles for pin login" on public.user_profiles;
drop policy if exists "anon can manage saved items" on public.user_saved_items;
drop policy if exists "user_quran_progress_select" on public.user_quran_progress;
drop policy if exists "user_quran_progress_insert" on public.user_quran_progress;
drop policy if exists "user_quran_progress_update" on public.user_quran_progress;
drop policy if exists "user_quran_progress_delete" on public.user_quran_progress;
drop policy if exists "user_zakat_select_own" on public.user_zakat_calculations;
drop policy if exists "user_zakat_insert_own" on public.user_zakat_calculations;
drop policy if exists "user_zakat_update_own" on public.user_zakat_calculations;
drop policy if exists "user_zakat_delete_own" on public.user_zakat_calculations;

revoke all on public.user_profiles, public.user_saved_items, public.user_quran_progress,
  public.user_zakat_calculations from public, anon, authenticated;
-- service_role behält seine Rechte (Admin-Worker liest user_profiles(username) für Statistiken).

commit;
