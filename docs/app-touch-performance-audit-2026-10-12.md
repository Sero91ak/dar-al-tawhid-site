# DĀR AL TAWḤĪD · Touch- und Stabilitätsaudit
**Datum:** 12.10.2026  
**Scope:** öffentliche Erwachsenen-Web-App, /test/, KIDS-Web-App, beide iOS-WKWebView-Container.  
**Status:** Quellcodeaudit + getrennte Reparatur-PRs: #1071 Erwachsene und #1072 KIDS; kein Produktionsdeployment und kein Xcode-Gerätetest.

## Nachgewiesene Codebefunde und Korrekturen

| ID | Schwere | Bereich | Tatsächlicher Codebefund | Reparatur auf diesem Branch |
|---|---|---|---|---|
| T01 | Hoch | Erwachsenen-Web-App /test/ | In `index.html` und `test/index.html` aktivieren `bindNavActivation` und `bindFastAction` über `pointerup`. Die Bewegungsprüfung in `bindNavActivation` gilt nur für zwei bestimmte Kartenklassen. | Früher Capturing-Guard in `assets/dar-app-chrome.js`: Navigation bei Fingerbewegung >12px nicht auf `pointerup` oder anschließendem `click` auslösen. Kurze beabsichtigte Tipps, Maus, Keyboard und nichtnavigierende Scrollflächen bleiben verwendbar. |
| T02 | Erhalten | Erwachsene iOS-App | `WebAppView.swift` aktiviert `WKWebView.allowsBackForwardNavigationGestures`. | **Bleibt auf `true`**: ausdrücklicher Nutzerwunsch, Erwachsenen-Seitenwechsel-Gesten beizubehalten. Die probeweise Abschaltung wurde vollständig rückgängig gemacht. |
| T03 | Erhalten | Alternative iOS-WebView | `FreshWebAppView.swift` aktiviert dieselbe Browsergeste, obwohl derzeit `WebAppView` gestartet wird. | **Bleibt auf `true`**; keine native Binäränderung notwendig. |
| T04 | Hoch | KIDS WebView/PWA | Globales `click`-basiertes Routing sowie sehr große aktive Kartenbereiche; die Navigation wertet bisher die Berührungsbewegung nicht aus. | `kids/navigation-v1182.js`: Drag-Absicht bei >12px Bewegung erkennen und den folgenden Navigationsklick abfangen; keine künstliche Klickverzögerung, Touchlistener passiv. |
| P01 | Mittel | Erwachsenen-Web-App | `assets/dar-app-chrome.js` beobachtet sämtliche DOM-Kinderänderungen und startete pro Änderung drei komplette Markentext-Prüfungen. | Auf relevante Markenelemente eingegrenzt; Ausführung durch Animation Frame + einzigen kurzen Nachlauf koalesziert. |
| P12 | Mittel | Adaptive App-Navigation | `assets/adaptive-layout.js` berechnete Navigationsrechtecke auch ohne Orientierungswechsel, schrieb Root-Tokens trotz unveränderter Viewportgröße und verlor einen Force-Request bei bereits eingeplantem Frame. | Geometriemessung auf echten Orientierungswechsel reduziert, Viewport-Änderungen zwischengespeichert, Forced-Layout-Flag beim Scheduling erhalten. |
| P13 | Mittel | Fold-/Tablet-Scroll | `assets/fold-split.js` rief die Scroll-Wiederherstellungsprüfung nach beliebigen DOM-Änderungen unter `#appView` auf. | MutationObserver prüft nur neue Dual-Shells; Reader-Inhaltsänderungen lösen keine unnötige Shell-Suche aus. |

## Weitere konkrete Risiken, für die eine Geräte- oder Browser-Profilierung fehlt

| ID | Priorität | Bereich | Indiz und nächste Prüfmethode |
|---|---|---|---|
| P02 | Hoch | Web-App | Root `index.html` ist im untersuchten Main-Stand ca. 2,54 MB, `test/index.html` ca. 2,64 MB. Sehr große Parser-/Style-/Skriptlast vor vollständiger Interaktion möglich. Performance Panel: Main-Thread-Long-Tasks, FCP/LCP, INP, Speicher und Netzwerk-Waterfall messen. |
| P03 | Hoch | Layout/CSS | Main-Root: 188 inline-`<style>`-Blöcke, 31 externe Stylesheet-Links, 12.547 Vorkommen `!important`, 187 `backdrop-filter`. Test: Styles-Berechnung und Layer-Repaints auf iPhone, iPad und Android, insbesondere Hero, Header und Qurʾān-Player. Das allein beweist noch keine FPS-Einbrüche. |
| P04 | Hoch | Erwachsenen-Navigation | `render()` ersetzt häufig `#appView.innerHTML` vollständig. Aufwendige Ansichten können dadurch Layout/Paint und verlorene Scrollzustände verursachen. Test: Performance-Profile bei wiederholtem Tabwechsel und Eingabeverarbeitung. Nicht ohne Render-Profiling umschreiben. |
| P05 | Mittel | Erwachsenen-Navigation | `initBottomNavSwipe()` erzwingt über `void btn.offsetWidth` bei Berührung die Style-/Layoutberechnung, um eine Animation neu zu starten. Mit einem Device Trace prüfen; Reparatur nur nach Wahrung der bestehenden Taboptik. |
| P06 | Mittel | KIDS-Layout | `kids/index.html` hat rund 522 KB, 41 externe Stylesheet-Links und 4.326 `!important`-Vorkommen. Viele spätere Profil- und Hero-Overrides erhöhen das Konfliktrisiko. Ein CSS-Aufräumen muss visuelle Screenshot-Regressionstests umfassen, getrennt für Junge/Mädchen. |
| P07 | Mittel | KIDS-Tabwechsel | `kidsFinishMainTabSwitch()` überwacht nach jedem Tabwechsel bis zu 900 ms Scrollbewegungen; zusätzlich gibt es Scrollwiederherstellung in `kids/navigation-v1182.js`. Mögliche konkurrierende Scrollkorrekturen; auf realen iPhones mit Touch-/Scrollaufzeichnung prüfen. |
| P08 | Mittel | KIDS-Startseite | `restartHomeMotion()` nutzte `void today.offsetHeight` als erzwungene Layoutberechnung. | Im getrennten KIDS-PR #1072 durch zwei Animation Frames und eine Ein-Sekunden-Entprellung ersetzt; tatsächliches Erscheinungsbild noch auf iPhones/iPads prüfen. |
| P09 | Mittel | iOS-Start | `WebAppView.swift` und `FreshWebAppView.swift` laden beim Start mit `.reloadIgnoringLocalCacheData`. Kann mehr Netzwerkarbeit bewirken. Cachepolitik erst ändern, wenn Service-Worker-Versionierung, Offline-Start, Push und Updateverhalten gezielt getestet sind. |
| P10 | Mittel | KIDS-Karten | `kids-card-interaction.js` setzt bei Touch `filter`, `box-shadow` und `border-color` inline mit `!important`; große Effekte können Painting auslösen. Per Web Inspector „Rendering/Frames“ untersuchen, Erscheinungsbild nicht blind verändern. |
| P11 | Niedrig | Accessibility | `assets/dar-app-chrome.js` sperrt Browser-Zoom über das Viewport-Meta und Mehrfingergesten. Nicht direkt als Ruckelursache einzustufen; Accessibility und Lesbarkeit separat bewerten. |

**Analyse-Scope der Zählung:** Root-/Test-`index.html` und KIDS-`index.html` im Ausgangsstand `main`. Die Zahlen beschreiben statische Textvorkommen, nicht gemessene Runtime-Kosten.

## Freigabe- und Regressionstests

Automatisch auf PRs nach `main` vorgesehen:
- JavaScript-Syntax von `assets/dar-app-chrome.js` und `kids/navigation-v1182.js`.
- Erwachsenen-PR #1071: `scripts/adult-touch-navigation-guard-test.cjs` und `scripts/adult-layout-performance-test.cjs`.
- KIDS-PR #1072: `kids/test-navigation-touch-v1344.cjs`. Beide PRs besitzen getrennte nicht-AI-GitHub-Actions-Workflows.
- Bestehende App-Health-, Inhalts-, Deploy-Lane-, Repo- und Update-Schutzchecks.

Vor einem Live-Merge zusätzlich mit realen Geräten manuell prüfen:
1. iPhone 17 Pro Max, kleines iPhone, iPad, Android; Safari/PWA und beide offiziellen iOS-Apps.
2. KIDS Junge/Mädchen: Start → jede Haupt-Tab → alle Karten → Detail → Zurück; vertikales Scrollen, seitliches Wischen und langsames Fingerabheben dürfen keine falsche Navigation auslösen.
3. Erwachsenen-App: dieselben Bewegungen auf Start, Feed, Themen, Qurʾān-Übersicht, Sure/Player, Mehr, Bibliothek, Einstellungen und jedem Zurück-Button.
4. 20 schnelle Tabwechsel; 10 Wiederholungen Start/Kaltstart; Hintergrund/Vordergrund; Hoch-/Querformat; Offline/Online-Übergänge.
5. Audio, Lernfortschritt, Push-Registrierung, Updatebanner, Safe-Area, Hero und Bottom-Tab-Position sowie Profile/Farbpaletten unverändert.
6. Profiler: Frame-Drops, INP, Scroll-Jank, Layout Shifts, CPU, RAM und Netzwerk messen. Keine Behauptung „ruckelfrei“ ohne diese Tests.

## Deployment-Hinweis

Die JS-Reparaturen können nach grünem CI und visueller Freigabe über die Website ausgerollt werden; die native iOS-WebView-Gesteneinstellung wurde beibehalten. Für die hier geplanten JavaScript/CSS-kompatiblen Reparaturen ist dadurch allein kein neuer nativer App-Store-Build erforderlich. `main` und die öffentliche Besucher-App bleiben bis zum geprüften Merge unangetastet.
