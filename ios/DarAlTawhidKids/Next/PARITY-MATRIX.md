# KIDS NEXT · Paritätsmatrix, Ausgangsaudit 26.10.2026

Kein Feld mit "geprüft" bezeichnen, solange keine native Xcode-/Simulator-Sicht- oder Audio-/Interaktionsprüfung stattgefunden hat. "Bridge referenziert" bedeutet **nicht** fachlich/optisch migriert.

| Bereich / Vertrag | Kanonische Ausgangsdateien | Stand Next-Simulator | Pflichtnachweis |
| --- | --- | --- | --- |
| WKWebView-KIDS-Origin / Routing | ios/DarAlTawhidKids/DarAlTawhidKids/{KidsAppShell,KidsWebAppView}.swift | Existing read-only bridge eingebunden, Test-Origin fest | Build, Deep Links, kein Live-Fallback |
| Ursprüngliche KIDS-Startseite | kids/index.html, kids/start.html, kids/shell.html | nur Staging-Webadapter, KEINE native 1:1-Reimplementierung | Screen-Vergleich beide Geschlechter/Altersstufen, Interaktion |
| Originale Profile/Junge/Mädchen/Avatare | kids/KIDS-DESIGN.md, kids/parents-dashboard-v1432.js, kids/kids-girl-palette-authority-v1427.css | Webadapter, SwiftUI-Migration offen | Profilwechsel, Theme, persistente Daten, Mädchenbedeckung |
| UI-Altersstufen | kids/KIDS-DESIGN.md, kids/kids-birth-month-v1431.js | Mapping noch nicht belegt | 4–5 / 6–8 / 9–10 UI und YYYY-MM lokal |
| Quiz / Startseiten-Link | kids/quiz-library.js, kids/data/quiz-kids.json, kids/tools/test-quiz-home-entry-v1450.cjs | Webadapter, native Quiz-Engine NICHT eingebaut | Antippen, Ladevorgang, Retry, Runde, Lernstand |
| Quiz Soll-/Ist-Bestand | kids/data/quiz-kids.json | GitHub JSON-Audit: 900 items, davon 900 published+reviewStatus=approved+verification=approved; 300 je Quiz-Altersband laut deklarierter Policy | Lokaler Neu-Audit IDs/Bänder, Fehler/Dubletten |
| Quiz Voice/ElevenLabs V4 | kids/data/quiz-audio.json, kids/quiz-v4-bridge.js, kids/quiz-owner-voice.js | bestehender Bridge-Code; tatsächliche MP3-/Sprechtextabdeckung NICHT hier nachgewiesen | lokale Manifestprüfung, echte Dateiexistenz, Prüfsummen, Hörproben |
| Duʿāʾ | kids/data/dua-kids.json, kids/TERM-LEARNING-POLICY.md | GitHub JSON-Audit: 120 Duʿāʾ-Items, nur Webadapter | Arabisch/Lautschrift/Deutsch, segmentierte Einzelwort-/Langsam-Audios |
| Qurʾān / Rezitation | bestehende KIDS-Qurʾān-Module | Webadapter | unveränderte autorisierte Rezitator-Dateien, Audio / Wortanzeige |
| Hörbücher/Propheten/Ṣaḥābah/Ṣaḥābiyyāt/Salaf | kids/KIDS-DESIGN.md, Story-/FollowReader-Module | Webadapter | Hören & Mitlesen/Hören/Lesen, Resume, Quellen keine Links |
| Akademie / Wochenlernplan | kids/akademie/index.html, Curricula | Webadapter | echte Inhalte, altersgerechte Bedienelemente, Freischaltlogik |
| Eltern / lokale Kinderdaten | kids/parents-dashboard-v1432.js, Kids-Konto-/Altersroutinen | Webadapter nur Testdaten | gesperrte Funktionen, keine Auth-Umgehung |
| Audio Native Now Playing / Remote | ios/DarAlTawhidKids/DarAlTawhidKids/KidsWebAppView.swift | geteilter KIDS-Bridge-Code eingebunden, NICHT ausgeführt | Remote Events, Bluetooth, Lock Screen, interruption, Hintergrund |
| Offline und Downloads | kids/sw.js, kids/item-offline-v1.js | Webadapter, kein neuer nativer Offline-Pack-Manager | Flugmodus, Neustart, Audio |
| iPhone/iPad/iPhone Duo | SwiftUI + WKWebView, Projektmatrix | XcodeGen spec und automatisierbarer Simulatortest bereit; KEIN Laufnachweis | Duo 27.1 Posen/Safe Areas, iPad Multitasking, iPhone |
| Accessibility/Kinder-UX | kids/KIDS-DESIGN.md | unverändert referenziert, keine native Abnahme | VoiceOver, Reduce Motion, Dynamic Type, Touch, Auswahlmenüs |
| Datenschutz / Review | Apple Kids Category Guidelines, bestehende KIDS-Regeln | eigenständiges Debug-Bundle, kein Tracking ergänzt | Elternsperre, Links, Berechtigungen, Privacy Manifest |
| Store-/Live-Schutz | KIDS.md, AGENTS.md, scripts/app-lane-guard.js | separater Branch und Bundle-ID | GitHub Vergleich: kein Produktionscode verändert |

**Technische Trennung:** Der Simulator nutzt zunächst die bestehenden geprüften Swift-Dateien nur als Source-Referenz. Die Web-Staging-Origin war in der vorhandenen Creator-README noch nicht endgültig live verifiziert. Ein Start im Simulator beweist nicht, dass der Server oder Quiz/Audios korrekt funktioniert.

**Release-Status: GESPERRT.** Xcode-Builds auf macOS, View-Inventar, Native-Feature-Migration, manuelle Hörproben, Geräteprüfung und End-to-End-Tests stehen aus. Keine Live-/Store-Veröffentlichung ohne dokumentierte 100-%-Funktionsparität und ausdrückliche Freigabe.
