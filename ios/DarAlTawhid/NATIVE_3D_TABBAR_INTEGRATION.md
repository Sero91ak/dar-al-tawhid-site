# Native Apple-Tabbar mit Besucher-App-3D-Icons

Die fünf PNGs in `Assets.xcassets/DarNav3D*.imageset` sind **bitidentische Git-Blobs** aus
`assets/dar-3d-icons/{home,quiz,posts,quran,more}.png` der Besucher-Web-App. Nicht aus
`AppIcon.appiconset` laden und nicht als SF-Symbol behandeln.

`DarNativeTabBar.swift` baut eine echte UIKit-`UITabBar` mit 28pt-Grafiken,
`alwaysOriginal`, Beschriftungen und SF-Symbol-Fallback. Bei Verwendung:
`select(id:)` synchronisieren und `onSelect` auf SPA-Zielrouten legen:
home → #home, quiz → #quiz, feed → #feed, quran → #quran, more → #more.
Die URL-Route am echten Web-SPA-Router prüfen. Dabei **nur eine** sichtbare
Navigation anzeigen: die bestehende Web-Bottom-Nav muss im nativen WKWebView
kontextbezogen unsichtbar werden (nur für iOS-Hülle, nicht für Web-Besucher).
Safe Areas und Tastatur-Inset beachten. Bei internem HTML-Routing die aktive
UITabBar-Selektion aktualisieren.

## Kein verdeckter Live-Claim

Die aktuelle `DarAlTawhidApp.swift` instanziiert ausschließlich
`WebAppView`. `DarNativeTabBar.swift` ist bisher nicht in der aktiven
Xcode-Target-Source-Liste registriert; dieses Asset-/View-Paket aktiviert
**noch keine** native Leiste. Integration gehört in das echte Xcode-DARNext
Target und erfordert Simulator-Abnahme sowie einen neuen iOS-Build.
`WebAppView.swift` ist durch Core-Sensitive-Lock geschützt: nicht
außerhalb des genehmigten Änderungswegs bearbeiten.

Abnahme: auf iPhone und iPad alle fünf Assets ohne Blaufärbung und ohne
Abschneiden sichtbar; native Nav und Webnavigation nie doppelt; Buttons
leiten jeweils zur richtigen Route; Back, Deep Links, Login, Webview-Reload,
Rotation, Stage Manager und VoiceOver geprüft.
