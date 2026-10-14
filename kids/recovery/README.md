# DĀR AL TAWḤĪD KIDS · verpflichtende Eltern-E-Mail

**Stand: 12.10.2026 · Nur Entwicklungszweig / Draft-PR #1057. NICHT produktiv.**

## Produktentscheidung und Kompatibilität

- Jedes **NEUE** Kinderkonto erfordert eine bestätigte **Eltern-E-Mail-Adresse**.
- Bestehende Kinderkonten, Passwörter, Profile und Lernfortschritte bleiben unverändert. Keine nachträgliche Zwangsregistrierung, keine Kontoübernahme allein aufgrund einer E-Mail.
- Gastmodus ohne registriertes Konto bleibt möglich.
- Nur ein Server, der einen von Supabase Auth **verifizierten Eltern-Token** prüft, darf anschließend ein neues Kinderkonto erstellen.
- Die Erklärung „Ich bin erziehungsberechtigt“ ist eine bewusste Bestätigung der anlegenden Person, aber **kein unabhängig überprüfter rechtlicher Nachweis der Elternschaft**.

## Bereits im isolierten Entwicklungszweig geschrieben

1. `kids/index.html`, `kids/start.html`, `kids/shell.html`: Neues Pflichtfeld für die Eltern-E-Mail, Zustimmungsfeld und sechsstellige Einmalcode-Eingabe. Der neue Erstellungsweg nutzt `POST /auth/v1/otp` und `POST /auth/v1/verify` (Supabase Auth), danach ausschließlich die Edge Function `kids-parent-register`. Der alte öffentliche `kids_register`-Aufruf ist aus diesem Frontend-Erstellungspfad **entfernt**.
2. `kids/recovery/edge/kids-parent-register/index.ts`: **NOCH NICHT DEPLOYTER** JWT-geschützter Backend-Endpunkt. Liest E-Mail und Verifizierungsstatus aus Supabase Auth, nicht aus unbestätigten Browserangaben, und ruft ausschließlich eine Service-Role-RPC auf.
3. `kids/recovery/db/20261012_parent_auth_registration_stage.sql`: **NOCH NICHT ANGEWENDETES** Schema für atomare Kontoerstellung und bestätigte Elternbindung. Verweigert direkte Nutzung durch `anon`/`authenticated`. Begrenzung auf fünf neue Kinderkonten je bestätigter Auth-Identität und Stunde.
4. `kids/recovery/db/20261012_legacy_register_release_gate_REVIEW.sql`: **NOCH NICHT ANGEWENDETE** Umstellung der bisherigen `kids_register`-RPC, damit alte Clients keine neuen Kinderkonten ohne Elternprüfung anlegen können. Bestehende Nutzer können sich weiterhin mit `kids_login` anmelden und per `kids_save` ihre Fortschritte speichern.
5. `kids/recovery/tests/parent-registration.test.cjs` und `scripts/test-kids-account-registration-v1.js`: Statische Schutzinvarianten, simulierte OTP-/Backend-Fehler und Erfolg nur nach nachgewiesenem Serverergebnis.
6. Bereits früher in der **Produktionsdatenbank** vorhandene vier Service-Role-only-Kontohilfe-Tabellen bleiben bestehen. Dieses Feature verändert derzeit keine Produktionsdatenbank.

## Kostenschutz – SMTP erst nach ausdrücklicher Prüfung

**Supabase Auths eingebauter SMTP-Dienst verschickt auf dem Free-Tier KEINE E-Mails an beliebige Eltern-Adressen** (nur zuvor autorisierte Team-Adressen). Deshalb ist eine neue Freischaltung nicht möglich, bevor eigener SMTP-Versand funktioniert. Die ChatGPT-Verbindung `DĀR AL TAWḤĪD SUPPORT` ist **keine SMTP-Konfiguration**.

### Option A: Vorhandenes Support-Gmail, ggf. 0 € Zusatzkosten

Wenn das Support-Google-Konto **2-Faktor-Authentifizierung** und **App-Passwörter** erlaubt, kann der Betreiber im eigenen Browser direkt in Supabase Auth `Authentication → Email/SMTP` den bestehenden Gmail-SMTP-Dienst konfigurieren:

- Host: `smtp.gmail.com`
- Port: `465` (TLS) oder `587` (STARTTLS), mit kompatibler Supabase-Konfiguration
- Benutzer/Absender: `dar.al.tauhid91@gmail.com`
- SMTP-Passwort: **neu erstelltes Google-App-Passwort**, nicht das Google-Kontopasswort
- Anzeigename: `DĀR AL TAWḤĪD KIDS Support`

**Kein SMTP-Passwort, API-Schlüssel, sechsstelligen Elterncode oder Google-2FA-Code im Chat, in GitHub, im Browser-Screenshot oder im KIDS-Frontend veröffentlichen.** Der Betreiber muss dies ausschließlich in der geschützten Google-/Supabase-Oberfläche selbst eingeben. Ein App-Passwort hat weitreichende Rechte für das Postfach und ist widerrufbar; nur erstellen, wenn Gmail SMTP wirklich gewählt wird. Ist das Konto (z. B. per Altersbeschränkung oder Sicherheitsrichtlinie) nicht berechtigt, **nicht versuchen, die Kontosperre zu umgehen**.

Gmail hat Versandlimits; externe Zustellung ist nicht garantiert. Vor öffentlicher Nutzung müssen Zustellbarkeit, Abuse-Schutz und die rechtliche Eignung für transaktionale Mails getestet werden. Ein Free-Tier-Versanddienst (z. B. mit eigenem kostenlosem Tarif) ist nur eine Alternative nach gesonderter Genehmigung, **kein automatischer Vertragsabschluss**.

### Zusätzliche Auth-Konfiguration

- Supabase Auth E-Mail-Anmeldung aktivieren und E-Mail-Bestätigung **nicht abschalten**.
- Für diese UI einen **sechsstelligen OTP** konfigurieren: `Authentication → Email Templates → Magic Link` mit dem sicheren E-Mail-Template-Token `{{ .Token }}`, nicht nur dem Magic Link; Vorlagenänderung mit eigenem SMTP auf Free-Tier zulässig. Die sechs Stellen entsprechen Supabase Auths Standard-E-Mail-OTP.
- OTP-Ablauf und Ratenbegrenzungen auf sichere Werte konfigurieren, Spam-/CAPTCHA-Schutz vor öffentlicher Freigabe testen. Nicht allein auf den Client-Button als Rate-Limit vertrauen.
- Erst mit einer kontrollierten, berechtigten Testadresse den vollständigen Ablauf prüfen. Alte Kinderkonten als Negativ-Test verifizieren: keine E-Mail ohne Rechte anbinden und keinen Lernfortschritt überschreiben.

## Unverzichtbare Freigabe-Reihenfolge

1. Kein Kauf, kein kostenpflichtiger Tarif, keine DNS-/Website-Änderung ohne Nutzerfreigabe.
2. Offiziellen kostenfreien SMTP-Weg in der geschützten Supabase-Oberfläche einrichten und den tatsächlichen Versand an eine Testadresse prüfen.
3. Den neuen, ausschließlich mit Service-Role ausführbaren Registrierungs-RPC als Migration bereitstellen.
4. Authentifizierte KIDS-Edge-Function mit JWT-Prüfung und kontrollierten CORS-Ursprüngen bereitstellen. Service-Role-Key verbleibt auf dem Server, nie in GitHub oder Client-Code.
5. **Vor dem Besucher-Rollout** die alte öffentliche Neuanlage über `kids_register` serverseitig blockieren. `kids_login`, `kids_save` und existierende Lernstände nicht beschädigen.
6. Automatische Regressionstests und reale Negativtests: fehlende Elternadresse, keine Zustimmung, falscher/abgelaufener Code, Spam, erneute Versuche, gelöschte/gesperrte Konten, gleicher Kindername, sichere alte Konten, iPhone-WKWebView.
7. Neue UI **zuerst in KIDS TEST** (nicht in Erwachsenen-App oder normaler Website) testen. Erst nach visueller und funktionaler Freigabe des Nutzers Besucher-Release.

## Offene Weiterentwicklung

- Sichere Wiederherstellung bestehender Kinderkonten mit bereits bestätigter Eltern-E-Mail, Einmalbestätigung und getrennter Autorisierung; bei alten Konten ohne Elternkontakt kein automatischer Reset.
- Eigenständiger, serverseitig geschützter Admin-Review-Bereich. Die alte browserseitige Admin-PIN ist dafür ungeeignet.
- Verbindung Gmail-Kennzeichnungen ↔ Datenbanktickets ist nicht implementiert. Kein Mail-Trigger von Google Apps Script aktiv; ChatGPT-Zentralüberwachung ist nur eine zeitgesteuerte Prüfung, kein dauerhaft laufender Gmail-E-Mail-Server.

**Aktuell:** Keine echte Eltern-Code-Zustellung, keine produktive Datenbankänderung, kein neues Live-KIDS-Registrierungsverhalten und keine neuen Kosten. Der Draft-PR darf nicht gemergt werden, bis alle Release-Gates erfüllt sind.
