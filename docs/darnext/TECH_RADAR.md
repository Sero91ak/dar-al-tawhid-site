# DARNext Technology Radar

Stand: 2026-11-22 · Gilt für den erhaltenen erweiterten SwiftUI-Quellstand, nicht pauschal für die anderen Apps.

## Verifizierte lokale Basis

- Installiertes Xcode: **27.2**, Build **27B52** (xcodebuild -version).
- Compiler-/Swift-Versionsabfrage ist in diesem Lauf mit Systemfehler 28 fehlgeschlagen, nachdem der freie Speicher auf 115 MiB gesunken war. Deshalb wird keine konkrete Swift-Compiler-Version behauptet.
- DARNext-Projektkonfiguration: SWIFT_VERSION = 5.0; DARNext-App-Targets setzen IPHONEOS_DEPLOYMENT_TARGET = 17.0.
- Verifizierter Simulator: iPhone 18 Pro Max und iPad Pro 13-inch M5, iOS 27.2.
- Der erweiterte DARNext-Build und seine 52 Unit-Tests liefen in diesem Arbeitszyklus erfolgreich; iPhone-/iPad-Hero- und Scroll-UI-Tests bestanden. XCTHitch-Metrik blieb leer. Kein Performancebudget in FPS oder Millisekunden ist damit abgenommen.

## Radar

| Status | API/Baustein | Verwendung im Bestand | Bewertung / nächste Prüfung |
|---|---|---|---|
| Adopt | SwiftUI NavigationStack, TabView, ScrollView und bestehende Navigation-Owner | Shell, Detailpfade und Inhaltslisten | Architektur erhalten. Änderungen nur am jeweiligen Feature-Owner; Back-/Scrollzustand mit echten UI-Assertions prüfen. |
| Adopt | Gemeinsame DARMotion-Tokens und Reduce-Motion-Abfrage | DARMotion.swift kapselt Springs, Ein-/Ausblenden und Accessibility-Verhalten. | Bestehende Tokens erweitern, keine parallelen Feature-Zeitwerte einführen. Systemweite Reduce-Motion-Schalterung gehört in die UI-Abnahme. |
| Adopt | ImageIO-Downsampling und begrenzter asynchroner Bildcache | DARNextRemoteImage in der Bildpipeline; Remote-Bilder für Hero-/Kartenflächen. | Inhalt, Fallback und Cancellation erhalten. Lastmessung sowie Speicher-/Hitchvergleich bleiben offen; bestandene Scrollgesten allein reichen nicht. |
| Adopt mit Fallback | iOS-18-Scroll-Geometrie für kollabierende Titel | DARMotion.swift verwendet onScrollGeometryChange unter #available(iOS 18.0, *); iOS 17 behält den erweiterten Titel. | Bestehenden Fallback erhalten. iOS-17-Runtime-/Screenshottest und iOS-18+-Layout separat abnehmen. |
| Adopt mit Fallback | iOS-18 Zoom-Navigation | darMatchedTransitionSource und darZoomNavigationTransition kapseln matched transition source und navigationTransition(.zoom(...)) hinter iOS-18-Verfügbarkeit. | Nur in getesteten, stabil-ID-basierten Quellen nutzen; Zurücktransition, Reduce Motion, VoiceOver und iOS-17-Fallback prüfen. |
| Adopt | accessibilityReduceMotion, stabile Accessibility-IDs, contentTransition(.numericText()), symbolEffect | Bereits in Shell, Dashboard, Beiträge und Qurʾān eingesetzt. | Bei jeder neuen Motion prüfen, ob sie den Statusinhalt semantisch erhält. Accessibility-Labels/IDs nicht zur visuellen Implementierung verändern. |
| Assess | UIKit-/SwiftUI-Brücke für Bilddekodierung und Cachekosten | UI bleibt SwiftUI; Bildtransport/Decode nutzt Apple-Frameworks im Image-Cache. | Auf Main-Actor-Arbeit, Cancellation, Speichergrenze und Mehrfachanfragen profilieren, bevor die Architektur geändert wird. |
| Assess | Instruments Animation Hitches und Simulator-Performance | Verfügbare Simulator-XCTest-Läufe liefern keine Hitch-Metrik ([]); frühere Graphics-Instrument-Abfrage meldete, dass Hitches auf diesem Simulator nicht unterstützt werden. | Keine FPS-/Hitchfreiheitsbehauptung ausgeben. Nächster Nachweis benötigt ein auf diesem Ziel unterstütztes Instrument oder ein echtes Gerät; Gerät ist derzeit nicht angeschlossen. |
| Hold | Swift-6-Sprachmodus-Migration, zusätzliche Drittanbieter-Motion-/Bildframeworks, automatische SDK-Upgrades | Keine solche Migration oder neue Abhängigkeit im geprüften DARNext-Stand. | Nicht nebenbei einschalten. Erst vollständige Concurrency-Diagnose, Mindest-OS-/Fallback-Matrix, Lizenz-/Kostenprüfung und separater Pilot-PR. |

## Wartungsregel

Vor jedem Apple-SDK- oder Deployment-Target-Update: Toolchain-/SDK-Version dokumentieren, Änderungen der verwendeten APIs anhand offizieller Release Notes prüfen, Availability und Rückfallpfade kontrollieren, dann auf iOS 17 sowie aktueller Simulatorversion bauen und die Feature-/Accessibility-Matrix ausführen. Neue APIs laufen als kleiner Pilot mit Vorher-/Nachhermessung; ein grüner Build allein ist keine Rollout-Freigabe. Keine automatische SDK-Migration oder Live-Veröffentlichung.

## Offene Nachweise

- swift --version sowie Xcode-/Swift-Releasekanal nach Wiederherstellung des Plattenspeichers erneut erfassen.
- Tatsächlichen Scroll-Hitch-/Framezeitvergleich auf unterstütztem Instrument oder Gerät erheben.
- iOS-17-Laufzeit-Fallbacks, Dynamic Type, VoiceOver, RTL und Reduce Motion auf jedem relevanten Flow nachweisen.
- Diese lokale erweiterte Quelle hat noch keine belegte GitHub-Abstammung; Radar und Produktänderungen müssen vor einem PR an eine sichere Feature-Branch-Basis gebunden werden.
