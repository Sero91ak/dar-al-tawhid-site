# DARNext — Paritätsmatrix aller Erwachsenenbereiche
**Startinventar vom 25.10.2026; verbindliche Nachweisdatei zu PARITAET_MASTER_V2.md.**

**Wichtig:** Diese Ausgangstabelle wurde aus vorhandenen Erwachsenen-Routern/Modulen und dem dokumentierten Xcode-Status zusammengestellt. Die **vollständige dynamische Quell-Routen-/Unterseitenliste muss der Xcode-Agent noch ermitteln**. In den Spalten bedeutet OFFEN: **keine vollständig geprüfte 1:1-Abnahme**, auch wenn ein nativer Teilstand in STATUS.md dokumentiert ist.

## Statusregeln

- **OFFEN** = Referenz/Anzahl/Detailfunktionen nicht vollständig verifiziert oder noch keine native View nachgewiesen.
- **IN ARBEIT** = konkreter nativer Quellstand, überprüfter Teilbereich und offene Unterschiede dokumentiert.
- **BLOCKIERT** = Freigabe/Quelle/Technik fehlt, sachlicher Grund angegeben.
- **ABGENOMMEN** = Inhalt **und** Funktion **und** Marke **und** Display/Sprachen **und** Tests jeweils nachgewiesen.
- Jeder neue Quell-Routentyp und jede Unterroute erhält eine eigene Zeile, mit eindeutigen IDs und Testbelegen; keine Gruppe pauschal abhaken.

| ID | Quellbereich / Routentyp (zu bestätigen) | Was vollständig zu übertragen ist | Bekannter lokaler Teilstand (24.10.) | 1:1-Status |
| --- | --- | --- | --- | --- |
| 01 | home / start | Logo, Salam, Headlines, Hero, Gebetszeiten, alle Schnellzugriffe, Tagesinhalte/Empfehlungen | Dashboard/Schnellzugriffe partiell getestet | OFFEN |
| 02 | feed | vollständiger Feed, Filter/Sortierung, Medien, Sharing, Such-/Leseaktionen | nicht als vollständig nachgewiesen | OFFEN |
| 03 | topics | Themenübersicht, alle Kategorie-IDs, passende Hero/3D-Motive | Beiträge teilweise vorhanden | OFFEN |
| 04 | topic/{slug} | jeder Themenordner, alle zugeordneten Beiträge/Filter | keine Vollmengenprüfung | OFFEN |
| 05 | post/{id} | jeder vollständige geprüfte Beitrag, Autor, Quelle, /q/, Share, Favorit, Leser | Posts/ShareLink teilweise getestet | OFFEN |
| 06 | recent | neueste freigegebene Inhalte und chronologische Ordnung | offen | OFFEN |
| 07 | saved | Merken/Favoriten, Such-/Filter- und Rückkehrverhalten | offen | OFFEN |
| 08 | scholars | alle Gelehrten, Abbildungen, Kategorien | offen | OFFEN |
| 09 | scholar/{id} | Detail/Gelehrtenwerk und zugehörige Aussagen/Quellen | offen | OFFEN |
| 10 | series/{id} | alle Beitragsserien und ihre Reihenfolge | offen | OFFEN |
| 11 | book/{id} | Beitragszuordnung nach Büchern/Quellen | offen | OFFEN |
| 12 | books | Quellensammlung, Suchzugriff, Cover und Metadaten | Bibliothek teilweise vorhanden | OFFEN |
| 13 | quellen-book/{id} | vollständige Werkdetails und Quelllinks | offen | OFFEN |
| 14 | quellen-scholar/{id} | alle zugeordneten Quellautoren/-gelehrten | offen | OFFEN |
| 15 | bibliothek | Katalog, Gruppen, Bücher, Covers, Such-/Filterzustand | lokale native Bibliotheksliste vorhanden | OFFEN |
| 16 | bibliothek-detail/{slug} | Publikationsdetails, Metadaten und Lesen-Aktion | teilweise auditiert | OFFEN |
| 17 | bibliothek-reader/{slug} | tatsächlicher PDF-/Leser, Seitenwechsel, Fortschritt, Download, Quelle | PDF-Medienbestand noch nicht vollständig | OFFEN |
| 18 | duas | alle Duʿāʾ-Kategorien und Einträge | native Duʿāʾ-Views teilweise getestet | OFFEN |
| 19 | dua-cat/{id} | Kategorie- und Eintragvollständigkeit, Filter/Suche | offen | OFFEN |
| 20 | dua/{id} | Arabisch, Lautschrift, geprüfte Übersetzung, Quelle, Merken, Teilen, Audio | Teilen partiell getestet | OFFEN |
| 21 | quran | alle 114 Sūren, Suche, Liste, Lesestand | 114 Sūren verfügbar | OFFEN |
| 22 | quran-surah/{id} | alle vorhandenen Āyāt, Uthmānī-Schrift, Reader, Lese-/Quellenzustand | Teilstand getestet | OFFEN |
| 23 | quran-topic/{id} | alle vorhandenen Qurʾān-Themen und Verszuordnungen | offen | OFFEN |
| 24 | tafsir/tadabbur (Unterroute) | vollständige geprüfte Vers-Texte, Quellen, IDs, Markierung fehlender Inhalte | native Datenpfade nicht vollständig | OFFEN |
| 25 | quran-player | Rezitatoren, Rezitation, Wiederholung, Tempo, Hintergrund/Remote | Audio teilweise getestet | OFFEN |
| 26 | quran-learn / Lernstudio (vorhandene Funktion) | echte Wort-/Vers-Zeitmarken, Üben, Wiederholen, Fortschritt | vollständig nicht geprüft | OFFEN |
| 27 | hadith | Werk → Kitāb → Bāb → Ḥadīṯ, Arabisch, Quellen, Šarḥ, Filter, Teilen | nativer Hadith-Reader fehlt | OFFEN |
| 28 | frauen | alle Erwachsenen-Frauenthemen, Originalbilder, Kategorien, Aussagen | native Frauenseite fehlt | OFFEN |
| 29 | frauen/{thema} | alle Themenunterseiten, Hero, originale Kategorien, Filter | native Module fehlen | OFFEN |
| 30 | frauen/{thema}/{id} | vollständige Einzeltexte, Quellen und Teilen im nativen Leser | native Module fehlen | OFFEN |
| 31 | propheten | alle Erwachsenen-Prophetenbibliothek-Views/Quellen | offen; Kids ausgeschlossen | OFFEN |
| 32 | ilm / Wissen | vorhandene erlaubte Wissens-/Suchfunktionen | offen | OFFEN |
| 33 | tawhid-guide | Grundlagen-/Orientierungsseiten mit Quellen | offen | OFFEN |
| 34 | quiz / Lernen | vorhandene Erwachsenenfragen, Fortschritt, Bedienung | native Quizbasis vorhanden | OFFEN |
| 35 | prayer | Gebetszeiten, Rechenmethode, nächstes Gebet, Fehlerzustand | native Gebetsfunktion vorhanden | OFFEN |
| 36 | qibla | GPS/Kompass, native Schnellansicht und Permission-States | native Qibla vorhanden | OFFEN |
| 37 | calendar | islamischer Kalender, Datumslogik, Ansichten | offen | OFFEN |
| 38 | ramadan / jummah | vorhandene Ramaḍān- und Jumuʿah-Funktionen | offen | OFFEN |
| 39 | zakat | vorhandener Rechner, Parameter, Berichte | offen | OFFEN |
| 40 | news / news-detail | alle Updates, Übersicht, Reader, Deep Links | offen | OFFEN |
| 41 | notifications | Benachrichtigungszentrum, Lesestatus, Zuordnung | Push getrennt freigabepflichtig | OFFEN |
| 42 | account | Konto, Auth, gespeicherte Einstellungen, sichere Verbindungen | offen | OFFEN |
| 43 | settings | Themes, Sprachen, Schrift, Datenschutz, Audio, Berechtigungen | neun Sprachen noch nicht vollständig | OFFEN |
| 44 | more | vollständige Mehr-Navigation, Sekundärseiten/Shortcuts | offen | OFFEN |
| 45 | about | App-/Quellen-/Projektinformationen | offen | OFFEN |
| 46 | image-editor / Sharing (falls freigegeben) | Medieneditor, Kopieren/Teilen und Original-Social-Assets | offen | OFFEN |
| 47 | App-weit: Sprachwahl | de, en, tr, ar, ku, ckb, bs, fr, es, RTL und Freigabe-Fallback | neun Sprachreader nicht abgenommen | OFFEN |
| 48 | App-weit: Content-Synchronisierung | komplette freigegebene Inhalts-Payloads, ETag, Hash/IDs, Offline | nur Manifest synchronisiert | OFFEN |
| 49 | App-weit: Deep Links und Push | alle Zielseiten, app-spezifische APNs-Registrierung, isolierte Tests | Deep Links teilweise, Push nur Audit | OFFEN |
| 50 | App-weit: Design/Responsive | Original-Icons/Heros, iPhone-Duo Hoch-/Querformat, iPad, Safe Areas | einzelne Simulatorprüfungen | OFFEN |

## Jede Zeile muss am Ende erhalten

- **Quelle:** genauer produktiver Datei-/Routen-/Datenpfad, Zahl und Hash/ID-Liste der freigegebenen Datensätze.
- **DARNext:** echte Swift-Dateien/Views, Datenrepository, vollständige Medienzuordnung, native Navigation und Funktion.
- **Prüfung:** vergleichbare reale Screenshots von bestehender Erwachsenen-App und DARNext, Geräteprofil (Hoch/Quer/Size Class), 9-Sprachen-/RTL-Prüfung und sämtliche relevanten Nutzeraktionen.
- **Release-Gate:** Xcode Build/Tests/Datum/Commit bzw. auf lokalen Xcode-Arbeitsordner begrenzter nachvollziehbarer Nachweis; keine ungesicherten Aussagen.
- **Status:** OFFEN, IN ARBEIT, BLOCKIERT, ABGENOMMEN mit Grund.

## Zusätzlich dynamisch aufzunehmen

Tatsächlich gefundene weitere Routen, Kategorie-/Bāb-/Werk-Unterseiten, Modal-Leser, Lesezeichen, Quellenscans, Themenfilter, gesonderte Frauenbereiche, Qurʾān-Äyah-Erklärungen, PDF-Varianten, Audioquellen, Player-Submodes, Widgets, Menüunterseiten, direkte URLs und die Inhaltsunterschiede aller **neun** freigegebenen Sprachen.

**Zielzustand:** Jede reale Erwachsenen-Unterseite ist funktional und inhaltlich im nativen DARNext vertreten. Nicht die Anzahl der SwiftUI-Tabs, sondern die vollständige nachgewiesene Abdeckung der bestehenden Erwachsenen-App entscheidet über die Fertigmeldung.
