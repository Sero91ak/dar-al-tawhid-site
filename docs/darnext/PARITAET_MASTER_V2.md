# DARNext — V2: Vollständige 1:1-Inhalts-, Design- und Funktionsparität
**Verbindliche Erweiterung · 25.10.2026 · Issue #1416**

**Ziel:** DARNext wird eine vollständig native SwiftUI-Erwachsenen-App, die **sämtliche freigegebenen Inhalte, Wissensbereiche, Unterseiten, Bilder, Funktionen, Quellen, Einstellungen und die Markenidentität** der bestehenden DĀR-AL-TAWḤĪD-Erwachsenen-App übernimmt. **Dokumentationsauftrag, keine hiermit behauptete Implementierung.**

## 1. Was „1:1“ bedeutet

**Inhalt, Informationshierarchie, Funktionen, Gestaltungsidentität und Nutzerwege bleiben erhalten**, einschließlich sämtlicher vorhandener tief verschachtelter Unterseiten und dynamischer Inhalte. SwiftUI verwendet Apples **native** Bedienung und kann Komponenten adaptiv anders anordnen; es darf Inhalte **nicht** reduzieren. Keine bloß nachgebaute Startseite mit leeren Tabs, keine versteckte WebView als komplette App, keine Screenshots statt Bedienung, keine durch Emojis ersetzten vorhandenen 3D-Originalicons.

**Referenzpriorität:** (1) tatsächlich installierte, existierende Erwachsenen-iOS-App und ihre produktiv freigegebenen Inhalte, (2) kanonisches GitHub-/Backend-Repository als Datenquelle, (3) geprüfte und abgenommene Verbesserungen in DAR TEST, (4) bestehendes lokales DARNext-Xcode-Projekt als technische Ausgangsbasis, (5) aktuelle offizielle Apple-SwiftUI-/HIG-/Accessibility-Dokumentation. Die vorhandene ältere iOS-App lädt nach geprüftem Stand überwiegend die produktive Weboberfläche über WKWebView; aus dieser **gerenderten** App müssen Produkt- und Medienparität erfasst werden. Keine ungetesteten Staging-Funktionen automatisch zur produktiven Referenz erheben.

**Ausgeschlossen:** Kinder-App/Kids-Inhalte, fremde App-Targets, Apple-TV-UI-Umbau, eigene redaktionelle Inhaltserstellung, nicht freigegebene Übersetzungen und produktiver Push-Versand. Die bestehenden App-Spuren bleiben getrennt.

## 2. Arbeitsbeginn: Echten lokalen Quellstand schützen

- Zuerst GitHub-AGENTS.md, DARNEXT_MASTER_AUFTRAG.md, STATUS.md, MEDIA_INVENTORY.md und PARITAETS_MATRIX.md vollständig lesen.
- Das **lokal existierende Xcode-Target und Scheme DARNext** samt DARNextTests und DARNextUITests aufspüren. Kein neues Demo-Xcode-Projekt anstelle des vorhandenen erstellen.
- Lokale uncommittete Änderungen, noch nicht zu GitHub synchronisierte SwiftUI-Dateien und Build-Artefakte sichern und inventarisieren. Laut STATUS.md liegt der native Quellstand teilweise ausschließlich im **lokalen Xcode-Arbeitsordner und nicht im Git-Checkout**. Keine fiktiven GitHub-Quellcode-Commits oder behauptete Synchronität.
- Bestehende getestete native Komponenten erhalten; nur fehlende Inhalte/Funktionen ergänzen und Architektur sauber refaktorieren, wo der Nachweis eines Problems vorliegt.
- Ausschließlich isolierten DARNext-Entwicklungsbranch verwenden. Kein Live-Deploy, kein main-Merge, keine Änderung der Bundle-ID, Entitlements, produktiven Web-/Push-/Kids-/TV-Spuren ohne gesonderte Freigabe.

## 3. Zwingende Vollinventur der bisherigen Erwachsenen-App

Vor der Erweiterung alle **tatsächlich im Produkt vorhandenen** Navigationseinträge, verschachtelten Routen, Inhaltsarten und bedienbaren Funktionen aus index.html, JS-Routern, Seitenmodulen, JSON-Inventaren, WebView-UI, Inhaltsmanifests und Medienkatalogen aufnehmen.

Für **jede Quellroute UND relevante Unterroute** ermitteln: Bereich, parent route, kanonische IDs, volle Datenzahl, Quelle, Freigabestatus, vorhandene Sprachfassungen, Hero-/3D-/Cover-/Hintergrundmedien, sichtbare und versteckte Aktionen, Filter, Quellnachweise, Audio/PDF, Teilen, Lesezustand, URL/Deep Link, dazugehörige DARNext-View und aktuelle Testbelege. Auch direkt erreichbare Links und Inhalte ohne sichtbare Menükarte einbeziehen.

**Die Matrix ist ein Anfangsinventar, kein abschließendes Verzeichnis.** Zusätzliche Bereiche aus Code/Daten aufnehmen; nichts weglassen, weil es nicht auf der Startseite sichtbar ist. Gesamtzahl/ID-Menge der freigegebenen Datensätze automatisiert gegen den nativen, tatsächlich ladbaren Bestand vergleichen. Nur einzelne Beispiele anzusehen genügt nicht.

## 4. Sämtliche Inhalts- und Funktionsfamilien übernehmen

**Start / Dashboard:** echtes Original-Logo, DĀR AL TAWḤĪD, Qurʾān · Sunnah · Āthār, Salam/Willkommen, Gebetszeiten, nächstes Gebet, Tages-Āyah, Tages-Duʿāʾ, „Im Maßstab der Überlieferung“, redaktionelle Empfehlungen, neueste Beiträge, Such-/Schnellzugriffe, 3D-Navigation, Hero und Kalender.

**Beiträge und Feed:** alle Themen, Unterthemen, aktuelle Beiträge, Gelehrte, Werke, Serien, Chronik, Favoriten, Filter/Suche, Originalvolltext, Unicode/arabische Schrift, Quellen und Scans, Links, verwandte Inhalte, Merken, Kopieren/Teilen, Social-Media-Originalicons und kanonische /q/-Quellenlinks.

**Duʿāʾ:** vollständige Themen- und Einzeleintragsbestände, Arabisch, Lautschrift, freigegebene Bedeutungen, Quellen, passende Bilder, Vorlese-/Lernfunktionen, Merken/Teilen.

**Qurʾān:** alle 114 Sūren und sämtliche vorhandenen Āyāt, Uthmānī-Schrift, Lese-/Fortschrittsnavigation, Lesezeichen, geprüfte Übersetzungen und vorhandene Qurʾān-Themen. Qurʾān-Lesen als fokussierte native Reader-Navigation.

**Tafsīr/Tadabbur:** vollständige geprüfte Verse-Erklärungen mit Bezug zu Sūrah/Āyah, Buch/Autor/Quellen, Links, Status und wissenschaftlicher Genauigkeit, keine erfundenen Einträge. Nicht freigegebene oder nicht vorhandene Erläuterungen transparent markieren.

**Qurʾān-/Audio-/Lernplayer:** bestehende Rezitatoren, Audioquellen, Playlist, Vers-Wiederholung, Tempo, Loop, Fortsetzen, sperrbildschirmfähige Hintergrundwiedergabe, verfügbarer Lernmodus und vorhandene echte Zeitmarken, ohne erfundene Synchronisation.

**Ḥadīṯ/Āṯār:** Werke, Kitāb, Bāb, Einzelḥadīṯ, arabischer Text, freigegebene Bedeutung, Überlieferer, Quellen, Grade soweit vorhanden, Šarḥ/Erklärungen, Suche, Merken und Teilen.

**Frauenbereich:** alle thematischen Bibliotheken und Unterkategorien, Frauengeschichte/Fiqh/Wissen/Familie/Erziehung/Salaf und sämtliche im Quellcode vorhandenen weiteren Themen, Hero- und Hintergrundbilder, Einzelaussagen mit Quellen und Teilen. Eine einzige Startkarte „Frauen“ reicht niemals.

**Bibliothek:** Haupt- und Unterkataloge, Autoren, Gelehrte, Bücher, Originalcover, PDFs, Lesemodus, Seitenwechsel/Fortsetzen, Downloads, Teilen, echte Quellenlinks, sofern Medien vorhanden. Nicht vorhandene PDFs nicht vortäuschen.

**Weitere Erwachsenen-Wissensbereiche:** Propheten, Salaf, Gelehrte, Werke, Themenarchiv, Quellensammlung, Wissenschaft, Geschichte, ggf. Quiz/Lernen, Suche/ILM, soweit in der bestehenden Erwachsenen-App wirklich vorhanden und zugelassen.

**Hilfs-/Systemfunktionen:** Qibla, Gebetszeiten, Kalender, Ramaḍān, Jumuʿah, Zakāt, News/Updates, Mitteilungen, Konto, Mehr-Menü, Sprache, Theme, Schrift, gespeicherte Inhalte, Auth/Profil, Social Sharing, Kopieren, native Share Sheets, Widgets sofern kompatibel, Deep Links, native Berechtigungsdialoge und korrekte Offline-/Fehlerzustände.

**Reader-Verhalten:** Bei Beiträgen, Duʿāʾ, Ḥadīṯ, Frauen- und Bibliotheks-Einzeltexten die genehmigte Lesefenster-Idee nativ über SwiftUI-Sheet oder passende adaptive Präsentation umsetzen: die Übersicht und Scrollposition bleiben erhalten; X, Back, Fokus-Wiederherstellung und Quellen/Share funktionieren. Qurʾān-Leser davon ausnehmen. Eine nur in DAR TEST experimentell vorhandene Reader-Änderung **erst nach eigenem funktionalen Audit** übernehmen.

## 5. Brand und alle vorhandenen Originalmedien

- MEDIA_INVENTORY.md ist Pflicht: 37 vorhandene 3D-Haupticons (unter anderem Qurʾān, Duʿāʾ, Qibla, Beiträge, Hadith, Frauen, Bibliothek), weitere UI-Icons, Adobe-/Runway-Heros, Themen-/Beitrags-Heros, Frauenbildserien, Buchcover, Feed-/Hintergrundmotive.
- Original-Logo und Tawḥīd-Schriftzug mit passender Typografie; Nachtblau, Tawḥīd-Grün, Antikgold, Pergament, dezente Linien. Kein generisches AI-Dashboard und keine einfarbige Fläche mit wiederholten Platzhaltericons.
- Jedes vorhandene Hero genau dem dazugehörigen Bereich zuordnen und responsiv passend zuschneiden; niemals dasselbe Motiv auf allen Unterseiten. Bilder von GitHub gezielt als eigene native Assets oder versionierte externe Medien mit Cache einsetzen.
- System-SF-Symbol nur für allgemeine native Controls zulässig; **Original-3D-Bilder in Hauptnavigation/Schnellzugriffen**. Keine ungebetene Regenerierung bereits existierender Adobe-/Runway-Bilder.
- Arabisch/Quellen/Schrift haben visuell Vorrang. Auf allen Themes hohe Kontraste und keine von Hero/Glas überlagerten Lesetexte.

## 6. Modernste vertretbare Apple-native Architektur

- SwiftUI mit wiederverwendbarem Designsystem, Feature-Komponenten, typisierten Routen, eigener datengetriebener Repositoryschicht, Caching, verlässlicher Zustandsverwaltung und Swift Concurrency. Native TabView/NavigationStack für kompakte Breiten; NavigationSplitView/Sidebar für wirklich verfügbare breite Bereiche; native Sheets/Popover für Kurz-/Lesefenster. Vorhandene funktionsfähige DARNext-Module fortentwickeln, kein Komplett-Neuanlegen.
- Apples aktuelle Liquid-Glass-Konventionen dezent für **Bedienoberflächen**, nicht als dekorative Überlagerung der Hauptinhalte; native Fallbacks für niedrigere unterstützte iOS-Versionen.
- Safe Areas, Edge-to-Edge, Statusleisten-/Dynamic-Island-Abstände, Home Indicator, Mini-Player, dynamische Gerätegröße, iPhone-Duo-Querformat, unterschiedliche Teil-/Breitansichten, iPad Split View, Dynamic Type, VoiceOver, RTL, Reduced Motion und Standard-iPhone. Adaptieren nach **realer verfügbarer Viewport-/Size-Class-Größe**, niemals fix nach erfundenen Gerätedimensionen.
- Tab-/Header-/Hero-/Logo-/Button-Kollisionen und horizontale Überläufe sind Abnahmefehler. Haupticons bleiben funktionale native Buttons, nicht Bildtapeten.
- Keine allumfassende WKWebView hinter einer nativen Tabbar. Temporär verbliebene Webfunktionen müssen in der Matrix als **Web-Fallback / nicht nativ abgenommen** sichtbar sein, bis portiert.

## 7. Zentrale Publikations-, Sprach- und Pushlogik erhalten

- **Einmal zentral veröffentlichen, alle vorgesehenen Erwachsenen-Apps erhalten denselben geprüften Inhalt.** Kanonische Inhalts-ID, /q/-Nummer und Quellen bleiben identisch; Sprache ist Variante desselben Datensatzes, kein eigener Beitrag.
- Bestehenden Manifest-/ETag-Dienst nicht mit fertiger Inhalts-Synchronisierung verwechseln. Die lokal dokumentierte DARNextContentSyncService lädt derzeit hauptsächlich ein Manifest; vollständiger Payloadimport von Texten, Bildern, Quellen, Tafsīr, Frauen, Bibliothek, Ḥadīṯ usw. mit Schema-/Hash-Prüfung, atomarem Versionswechsel, Cache, Offline-Fallback, Fehlerzuständen und Foreground-Refresh ist noch nachzuweisen.
- Neuer **freigegebener** Inhalt muss in DARNext bei Aktualisierung ohne neuen iOS-Build erscheinen, sofern das vorhandene Datenformat unterstützt wird; neue native Features oder Bundle-Assets benötigen weiterhin neuen Build.
- Neun registrierte Erwachsenensprachen: de, en, tr, ar, ku, ckb, bs, fr, es. App-Sprachwahl gilt für alle lokalisierten UI-Teile und freigegebenen Inhaltstexte, Rechts-nach-links für ar und ckb. Keine Entwürfe als freigegeben darstellen, korrekter kenntlich gemachter Fallback.
- Veröffentlichungs-Push ist **nicht** Geräte-/OneSignal-Push. Bestehende zentrale Publikationsarchitektur bleibt unverändert. DARNext benötigt für APNs/OneSignal ggf. eigene Registrierungs- und Target-Zuordnung; nur sichere isolierte Testgerät-Prüfungen nach gesonderten Freigaben. Keine produktiven Push-Worker ändern und keine Benachrichtigungen auslösen.

## 8. Harte Definition of Done: 100 % Abdeckung der echten Quell-App

Für **jede** in PARITAETS_MATRIX.md inventarisierte Route/Unterroute alle fünf Nachweise dokumentieren:
1. **Inhaltsvollständigkeit:** gleiche freigegebene ID-Menge, Titel, Texte, Quellen und verfügbare Sprachen wie kanonischer Bestand; kein stilles Weglassen.
2. **Gestaltungsparität:** korrekte Originalbilder, Logo, Markenfarben, Lesetypografie, Hierarchie, Hero und Kontrast.
3. **Funktionsparität:** alle echten Buttons/Aktionen (Suche, Filter, Back, Lesen, Audio/PDF, Teilen/Quelle/Bookmark etc.) mit praktischen Tests.
4. **Native Qualität:** SwiftUI ohne nur versteckten Web-Fallback; iPhone und iPad, Hoch-/Querformat, Safe Areas, 9 Sprachen/RTL, Dynamic Type, Accessibility.
5. **Systemparität:** zutreffende Deep Links, Daten-Refresh, Offline-/Fehlerpfade, Berechtigungen und bei autorisiertem Endgerät nachgewiesene Push-/Sensorpfade.

Ein Status „fertig“ oder „1:1“ ist erst zulässig, wenn **jede dynamisch aus der Quell-App inventarisierte Route** einem getesteten nativen Pendant zugeordnet ist, die vollständige kanonische freigegebene Datensatzmenge zur Laufzeit ladbar ist und keine kritischen Prüfungen offen sind. Bestehende 7/7 Unit-/UI-Tests sind eine Grundlage, **keine** Vollständigkeitsfreigabe.

## 9. Reihenfolge und laufende Zusammenarbeit mit Xcode/Codex

**P0-R:** echten lokalen Xcode-Stand sichern und STATUS.md prüfen, besonders nicht zu GitHub synchronisierte Swift-Dateien.  
**P1-R:** tatsächliche Erwachsenen-App mit allen Unterseiten und Route-/Feature-Inventar prüfen; PARITAETS_MATRIX.md auf wirkliche Vollständigkeit erweitern.  
**P2-R:** Originalmedien katalogisieren/importieren und adaptives SwiftUI-Designsystem/Navigation stabilisieren.  
**P3-R:** komplette Startseite und alle echten Schnellzugriffe inklusive Hero, Gebetszeiten und Empfehlung.  
**P4-R:** vollständige Beitrags-, Duʿāʾ-, Ḥadīṯ-, Frauen- und Bibliotheksmodule mit nativen Lesern und Quellen.  
**P5-R:** Qurʾān, Tafsīr, Tadabbur, Audio- und Lernplayer in voller vorhandener Funktionstiefe.  
**P6-R:** alle weiteren gefundenen Erwachsenenmodule, Systemeinstellungen, Suche, Lernen, Quiz, Gelehrte und Sharefunktionen.  
**P7-R:** zentrale komplette Payload-Synchronisierung, Offline-Modus und automatische neu veröffentlichte Inhalte.  
**P8-R:** neun Sprachen/RTL, Themes, Display-Matrix, Accessibility und Speicher-/Performanceprüfung.  
**P9-R:** separate native Deep Links und gesondert autorisierte APNs-/OneSignal-Gerätetests.  
**P10-R:** vollständiger Paritätsbericht, Source-Synchronisierung und echte technische Übergabe, nicht vorher.

Nach **jeder** Phase: betroffene Dateien, Build/Tests (echte Ergebnisse), Screenshots/Device-Zustände, exakt offene Matrixzeilen und Git-Quellnachweis in STATUS.md und PARITAETS_MATRIX.md eintragen. Nicht zu früh „abgeschlossen“ markieren. Bei nur extern lösbaren Berechtigungen sauber blockiert markieren und an erlaubten Phasen weiterarbeiten.

## 10. Offizielle Apple-Referenzen

- https://developer.apple.com/documentation/swiftui
- https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types
- https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass
- https://developer.apple.com/accessibility/

**Kurzauftrag für jede künftige Codex-Sitzung:** Lies Issue #1416 und alle vier DARNext-Dateien DARNEXT_MASTER_AUFTRAG.md, PARITAET_MASTER_V2.md, PARITAETS_MATRIX.md, STATUS.md vollständig. Setze die **noch fehlende vollständige 1:1-Parität** der bestehenden Erwachsenen-App ausschließlich im lokalen nativen DARNext-Target praktisch um, prüfe jeden Inhalt und jede Route, führe echte Xcode-Builds/Gerätetests aus und aktualisiere die Nachweise. Kein produktiver Deploy und kein Merge ohne separate Freigabe.
