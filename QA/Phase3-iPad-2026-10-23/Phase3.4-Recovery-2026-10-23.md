# Phase 3.4 – Simulator-Recovery

Zeitpunkt: 2026-10-23, 15:51–15:52 Europe/Berlin  
Projekt: DAR NEXT, Scheme `DARNext`  
Ziel: iPad Pro 13-inch (M5), iOS 27.0, UUID `AA571A77-06F2-4067-9CA5-BE6B170F5119`

## Diagnose

- Xcode meldet nach dem Neustart 27 Ziele; der iPad-Pro-Simulator ist eligible.
- Das aktive Scheme war zunächst `DarAlTawhid`; es wurde auf `DARNext` umgeschaltet.
- `RunProject` meldet einen erfolgreichen Start ohne Buildfehler.
- Die anschließende Device-Interaction bleibt jedoch `NotRun`.
- `xcrun simctl` fällt beim Zugriff erneut mit `CoreSimulatorService connection became invalid` und `Connection refused` aus.
- `launchctl print system` zeigt `com.apple.CoreSimulator.simdiskimaged`; die Unified Logs zeigen aktive XPC-Verbindungen von `simdiskimaged`, aber keinen stabilen interaktiven Simulatorzugriff.
- Ein physisches iPad ist in den Xcode-Zielen nicht vorhanden; verfügbar ist nur ein physisches iPhone.

## Interaktive Abnahme

Nicht als bestanden gezählt: Portrait/Landscape-Navigation, Bibliothek/PDF, Quiz-Ergebnis, Duʿāʾ, Beiträge, direkte arabische Versnavigation, Neustart, Offline-Suche und Online-Wiederherstellung.

## Entscheidung

**Phase 3 bleibt NICHT ABGENOMMEN.** Die vorhandenen XCResults bleiben unverändert erhalten. Es wurde kein Git-Checkpoint erstellt und Phase 4 nicht begonnen.
