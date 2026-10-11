# KIDS TEST · Eigene App und Staging-Deployment

## Entwicklungsvorgabe
Die öffentliche Kinder-App `de.daraltawhid.kids` und ihre Website
`https://dar-al-tawhid.de/kids/` bleiben unverändert.

Die neue Test-App verwendet:
- Scheme `DarAlTawhidKidsCreator`, Bundle-ID `de.daraltawhid.kids.creator`;
- iPhone-Name **KIDS TEST**, eigenes App-Datenverzeichnis;
- Test-Worker `https://dar-al-tawhid-kids-creator.sero91ak.workers.dev`;
- Startseite `/kids/start.html` und die vorhandene KIDS-Akademie;
- ausschließlich native **TEST**-Navigation für Start, Qurʾān, Hörbücher,
  Duʿāʾ, Eltern und Akademie. Der Besucher-Scheme enthält keine Navigation.

## Zwei getrennte Entwicklungszweige
- `main`: bestehende Website und iOS-Besucherstand. **Keine ungeprüften
  KIDS-Änderungen hier zusammenführen.**
- `kids-creator-staging`: KIDS-Änderungen zuerst hier entwickeln und testen.
  Der Test-Deploy lädt ausschließlich diesen Branch.

## Einmaliges Bereitstellen des KIDS-Test-Servers
1. GitHub → Repository `Sero91ak/dar-al-tawhid-site`.
2. Actions → **Deploy Dar Test App**.
3. **Run workflow** → Branch `kids-creator-staging`.
4. Feld **target** auf `kids-creator` stellen und starten.
5. Nur der Worker `dar-al-tawhid-kids-creator` unter workers.dev wird
   deployed. Der normale Dar-Test-Worker und die öffentliche Domain
   `dar-al-tawhid.de` werden in diesem Job nicht berührt.
6. Job prüft drei KIDS-Routen und weist die Erwachsenen-Test-Anmeldung mit HTTP 404 ab. Erst wenn er grün ist, gilt die Website
   als technisch erreichbar.

**Nicht `dar-test` aus dem Staging-Branch auswählen.** Die vorhandene
Konfiguration lässt den separaten KIDS-Job ausschließlich mit dem exakt
benannten Staging-Branch zu.

## iPhone-Installation
1. In Xcode `ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj` öffnen.
2. Scheme **DarAlTawhidKidsCreator** auswählen.
3. Das iPhone und das bisherige Apple-Team auswählen.
4. **Run** starten, nachdem der eigene Worker verifiziert wurde.
5. Die zwei Apps stehen nebeneinander: TAWḤĪD KIDS / KIDS TEST.
6. Der kleine native Button **TEST** öffnet die gesamte KIDS-Testnavigation.

## Sicherheit und aktueller Funktionsumfang
Das ist **Phase 1 der technischen Trennung**. Die Test-App zeigt die bereits
implementierten KIDS-Module in eigenem iOS-Speicher/Worker, aber **hebt
keine Unterrichtssperren auf**. Es wird nicht mit einem öffentlichen
`creatorSandbox`-Parameter oder einem vorgetäuschten User-Agent
freigeschaltet. Ein User-Agent ist kein sicherer Berechtigungsnachweis;
deshalb dürfen auf diesem Staging-Worker bis zur späteren echten
Server-Authentifizierung **keine privaten oder nicht freigegebenen
Ersteller-Materialien** veröffentlicht werden.

Die 52-Wochen-Verwaltung V23 wurde separat als geschützte Vorschau
angelegt, funktioniert jedoch nur nach Einrichtung echter Cloudflare-Secrets.
Sie wird erst danach in die zentrale KIDS-Testnavigation übernommen.

## Freigabeprozess
Entwurf im Staging-Branch → eigenständiger KIDS-Test-Deploy → native
KIDS-TEST-Prüfung → Quellen-/Audio-/Alterskontrolle → **ausdrückliche
Nutzerfreigabe** → separater Besucher-PR → regulärer App-Store-/Website-Stand.

Kein automatisches PR-Merge von KIDS-Staging nach main. Kein automatisches
TestFlight/App-Store-Publishing, kein neuer kostenpflichtiger KI-Dienst.

## Offen / nicht als erledigt melden
- Echten Xcode-Build auf macOS und iPhone durchführen.
- Die separate workers.dev-Adresse per grünem Workflow testen.
- Ersteller-Berechtigungen für zeit-/altersgesperrte Bereiche **serverseitig**
  absichern, ohne weitere Basic-Auth-Popups.
- Alle 38 vorhandenen und 170 offenen Unterrichtsplätze mit der
  Unterrichtszentrale verbinden.
- Test-Simulationen für drei Altersgruppen, verschiedene Lernstände,
  Hörbücher/Offline-Downloads und Tabletansicht real prüfen.

## Isolierte Serverkonfiguration
Der Kids-Worker verwendet `kids/creator-test/wrangler.toml` und
`kids/creator-test/worker.js`; kein Adult-Test-Worker wird geklont.
`run_worker_first = true` bedeutet: Auch statische Assets passieren den
KIDS-only-Routenfilter. Der Worker verweigert alle nicht-KIDS-Pfade, Tools,
API-Aufrufe und Administratorbereiche. Die öffentlich bekannte workers.dev-
URL ist derzeit **noch keine private Ersteller-Authentifizierung**.

## KIDS TEST Web-App · eigenständig auf iPhone installieren (11.10.2026)
**Web-App:** https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/test-console/

Safari auf iPhone → Teilen → **Zum Home-Bildschirm** → **Hinzufügen**.
Der App-Name ist **KIDS TEST**; die Web-App besitzt ein eigenes Manifest,
eigenen Service Worker ausschließlich für `/kids/test-console/` und
lokal gespeicherte, exportierbare Bearbeitungsnotizen und Testsettings.
Diese PWA ist eine **echte Web-App** und benötigt für die erste Nutzung Internet.
Nach dem ersten Aufruf sind die Katalog-/Redaktionsansichten auch offline nutzbar;
Hörbücher, Qurʾān-Medien und alle Unterbereiche können online erforderlich sein.

### Innerhalb der KIDS TEST Web-App
- Redaktionsentwürfe für alle 208 Unterrichtsplätze, lokale Quellen-/Alters-
  und Audio-Prüfvermerke, Wunschdatum und sechs Module mit QA-Notizen.
- Lokaler Altersgruppen-/Jungen-/Mädchen-Testplan als Simulation; für die
  **eigentliche** Kinderoberfläche legt man getrennte Test-Kinderprofile in
  `/kids/start.html` an. Es gibt KEINEN versteckten Freischaltparameter.
- JSON-Export/Import der lokalen Planung; keine Synchronisierung zwischen
  Geräten ohne diese Sicherung; kein Server-Write oder GitHub-Push.
- Das Häkchen »Testbereit« ist **keine Besucherfreigabe**.
- Die Web-App kann nicht sämtliche systemseitig gesperrten Lektionen öffnen,
  bevor echte serverseitige Ersteller-Authentifizierung eingerichtet ist.

**Verbindliche, dauerhaft angeheftete Nutzerregel:**
`kids/creator-test/GLOBAL-RELEASE-LOCK.md`.
Es darf unter keinen Umständen KIDS-Testcode in `main`, die Besucher-Web-App,
die native App-Store-KIDS-App oder App Store Connect gelangen, bevor der Nutzer
explizit **»Push-Thread global«** sagt. Allgemeine Weiterarbeitsaufträge sind
keine Live-Freigabe. Der CI-Prüfschritt
`node kids/tools/verify-global-release-lock.cjs` blockiert den separaten
KIDS-Creator-Deploy bei Abweichungen. Die bestehende Produktions-CI auf
`main` ist separat zu härten; bis dahin **NICHT** in `main` mergen.
