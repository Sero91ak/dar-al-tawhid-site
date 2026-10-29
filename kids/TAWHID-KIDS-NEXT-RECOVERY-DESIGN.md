# TAWḤĪD KIDS NEXT · Wiederherstellung, visuelle Leitlinie und vollständige Seitenmigration
Datum: 29.10.2026 · VERBINDLICH FÜR ENTWICKLUNG; kein Freigabenachweis.

## Kontext: Xcode-Wiederherstellung / GitHub-Snapshot
- Altes KIDS NEXT branch `codex/tawhid-kids-next-simulator-architecture-20261026` lag beim Abgleich am 29.10.2026 **638 Commits hinter main**. Nicht blind checkout/reset/merge und nicht zum Kanon erklären.
- Neues KIDS NEXT branch `codex/tawhid-kids-next-recovery-20261029` wurde von aktuellem `main` abgezweigt und isolierte NEXT-Dateien dorthin übernommen. Der Live-KIDS-Web- und -iOS-Bestand auf main ist die Inhaltsreferenz; lokale Xcode-Wiederherstellungsstände können neue, nicht gepushte Änderungen enthalten.
- **Recovery-Gate 0**: vor einem Build/Dateiersatz auf dem Mac alle real vorhandenen Xcode-Workspaces, .xcodeproj, Schemes, Targets, Quellpfade, lokal uncommitted/staged/untracked Dateien, Simulator-UDIDs, Build-Runtimes, lokalen Branches und Backups INVENTARISIEREN. Befunde in `ios/DarAlTawhidKids/Next/.qa/` dokumentieren.
- **Keine** automatische Löschung von Downloads, DerivedData, lokalem UserDefaults, Datenbanken, Simulatoren, Audio-Assets, Profiles, Backups oder Signing; kein `git reset --hard`, `git clean -fd`, `rm -rf` oder Überschreiben unbekannter lokaler Dateien.
- Vor Korrekturen unveränderte Recovery-Kopie des relevanten lokalen Zustands außerhalb des eigentlichen Arbeitsverzeichnisses sichern (mit Datum und SHA256-/Git-Status-Liste); nur explizit KIDS-Next-Dateien auf dem neuen Branch bearbeiten. Keine Datenmigration an echten Kinderprofilen.
- Wiederhergestellte oder lokal bessere Dateien anhand von Inhalt/Commit/Build-Ergebnissen mit aktuellem GitHub vergleichen; nichts allein wegen Zeitstempel überschreiben. Aktuelle App Store Connect-KIDS-App `de.daraltawhid.kids` bleibt unberührt.
- Bestehendes produktives Scheme `DarAlTawhidKids` und isoliertes Creator-Scheme `DarAlTawhidKidsCreator` bleiben erhalten. Neues Ziel nur `TawhidKidsNext`/Bundle `de.daraltawhid.kids.next.dev`.

## Absoluter Umfang: jedes existente App-Element
Die Vollständigkeit wird nicht durch die Anzahl schöner Mockups, sondern durch eine programmgenerierte Bestand-zu-Ziel-Matrix bewiesen. JEDER Quellbereich und jede sichtbare Unterseite/Modal/Reader/Fehlerseite erhält:
`source files + resource checksums + actual route + profile age state + content schema + audio keys + target SwiftUI/Web adapter + QA assertions + before/after screenshots + verdict`.

1. Start/Heute: originale Start-Hero-Bilddatei UND Bildausschnitt/Fokus, Begrüßung/Salām, Profil-Avatar und Auswahl, Hören-/Weiterhören-Einstiege, Gebetszeiten integriert im bestehenden Hero-Layout. Kein generisches Ersatzbild; Motivzuschnitt pro Format prüfen.
2. Gebetszeiten/Qibla: `kids/prayer-stage-v1261.js`, `kids/kids-qibla-focus-v1442.js`, Original-Styling, Standortauswahl, Zeitzone, fünf real berechnete Gebete, Standortzustand/Privacy, Richtungs-/Kompasszustände, Permission-/Offline-/Fehler-Fallback; **keine erfundenen Gebetszeiten oder dauerhafte Standortübertragung**.
3. Hauptnavigation: EXAKT **fünf** Tabs aus `kids/check-ui-contract-v1420.cjs` / `kids/kids-nav-v1421.css`: **Heute, Hören, Lernen, Duʿāʾ, Eltern**. Echte Original-3D-Icons aus `kids/assets/kids-icons/**` und Grafik-Assets übernehmen, keine SF-Symbol-/Emoji-Ersetzung. Schätze der Salaf ist unter Hören zugeordnet, kein sechster Tab. Qurʾān-Zugänge gemäß tatsächlicher Web-Struktur weiter erreichbar, nicht erzwungen als sechster Tab.
4. Hören: alle echten Geschichtenbibliotheken, Propheten/Ṣaḥābah/Ṣaḥābiyyāt/Salaf, Kategorien, Cover, Stories, Quellen (kindgerecht nicht anklickbar), `DARKidsFollowReader`, Originalaufnahmen, Fortschritt und zuletzt gehört. Drei Modi Hören & Mitlesen / Hören / Lesen, inkl. fehlender-Audio-Zustand.
5. Lernen: bestehende Akademie/Unterrichtsbibliothek, Fach-/Wissensbereiche, Jahres-/Wochenlektionen, richtige Sperren, Quizdashboard, Kategorien, Fortschritte, Fehler-Wiederholung, Anerkennung/Lob und Erklärungen. Kein unbefugtes Test-/Eltern-Bypass.
6. Quiz: aktuelles `kids/data/quiz-kids.json` maschinell einlesen, **900 approved Items im auditieren GitHub-Stand** statt alter 450. Exaktes Alters-Mapping zwischen UI und Daten nicht erraten. IDs, Antworttexte, Erklärungen, Status, Progress, V4-Fuṣḥā-Masterclip-Key, unveränderte Sprechreihenfolge und pausiertes Weiterklicken nach Antwort prüfen.
7. Duʿāʾ: 120 Items als aktueller Daten-Ausgangsbestand, Arabisch → Lautschrift → deutsche Bedeutung, Segmente, Wort-Audio, Komplett-/Langsam-Audio, Sprech- und Wiederholfunktion, Hervorhebung, RTL und Schreibsorgfalt. Keine erfundenen Timing-Präzisionswerte. Keine automatische Erzeugung durch System-TTS.
8. Qurʾān: Sūren, Verse, echte Originalrezitation, Anzeige Arabisch/Übersetzung, Lernen/Memorieren, Repetition, Audio-Synchronität und authentische Quellenpflege. KEINE ElevenLabs-Qurʾān-Rezitation.
9. Eltern: echte lokale Kinderprofile, Schutz, Alter (Geburtsmonat/-jahr), Profile, Zeitregelung, Lernergebnisse, zuletzt gehört, persönliche Datenminimierung, Sync- und Offlineverträglichkeit; vorhandene Schlüssel erhalten.
10. Jede Detail-/Fehler-/Offline-/Download-/Sonderseite inklusive tiefer Navigation, Player Overlay, Scrollposition und Historie. **Keine Seite darf beim Umstrukturieren verschwinden.**

## Designrichtung – smart, modern, KIND, nicht Erwachsenen-DARNext
- Kindgerechte 3D-Storybook-Illustrationen und originale App-Motive mit hochwertiger Typografie, bedienbarem Lern-Dashboard, zurückhaltenden Animationen und hochwertigen Gold-/Lichtakzenten. Nicht inflationär Glassmorphism, flackernde Effekte, künstliche AI-Labels oder generische Dashboards einsetzen. "AI Dashboard/UI" bedeutet intelligente informationsarchitektonische Anordnung, keine Kinder-Daten in externe KI-Modelle schicken.
- Sichtbare Interaktionspriorität: (1) Weiterlernen/Anhören (2) Lesen/Mitsprechen (3) Lernfortschritt/Erkunden. Maximal ein betonter Primär-CTA je Ansicht. Alle Buttons echte Funktion, kein dekoratives Verhalten.
- Mädchen: vollständige Kopf-/Halsbedeckung; Originalbilder unverändert; eigenständige mehrfarbige Pflaume/Mauve/Rosé/Blush/Lavendel/Creme/Champagnerwelt. Jungen: Petrol/Nachtblau/Gold. Pro Profil dynamische DesignTokens und ORIGINAL-Bilder, nicht über CSS- oder SwiftUI-Filter einfärben.
- Lesetypografie: geprüfter arabischer Font mit korrekten diakritischen Zeichen (Ḥarakāt), ausreichend große arabische Schrift, unterschiedliche Schriftgrößen für 4–5, 6–8, 9–10, keine abgehackten Zeilen, Zeilenlängen begrenzen, VoiceOver, Dynamic Type, RTL/LTR, Zoom und Reduce Motion. Mindestbedienfläche 44pt bzw. bei den Story-Modi 56pt.
- Reaktionsmodell: ruhige Haptik/leichte Aufleuchtung beim richtigen Antwortzustand, falsche Antworten ohne beschämende Animation, animierte Lesefolge synchron zur echten Aufnahme; Unterbrechungen lassen Lernzustand bestehen.
- Ein Scrollcontainer pro Ebene, korrekte Safe Areas, kein Hero-Text unter opaken Titelleisten, keine doppelte Kopf-/Bottom-Bar, 3D-Bedienelemente nicht textselektierbar.
- Ein einziger Audio-Owner pro Wiedergabe, AVAudioSession/Now Playing/Remote Commands, Audio-Fokus, Hintergrund, Bluetooth, Offline-Packs. Audioquellen exakt per Manifest und Freigabestatus; keine Kosten durch neue Generierung.

## Gerätematrix und adaptive Strukturen (Apple-Quellen)
- Kleine iPhones: 1 Spalte, großzügige CTAs, nichts abgeschnitten.
- Große iPhones: luftiges, nicht gestrecktes 1–2-Spaltenlayout.
- iPhone Duo außen: kompakte einspaltige App; innen flach: zwei sinnvolle Lesebereiche; halb gefaltet: Inhalte und Buttons vollständig außerhalb Falz/ReservedRegions; hochkant/querkant, obere/untere Hälften und handfreie Aufstellung prüfen. Kein Text/Tab/Player/Avatar zentral über dem Falz.
- iPad klein/groß: adaptives Master-Detail, Lesebereich mit begrenzter optimaler Zeilenlänge, native Tab-/Sidebar-Varianten ohne Verlust der fünf Ziele; Split View, Stage Manager / Fensterverkleinerung und Tastatur.
- MacBook: NICHT behaupten, dass iOS-Simulator-Build automatisch native macOS-App ist. Zuerst die Web-/PWA-Version auf dem Mac prüfen. Separat `Designed for iPad` auf Apple Silicon **oder** eigenständigen Mac-Catalyst-Build prüfen, falls von Zielgerät/Signing/Testmatrix gedeckt. Maus, Tastatur, Größenwechsel und Menü/Fokus testen.
- SwiftUI-Kandidaten: NavigationStack/NavigationSplitView/TabView, size classes, ViewThatFits/AnyLayout, GeometryReader, LazyVGrid; unter iOS 27.1 ReservedRegion und ArrangementView zielgerichtet nur mit SDK-/Availability-Gates verwenden. Keine harte Device-Modell-Erkennung. Hero Crop per Focal Point und Aspect Ratio prüfen.
- Datenreichweite: Web-/Android-Betrieb unter /kids/ weiter erhalten; neue native Verbesserungen dürfen Inhaltsquelle oder Besucher-PWA nicht brechen.

## Testing / Freigabe
- Recovery-Bericht und unveränderliche lokale Sicherheitskopie vor Umsetzung.
- Snapshot von Live-/Staging-KIDS und File-/Audio-Hashes, Alters- und Profile-Cases, reale Datensätze, Route-Zähler und UI-Baum.
- Native Simulator Build, XCTest, UI-Automation, Snapshot-Diffs pro Profil/Alter/Fensterpose/Screen, VoiceOver, RTL, Offline/Netzfehler, Audio-Wiedergabe/Now Playing/Repeat, Textlesbarkeit und Kinderdatenschutz.
- Dokumentiere explizit Nicht-Verfügbarkeit eines Geräts oder Formats als **NICHT GETESTET**, niemals als bestanden. Vor iOS-App-Store-Übernahme echte iPhone/iPad/Duo-Prüfung mit Sicht-/Hörfreigabe. Kein Merge, kein Cloudflare-Deploy, kein Live-Push.

Apple-Referenzen:
- https://developer.apple.com/videos/play/tech-talks/111461/
- https://developer.apple.com/videos/play/tech-talks/111463/
- https://developer.apple.com/iphone-duo/prepare/
- https://developer.apple.com/documentation/Xcode/configuring-a-multiplatform-app-target
- https://developer.apple.com/kids/
- https://developer.apple.com/app-store/review/guidelines/
