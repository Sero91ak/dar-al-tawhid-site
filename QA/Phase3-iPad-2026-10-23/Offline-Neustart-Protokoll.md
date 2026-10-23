# Offline-/Neustartprotokoll

Datum: 2026-10-23

Der Suchindex ist persistent unter `Application Support/DARNext/search-index.json` implementiert und wird über einen Fingerprint inkrementell wiederverwendet. Der neue Unit-Lauf bestätigt den lokalen Aufbau und die Suchvarianten.

Die geplante interaktive Sequenz (App beenden, erneut öffnen, Suchindex prüfen, Netzwerk deaktivieren, lokale Inhalte durchsuchen, Netzwerk wiederherstellen) konnte nach dem neuen Build nicht abgeschlossen werden: `CoreSimulatorService` brach ab; `simctl launch` endete mit `Connection refused`. Es wurden keine systemweiten Dienste neu gestartet und keine fremden Prozesse beendet.

Recovery-Versuch Phase 3.4: Xcode wurde kontrolliert neu geöffnet. Die Zielauflistung ist wieder verfügbar, aber `simctl` und Device Interaction verlieren die Verbindung zum CoreSimulatorService. Ein physisches iPad ist nicht angeschlossen.

Status: OFFEN, kein Freigabenachweis.
