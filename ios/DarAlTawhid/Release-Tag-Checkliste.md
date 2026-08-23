# Release / TestFlight Checkliste

## Vor dem naechsten Upload

- Apple Developer Program ist freigegeben
- `de.daraltawhid.app` bleibt korrekt
- Version nur erhoehen, wenn inhaltlich noetig
- Build-Nummer vor jedem neuen Upload erhoehen
- App startet weiterhin in die Test/Staging-Version
- Apple-Account ist in Xcode unter `Accounts` eingeloggt
- Team ist nicht mehr `Personal Team`, sondern echtes Developer Program Team

## Direkt in Xcode pruefen

- Signing & Capabilities zeigt kein Warning
- Team ist nicht mehr Personal Team-only blockiert
- Archive laeuft erfolgreich
- Organizer zeigt aktuelles Archiv
- `Distribute App` zeigt `App Store Connect` ohne Enrollment-Fehler

## Exakte Reihenfolge nach Freigabe

1. Xcode oeffnen
2. `Settings > Accounts` kurz pruefen
3. Projekt `DarAlTawhid.xcodeproj` oeffnen
4. in `Signing & Capabilities` das richtige Team bestaetigen
5. `Product > Archive`
6. `Window > Organizer`
7. aktuelles Archiv auswaehlen
8. `Distribute App`
9. `App Store Connect`
10. `Upload`
11. Upload bestaetigen und auf Verarbeitung warten

## Direkt in App Store Connect pruefen

- App Name stimmt
- Subtitle stimmt
- Keywords eingefuegt
- Support-URL vorhanden
- Privacy-URL ist erreichbar
- Support-E-Mail stimmt
- TestFlight Text eingefuegt
- Review Notes eingefuegt

## Nach dem ersten Upload

- Build Processing abwarten
- TestFlight Beta App Review absenden
- Interne Gruppe pruefen
- Externe Gruppe erstellen
- Public Link aktivieren
- Einladungstext verwenden
- Build auf iPhone testen, sobald TestFlight verfuegbar ist

## Spaeter vor Live-Version

- App nicht mehr auf Staging, sondern auf Live-App zeigen
- Screenshots final auf Live-Ansichten abstimmen
- Datenschutzseite als echte oeffentliche URL bereitstellen
- nur dann neue Version archivieren und hochladen
