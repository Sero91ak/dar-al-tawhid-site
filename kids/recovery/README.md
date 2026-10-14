# DĀR AL TAWḤĪD KIDS · Kontohilfe und Wiederherstellung

**Stand:** 11.10.2026 · **Stufe 1: Sicherheitsfundament / KEIN aktiver Passwort-Reset**

## Support-Kontakt

Offizielles Postfach: `dar.al.tauhid91@gmail.com`.

**Wichtig:** Die derzeit in ChatGPT verbundenen Gmail-Konten sind *andere* Postfächer.
Die Verbindung eines Gmail-Kontos zu ChatGPT ist außerdem **kein dauerhaft
autonomer Gmail-Server-Trigger**. Dieser benötigt eine separat autorisierte
Google-Apps-Script-Installation direkt im Support-Postfach.

## Was jetzt implementiert wird

- SQL-Schema für Service-Role-only Elternkontakte, Wiederherstellungsanfragen,
  Einmal-Code-Digests und lückenlose Sicherheitsereignisse.
- Gmail-Apps-Script für das offizielle Support-Postfach: jede fünf Minuten
  nur passende KIDS-Anfragen suchen; automatisch neutral bestätigen;
  ohne Offenlegung, ob der behauptete Kinder-Anmeldename existiert;
  als **manuell zu prüfen** markieren.
- Technische Tests für das Schema und die Postfach-Automatik.
- Keine Änderung oder Zurücksetzung irgendeines Kinderpassworts, auch
  nicht bei bestehenden Konten ohne verifizierte Eltern-E-Mail.
- Keine ungesicherte Admin-Oberfläche, denn die bisherige browserseitige
  Admin-PIN ist KEIN geeigneter Schutz für diese sensiblen Daten.

## Einmalige Aktivierung der Postfach-Automatik durch den Postfachinhaber

1. Melde dich **direkt als** `dar.al.tauhid91@gmail.com` an.
2. Öffne `https://script.google.com/` und erstelle ein neues privates Apps-Script-Projekt.
3. Übertrage den Inhalt aus `kids/recovery/gmail/DarKidsSupportIntake.gs`
   unverändert in den Script-Editor.
4. Prüfe den Kontonamen. Starte einmal
   `darKidsInstallFiveMinuteIntake` und stimme nur den für Gmail
   und zeitgesteuerte Skripte benötigten Google-Berechtigungen zu.
5. Schreibe von einer **anderen** E-Mail-Adresse eine Testmail mit
   Betreff `DAR AL TAWHID KIDS - Kontohilfe`.
6. Nach etwa fünf Minuten prüfen: Es muss genau **eine** neutrale Antwort
   angekommen sein; im Support-Gmail ist der Thread als
   `DAR KIDS/02 Manuell pruefen` sowie klassifiziert markiert.
7. Wiederhole den Durchlauf: keine zweite Antwort auf denselben Thread.
8. Bei Fehlern den Apps-Script-Trigger deaktivieren. Bei zukünftiger
   Weiterentwicklung nur nach Codeprüfung neu aktivieren.

Es werden **keine** Kontozugangsdaten, E-Mail-Passwörter, API-Schlüssel oder
persönlichen Kinderinformationen im GitHub-Repository gespeichert.

## Nächste Stufe (durch fehlende Anbindung noch blockiert)

1. **Eltern-E-Mail verifizieren:** Beim Registrieren freiwillig eine
   Eltern-E-Mail angeben; eine einmalige Codebestätigung an diese Adresse.
   Bei **bestehenden** Konten darf die Adresse nur nach erfolgreicher
   Anmeldung mit dem alten Passwort oder vorab ausgestelltem, gültigem
   Wiederherstellungscode hinzugefügt werden.
2. **Konto-Anfragen serverseitig eröffnen:** Rate-limitierte,
   spamsichere Supabase Edge Function. Die Antwort bleibt für jeden
   angeblichen Anmeldenamen gleich; weder öffentliches Konto-Lookup
   noch Bestätigung über Kontenexistenz.
3. **Code zustellen:** Einmalcode nur an die *bereits verifizierte*
   Elternadresse, mindestens 128 Bit Entropie für Token,
   serverseitig nur HMAC-Hash mit Secret speichern;
   Ablauf nach höchstens 30 Minuten, begrenzte Fehlversuche.
4. **Passwort ändern:** Nach nachgewiesener Berechtigung; alte
   Lernfortschritte und Profileinstellungen nicht anfassen.
   Nur ein sicherer serverseitiger Endpunkt darf den Hash ändern.
   Langfristig Passworthash auf Argon2id mit individuellem Salt
   migrieren; bisherige SHA-256-Bestandslogins kompatibel halten,
   bis Nutzer authentifiziert umgestellt werden können.
5. **Admin-Warteschlange:** Eigenständiger Adminbereich mit
   **serverseitig** geprüftem Besitzer-Zugang/MFA, nicht mit dem
   bestehenden JavaScript-PIN. Nur minimal nötige Daten anzeigen;
   keine Klartext-Passwörter, Reset-Codes, vollständigen Inhalte
   von Kinder-Lernständen oder ungeschützte Excel-Exporte.
6. **Gmail ↔ Datenbank:** Nach autorisiertem OAuth/Apps-Script-Backend
   eine serverseitige, authentifizierte Ingest-API mit
   Idempotenz je Gmail-Message-ID-Hash bauen. Nur dann erscheint
   jeder Eingang automatisch als Ticket im Adminbereich.
   Der bisherige Gmail-Label-Ordner dient bis dahin als sichere
   manuelle Warteschlange.
7. **Status-Automation:** Eingang, Eingangsbestätigung, Code zugestellt,
   erfolgreich nachgewiesen → erst danach ggf. manuelle Freigabe.
   Manuelle Ablehnung bei Verdacht, Sperrung auffälliger Vorgänge,
   Protokoll aller relevanten Entscheidungen.
8. **Datenschutz:** Nur Elternkontakt und Konto-ID speichern;
   kein Geburtsdatum, Ausweisbild oder Familienbeziehungsbeleg.
   Kinderbezogene Tickets spätestens 30 Tage nach Erledigung
   löschen/anonymisieren, minimale Sicherheitsereignisse
   maximal 90 Tage halten; DSGVO-Informationspflicht prüfen.

## Besonderheit bestehender Konten ohne hinterlegte Elternadresse

Eine Mail von einem beliebigen Absender und ein korrekt genannter
Kinder-Anmeldename sind **kein Eigentumsnachweis**. Auch der Betreiber
darf daraus keine Berechtigung ableiten.

- Existiert auf einem Gerät noch eine **gültige authentifizierte Sitzung**,
  kann dort nach erneuter Prüfung eine Wiederherstellungsmethode gebunden werden.
- Gibt es weder Passwort noch bereits verifizierten Elternkontakt noch
  vorab ausgestellten Wiederherstellungscode, darf das Konto
  *nicht automatisch freigegeben* werden.
- Ein administrativer Ausnahmepfad darf nur mit dokumentiertem
  unabhängigen Berechtigungsnachweis existieren. Andernfalls muss der
  Fall ungelöst bleiben, statt fremde Konten zu kompromittieren.

## Abgrenzung

`kids/recovery/db/20261011_foundation.sql` enthält **keine**
öffentlichen Datenbank-Policies und **keinen** Kennwort-Reset-Endpunkt.
Ein zweiter erfolgreicher Schritt ist erforderlich, bevor echte
E-Mail-Verifizierung oder Admin-Synchronisierung freigegeben wird.
