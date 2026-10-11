# DĀR AL TAWḤĪD KIDS · Eltern-E-Mail & sichere Kontohilfe

**Stand: 12.10.2026 – KIDS TEST / Entwicklung. Nicht live freigegeben.**

## Beschlossene Produktregel

**Für jedes NEUE registrierte Kinderkonto ist eine bestätigte Eltern-E-Mail Pflicht.** Die Bestätigung wird serverseitig vorgenommen, bevor der Datensatz in `public.kids_accounts` angelegt und der Lernstand in ein angemeldetes Konto übernommen wird. Der Gastzugang ohne Konto darf weiterhin verwendet werden.

Bereits bestehende Kinderkonten behalten Login, Profile, Passworthashes und Lernfortschritte. Sie werden nicht automatisch gesperrt, nicht gezwungen, eine Adresse nachträglich anzugeben, und nicht aufgrund einer unbestätigten E-Mail übernommen. Eine bereits eingeloggte Elternperson kann ihre E-Mail später nach erneuter Authentifizierung sicher anbinden.

## Aktuell erledigt

- Produktions-Supabase: `kids_parent_contacts`, `kids_account_recovery_requests`, `kids_recovery_challenges` und `kids_recovery_audit_events` sind als Service-Role-only Tabellen mit RLS angelegt; **noch keine öffentliche Reset-API**.
- Support-Gmail `dar.al.tauhid91@gmail.com` ist in ChatGPT als `DĀR AL TAWḤĪD SUPPORT` verbunden. Gmail-Labels für Eingang, Antwort, manuelle Prüfung und Passwortfragen wurden angelegt.
- Eine stündliche ChatGPT-Kontrollaufgabe ist für die Supporttriage konfiguriert, aber weder Google Apps Script noch ein autonomer Gmail-Servertrigger ist installiert. Der alte Apps-Script-Entwurf unter `gmail/DarKidsSupportIntake.gs` ist **nicht aktiv**.
- In diesem **nicht zusammengeführten Feature-Zweig** sind alle drei KIDS-HTML-Startdateien (`index.html`, `start.html`, `shell.html`) auf einen zweistufigen Registrierungsentwurf umgestellt: Eltern-E-Mail als Pflichtfeld, Codeeingabe und **erst nach positivem Servernachweis** lokal angelegtes Kinderprofil. Der neue Entwurf ruft `kids_parent_registration_begin` und `kids_parent_registration_finish` auf. Diese Backend-Funktionen existieren noch **NICHT**. Solange das so ist, wird ausdrücklich eine Fehlermeldung gezeigt und KEIN neues Konto angelegt.
- Der bisherige Anmeldeweg `kids_login` für bestehende Konten und die Gastnutzung bleiben erhalten.

## Blocker bis zur sicheren Freigabe

1. Einen zuverlässigen E-Mail-Code-Versand für Elternadressen unter den Free-Tier-Grenzen und mit DSGVO-/Datenschutzprüfung bereitstellen. Die ChatGPT-Gmail-Verbindung allein ist kein synchroner Dienst zur Zustellung von Registrierungs-Codes; Gmail-App-Permissions sind keine SMTP- oder Backend-Credentials. **Keinen kostenpflichtigen Dienst automatisch bestellen, keine Zugangsdaten im Repository speichern.**
2. Serverseitig `kids_parent_registration_begin` implementieren: Eingaben streng validieren, Ticket serverseitig mit begrenzter Lebensdauer speichern, pro E-Mail/IP/Konto Rate Limits & Anti-Automations-Schutz, achtstelligen Code mit serverseitig geheimem HMAC-Digest, maximal fünf Versuche und 15 Minuten Gültigkeit, Einmalverwendung; Mailversand transaktional mit ehrlichem Zustellstatus. Keine Preisgabe, ob ein Kindername existiert. E-Mail-Adresse und Kinderdaten nicht in URL oder Logs schreiben.
3. Serverseitig `kids_parent_registration_finish` implementieren: Transaktion und Zeilensperre; Ticket-ID, E-Mail, Name, Code, Ablauf und Versuchszahl **serverseitig** prüfen; nur bei erfolgreicher Verifizierung Kind in `kids_accounts` anlegen; `kids_parent_contacts` mit `proof_method` nur nach belegter Verifizierung füllen; Challenge invalidieren. Prüfen, dass auch parallele Anfragen, Doppel-Klicks, alte Codes und Namenskollisionen sicher fehlschlagen. `verified:true` **erst nach erfolgreichem Commit** zurückgeben.
4. **WICHTIGER UMGEHUNGSSCHUTZ:** Die bestehende öffentliche RPC `public.kids_register(p_name,p_hash,p_gender,p_age,p_data)` legt heute neue Konten ohne E-Mail an. Vor dem Live-Release muss diese Möglichkeit für **neue** Konten serverseitig blockiert oder durch eine gesicherte Legacy-Login-/Link-Routine ersetzt werden. Nur ein Browserfeld erzwingt die Elternpflicht NICHT. Authentifizierte Bestandskonten und ihre Daten dürfen dabei nicht beschädigt werden.
5. Prüfen, ob 8-stellige Codes bei implementiertem Anti-Bruteforce ausreichend sind. Bevorzugt keine Token an E-Mail-Adressen senden, die noch nicht durch echte Eigentümerschaft bestätigt wurden, um Dritte nicht zu belästigen; Absender- und Missbrauchsschutz implementieren.
6. `node scripts/test-kids-account-registration-v1.js` und alle weiteren Kids-/CI-Tests ausführen; zusätzlich reale E-Mail-Zustellung, abgelaufener/falscher Code, doppelte Eingabe, Bestandskonten, iPhone-Safe-Areas, Gastmodus, Offline-Modus und tatsächlichen serverseitigen Registrierungs-Bypass testen.
7. **Nur KIDS TEST**, erst nach bestandenem Backend- und Gerätetest sowie ausdrücklicher Besucherfreigabe live. Keine Änderung der öffentlichen Website `dar-al-tawhid.de` oder Erwachsenen-/iOS-Besucher-App durch diese vorbereitenden Commits.

## Reset und Eltern-Adminbereich (anschließend)

- Supportanfragen werden derzeit im Support-Gmail über die angelegten Labels geführt; **keine Gmail→Supabase-Ticket-Synchronisation behaupten**, solange keine sichere Backend-Ingest-Schnittstelle nachgewiesen ist.
- Sichere Passwortänderung nur über zuvor verifizierten Elternkontakt oder anderen starken Nachweis. Ein Kindername oder bloße E-Mail allein beweist nichts.
- Eigenständige Admin-Authentifizierung mit serverseitigem Schutz/MFA statt öffentlicher Browser-PIN, minimale Daten, Audit-Events, begrenzte Aufbewahrungsdauer und Datenschutzinformationen.
- Keine Passwörter, Einmalcodes, Kinder-Lernstände, API-Schlüssel oder Mailtokens in öffentlichen Logs oder im Repository.

## Technische Wahrheit

**Diese Feature-Branch-Version ist bewusst noch nicht nutzbar für neue Online-Konten.** Sie darf bis zum nachgewiesenen Backend-Versand und dem serverseitigen Schließen der alten `kids_register`-Umgehung **nicht in eine Besucher-App ausgerollt werden**. Bestehender Produktionsbetrieb ist von diesem Feature-Zweig unberührt.
