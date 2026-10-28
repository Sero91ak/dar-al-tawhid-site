# Apple-Tab-Bar für DĀR AL TAWḤĪD iOS und DARNext

## Bestätigte Vorarbeit

- `Assets.xcassets/DarNav3D*.imageset`: fünf unveränderte Original-PNG-Dateien
  aus der vorhandenen Besucher-App (`home`, `quiz`, `posts`, `quran`, `more`).
- `DarNativeTabBar.swift`: echte `UITabBar` statt SF-Symbol-Buttons.
  28pt, `UIImage.RenderingMode.alwaysOriginal`, VoiceOver-Beschriftungen,
  separate `selectedImage` und SF-Symbol-Fallback.
- Kontextmenüs über `UIContextMenuInteraction` für das Gedrückthalten.
  Zunächst: Gebetszeiten, Qibla, Suche, Quiz, Feed, Duʿāʾ und Qurʾān.
  **Vollständige Parität mit allen bisherigen Web-Schnellaktionen ist
  noch anhand der Web-Menüs und Interaktionen zu prüfen.**
- Die Datei ist nun ausdrücklich in `DarAlTawhid.xcodeproj` als App-Source
  registriert (nicht in Widget-, Kids- oder Push-Targets).
- `DarAppRouter.openNativeTab(_:) ` und
  `openNativeQuickAction(_:) ` verwenden `DarDeepLink.Destination`
  und damit die schon vorhandene `WebAppView.Coordinator.navigate`-Logik.

## Es fehlt noch – nicht als fertig/aktiv ausgeben

**Die native Tab-Bar ist noch nicht in `DarAlTawhidApp.swift` als
sichtbarer Container eingebaut.** Dort wird unverändert nur
`WebAppView` angezeigt. Für DARNext ist im zugänglichen GitHub-Repository
auch kein eigenes Target/Scheme zu finden; dessen lokales Xcode-Projekt
muss über den echten Dateipfad untersucht und separat integriert werden.

Es müssen folgende Punkte zusammen geprüft und implementiert werden:

1. In jedem App-Target **ein** zentrales SwiftUI/UIViewController-Hostlayout
   um die **bestehende** WKWebView schaffen. Kein zweites WebView pro Tab.
   `DarNativeTabBarRepresentable` als Apple-Leiste hinzufügen.
2. `onSelect = { router.openNativeTab($0) }` und
   `onQuickAction = { router.openNativeQuickAction($0) }` nutzen.
   Die Top-Schnellzugriffe als native `UIBarButtonItem`, `UIMenu`
   oder `UIContextMenuInteraction` ausführen, aber dieselben Aktionen
   aufrufen. Fehler-, Berechtigungs- und Login-Fälle unverändert lassen.
3. Die vorhandene Web-Bottom-Navigation **nur in dem neuen, nachweislich
   aktiven nativen Host** ausblenden. Keinesfalls global unter
   `.dar-ios-native-app` ausblenden: ältere Store-Versionen besitzen noch
   keine Apple-Leiste und würden dadurch ihre Navigation verlieren.
   Sichere Freigabe über eindeutige native Build-/Bridge-Kennung.
4. Route-Status in beide Richtungen spiegeln (auch Web-eigene Klicks,
   Zurück, Deep Links, Push-Open, Login-Rücksprung, Navigation per Sprache
   oder Accessibility), nicht nur bei `onSelect`. Eine
   dokumentierte WebView-to-native-State-Bridge verwenden; die
   `WebAppView.swift` ist durch `core-sensitive-change-lock` geschützt
   und darf nicht versehentlich geändert oder die Sperre umgangen werden.
5. iPhone, iPad, iPhone Duo/Fold, Rotation, Multiwindow, iPad Split View,
   Safe-Area, Tastatur, Dynamic Type, VoiceOver und `Reduce Motion`
   prüfen; kein doppelter Bottom-Dock, kein Clipping oder Tinting.
6. Xcode-Build `DarAlTawhid` und lokal `DARNext`, native UI-Tests,
   visuelle Screenshots, dokumentierter Rückbau. Erst danach den
   Umschalter aktivieren und über TestFlight verteilen.

### Wichtige Swift-Anbindung

```swift
DarNativeTabBarRepresentable(
    selectedId: currentTabId,
    onSelect: { router.openNativeTab($0) },
    onQuickAction: { router.openNativeQuickAction($0) }
)
```

`currentTabId` muss aus der **tatsächlichen** aktiven SPA-Route
kommen, nicht nur aus dem zuletzt gedrückten nativen Tab.

### Regel

Keine Änderung an Kids, DAR TEST, Website-Besuchern, Gebets-/Qibla-Engine,
OneSignal oder Push-Berechtigungen für diese iOS-Navigationsmigration.
Native Layoutänderungen benötigen einen **neuen Xcode-Build**. Ein
Cloudflare-Web-Push installiert keine native Apple-Tab-Bar.
