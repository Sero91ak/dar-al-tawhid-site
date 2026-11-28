# E-Mail-Versand für Anmelde-Codes · Einrichtung durch Serhat

Stand: 28.11.2026 · Absender `noreply@dar-al-tawhid.de` · Antworten an `dar.al.tauhid91@gmail.com`

**Ausgangslage (geprüft per DNS):** `dar-al-tawhid.de` liegt bei Cloudflare (Nameserver `cory`/`hazel`), hat **keine** MX-, SPF-, DKIM- oder DMARC-Einträge. Supabase-Auth-Mails gehen heute nur über den eingebauten Testversand (laut Supabase-Doku nur an Teammitglieder, ca. 2 Mails/Stunde). Für echte Eltern-Codes braucht es einen eigenen SMTP-Dienst.

**Geheimnisse:** API-Schlüssel gibst du nur selbst im jeweiligen Dashboard ein. Nichts davon in Chat, GitHub oder Dateien.

## Empfehlung: Resend
- Cloudflare Email Service ist laut Cloudflare-Doku noch **Beta**; SMTP-Versand dort seit 08.06.2026 (Beta). Auf dem Free-Plan sendet er nur an verifizierte eigene Adressen, an beliebige Eltern erst mit **Workers Paid**. Deshalb als Start nicht empfohlen.
- Resend: normaler SMTP-Dienst, funktioniert mit Supabase laut Resend- und Supabase-Doku, kostenloser Tarif für den Start (aktuelle Grenzen im Dashboard prüfen).

## Schritt 1 · Resend-Konto und Domain
1. https://resend.com → Konto anlegen (mit einer Adresse, die nur du kontrollierst; 2FA aktivieren).
2. **Domains → Add Domain** → `dar-al-tawhid.de`, Region **EU (Irland)** wählen.
3. Resend zeigt DNS-Einträge (DKIM-TXT `resend._domainkey`, SPF-TXT und MX auf der Subdomain `send`). **Genau diese Werte** aus dem Dashboard übernehmen, nicht abtippen.

## Schritt 2 · Cloudflare DNS (dash.cloudflare.com → dar-al-tawhid.de → DNS)
1. Die von Resend angezeigten Einträge anlegen. Bei Cloudflare **Proxy aus** (graue Wolke, „Nur DNS“).
   - TXT `resend._domainkey` → DKIM-Wert aus Resend
   - MX `send` → Wert aus Resend (Priorität 10)
   - TXT `send` → SPF `v=spf1 include:amazonses.com ~all` (wie von Resend angezeigt)
2. **DMARC** zusätzlich anlegen: TXT `_dmarc` mit
   `v=DMARC1; p=none; rua=mailto:dar.al.tauhid91@gmail.com; adkim=s; aspf=s`
   Nach 2–4 Wochen ohne Auffälligkeiten auf `p=quarantine` erhöhen.
3. In Resend **Verify DNS Records** klicken, bis alle Einträge „Verified“ zeigen.

## Schritt 3 · Antworten in dein Gmail bekommen
Supabase hat im Dashboard **kein Reply-To-Feld**. Zwei Wege:
- **A (einfach, empfohlen):** Cloudflare → *Email → Email Routing* aktivieren, Adresse `noreply@dar-al-tawhid.de` auf `dar.al.tauhid91@gmail.com` weiterleiten (Zieladresse per Bestätigungsmail verifizieren). Cloudflare ergänzt dafür MX/SPF am Hauptdomainnamen; das beißt sich nicht mit `send.` von Resend. Antworten auf die Codes landen dann in deinem Gmail.
- **B (genau Reply-To-Header):** Supabase „Send Email Hook“ + kleine Edge Function mit Resend-API (`reply_to`). Mehr Aufwand; nur wenn A nicht reicht.
Zusätzlich steht in der Code-Mail der Satz „Fragen? Schreibe an dar.al.tauhid91@gmail.com“ (Vorlage unten).

## Schritt 4 · Supabase Dashboard (Projekt `djyfkttjbdraynuxrzno`)
Authentication → **Notifications → Email → SMTP Settings** → Custom SMTP aktivieren:
| Feld | Wert |
| --- | --- |
| Sender email | `noreply@dar-al-tawhid.de` |
| Sender name | `DĀR AL TAWḤĪD` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | dein Resend-API-Key (nur dort einfügen; Key mit Berechtigung „Sending access“ und auf die Domain beschränkt anlegen) |

Dann:
1. **Rate Limits:** Emails pro Stunde von 30 auf z. B. 100 erhöhen (Start). OTP je Adresse bleibt bei 60 Sekunden.
2. **Sign In / Providers → Email:** Provider an, **Confirm email** an, **Email OTP Expiration = 900** (15 Minuten), OTP-Länge 6.
3. **URL Configuration → Site URL:** `https://dar-al-tawhid.de` (wird in Mails nicht genutzt, ist aber Pflicht).
4. **Email Templates:** In **Magic Link** und **Confirm signup** (beide, weil neue Adressen die zweite Vorlage nutzen) den Inhalt ersetzen:
   - Betreff: `Dein Code für DĀR AL TAWḤĪD: {{ .Token }}`
   - Text:
     ```
     <p>Assalāmu ʿalaikum,</p>
     <p>dein Anmeldecode lautet:</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:700">{{ .Token }}</p>
     <p>Er gilt 15 Minuten und kann nur einmal verwendet werden. Wenn du ihn nicht angefordert hast, ignoriere diese Mail.</p>
     <p>Fragen? Schreibe an dar.al.tauhid91@gmail.com</p>
     ```
   Keine Links in der Mail (nur Code): das schützt vor Link-Scannern, die Einmal-Links verbrauchen.
5. Optional später: **Auth → Attack Protection → CAPTCHA (Cloudflare Turnstile)** aktivieren; dann muss der Client ein Captcha-Token mitschicken (noch nicht gebaut).

## Schritt 5 · Test (noch vor jeder Freigabe)
1. Mit einer Fremdadresse (z. B. privates Gmail) auf der Staging-Seite `https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/eltern-konto.html` einen Code anfordern.
2. In Gmail unter „Original anzeigen“ prüfen: **SPF: PASS, DKIM: PASS, DMARC: PASS**.
3. Code eingeben, ein Kinderprofil anlegen, Konto löschen. Danach sollte die Adresse kein Konto mehr haben.
4. Danach melde dich bei mir: dann wird die Datenbankmigration (`20261128_parent_accounts.sql`) angewendet.

## Was NICHT im Chat oder Repo stehen darf
Resend-API-Key, Cloudflare-API-Token, Supabase-Service-Role-Key, SMTP-Passwort.
