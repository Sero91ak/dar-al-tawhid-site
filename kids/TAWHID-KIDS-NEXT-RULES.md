# TAWḤĪD KIDS NEXT · verbindlicher Architektur- und Freigabevertrag
Stand: 26.10.2026 · Status: Entwicklungsauftrag, KEINE Produktivfreigabe.

## Ergänzung vom 29.10.2026 · aktuelle Xcode-Wiederherstellung

`kids/TAWHID-KIDS-NEXT-RECOVERY-DESIGN.md` ist verbindlicher Bestandteil dieser Regeln. Erst lokale Xcode-Quellen, Schemes, Assets und Simulatorstände sichern und den aktuellen main-/lokalen Recovery-Bestand vergleichen, dann native Migration. Keine Git-Hard-Resets und keine Überschreibung von User-Daten. Fünf Original-KIDS-Tabs (Heute, Hören, Lernen, Duʿāʾ, Eltern), alle Original-3D-Icons, Hero-Bilder, Gebetszeiten, Qibla, Inhalte, Profile, die komplette Story-/Qurʾān-/Duʿāʾ-/Quiz-/Akademie-Struktur erhalten. Mac-Kompatibilität ist ein zu testendes separates Ziel und nicht automatisch durch ein iOS-Build erreicht. Der ältere NEXT-Branch ist nicht mehr der aktuelle Ausgangsstand.

## Quelle der Wahrheit / Isolation
- Eigenständige KIDS-App, kein Erwachsenen-DARNext, keine Erwachsenen-Quiz-/Datenbank-IDs.
- Aktueller kanonischer Code liegt unter kids/** und ios/DarAlTawhidKids/**. Aktuelle Detailnormen stehen in kids/KIDS-DESIGN.md, kids/TERM-LEARNING-POLICY.md, KIDS.md und einschlägigen Tests. Diese haben Vorrang vor diesem kondensierten Vertrag, sofern sie genauer oder neuer sind.
- Bestehende öffentliche Kinder-App https://dar-al-tawhid.de/kids/, Bundle de.daraltawhid.kids, produktives Xcode-Scheme DarAlTawhidKids, App Store Connect, Web-Deploy und Elternprofile sind TABU für diese Entwicklungsstufe.
- Eigenständiges Simulator-Bundle de.daraltawhid.kids.next.dev und ausschließlich KIDS-Creator-Staging-Origin dar-al-tawhid-kids-creator.sero91ak.workers.dev. Kein stiller Fallback auf die Live-Origin, keine Übernahme echter Kinderprofile, kein automatischer Store-/TestFlight-/Live-Push, keine OneSignal-Nachrichten.
- Staging-Worker-Verfügbarkeit, Autorisierung und dortige Inhaltsversion müssen tatsächlich geprüft werden; vorhandene README beschreibt diese noch nicht als nachgewiesen.
- Nie ein gleichnamiges existierendes Scheme überschreiben. Eigene Sources, XcodeGen-Konfiguration und Tests unter ios/DarAlTawhidKids/Next/. Bestehende KidsAppShell/KidsWebAppView dürfen in Simulator-Build nur LESEND referenziert und nicht modifiziert werden.

## Migration vollständig statt Neuerfindung
- INVENTAR maschinell aus aktuellem main erstellen: alle sichtbaren Views, Modal-/Detailansichten, beide Geschlechterprofile/Avatare, Alters- und Themenregeln, Hero-/Bild-Assets, fünf real existierende Tab-Elemente, Akademie / 52-Wochen-Lernsystem, Lernstand, Quiz, Hörbücher, Propheten, Ṣaḥābah, Ṣaḥābiyyāt, Schätze der Salaf, Dīn-Themen, Duʿāʾ, Qurʾān, Eltern, Downloads und Offlinefunktion.
- Bei jeder Migration eine Quell-Datei, bestehende Zustands-/Storage-Schlüssel, Ziel-Implementierung, automatisierten Test und Screenshot-Nachweis in einer Paritätsmatrix dokumentieren. Keine unüberprüften "100 %" behaupten.
- Der bestehende WKWebView-Flow ist die REFERENZ und dient für noch nicht native Module nur als temporärer Adapter. Keine Doppel-Navigation, keine zwei Audio-Player, keine zweite Quiz-Datenhaltung, keine unzuverlässigen künstlichen JS-Klicks als finale Architektur.
- Eine einzige versionierte KIDS-Datenquelle und einheitliche Audio-Manifeste für iOS Next und Android/Web. Keine redundante ElevenLabs-Generierung und keine Bezahlaufrufe beim Build/Start/Test. Nur existierende freigegebene Originalclips abspielen.

## Profile, Datenschutz und Alter
- Junge und Mädchen mit ihren ORIGINAL-3D-Avataren, Bildern und eigenständigen Designwelten übernehmen, nicht austauschen. Mädchen niemals mit offenen Haaren oder unbedecktem Hals; Gebetsszenen vollständig bedeckt. Keine Gesichter-/Kinder-Emoji-Ersatzfiguren.
- Jungenprofil: Petrol/Nachtblau/Gold. Mädchenprofil: eigenständige MEHRFARBIGE Pflaume/Mauve/Rosé/Blush/Lavendel/Creme/Champagnergold-Palette; keine türkisen, petrolfarbenen Jungenflächen unter Mädchenkarten. Originalbildmotive und individuelle Farben bleiben erhalten.
- Elternverwaltung, Kinderprofilwechsel, Elternpasswort und vorhandene lokale Speicher-/Fortschrittsschlüssel bei Web-Parität niemals zerstören oder ohne Migrationsnachweis umbenennen. Insbesondere kids.profiles.v1, kids.activeProfile, kids.contentMode.v19, dar.kids.birthMonth.v1.<id> schützen.
- Monatsangabe YYYY-MM ist lokal, kein genauer Geburtstag, keine Übertragung als rohe Daten an RPC/Analytics; Elternansicht und altersangepasste Darstellung bleiben datensparsam.
- Bestehende UI-Lernstufen 4–5 / 6–8 / 9–10 NICHT unbemerkt mit Quiz-Daten-Altersbändern 4–6 / 7–8 / 9–10 gleichsetzen. Explizites Mapping/Tests nach den tatsächlichen bestehenden Funktionen vorsehen.
- Keine Werbung, kein Tracking, keine ausgehenden Quellen-Links im Kinderbereich, keine externen Navigationen ohne Elternschranke; Eltern-/Mikrofon-/Netzwerk-/Datenschutz-Prüfung nach aktuellen Apple Kids Guidelines.

## Audio, Mitlernen, Qurʾān
- Ein autorisierter Serhat-Abu-Malik-Masterstimmen- und Fuṣḥā-Audiovertrag je Inhalt; vorhandene kindgerechte Clips, V4-Aussprache- und Dublettenschutz beibehalten. Kein iOS-System-TTS oder unfreigegebenes ElevenLabs-Fallback; niemals geheime API-Keys in iOS.
- Ein eindeutiger Audio-Verantwortlicher (Playback Ownership): kein paralleler Swift-AVPlayer + Web-Audio für denselben Inhalt. Audiozustand, Pause/Fortsetzen, Sperrbildschirm/Now Playing, Unterbrechung, Kopfhörer, langsame Wiedergabe, Wiederholungen und Offlinepakete beweisbar testen.
- Duʿāʾ-Lernansicht: Arabisch → geprüfte Lautschrift → deutsche Bedeutung, segmentierte Hervorhebung, Einzelwort-, Folge-, Gesamt- und Langsam-Audio; 120 Duʿāʾs und 1.366 Wortpositionen sind dokumentierter Ausgangsbestand, nicht ungeprüft als vollständig vertont ausgeben.
- Geschichten: Hören & Mitlesen / Hören / Lesen; eine Original-Masteraufnahme pro Geschichte, separate text-only Funktion ohne Audio, echte Fortsetzungsposition und saubere Deaktivierung nicht verfügbarer Audiomodi.
- Qurʾān: authentische Rezitation vom bestehenden Rezitator, KEINE KI-Rezitation; Anzeige, Hören, Mitlesen/Mitrezitieren und Memorieren erhalten.

## Quiz-Lernsystem
- Kanonische Quelle kids/data/quiz-kids.json, kanonische freigegebene Status nur status=published, reviewStatus=approved, verification=approved. Aktueller deklarierter Sollbestand im Repository: 900 eigenständige Fragen, je 300 für 4–6, 7–8, 9–10. Ursprüngliche 450-Aufträge sind keine Freigabe, den neueren Bestand zu halbieren. Ist-Zahl und Audioabdeckung neu maschinell ermitteln.
- Quiz muss von der Startseite mit EINER Aktion aufgehen; Laden → Erfolg oder konkrete Fehlermeldung/Retry, niemals endloses "Laden". Bibliothek, Kategorien, Antwortauswertung, Erklärung, Wiederholung, Lernfortschritt und passende Audio-Verknüpfungen müssen bestehen.
- Keine verdoppelten Fragen oder unnötig neu erzeugten Audios. Manifest/Clips hash- und ID-basiert, Quelle und Freigabestatus prüfen. Fehlerhaftes/fehlendes Audio nie durch Stille oder frei erfundene Stimmen maskieren.

## UX, Geräte und Sicherheit
- Kindgerechte, ruhige, hochwertige islamische Designsprache; originaler Look der Kinder-App geht vor pauschaler DARNext-Erwachsenenoptik. Wenig Text auf Einstiegsflächen, klare Primäraktion, große erreichbare Elemente, fröhliche aber dezente Animationen, ausreichender Kontrast, VoiceOver, Dynamic Type und Reduce Motion.
- Voll responsiv für iPhone, iPad, iPhone Duo geschlossen/offen/gedreht/gefaltet und iPad-Multitasking. Layout über verfügbare Größe und Size Classes, nicht Modellname oder feste Pixelmaße. Asymmetrische Safe Areas, Dynamic Island, Fold-/Split-Bereiche, Innen- und Außen-Display prüfen.
- Eine eindeutige obere Detailnavigation mit Blickdichtheit samt Safe Area; kein Leerspalt beim iOS-Bounce, kein Hero über Titelleiste, keine Tab-Überdeckung. Kein Textauswahl-/Kopiermenü bei Buttons, Nav, Quizantworten/3D-Bedienelementen; sinnvolle Lerntexte ggf. auswählbar.
- Touchziele aus bestehenden KIDS-Kontrakten übernehmen (allgemein mindestens 44pt, Geschichtenaktionen 56pt). Original-3D-Icons und Transparentflächen erhalten, keine Emojis oder rechteckige Bildkästen.
- Vollständiges Device-/State-Regressionstest-Set: iPhone, iPad, iPhone Duo in allen Posen, beide Profile, alle Altersstufen, Portrait/Landscape, Offline/Online, langsames Netz, fehlerhafte Manifeste, dynamische Schrift, Audio/Unterbrechungen, Profilwechsel, Relaunch, alle Route-Back-Transitions.

## Absolute Go/No-Go-Gates
- Build und Tests auf Xcode/Simulator; iPhone-Duo-Vollbildtests gemäß Apple Xcode 27.1 / iOS 27.1. Simulator ist kein Hardware-Nachweis: abschließende Tests auf realen iPhone-, iPad- und Duo-Geräten erforderlich.
- CI/Tests: bestehende Kids-Gates einschließlich Quiz- und Duʿāʾ-Guards ausführen; neue native Tests + visuelle Screenshots, Content-/Audio-Paritätsbericht, Fehlerliste, 0 bekannte Blocker vor Freigabe.
- Nie automatisch merge/release/live/deploy/push/Store-Upload. Bei fehlendem Gerät, fehlender Staging-Origin, fehlendem Asset oder gescheitertem Test STOP + belegten Blocker melden, nicht vortäuschen. Freigabe erfolgt explizit nach realer Sicht-/Hörabnahme.
