# TAWḤĪD KIDS NEXT · Native-First, Apple-Hardware- und Software-Harmonie
**29.10.2026 · Systemarchitektur & nachzuweisende Qualität · Draft / keine Freigabe**

## Auftrag und Qualitätsprinzip
Die aktuelle TAWḤĪD KIDS Besucher-App ist Referenz für **sämtliche tatsächlich aktiven** Inhalte, islamisch-kinderfreundliche Bildsprache, Original-Hero, eigenen 3D-Icon-Satz, Jungen-/Mädchenprofile, Lernstand, Rezitator-/Fuṣḥā-Originalaudios, Quellen, UI-Farben und datensparsame Elternsteuerung. Der SwiftUI-Hybrid muss nicht nur ähnlich aussehen, sondern in **Software, Betriebssystem, Layout, Accessibility, Audio und realer Geräte-Hardware** konsistent reagieren.

**Wichtige Bestandsprüfung:** In `kids/version.json` wird `quranLearningEnabled: false` und `quranLearningRuntimeRemoved: true` deklariert. Den ausgeschalteten früheren Qurʾān-/Alif-Bāʾ-Lern-Runtime NICHT stillschweigend als aktive Funktion reimplementieren. Bestehende aktive Qurʾān-Rezitation/Lesezugänge erhalten; zusätzlicher Memoriermodus nur als getrennt fachlich freigegebener Auftrag. Der frühere Arbeitsauftrag darf nicht eine nicht mehr freigegebene Laufzeit unbeabsichtigt wieder aktivieren. Jede Funktion vor Migration aus `main` und lokalen gesicherten Recovery-Dateien als ACTIVE / RETIRED / EXPERIMENT / BLOCKED klassifizieren.

## A · Systemgrenzen und Verantwortlichkeiten – eine Quelle, ein Owner
| Schicht | Gewünschte Technik | Verantwortung | Verbot |
| --- | --- | --- | --- |
| Adaptive App Shell | SwiftUI `App`, `Scene`, `TabView`, `NavigationStack`, `NavigationSplitView`, `searchable` | Systemnative Navigation, Lupe, Farben, sichere Insets, Fenster/Lifecycle | Fake-iOS-Tabs per Web-CSS, doppelte Web-Navigation |
| Design System | Typisierte `KidTheme` Tokens, `KidProfile`, `KidAgeBand`, Asset-Catalog | Original-Grafiken, 3D-Icons, dynamische Typografie, Boy/Girl, Kontrast, Reduced Motion | Erwachsenen-DARNext-Palette, erfundene Ersatzicons/Avatare |
| Fachinhalt | `KidsContentRepository` mit versionierten JSON-/Manifest-Verträgen, ETag-/Hash-Cache, Freigabefilter | Gleiche KIDS-IDs wie Web/PWA, approved only, lokale Cache-Fallbacks | Doppeltes Content-Authoring, unapproved/Inhalte aus Erwachsenen-Katalog |
| Session & Navigation | `KidsSessionStore`, `KidsNavigationCoordinator`, typisierte `KidsRoute`, `KidsScreenState` | Ein Zustand über Tabwechsel, Fold, Split, iOS-Lifecycle; Debounce/Cancel | Quizfortschritt in mehreren nicht synchronen Stores, Reset bei Fold |
| Audio | `KidsAudioCoordinator`, `AVAudioSession`, ein aktiver Player-Owner je Content | Play/Pause/Seek, Unterbrechung, Bluetooth, Remote Commands, Sprecher/Clip-Zuordnung, Now Playing | Swift- und Web-Player gleichzeitig, System-TTS, erneute TTS-Kosten |
| Native Interaktion | SwiftUI Quiz, Wort-für-Wort-Duʿāʾ, Player, Fortschritts- und Antwortkarten | Reaktion auf Touch, Animation, Fokus, VoiceOver, High-Contrast und Haptik | Freie JS-Klick-Hacks, ungetestete Lernlogik-Änderung |
| WebKit Übergang | max. eine kontrollierte `WKWebView`-Instanz nach Bedarf, begrenzte `WKScriptMessageHandler`-Bridge | Noch nicht migrierte aktive Web-KIDS-Bereiche, stufenweise Abnahme | Zweiter Tabstrip, wilde `evaluateJavaScript`-Route, Live-Origin-Fallback |
| Bilder/Offline | Preflight-Manifest, komprimierte Originalassets, asynchrones Preloading und persistenter Cache mit Versions-Pinning | Originalmotive ohne Pixelersatz, keine springenden Layouts, Retry/Offline | Kritische Downloads/JSON-Parsing auf dem Main Thread |
| Android/Web | bestehende KIDS-PWA, Viewport-/Fold-Segmente, adaptive Glass-Navigation | Gleiche Datensätze, IDs, Originalbilder, echte Suche und sichere Fold-Navigation | Falsches Versprechen echter Apple-Native-Systemleiste auf Android PWA |

**Single-writer Regel:** Für jeden Zustand ist nur eine Instanz schreibend verantwortlich, z. B. `AudioCoordinator` für Wiedergabe, `QuizSession` für Frage/Antwort/Progress, `ProfileStore` für Profilwechsel und `RouteCoordinator` für die Navigation. Zwischen nativer SwiftUI und WebKit Nachrichten strikt schema-validiert, versioniert und von begrenzten Origins akzeptieren. Nachrichten sind idempotent und serialisiert; Rückmeldungen/Fehler sichtbar und testbar. Keine Doppel-Events nach App-Resume oder Faltvorgängen.

## B · Plattform-Harmonie konkret
**Apple:**
- Original-Systemnavigation `TabView` und systemeigene Suchlupe inkl. `searchable`, 5 KIDS-Ziele (Heute, Hören, Lernen, Duʿāʾ, Eltern) und echte Original-3D-Icon-Assets. Apple verwaltet Platzierung/Glasverhalten und relevante Safe Areas; keine manuelle Glas-Simulation.
- `@Environment` Size Classes, Layout und Scene/Window-Informationen statt fest kodierter Gerätetypen oder Bildschirmkoordinaten. Fold-/Split-Änderungen dürfen **keinen** Player, Quizstand, Content-Scroll oder wiederholten Network-Reload auslösen.
- iPhone Duo außen/innen/halbgefaltet, aufrecht/quer, Split View mit beiden Seiten, asymmetrische Safe Areas und Reserved Regions überprüfen; iPad Stage Manager/Multitasking, iPhone dynamische Schriftgrößen.
- Animationen bevorzugt hardwarebeschleunigt, relevante `transaction`-/`animation`-Regeln, wenig Layout-Thrashing. Bilder vorab skalieren und decodieren; beim ersten Seitenaufbau kein Vollbild-Redraw nach Laden einer Karte.
- Bild/Audio-Ausgabe an tatsächliche iOS-Unterbrechung und Lifecycle koppeln. Keine heimliche Standort-/Mikrofonaufnahme.

**Android PWA:** identische Inhalte und sichtbare Bedien-Logik, aber geeignete Web-Technik. Gerätegröße und Faltsegmente per verfügbarer Browser-API erkennen, bei fehlender API robusten Fallback. Die originale Apple-TabView und native iOS AVAudioSession können nicht in einer PWA laufen. Gleichwertiges, ergonomisches Nutzererlebnis ist das Ziel, keine identische Apple-Runtime.

## C · Performance-Vertrag und Messstrategie
Kernpriorität: Wahrnehmbare Reaktionszeit statt bloß vieler Effekte. Alle Zahlen sind **anzustrebende QS-Budgets**, erst mit definierter Baseline-Hardware, Builds und Messreihen als PASS zu verwenden.

| Kennzahl | Ziel / Prüfverfahren |
| --- | --- |
| Touch auf Tab, Antwort, Play/Pause | Unmittelbare native visuelle Rückmeldung, Ziel p95 bis 100 ms im warmen Zustand; E2E-Aktion darf bei Netzwerkbedarf längere Ladezeit haben, muss Busy/Retry zeigen |
| Scrollen, Tabwechsel und Fold-Transition | Native Bildwiederholrate so weit wie möglich stabil halten (60 Hz bzw. 120 Hz bei unterstützter Hardware); Hitches mit Instruments `SwiftUI`, `Animation Hitches`, Core Animation nachmessen, nicht aus dem Simulator-FPS allein abnehmen |
| Start/Navigation | Auf gecachten Inhalten zuerst nutzbares UI statt blockierendem Datenfetch; Cold/Warm-Start und p50/p95 auf definierten Referenzgeräten dokumentieren; kein harter Spinner ohne Timeout |
| Audio | **0 hörbare Dropouts** in definierten Testläufen; nach Unterbrechung kontrollierter Status; Audio-Position und Wortmarkierung validiert; kein paralleler Player und kein doppelter Remote Command |
| CPU / RAM / Wärme / Akku | Instruments Time Profiler, Allocations, Leaks, Energy Log; Leaks 0 und keine kontinuierliche Speicherzunahme in wiederholten Sessions; thermische Probleme oder Hintergrundarbeit gelten als Blocker |
| Offline / schlechte Verbindung | UI und gespeicherte Lernstände nutzbar, keine leere Startseite; verfügbarer Audio-Cache wird ausschließlich nach überprüfter Asset-Identität genutzt; reale Fehler/Retry statt lautloser falscher TTS |
| Daten-Parität | IDs/Status/Freigabe/Version identisch zu Web; keine verlorenen Quiz-, Duʿāʾ- oder Story-Progress-Events, keine doppelt gestarteten Clips und keine zusätzlichen TTS-Abrechnungen |

**Messung:** automatisiert mindestens 30 Wiederholungen pro Hauptinteraktion auf ausgewählten Geräten und mit einem reproduzierbaren Testdatensatz; p50/p95, Min/Max, Commit, Simulator-/Hardware-ID, OS-Version, warme/kalte Caches und Netzprofil speichern. Hardwaretests verpflichtend; Simulator ist kein Ersatz. Das Ziel "100 % funktioniert" ist eine Freigabeabsicht, keine ohne Messdaten belegbare Behauptung.

## D · Resilienz und Lernkontinuität
- Audio-Interruption (`AVAudioSession.interruptionNotification`), Route Change, Bluetooth und `mediaServicesWereResetNotification` behandeln. Nach Media-Services-Reset Player neu initialisieren und **nicht** automatisch ohne User-Aktion wieder abspielen, wie von Apple gefordert.
- SessionState nach App-Background/Foreground, Tabwechsel, Gerätefaltung und Split/Resize über stabilisierte Progress-Daten wiederherstellen; keine aktive quizbezogene Antwort verlieren.
- Präziser Duʿāʾ-Wort-Zeitstempel nur auf Basis vorhandener echter Timingdaten; Synchronisationsfehler sind zu melden statt zu fingieren.
- Content-Manifeste nur vollständig, geprüft, mit Version und Hash aktivieren (atomarer Wechsel); bei Netzwerkfehler bleibt die letzte freigegebene Version verfügbar.
- Profil-, Alters- und Mädchen-/Jungenfarben bei Übergängen nie durch uninitialisierte Fallbacks vertauschen; Profile sind lokal isoliert, keine Weitergabe nicht erforderlicher Kinderdaten.

## E · Strenges Implementierungs-/Abnahme-Gate
1. **Recovery-Zustand** zuerst auf dem Mac prüfen und separat sichern. Keine bestehenden Schemes, Simulator-Daten, Backups oder Profile überschreiben, niemals `git reset --hard`.
2. Alle vorhandenen aktiven KIDS-Seiten und Kinderpfade gegen tatsächliche aktuelle Web-App inventarisieren, inklusive versteckter Modal-/Audio-/Fehlerzustände. "Retired" getrennt kennzeichnen.
3. Getrennte native Simulator-App mit minimaler funktionaler Shell starten. Von dort zentrale `SessionStore`-/`ContentRepository`-/`AudioCoordinator`-/`RouteCoordinator`-Contracts zuerst etablieren und testen, **bevor** Screens optisch angepasst werden.
4. Danach alle gewünschten SwiftUI-Oberflächen und zulässige WebKit-Adapter stückweise gegen Originalinhalte mit einem durchgängigen Migrationsauftrag integrieren. Nach jedem Bereich Integrations-/UI-/Audio-/Performance-Test, kein Ersatz durch nur Screenshots.
5. Apple System TabView, Originalicons, Lupe, Safe Areas, Scroll/Keyboard, native Audio-Fokus, 3D-Bilder, Boy/Girl, alle Altersgruppen prüfen.
6. Automatisierte Testmatrix iPhone klein/groß, iPad hoch/quer/Multitasking, iPhone Duo außen/innen/fold/rotated/Split, Android-Web-Fold. Echte Geräteprüfung für relevante Releasekandidaten.
7. **Keine Live-/Store-/TestFlight-/Cloudflare-/Android-Web-Veröffentlichung** durch diesen Auftrag. Go/No-Go nur mit schriftlichem Prüfbericht: Nicht abgedeckt, gemessene Latenz, FPS/Hitches, Memory, Audio, UI-Parität, Datenschutz, Ressourcenschäden, offene Bugs. Blocker=keine Freigabe.

## Apple Primärquellen
- SwiftUI Leistung: https://developer.apple.com/documentation/Xcode/understanding-and-improving-swiftui-performance
- Animation Hitches: https://developer.apple.com/documentation/swiftui/performance-analysis
- iPhone Duo Anpassung: https://developer.apple.com/videos/play/tech-talks/111461/
- AVAudioSession Unterbrechungen: https://developer.apple.com/documentation/AVFAudio/handling-audio-interruptions
- Medien-Reset: https://developer.apple.com/documentation/AVFAudio/AVAudioSession/mediaServicesWereResetNotification
