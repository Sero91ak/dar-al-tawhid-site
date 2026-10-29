# TAWḤĪD KIDS NEXT – START HIER – EIN VERBINDLICHER XCODE-GESAMTAUFTRAG
Stand: 29.10.2026. Entwurfs-/Simulatorauftrag. KEINE Live-, Store-, Merge- oder TestFlight-Freigabe.

## Ziel
Realisiere die bestehende Kinder-App TAWḤĪD KIDS als hochwertige, vollständige SwiftUI-Hybrid-App TAWḤĪD KIDS NEXT. Die aktive bestehende Kinder-App bleibt verbindliche Quelle für alle freigegebenen Texte, Fragen, Originalbilder, 3D-Icons, Profile, islamischen Fachregeln, Rezitationen, Fuṣḥā-Audios, Lernstände und Lernabläufe. SwiftUI und die Apple-Hardware sollen harmonisch, reaktionsschnell und möglichst butterweich funktionieren. Android verwendet vorerst die bestehende Web/PWA mit gleichwertiger adaptiver Navigation, nicht Apples Systemwidget.

## Repository und Schutz
Repository: Sero91ak/dar-al-tawhid-site
Entwicklungsbranch: codex/tawhid-kids-next-recovery-20261029 (oder gesicherter Implementierungsbranch davon)
GitHub-Draft: PR #1520
Produktiver iOS-Bundle-Identifier: de.daraltawhid.kids – strikt unverändert
Eigenes NEXT-Debug-Bundle: de.daraltawhid.kids.next.dev
Eigenes Scheme: TawhidKidsNext
NEXT-Verzeichnis: ios/DarAlTawhidKids/Next/
Quellstände: aktuelles main für aktive KIDS-Inhalte, lokale Xcode-Recovery-Dateien zusätzlich sichern und inhaltlich vergleichen. Der NEXT-Branch kann hinter main zurückliegen: niemals blind die älteren Dateien über die neuere Kinder-App schreiben.

## Verbindliche vollständige Lesereihenfolge
1. kids/TAWHID-KIDS-NEXT-XCODE-AUFTRAG.md
2. kids/TAWHID-KIDS-NEXT-RECOVERY-DESIGN.md
3. kids/TAWHID-KIDS-NEXT-RULES.md
4. kids/TAWHID-KIDS-NEXT-NATIVE-PERFORMANCE-ARCHITECTURE.md
5. kids/TAWHID-KIDS-NEXT-APPLE-LIQUID-GLASS-SEARCH.md
6. kids/TAWHID-KIDS-NEXT-FOLD-NAVIGATION.md
7. kids/KIDS-DESIGN.md, kids/TERM-LEARNING-POLICY.md, KIDS.md, relevante Kids-Kapitel in AGENTS.md, kids/version.json
8. ios/DarAlTawhidKids/README.md, ios/DarAlTawhidKids/CREATOR-TEST-V1.md, ios/DarAlTawhidKids/Next/README.md, ios/DarAlTawhidKids/Next/PARITY-MATRIX.md
9. Wirklich aktuelle Quellcodes, Kinderdatenmanifeste, Asset-Kataloge, vorhandene Tests/Guards sowie lokale Xcode-Projekt- und Simulatorzustände.

Lies diese Dateien vollständig und werte Widersprüche anhand des tatsächlich aktiven aktuellen KIDS-Standes aus. Dies ist ein einziger Auftrag, nicht eine Bitte um Rückfragen pro Modul.

## PHASE A – Zuerst echte Wiederherstellung und Sicherung
- Im lokalen Repository bash ios/DarAlTawhidKids/Next/PRE-FLIGHT.command ausführen.
- Alle Xcode-Projekte, Workspaces, Targets, Schemes, lokalen staged/unstaged/untracked Änderungen, Simulator-UDIDs, installierten Apps, Versionen, Signierungs- und Wiederherstellungsdateien lesend inventarisieren.
- Vor jeder Dateiänderung eine unabhängige, unveränderte Sicherung der maßgeblichen lokalen Recovery-Stände und relevanten App-Assets mit Hash-/Statusprotokoll erstellen. Keine vorhandenen Simulatoren, Profile, App-Daten, Projekte oder Backups löschen.
- Kein git reset --hard, git clean, forced pull/merge, keine Produktivdateien überschreiben, keinen zweiten Store-Account oder neue App-Store-App anlegen.
- Bei Konflikten zwischen main, Entwicklungsbranch und lokalen Wiederherstellungsdateien erst differenzieren, sichern und einen nicht-destruktiven Integrationspfad wählen. Bei nicht sicher lösbarem Konflikt dokumentieren und gezielt stoppen.

## PHASE B – Vollständiges aktuelles Bestandsinventar
- JEDEN aktiven KIDS-Bildschirm und jede Unterseite/Modalansicht, Audio-/Fehler-/Offlinezustände, Scroll-/Tab-/Zurück-Navigation, Originalgrafiken, Profile, Farben, Lern-/Eltern-/Altersregeln, Quellen und Datenidentitäten in ios/DarAlTawhidKids/Next/PARITY-MATRIX.md erfassen.
- Status jeder Funktion: ACTIVE / RETIRED / EXPERIMENT / BLOCKED. kids/version.json kennzeichnet das frühere separate Qurʾān-/Alif-Bāʾ-Lernsystem als deaktiviert; das nicht unbemerkt reaktivieren. Bestehende aktive Qurʾān-/Rezitationswege weiterhin erhalten.
- Den tatsächlichen Quiz-Bestand anhand kids/data/quiz-kids.json neu zählen (historisch 900 approved Datensätze), Duʿāʾ-Bestand neu prüfen (historisch 120) und die echte Audio-Datei-/Manifest-/URL-Abdeckung, nicht nur Textfelder oder deklarierte Zähler, auditieren.
- Alte 450er-Zahlen nicht blind als aktuellen Gesamtbestand verwenden; Altersbänder der UI 4–5/6–8/9–10 und Quiz 4–6/7–8/9–10 erst nach echter Funktionsanalyse mappen.

## PHASE C – Systemnative SwiftUI-Kernarchitektur
- Verwende echte Apple SwiftUI TabView mit systemeigener Liquid-Glass-Darstellung, fünf Original-Zielen Heute / Hören / Lernen / Duʿāʾ / Eltern, originalen farbigen 3D-Iconbildern und echter System-Lupe (SwiftUI Tab(role: .search) + searchable oder native systemkonforme Alternative bei Overflow). Keine Fake-iOS-Glass-Leiste und niemals zwei Tab-Leisten gleichzeitig.
- Alle Geräte und Posen: iPhone, iPad, iPhone Duo Außendisplay/Innendisplay, geschlossen, aufgeklappt, Hoch-/Querformat, Teilfaltung, Split View, Rotation; systemeigene Positionierung ohne hartkodierte Pixelwerte. MacBook ist ein gesondertes Testziel (Web/PWA, optional iPad-on-Mac/Catalyst) und wird nicht durch einen iOS-Build automatisch erfüllt.
- Trenne sauber: KidsContentRepository (freigegebene, versionierte Originalinhalte), KidsSessionStore (Fortschritt/Antwort), KidsNavigationCoordinator (Routes), KidsProfileStore (lokale Daten), KidsAudioCoordinator (ein Audio-Owner), OfflineAssetManager, DesignTokens und eine versionierte, erlaubnisbeschränkte WKWebViewBridge für noch nicht native aktive Bereiche.
- Eine schreibende Zustandsquelle pro Ressource; native Navigation und alter Web-Dock niemals parallel. Keine Doppel-Player, kein unkontrolliertes JavaScript-Klicken, kein ungültiger Live-Origin-Fallback.
- Android Web/PWA: gleiche fünf Original-3D-Icons + funktionierende Lupe, hochwertige Glass-Optik mit barrierefreiem Kontrast; automatisch Bottom-Navigation oder Seiten-Rail nach Fenster/Falzsegment und Browserfähigkeit. Kein Anspruch auf echte Apple-Systemnavigation in der PWA. Änderungen nur im isolierten Preview-/Stagingzweig.

## PHASE D – Vollständige aktive Lern-App
- Startseite: originale freigegebene Hero-Grafik, Salām immer vollständig ausgeschrieben (As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh), Hören/Lernen, originale Profil-Avatare, echte Gebetszeiten in einer durchgehenden Bildbühne, echte Qibla-/Standortregeln.
- Jungen- und Mädchenprofile inklusive aller bestehenden Farbvariationen, Bilder, Profilspeicher und Elternschranken. Mädchenfiguren ohne offene Haare/unbedeckten Hals; Originalbilder nicht durch generische Motive ersetzen.
- Hören: alle aktiven Propheten-, Ṣaḥābah-, Ṣaḥābiyyāt-, Salaf- und Wissensbibliotheken, richtige Cover, Hören & Mitlesen / Hören / Lesen, Wiederaufnahme an letzter Sekunde, erlaubte Quellenhinweise und Offlinefunktion.
- Lernen/Quiz: tatsächliche Akademie, Kategorien und Kursstruktur, altersabhängige UI, alle aktuell freigegebenen Quizfragen, echte Antwortzustände, sofortiges Feedback, Erklärung, Wiederholen, richtig gesteuertes Weiterklicken, gespeicherter Lernstand, Fehler- und Retry-Anzeige statt endlos Laden.
- Duʿāʾ: arabischer Originaltext, korrekt verknüpfte Lautschrift und deutsche Bedeutung, Wort-für-Wort/normal/langsam/wiederholen, echte Original-Fuṣḥā-Audios, segmentierte Mitlesemarkierung nur mit belegbarer Zeitzuordnung. Kein iOS-System-TTS und keine neuen ElevenLabs-Kosten.
- Qurʾān: aktuell aktive, fachlich freigegebene Rezitationen/Lesemodi mit Original-Rezitator, keine KI-Rezitation oder unfreigegebene Reaktivierung archivierter Lerner.
- Eltern/Kinderkonten, lokale Altersstufen, Datenschutz, Bildschirmzeit, bisherige Audio-/Lernrecords, Offline-Speicher und alle aktiven Deep Links erhalten.

## PHASE E – Software-/Hardware-Harmonie messen
- Touch-Feedback ohne spürbare Blockade, flüssige SwiftUI-Transitions, hohe Scroll-Framerate je tatsächlicher Hardware, keine rechenintensiven UI-Blockaden, asynchrones Cache-/Bilddecoding.
- Audio-Fokus nur ein aktiver Player; AVAudioSession, Now Playing, Headset/Bluetooth, Hintergrund, Unterbrechungen, Lock Screen, Remote Controls, Seek, Audio-/Wort-Synchronität. Tab-/Pose-/Profilwechsel darf Audio, Frage oder gespeicherte Position nicht versehentlich neu initialisieren.
- Screens/Buttons für Kinder wirklich lesbar und erreichbar; Dynamic Type, VoiceOver, Reduced Motion, arabische Harakāt, richtiges RTL, Touchflächen nach vorhandenen KIDS-Regeln, Safe Areas und Fold-ReservedRegions.
- Instruments: Frame Hitches, CPU, RAM/Leaks, Energy, Launch- und Touch-Latenz, Cold/Warm Cache, langsames Netz/Offline, wiederholte Interaktionen. Performance-Zahlen sind QS-Ziele, kein schon erreichter Nachweis.
- Automatisierte Tests plus reale iPhone-/iPad-/Duo-Hardwaretests als finale Pflicht; Android-Fold-Browser- und Gerätematrix separat. Fehlende Hardware als NICHT GEPRÜFT kennzeichnen, nie grün vortäuschen.

## PHASE F – Sicherer selbstständiger Fortschritt und Abnahme
- Ziel ist eine geschlossene autonome Arbeitsfolge mit echten internen Teilschritten; wenn nicht in einem Lauf vollständig möglich, dokumentierte Zwischenstände statt erfundener Fertigmeldungen.
- Nach jedem größeren Abschnitt ios/DarAlTawhidKids/Next/IMPLEMENTATION-STATUS.md führen: Branch/Commit, letzter geprüfter Schritt, Build-/Testnachweise, fertige/teilweise/offene/gesperrte Module, nächste konkrete Fortsetzung und lokale Sicherungsreferenz.
- PARITY-MATRIX.md pro Bildschirm/Funktion/Profil mit Source, Ziel-Implementierung und wirklich ausgeführtem Test aktualisieren. Beim erneuten Auftrag "Weiter" von hier und Git-Status fortsetzen; bezahlte Audios niemals erneut erzeugen.
- Isoliertes TawhidKidsNext-Simulatorziel mit bash ios/DarAlTawhidKids/Next/TAWHID-KIDS-NEXT.command erzeugen/testen. Der Launcher beweist nur technische Grundtests, keine vollständige native Migration.
- Kein Mergen in main, kein App-Store-/TestFlight-Upload, kein Cloudflare-/Web-Live-Push, keine OneSignal-Gerätenachricht und keine echten Kinderdatenmigrationen ohne ausdrückliche separate Freigabe.

## Bericht statt Scheinerfolg
Nenne am Ende Repositorybranch/Commit, Xcode-Projekt/Scheme/Bundle, letzte Sicherung, echte native Seiten-/Audio-/Content-Parität, 5-Tab-/Lupe-/Duo-Ergebnisse, Tests auf iPhone/iPad/Android Fold, Instruments-Kennzahlen, Screenshots/Logs und echte Blocker. Keine "100 %" ohne messbare Hardware-/Fachfreigabe.
