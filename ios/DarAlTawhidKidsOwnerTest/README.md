# TAWḤĪD KIDS TEST — Native Ersteller-App (Entwicklungsentwurf)

Eigene native iOS-Testhülle, **nicht** die öffentliche Kids-App.

- Eigenständige Bundle-ID: `de.daraltawhid.kids.owner.test`.
- Sichtbarer App-Name: **TAWḤĪD KIDS TEST**.
- Ausschließlich geschützte Testadresse: `https://dar-al-tawhid-kids-owner-test.sero91ak.workers.dev/kids/start`.
- Zugangsdaten werden in SwiftUI zur Laufzeit eingegeben, nicht in GitHub abgelegt.
- WebKit-Store der separaten Bundle-ID bleibt unabhängig von der Live-App.
- Externe Adressen öffnen außerhalb der Test-App; kein automatischer Live-Fallback.
- Über das XcodeGen `project.yml` auf dem Mac `xcodegen generate` ausführen, Projekt in Xcode öffnen und mit eigenem Signing für dieses Bundle testen.

**Noch nicht signiert, kompiliert oder über TestFlight veröffentlicht.** Vor Installation:
Native Audio-/Mikrofonrechte, Offline/Downloads, externe Medien, App-Switch,
Basic-Auth-Challenges und symbolische Trennung des TEST-App-Icons am iPhone prüfen.
Nicht in App Store Release hochladen; ausschließlich eigener interner Test.
