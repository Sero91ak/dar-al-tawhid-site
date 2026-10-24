# DARNext — Medieninventar P1

Stand: 2026-10-24, Branch `codex/darnext-native-masterauftrag-20261024`.

Dieses Inventar beschreibt vorhandene Repository-Quellen. Es erzeugt keine neuen Medien und ändert keine produktiven Push-, Worker- oder Content-Publishing-Dateien.

## 3D-Haupticons

Quelle: `assets/dar-3d-icons/`. Alle geprüften PNG-Icons sind 256 × 256 px mit transparentem Hintergrund. Die GitHub-API-Größen sind als Rohdateigröße dokumentiert.

| Asset | Größe | Native Zielnutzung |
| --- | ---: | --- |
| `quran.png` | 77,099 B | DARNext Startseite/Qurʾān |
| `dua.png` | 23,247 B | Startseite/Duʿāʾ |
| `qibla.png` | 49,398 B | Startseite/Qibla |
| `posts.png` | 75,771 B | Startseite/Beiträge |
| `hadith.png` | 74,557 B | Startseite/Ḥadīṯ |
| `frauen.png` | 56,841 B | Startseite/Frauenbereich |
| `library.png` | 50,176 B | Startseite/Bibliothek |
| `prayer.png` | 80,300 B | Gebetszeiten |
| `audio.png`, `headphones.png`, `play.png` | 57,668 / 130,047 / 40,584 B | Player und Audio |
| `calendar.png`, `compass.png`, `quiz.png`, `scholars.png`, `settings.png` | 62,487 / 84,985 / 82,861 / 63,145 / 218,528 B | Kalender, Qibla, Lernen, Gelehrte, Einstellungen |
| übrige 3D-Icons | 20 weitere PNGs, 256 × 256 px | spätere kontextuelle Module |

Vollständiger Katalog: `audio, bell, calendar, compass, dua, frauen, hadith, headphones, heart, home, ilm, image, jummah, library, lock, more, mosque, news, play, posts, prayer, prophets, qibla, quiz, quran, ramadan, saved, scale, scholars, settings, shield, spark, topics, wasiyyah, widgets, zakat`.

Zusätzliche realistische UI-Icons liegen unter `assets/ui-icons/` (10 PNGs, insbesondere Buch, Kompass, Favoriten, Kopfhörer, Play/Pause, Gelehrte, Einstellungen, Themen). Sie sind sekundäre Alternativen; die DARNext-Hauptnavigation soll den DAR-3D-Katalog verwenden.

## Hero- und Beitragsbilder

| Quelle | Pixelmaß | Native Zielnutzung |
| --- | ---: | --- |
| `assets/home-v1194/hero-mobile-adobe.jpg` | 1072 × 1920 | Startseite Hochformat/iPhone |
| `assets/home-v1194/hero-wide-adobe.jpg` | 2016 × 1152 | Startseite Querformat/iPad |
| `assets/home-v1194/study-runway.jpg` | 1376 × 768 | Lernen/Studium |
| `assets/post-heroes/topics.webp` | 1920 × 1080 | Beitragsübersicht |
| `assets/post-heroes/topic-detail.webp` | 1920 × 1080 | Beitragsthema/Detail |
| `assets/post-heroes/post-reader.webp` | 1376 × 768 | Reader |

Die Hero-Motive sind Quellen, keine über die Statusleiste gelegten Kopien. Native Safe-Area-/Kontrastprüfung bleibt P2/P3.

## Frauenbereich

- `assets/frauen/library-v1223/`: 7 Themenbilder, jeweils 1376 × 768 px; große Bibliotheks-/Detaildarstellung.
- `assets/frauen/library-v1224/`: 7 Themenbilder, jeweils 900 × 506 px; kompakte/alternative Darstellung.
- Gemeinsame Themen: Grundlagen des Dīn, Fiqh Frauen, erste Generationen, Familie/Erziehung, Wissen/Adab/Daʿwah, Alltag/Schutz, Lebensphasen.
- Native Zielnutzung: Frauenbereich-Kategorie- und Detailkarten; Inhalte und Reihenfolge aus vorhandenen zentralen Daten.

## Bibliothek und Feeds

- `assets/library/covers/`: 42 katalogisierte Cover-Verzeichnisse/Quellen, IDs beginnen mit `pub-`; Zuordnung über `data/library-publications.json` und `data/canonical-books-index.json`.
- `assets/feed-backgrounds/`: 13 Themenverzeichnisse (`abstract, adab, akhirah, aqidah, auto, books, dua, gradients, knowledge, mosque, nature, quran, tawhid`). Der konkrete Medienindex ist `content/feed-backgrounds/feed-backgrounds.json`.
- Beitrags-/Inhaltsdaten bleiben zentral: `content/posts/`, `content/duas/`, `content/quran/`, `content/tafsir/` und die bestehenden `data/`-Indizes. DARNext erhält keine konkurrierende Redaktion.

## Lokaler Xcode-Abgleich

Der aktuelle Xcode-Projektbaum enthält die DARNext-SwiftUI-Dateien und bestehende App-Icon-Assets, aber keine eingebundene Kopie der Web-3D-/Hero-/Frauenmedien. P2/P3 müssen daher die freigegebenen Quellen gezielt als DARNext-eigene Ressourcen importieren und im Target registrieren. Vor dem Import sind Pfade, Lizenz-/Herkunftshinweise und Asset-Catalog-Struktur zu bestätigen; produktive Targets dürfen nicht mitverändert werden.

## Fehlbedarf / nächste zulässige Aktion

- Vorhandene Bildquellen sind ausreichend für P1; kein Generierungsbedarf.
- Exakte Cover-Pixelmaße werden beim gezielten Import der tatsächlich verwendeten Cover je ID ergänzt.
- P2: DARNext-eigenen Asset-Katalog bzw. Ressourcenpfad anlegen, Theme-/Navigation-Komponenten daran anbinden, dann Build und Tests erneut ausführen.
