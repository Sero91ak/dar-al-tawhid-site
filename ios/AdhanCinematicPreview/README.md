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

**Ab sofort sind alle fünf ursprünglichen Runway-MP4-Dateien bereits im GitHub-Testbranch enthalten.** XcodeGen übernimmt den gemeinsamen Ressourcenordner `../DarAlTawhid/Shared/CinematicMedia/` vollständig ins Simulator-App-Bundle. Die App lädt Fajr, Ẓuhr, ʿAṣr, Maghrib und ʿIšāʾ deshalb direkt beim ersten Start automatisch – ohne Runway, Zusatzdownload oder manuellen Files-Picker. Der optionale Dateiimport bleibt für lokale Vergleichsvideos bestehen. Details und Original-Task-IDs: `../DarAlTawhid/ADHAN-CINEMATIC-SIMULATOR-TEST.md`.

Der Code enthält bewusst **keine** automatische AlarmKit-Auslösung, keine Push-Veränderung und keine Modifikation an der echten Besucher-App-UI.
