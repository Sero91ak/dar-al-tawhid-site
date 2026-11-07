# DĀR AL TAWḤĪD · Edge-to-Edge / iPhone Duo – überprüfter Befund
Stand: 07.11.2026 · Status: Analyse + DAR-TEST-Instrumentierung, **keine produktive Reparatur**

## Zuständigkeiten
- Die produktive iOS-Besucher-App lädt `DarAppShell.liveURL` in `ios/DarAlTawhid/DarAlTawhid/WebAppView.swift`. `DarAlTawhidApp.swift` nutzt `.ignoresSafeArea()`.
- Ein einziger Besucher-Header wird durch `assets/dar-adult-brand-header-v2.js` mit `#darAdultBrandHeaderV2` und dem **einen** `#darAdultBrandHeaderSpacerV2` eingebaut.
- Die Test-Shell hat den eigenen Header `#darTestBrandHeaderV1`; dessen JavaScript und CSS gehören unter `test/assets/`.
- Der frühere Duo-v1-Viewport-/Seitennavigationsversuch wurde am 28.10.2026 **ausdrücklich zurückgenommen**. `test/assets/dar-duo-responsive-v1.{css,js}` nicht reaktivieren.
- Die DAR TEST Fold-V2-Leseoberfläche bleibt eigenständig; aus diesem Auftrag keine zusätzliche App-Shell, keine neue Navigation und keine zweite Startseite.

## Konkreter Codebefund: iOS Native Bridge
Datei: `ios/DarAlTawhid/DarAlTawhid/WebAppView.swift`, Methode `applyViewportInsetsNow()`.

1. `let topInset = max(resolvedInsets.top, 59)` übergibt **mindestens 59 pt** als `--dar-native-safe-top` und `--safe-top`, selbst wenn die tatsächliche Safe Area kleiner ist. Dadurch kann im Querformat ein überhöhter Abstand direkt im fixierten Header entstehen.
2. Die Abbruchbedingung vergleicht **nur die obere** Safe Area (`lastAppliedTopInset`), obwohl anschließend auch `--dar-ios-safe-left` und `--dar-ios-safe-right` injiziert werden. Bei Rotation, Fenstergrößen- oder Fold-Zustandswechsel kann sich links/rechts etwas ändern, während oben gleich bleibt. Dann wird die seitliche Safe Area nicht neu an JavaScript übertragen.
3. Native `scrollView.contentInsetAdjustmentBehavior = .never` und ein vorhandenes `viewport-fit=cover` machen nicht automatisch jedes Systempixel für Webinhalt verfügbar. Die reale WKWebView-Fenstergeometrie und Statusleiste müssen im Simulator geprüft werden. **CSS darf niemals die Statussymbole überdecken**, um scheinbar Edge-to-Edge zu erzielen.
4. Der fest positionierte Header wird über seine tatsächliche Höhe gemessen. Eine pauschale zweite Body-/App-Padding-Korrektur oder ein negativer Header-Offset wäre eine Regression.

## Bereits implementiert (nur DAR TEST)
- `test/assets/dar-test-premium-header-v2.js` stellt `window.DARTestEdgeAuditV1.snapshot()` und `.report()` bereit.
- Es misst **erst bei explizitem Aufruf** mithilfe eines sofort wieder entfernten, unsichtbaren Probe-Elements: Dokument-/VisualViewport-Größe, echte CSS-`env(safe-area-inset-*)`, von Native gemeldete Werte, Header, bestehenden Spacer, Navigation und Body-Padding. Keine dauerhafte UI-Änderung oder automatische Event-Schleife.
- Diagnosehinweise betreffen nur geometrische Verdachtsfälle; die Messung **korrigiert nichts automatisch**.
- `test/tools/dar-duo-edge-insets-guard.cjs` ist an den vorhandenen DAR-TEST-Fold-Guard angekoppelt und liest die native Datei **nur**. Nach gesondert genehmigter nativer Reparatur kann `DAR_EDGE_REQUIRE_NATIVE_FIX=1` als striktere Prüfung aktiviert werden.

### Messung in DAR TEST
1. Testseite im betroffenen Gerät/Simulator öffnen (`/test/`, nicht /kids/).
2. Im Web Inspector `DARTestEdgeAuditV1.report()` ausführen.
3. Ausgabe für **Außendisplay Hoch/Quer**, **Innendisplay Hoch/Quer**, iPad Split-View, Android-Fold-/PWA-Größen sammeln.
4. Dabei Header-Oberkante/-Unterkante, tatsächliche OS-Safe-Area, sichtbare Viewportbreite, Seitenränder, Spacer und die fünf Navigationstabs visuell abgleichen.
5. Systemleisten und Betriebssystemreservierungen getrennt vom CSS-Layout bewerten. Keine vermeintlichen „freien Pixel“ außerhalb der WKWebView als CSS-Fläche annehmen.

## Vorgesehener nativer Fix – ausdrücklich NICHT in diesem PR
Aufgrund der Eigentümersperre in `.github/CORE_SECURITY_LOCK.md` dürfen Änderungen an der geschützten, zugleich Standort-/Bridge-relevanten `WebAppView.swift` **nicht** durch diesen allgemeinen Layoutauftrag vorgenommen werden.

Nach **konkreter Freigabe** in einem separaten nativen PR:
- Die erzwungene 59-pt-Mindestoberkante entfernen; die tatsächlichen sicheren Insets anhand des jeweiligen Fensters verwenden, **keine willkürlichen Negativwerte**.
- Nicht nur `top`, sondern `top/right/bottom/left` als gemeinsamen Zustand beobachten; bei Änderungen einer Seite alle Werte synchron aktualisieren.
- Simulator-/WebInspector-Nachweis vornehmen, dass nur der Hintergrund in System-/Sperrflächen reicht, interaktive Elemente aber innerhalb der sicheren Fläche liegen.
- Kompatibilität mit der im **tatsächlich verwendeten** Xcode-Projekt eingestellten SDK-Version prüfen. Nicht aus der installierten iOS-Version auf das Build-SDK schließen.
- Die produktiven `assets/dar-adult-brand-header-v2.css`, Navigation und Spacer danach nur gezielt korrigieren, sofern reale Messungen einen verbleibenden Web-Fehler zeigen; keine zusätzlichen Patch-Layer.

## Abnahme & Nichtziele
Prüfen: 320/360/390/430/600/768/1024 CSS-px, echte Außen-/Innen-/Quer-/Split-View-Zustände, RTL `ar/ckb`, Text-Zoom, Navigation, Tastatur, fünf Tabs, Header/Hero/Scroll-under, Designpaletten und Scrollposition. Keine abgeschnittenen Texte; keine Doppel-Padding- oder Fake-Spacer-Lösung.

Keine Änderung an GPS, Standortberechtigungen, Gebetszeiten, Qibla, Inhalt, Quellenlinks, OneSignal, Kinder-/Admin-App, produktivem `index.html` oder Cloudflare-Deployment. Ein grüner Quelltext-Guard ist kein Beleg für einen erfolgreichen Hardware-/Simulator-Test.
