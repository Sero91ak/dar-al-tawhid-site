# Elternkonto V1 · STAGING (nicht in Produktion aktiv)

**Stand 28.11.2026.** Entscheidungen des Inhabers: Anmeldung der Eltern per E-Mail-Einmalcode (Supabase Auth, kein Passwort); Kinder sind Profile unter dem Elternkonto; Altkonten werden **nicht** migriert (Neustart); nichts Bestehendes wird gelöscht.

## Bausteine
| Datei | Zweck |
| --- | --- |
| `kids/recovery/db/20261128_parent_accounts.sql` | Tabelle `kids_children` (RLS auf `auth.uid()`, max. 8 Kinder, nur Spitzname/Altersgruppe/Symbol), RPC `kids_delete_my_account()` (löscht Auth-Benutzer, Kinder per CASCADE). **Noch nicht angewendet.** |
| `kids/kids-parent-account-v1.js` | Client: Code anfordern (neutral), bestätigen, Kinder verwalten, Konto löschen, Token-Erneuerung. |
| `kids/eltern-konto.html` | Testseite; funktioniert nur auf `*.workers.dev`/localhost (`isEnabledHost`), sonst „noch nicht verfügbar“. |
| `kids/tools/test-kids-parent-account-v1.cjs` | Vertragstest mit simuliertem Supabase. |
| `kids/recovery/EMAIL-SETUP-SERHAT.md` | Schritte für Resend, Cloudflare-DNS, Supabase-SMTP. |

## Sicherheitsmerkmale
- Neutral: die Code-Anforderung antwortet gleich, ob die Adresse neu ist oder schon ein Konto hat; Fehlercodes verraten keine Kontoexistenz.
- Rate Limits: Supabase Auth (60 s je Adresse, IP-Limit, Stundenlimit für Mails) plus 45 s Abkühlzeit im Client; Kinderlimit 8 serverseitig per Trigger.
- RLS: nur eigene Zeilen; `parent_id` ist unveränderlich; `anon` hat keinen Zugriff.
- Löschen in der App: Eingabe „LÖSCHEN“, serverseitig komplett (Auth-Benutzer + Kinder).
- Der App-Store-Vertrag der Kids-Hüllen bleibt: `start.html`, `index.html`, `shell.html` laden das Modul nicht (Test prüft das).

## Noch offen (bewusst)
- SMTP/DNS durch Inhaber (siehe EMAIL-SETUP-SERHAT.md), dann Migration anwenden.
- Kinderfortschritt je Profil (Spalte `progress` ist vorbereitet, aber noch nicht vom Client genutzt).
- Verlinkung aus der Kids-App hinter dem Elterntor und Datenschutzseite um das Elternkonto ergänzen, **bevor** irgendetwas davon in die Store-Version kommt.
- Optional Cloudflare Turnstile gegen Massenanforderungen.
