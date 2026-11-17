# DĀR NEXT → DĀR AL TAWḤĪD
## MASTER-AUFTRAG · CLASSICAL HERITAGE × NEXT GENERATION UX/MOTION
**Ausgabe:** 2026-11-16 · **Projekt-Ticket:** https://github.com/Sero91ak/dar-al-tawhid-site/issues/1789
**Status:** Verbindlicher Implementierungsauftrag für ChatGPT Work/Xcode, **kein fertiger Code und kein Release-Nachweis**.
**Leitsatz:** BESTAND ERWEITERN, NICHT NOCH EINMAL UMBAUEN.

### 0. SOFORTIGE ARBEITSANWEISUNG
Du arbeitest am bestehenden Produkt **DAR NEXT**, das nach erfolgreicher Abnahme die DĀR AL TAWḤĪD App ablösen soll. Das Projekt wurde bereits erheblich umgebaut, auch am 16.11.2026. Verwirf diese Fortschritte nicht. Ermittle zunächst den **jüngsten tatsächlich vorhandenen Quellstand** inklusive nicht gemergter GitHub-Branches/PRs und etwaiger lokaler Xcode-Änderungen, sofern der Workspace darauf Zugriff hat. Eine unveröffentlichte lokale Änderung darf niemals als auf GitHub vorhanden angenommen werden. Nichts neu erfinden, was schon implementiert wurde.

**Ziel:** Die vorhandene App durch präzise, wiederverwendbare interaktive Übergänge, raffinierte Mikroanimationen, herausragende UI/UX, moderne Accessibility, echte nativ-adaptive Bedienung und zukunftsfähige Architektur verbessern. Erst das Fundament und ein vollständig getesteter Referenzfluss; anschließend Stück für Stück auf alle passenden Bereiche übertragen. Kein Figma erforderlich. Keine unnötigen monatlich kostenpflichtigen Werkzeuge.

### 0a. KLARSTELLUNG DES NUTZERS (17.11.2026) – KEIN KOSTENPFLICHTIGER IN-APP-KI-AGENT
**Diese Klarstellung hat Vorrang vor allen älteren Erwähnungen von „AI“, „Assistant“ oder „intelligenter Suche“.**

**Trenne zwei ganz verschiedene Dinge:**
- **KI zur Entwicklung:** ChatGPT Work / Xcode-Coding-Assistenten dürfen außerhalb der fertigen App im Entwicklungsprozess helfen, soweit durch den vorhandenen Zugang abgedeckt. Das ist **keine** Funktion für App-Besucher.
- **KI innerhalb der DĀR-NEXT-App:** **Nicht beauftragt. Aktuell NICHT einbauen, NICHT aktivieren, NICHT als versteckte Abhängigkeit mitliefern.** Keine OpenAI-/Anthropic-/Google-/sonstigen LLM-APIs, keine bezahlten Agent-Abos, Credits, Tokenabrechnung, Chat-/Voice-AI-SDKs, externen KI-Endpunkte, zusätzlichen kostenpflichtigen Konten oder automatischen AI-Kosten. Keine „kostenlosen“ Testkontingente, deren Ablauf danach nutzungsabhängige Gebühren auslöst. Kein API-Schlüssel im Client.

**Bestehender Bestand:** Manche DAR-NEXT-Branches enthalten bereits einen \`DashboardAssistantView\`, eine „AI“-Registerkarte oder andere Assistant-Prototypen. Zuerst Datenfluss, Backend, Netzwerkanfragen, Kosten, Produktposition und tatsächliche Nutzung prüfen. Vorhandenen Code weder blind löschen noch ungefragt als funktionsfähigen Assistenten präsentieren. Sofern unqualifiziert oder kostenpflichtig, von der öffentlichen Navigation **entkoppeln/verdecken** (regressionssicher, ohne wichtige Nicht-KI-Funktionen zu verlieren) und die vereinbarte Erwachsenen-Tabfolge \`Start · Quiz · Beiträge · Koran · Mehr\` verwenden. Keine leere AI-Registerkarte.

**Eine optionale spätere islamische Wissens-/Lernassistenz ist NUR nach separater ausdrücklicher Freigabe denkbar und muss VOR jeglicher Aktivierung folgende Bedingungen erfüllen:**
1. **Keine zwingenden laufenden Kosten:** idealerweise vollständig On-Device/offline, aber erst nach konkreter Prüfung von Modell-Lizenz, Speicherbedarf, Hardware-Abdeckung, App-Größe, Betriebskosten und Qualität. Eine Gratis-API mit Kontingent ist nicht automatisch dauerhaft kostenfrei.
2. **Beleggebundene Inhalte:** nur kontrollierter, redaktionell freigegebener Qurʾān-/Sunnah-/Salaf-Quellenbestand mit exakter Fundstelle, ID/Version, Text-/Übersetzungsstatus und klarer Trennung von Originalzitat und Erläuterung. Nicht von sich aus Rechtsurteile, Hadith-Authentizität, Isnāde, Gelehrtenzitate oder arabische Belege erfinden.
3. **Unsicherheitsgrenzen:** bei fehlendem nachprüfbarem Beleg offen sagen, dass eine zuverlässige Antwort nicht möglich ist; keine absolute Behauptung „100 % islamkonform“, „fehlerfrei“ oder „superintelligent“. Schwierige ʿAqīdah-/Fiqh-/Fatwa-Fragen nur soweit belegbar, sonst keine verbindliche Fatwa.
4. **Nutzerorientierte Lerninteraktion:** Fragen beantworten, Lernquiz, Dialog-/Übungsmodus und eventuell Audio nur wenn sicher, verständlich, ausreichend intelligent und qualitätsgeprüft; vorerst sind traditionelle statische Inhalte, Suche und regelbasierte Quizfunktionen die Standardlösung.
5. **Datenschutz und QA:** kein ungefragter Audio-/Textabfluss, keine Nutzungsüberwachung, Sicherheits- und Quellen-Audits, Sprach-/RTL-Prüfung, evaluiertes Antwortverhalten und freiwillige Aktivierung statt verpflichtender Einrichtung.
6. **Projektgrenze:** Ein solcher Pilot ist **nicht** Teil dieses Motion-/UX-Auftrags. Darf nicht als Nebenprodukt von Work „einfach mit eingebaut“ werden. Vorher gesonderter Vorschlag mit tatsächlichen Kosten und Qualitätsnachweisen, anschließend explizite Genehmigung.

**Für diesen Auftrag konkret:** Alle gewünschten UI-/UX-, Navigations-, Motion-, Audio-, Quellen-, Such- und Performanceverbesserungen **ohne generativen KI-Agenten in der App** realisieren. „Intelligent“ meint hier gute UX, zuverlässige lokale Suche und nachvollziehbare reguläre App-Logik. Die Motion-Entwicklung braucht keinerlei KI-API.

### 0b. BEDINGTE ENTWICKLUNGSFREIGABE (17.11.2026) – DĀR INTELLIGENCE ALS EIGENER QUALITÄTS-TRACK
**Neuere Präzisierung der Nutzerabsicht, ersetzt den pauschalen „in der App nicht beauftragt“-Teil von 0a nur hinsichtlich Forschung/Prototyp. Die Paid-API- und Live-Sperre bleibt bestehen.**

Der Nutzer wünscht nun ausdrücklich eine **hochintelligente, adaptive, quellengebundene islamische Gesprächsassistenz** in der künftigen DAR-NEXT-App, **wenn** überprüfbare Gesprächs-, Lern-, Quellen- und Qualitätsanforderungen erfüllt werden und **keine verpflichtenden zusätzlichen KI-Kosten** entstehen. **Konzept, technischer Bestandsaudit und isolierte kostenlose On-Device-Prototypen sind beauftragt.** Nicht freigegeben: kostenpflichtige Anbieter, versteckte Cloud-LLM-Endpunkte, öffentlich aktivierter AI-Tab, automatische App-Store-Auslieferung oder die Behauptung, alle islamischen Fragen sicher beantworten zu können.

Verbindliches separates Issue: **[#1791](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1791)**.
Vollständiger Assistenz-Blueprint: **[DAR-INTELLIGENCE-ASSISTANT-BLUEPRINT-2026-11-17.md](DAR-INTELLIGENCE-ASSISTANT-BLUEPRINT-2026-11-17.md)**.

**Warum getrennt vom Motion-Auftrag?** Native Motion und Kartenübergänge müssen weiterentwickelt werden, auch wenn ein lokal ausgeführtes Sprachmodell die redaktionelle Qualitäts- oder Geräteprüfung nicht besteht. Der Forschungsstrang darf vorhandene Architektur nicht zurückbauen und keine Zusatzkosten erzeugen. Bei unzureichender Modellqualität bleibt eine deutlich als quellengebundene Suche/Lernassistenz gekennzeichnete sichere Variante verfügbar.

**Zusätzlicher Nutzerwunsch vom 17.11.2026:** DĀR INTELLIGENCE soll sowohl **Texteingabe** als auch **Spracheingabe** ermöglichen und auf Wunsch mit **männlicher oder weiblicher frei auswählbarer Stimme** antworten. Die native Offline-Prüfung, Locale-Verfügbarkeit, Aussprachebibliothek, Audio-Sessions und der komplette Modal-/Mikrofon-/TTS-Testvertrag stehen in [DAR-INTELLIGENCE-BLUEPRINT Abschnitt C1](DAR-INTELLIGENCE-ASSISTANT-BLUEPRINT-2026-11-17.md). Diese Sprachfunktion gehört nur zum isolierten Assistenz-Forschungsstrang #1791, nicht automatisch zum bereits genehmigten Motion-Rollout. Keine bezahlten Sprach-APIs oder Cloud-Aufnahmen.

### 0c. GESAMTAUFTRAG 17.11.2026 – **DAR NEXT ALS GANZE APP WEITERENTWICKELN**
**Höchste Scope-Klarstellung:** Der Nutzer meint **nicht nur** Motion-Design und **nicht nur** DĀR INTELLIGENCE. Ziel ist die bereits in Xcode/GitHub erheblich ausgebaute **gesamte DAR-NEXT-App** als künftige DĀR AL TAWḤĪD App auf fortlaufend höheres, modernes, klassisch-islamisches Premium-Niveau zu bringen. **Nicht neu anfangen. Vorhandenes gezielt vervollständigen, intelligent vernetzen und erweitern.** Das eigenständige Assistenz-Issue #1791 ist nur **ein Teilprojekt**.

**Was "Next Generation" für das GANZE Produkt bedeutet:**
1. **Produktweite UX/UI:** gesamte vorhandene Information Architecture, Navigation, Home-Hero, Header/Tabbar, Kapseln, Schnellzugriffe, Formulare, Listen, Suchdialoge, Detailseiten, Leer-/Fehler-/Offline-Zustände, Mikrointeraktionen, reversible Karten→Detail-Übergänge, Tab-/Sheet-/Scrollzustände, Bedienbarkeit und Inhalte auf allen Formaten bewerten und inkrementell verbessern. Edle islamisch-klassische Formsprache statt generischer App-Templates. Aktuelle bereits umgebaute Designs bleiben als Baseline erhalten.
2. **Gesamte fachliche Funktionsfläche:** Start/Home-Dashboard, Qurʾān-Leser und Lern-Player, Qurʾān-Rezitation/Audio/Mini-Player, geprüfte Posts und Q-Quellenkarten, Bibliothek/Gelehrte, Ḥadīṯ/Tafsīr/Tadabbur, Duʿāʾ, Dhikr, Quiz/Lernpfade, Gebetszeiten/Qibla/Kalender, Such- und Filterlogik, Lesefortschritt, Lesezeichen, Benachrichtigungseinstiege, Einstellungen/Personalisierung, Freigabe-/Share-Flows und vorhandene weitere DAR-NEXT-Module – **nur soweit tatsächlich schon vorhanden bzw. nach Inventur sinnvoll als fehlend identifiziert**. Kein Erfinden angeblich bereits funktionierender Features.
3. **Vernetzte intelligente APP-Funktionen auch OHNE KI-Agent:** Kontextnavigation (Quelle→Erklärung→Lernen→Quiz→Lesen), semantisch saubere Cross-Links, schneller Quellenwechsel, personalisierte Lesefortsetzung lokal, durchsuchbare/offline Inhalte, sinnvolle Empfehlungen nur aus geprüften kuratierten Daten, Suchvorschläge und verständliche Zustände; kein dauerhafter LLM-/Server-Zwang. "Intelligent" meint auch sehr gute deterministische Softwarelogik.
4. **Technische Modernisierung:** bestehende SwiftUI-Screens/Designsysteme/Targets und ihre Datenrepos/Reader/Audio/Widgets/Routing nach tatsächlichem Owner prüfen; große Views kontrolliert aufteilen, Doppelimplementierungen und CSS-Patch-Konflikte gezielt reduzieren, stabile App-State-Verwaltung, Bild-/Inhaltscache, Offline-First, Memory/Energy/Responsiveness, App Start, sichere Deep Links und UI-Tests stärken. **Wenn ein DAR-NEXT-spezifischer Webbereich wirklich HTML/CSS/JS nutzt**, darf er **gezielt, isoliert und mit Nachweis** modernisiert werden; die bisherige Sperre gegen *pauschale globale index.html/CSS-Umbauten* bedeutet nicht, dass alle für DAR NEXT zuständigen Webdateien unantastbar sind. Public Desktop-, Besucher-App- und Cloudflare-Owner nur mit dokumentierter Scope-/Regressionsprüfung, standardmäßig unverändert.
5. **Responsive/Plattformqualität:** iPhone klein/groß, iPad, Querformat, Split View, Fold/Duo-Panes nach verfügbarer Fläche, Safe Areas, Tastatur, Touch/Hover/Keyboard, VoiceOver, Dynamic Type, Reduce Motion, Kontrast, neun Erwachsenen-Sprachen de/ar/en/tr/ku/ckb/bs/fr/es einschließlich RTL und längerer Wörter. Kein einzelnes iPhone-Screenshot-Design als Standard für alle.
6. **Aktualität & Inhalte:** neue **redaktionell geprüfte und veröffentlichte** Inhalte aus dem kanonischen Quellen-/Content-System versionssicher in DAR NEXT verfügbar machen; Import/Delta-Sync, Offline-Fallback, zurückgezogene Quellen, Datenmodell-/Schemamigration, Quellenlinks und Sprache prüfen. Nicht jedes neue Wissensitem erfordert UI- oder App-Store-Release; dennoch alle Änderungen fachlich/technisch validieren. Kein autonomes ungesichertes Crawling oder Live-Push.
7. **Zukunftsfähig:** geplante, überprüfbare Technology-Radar-/Release-Gates für neue stabile iOS-/SwiftUI-/Xcode-/Accessibility-/Audio-/Responsive-Funktionen; neue Fähigkeiten als Pilot auf Feature-Branch, Kompatibilität und Kosten prüfen, anschließend schrittweise ausrollen. Keine automatische Migration auf neue Frameworks, keine Pflicht-Abos.
8. **DĀR INTELLIGENCE (#1791):** separater, hochentwickelter optionaler Dialog-/Lern-/Sprachbereich, den die übrige App später sinnvoll verwenden kann; er **darf den ganzheitlichen DAR-NEXT-Modernisierungsauftrag nicht ersetzen oder blockieren**. Lokale Sprach-/Antwortmodelle nur nach Qualitäts- und Geräteprüfung, keine verpflichtenden Paid-APIs, keine ungeprüfte öffentliche "Allwissenheit".

**Arbeitsmethode für Work/Xcode:**
- **0 – Vollständige Ist-Matrix** der DAR-NEXT-Features: für jedes Feature **fertig / teilweise fertig / defekt / nicht vorhanden / nicht getestet**, tatsächlicher Owner (SwiftUI oder DAR-NEXT-Web), GitHub-Branch/Commit, Nutzerwert, Risiko, Kosten und nächste kleine Verbesserung.
- **1 – Bestehenden heutigen Entwicklungsstand erhalten**, keine Rücksetzung auf Oktober-Snapshot; parallele PR-/Branch-Änderungen sauber bewerten, Legacy-App nur dort anfassen, wo DAR-NEXT-Integration nachweisbar notwendig ist.
- **2 – Priorisiertes Erweiterungsprogramm**: zuerst sichtbare/benutzbare Verbesserungen und Fehlerbehebungen an vorhandenen Screens; mindestens ein komplett getesteter Motion-/Navigation-Referenzfluss, dann weitere Module, daneben fachliche Daten-/Performance-/Barrierefreiheitsverbesserungen. Pro PR ein kontrollierbares Feature, keine riesigen untestbaren Mega-PRs.
- **3 – Synchronisierte Qualität**: realen Code in isolierten Branches ändern, Xcode-Build/Simulator/Swift-UI-Tests, Vergleichs-Screenshots/Screenrecording, i18n- und religiösen Quellen-Check, Performance-Messung; fehlen Laufzeitmöglichkeiten, dies ausdrücklich benennen.
- **4 – Konkreter Fortschritt**: ein fortlaufendes öffentlich nicht-operatives **DAR-NEXT-Feature-Backlog und Roadmap-/Technology-Radar-Dokument** mit bereits erledigten, nächsten und offenen Verbesserungen pflegen. Nur Änderungen als "umgesetzt" zählen, wenn PR/Commit und Beleg existieren.

**Abnahmepräzisierung:** Ein Chat-/Voice-Prototyp allein erfüllt **NICHT** den Gesamtauftrag. Ein isoliertes UI-Mockup allein erfüllt ihn **NICHT**. Es müssen reale App-Erweiterungen in relevanten fachlichen Funktionen erfolgen, ohne bestehende Qualität zurückzusetzen.

### 1. REPOSITORY-/PLATTFORM-VERTRAG
Repository: https://github.com/Sero91ak/dar-al-tawhid-site
Default-Branch: main. **DARNext liegt nach erster Prüfung auf separaten Entwicklungsbranches**, beispielsweise:
- codex/darnext-native-masterauftrag-20261024
- codex/darnext-apple-heritage-master-v1-20261024
- codex/darnext-p5-p9-20261024
- codex/darnext-phase4-wip-2026-10-23

**Nicht behaupten, dieser Stand sei der neueste.** Zuerst Branch- und Commit-Vergleich machen, heutigen Arbeitsstand ausfindig machen, bei Konflikten datengetrieben rekonstruieren und den tatsächlichen Source-of-Truth explizit benennen. Keine stillschweigende Rücknahme späterer Arbeit.

Vor Bearbeitung lesen: AGENTS.md, STABILITY.md, docs/adult-responsive-layout-contract.md und relevante Produkt-/Design-/Quellen-/I18n-Regeln sowie bestehende Feature-Implementierungen.
Zu prüfen:
- DARNext/DARNextApp.swift
- DARNext/Shell/RootShell.swift
- DARNext/Features/Dashboard/DashboardView.swift
- DARNext/DesignSystem/Tokens/DARTheme.swift
- DARNext/DesignSystem/Components/
- DARNext/Features/{Quran,Posts,Quiz,Dua,Library,Search,Prayer,Qibla,Assistant,Audio}/ (Assistant ausschließlich zur Bestands- und Kostenprüfung, **nicht** zur neuen In-App-KI-Entwicklung)
- DARNext/Data/, DARNext/Domain/, DARNextTests/, DARNextUITests/
- vorhandene Xcode Targets, XCAssets, Build-Schemes, deployment targets, CI und konkrete Referenz-PRs, insbesondere PR #1487

**Architekturgrenze:** Die Web-/Besucher-App besitzt index.html, CSS, JS und Cloudflare-Routing. DAR NEXT besitzt eigene native SwiftUI-Screens. Ein gemeinsamer Inhaltsbestand ist sinnvoll; **kein globales Rewrite** von index.html oder CSS und keine WebView als versteckter Ersatz für funktionierende native Screens. Bei unvermeidlichen Web-Views ein gekapselter Adapter mit definierter Rücknavigation, History und Error-/Offlinezustand.

### 2. VISUELLE IDENTITÄT – SCHÖN, ISLAMISCH, ZEITLOS
Design-DNA: **Classical Islamic Heritage × Apple-native Precision**. Bewahren: Markenidentität, Quellenernsthaftigkeit, klare arabische Typografie, vorhandene Logos und Assets, geeignete Themes, originale verifizierte Inhalte. Gestalten mit: Elfenbein/Pergament, dunklem Smaragd, tiefem Nachtblau, mattem Antikgold, fein abgestuften Linien und großzügiger Lesbarkeit.

Keine Disco-/Neon-Glows, kein Dauer-Glimmern, kein überfülltes 3D, keine künstlich leuchtenden Figuren, keine dicht gestapelten Card-in-Card-Container, keine erzwungene Liquid-Glass-Überdeckung religiöser Inhalte. Transparenzen und Glas nur kontextuell zur Navigation und leichtem Tiefeneindruck. **Eine Hauptkapsel je Funktionsbereich; innen strukturieren Typografie, Weißraum und feine Linien.**

Nutze das **vorhandene** DARTheme-/Token-System und bestehenden Designstand statt komplett neue Farben/Styles zu erfinden. Bekannte SwiftUI-Branch-Themes: nightLibrary, parchmentReader, deepBlueBrass; globale Marken-/Theme-Regeln prüfen. Vorhandene personalisierte Theme-Wahl beim Update niemals zurücksetzen.

### 3. VIDEO-REFERENZ – IN EIGENER MARKENSPRACHE UMSETZEN
Der Nutzer zeigte am 16.11.2026 eine Bildschirmaufnahme eines animierten App-Konzepts. Die wesentlichen Interaktionen:
- Große Karte oder Hero wird beim Tap **räumlich zusammenhängend zur Detailseite** und wächst/zoomt weich in die neue Ansicht.
- Titel, Bild und Content folgen mit abgestufter, ruhiger Motion und ohne ruckartige Layoutwechsel.
- Eine abgerundete Informationsfläche/Bottom Sheet schiebt sich angemessen vom unteren Bildschirmrand hoch; bei Bedarf mehrere Detents.
- Suche/Overlay öffnet als leicht schwebende Oberfläche; der Hintergrund bleibt räumlich erkennbar und wird dezent unscharf.
- Beim Zurück kehrt die Detailansicht sichtbar zur Ursprungs-Kapsel zurück; Position, ausgewähltes Item und Scrollstand bleiben erhalten.
- Untere Hauptnavigation bleibt stabil und interaktionsfähig; keine doppelten Tab-Leisten.
Die konkreten aus dem Video gezeigten Reise-Inhalte, Schriftzüge, Marken und Bilder NICHT kopieren. Wenn die Videodatei nicht im Work-Kontext verfügbar ist, diese Beschreibung als Funktionsreferenz nutzen; keine Wiedergabe vortäuschen.

### 4. NATIVE MOTION-SYSTEMARCHITEKTUR
Baue **gezielte Ergänzungen** auf bestehende Codeowner, keine Parallel-Shell. Die folgenden Namen sind **Vorschläge**, vor Erstellung vorhandene Äquivalente suchen:
- DARInteractionTokens: einheitliche Werte für Standard-/Press-/Screen-/Hero-/Sheet-Transition, Easing/Spring, Radius, Layer und Haptik.
- DARAnimatedCard / DARCardDetailLink: interaktive Kapsel mit stabiler Item-ID, Touch-Feedback und kartengebundenem Detailübergang.
- DARTransitionCoordinator: zentraler per-Feature Navigations-/Selection-/Restoration-State; keine globale mutable Singleton-Animation.
- DARAdaptiveSheet: native, barrierearme Such-, Aktions-, Filter- und Detail-Sheets.
- DARAccessibilityMotion: respect Reduce Motion, Reduce Transparency, VoiceOver, Dynamic Type, Kontrast und Low Power Mode, wo relevant.

**SwiftUI-Techniken je nach Deployment Target und echter SDK-Unterstützung:** matchedGeometryEffect oder matchedTransitionSource/navigationTransition(.zoom) auf geeigneten OS-Versionen, animation/spring, explicit view identity, presentationDetents, material, NavigationStack/NavigationSplitView, stabiler @State-/Observable-State, sensoryFeedback selektiv. API availability und Fallbacks müssen mit dem tatsächlichen Build geprüft werden. Nicht eine neue API nur wegen Marketing versprechen; keine inkompatiblen Apple-Versionen erzwingen.

Startwerte als UX-Richtlinien, nicht unüberprüfbare Erfolgsgarantien: Press 100–180 ms, Mikrointeraktion 160–250 ms, Card→Detail 260–420 ms, Sheet 250–400 ms. Inhaltlich bedeutende Bewegung sanft, keine großen Parallax-Schübe. Bei Reduce Motion vor allem kurze Crossfades oder unmittelbare Wechsel. Vermeide jedes Render-/Hit-Test-/Scroll-Ghosting.

### 5. FEATURE-VERTRÄGE – ERWEITERN, WAS SCHON DA IST
**P0 Referenzfluss:** Eine bestehende Startseiten-Kapsel → echte native Detailansicht → Zurück zur exakt gleichen Kapsel/Scrollposition. Kein duplizierter Renderer. Vollständig testen, bevor Motion auf weitere Ansichten verteilt wird.

**Dashboard:** stimmige Hierarchie, klassischer Hero, begrenzte Schnellzugriffe, leise Neubeitrag-Vorschau, Quellennähe; alle bisherigen Widgets/Inhaltsblöcke erhalten. Eine Kapsel bei Touch fühlbar anheben, aber kein Bounce-Fest.

**Beiträge/Quellen:** Feedkarte→Quellen-Detail morphend; Text und Quelle bleiben im selben Navigation-Stack, original Q-ID und URL erhalten, interner Zurückpfad korrekt, extern kein künstlicher Backbutton. Kein Kopieren/Verfälschen des arabischen Originaltextes. Vertikal lesbares Manuskript-Layout, Quellenzeilen und klare Leseoptionen.

**Qurʾān:** Sūren-Auswahl→Leser als ruhiger geführter Übergang, arabischer Text in optimaler Lesefläche, gut lesbare Transliteration/Übersetzung nach geltenden Regeln, Fortschritt und Audio-Kontinuität. Bestehende Audiomotor-/Rezitator-/Cache-Logik erhalten, keine Audio-Restarts bei Animation.

**Bibliothek/Gelehrte:** hochwertiges Buch-/Karten-Cover→Details, interne Suche, Quellenstatus, Bookmark/Lesestand; keine Gesichter oder religiöse Personenillustrationen erfinden.

**Duʿāʾ/Lernbereich:** sanft aufklappbare Wort-für-Wort-Lernansichten, Originalarabisch → Lautschrift → Deutsch klar priorisiert, Audio-Synchronisation und Sprecherposition nicht verlieren.

**Quiz:** klares unmittelbares Antwortfeedback, animierte Progression ohne spielzeughafte Partikel, barrierefreie Zustände, bestehende Lernstatistik und Antworten unverändert.

**Gebetszeiten/Qibla:** zurückhaltende Übergänge, live Countdown und Standort weiterhin korrekt; keine Änderung der Rechen- oder Berechtigungslogik nur für die Optik.

**Suche:** native Suche als Overlay/Sheet oder passende eigene Route, Fokus und Tastatur stabil, schnelle Ergebnisse, leere/offline/Fehlerzustände, Rückkehr zur vorherigen Stelle.

**Navigation:** bestehende Hauptnavigation erhalten und mit Nutzervorgabe **Start · Quiz · Beiträge · Koran · Mehr** abgleichen. In geprüftem DARNext-Branch war noch Start · Qurʾān · Beiträge · AI · Mehr sichtbar; die AI-Registerkarte nicht als kostenpflichtigen oder ungeprüften Assistenten ausliefern. Diese Diskrepanz vor Implementierung auflösen. PR #1487 vorbereitet, aber nach letzter Prüfung noch offen und nicht als gerätegeprüft belegt. Kein doppelter Tabbar-/Web-Navigationslayer.

### 6. RESPONSIVE / INKLUSIVE QUALITÄTSREGEL
iPhone kompakt/groß, iPad Portrait/Querformat, Split View und echte Fold-/Duo-Pane-Breiten nach vorhandenem Vertrag: layout nach **verfügbarer Breite**, nicht Modellnamen. Safe Areas, Keyboard, dynamische Schriftgröße, VoiceOver, Voice Control, Kontrast, Touch-Flächen, Landscape, arabisches/soranisches RTL, Scroll-Konflikte und Rückgesten testen.

**Neun Erwachsenen-App-Sprachen:** de/ar/en/tr/ku/ckb/bs/fr/es. Kein Feature mit nur deutschem UI als „fertig“ bezeichnen. Fachlich ungeprüfte Quellenübersetzungen nicht erfinden; wenn inhaltliche Übersetzung nicht freigegeben, geprüfter Fallback-Hinweis nach Bestandsregel. Die neue Motion muss in RTL spiegelungskorrekt und bei sehr langen Strings funktionieren.

**Zustände:** normal, pressed, focused, loading, empty, offline, error, reconnecting, playing, paused, background/foreground. Keine Loader-Schleifen oder Ruckler bei Rückkehr aus dem Hintergrund.

### 7. QUALITÄT, PERFORMANCE, CODE
- Erst Messwerte erheben: Kaltstart, Zeit bis Interaktivität, Scroll- und Transition-Flüssigkeit, Speicher, CPU/Energie, Audio-Stabilität; Xcode Instruments und echte Simulator-/Geräte-Prüfung. 60 Hz/120 Hz dynamisch wo Hardware ermöglicht; keine harte FPS-Behauptung ohne Messung.
- Keine SwiftUI-Monolith-Views ohne Aufteilung; keine kopierten Designwerte. Komponenten und Tokens zentral; Routing-Owner bleibt verantwortlich.
- Kein gleichzeitiges Animieren hunderter Elemente; ressourcenschonende Lazy-Container; identitätsstabile Bilder, Caching und strukturiertes Task-Cancellation.
- **Keine neuen verpflichtenden Paid-Abhängigkeiten oder Cloud-AI-/Token-/Credit-Kosten.** Apple-native Lösungen bevorzugen; Rive nur als optionale, gesondert freizugebende Alternative und nicht als Voraussetzung. Kostenlos verfügbare Lösungen sind bevorzugt.
- Accessibility als Teil der Komponenten, nicht Nacharbeit.
- Bestehende UI-Test-Dateien enthalten teilweise Xcode-Vorlage: echte assertion-basierte UI-Tests ergänzen (Tap→Detail→Zurück, Suchsheet, Reduzierte Bewegung, XXL-Schrift, RTL, Tabs, Audio bleibt aktiv).
- Screenshots/kurze Simulator-Aufnahmen und vorher/nachher-Vergleiche pro Feature. CI/SwiftLint/XCTest/xcodebuild nur dann als „bestanden“ melden, wenn ausgeführt, mit Kommando, Gerät und Ergebnis. Kann Xcode hier nicht ausgeführt werden: genau als „nicht geprüft“ kennzeichnen und ausführbare lokale Schritte liefern.

### 8. ZUKUNFTSFÄHIGKEIT OHNE DAUERREWRITE
Erstelle oder ergänze **DARNext Technology Radar** (z. B. docs/darnext/TECH_RADAR.md): aktuelle geprüfte Xcode-/Swift-/iOS-SDK-Version, Mindest-OS, verwendete APIs, Future-Feature-Kandidaten, Migrationsrisiken, Deprecations, offene Tests, Aktualisierungsdatum. **Wiederkehrende Reviews bei künftigen stabilen Apple-Releases** als empfohlenen Prozess dokumentieren; keinen unkontrollierten automatischen Framework-Upgrade/Produktionsdeploy einrichten.

Neue Technologien durch kurzes „Pilot → Messung → Rollout“-Verfahren prüfen. Feature Flags und Availability/Fallbacks so konzipieren, dass bestehende iPhones weiterhin funktionsfähig bleiben. Relevante Features: native Hero-Zooms, intelligente Accessibility, systemnahe Suche, adaptives iPad-Layout, Siri/App Intents nur wenn geeignet, Widgets und sanfte Haptik – nicht alles jetzt einbauen, sondern kompatibel vorbereiten.

### 9. STUFENWEISE UMSETZUNG DURCH WORK
**Phase A – Discovery/GAP-Audit:** tatsächliche neueste DAR-NEXT-Basis lokalisieren, Branch-/PR-Matrix, Dateieigentümer, bereits fertige vs. offene Motion/UI-Komponenten und Risiken aufzeigen. Keine isolierte Oktober-Version als heutige Wahrheit ausgeben.

**Phase B – Minimaler vertikaler Proof:** auf isoliertem Feature-Branch eine bereits bestehende Startseitenkarte mit echtem Übergang und Rücktransition verbessern; zentrale Tokens nur ergänzen, vorhandene Gestaltung nicht ersetzen. Tests und Video/Screen-Belege.

**Phase C – Reusable Motion:** bei erfolgreichem Proof auf Posts, Quellen, Qurʾān, Library und Duʿāʾ übertragen, jeweils kleine PRs; keine globale Änderung auf Verdacht.

**Phase D – Advanced UX:** Suche/Sheets, Haptik, Fokus, iPad/Fold, RTL, Accessibility, Animationen mit Qualitätsbudget.

**Phase E – Dokumentation/Releasegate:** vollständige QA-Matrix, Technology Radar, changelog, Screenshot-Diffs, TestFlight-Probelauf nach eigener Freigabekette. DAR NEXT erst ersetzen lassen, wenn explizit freigegeben.

### 10. VERBOTE UND BESTANDSSCHUTZ
- **Kein Rewrite**, keine neue zweite App, kein Austauschen der bestehenden DAR-NEXT-Architektur gegen irgendeine Demo.
- **Kein direkter Commit auf main**, keine automatisch gemergten PRs, keine Cloudflare-Live-Auslieferung, kein OneSignal-Push. Nur Feature-Branch/Draft-PR bis Abnahme.
- Keine ungefragten Änderungen an Kids, tvOS, Watch, Admin, Push, Gebetszeitenengine, Rechte-/Privacy-Logik.
- Keine Änderung bestehender Q-IDs, kanonischer Links, isnād-/Quellentexte, festgelegter Antworten, geprüfter Übersetzungen oder Autorenattributionen.
- Bestehende gesicherte Navigation, Themes, Assets und Nutzerpräferenzen beibehalten. Keine Doppel-Renderings und keine verlorenen Scrollpositionen.
- Kein „alles getestet“ ohne Testnachweise. Keine Behauptung, die neue 2026/27-App sei bereits im App Store.

### 11. DEFINITION OF DONE / LIEFERGEGENSTÄNDE
1. Dokumentierte aktuelle DAR-NEXT-Quellbasis inklusive tatsächlicher Branch/Commit-IDs, offene PRs, Backlog und Status pro Feature.
2. Isolierter, reviewbarer SwiftUI-PR mit funktionierendem Karte→Detail→Zurück-Beispielfluss.
3. Wiederverwendbare Motion-/Design-Tokens, gezielt erweiterte bestehende UI-Owner und keine regressiven CSS/Index-Eingriffe.
4. Für jeden modifizierten Bereich real getestete Navigation, Screenreader/Reduce Motion, Multi-Language/RTL und Audio-/Scrollzustand.
5. Xcode-Build-/Simulator-/Test-Log mit ausführbaren Befehlen und Messresultaten oder expliziten offenen Nachweisen.
6. Vergleichsaufnahmen der relevanten Zustände, dokumentierte Accessibility- und Performanceprüfung.
7. Pflegeplan/Technology Radar für künftige stabile Apple-SDKs, ohne automatische Produktivänderung.
8. Kurzbericht „vorhanden / erweitert / offen / blockiert / getestet / nicht getestet“ mit PR-Links und nächstem priorisierten Schritt.

**JETZT BEGINNEN:** Lies dieses Dokument vollständig, verifiziere den aktuellen Entwicklungsstand (insbesondere die Arbeiten vom 16.11.2026), wähle den korrekten DAR-NEXT-Codebranch und implementiere den ersten sicheren Referenzfluss. Bei fehlendem Zugriff, nicht vorhandenen Videoassets oder Simulatoren transparent begrenzen – nicht als erledigt ausgeben.
