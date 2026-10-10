# DĀR AL TAWḤĪD KIDS — Ersteller-Testsystem (gesamte App)

## Schutzarchitektur
- Live: `https://dar-al-tawhid.de/kids/start` und Bundle `de.daraltawhid.kids`.
- Owner-Test: `https://dar-al-tawhid-kids-owner-test.sero91ak.workers.dev/kids/start`.
- Der Test läuft auf **einem getrennten Worker**, eigenem Host, eigenem Origin-Speicher (Cache, IndexedDB, localStorage, Service Worker) und eigener nativer Bundle-ID `de.daraltawhid.kids.owner.test`.
- `/test/kids/` bleibt unverändert und ist **keine** unabhängige Kids-Test-App.
- Alle /kids- und Test-Asset-Abfragen erhalten erst nach Basic Auth Zugriff. Der Worker erwartet **zwei separate, ausschließlich in Cloudflare gespeicherte Secrets**:
  `KIDS_OWNER_TEST_USERNAME` und `KIDS_OWNER_TEST_PASSWORD` (hochzufälliges Passwort mit mindestens 24 Zeichen).
- Fehlt ein Secret, liefert der Worker 503 und gibt **keine App-Dateien** frei.
- Außerhalb des Test-Hosts liefert der Worker 421. Für schreibende HTTP-Methoden liefert er 405.
- Der Test ist durch noindex/no-cache abgesichert. Keine Geheimnisse, API-Tokens oder Passwörter im Repository.
- Test-Profile und Unterrichtsfortschritte werden ausschließlich auf der Test-Origin gespeichert; niemals aus Live-Storage kopieren oder mit Kinderkonten synchronisieren.
- **Keine Live-Pushs, Live-Account-Änderungen oder Live-Schreibendpunkte aus dem Test.** Native/Browser-Berechtigungen (Push, Mikrofon) separat auditieren.

## Funktionsumfang Phase 1
Ersteller-Menü wird in die ganze Kids-Hauptseite und die Akademie auf dem Test-Host injiziert:
Startseite / Hörbücher / Qurʾān / Duʿāʾ / Quiz / Eltern / Lernakademie;
Testprofil Junge, Alter 4–5 beim erstmaligen Aufruf.
Die normalen Tabs bleiben erhalten. Nicht implementierte Module werden nicht als fertig vorgetäuscht.
Die Akademie kann sämtliche in `DARKidsAcademySchool` registrierten Lektionen öffnen.
Im Live-Modus gelten unverändert die täglichen Freischaltungen.

**Einschränkung vor Phase 2:** Schreibende Test-APIs (z.B. separate Sprachbewertung oder Push-Test) sind absichtlich gesperrt. Sie müssen einzeln an isolierte Test-Backends gebunden werden, nie an Live.

## Vorbereitung der ersten Testbereitstellung (manuell, NICHT LIVE)
1. Auf Mac den GitHub-Zweig `feature/kids-owner-studio-20261010` auschecken.
2. `node scripts/test-kids-owner-studio.mjs` ausführen, alle Tests müssen grün sein.
3. In Cloudflare für den **neuen Worker** zwei neue Geheimnisse setzen. Nicht Werte aus dem öffentlichen Repo wiederverwenden; keine Zugangsdaten in Chat oder GitHub.
   `npx wrangler secret put KIDS_OWNER_TEST_USERNAME -c wrangler.kids-owner-test.toml`
   `npx wrangler secret put KIDS_OWNER_TEST_PASSWORD -c wrangler.kids-owner-test.toml`
4. **Erst nach Freigabe** nur den isolierten Worker deployen:
   `npx wrangler deploy -c wrangler.kids-owner-test.toml`
   Niemals `wrangler deploy` ohne `-c` ausführen; ohne `-c` würde der Root-Worker live betroffen sein.
5. Drei Auth-Checks: kein Passwort ⇒ 401; falsches Passwort ⇒ 401; korrekte Daten ⇒ App. Separat einen Worker ohne Secrets ⇒ 503 prüfen.
6. Auf iPhone und iPad ganze App durchgehen: Start, Hörbücher/Audio, Qurʾān, Duʿāʾ, Quiz, Eltern, Akademie; Jungen/Mädchen-Profile 4–5 / 6–8 / 9–10; Kurznamen/Langnamen; Rotation/Safe Areas; Offline-Downloads, Mikrofon und Audio.
7. Netzwerk-Audit: keine POSTs zum Live-Host, keine produktiven Pushs, keine neuen Live-Konten. Production `/kids/` und Adult Worker vorher/nachher vergleichen.

## Native iOS-Testversion
Unabhängiger XcodeGen-Entwurf im Ordner `ios/DarAlTawhidKidsOwnerTest/`.
`cd ios/DarAlTawhidKidsOwnerTest && xcodegen generate`.
Native Test-App nutzt den separaten Host und die Bundle-ID `de.daraltawhid.kids.owner.test`.
Passwort wird nur im lokalen Eingabeformular eingegeben und im Prozess gehalten.
Vor TestFlight: Build auf Mac/iPhone, eindeutiges TEST-Icon, Microphone/Audio-Berechtigungen,
WebView-Basic-Auth, Offline sowie externe Links prüfen. Noch nicht signiert.

## Produktfreigabe
- Alle Änderungen entstehen im Test-Branch und werden zuerst ausschließlich auf den Test-Worker deployed.
- Owner kontrolliert sämtliche Bereiche und gibt die Version ausdrücklich frei.
- Danach Code-Review / PR gegen `main`, Isolationschecks, genau ein zentrales Live-Deploy.
- Test-Scripts, Test-API-Secrets oder Ersteller-Freischaltungen dürfen nicht in öffentliche App-Codepfade eingebunden werden.
- Sofortige Rücknahme bei einem Live-Fehler: Rollback des zuletzt geprüften Deploys im zentralen Production-Workflow.

**Status:** Quellcode und Konfiguration vorbereitet, aber noch **nicht live als Test-Worker deployed** und noch **kein gebauter iOS-Test-Binary**.
