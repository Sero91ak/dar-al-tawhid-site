# DĀR AL TAWḤĪD · Isolierter V8 Duo Testzweig

**Erstellt:** 22.10.2026 · **Umfang:** Nur DAR TEST `/test/`.

## Verbindlicher, unveränderter Wiederherstellungspunkt

`main` / Ausgangscommit bei Beginn: `18e42c4c21f48f3d16da2759c868c33c03659629`

Originaldatei `test/index.html`, SHA: `7dc9372565e51e4f5616444bc6e92afc48bb5fbf`.

Arbeitszweig: `feat/test-v8-duo-nine-locale-rollback-20261022`

### Rücksetzregel „ZURÜCK“

Auf Wunsch `ZURÜCK` **alle Arbeiten dieses V8-Umbaus** einschließlich der späteren Arbeitsschritte stoppen und den V8-Arbeitszweig zum gesicherten Ausgangscommit zurücksetzen (nur nach Prüfung auf gleichzeitige Änderungen, mit SHA-Schutz). Keine manuelle Einzelrücknahme erforderlich. Falls Teile zwischenzeitlich in andere Branches übernommen worden sind, diese separat mit ihren Release-SHAs rückgängig machen, ohne fremde Arbeiten zu löschen. **Nicht eigenständig einen Live-Release auslösen.**

Acht eingebundene Dateien aktivieren den gesamten globalen Umbau nur in DAR TEST:
- `test/assets/v8-duo-lab-v1.js`
- `test/assets/v8-duo-lab-v1.css`
- `test/assets/v8-complete-app-shell-v1.js` (einheitliche Routen- und Seitenleiste)
- `test/assets/v8-complete-app-shell-v1.css` (V8-Layout für sämtliche Testbereiche)
- `test/assets/v8-global-shell-v1.js` (gemeinsame Routen-Oberfläche, bestehende Teilen-Buttons und Social-Links bleiben erhalten)
- `test/assets/v8-global-shell-v1.css` (übergreifende Layout-, Theme-, Karten- und Einstellungsstruktur)
- `test/assets/v8-home-editorial-20261022.js` (Salam und originalen Quellennachweis wiederverwenden)
- `test/assets/v8-home-editorial-20261022.css` (kompakte V8-Startseite, alte Sieben-Sprachen-Leiste ausblenden)

Durch Entfernen sämtlicher acht Referenzen aus `test/index.html` wird der **gesamte neue Umbau** deaktiviert, unabhängig davon, wie viele weitere optische Schritte auf diesem Branch folgen. Für eine vollständige Rücksetzung des isolierten Testzweigs ist der unveränderliche Basis-Commit oben maßgeblich. Ursprüngliche App-Engine, Daten, Inhaltskataloge, Spracheinstellungen, native iOS-Hülle und CSS-Dateien bleiben unverändert.

## Was die erste Fassung tatsächlich tut

1. Adaptive Sidebar ab ausreichender Inhaltsfläche; darunter die bestehende Bottom-Tabbar.
2. Die Sidebar leitet Aktionen an die originalen Buttons weiter. Keine zweite Route- oder Player-Engine.
3. Bestehende Master/Detail-Struktur wird im geöffneten Fold auch unterhalb 900px nutzbar, sofern genug Lesefläche bleibt.
4. Schnellzugriffe Sprache / Konto / Erscheinungsbild werden mit den bestehenden Bedienfunktionen verbunden.
5. Die Einstellungen erhalten den bestehenden dynamischen Picker mit neun registrierten Sprachen: `de`, `ar`, `en`, `tr`, `ku`, `ckb`, `bs`, `fr`, `es`.
6. Unfertige Sprachen bleiben deaktiviert; vorhandene Themes/Farben, App-Icons, Schriftregler, Standort- und Push-Einstellungen werden nicht neu erfunden oder ersetzt.

## Schutz- und Abnahmekriterien

- Kein Commit nach `main`, kein Cloudflare-Deploy, keine TestFlight-/Xcode-Buildnummer-Anpassung.
- Auf iPhone Duo geschlossen & aufgeklappt, iPhone 18 Pro Max, Galaxy Z Fold (beide Zustände), iPad hoch/quer, Android PWA und Desktop testen.
- RTL (Arabisch, Soranî), 9 Sprachbezeichnungen, Freigabezustände, Tastaturfokus, dynamische Schriftgröße, Dark/Light/Farbschemata und VoiceOver prüfen.
- Gebetszeiten/GPS, Qurʾān-Player, Duʿāʾ, Quellenlinks, Downloads, Kontodaten, Push und Widgets bleiben unberührt.
- Überprüfung der tatsächlichen visuellen Darstellung und der integrierten Gerätefunktionen steht aus. Ein erfolgreicher Syntaxcheck ist noch kein erfolgreicher End-to-End-Test.

## V8 Full-App-Ausbaustufe (22.10.2026)

Zusätzlich isoliert enthalten und durch nur zwei weitere HTML-Referenzen aktivierbar:
- `test/assets/v8-complete-app-shell-v1.css` – globales visuelles System für Startseite, alle Hub-Bereiche, Navigations-/Topbar, Karten und Einstellungen; bestehende 8 Themes werden respektiert.
- `test/assets/v8-complete-app-shell-v1.js` – nutzt bestehenden Router und Original-3D-Assets; Sekundärnavigation im breiten Zustand, keine neuen Lese-/Share-Engines.
- `test/tools/v8-complete-shell-qa.cjs` – nicht-invasiver QA-Guard für Quellen, Sprache, Reader und Social Links.

**Geschützte Kerne:** Beiträge und Quellenbelege, Original-Share-Schaltflächen und Social Links (Telegram, WhatsApp, Instagram), Qurʾān-Āyāt/Rezitation, Duʿāʾ, PDF-Leser, QR-/Deep-Links, Gebetszeiten/GPS, Benachrichtigungen, Kontosynchronisierung, native Hüllen/Widgets. Keine Originaldateien aus diesen Funktionsbereichen wurden geändert.

**WICHTIG:** Die visuelle Freigabe aller Unterseiten (Safari, Fold, iPad) und die echte Prüfung der Original-Share-Flows sind noch offen. Kein Merge/Cloudflare-Deploy. Ein Branch ersetzt keine nutzbare Live-Test-URL.

**Ein-Wort-Rollback:** `ZURÜCK` = *komplette V8-Änderungskette dieses isolierten Branches* zurück zum Original-Commit `18e42c4c21f48f3d16da2759c868c33c03659629`. Geschützt durch die vorab gespeicherte Basis. Kein Merge in main vor Freigabe.

## Kontrolle 22.10.2026 — globaler V8-Ausbau

- Neue Oberfläche betrifft **alle** adulten Test-App-Routen; Fold/Duo ist nur ein responsiver Zustand.
- CSS/JS-Modulreferenzen sind ausschließlich an die Test-HTML angehängt. Der komplette bisherige `test/index.html`-Quelltext ist bytegleich zu `main`, sobald die neuen Modulkopfzeilen entfernt werden (im isolierten Branch geprüft).
- Die ursprünglichen Reader, Gebetszeiten, Duʿāʾ, Qurʾān-Verse, Nachweise, Quellenlinks, Social-Media-Links und `data-post-share-open` werden nicht überschrieben.
- Keine Kern-Funktion aufgrund optischer Änderungen ersetzen oder verstecken. Original-Share-Buttons weiterhin mindestens 40–44px klickbar.
- **Nicht erledigt:** Gerätetests, RTL-/Sprachpaket-End-to-End-Tests, Cloudflare-Testdeployment und Visual-Abnahme. Nicht als produktionsfertig bezeichnen.

## Ergänzung: kompletter V8-App-Umbau (22.10.2026)

**Nicht nur Fold/Duo:** Das Ziel ist die einheitliche äußerliche Layout-, Navigations- und Gerätekompatibilitätsstruktur aller Erwachsenen-Testbereiche. Die unten aufgeführten Dateien werden ausschließlich auf dem isolierten Branch verwendet:

- `test/assets/v8-duo-lab-v1.css` und `.js`: dynamische Navigation, Schnellzugriffe und Sprache in Einstellungen.
- `test/assets/v8-complete-app-shell-v1.css` und `.js`: gesamte V8-Hülle für Hauptbereiche, Layout, Seitenkopf und Gerätetypen.
- `test/assets/v8-global-shell-v1.css` und `.js`: konsistente Quell-/Social-/Share-Bedienoberflächen sowie responsive Bereichsregeln.
- `test/assets/v8-home-editorial-20261022.css` und `.js`: eine kompakte Begrüßung und Original-Quellenmaßstab auf der Startseite.

Die zusätzlichen Entwurfsdateien `v8-global-app-shell-v1.css/js` bleiben **deaktiviert**, um drei sich überlagernde globale Style-Engines zu vermeiden.

**Unberührte Bestandteile:** Original-Renderfunktionen `renderPost`, `renderDuas`, Qurʾān-Reader und -Player, Originalbeiträge, Hadīṯe, Quellen-/Q-Links, Social-Media-Kanäle und Teilen-Aktionen, Gebetszeiten/GPS, Push, Konten, Sprach-Verfügbarkeit, Original-3D-Grafiken, Kids, Native iOS und `main`. Die bisherigen 9 Sprach-Codes bleiben in der zentralen Auswahl. Nicht freigegebene Übersetzungen werden dadurch nicht als fertig ausgegeben.

**Validiert:** Original-HTML unverändert bis einschließlich vor dem alten `</html>`; ausschließlich neue CSS-/JS-Referenzen ergänzen die Test-Hülle. Alle vier aktiven V8-JavaScript-Dateien wurden syntaktisch geprüft. 9 Sprach-Codes im bestehenden Picker bestätigt. Visuelle QA und Geräte-End-to-End-Tests **nicht** bestätigt.

**Erst nach Abnahme:** Veröffentlichung nur auf dedizierter Test-Umgebung, niemals implizit auf `main` oder auf der Besucher-App. Der offizielle `deploy-test-app.yml`-Workflow ist aktuell absichtlich ausschließlich für `main` freigeschaltet, daher ist dieser Branch nicht unmittelbar über diesen Workflow deploybar.
