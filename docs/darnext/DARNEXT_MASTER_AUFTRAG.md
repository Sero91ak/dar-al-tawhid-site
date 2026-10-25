# DĀR AL TAWḤĪD NEXT — VERBINDLICHER MASTER-AUFTRAG
**Kennung:** DARNEXT-NATIVE-2026-10-24  
**Ziel-App:** `DARNext` (lokales Xcode-Target, native iOS/iPadOS)  
**Repository:** https://github.com/Sero91ak/dar-al-tawhid-site  
**Arbeitsstatus:** Auftrag gespeichert; keine Implementierung und kein Build durch das Speichern bestätigt.  
**Arbeitsmodus:** Etappenweise tatsächliche Implementierung mit überprüfbaren Nachweisen.  
**Sprache für Berichte:** Deutsch.

> Dieser Auftrag ist die dauerhafte zentrale Spezifikation für den Xcode/Codex-Agenten. Lies vor jedem Eingriff `AGENTS.md`, die aktuellen Sperrdateien und diesen gesamten Auftrag. Nicht blind einen früheren lokalen Zustand mit `main` überschreiben.


## V2 — ZWINGENDE 1:1-PARITÄT ALLER ERWACHSENEN-INHALTE (NEUE HÖCHSTE IMPLEMENTIERUNGSPRÜFUNG, 25.10.2026)

**Dies ist keine neue parallele App-Planung.** Der bestehende Auftrag P0–P10 bleibt erhalten, wird aber um folgende **verbindliche Vollständigkeits-Gates** erweitert:

1. **PARITAET_MASTER_V2.md vollständig lesen** und nach seinen Anforderungen **alle** vorhandenen Erwachsenen-App-Inhalte, -Unterseiten, -Funktionen und -Gestaltungsassets in DARNext **wirklich** nativ umsetzen. Jede dort dokumentierte zusätzliche P0-R–P10-R-Aufgabe ist Bestandteil dieses Masterauftrags.
2. **PARITAETS_MATRIX.md vollständig lesen und dynamisch erweitern**: Diese enthält ein 50-Zeilen-Startinventar. Jedes vorhandene Erwachsenen-Untermodul und jede wichtige Unterroute ist erst fertig, wenn die zugehörige Matrixzeile mit echten Daten, Swift-Dateien, Interaktionen, Medien, Quellen, Geräten und Tests abgenommen ist. Die Liste ist **kein** Anspruch auf erschöpfende Inventur.
3. **Lokal vorhandenen DARNext-Code schützen:** Laut STATUS.md wurden P0–P4 in Xcode bereits teilweise erfolgreich implementiert (7/7 Tests), aber native Frauen-/Ḥadīṯ-Reader, Tafsīr/Tadabbur, kompletter Inhalts-Payload, Sprach-/Device-Matrix und Push fehlen noch. Die native Implementierung liegt teilweise **nicht auf GitHub**. Vor weiterer Arbeit den echten Xcode-Stand inventarisieren, sichern und erst dann kontrolliert synchronisieren. Keine bereits umgesetzten SwiftUI-Funktionen ersetzen oder fiktive GitHub-Commits behaupten.
4. **Visuals mit vollständiger Bedeutung übertragen:** bestehendes DĀR-Branding, Original-Logo, alle passenden 3D-Icons, Heros, bibliotheks-/frauenbezogene Bilder, Buchcover, arabische Typografie, Quellen, Reihenfolge, Social-/Share-/Audio-/PDF- und Lesefunktionen. Apples aktuellste geeignete SwiftUI-Navigation/Glass/Safe-Area-Konventionen als **native Hülle**, nicht als Ersatz für unsere Identität.
5. **Zentrale Push-/Publikationslogik bleibt verbindlich:** ein Datensatz/ID, eine geprüfte Veröffentlichung, Verfügbarkeit in allen vorgesehenen Erwachsenen-Apps; Geräte-Push separat geschützt und freigabepflichtig. Reines Manifest-Caching ist **keine** nachgewiesene volle Payload-Synchronisation.
6. **Keine voreilige Fertigmeldung:** Ein erfolgreicher Xcode-Build, 7/7 Tests, fünf Tabs oder ein Mockup sind **nicht** gleichbedeutend mit der verlangten 1:1-Inhalts- und Funktionsparität. Erst sämtliche Inventar-/Matrixabnahmen schließen den Gesamtauftrag.

**Hier weiterlesen:** [PARITAET_MASTER_V2.md](PARITAET_MASTER_V2.md) · [PARITAETS_MATRIX.md](PARITAETS_MATRIX.md) · [STATUS.md](STATUS.md).

## 0. Oberste Leitregeln und Sicherheitsgrenzen

- **Eine zentrale redaktionelle Quelle, viele eigenständige Oberflächen.** Die native DARNext-App darf keine konkurrierende separate Content-Zentrale erschaffen. Kanonische IDs, Quellnummern und Links (insbesondere `/q/<Nummer>/`) bleiben über die Erwachsenenspuren identisch.
- **DARNext ist eine separate App-Oberfläche.** Erwachsene Website, Android-PWA, klassische iOS-WebView-App, Apple TV, Kids und andere Targets sind keine Redesign-Ziele dieses Auftrags. Kids bleibt vollständig ausgeschlossen. Apple TV keine UI-Änderung.
- **Nur eigene DARNext-Dateien und neue, dafür eindeutig zugeordnete Module bearbeiten.** Gemeinsame Backend- und Push-Dateien anfangs ausschließlich lesen/auditieren. Kein unnötiger Umbau produktiver UI/Server-Seiten. Keine fremden lokalen Changes verwerfen.
- **Keine produktiven Deploys, kein Merge in `main`, keine neuen Store/TestFlight-Releases, keine Änderungen an Bundle-ID/Entitlements/Signing/Buildnummer ohne gesonderte Freigabe.**
- **Push-Sicherungen beachten:** `AGENTS.md`, `content/admin/change-scope-lock.json`, `content/admin/push-lanes-lock.json`, `scripts/change-scope-lock-guard.js`, `scripts/push-lanes-guard.js`, `scripts/push-system-guard.js`, `scripts/repo-integrity-guard.js`, `scripts/app-lane-guard.js`. Geschützte produktive Push-Lanes niemals auf Grundlage dieses allgemeinen UI-Auftrags verändern. Gesonderte Kennwort- und doppelte Freigabe nach Repository-Vorgaben einholen, wenn Änderungen daran tatsächlich erforderlich sind.
- **Wichtige Unterscheidung:** Redaktionelles „push live“ = autorisierte **Inhaltsveröffentlichung**, **nicht** automatisch eine Geräte-/OneSignal-Nachricht. Für jede neue Gerätebenachrichtigung sind die gesonderten vorhandenen Freigaberegeln maßgeblich. DARNext muss veröffentlichte Inhalte auch ohne Push-Berechtigung aktualisieren können.
- **Kein simuliertes Funktionieren:** Weder vorgetäuschte Standort-/Gebetszeiten, noch Dummy-Links, fiktive Zustellbestätigungen, erfundene Audio-Assets oder ungetestete „fertig“-Behauptungen.
- **Religiöse Inhalte bleiben unverändert**, sofern kein gesonderter redaktioneller Auftrag vorliegt. Keine ungeprüften Tafsīr-/Tadabbur-Texte, Quellen oder Übersetzungen automatisch veröffentlichen.

## 1. Einstieg in jeder Codex/Xcode-Sitzung

1. Ermittle das tatsächlich geöffnete lokale Xcode-Projekt sowie das Scheme **DARNext**. Unter dem GitHub-`main`-Pfad `ios/DarAlTawhid/DarAlTawhid.xcodeproj/project.pbxproj` war bei früherer Prüfung DARNext **nicht** eingetragen; daher DARNext nicht erfinden und das alte WebView-Target keinesfalls versehentlich umbauen. Lokale Xcode-Stände und andere Branches prüfen.
2. `git status --short`, `git branch --show-current`, verfügbare Targets/Schemes und bestehende uncommittete Änderungen dokumentieren. Vor Änderungen sicherer, isolierter Arbeitsbranch/Backup ohne Überschreiben.
3. `AGENTS.md` sowie diesen Auftrag **vollständig** lesen. Bestehende Dokumentations- und Testschutzregeln respektieren.
4. Wenn `docs/darnext/STATUS.md` existiert, diesen lesen. Ansonsten im Arbeitsbranch initial anlegen. Enthalten: aktueller Phase, bestätigte Fakten, betroffene Dateien, Commits, Test-/Build-Status, Blocker, nächste Aktionen und klare „nicht abgeschlossen“-Marker. Datei nach jedem Schritt aktualisieren, nicht nur Chatberichte schreiben.
5. Jede Phase mit Inventar, Umsetzung, statischen Tests, Build, Funktionsprüfung und Commit abschließen. Keine unsicheren Commits in produktive Spuren.
6. Falls der GitHub-Plan nur remote auf `codex/darnext-native-masterauftrag-20261024` liegt, ihn ausdrücklich von dort abrufen, ohne einen bereits bearbeiteten lokalen Arbeitsbaum durch Checkout/Reset zu überschreiben.

## 2. Bestehende Quellen und Medien wiederverwenden

Repository rekursiv inventarisieren: Datei, Typ, Pixelgröße, Transparenz, Varianten, Lizenz/Herkunft soweit vorhanden, aktuelle Webnutzung, empfohlene native Nutzung, Cache-/Offlinebedarf.

**Zu prüfen (nicht abschließend):**
- 3D-Icons: `assets/dar-3d-icons/` (u. a. `quran.png`, `dua.png`, `qibla.png`, `posts.png`, `hadith.png`, `frauen.png`, `library.png`, `settings.png`, `prayer.png`).
- Zusätzliche realistische UI-Icons: `assets/ui-icons/`.
- Icon-Mapping-/Layout-Logik: `assets/dar-noble-3d-icons.js`, `assets/dar-noble-3d-icons.css`.
- Bestehende Runway-/Adobe-Hero-Medien: `assets/home-v1194/hero-mobile-adobe.jpg`, `hero-wide-adobe.jpg`, `study-runway.jpg`.
- Beitrags-Heros: `assets/post-heroes/topics.webp`, `topic-detail.webp`, `post-reader.webp`.
- Themen-/Feedbilder: `assets/feed-backgrounds/`, `content/feed-backgrounds/feed-backgrounds.json`.
- Frauenbereich-Bilder: `assets/frauen/library-v1223/`, `assets/frauen/library-v1224/`.
- Buchcover: `assets/library/covers/`, `data/library-publications.json`, `data/canonical-books-index.json`.
- Original-Embleme: `assets/app-icons/`, weitere Branding-Assets im Repo.
- Bei Audio, Wissenschafts-/Ḥadīṯ- und Qurʾān-Bereichen die passenden vorhandenen Web-/Datenmodule untersuchen.

**Vorgabe:** 3D-Bilder als native SwiftUI-`Image` in funktionalen Buttons verwenden; tap target, VoiceOver-Beschriftung, dynamische Größen, Safe Area und Haptik erhalten. Nicht gesamte Buttons als statische Screenshots ersetzen. Apples SF Symbols dürfen für sekundäre System-Aktionen verwendet werden, aber die sichtbaren DAR-spezifischen Haupt-Icons stammen aus dem vorhandenen 3D-Asset-Katalog. Keine Emoji-Platzhalter in produktiven DARNext-Hauptbereichen.

**Neue Bildgenerierung nur bei tatsächlicher Lücke.** Vorher Such-/Asset-Audit. Neue Bilder per Runway/Adobe nur mit funktionierender Integration und explizit notwendigen Aufträgen; keine Behauptung, Bilder seien generiert, wenn nicht.

## 3. Native Architektur und Designsystem

Technik: SwiftUI für UI, `NavigationStack`/`NavigationSplitView`/`TabView` nach Gerät, Swift Concurrency für Ladeprozesse, klare Feature-Module und Repository-/Service-Schicht. `WKWebView` nur temporär für nicht portierte Funktionen, explizit als solche dokumentiert. Kein vollständiges Spiegeln alter Web-SPA-HTML in einer vermeintlich nativen App.

**Designrichtung:** Islamische Wissensbibliothek (Manuskripte, Messing, antikes Gold, Pergament, klassische Bücher) kombiniert mit Apple-Designstandards: Nachtblau, Tawḥīd-Grün, Goldakzente, klare Leseschrift, ruhige Übergänge, wenige hochwertige strukturierte Flächen, dezent Liquid Glass für Steuerflächen, nicht für arabische Haupttexte.

Zentrale Komponenten: `DARBrandHeader`, `DARHero`, `DAR3DQuickAction`, `DARPrayerSummary`, `DARRecommendation`, `DARArticleReader`, `DARSourceCard`, `DARAudioControls`, `DARShareBar`, `DARLanguagePicker`, `DARThemePicker` (Namen beispielhaft, Architektur an Projekt anpassen).

Darstellung: iPhone, große iPhones, iPad, Hoch-/Querformat, Split-View, Dynamic Type, RTL, VoiceOver, Reduced Motion, Dark/Light/System. Alle Interaktionen zuverlässig anklickbar; keine Overlay-/Touch-Blocker.

## 4. Vollständige Startseite

Struktur und Reihenfolge:
1. Original-Logo und **DĀR AL TAWḤĪD**; darunter **Qurʾān · Sunnah · Āthār**.
2. Kompakte Begrüßung „Assalāmu ʿalaykum“ und „Willkommen im Haus des Wissens“.
3. Kompakte standortbasierte Gebetszeiten mit nächstem Gebet und Countdown, Berechtigung/Fallback korrekt.
4. Premium-Schnellzugriffe mit echten bestehenden 3D-Icons: Qurʾān, Beiträge, Duʿāʾ, Qibla, Bibliothek, Ḥadīṯ, Frauenbereich und weitere Funktionen.
5. Redaktionsbereich „Im Maßstab der Überlieferung“ und „Heute empfohlen“ mit passendem vorhandenen Hero-Asset.
6. Tages-Āyah, Tages-Duʿāʾ, neueste freigegebene Beiträge, thematische Wissensnavigation.
7. Hochwertige native Tab-Navigation mit adaptivem iPad-Layout; direkte Wege ohne unnötige tiefe Scrollstrecken.

Nur echte Daten. Sichtbares „Neu“ aus tatsächlicher Publikationszeit, nicht aus lokalem Demo-Datensatz.

## 5. Wissensbereiche vollständig nativ integrieren

- **Beiträge:** Themen-Heros, Übersichten, Filter/Suche, Liste, Detailseite, Quellenkarte, Autor, Lesezeichen, Teilen, Deep Links, nächste/verwandte Inhalte.
- **Duʿāʾ:** Arabischer Originaltext dominant, geprüfte Übersetzung, Lautschrift, Quelle, Audio, langsam, Wiederholung, Wort-für-Wort-Lernmodus sofern Medien/Zeitmarken vorhanden.
- **Qurʾān:** 114 Sūren, Āyāt, korrekte Uthmānī-Schrift, Audio-Rezitatoren, nativer Hauptplayer, Lernplayer, Fortsetzen, Tempo, Loop, Tadabbur und Tafsīr **nur aus geprüften vorhandenen Datensätzen**.
- **Bibliothek:** Autoren/Gelehrte, Werke, Cover, Kategorien, Metadaten, PDFs wo vorhanden, Quellen, Lesezeichen.
- **Ḥadīṯ und Āṯār:** Bestehendes Datenmodell, Nachweise, Suche/Lesemodus, eigene hochwertige Hero-/Kategorieoptik.
- **Frauenbereich:** Bestehende Kategorien und Medien der Frauenbibliothek übernehmen; nicht Inhalte erfinden.
- **Weitere bereits vorhandene Erwachsenenbereiche:** Qibla, Gebetszeiten, Geschichte, Wissen, Gelehrte, Einstellungen, Social-Media-Verknüpfungen, gespeicherte Inhalte; deren Verfügbarkeit anhand des tatsächlichen Repository-Inventars abgleichen.
- **Social-Media-Integration:** Bestehendes Icon-/Share-Verhalten analysieren, native `ShareLink`/System-Share-Sheet und Copy-Link integrieren. Keine alten werblichen Social-Fußtextzeilen in religiöse Inhalte einführen.

## 6. Eine Zentrale — synchronisierte Inhalte auf allen Erwachsenengeräten

Datenquellen unter anderem `content/posts/`, `content/duas/`, `content/quran/`, `content/tafsir/`, `data/` und vorhandene Publikations-/Cloudflare-Routen prüfen. **Bestehende geprüfte Publishing-Pipeline wiederverwenden**, nicht zweite Redaktion erzeugen.

Baue `DARNextContentService` oder gleichwertige Schicht:
- Manifest/API auf Basis **bereits veröffentlichter und freigegebener** Inhaltssätze.
- Kanonische Post-ID, Q-Quellen-ID, Content-Version und Quell-Hash; Mehrsprachigkeit bleibt Varianten desselben Datensatzes.
- Safe-fetch, Paginierung, Cache, Background-/Foreground-Refresh, ETag/Version und Offline-Fallback.
- Konsistentes Laden von zugeordneten Bildern und Audiodateien; keine partiellen Anzeigen nach Publish.
- Korrekturen aktualisieren dieselbe ID statt Duplikate zu erstellen.
- Redaktionelles Publizieren in der Zentrale macht Inhalte in DARNext ohne neuen Swift-Build sichtbar. **Native Code-/Asset-Catalog-Änderungen brauchen weiterhin neuen Build.**
- `push live` und Gerätebenachrichtigung konsequent trennen.

Wenn eine neue serverseitige Content-Route fehlen sollte, als separaten konkreten Vorschlag dokumentieren. Nicht ohne eigenständige Berechtigung produktiven Worker ändern.

## 7. Native Push-Benachrichtigungen — Prüfen und integrieren, nichts ungefragt versenden

Bisherige Implementierung lesen:
- `cloudflare/post-push-admin.js`
- `cloudflare/ios-native-push-register.js`
- `cloudflare/onesignal-delivery.js`
- `cloudflare/push-nine-language-copy.js`
- `cloudflare/push-launch-urls.js`
- `ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift`

**DARNext soll von derselben zentralen Veröffentlichungslogik profitieren.** Prüfe dennoch die reale Bundle-ID, APNs-Entitlement, Team-ID, OneSignal-Zuordnung, Push-Tags, Geräte-/Installationsidentität und Deep-Link-Ziele. Eine separate native Bundle-ID kann eine eigene OneSignal/APNs-App-Konfiguration erfordern; nicht durch Copy/Paste alter IDs vortäuschen.

Push-Ziel: Wird eine **separat autorisierte** Benachrichtigung erstellt, muss DARNext die korrekte Nachricht in der gewählten App-Sprache erhalten und beim Tippen den richtigen nativen Leser mit korrekter Post-/Duʿāʾ-/Āyah-ID öffnen. Kein Doppelversand über mehrfach registrierte Installationen, idempotente Events, getrennte Spuren und Audits.

Bei `ku`/`ckb` gerätespezifisch lokalisieren, sofern OneSignal keine direkte Locale-Zuordnung unterstützt. `de,en,tr,ar,ku,ckb,bs,fr,es` aus zentralem Register; Freigabestatus beachten.

Keine Änderung an geschütztem OneSignal-Code, Secrets, Cron, Tags, bestehender Versandlogik oder Testsendung an reale Besucher ohne getrennte ausdrücklich verlangte Freigaben und Guards. Tests nur isoliert an Testgeräten und mit Freigabe.

## 8. Hardware, Audio und native Systemintegration

- AVFoundation, `AVAudioSession`, `MPRemoteCommandCenter`, `MPNowPlayingInfoCenter` für geeignete Hintergrundwiedergabe/Sperrbildschirmsteuerung.
- Standort `CoreLocation`, Gebetsberechnung aus korrekten Einstellungen und nachvollziehbarer Berechnungsmethode; keine Standortfiktion. Permission denied sauber anzeigen.
- Qibla: fachgerechte Richtung auf Basis Standort und Sensoren; Schnellzugriff muss in richtige Ansicht führen, nicht in die alte fehlerhafte Route.
- `ShareLink`/systemeigenes Share Sheet, Clipboard, Haptik, App-Settings.
- Widgets, Deep Links und vorhandene systemübergreifende Datencontainer nicht beschädigen; App-Groups/Entitlements nur kontrolliert und gesondert freigegeben ändern.
- Echte iPhone-Tests für APNs, CoreLocation, Kompass, Audio. Simulator allein genügt für diese Prüfungen nicht.

## 9. Neun Sprachen und Erscheinungsbild

Sprachen: `de, tr, en, ar, ku, ckb, bs, fr, es` mit dynamisch erweiterbarem Register. App-Sprache ist maßgeblich, nicht lediglich Systemsprache. Arabisch und Soranî RTL; Schrift und Unicode diakritiktreu. Quellenangaben und religiöse Begriffe korrekt. Nicht als freigegeben markierte Übersetzungen nicht als geprüft darstellen.

Themes: dunkles Nachtblau/Grün, helles Pergament, System; Textgrößen, arabische Lesbarkeit, Accessibility, Reduced Motion.

## 10. Etappenreihenfolge / Definition of Done

**P0 – Audit und Sicherung:** tatsächliches DARNext-Target gefunden; Git- und Xcode-Zustand inventarisiert; Backup/Branch sicher; Abweichung zwischen lokaler Version und GitHub dokumentiert. **Abnahme:** Bericht + Datei-/Scheme-Nachweis.

**P1 – Medieninventar:** wiederverwendbare 3D-/Hero-/Frauen-/Bibliotheks-/Beitragsbilder kartiert. **Abnahme:** Mapping mit Pfaden, Größen und Zielseiten, Fehlbedarf benannt.

**P2 – Designsystem und App-Shell:** gemeinsame SwiftUI-Komponenten, Themes, native Navigation, iPad-Anpassung. **Abnahme:** Projekt kompiliert, Navigation funktionsfähig.

**P3 – Startseite:** Logo/Salam/Qurʾān-Sunnah-Āthār/Gebetszeiten/3D-Schnellzugriffe/Hero/Empfehlungen/aktuelle Beiträge. **Abnahme:** echte Inhalte, keine Dummy-Buttons, iPhone/iPad geprüft.

**P4 – Beiträge, Duʿāʾ, Bibliothek:** Reader und Quellen plus native Share-Funktionen. **Abnahme:** mindestens jeweils ein realer End-to-End-Datensatz und Navigation ohne verlorene IDs.

**P5 – Qurʾān, Tafsīr, Tadabbur, Audio-Lernplayer:** Funktionen an bestehende Daten und Medien angebunden. **Abnahme:** Player- und Verse-/Quellen-Tests mit dokumentierten Lücken.

**P6 – weitere Bereiche einschließlich Frauen und Ḥadīṯ:** Bild- und Kategorieparität gegenüber vorhandenen Daten. **Abnahme:** nachvollziehbare Inventarmatrix.

**P7 – Content-Synchronisierung:** neue autorisierte Veröffentlichung wird bei nächstem Datenabgleich in DARNext sichtbar, **ohne** neuen iOS-Code-Build. **Abnahme:** dokumentierter isolierter End-to-End-Test.

**P8 – Push-/Deep-Link-Validierung:** native Registrierung, korrekte Zielseite und Sprache nach separater Push-Testfreigabe. **Abnahme:** echte Testgerät-Logs; keine falschen Erfolgsmeldungen.

**P9 – Feinschliff und QA:** RTL, neun Sprachen, Themes, VoiceOver, Dynamic Type, geringe Speicherlast, Offline-Verhalten, Screenrotation. **Abnahme:** Simulator-/Gerätematrix + Build-Logs.

**P10 – Abschluss und Übergabe:** lauffähiges DARNext mit offenen Punkten, vollständiger Dokumentation und geordneten Commits auf isoliertem Branch. **Kein Merge/Release ohne Extra-Freigabe.**

## 11. Fortschrittsprotokoll

Die Implementierungssitzungen führen im eigenen Arbeitsbranch `docs/darnext/STATUS.md` mit:

- Zeitstempel und Commit/Branch
- aktuelle Phase, Status (offen/in Arbeit/blockiert/getestet)
- was wirklich umgesetzt wurde
- Dateiliste/Asset-Zuordnung
- Tests: Befehl, Umgebung, Ergebnis
- unerledigte Integrations- oder Berechtigungsfragen
- erste konkrete Aktion der nächsten Sitzung

Gleichnamiges GitHub-Issue als übergeordneten Task nutzen; abgeschlossene Phasen dort mit fundierter Statusnotiz verknüpfen. Keine Checkbox ohne Testnachweis abhaken.

## 12. STARTANWEISUNG FÜR DEN AGENTEN

**Start jetzt nur mit P0, danach P1, danach P2/P3, soweit technisch und durch Scope-Gates erlaubt.** Wirklich analysieren, implementieren, bauen und testen; nicht bei reiner Planung stehen bleiben. Vor jedem strukturellen Eingriff die lokale Source-of-Truth und nicht gespeicherte Xcode-Arbeiten prüfen. Bei Schutzsperren, fehlenden Zugängen oder produktiven Push-Veränderungen sauber stoppen und getrennte Freigabe anfordern; parallel an unabhängig zulässigen DARNext-Teilen weiterarbeiten.

Der Nutzer muss den Mastertext künftig **nicht** erneut in den Chat kopieren; der Agent liest diese GitHub-Datei am Anfang jeder Sitzung.