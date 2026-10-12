# DĀR AL TAWḤĪD · Touch- und Stabilitätsaudit
**Datum:** 12.10.2026  
**Scope:** öffentliche Erwachsenen-Web-App, /test/, KIDS-Web-App, beide iOS-WKWebView-Container.  
**Status:** Quellcodeaudit + isolierter Reparaturbranch; kein Produktionsdeployment und kein Xcode-Gerätetest.

## Nachgewiesene Codebefunde und Korrekturen

| ID | Schwere | Bereich | Tatsächlicher Codebefund | Reparatur auf diesem Branch |
|---|---|---|---|---|
| T01 | Hoch | Erwachsenen-Web-App /test/ | In `index.html` und `test/index.html` aktivieren `bindNavActivation` und `bindFastAction` über `pointerup`. Die Bewegungsprüfung in `bindNavActivation` gilt nur für zwei bestimmte Kartenklassen. | Früher Capturing-Guard in `assets/dar-app-chrome.js`: Navigation bei Fingerbewegung >12px nicht auf `pointerup` oder anschließendem `click` auslösen. Kurze beabsichtigte Tipps, Maus, Keyboard und nichtnavigierende Scrollflächen bleiben verwendbar. |
| T02 | Hoch | Erwachsene iOS-App | `WebAppView.swift` aktiviert `WKWebView.allowsBackForwardNavigationGestures`. | Ausgeschaltet; betrifft die native Binärdatei und erfordert eine neue iOS-Version. |
| T03 | Mittel | Alternative iOS-WebView | `FreshWebAppView.swift` aktiviert dieselbe Browsergeste, obwohl derzeit `WebAppView` gestartet wird. | Ebenfalls ausgeschaltet, damit ein späterer Wechsel nicht erneut Swipe-Back aktiviert. |
| T04 | Hoch | KIDS WebView/PWA | Globales `click`-basiertes Routing sowie sehr große aktive Kartenbereiche; die Navigation wertet bisher die Berührungsbewegung nicht aus. | `kids/navigation-v1182.js`: Drag-Absicht bei >12px Bewegung erkennen und den folgenden Navigationsklick abfangen; keine künstliche Klickverzögerung, Touchlistener passiv. |
| P01 | Mittel | Erwachsenen-Web-App | `assets/dar-app-chrome.js` beobachtet sämtliche DOM-Kinderänderungen und startete pro Änderung drei komplette Markentext-Prüfungen. | Auf relevante Markenelemente eingegrenzt; Ausführung durch Animation Frame + einzigen kurzen Nachlauf koalesziert. |

## Weitere konkrete Risiken, für die eine Geräte- oder Browser-Profilierung fehlt

| ID | Priorität | Bereich | Indiz und nächste Prüfmethode |
|---|---|---|---|
| P02 | Hoch | Web-App | Root `index.html` ist im untersuchten Main-Stand ca. 2,54 MB, `test/index.html` ca. 2,64 MB. Sehr große Parser-/Style-/Skriptlast vor vollständiger Interaktion möglich. Performance Panel: Main-Thread-Long-Tasks, FCP/LCP, INP, Speicher und Netzwerk-Waterfall messen. |
| P03 | Hoch | Layout/CSS | Main-Root: 188 inline-`<style>`-Blöcke, 31 externe Stylesheet-Links, 12.547 Vorkommen `!important`, 187 `backdrop-filter`. Test: Styles-Berechnung und Layer-Repaints auf iPhone, iPad und Android, insbesondere Hero, Header und Qurʾān-Player. Das allein beweist noch keine FPS-Einbrüche. |
| P04 | Hoch | Erwachsenen-Navigation | `render()` ersetzt häufig `#appView.innerHTML` vollständig. Aufwendige Ansichten können dadurch Layout/Paint und verlorene Scrollzustände verursachen. Test: Performance-Profile bei wiederholtem Tabwechsel und Eingabeverarbeitung. Nicht ohne Render-Profiling umschreiben. |
| P05 | Mittel | Erwachsenen-Navigation | `initBottomNavSwipe()` erzwingt über `void btn.offsetWidth` bei Berührung die Style-/Layoutberechnung, um eine Animation neu zu starten. Mit einem Device Trace prüfen; Reparatur nur nach Wahrung der bestehenden Taboptik. |
| P06 | Mittel | KIDS-Layout | `kids/index.html` hat rund 522 KB, 41 externe Stylesheet-Links und 4.326 `!important`-Vorkommen. Viele spätere Profil- und Hero-Overrides erhöhen das Konfliktrisiko. Ein CSS-Aufräumen muss visuelle Screenshot-Regressionstests umfassen, getrennt für Junge/Mädchen. |
| P07 | Mittel | KIDS-Tabwechsel | `kidsFinishMainTabSwitch()` überwacht nach jedem Tabwechsel bis zu 900 ms Scrollbewegungen; zusätzlich gibt es Scrollwiederherstellung in `kids/navigation-v1182.js`. Mögliche konkurrierende Scrollkorrekturen; auf realen iPhones mit Touch-/Scrollaufzeichnung prüfen. |
| P08 | Mittel | KIDS-Startseite | `restartHomeMotion()` nutzt `void today.offsetHeight` als erzwungene Layoutberechnung; bei Home-Rückkehr potenziell Ruckler. Änderung nur mit Prüfung der exakt freigegebenen Wortmarkenanimation. |
| P09 | Mittel | iOS-Start | `WebAppView.swift` und `FreshWebAppView.swift` laden beim Start mit `.reloadIgnoringLocalCacheData`. Kann mehr Netzwerkarbeit bewirken. Cachepolitik erst ändern, wenn Service-Worker-Versionierung, Offline-Start, Push und Updateverhalten gezielt getestet sind. |
| P10 | Mittel | KIDS-Karten | `kids-card-interaction.js` setzt bei Touch `filter`, `box-shadow` und `border-color` inline mit `!important`; große Effekte können Painting auslösen. Per Web Inspector „Rendering/Frames“ untersuchen, Erscheinungsbild nicht blind verändern. |
| P11 | Niedrig | Accessibility | `assets/dar-app-chrome.js` sperrt Browser-Zoom über das Viewport-Meta und Mehrfingergesten. Nicht direkt als Ruckelursache einzustufen; Accessibility und Lesbarkeit separat bewerten. |

**Analyse-Scope der Zählung:** Root-/Test-`index.html` und KIDS-`index.html` im Ausgangsstand `main`. Die Zahlen beschreiben statische Textvorkommen, nicht gemessene Runtime-Kosten.

## Freigabe- und Regressionstests

Automatisch auf PRs nach `main` vorgesehen:
- JavaScript-Syntax von `assets/dar-app-chrome.js` und `kids/navigation-v1182.js`.
- `scripts/touch-navigation-guard-test.cjs`: beabsichtigter Tip, 16px-Drag, nichtnavigierende Fläche, Mausklick, Tastaturaktivierung, Swift-Flags.
- Bestehende App-Health-, Inhalts-, Deploy-Lane-, Repo- und Update-Schutzchecks.

Vor einem Live-Merge zusätzlich mit realen Geräten manuell prüfen:
1. iPhone 17 Pro Max, kleines iPhone, iPad, Android; Safari/PWA und beide offiziellen iOS-Apps.
2. KIDS Junge/Mädchen: Start → jede Haupt-Tab → alle Karten → Detail → Zurück; vertikales Scrollen, seitliches Wischen und langsames Fingerabheben dürfen keine falsche Navigation auslösen.
3. Erwachsenen-App: dieselben Bewegungen auf Start, Feed, Themen, Qurʾān-Übersicht, Sure/Player, Mehr, Bibliothek, Einstellungen und jedem Zurück-Button.
4. 20 schnelle Tabwechsel; 10 Wiederholungen Start/Kaltstart; Hintergrund/Vordergrund; Hoch-/Querformat; Offline/Online-Übergänge.
5. Audio, Lernfortschritt, Push-Registrierung, Updatebanner, Safe-Area, Hero und Bottom-Tab-Position sowie Profile/Farbpaletten unverändert.
6. Profiler: Frame-Drops, INP, Scroll-Jank, Layout Shifts, CPU, RAM und Netzwerk messen. Keine Behauptung „ruckelfrei“ ohne diese Tests.

## Deployment-Hinweis

Die JS-Reparaturen können nach grünem CI und visueller Freigabe über die Website ausgerollt werden; die geänderte Swift-Browsergesten-Einstellung wird erst nach einem neuen nativen iOS-Build und App-Store-/TestFlight-Release wirksam. `main` und die öffentliche Besucher-App bleiben bis zum geprüften Merge unangetastet.
