# Haupt-App: optionale E-Mail für PIN-Zurücksetzen · STAGING

Stand 28.11.2026. **Nicht angewendet, nicht in `index.html` eingebunden.**

- `content/admin/account-email-reset-20261128-staging.sql`: Tabelle `acct_email_links` (nur service_role), RPCs `acct_email_status`, `acct_email_link`, `acct_email_unlink`, `acct_pin_reset_by_email`. Voraussetzung: Part 1 vom 28.11. (liegt live).
- `assets/dar-account-email-v1.js`: Client (Code anfordern/bestätigen, verknüpfen, PIN zurücksetzen). Test: `node scripts/test-account-email-v1.cjs`.
- Prinzip: Die Adresse wird per Supabase-Auth-Einmalcode bewiesen. Zurücksetzen nur mit gültigem Auth-JWT, das zur verknüpften Adresse des Profils passt. Jede Ablehnung antwortet identisch; 10 Fehlversuche/Stunde je IP oder Benutzername; nach Reset sind alle Sitzungen und Login-Sperren des Profils gelöscht.
- Datenschutz: Beim Löschen des Profils wird ein sonst unbenutzter Auth-Benutzer mit entfernt (Trigger).
- Datenbanktest (28.11.2026, in zurückgerollter Transaktion): Fremde Adresse kann keinen fremden PIN setzen, unbekannter/unverknüpfter Name antwortet gleich, alter PIN ungültig, neuer PIN gültig, alte Sitzung ungültig, anon hat keinen Zugriff.
- Einbau in die UI (später, nur nach SMTP-Einrichtung, siehe `EMAIL-SETUP-SERHAT.md`): Feld „E-Mail (optional)“ im Konto-Bereich und Link „PIN vergessen?“ auf der Anmeldung. Bestehende 23 Altkonten haben keine Adresse; sie können sie nach Anmeldung hinzufügen.
