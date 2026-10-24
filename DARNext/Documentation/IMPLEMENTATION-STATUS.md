# DARNext Apple Heritage · Implementierungsstatus

Stand: 24.10.2026 · Arbeitszweig: codex/darnext-apple-heritage-master-v1-20261024

Gesamtstand: P0-Audit abgeschlossen. P1 Design Foundation und die drei nativen Referenzbereiche sind im isolierten Xcode-Arbeitsstand weiterentwickelt; Build und bestehende Tests erfolgreich. P1/B bleibt bis zur visuellen iPhone-/iPad-Abnahme und Repository-Synchronisierung offen; der Reader ist funktional erweitert, die Geräteabnahme bleibt separat.

| Phase | Status | Nachweis |
| --- | --- | --- |
| P0 Baseline-Audit | abgeschlossen, lokal | DARNext-Target/Scheme, Bundle-ID, Deployment Target, Ziele, Ressourcenbestand, ContentRepository und Tests geprüft; keine produktiven Targets geändert |
| P1 Design Foundation | implementiert, lokal getestet | zentrale Heritage-Tokens in DARTheme.swift; Nachtbibliothek, Pergament-Leser und Tiefblau/Messing; persistierte Erscheinungsbildwahl; bestehende UI-Aliase erhalten |
| P1/B Dashboard | funktionsfähig, lokal getestet | bestehendes LocalContentRepository, echte Tages-Āyah/Empfehlung, Hero-/3D-Medien, Navigation und Statuskarten |
| P1/B Wissenschaftsblatt | funktionsfähig, Quellenzuordnung offen | native Post-Detailansicht, Textauswahl, Share Sheet; /q/ wird nur bei expliziter kanonischer Registry-Zuordnung verwendet |
| P1/B Muṣḥaf-Leseraum | funktionsfähig, lokal getestet | 114-Sūren-Katalog, lokale Āyah-Daten, RTL-Arabisch, Übersetzung, Scroll-Fokus und bestehende Audioengine |
| P2–P5 | offen | Suche/Quellenpanel, vollständige Registry-/Delta-Synchronisierung, neun Sprachen, Apple-Systemintegrationen und Geräte-/Accessibility-QA folgen schrittweise |

## P0 — Audit

- Xcode-Projekt: DarAlTawhid.xcodeproj.
- DARNext ist ein separates Application-Target mit DARNextTests und DARNextUITests.
- Aktives Scheme/Testplan: DARNext.
- Bundle-ID: com.daraltawhid.darnext.DARNext.
- Deployment Target: iOS 27.0; Zielgerätefamilie iPhone/iPad.
- Aktives Simulatorziel: iPhone Duo, iOS 27.1. Weitere iPhone-, iPad- und physische iPhone-Ziele sind in Xcode verfügbar.
- Es wurden keine Änderungen an produktiver iOS-App, Website, Kids-, TV-, Watch- oder Push-Infrastruktur vorgenommen.
- Der bereitgestellte Xcode-Arbeitsordner ist kein eigenständiger Git-Checkout. Lokale DARNext-Änderungen wurden daher nicht durch Reset/Stash überschrieben und werden nicht als fiktive Quellcode-Commits ausgegeben.

## P1 — Design Foundation

- Geändert: DarAlTawhid/DARNext/DesignSystem/Tokens/DARTheme.swift.
- Kanonische Startwerte: nightInk #091B20, deepEmerald #16372F, antiqueGold #C7A66C, parchment #F1E6D2, inkBrown #76604F, readerInk #18221F.
- Drei Erscheinungsbilder sind zentral definiert; die Auswahl wird über @AppStorage("darnext.appearanceMode") persistiert und im Bereich Mehr ausgewählt.
- Vorhandene Theme-Property-Namen bleiben als Kompatibilitätsalias erhalten, damit bestehende DARNext-Flächen nicht durch eine Massenänderung gefährdet werden.

## P1/B — Quellen- und Reader-Sicherheit

- Geändert: ContentModels.swift, MarkdownContentParser.swift, PostsView.swift.
- Beitragsmodelle besitzen nun eine optionale explizite canonicalQSourceNumber; die Parserlogik akzeptiert nur dieses kanonische Feld.
- Ein beliebiger Post-Identifier oder eine Qurʾān-Ayah-ID erzeugt keinen /q/-Link mehr.
- Für noch nicht zugeordnete Beiträge bleibt der Quellenstatus ehrlich offen; der Share-Text weist auf die fehlende Registry-Zuordnung hin.
- Die kanonische Website-Registry q/_registry/shortlinks.json wurde auf dem Hauptzweig geprüft; eine vollständige DARNext-Bundle-/Delta-Integration ist noch nicht implementiert.

## Nachweise

- Xcode BuildProject(buildForTesting: true): erfolgreich, 0 Fehler.
- Build-Log: BuildProject-Log-20261024-201624.txt.
- Xcode RunAllTests, Scheme DARNext, Testplan DARNext: 7 bestanden, 0 fehlgeschlagen.
- Testresultat: Test-DARNext-2026.10.24_20-16-25-+0200.xcresult.
- Ein echter physischer iPhone-Run, iPad-Run und vollständige visuelle Heritage-Abnahme sind noch offen; ein GitHub-Commit allein installiert keinen neuen Build auf einem Gerät.

## Offene Aufgaben / nächste isolierte Schritte

- Quellenregistry als freigegebenes, versioniertes DARNext-Modell integrieren, ohne /q/-IDs zu erfinden.
- Bookmark-Zustand und vollständige Q-Registry-Delta-Integration ergänzen.
- Muṣḥaf-Leseposition, Bookmark, Transliteration und versgenaue Audio-Steuerung vervollständigen.
- Design-Previews/Screenshots für Nacht, Pergament, Dark/Light, iPhone Duo und iPad erstellen.
- Danach P2–P5 mit neun Sprachen, Offline-/Delta-Sync, Apple-Integrationen, VoiceOver, Dynamic Type, RTL und Geräte-QA bearbeiten.
