# TAWḤĪD KIDS NEXT · ORIGINAL Apple Liquid Glass TabView + Suche / Android-PWA-Parität
Datum: 29.10.2026 · **Verbindliche Erweiterung**, keine App-Store-Freigabe.

## Produktentscheidung
**Originale Apple-Navigationskomponenten, nicht selbst konstruierte Liquid-Glass-Kapsel**, auf iOS:
- SwiftUI \`TabView\` als einzig sichtbare Hauptnavigation, gegebenenfalls \`UITabBarController\` in UIKit-Integrationen; \`NavigationStack\` / \`NavigationSplitView\` für Unterseiten und iPad. Xcode 27.1/aktuelles SDK verwenden. Native Liquid-Glass-Anmutung automatisch durch das Betriebssystem; NICHT per Custom CSS-, Blur-, Fake-Glass- oder Overlay-Tabbar überschreiben.
- Fünf bestehende Hauptziele EXAKT erhalten: **Heute / Hören / Lernen / Duʿāʾ / Eltern**. Kein verwaistes sechstes inhaltliches Tab und kein doppelter WKWebView-Dock.
- Zusätzlich eine **echte System-Lupe als Suchen**. Bevorzugt auf aktuellem iOS: semantische SwiftUI-\`Tab(role: .search)\` und \`.searchable(...)\` auf dem \`TabView\`, wodurch iOS die Suche automatisch getrennt an der trailing Seite platziert. Apple unterscheidet dedizierten Such-Tab und Toolbar-Suche. Wenn die im Test verifizierte Tab-Geometrie/Overflow auf dem Duo die fünf Hauptbuttons unzugänglich macht, stattdessen systemeigene \`.searchable\` Toolbar-Suche mit \`.searchToolbarBehavior(.minimize)\` wählen; dieses Verhalten nicht durch Fake-CSS-Lupe lösen.
- Suche ist **funktional**: über freigegebene KIDS-Quizfragen, Duʿāʾ, Geschichten, Salaf, Akademie und derzeit tatsächlich aktivierte KIDS-Inhalte suchen. Arabische Schrift mit Tashkīl, deutsche Stichwörter und lateinische Lautschrift beachten; Ergebnisse alters-/profilgerecht, Quellen kinderfreundlich nur als unanklickbarer Text, keine externen Links oder unreviewten Treffer. Datenschutz: lokale Suche oder erlaubte minimale KIDS-Datenquelle, keine Kinder-Queries an externe KI/Suchdienste.
- Für die fünf Tabs die **originalen KIDS-3D-Bilder** verwenden: \`kids/assets/kids-icons/home-real-v12.png\`, \`headphones-real-v12.png\`, \`learning-book-3d-v1422.png\`, \`dua-real-v12.png\`, \`parents-real-v12.png\`. Unveränderte Pixel/Transparenz; native Asset Catalogs. Für SwiftUI-Bilder \`Image(...).renderingMode(.original)\`, für UIKit \`UIImage.RenderingMode.alwaysOriginal\`, wo vom Tab-API respektiert. iOS darf Systembar-Items dennoch skalieren/tinten; echte Sichtprüfung auf Ziel-iOS nötig. Nicht behaupten, Systemtabs garantiert identische 3D-Pixelgröße, Haptik oder Schatten wie Web-CSS wiedergeben. Keine Ausweich-SF-Icons als angeblich ursprüngliche Designs.
- Berücksichtigen, dass iOS bei zu wenig Platz Tab-Elemente in Overflow verschieben kann. Alle fünf Hauptziele und Suche müssen jederzeit über offensichtliche kindgerechte Systeminteraktion erreichbar bleiben. VoiceOver-/Lupen-Labels: \`Suchen\`, Tablabels korrekt.
- Tabwechsel über EINE SwiftUI-SelectedTab-State-Machine und typisierten, erlaubten Bridge-Routen in bestehende WKWebView-Module; keine pro Tab eigenständig tonabspielenden WKWebViews, keine Duplikate der Audio-Engine, kein unkontrolliertes Neuladen von Duʿāʾ/Quiz/Story bei Auswahlwechsel.
- Bei WebKit-KIDS-Modulen die alte Floating-HTML-\`.bottom-nav\` **nur im isolierten KIDS-NEXT-IOS-Container** unterdrücken und systemnative Tabs vorlagern; die produktive Web-/Android-PWA behält ihre Navigation. Keine Änderungen an \`de.daraltawhid.kids\` ohne separate Freigabe.

## Native Layout-Regeln nach Apple iPhone Duo
- Geschlossenes **Außendisplay**: Apple legt Tabs / Navigation in den vertikalen Randbereich, nicht zwingend unten. Nicht hardcoden; bei RTL ggf. leading statt trailing.
- Innen **aufgeklappt Querformat**: vertikale System-Tab- bzw. Sidebar-Darstellung gemäß pose, Window Size und Nutzerkontext; in Split View kann die Leiste an beiden seitlichen Fensteraußenkanten liegen.
- Innen **aufgeklappt Hochformat**: Systemtab-Leiste darf horizontal werden. Systementscheidung respektieren, nicht manuell ein vertikales CSS-Rail aufzwingen.
- **Halb gefaltet, Split View, Live Activity, vertikale Dynamic Island**: Apple-Hardwarebereich und Safe Areas automatisch frei halten; zugängliches Overflow und beschränkter Platz testen. Nie Interaktion/Audio/Fortschritt verlieren.
- **iPad**: echte adaptive Systemnavigation, möglichst TabView und Sidebar ohne eigene Fake-Leiste; Suche iPad-systemgerecht sichtbar.
- **Xcode 27.1-Simulator und echte Hardware** als verpflichtende Gates; Simulator kann die Sicht-/Audioprüfung echter Geräte nicht ersetzen.

## Android Web/PWA – ehrliche Plattformgrenze
- Die PWA kann **KEIN** echtes SwiftUI \`TabView\`, \`TabRole.search\`, \`UITabBar\` oder Apple-iOS-System-Liquid-Glass darstellen. Sie bekommt eine **qualitativ entsprechende, ausdrücklich webbasierte** Glas-/Navigationskomponente mit exakt den fünf Originalbildern, identischen KIDS-Zielen, Suchlupe, deutscher Beschriftung und gleicher aktiver Route. Die Suche darf nicht dekorativ sein; sie verwendet denselben genehmigten KIDS-Katalog wie iOS.
- Android-Foldables: Bottom-Bar auf kompakten Außenfenstern; Leading/Trailing Rail in breiten geöffneten Fenstern, abhängig von Plattform-Konventionen, bevorzugter Lesehand/Fenstergröße, kein festes "immer rechts". Tablet, Desktop-PWA und Multiwindow entsprechend adaptiv.
- Wenn unterstützt: \`window.viewport.segments\` und \`env(viewport-segment-*)\` / segment media queries sowie device posture; andernfalls \`ResizeObserver\`, viewport und Media Query mit robustem Fallback. Keine Annahme einer unveränderlichen Gerätebreite, keinerlei Bedienelemente über der Knickstelle.
- Glasdarstellung GPU-schonend, kontraststark, ohne transparente Texte über unruhige Hero-Motive; CSS \`backdrop-filter\` nur progressiv verbessert, Fallback mit undurchsichtigem Hintergrund. Reduzierte Bewegung und korrekte Screenreader-Semantik.

## Abnahme-Gates
1. **Echte iOS \`TabView\` sichtbar**; nach Posewechsel links/rechts/unten gemäß iOS, keine selbstgebastelte SwiftUI-/Web-Leiste, keine zweite HTML-Fünferleiste.
2. **Alle fünf ORIGINAL-3D-Icons** gerendert; aktive Auswahl, Labels, Touch, Bildschirmskalierung und Kontrast stimmen. Lupe ist eine echte Apple-Suche (nicht nur \`Image(systemName:"magnifyingglass")\` ohne Funktion).
3. Alle KIDS-Suchen liefern fachlich freigegebene Resultate. Fehler, Offline, leere Treffer und Sprachen geprüft.
4. Außen, innen hoch/quer, halb gefaltet, Split View, iPad und iPhone: jede relevante Pose inklusive Such-Tastatur, Overflow, Live Activity und Accessibility testen.
5. Android Fold/PWA: fünf Hauptziele, Lupe, Originalicons und adaptive Rail/Bottom-Wahl auf echten Web-Browsern; bei nicht unterstützten APIs Fallback; **nicht behaupten, es sei Apples native Bar**.
6. Audio-Fokus, Duʿāʾ-Wort-Playback, Qurʾān-Lernzustand, Quiz-Frage und Scrollposition über Tab- und Posewechsel erhalten; keine neuen ElevenLabs-Kosten.
7. Produktivseite, Store-Bundle, Nutzerkonten und bestehende App unverändert, bis explizit nach Freigabe. Bei fehlendem Hardwaretest \`NOT VERIFIED\`, keine 100-%-Freigabe.

## Belegte technische Primärquellen
- Apple Liquid Glass + semantischer Such-Tab: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- Apple SwiftUI TabRole.search: https://developer.apple.com/documentation/swiftui/tabrole/search
- Apple systemeigene Toolbar-Suche: https://developer.apple.com/documentation/swiftui/view/searchtoolbarbehavior(_:)
- Apple TabView und iPhone Duo: https://developer.apple.com/videos/play/tech-talks/111461/
- Apple vertikale Duo-Bars: https://developer.apple.com/videos/play/tech-talks/111462/
- Apple Bild-Originalfarbe: https://developer.apple.com/documentation/swiftui/image/renderingmode(_:)
- Android adaptive Navigation: https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation
- Chrome Viewport Segments: https://developer.chrome.com/blog/viewport-segments-api-shipped

**Status: Anforderungen und Abnahmevertrag. Die native System-TabView mit Search ist im vorliegenden KIDS-NEXT-Scaffold NOCH NICHT fertig implementiert.**
