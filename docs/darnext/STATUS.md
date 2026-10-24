# DARNext — Fortschrittsprotokoll

Masterauftrag: [DARNEXT_MASTER_AUFTRAG.md](DARNEXT_MASTER_AUFTRAG.md)

**Gesamtstand:** P0 und P1 abgeschlossen; P2 als nächste zulässige Phase offen.

| Phase | Status | Nachweis |
| --- | --- | --- |
| P0 Audit/Sicherung | getestet | DARNext-Target/Scheme/Testplan nachgewiesen; Build-for-Testing erfolgreich; 7/7 Tests bestanden; Arbeitsbranch dokumentiert |
| P1 Medieninventar | getestet | [MEDIA_INVENTORY.md](MEDIA_INVENTORY.md); Asset-/Dimensionsaudit; Build und 7/7 Tests bestanden |
| P2 Native Architektur/Designsystem | offen | – |
| P3 Startseite | offen | – |
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
- P2 muss den DARNext-eigenen Ressourcen-/Asset-Pfad und das gemeinsame native Designsystem aus dem Inventar aufbauen; produktive App-Spuren bleiben unverändert.

## Nächste Aktion

P2: DARNext-eigenen Ressourcenpfad und SwiftUI-Designsystem/Navigation erweitern; danach statische Prüfung, Build, Tests und Status-Commit ausführen.
