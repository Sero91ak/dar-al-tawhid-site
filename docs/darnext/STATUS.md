# DARNext — Fortschrittsprotokoll

Masterauftrag: [DARNEXT_MASTER_AUFTRAG.md](DARNEXT_MASTER_AUFTRAG.md)

**Gesamtstand:** P0 und P1 abgeschlossen; P2 und P3 lokal implementiert und getestet; P4 als nächste zulässige Phase offen.

| Phase | Status | Nachweis |
| --- | --- | --- |
| P0 Audit/Sicherung | getestet | DARNext-Target/Scheme/Testplan nachgewiesen; Build-for-Testing erfolgreich; 7/7 Tests bestanden; Arbeitsbranch dokumentiert |
| P1 Medieninventar | getestet | [MEDIA_INVENTORY.md](MEDIA_INVENTORY.md); Asset-/Dimensionsaudit; Build und 7/7 Tests bestanden |
| P2 Native Architektur/Designsystem | getestet (lokaler Xcode-Stand) | Adaptive DARNext-Shell implementiert; Build erfolgreich; 7/7 Tests bestanden |
| P3 Startseite | getestet (lokaler Xcode-Stand) | GitHub-3D-Medien/Hero an DARNext-Startseite angebunden; Build erfolgreich; 7/7 Tests bestanden; Simulator-UI-Prüfung läuft |
| P4 Beiträge/Duʿāʾ/Bibliothek | offen | – |
| P5 Qurʾān/Audio/Tafsīr/Tadabbur | offen | – |
| P6 Weitere Bereiche/Frauen/Ḥadīṯ | offen | – |
| P7 Inhalts-Synchronisierung | offen | – |
| P8 Push und Deep Links | offen | – |
| P9 Qualität/Sprachen/Geräte | offen | – |
| P10 Übergabe | offen | – |

## P1 — Medieninventar

- Inventardatei: [MEDIA_INVENTORY.md](MEDIA_INVENTORY.md).
- 37 DAR-3D-Icons aus `assets/dar-3d-icons/` erfasst; geprüfte Haupticons 256 × 256 px.
- 10 sekundäre UI-Icons, 3 Home-Heros, 3 Beitrags-Heros, 7 Frauenbilder in zwei Varianten, 42 Cover-Quellen und 13 Feed-Hintergrundkategorien katalogisiert.
- Geprüfte Pixelmaße: Mobile-Hero 1072 × 1920, Wide-Hero 2016 × 1152, Study 1376 × 768, Beitrags-Heros 1920 × 1080 bzw. 1376 × 768, Frauen v1223 1376 × 768, Frauen v1224 900 × 506.
- Xcode-Abgleich: DARNext enthält aktuell keine eingebundene Kopie dieser Webmedien; gezielter DARNext-only Import ist für P2/P3 offen.

## P3 — Native Startseite

- Lokale Xcode-Dateien geändert: `DarAlTawhid/DARNext/DesignSystem/Components/DARNextMedia.swift`, `DARQuickAction.swift`, `DarAlTawhid/DARNext/Features/Dashboard/DashboardView.swift`.
- DARNext nutzt vorhandene GitHub-Quellen: 3D-Icons für Beiträge, Duʿāʾ, Qurʾān, Qibla, Gebet und Kalender; vorhandenes Hero-Motiv `hero-mobile-adobe.jpg`.
- Medien werden als native SwiftUI-`Image` über `AsyncImage` geladen, mit Symbol-Fallback bei fehlendem Netz; keine Dummy-Buttons und keine Inhalts-/Push-Änderung.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-194840.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-48-41-+0200.xcresult`.
- Noch offen: lokale Medien-Cache-/Offline-Strategie und iPad-/VoiceOver-Sichtprüfung; diese werden in P7/P9 nachgezogen.
- Remote-Sync-Grenze bleibt wie in P2 dokumentiert; kein fiktiver Quellcode-Commit behauptet.

## P2 — Native Architektur und Designsystem

- Lokale Xcode-Datei geändert: `DarAlTawhid/DARNext/Shell/RootShell.swift`.
- iPhone/iPad-Aufteilung: `TabView` für kompakte Größen, `NavigationSplitView` mit fünf DARNext-Navigationsbereichen für Regular-Size-Class.
- Gemeinsamer `DARNextMiniPlayer` bleibt in beiden Layouts über Safe-Area-Inset erhalten.
- Keine Änderung an produktiven Targets, Web-/Worker-/Push-Dateien, Bundle-ID, Entitlements, Signing oder Store-/TestFlight-Konfiguration.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-194659.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-47-01-+0200.xcresult`.
- Remote-Sync-Grenze: Die GitHub-Branch enthält aktuell keine entsprechende `ios/.../DARNext`-Quelldatei; der Xcode-Stand liegt im isolierten, nicht-Git-Checkout. Deshalb wird kein fiktiver Quellcode-Commit behauptet. Vor P3/P10 ist der lokale Quellstand über den vorgesehenen Repository-Workflow zu synchronisieren.

## Tests und Builds — P1

- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-194504.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen.
- GitHub-Commit des Inventars: `d88f266618b4b1e006c474bb99d57b252e7acde3`.

## P0 — Audit und Sicherung

- Zeitstempel: 2026-10-24, Europe/Berlin.
- Branch: `codex/darnext-native-masterauftrag-20261024`.
- Ausgangs-Branch-Commit vor diesem Statusnachweis: `bebf47c5851e5e15b16f4e7df168dcd745cfa9b4`.
- Lokaler Xcode-Arbeitsordner: isolierter DARNext-Arbeitsstand; der bereitgestellte Ordner ist kein eigenständiger Git-Checkout, daher wurde kein lokaler Checkout/Reset/Checkout-Wechsel ausgeführt.
- Xcode-Projekt: `DarAlTawhid.xcodeproj`.
- Eigenständiges Target: `DARNext` (Application); zugehörig `DARNextTests` und `DARNextUITests`.
- Eigenständiges Scheme: `DARNext`; aktiver Testplan: `DARNext`.
- Aktive Build-Destination: `iPhone Duo` Simulator (iOS 27.1); verfügbare iPhone-, iPad- und physische iPhone-Destinationen wurden von Xcode aufgelistet.
- Bestehende DARNext-Struktur: native SwiftUI-Shell, Dashboard/Hub, Gebet, Qibla, Qurʾān, Duʿāʾ, Beiträge, Bibliothek, Suche, Audio, Quiz, lokale Repository-/Validierungsschicht und Tests.
- Scope-Gate: keine produktiven Targets, Web-/Worker-/Push-Dateien, Kids-/TV-Oberflächen, Bundle-ID, Entitlements, Signing oder Store-/TestFlight-Aktionen verändert.
- Lokale Git-Sicherung: nicht möglich, da der Xcode-isolierte Arbeitsordner kein Git-Repository enthält; kein fremder lokaler Arbeitsstand wurde überschrieben. Die Phasendokumentation wird auf diesem isolierten GitHub-Arbeitsbranch fortgeführt.

## Tests und Builds

- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen, 0 übersprungen.
- Bestanden: 2 UI-Tests sowie 5 DARNext-Daten-/Repository-Tests.
- Nachweisdateien liegen in den Xcode-Action-Artefakten; ein Build-Log und ein `.xcresult`-Bundle wurden erzeugt.

## Offene Punkte

- Der lokale Xcode-Arbeitsstand und der GitHub-Dokumentationsbranch müssen vor dem ersten Quellcode-Commit noch über den vorhandenen Xcode-/Repository-Workflow zusammengeführt werden; kein unbelegter Gleichstand mit GitHub wird behauptet.
- P4 muss Beiträge, Duʿāʾ, Bibliothek, Quellenkarten und native Share-Flows end-to-end an die bestehenden Daten/IDs anbinden; produktive App-Spuren bleiben unverändert.

## Nächste Aktion

P4: Beiträge, Duʿāʾ, Bibliothek, Quellenkarten und Share-Funktionen an echte Repository-Daten binden; danach statische Prüfung, Build, Tests und Status-Commit ausführen.
