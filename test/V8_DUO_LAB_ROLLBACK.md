# DĀR AL TAWḤĪD · Isolierter V8 Duo Testzweig

**Erstellt:** 22.10.2026 · **Umfang:** Nur DAR TEST `/test/`.

## Verbindlicher, unveränderter Wiederherstellungspunkt

`main` / Ausgangscommit bei Beginn: `18e42c4c21f48f3d16da2759c868c33c03659629`

Originaldatei `test/index.html`, SHA: `7dc9372565e51e4f5616444bc6e92afc48bb5fbf`.

Arbeitszweig: `feat/test-v8-duo-nine-locale-rollback-20261022`

### Rücksetzregel „ZURÜCK“

Auf Wunsch `ZURÜCK` **alle Arbeiten dieses V8-Umbaus** einschließlich der späteren Arbeitsschritte stoppen und den V8-Arbeitszweig zum gesicherten Ausgangscommit zurücksetzen (nur nach Prüfung auf gleichzeitige Änderungen, mit SHA-Schutz). Keine manuelle Einzelrücknahme erforderlich. Falls Teile zwischenzeitlich in andere Branches übernommen worden sind, diese separat mit ihren Release-SHAs rückgängig machen, ohne fremde Arbeiten zu löschen. **Nicht eigenständig einen Live-Release auslösen.**

Zwei eingebundene Dateien aktivieren den Stand nur in DAR TEST:
- `test/assets/v8-duo-lab-v1.js`
- `test/assets/v8-duo-lab-v1.css`

Durch Entfernen der beiden Referenzen aus `test/index.html` wird das neue Layout deaktiviert. Ursprüngliche App-Engine, Daten, Inhaltskataloge, Spracheinstellungen, native iOS-Hülle und CSS-Dateien bleiben unverändert.

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
