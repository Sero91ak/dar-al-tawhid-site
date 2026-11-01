# DĀR Adhān Cinematic — eigenständiger Simulator-Test

**Nur eine QA-Testhülle, keine zweite veröffentlichte App.** Die SwiftUI-Ansicht wird direkt aus dem Hauptprojekt eingebunden: `../DarAlTawhid/DarAlTawhid/DarAdhanCinematicDemo.swift`.

## Direkt auf dem Mac testen

1. `brew install xcodegen` (nur falls nicht vorhanden).
2. Im Branch `feature/ios-adhan-cinematic-simulator-20261101`:
   ```bash
   cd ios/AdhanCinematicPreview
   xcodegen generate
   open DarAdhanCinematicPreview.xcodeproj
   ```
3. In Xcode Scheme `DarAdhanCinematicPreview`, Configuration `Debug` und gewünschten iPhone-/iPad-Simulator wählen.
4. `⌘R` drücken. Sofort erscheint die Cinematic-Vorschau mit fünf Gebeten, Arabisch, Lautschrift, Erinnerung und Medienimport.

## CI-Build herunterladen und im Simulator installieren

Falls GitHub Actions ein `DarAdhanCinematicPreview-simulator.zip` als Artefakt erzeugt, dieses auf dem Mac entpacken, dann:
```bash
xcrun simctl install booted "/PFAD/DarAdhanCinematicPreview.app"
xcrun simctl launch booted de.daraltawhid.cinematicpreview
```

Die fünf Runway-Clips werden aus dem laufenden Simulator über **Video importieren** oder über den App-Container eingefügt. Ohne importierte MP4 wird eine klar bezeichnete Hintergrundvorschau angezeigt; das ist **nicht** das finale Originalvideo. Hinweise zu den genauen Original-Runway-Task-IDs: `../DarAlTawhid/ADHAN-CINEMATIC-SIMULATOR-TEST.md`.

Der Code enthält bewusst **keine** automatische AlarmKit-Auslösung, keine Push-Veränderung und keine Modifikation an der echten Besucher-App-UI.
