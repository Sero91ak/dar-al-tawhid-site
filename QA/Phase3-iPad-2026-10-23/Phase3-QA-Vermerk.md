# DĀR NEXT – Phase-3-QA-Vermerk

Datum: 2026-10-23  
Ziel: iPad Pro 13-inch (M5), iOS Simulator 27.0, UUID `AA571A77-06F2-4067-9CA5-BE6B170F5119`

## Nachweisbare Ergebnisse

- Portrait-Dashboard geprüft und Screenshot archiviert.
- Landscape-Dashboard geprüft und Screenshot archiviert.
- Navigation zu Qurʾān geprüft; Katalog zeigt 114 Sūren.
- Qurʾān-Leseansicht geöffnet; arabischer RTL-Text und Versreferenzen sichtbar.
- Globale Suche geöffnet.
- Arabische Eingabe `ٱلْحَمْدُ` nach Normalisierungsfix: 28 Treffer; `Qurʾān 1:2` enthalten.
- Original-Qurʾāntext blieb unverändert; Normalisierung betrifft ausschließlich Indexfelder.
- Neuer Build mit Regressionstest: erfolgreich, 1,875 s; Log `Build-2026-10-23_15-30-05.log`.
- Neuer kombinierter Lauf: 7/7 bestanden, 0 fehlgeschlagen, 0 übersprungen; `Test-DARNext-iPad-2026-10-23_15-30-28.xcresult`.
- Neuer separater Unit-Lauf: 5/5 bestanden; `Unit-DARNext-iPad-2026-10-23_15-31-30.xcresult`.
- Neuer separater UI-Lauf: 2/2 bestanden; `UI-DARNext-iPad-2026-10-23_15-31-34.xcresult`.
- Die sieben Tests liefen ohne parallele Testausführung im aktiven DARNext-Testplan.

## Korrekturen

- Qurʾān-spezifische Unicode-Markierungen werden beim Indexieren entfernt; Index-Fingerprint auf v3 erhöht.
- Arabische Alif-/Waw-/Ya-Varianten werden im Index vereinheitlicht.
- Treffer mit stabiler Dokument-ID `quran-<sura>-<ayah>` öffnen nun die passende Sūrah und fokussieren den Treffer-Vers.

## Offene Nachweise / Blocker

Phase 3.4: Xcode wurde kontrolliert geschlossen und erneut geöffnet. Xcode listet danach 27 Ziele und den iPad Pro 13-inch (M5), iOS 27.0, wieder als eligible. Beim tatsächlichen Start fällt der CoreSimulatorService jedoch weiterhin mit `Connection invalid`/`Connection refused` aus; `launchctl` findet den Dienst weder im System- noch im GUI-Domain. Die Device-Interaction-Session blieb `NotRun`. Deshalb konnten die interaktiven iPad-Nachweise nach dem letzten Build nicht erstellt werden. Bereits archivierte Screenshots stammen aus der vorherigen erfolgreichen iPad-Session; sie werden nicht als Nachweis für die neue Direktnavigation gewertet.

Der Offline-Netzschalter wurde nicht simuliert; App-Neustart und echte Netzwerkunterbrechung sind daher offen. PDF-Reader und Bibliotheks-/Quiz-/Duʿāʾ-/Beitragsflows sind im Code vorhanden, aber nach dem letzten Build noch nicht interaktiv auf dem Simulator abgenommen.

Die Zeichenfolge `ٱلحد` ist kein diakritikfreies Äquivalent von `ٱلۡحَمۡدُ`: sie lässt den Buchstaben م aus. Sie liefert aktuell 10 valide Treffer und nicht Qurʾān 1:2. Der dauerhafte Regressionstest verwendet deshalb die semantisch korrekte markierte und unmarkierte Form (`ٱلْحَمْدُ` / `الحمد`) mit 28 Treffern und dokumentiert `ٱلحد` separat.

## Freigabeentscheidung

**PHASE 3: NICHT ABGENOMMEN.** Die automatischen Tests und der Build sind bestanden; die interaktive iPad-/Restart-/Offline-Abnahme bleibt wegen des CoreSimulatorService-Abbruchs offen. Ein physisches iPad ist in Xcode nicht verfügbar. Phase 4 wurde nicht begonnen und es wurde kein Git-Checkpoint erstellt.
