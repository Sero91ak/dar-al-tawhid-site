# DARNext Apple Heritage · Implementierungsstatus
Stand: 24.10.2026. Dokumentationsstand; **noch kein Clean Build / echter iPhone-Test dieses Designauftrags**.

| Bereich | Ausgangslage | Nächster Nachweis |
|---|---|---|
| Native App / fünf Tabs | DARNext Shell auf Entwicklungszweig vorhanden | Xcode Target/Scheme und echte Navigation prüfen |
| Design Tokens | `DARTheme.swift` vorhanden | Styles, Farben, Typografie und Accessibility prüfen |
| Dashboard | einfache SwiftUI-Ansicht vorhanden | echte Daten, Layout und iPhone-Test |
| Qurʾān | 114 lokale Sūren-Dateien + Katalog im DARNext-Zweig gesichtet | korrekte Darstellung, Offline, Audio und RTL testen |
| Beiträge | 64 lokale Markdown-Dateien gesichtet | native Quelle/Fazit/Teilen, korrekte Quell-URL |
| Duʿāʾ | 97 lokale Markdown-Dateien gesichtet | Parser, Audioasset-Deckung und Lernmodi prüfen |
| Bibliothek | vier zentrale Datenkataloge gesichtet | echte PDF-Pfade und Integrität prüfen |
| Quiz | lokaler JSON-Katalog und Tests vorhanden | Freigabefilter und UI prüfen |
| Suche | lokaler Indexcode vorhanden | richtige Treffer-ID, Arabisch und langsame Geräte prüfen |
| Quelle/URL | `/q/<id>` in Modellen als Risikostelle | kanonische Q-Registry-Daten prüfen und korrigieren |
| Content-Synchronisation | lokales Bundle als Basis; Online-Brücke existiert | Manifest/Delta-Sync/Withdrawn/Auth-Nachweis |
| Mehrsprachigkeit | Ziel neun Sprachen, nicht als fertig verifiziert | UI/Content/RTL/Reviewstatus |
| Push | DARNext-Ende-zu-Ende nicht verifiziert | nur mit Testgeräten/konfiguriertem APNs/OneSignal |
| Gebetszeiten/Qibla | kein gesicherter Live-Wert im Dashboard | Standort/Berechnung/Berechtigung |
| PDF, Audio und Downloads | Basisbestand, Funktionstiefe offen | Asset/Engine und Offline-Tests |
| iPhone/iPad Build/QA | **offen** | realer Clean Build, Build-for-Testing und Geräteabnahme |

## Noch nicht erledigt
- [ ] Ausgangsbranch / lokaler Xcode-Worktree und fremde Änderungen gesichert
- [ ] DARNext-Target, Signing, Entitlements und Resource Membership geprüft
- [ ] P0 Audit dokumentiert
- [ ] P1 Designsystem + drei Referenzseiten vollständig umgesetzt
- [ ] P2 native Wissenschafts- und Lesemodule geprüft
- [ ] P3 kanonischer Sync + Sprachen und Q-Registry geprüft
- [ ] P4 native Systemintegration getestet
- [ ] P5 Accessibility, iPhone Duo, iPad und Offline QA bestanden

## Änderungsprotokoll
- 2026-10-24: Design Master V1 und Xcode-Auftrag auf eigenem DARNext-Dokumentationszweig abgelegt. Kein Produktiv-Deployment oder nachgewiesener Build.
