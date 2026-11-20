# DAR NEXT – Feature- und Branch-Matrix

**Snapshot-Kopie in PR #1812; lokale Quellstandgrenze und Abnahmelücken siehe Nachtrag am Dokumentende.**

Stand: 2026-11-19, 15:30 CET
Umfang: GitHub Issue [#1789](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1789)
Lokale Prüfkopie: `/Users/muwahhid91/Developer/DARNext-Local-20261117`, Branch `codex/darnext-scroll-jank-20261117`, ohne Commit/HEAD; DARNext-Dateien im lokalen Spiegel sind untracked.

## Zustandsdefinition

- **Teilweise fertig:** Funktion und Owner sind im Quellbaum vorhanden; mindestens ein Teil wurde lokal durch Tests/Belege geprüft, die volle Anforderung ist offen.
- **Nicht getestet:** Code ist vorhanden, aber für den aktuellen Stand fehlt ein belastbarer Laufzeitnachweis.
- **Offen:** angeforderte Qualität, Integration oder Freigabe ist noch nicht nachgewiesen.
- **Defekt:** ein aktueller, reproduzierter Fehler liegt vor. Ein früherer oder intermittierender Fehler wird als Risiko genannt und nicht als aktuelle Regression etikettiert.

## Produkt- und Plattformmatrix

| Bereich | Tatsächlicher Owner | Stand | Aktueller Beleg | Offen / nächster Schritt |
|---|---|---|---|---|
| Hauptnavigation | `DARNext/Shell/RootShell.swift` | Teilweise fertig | `DARNextTab.appleTabs` entspricht Start · Quiz · Beiträge · Qurʾān · Mehr; Neunsprachen- und RTL-Navigationstests existieren; letzter dokumentierter iPhone-Lauf besteht | iPad/Fold/RTL/VoiceOver/Dynamic-Type-Matrix auf aktuellem Stand vervollständigen |
| Startseite und Hero-Abstand | `DARNext/Features/Dashboard/DashboardView.swift` | iPhone/iPad geprüft; iOS-17-Runtime offen | iPhone 18 Pro Max / iOS 27.2 `testPrimaryHeroGapsRemainBoundedOnDevice` bestanden; iPad Pro 13 M5 / iOS 27.2 Hero-Gap-/Scroll- und Title-Collapse-Tests 2/2; geprüfte Abstände ≤24 pt. | iOS-17-Runtime und zusätzliche Größen-/Split-View-Breiten |
| Hero-Scrollen auf Start/Quiz/Beiträge/Qurʾān | jeweilige Feature-Views, `DARMotion.swift`, `DARNextMedia.swift` | Scrollgesten auf iPhone und iPad bestanden; Framequalität offen | iPhone `testImageBearingPrimaryTabsRemainResponsiveWhenScrolling` 1/1 mit zwei Scrollzyklen auf vier Tabs; iPad `testImageBearingPrimaryTabsRemainResponsiveWhenScrolling` 1/1 auf iPad Pro 13 M5 / iOS 27.2 am 20.11.2026 (vier Tabs). XCTHitch liefert `[]`; daraus folgt kein FPS-/Ruckelfreiheitsnachweis. | unterstützte auswertbare Hitch-/Frame-Messung auf Hardware oder bestätigtem Profilingpfad |
| Weitere Bildseiten: Frauen, Duʿāʾ, Jumuʿah, Hub, Bibliothek, Wissen | jeweilige Feature-Views, `DARNextMedia.swift` | Sechs aktuelle Bildbereichs-UI-Tests bestanden | iPhone 18 Pro Max / iOS 27.2: Duʿāʾ/Jumuʿah, Forum, Frauen-Hero, Gebet, Kalender, Tafsīr und Bibliothek im Lauf 6/6. Hadith-Hero-Scroll ist bedingt, falls statt Fehlerzustand tatsächlich der Hero geladen wurde. | weitere Bereichs-/Fehlerzustandsabnahme plus gemeinsame Hitch-Messung |
| Motion-Referenzfluss Start-Kapsel → Detail → Zurück | Dashboard, NavigationStack, Motion-Helfer | Teilweise fertig; iPad-Rückkehrtest am 20.11. bestanden | `testDashboardPrayerCardOpensDetailsAndReturnsToTheDashboard` nach Accessibility-Containerkorrektur auf iPad Pro 13 M5 / iOS 27.2 1/1; Beiträge öffnen nativen Reader und kehren zur Ursprungskarte zurück; Quiz Zoomroute vorhanden | vollständige stabile Identität, Scroll-/Suchrestoration, Reduce Motion, VoiceOver und visuelle Übergangsmessung pro Fluss |
| Beiträge und Quellen | `Features/Posts/PostsView.swift`, Content-/Knowledge-Modelle | Teilweise fertig; Buchquellen-Rückweg auf iPhone bestanden | Fazit-Trennung begrenzt; `testPostRelatedBookOpensInLibraryAndReturnsToPost` auf iPhone 18 Pro Max / iOS 27.2 bestanden 1/1; Startposition/Quellrückkehr in diesem Pfad sichtbar geprüft. | Quelle → Erklärung/Lernpfad/Quiz und vollständige Such-/Scrollrestoration |
| Qurʾān, Lesen und Audio | `Features/Quran/`, `Features/Audio/` | Teilweise fertig | ältere iOS-Versionen nutzen jetzt `AVAudioSession.interruptionNotification`; automatisches Fortsetzen ist an vorherige Wiedergabe plus `.shouldResume` gebunden. Audio-Unterbrechungspolicy ist in der aktuellen 45/45-Unit-Suite enthalten. | realen Telefon-/Siri-/Routewechseltest; Scrollzustand während Audio und Wiederaufnahme auf Gerät prüfen |
| Bibliothek und persönliche Sammlung | `Features/Library/` | Teilweise fertig | verifizierter lokaler Reader und persönliche Bibliothek haben UI-Testabdeckung | aktuelle iPad-/Split-View-, Accessibility- und Rückkehr-Matrix |
| Duʿāʾ und Dhikr | `Features/Dua/`, `Features/Dhikr/` | Teilweise fertig | Reader-Sheet-/Erreichbarkeitstests vorhanden; `testMoreOpensDhikrAndForumAreas` **1/1 bestanden** inklusive Forum-Hero-Scrollgeste; Neunsprachen-UI-Test prüft Dhikr-Titel, Beschreibung, Zählerbeschriftung, Aktion und Zielpicker auf iPhone 18 Pro Max / iOS 27.2 **1/1 bestanden**; Katalog-`plutil -lint` 9/9 bestanden | Übersetzungsreview über die Dhikr-Auswahl hinaus sowie vollständige Locale-/RTL-Matrix anderer Featureflächen |
| Quiz | `Features/Quiz/QuizView.swift`, `QuizQuestion`, `DARQuizRoundSelection` | Teilweise fertig; neue Zustände neunsprachig zur Laufzeit geprüft | 14 Status-/Zählertexte in neun Locales; Neunsprachen-UI-Test 1/1 und Kurmancî-Lateinschrift-Test 1/1 auf iPhone 18 Pro Max / iOS 27.2. Qurʾān-Quellen öffnen nach Antwort die ermittelte Āya; Unit-Target 43/43 einschließlich Katalogvalidierung. | Filter-/Quellenlabels, vollständiger RTL-Zähler-/Accessibility- und Lernfortschritt-Test |
| Gebetszeiten, Qibla, Kalender, Zakat | `Features/Prayer/`, `Features/Qibla/`, `Features/Calendar/` | Teilweise fertig | Native Zustände, Detail-Rückkehr, Einstellungen, Berechtigungs-/Snapshot-Parser und Beispielrechnung besitzen Tests | Live-Ortungs-/Zeitzonen-/Kompass- und iPad-Abnahme; keine Änderung an Berechnungsverträgen ohne separaten Nachweis |
| Suche | `Features/Search/SearchView.swift`, Repository | Teilweise fertig | Suchindex-Fingerprint und verifizierte Suche haben Unit-Abdeckung | Sheet/Fokus/Tastatur, große Schrift, RTL und Rückkehr zum exakten Ursprung |
| Inhalte und Offline-/Delta-Sync | `Data/DARNextContentSyncService.swift`, `ContentResourceStore.swift` | Teilweise fertig | Validator-Wachstum/Rücknahme, atomare Aktivierung und last-known-good-Fallback haben Unit-Tests | Live-Manifest bleibt flach; serverseitige Tombstones/Widerruf und echter Remote-Publishvertrag sind offen |
| Themes und Sprache | `DARTheme`, `Resources/Localization/*.lproj` | Teilweise fertig; Quiztexte zur Laufzeit geprüft | Neunsprachen-Lauf 1/1 nach Kurmancî-Korrektur; `ku` Kurmancî in Lateinschrift, `ckb` Sorani; alle neun Locale-Dateien lintfrei. | RTL-Geometrie, VoiceOver, Dynamic Type und übrige Seiten weiter prüfen |
| Accessibility / Reduce Motion | gemeinsame Komponenten und Feature-Views | Teilweise fertig | Posts-Speichern verwendet jetzt den gemeinsamen Reduce-Motion-Schalter und unterdrückt den Herz-Bounce; neue Unit-Assertion im aktuellen 44/44-Lauf enthalten. UI-Lauf mit aktivierter Systemoption fehlt. | VoiceOver, Voice Control, Kontrast, systemweite Reduce-Motion-Runtime, XXL-/XXXL-Schrift screenweise auf Geräten |
| iPad, Landscape, Split View, Fold | Shell und responsive Feature-Layouts | Portrait/Landscape geprüft; Split View/Fold offen | iPad Pro 13 M5 / iOS 27.2: Hero-/Orientierungs- und Gap-/Collapse-Tests aktuell 2/2, vier primäre Tabs abgedeckt. | Split View, Stage Manager, schmale Breite und Fold-Gerät fehlen |
| Start-/Laufzeit-Performance | SwiftUI-App und Asset-/Content-Caches | Offen für echte Framequalität | asynchroner deduplizierter Hero-Decode, NSCache-Limit 96 MiB; sekündlicher Dashboard-Gebetsticker auf zeitabhängige Zeilen begrenzt; Scrollgesten auf iPhone/iPad bestanden. XCTHitch `[]`. Ein `Animation Hitches`-Profilinglauf vom 20.11. blieb leer; der parallele UI-Test endete nach 216,9 s beim Resultbundle-Import mit ENOSPC (Exit 73), Bundle unlesbar. | Hitch-/Frame-/Memory-/Energy-Messung fehlt; kein Ruckelfreiheitsnachweis |
| GitHub-Codebasis und reviewbarer PR | GitHub-Branches vs. lokaler Spiegel | Offen / genauer Abgleich läuft | Live-Compare von `codex/darnext-native-masterauftrag-20261024` gegen `main`: Branch ist 21 Commits voraus, 1.829 zurück, gemeinsamer Merge-Base `d277aec…`; für diesen Head besteht kein offener PR. Die lokale Referenzkopie ist shallow, daher waren ihre Merge-Base-Resultate nicht aussagekräftig. Von 325 DARNext-/Testdateien stimmen im lokalen Snapshot 226 bytegenau mit diesem Branch überein, 99 weichen ab; 4.492 zusätzliche lokale Ressourcen/Dateien brauchen gezielte Provenienz- und Inhaltssichtung. Lokaler Arbeitsbaum weiterhin ohne HEAD und vollständig untracked. | Gegen den gemeinsamen Merge-Base den vollständigen App-Diff und lokale Zusatzinhalte abgleichen; danach isolierten, reviewbaren PR herstellen |
| DĀR Intelligence | separater Issue #1791 | Aus Scope #1789 ausgeschlossen | Masterauftrag trennt Assistenz-/AI-Entwicklung und untersagt ungeprüfte Paid-/Cloud-Aktivierung | keine Implementierung oder Aktivierung in diesem Gesamtauftrag |

## Quellstand- und Abnahmehinweis

Diese Tabelle ist aus der lokalen Feature-Matrix übernommen und beschreibt den dort untersuchten, untracked DARNext-Snapshot. Sie ist **nicht** der Nachweis, dass derselbe Quellstand in PR #1812–#1817 enthalten ist. Der lokale Checkout hat keinen Commit/HEAD; GitHub-PRs beruhen auf einem älteren nativen Branch. Vor einer Produktänderung muss der Datei-/Commit-Abgleich abgeschlossen werden.

GitHub vergleicht den nativen DARNext-Branch mit `main` als `diverged`: 21 Commits voraus und 1.829 zurück, Merge-Base `d277aec2658c3640b360bafea1aebbc12da23bad`. Der lokale Blobvergleich ergab 226 identische Pfad-/Blobpaare, 100 gleiche Pfade mit anderem Inhalt, 5.067 nur lokale und 15.235 nur remote vorhandene Dateien. Diese Zahlen belegen keine vollständige Abstammung des lokalen Snapshots.

Die dokumentierten Scrollgesten und begrenzten Hero-Abstände sind keine Messung von Bildrate oder Frame-Hitches. **Das beobachtete Scrollruckeln bleibt unaufgelöst, bis unterstützte Frame-/Hitchdaten auf derselben bestätigten Buildrevision vorliegen.**

Die Matrix bleibt offen für den vollständigen Dashboard→Detail→Ursprung-Fluss, neun Sprachen und RTL, VoiceOver, Dynamic Type, systemweite Reduce Motion, Split View/Fold, echte Audio-/Standortpfade, Offline-/Remote-Sync, ältere unterstützte iOS-Versionen sowie Start-/Speicher-/Energie-Messung.

PRs #1812–#1817 sind Drafts. Das kombinierte Xcode-Ergebnis meldete 9/9 Unit-Tests, aber das Resultbundle konnte wegen ENOSPC nicht vollständig geschrieben werden. PR #1817s Build und UI-Assertion wurden noch nicht ausgeführt. Keine vollständige App-Abnahme, kein Merge und kein Release.

## Ergänzende Git-Objektprüfung, 2026-11-20

Der lokale Spiegel hat weiterhin keinen Commit/HEAD; App- und Testquellen sind untracked. Eine vollständige read-only Prüfung mit `git fsck --full --no-reflogs --unreachable` fand viele nicht referenzierte Commitobjekte. Der Metadatenabgleich lieferte ältere Web-/Hero-Commits sowie die bekannten DARNext-Dokumentations- und Audio-PR-Commits, aber keinen identifizierten Commit, der den lokalen DARNext-Snapshot als Branchspitze belegt.

Zusätzlich wurden vier lokale Swift-Dateien gehasht und gegen alle derzeit im lokalen Object Store verfügbaren Git-Objekte geprüft. Exakte lokale Blob-SHAs: `DARMotion.swift` `d7491a96ac959e4581acd71cff029f2cedf303f6`, `RootShell.swift` `9194c1a96d844fbdaf3bd6850ac115680eb2de36`, `DashboardView.swift` `ee3ee3d30501019acffd1df2568a198337667cfc`, `DARTheme.swift` `fd03bbe1e7d6248243ae3751b6ad7d62958b907c`. Keiner dieser vier Blobs ist unter den derzeit lokal verfügbaren Git-Objekten vorhanden. Git kennzeichnet das Repository als Promisor-Repository und warnt, dass manche Objekte nicht geladen sein könnten. **Ergebnis:** kein lokaler Commit/Blob belegt die Abstammung; wegen nicht geladener Remote-Objekte lässt sich eine anderweitige historische Kopie nicht ausschließen. Die lokalen Dateien bleiben unberührt.

Dieser Befund ändert die nächste notwendige Arbeit nicht: erst den vollständigen Quellstand aus einer belegten, lesbaren Quelle rekonstruieren oder den ursprünglichen Erzeugungs-/Exportnachweis finden, dann Produktänderungen portieren. Die 100 MiB freie Kapazität verhindern weiterhin belastbare neue Xcode-/Simulator-Läufe.

## Laufzeitnachtrag, 2026-11-20

- Auf iPad Pro 13 M5 / iOS 27.2 bestand `testDashboardPrayerCardOpensDetailsAndReturnsToTheDashboard` nach einer lokalen Accessibility-Korrektur **1/1**. Ursache war eine auf alle Nachfahren vererbte Section-ID; `.accessibilityElement(children: .contain)` erhält jetzt getrennte IDs. Das Produktfix liegt nur im untracked lokalen Snapshot und wurde wegen ungeklärter Abstammung nicht in diesen PR portiert.
- Derselbe iPad-Lauf bestand den Bildseiten-Scrollgestentest über Start, Quiz, Beiträge und Qurʾān **1/1**. Das ist Gesten-/Navigationsevidenz, keine Bildratenmessung.
- Der Versuch, während dieses Scrolltests Instruments `Animation Hitches` aufzuzeichnen, erzeugte keine verwertbare Trace (0 Byte vor Prozessabbruch). Xcode brach das Testresultat nach 216,9 s beim Schreiben des Resultbundles mit `ENOSPC` ab; das neue Bundle ist nicht lesbar. Daher keine zusätzlichen Hitchdaten.
- Die frühere unprofilierte Scrollrunde bleibt als bestanden belegt. Die Ruckelfreiheit ist weiterhin **nicht abgenommen**. Neue Xcode-/Simulatorläufe warten auf verfügbaren Speicher.
- Gesamtauftrag #1789, Quellstand-Abgleich, volle Feature-/Accessibility-/Plattformmatrix, PR-Integration und Release-Gates bleiben offen. Keine Merge-/Release-Aussage.

## GitHub-Branchaudit, 20.11.2026

Dieser Nachtrag betrifft den separaten GitHub-Quellstand `codex/darnext-primary-deep-links-20261120`, Commit `31c9e7932370d8dde5a6e65a9eee07173fd024d3`. Er ersetzt nicht die oben dokumentierte lokale, untracked Prüfkopie.

- Die 64 gebündelten Beitrags-Markdown-Dateien enthalten keine explizite `canonicalQSourceNumber`-/`qSourceNumber`-Zuordnung. Es wurden keine Qurʾān-IDs ergänzt oder aus Titeln abgeleitet.
- Die 600 Quizfragen erfüllen im geprüften Datensatz das Prädikat veröffentlicht/freigegeben/quellengeprüft. Es gibt zwei exakte Themenübereinstimmungen mit Beiträgen (`Brüderlichkeit` ↔ `quiz-445`) und 14 exakte Kategoriezuordnungen (Adab 7, Fiqh 4, Tawḥīd 1, Tazkiyah 2).
- PR #1825 ergänzt dafür einen ausdrücklich beschrifteten Quiz-Kontext (Thema, sonst passende Kategorie) sowie Unit-/UI-Testquellen. Diese Tests wurden für den PR-Head nicht ausgeführt; Parserprüfung allein belegt weder Build noch Laufzeit.
- Die offene PR-Kette ist nicht als integrierter Build zu behandeln. Insbesondere gehören Dokumentations- und Matrixänderungen aus #1812 nicht automatisch zu den darauf aufbauenden, früher abgezweigten PR-Heads. Vor einer Integration muss die konkrete Basis und der resultierende Gesamtdiff je PR geprüft werden.
- Aktueller Simulatorstatus (13:35 CET): iPhone 18 Pro Max / iOS 27.2 ist im CoreSimulator gebootet; DARNext läuft (PID 71222). `Simulator.app` fehlt weiterhin, daher gibt es kein sichtbares Xcode-Simulatorfenster. Nach dem Entfernen des zuvor ausdrücklich freigegebenen, regenerierten `SDKExplicitPrecompiledModules`-Caches (67 MiB, 87 Dateien, keine offenen Handles) gelang ein aktueller `simctl`-Screenshot unter `/tmp/darnext-current.png` (1.91 MB); er zeigt die Startseite des installierten DARNext-Builds. Der Build ist keinem GitHub-Commit zugeordnet und belegt keine Abnahme der PR-Heads. Der verfügbare Speicher lag danach bei rund 180 MiB.
- Der installierte App-Build ist nicht auf einen GitHub-Commit zurückgeführt. Er ist kein Abnahmenachweis für #1812, #1820 oder #1825. Der dokumentierte Hero-/Scrollteststand oben bleibt maßgeblich: Gesten und begrenzte Hero-Abstände bestanden, Frame-Hitches/Ruckelfreiheit sind nicht nachgewiesen.

Der eigenständige Arbeitsnachweis in PR #1824 wurde zugunsten dieses bestehenden Masterdokuments entfernt, damit keine zweite, abweichende Gesamtmatrix geführt wird.

## Compact-iPad-Abstand, 20.11.2026

- Im lokalen untracked Snapshot `DARNext/Shell/RootShell.swift` fügt `DARNextTabShell` bei regulärer Größenklasse und `geometry.size.width < 860` pauschal 42 pt oberhalb des Markenheaders ein. Der Kommentar nennt Abstand für die schwebende iPad-Tabauswahl. Dieser Wert sitzt oberhalb des Markenheaders und beweist allein nicht die darunter sichtbare Lücke.
- Die dokumentierten iPad-Hero-Gap-Läufe waren auf iPad Pro 13 M5. Sie belegen die getestete breite Geometrie, aber keinen schmalen iPad-/Split-View-Fall unter 860 pt. Ein gezielter Lauf dort fehlt.
- Der beigefügte iPad-Ausschnitt zeigt Abstand zwischen Markenleiste und Qurʾān-Banner. Das Bild allein identifiziert weder Simulator-Build noch Breite in Punkten. Der installierte DARNext-Build ist keinem Commit zugeordnet; außerdem fehlt die sichtbare `Simulator.app`.
- **Nächste belastbare Prüfung:** dieselbe installierte bzw. anschließend commit-verifizierte App in iPad 11-Zoll-Portrait und schmaler Split-View ausführen, Screenshot aufnehmen und Markenleisten-Unterkante gegen Banner-Oberkante messen. Erst damit entscheiden, ob die 42-pt-Shellregel, ein NavigationStack-Top-Inset oder eine weitere Seiteigenschaft die Lücke verursacht. Keine Änderung am untracked Snapshot ist vorgenommen.


## Update: Kartenfluss-PR und Simulatorstatus, 20.11.2026

- Draft-PR [#1826](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1826) ergänzt im GitHub-Quellstand die Startseiten-Gebetszeitenkarte → native Gebetszeiten-Detailansicht → Zurück zur Ursprungskarte. iOS 18+ erhält die gemeinsame Zoom-Transition; iOS 17 und aktiviertes „Bewegung reduzieren“ nutzen reguläre Navigation. Der UI-Test dafür ist geschrieben.
- Swift-Parserprüfung der beiden App-Dateien und der UI-Testdatei bestand. Xcode-Build und XCTest sind für PR #1826 noch nicht gelaufen. Der Draft-PR ist nun sauber auf #1822 gestapelt; sein Branch enthält einen Commit mit nur DashboardView und UI-Test, und GitHub meldet ihn als mergeable. Die `DARMotion.swift`-Datei bleibt unverändert aus #1822.
- Aktueller Laufzeitstand: iPhone 18 Pro Max / iOS 27.2 ist gebootet; com.daraltawhid.darnext.DARNext läuft in SpringBoard (PID 71222). Der simctl-Screenshot /tmp/darnext-iphone18pm-current.png wurde am 20.11.2026 aufgenommen und zeigt die App. Dieser Simulator-Build ist keinem GitHub-Commit zugeordnet.
- Sichtbares GUI-Fenster bleibt blockiert: Simulator.app fehlt sowohl unter Xcode.app/Contents/Developer/Applications als auch Xcode.app/Contents/Applications; xcodebuild -runFirstLaunch -checkForNewerComponents meldet „No new updates for 27B52“. In dieser Installation ist kein Simulator-GUI-Zusatz verfügbar. Keine Xcode-/Simulator-Daten wurden entfernt.
- Der vollständige Kartenfluss, Scroll-Framequalität sowie die weiteren Punkte des Gesamtauftrags #1789 bleiben offen und un-abgenommen.


## Nachtrag PR #1825, 20.11.2026

- Die quizbezogene Beitragskarte stellt Titel/Zähler nun als SwiftUI-`Text`-Literale mit Interpolation bereit, damit sie in einen späteren String-Catalog-Lokalisierungslauf aufgenommen werden können; es wurden keine Übersetzungen behauptet oder hinzugefügt.
- Die Karte fasst ihre sichtbaren Texte für assistive Bedienung zusammen und blendet dekorative Symbole aus.
- Alle fünf geänderten Swift-Dateien auf PR-Head `codex/darnext-post-quiz-context-20261120` wurden am 20.11.2026 mit `swiftc -frontend -parse` geprüft: 5/5 Parserläufe erfolgreich. Build, Unit- und UI-Tests bleiben offen; GitHub-PR #1825 bleibt Draft.
