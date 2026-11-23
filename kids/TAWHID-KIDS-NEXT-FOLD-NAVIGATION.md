# TAWḤĪD KIDS NEXT · Systemnative Foldable-Navigation
**29.10.2026 · verbindlicher Nachtrag zum Xcode-Masterauftrag · zunächst Entwicklungs- und Simulatorziel**

## Präzisierung ORIGINAL Apple Systembar mit Search-Lupe

`kids/TAWHID-KIDS-NEXT-APPLE-LIQUID-GLASS-SEARCH.md` hat Vorrang für die endgültige Gestaltung: *nicht nur* adaptive Platzierung, sondern Apple-eigene Liquid-Glass-`TabView`, System-Suche/Lupe (`Tab(role: .search)` und `.searchable` oder systemseitig geprüfte Toolbar-Suche), Original-3D-Bilder und keine Doppel-Tabbar. Der Android-PWA-Fall ist bewusst eine webbasierte optisch/ergonomisch angeglichene Implementierung, kein Apple-Systemwidget.

## 1. Unverhandelbares Ergebnis
Die KIDS-Hauptnavigation ist NICHT als starre, frei positionierte Web-Kapsel in den nativen iOS-Frame zu übernehmen. Auf iPhone Duo muss sie auf allen Anzeigen und Faltposen dem tatsächlichen Apple-Systemverhalten folgen. Die vorhandenen **fünf** Inhaltsziele bleiben IMMER erreichbar:
1. **Heute** — Originalicon \`kids/assets/kids-icons/home-real-v12.png\`
2. **Hören** — Originalicon \`kids/assets/kids-icons/headphones-real-v12.png\`
3. **Lernen** — Originalicon \`kids/assets/kids-icons/learning-book-3d-v1422.png\`
4. **Duʿāʾ** — Originalicon \`kids/assets/kids-icons/dua-real-v12.png\`
5. **Eltern** — Originalicon \`kids/assets/kids-icons/parents-real-v12.png\`

Die Dateinamen sind Referenz-Assets des aktuellen KIDS-Web-Bestands; beim nativen Build tatsächliche Dateien, Auflösungen, freigestellte Transparenz, Farbprofile und Lizenz/Assets-Verfügbarkeit prüfen und in ein separates Next-Asset-Catalog aufnehmen (ohne Originale neu zu erfinden). Systemnavigation **mit eigenen realen 3D-Icon-Images** ist das Ziel; keine generischen SF Symbols/Emojis und keine zweite sichtbare Web-Fünferleiste. Wenn ein bestimmtes Apple-System-Tab-Layout Icon-/Text- oder Platzierungsbeschränkungen hat, sauber dokumentieren und eine echte zugängliche System-Alternative wählen, statt einen unerreichbaren Tab zu verbergen.

## 2. iPhone Duo: System entscheidet über Navigation
**SwiftUI \`TabView\` für die fünf primären Ziele und \`NavigationStack\` bzw. \`NavigationSplitView\` für innere Navigation benutzen.** Dynamische Anzeige vom Apple-System steuern lassen; keine hartkodierte Gerätetypabfrage, absolute Pixelkoordinaten, manuelle "move bar left/right"-Heuristik oder gespiegelte doppelte Navigation.

- **Außendisplay (geschlossen):** vertikal angeordnete System-Tabs im Rand-/Seitenbereich; App-Inhalt füllt die nutzbare Fläche und respektiert asymmetrische Safe Areas.
- **Innendisplay quer (offen):** System-Tabs seitlich. Der genaue Rand kann durch Split View oder System-Ausrichtung wechseln, nicht dauerhaft \`right:0\` erzwingen.
- **Innendisplay hochkant:** entsprechend dem System wieder horizontale Tabs, wenn dort die normale horizontale Darstellung gilt.
- **Teilgefaltet/Buch/Halbaufrichtung/Split View/Rotation:** Tabs und Back-Controls vom System positionieren lassen; Gesten, Scroll, Fokus und die aktive Auswahl erhalten. Der Falz darf keine Interaktion oder Lesefläche verdecken. \`ReservedRegion\` (iOS 27.1+) bzw. \`UIViewReservedRegion\` nur dort verwenden, wo wirklich eigene Zusatzsteuerung nötig ist; mit korrekten SDK-Availability-Guards.
- **Sidebar nur dann**, wenn das System/nutzerseitige Plattformmuster dazu passt; nicht erzwingen, die fünf Ziele dürfen weder verschwinden noch ungeprüft in "Mehr" versteckt sein.
- UI bleibt auf iPhone/iPad mit normalem Adaptive TabView korrekt, große Displays verwenden passende Navigation/Detailhierarchie.
- Für WebKit-KIDS-Module im nativen Next-Build: **Web-KIDS-Tabstrip nur im kontrollierten Next-Container ausblenden**, nie global in der Besucher-Web-App; alle Seiten inklusive WKWebView-Deep-Links auf einen gemeinsamen nativen Tab-/Route-Status abbilden. Navigation aus Web an Native über schema-validierte, allowlisted WKScriptMessageHandler-Nachrichten, keine beliebigen JS-Klicks als Endarchitektur. Keine Navigation, die von einer Demo-Origin auf Live zurückspringt.
- Wenn die iOS NEXT-Hülle noch komplett WKWebView rendert, ist das **keine** systemnative Navigation. Erst eine tatsächlich eingebundene SwiftUI TabView plus kontrollierte WebKit-Integration erfüllt dieses Gate.

Apple-Quellen: https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo ; https://developer.apple.com/videos/play/tech-talks/111461/ ; https://developer.apple.com/videos/play/tech-talks/111462/ .

## 3. Andere Fold-Smartphones
TAWḤĪD KIDS bleibt auf Android zurzeit **Web/PWA**, kein eigenes Kotlin-Nativprodukt. Daher ist eine visuell, ergonomisch und semantisch **platformgerechte Nachbildung in Web/CSS/JS** möglich, jedoch keine Behauptung, dass Web automatisch die echten Android-System-Navigation-Komponenten verwendet.

- Android-native (falls später separat beauftragt): \`NavigationSuiteScaffold\` + \`WindowSizeClass\`/WindowManager/FoldingFeature. Das Framework schaltet Bottom Navigation und Navigation Rail abhängig von Displayfläche, Haltung und Fensterzustand um.
- Android-Web/PWA: \`window.viewport.segments\` und CSS \`env(viewport-segment-*)\` / \`@media (horizontal-viewport-segments: 2)\` usw. verwenden, **nur wenn Browser unterstützt**, sonst sichere Layout-Fallbacks über viewport/media queries und getestete verfügbare APIs. Die \`device-posture\`/FoldingFeature-API nur nach echter Feature-Detection, keine Pseudo-Device-Erkennung per User Agent. Chrome Viewport Segments API wird seit Chrome 138 unterstützt, aber Support nicht für jede Android-PWA/Browserkombination voraussetzen.
- Kompakt/äußeres Display: gut erreichbare fünfteilige Bottom Navigation, wenn Platz und Systemmuster passen; breites geöffnetes Display: ergonomische Navigation Rail an der geeigneten Seite (in Android oft leading) oder native Drawer-Metapher; Book-, Tabletop-, Dual-Pane-/Multiwindow-Modus separat. Nicht stumpf Apple-Duo rechtsseitige Leiste auf Samsung/Pixel/Honor/Motorola/etc. kopieren.
- Auf einem horizontal zweigeteilten Viewport liegen Text, Quiz-Buttons, Audio-Steuerung, Duʿāʾ-Wortsegmente und die gesamten Navigations-Touchflächen entweder vollständig in einem Segment oder werden sinnvoll auf beide Paneele aufgeteilt. Keine Komponente darf über die sichtbare Trennlinie hinweg unbedienbar werden.
- Nach jedem Fold-, Resize-, Orientierungs- und Window-Focus-Wechsel den Layoutzustand responsiv neu messen, ohne die Kinder-Lernsession, Frage, die gerade laufende Rezitation, Audio-Position oder Scrollabsicht zu verlieren.
- Die Produktiv-KIDS-Web-App **erst nach** gesonderter CI-/Android-Browser-/Hardware-Freigabe ändern; diese Entwicklungsregel berechtigt keinen Live-Push.

Google/Chrome-Quellen: https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation ; https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns ; https://developer.chrome.com/blog/viewport-segments-api-shipped .

## 4. Pflicht-Testmatrix / No-Go
Automatisierte Tests und tatsächliche Sichtprüfung je Geschlechterprofil, 4–5 / 6–8 / 9–10 und für jedes Navigationsziel:

| Test | Erwartung |
| --- | --- |
| iPhone Duo außen | Vertikale System-Tabs (nicht eine handgebaute WKWebView-Kapsel); kein Scroll-/Header-Konflikt |
| iPhone Duo innen Querformat | System-Tabs seitlich, alle fünf 3D-Icons, Scroll/Back/Audio |
| iPhone Duo innen Hochformat | Systemorientierte horizontale Tabs, korrekter Safe-Area-Inset |
| iPhone Duo Split View links/rechts | Seitenwechsel automatisch; keine harte Rechtskanten-Annahme |
| iPhone Duo teilweise gefaltet / aufgestellt | Falzvermeidung; fünf Ziele erreichbar; kein Fokus-/Audioverlust |
| Android Fold geschlossen/geöffnet/Hoch/Quer | Bottom oder Rail nach WindowSize, Segment-Fallback getestet |
| Samsung Galaxy Z Fold / Pixel Fold / Honor / Motorola | Testgerät oder Testemulator konkret nennen, Browser/Version dokumentieren; nicht "alle" ohne Hardwarematrix behaupten |
| Gerätewechsel bei laufendem Duʿāʾ/Quiz/Story | exakt ein aktives Audio, gleiche Lernfrage, kein Reset/Restart |
| Accessibility | Screenreaderlabels, Fokus-Reihenfolge, VoiceOver/TalkBack, Touchziele, Dynamic Type, Reduced Motion |

**Abschluss blockieren**, wenn (a) iPhone Duo Tabs nur per CSS statt \`TabView\` bewegt werden, (b) zwei Leisten gleichzeitig sichtbar sind, (c) Originalbilder/3D-Icons fehlen, (d) wichtige Buttons über Falz liegen, (e) faltbedingter Audio-/Fortschrittsverlust eintritt oder (f) Tests/echte Gerätedaten fehlen. Bei fehlender Hardware "nicht getestet" statt "bestanden" dokumentieren.

## 5. Bild-/Designprototyp
Die interaktive HTML-Vorschau kann die seitliche/unten angeordnete Navigation **nur simulieren**. Sie ist kein Nachweis für native Apple-/Android-Systemintegration. Im separaten KIDS NEXT-Preview vier Zustände sichtbar machen: Außen, Innen quer, Innen hoch, Halb gefaltet, jeweils für Duo und Android Fold. Einen Screenshot/UI-Test pro Pose bereitstellen. Niemals diese Demo CSS-Positionierung als Produktions-SwiftUI integrieren.
