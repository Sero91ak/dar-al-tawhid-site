# Ṣaḥīḥ al-Buḫārī · offene arabische Fassung (Kitāb → Bāb → Ḥadīṯ)

Stand: 27.11.2026. Nur Dar-Test-Einbindung. Besucher-Spur erst nach „Push live“.

## Primärquelle (Wortlaut, Kitāb, Bāb)

- Datensatz: **open-hadith-data by samt-qa — https://github.com/samt-qa/open-hadith-data — CC BY 4.0**
- Release `v0.1.0`, Datei `open-hadith-data-0.1.0.zip` → `jsonl/bukhari.jsonl.gz`
- Grundlage laut Datensatz: Sulṭāniyya-Ausgabe (Būlāq 1311 H.), al-Maktaba aš-Šāmila Nr. 1681. Zählung nach Fuʾād ʿAbd al-Bāqī als Nachschlagenummer.
- Übernommen: 7.481 Ḥadīṯe, 97 Kitāb, 3.241 Bāb in der Reihenfolge der Ausgabe, vollständiger Text mit Isnād (`ar`), Beginn des Matn als Zeichenposition (`mi`), gedruckte Nummern (`p`).
- Ohne Taškīl, ohne Fußnoten, ohne Bewertungen und ohne Šarḥ der Herausgeber. Diese gehören den Herausgebern und werden nicht übernommen.

### Lizenz und Namensnennung

- Datensatz-Struktur, Abgleich und Korrekturen: CC BY 4.0. Namensnennung (Pflicht): „open-hadith-data by samt-qa — https://github.com/samt-qa/open-hadith-data — CC BY 4.0“. Änderungen hier: in Dateien pro Kitāb aufgeteilt, Felder umbenannt, Kitāb-1-Überschrift ergänzt (siehe unten).
- Matn und Isnād sind klassische, gemeinfreie Texte.

### Kitāb 1: Bāb-Überschrift

Im Datensatz haben alle 7 Ḥadīṯe von Kitāb 1 `bab.title = null` (Lücke des Parsers). Die Sulṭāniyya-Ausgabe beginnt mit der Tarǧama „كيف كان بدء الوحي إلى رسول الله صلى الله عليه وسلم“, gefolgt von an-Nisāʾ 4:163. Diese Überschrift ist allen sieben Ḥadīṯen zugeordnet.

### Weitere Bāb ohne Überschrift

- 83 Ḥadīṯe in 28 Kitāb stehen in der Ausgabe vor dem ersten Bāb (Bāb-Nummer 0). Sie erscheinen als „Zu Beginn des Kitāb“. Es wurde kein Titel erfunden.
- 73 Bāb tragen nur „باب“ bzw. „باب:“. Das ist klassisch so und bleibt leer („Ohne Überschrift“).

## Gegenquelle (nur Lücken)

- `fawazahmed0/hadith-api`, Ausgabe `ara-bukhari` (Unlicense), nur für Nummern, die in der Primärquelle fehlen.
- 7 Fuʾād-Nummern fehlen in der Primärquelle: 3028, 4034, 4513, 4514, 6591, 7123, 7125. Ihr Wortlaut aus der Gegenquelle steht als „Weitere Ḥadīṯe“ (`k-00`, `crossCheck: true`). Nichts wurde aufgefüllt oder erraten.
- Hinweis: Nr. 1 ist vollständig. Der Satz „فمن كانت هجرته إلى الله ورسوله …“ steht in der Überlieferung über al-Ḥumaydī bei al-Buḫārī nicht; er steht u. a. in Nr. 54 und Nr. 6689. Der frühere Hinweis auf eine „gekürzte Datei“ war falsch und ist entfernt.

Nicht verwendet: sunnah.com und Abschriften davon; OpenITI (CC BY-NC-SA, nur Gegenprobe); die Übersetzung der Föderalen Islamischen Union und hadithsammlung.de (alle Rechte vorbehalten); `eng-bukhari` (Muḥsin-Ḫān-Übersetzung).

## Übersetzung und Šarḥ (KI)

- Pakete pro Kitāb und Sprache: `i18n/k-NN/<lang>.json` mit `babs` (Bāb-Titel) und `hadiths` (`matn`, `sharh`). Die App lädt nur die aktuelle Sprache und Deutsch als Ersatz.
- Alle Übersetzungen und Šarḥ-Texte sind KI-erstellt aus dem Arabischen und in der App so gekennzeichnet. Šarḥ: kurze sachliche Zusammenfassung, angelehnt an Fatḥ al-Bārī, ohne erfundene Zitate oder Seitenzahlen.
- Fehlt eine Sprache, zeigt die App die deutsche KI-Übersetzung mit Hinweis, sonst den arabischen Wortlaut mit Hinweis. Fehlt ein übersetzter Bāb-Titel, steht die arabische Tarǧama.
- Abdeckung: siehe `COVERAGE.md`.

## Erzeugung

`python3 scripts/build-bukhari-open-corpus.py <bukhari.jsonl.gz> <ara-bukhari.min.json>`
