# Testmatrix Phase 3.3

| Bereich | Ergebnis | Nachweis |
| --- | --- | --- |
| Unit-Tests, 5 | BESTANDEN (5/5) | `Unit-DARNext-iPad-2026-10-23_15-31-30.xcresult` |
| UI-Tests, 2 | BESTANDEN (2/2) | `UI-DARNext-iPad-2026-10-23_15-31-34.xcresult` |
| Kombinierter Lauf, 7 | BESTANDEN (7/7) | `Test-DARNext-iPad-2026-10-23_15-30-28.xcresult` |
| Build | BESTANDEN | `Build-2026-10-23_15-30-05.log` |
| Arabische Suche `ٱلْحَمْدُ` / `الحمد` | BESTANDEN, 28 Treffer inkl. Qurʾān 1:2 | Unit-XCResult |
| Direkte Trefferöffnung nach letztem Build | OFFEN | CoreSimulatorService-Abbruch |
| Restart mit persistiertem Index | OFFEN | Simulator nicht verfügbar |
| Echte Offline-/Online-Umschaltung | OFFEN | Kein Netzschalter ausgeführt |
| iPad Bibliothek/PDF/Quiz/Duʿāʾ/Beiträge nach letztem Build | OFFEN | Simulator nicht verfügbar |
| Phase-3.4-Recovery | OFFEN | Xcode neu geöffnet; Device-Interaction `NotRun`, CoreSimulatorService `Connection refused` |

Detaildiagnose: `Phase3.4-Recovery-2026-10-23.md`.
