# DARNext · Apple Heritage Design Master V1
**DĀR AL TAWḤĪD · Native Apple Science & Reading App**  
Stand: 24. Oktober 2026 · Status: Verbindliches Zielbild und Implementierungsspezifikation, **nicht** Aussage über bereits abgeschlossene Umsetzung.

## 0. Auftrag und Nicht-Ziele
DARNext wird eine **eigenständige native Apple-App** (iPhone und iPad) für islamisches Wissen und wissenschaftlich überprüfbare Texte. Sie verwendet dieselbe **kanonische Inhaltsbasis** wie die Website, aber eine eigenständige SwiftUI-Oberfläche, ein eigenes Navigations-/Leseerlebnis sowie iOS-Systemintegration.

**Strikt trennen:**
- **Gemeinsame Inhalte:** Qurʾān, Tafsīr, Tadabbur, Āṯār, Beiträge, verifizierte Quellen, Duʿāʾ, Bibliothek, PDFs, Quiz und freigegebene Übersetzungen. Eine unveränderliche Veröffentlichungs-ID je Beitrag; Quellen-IDs, Quell-Hash und kanonische URL bleiben sprachübergreifend identisch.
- **Native DARNext-Oberfläche:** Apple-Navigation, Schrift, Materialien, Animationen, Reader, Audio, Cache, systemeigene Funktionen.
- **Bestehende Produkte:** Website, DAR TEST, reguläre DĀR-iOS-App, Kids-App und Apple-TV-/Watch-/Widget-Targets bleiben ohne expliziten eigenen Auftrag unangetastet.

**Nicht tun:** Die Website nicht 1:1 in einen Vollbild-WebView umwandeln. Nicht alle vorhandenen Web-CSS-/JS-Dateien in SwiftUI kopieren. Kein Live-Deployment, kein App-Store-/TestFlight-Release, keine Benachrichtigung an Endnutzer aus diesem Masterauftrag. Keine ungeprüften religiösen Inhalte als geprüft markieren.

## 1. Sichtbare Ausgangslage — im GitHub-Zweig geprüft
Quelle: codex/darnext-phase4-wip-2026-10-23, Übernahmebasis Commit b5a7d0c35ceae92a5e6ba7688ed4356ea1b14f42.
- Native DARNext-Shell mit fünf Tabs: Start, Qurʾān, Beiträge, Wissen, Mehr.
- Native Grundlagen für Dashboard, Qurʾān, Posts, Duʿāʾ, Bibliothek, Suche, Quiz und Audio.
- Ressourcen auf dem früheren Arbeitsstand: 114 Sūren-Dateien plus Katalog; 64 Markdown-Beiträge; 97 Duʿāʾ-Markdown-Dateien; vier zentrale JSON-Datenkataloge (Bücher, Publikationen, kanonischer Buchindex, Quiz).
- Diese vorhandenen Dateien stimmten beim Vergleich mit ihren entsprechenden Dateien auf main überein. **Das beweist keine vollständige Übernahme sämtlicher Website-Inhalte**: weitere Lern-, Frauen-, Ḥadīṯ-, Q-Quellen-, Tafsīr-/Tadabbur- und Mehrsprachigkeitsbestände müssen mit Inventar und Freigabestatus abgeglichen werden.
- `DARNext/Data/LocalContentRepository.swift` lädt primär lokales Bundle; ein belastbarer inkrementeller Live-Content-Sync fehlt als nachgewiesene Gesamtlösung.
- Der bisherige einfache Quelllink `/q/<id>` in einzelnen Modellen ist nicht automatisch eine gültige kanonische Beitragsquelle oder Qurʾān-Versreferenz; source-ID-Mapping muss korrigiert und getestet werden.
- Eine online ladende Web-Inhaltsbrücke ist als Zwischenlösung vorhanden. Sie ist **kein** Ersatz für native Implementierung, keine Garantie für Offline-Zugriff und nicht als vollständig getestet zu betrachten.
- Tatsächlicher Xcode-Build, Laufzeit auf iPhone und Push-Zustellung sind noch gesondert zu verifizieren.

## 2. Designphilosophie: frühes islamisches Schrifterbe + Apple-Nativität
**Leitidee:** Eine überlieferungsbewusste Lesebibliothek, deren Benutzerführung sich selbstverständlich wie eine iPhone-/iPad-App anfühlt.

Historische Genauigkeit: frühe Handschriften des 7. Jahrhunderts liefern Schriftcharakter, Tintenwirkung, großzügige Ränder, zurückhaltende Struktur. Goldverzierungen und reich geschmückte Buchillustrationen sind **spätere historische Inspiration** und dürfen nicht als authentische Gestaltung von vor genau 1.400 Jahren ausgegeben werden. Keine ungesicherten bildlichen Darstellungen historischer Personen.

Anwendung: „Geschichte in den **Inhalten**, Gegenwart in den **Kontrollen**“.
- Apple Standard-Navigationsmuster; SwiftUI `TabView`/`NavigationStack`, auf iPad `NavigationSplitView` passend zur vorhandenen Deployment-Version.
- Liquid Glass, soweit vom Ziel-iOS unterstützt, **selektiv für Interaktion und Navigation**, nicht als permanenter Vollflächenfilter über Text; Fallback-Materialien für ältere unterstützte iOS-Versionen.
- Klassische Leseflächen mit subtiler Papierstruktur, edlen Trennlinien, wenigen Karten und großem Leseraum.
- 3D-Icons/Hero-Assets nur in passenden Stellen; nur vorhandene lizenzierte eigene Assets wiederverwenden oder separat freigegeben neu erzeugen. Keine Emojis als dauerhafte Ersatz-Icons.
- Ruhe statt übertriebener Effekte: animierte Übergänge 180–350 ms als Designziel (abhängig von Funktion und Reduce Motion), gezielte Buch-/Seiteneffekte statt permanenter Bewegung.

## 3. Verbindliche Design-Tokens (Startwerte; per Gerät testen)
### Farben
| Token | Hex | Verwendung |
|---|---|---|
| nightInk | #091B20 | dunkle Hauptfläche |
| deepEmerald | #16372F | Hauptfarbfamilie |
| antiqueGold | #C7A66C | sparsame Akzente / Schlüsselaktionen |
| parchment | #F1E6D2 | helle Leserfläche |
| inkBrown | #76604F | historische sekundäre Details |
| readerInk | #18221F | Lesetext auf Pergament |
| mutedText | system-secondary | Fließtext-/Metadatenhierarchie |

- Drei abgestimmte Modi: **Nachtbibliothek**, **Pergament-Leser**, **Tiefblau & Messing**. Verlässliche Farbkontraste in allen Modi; nicht einfach Farben invertieren.
- Token ausschließlich zentral verwalten; bestehendes `DARNext/DesignSystem/Tokens/DARTheme.swift` prüfen und iterativ erweitern statt zweite, konkurrierende Tokensammlung anzulegen.
- Gold nie massenhaft für Fließtext; wichtige Interaktionen und Quellenmarker gezielt hervorheben.

### Typografie
- SF Pro / Systemschriften für UI, Controls, Captions; New York oder geeignete Serifensystemschrift für deutsche Editorial-Headlines.
- Arabische UI-Schrift: systemseitiges arabisches Font-Mapping; Qurʾān-Text getrennt: lizenzierte und geprüfte Uṯmānī-Schrift (z. B. KFGQPC/Amiri Quran nur nach Lizenz-/Darstellungsprüfung).
- Arabic shaping, Harakāt, Āyah-Zeichen und Rechts-nach-links strikt korrekt, auf Originaldatenbasis, ohne durch Gestaltungsfilter Textzeichen zu verändern.
- Dynamic Type, Bold Text, VoiceOver, Textauswahl, ausreichende Zeilenhöhen, kein abgeschnittener Text.

### Layout
- Rhythmus: 4/8/12/16/24/32 pt; Textblockbreite beim iPad begrenzen; Leserand angenehm großzügig.
- Keine endlosen Kartenreihen oder doppelten Navigationsleisten; ein Schwerpunkt pro Bildschirm.
- Touch-Flächen in der Regel mindestens 44×44 pt; Safe Areas konsequent; kurze vertikale Wege und klare Tabnavigation.
- Adaptive Darstellung für kompakte iPhones, große iPhones (inkl. iPhone Duo), iPad Hoch-/Querformat, Tastatur und Stage Manager.
- Keine erfundene Swipe-Navigation zwischen Haupttabs; Seitenwechsel bleiben kontrolliert und zugänglich.

## 4. Informationsarchitektur und Leseflüsse
**Hauptnavigation bleibt zunächst 5 Tabs:** Start · Qurʾān · Beiträge · Wissen · Mehr. Später nur nach UX-Prüfung ändern.
- **Start:** kompakter Salam, „Beiträge nach Qurʾān, Sunnah und Āṯār“, aktuelle Āyah, verifizierter Beitrag, Wiederaufnehmen, Gebetszeiten nur mit echtem Standort/Berechnungswert, Schnellaktionen. Keine übergroße Hero-Überschrift und keine redundanten Kacheln.
- **Qurʾān:** Sūrenliste, native Muṣḥaf-Leseansicht, Arabic-first, optional Deutsch/Transliteration, Wortmarkierung, Āyah-Auswahl, Tafsīr/Tadabbur nach Quellenstatus, versgenaues Audio, Wiedergabe fortsetzen, Bookmark.
- **Beiträge:** Themen und Suche, chronologische/sachliche Filter, fließende Leseseiten mit Titel, Aussage, Gelehrtem, Werk, Original-/Übersetzung, Quellen-Panel und optional 2–3-zeiligem Fazit. Teilen, Speichern, Quellenbeleg kopieren.
- **Wissen:** Bücher, Gelehrtenregister, Ḥadīṯ/Āṯār, thematische Lernbereiche, verifizierte PDFs, Duʿāʾ- und Lernstudio, Quiz. Wissenschaftlicher Quellenstatus jederzeit erkennbar.
- **Mehr:** Suche, Sprache, Anzeige/Schriftgröße, Offline-Downloads, Audioeinstellungen, Berechtigungen, Kontodaten wenn tatsächlich vorhanden, Datenschutz, Quellenmethodik.
- **Globale Suche:** nach Āyāt, Titeln, Themen, Gelehrten, Autoren, Büchern, Quellen und Duʿāʾ; arabische Suche mit/ohne diakritische Zeichen, transliterierte Varianten. Ergebnislink führt in *genau* das zugehörige Objekt.

### Fünf Referenzseiten zur Validierung
1. Start / Dashboard — endgültiger visueller Stil samt Navigation und realen Daten.
2. Wissenschaftsblatt — Aussage/Original/Quelle/Fazit als typografischer Reader; Quellen-Sheet mit korrekter URL.
3. Muṣḥaf-Leseraum — korrekter arabischer Satz, strukturierte deutsche Übersetzung, native Audio-Kontrollen.
4. Duʿāʾ-Lernstudio — Ganz/Langsam/Wort-für-Wort, Text-/Audio-Synchronisierung nur wenn Assets verfügbar.
5. Forschungszentrum — Suchergebnisse, Querverweise, Filter, Quellenstatus, verifizierter Inhalt.
Andere Features werden danach aus diesen geprüften Mustern abgeleitet.

## 5. Kanonische Inhalts- und Quellenlogik
**Eine redaktionelle Wahrheit:** Veröffentlichungen und Korrekturen entstehen zentral; DARNext, Website, PWA und andere Clients sind getrennte Ausgabeschichten.
- Kanonische **Beitrags-ID** bleibt über alle Sprachen, Clients, Push-Events und Korrekturen unverändert. Kanonischer Q-Quellenlink `https://dar-al-tawhid.de/q/<nummer>/` wird nur aus der geprüften Q-Registry bezogen und nicht aus einer beliebigen Beitrags-ID konstruiert.
- **Qurʾān-ID** ist `surah:ayah` bzw. eindeutige Āyah-ID; sie ist nicht automatisch dieselbe Nummer wie ein /q/ Quellenbeleg.
- Geschützte Felder: arabisches Original, Autoren-/Werktitel, verifizierte Fundstelle, Freigabe-/Reviewstatus, Quellenhash, Veröffentlichungs-ID.
- Quellbelege explizit: Urheber, Werk, Edition, Band/Seite/Nummer falls verfügbar, Originalbeleg, Überprüfung, digitale Verknüpfung. Keine Quellen erfinden; ungesicherte Metadaten als ungesichert kennzeichnen.
- Maschinelle Übersetzung **nicht** ungeprüft als religiös geprüft oder freigegeben kennzeichnen. Freigabestatus `draft`, `approved`, `published` technisch getrennt.
- Neun Sprachen als Ziel: Deutsch, Türkisch, Englisch, Hocharabisch (Fuṣḥā), Kurmancî, Soranî, Bosnisch, Französisch, Spanisch. RTL für ar/ckb, LTR für übrige.
- Inhalte und Änderungsdatum müssen zentral synchronisiert werden; nur veröffentlichte und dafür freigegebene Daten in der Besucher-App anzeigen.

## 6. Synchronisations- und Offlinevertrag
Die lokale Sammlung bleibt Offline-Basis, wird aber nicht zum zweiten manuell gepflegten CMS.
1. Kanonische Datenquellen inventarisieren (Website/GitHub und ggf. tatsächlich vorhandene Content-API). Kein neues Format erfinden, wenn ein vorhandener versionierter Feed nutzbar ist.
2. Versioniertes **Content Manifest** mit schemaVersion, contentVersion, Artikel-ID, Q-ID, Sprachen, reviewStatus, Hash, updatedAt und optional Asset-Verweisen entwerfen. Herkunft des Manifests explizit dokumentieren.
3. Delta-Sync für neu/verändert/withdrawn; atomare Updates, per-Objekt-Hash, Caching, Retry/Backoff, ETag/If-Modified-Since wo unterstützt.
4. Lokal verifizierte Bundledaten als Startbestand; SwiftData/Dateicache nur nach Migrationstest und Deployment-Target-Prüfung. Keine Datenverluste bei Schemaänderung; Offline-Lesefunktion bleibt verfügbar.
5. Benutzerzustand getrennt speichern: Lesezeichen, Fortschritt, Favoriten, Downloads und Anzeigepräferenzen. Ein Content-Update überschreibt diese Zustände nicht.
6. PDFs/Audios nur mit validierter URL, Berechtigung und erwarteter Integrität herunterladen; fehlende Dateien nicht als „offline vorhanden“ darstellen.
7. Nach zentraler Freigabe werden Inhalte **global bereitgestellt**; **Push-Mitteilungen** sind ein separater Kanal. Benachrichtigung nur nach entsprechender Veröffentlichungs-/Push-Regel, nie automatisch für bloße Korrekturen oder interne Entwürfe.
8. Native DARNext-Push-Registrierung, Sprache, Deep Links, Foreground/Background-Verhalten und Zustellung mit OneSignal/APNs nur anhand echter bestehender Konfiguration integrieren. Kein neues paralleles Empfängersystem.
9. App-Funktion und Web-Verfügbarkeit entkoppeln: Ein Ausfall der Website darf die lokal hinterlegte Qurʾān- oder Bibliotheksansicht nicht blockieren.

## 7. Native Apple-Funktionen — nur bei echter Verfügbarkeit
- **Qurʾān-Audio:** AVFoundation, Now Playing, Sperrbildschirm, Control Center, AirPlay wo machbar, Geschwindigkeit, Sleep Timer, Wiederholung, Skip und Wiederaufnahme; bestehendes `QuranAudioEngine` auf funktionale Vollständigkeit auditieren.
- **Gebetszeiten/Qibla:** echte Standortberechtigung, nachvollziehbare Zeitzone/Berechnungsmethode, Offline-Fallback, klarer Permission-State. Keine Platzhalterzeit als echt anzeigen.
- **Bibliothek:** PDFKit, native Downloadverwaltung, Lesefortschritt, Quellverlinkung, optionale Markierungen, große Schrift.
- **App Intents/Spotlight:** Suche und Shortcuts mit geprüften Inhalts-IDs; keine leeren Entrypoints.
- **Widgets/Live Activities:** erst für DARNext isoliert spezifizieren und Signing/Entitlements sorgfältig prüfen. Bestehende reguläre iOS-Widgets **nicht** beschädigen oder migrieren.
- **Apple-spezifisch:** Haptik behutsam, iOS Share Sheet, Kontextmenüs, Fokus-/Tastatursteuerung auf iPad, sinnvolle Übergänge, Reduce Motion.
- **KI-Wissensassistent:** ausschließlich aus freigegebenem Index und vollständigen Quellbelegen antworten, keine Halluzinationen oder angeblichen Prüfbestätigungen; vorrangig in separater Phase und mit fehlender Belegbarkeit klar gekennzeichnet.

## 8. Implementierungsphasen (kein Big-Bang-Rewrite)
**P0 — Audit/Schutz:** Istzustand, Branch, Target/Schemes, Signing, Bundle-ID, Ressourcenpfade, bestehende Tests erfassen. Arbeitsbaum sichern. Keine fremden Änderungen rücksetzen. Offene Blocker dokumentieren.

**P1 — Designsystem & drei native Vertikalschnitte:** Tokens/Typografie/Assets; Dashboard, Wissenschaftsblatt und Qurʾān-Reader als produktionsnahe native Referenz. Bestehende ContentRepository-API nutzen, keine Fake-Daten.

**P2 — Wissenschafts-UX:** Bibliothek mit echtem PDF, quellengebundene Detailansichten, thematische Register, globale Suche, Duʿāʾ-Studio und Quiz; 5-Tab-Shell beibehalten.

**P3 — Content-Vertrag:** kanonische ID-/Q-Registry-Korrektur, API/Manifest/Delta-Sync, Withdrawals, Backward Compatibility, Offline-Fallback, Sprachwahl und genehmigte 9-Sprachen-Integration.

**P4 — Apple-Integration:** Audio, Berechtigungen, systemweite Suche, Benachrichtigungen, Links/Teilen, Widgets nur bei separater ausdrücklicher Entscheidung, iPad-Adaption.

**P5 — QA/Polish:** iPhone/iPhone Duo/iPad, VoiceOver, Dynamic Type, RTL, Dark/Light, Airplane Mode, niedrige Datenrate, Cold Start, Cache, Audio-Unterbrechungen, Deep Links, Quellhash, langsame/fehlerhafte Serverantwort.

**P6 — Release nur nach expliziter Freigabe:** Packaging, App Review, App Store, TestFlight, Versions-/Buildnummern und Live-Push bleiben außerhalb dieses Designauftrags.

Nach **jeder** Phase: kleiner isolierter Commit, reproduzierbare Tests, Screenshots oder simulierte UI-Prüfung, welche Features echt funktionieren / welche nur Entwürfe sind.

## 9. Abnahme / Definition of Done
- iPhone UND iPad: keine abgeschnittenen Elemente, keine toten Buttons; Tablets mit sinnvoller Zwei-Spalten-Navigation.
- Dashboard/Beiträge/Muṣḥaf als native SwiftUI-Screens aus echter lokaler oder freigegebener synchronisierter Datenquelle.
- Quell-URL aus kanonischer Registry, keine falsche Gleichsetzung Āyah-ID und /q/-ID.
- Arabisch mit Harakāt fehlerfrei, neun Sprachen korrekt getrennt, RTL/Font/VoiceOver geprüft.
- Vers-Audio und Teilen/Lesefortschritt funktionieren; fehlende Audio-/PDF-Dateien zeigen ehrlichen Status.
- Offline mindestens für gebündelte Inhalte; Netzwerkausfälle legen Root-Navigation nicht lahm.
- Keine unfreigegebenen maschinellen Übersetzungen als veröffentlicht; keine Benachrichtigung ohne passende Freigabe.
- Vergleich mit bestehender regulärer DĀR-iOS-App und Kids-App: Bundle/Target/Schemes und Widgets unverändert.
- Clean Build und Tests, inklusive aktueller `DARNextTests`, erfolgreich; falls in aktueller Umgebung blockiert: **nicht** als erfolgreich behaupten, präzisen Blocker protokollieren.
- Bericht mit implementierten Features, noch offenen Punkten, Commit-IDs, Testnachweisen und nächstem isolierten Schritt.

## 9a. UNVERÄNDERLICHER WIDGET-FREEZE · auf ausdrücklichen Wunsch des Projektinhabers
**Alle existierenden DĀR AL TAWḤĪD Widgets müssen unverändert bleiben.** Dieser Auftrag autorisiert ausschließlich DARNext-Inhalte, Gestaltung und DARNext-eigenen Code, **keinerlei** Widget-Umbau.

- Kein Ändern, Verschieben, Umbenennen, Ersetzen oder Löschen vorhandener Widget-Dateien oder Widget-Targets, insbesondere nicht an `DATPremiumWidgets`, `DARTawhidWidgetFresh`, anderen WidgetBundles/Extensions, WidgetKit Timelines, Watch-/StandBy-Widgets oder ihren Ressourcen.
- Keine Änderungen an bestehenden App Groups, Entitlements, Signing, Bundle-IDs, Widget-Deep-Links, Shared Stores, Schemes oder Projektreferenzen, die bestehende Widgets beeinflussen könnten.
- Keine Widget-Styles, Schriftarten, Farben, Texte, Icons, Layouts oder Datenquellen anpassen; keine Widget-Migration; keine neuen DARNext-Widgets im Rahmen dieses Auftrags.
- Bei gemeinsamem Projekt-/Codepfad zuerst Seiteneffekte ausschließen. Bei Konflikt Widget-Bereich vollständig unangetastet lassen und den Blocker melden.
- Vor jedem Commit `git diff --name-only` kontrollieren und jede Änderung mit Widget-/Extension-/AppGroup-Bezug abbrechen. Bereits vorhandene fremde Änderungen nicht löschen oder zurücksetzen; dem zuständigen Arbeitszweig zuordnen.
- Späterer Widget-Auftrag erfordert eine **neue ausdrückliche Zustimmung**, unabhängig vom vorliegenden Masterauftrag.

## 10. Harte Schutzregeln für Xcode/Codex
1. Nur DARNext-Dateien ändern, sofern nicht explizit eine gemeinsam genutzte nicht-breaking Schnittstelle freigegeben ist.
2. Keine Änderungen an `main`, Website-Livebereitstellung, /test/, Kids, Store-App, TV, Watch oder fremden Worktrees.
3. Projektdatei `.pbxproj` nur über ausdrücklich zulässige und sichere Xcode-Projektverwaltung; bei Tool-/Policyblockade nicht über verbotene Shell-/Patch-Umwege erzwingen. Ressourcenmitgliedschaft im Ziel prüfen.
4. Keine Builds/Tests/Installationen behaupten, wenn nicht wirklich ausgeführt. `Run` auf physischem iPhone ist nach lokalem Checkout und Build explizit nötig.
5. Keine App-Buildnummer, Signing/Entitlements, App-Groups, Push-Zertifikate, Produktionskonfiguration, Bundle-ID oder Scheme ohne Dokumentation und explizite Freigabe ändern.
6. Kein blindes Zusammenführen des früheren DARNext-Zweigs mit `main` (historisch kein gemeinsamer Vorfahr beim Vergleich); Konflikte erst sachlich inventarisieren.
7. Keine Massenumbenennungen, keine pauschalen Komplett-Rewrites, keine ungesicherte historische oder religiöse Quellenbehauptung.

## 11. Offizielle Apple-Referenzen
- Human Interface Guidelines / Branding: https://developer.apple.com/design/human-interface-guidelines/branding
- Design Resources (iOS-/iPadOS-Kits): https://developer.apple.com/design/resources/
- SwiftUI Navigation: https://developer.apple.com/documentation/swiftui/navigation
- SwiftData: https://developer.apple.com/documentation/swiftdata/
- PDFKit: https://developer.apple.com/documentation/pdfkit/
- AVFoundation: https://developer.apple.com/documentation/avfoundation/
- WidgetKit: https://developer.apple.com/documentation/widgetkit/
- ActivityKit: https://developer.apple.com/documentation/activitykit/
- App Intents: https://developer.apple.com/documentation/appintents/

## 12. Übergabe
Der operative Xcode-/Codex-Auftrag steht in **DARNext/Documentation/XCODE-MASTER-AUFTRAG-V1.md**. Zuerst beide Dokumente vollständig lesen, dann klein und überprüfbar Phase für Phase vorgehen. Dieser Master definiert das Zielbild, nicht die Behauptung, dass die Implementierung bereits abgeschlossen wäre.
