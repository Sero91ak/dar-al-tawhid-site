# Redaktioneller Arbeitsstand – 14. Oktober 2026

## Ergänzung · Unterrichtsredaktion 131–133 (14.10.2026)

**Redaktionell einzeln vertieft: insgesamt 32 Lektionen / 96 Altersfassungen** (18 frühere, elf aus 119–129, drei weitere aus 131–133). Die übrigen Entwürfe sind damit **nicht** redaktionell freigegeben.

- Neuer Arbeitszweig-Baustein `kids/akademie/curriculum-editorial-131-133-v1.js` nach den drei vorangegangenen Unterrichts-Overlays eingebunden.
- Qurʾān 73:4: tartīl kindgerecht und ohne erfundene Rezitationsnorm; Qurʾān 96:1 mit unabhängig überprüftem Sīrah-Bericht von **ʿĀʾishah, Ṣaḥīḥ al-Buḫārī Nr. 3**; Qurʾān 2:172 mit überprüftem Dank-Hadith von **Anas, Ṣaḥīḥ Muslim Nr. 2734**.
- Original- und Hadithtexte werden von deutscher Sinnerklärung sowie pädagogischen erfundenen Beispielen getrennt; 2:172-Arabischfeld zur Worttrennung `يَا أَيُّهَا` berichtigt. Im Sprechplan keine arabische synthetische Qurʾān-Rezitation.
- **14 Unterrichtslektionen / 42 Altersfassungen aus 119–133: 252/252 Textzuordnungen** für Einleitungen, 4 Unterrichtszeilen und geplante Skripte in einer unabhängigen Datenprüfung ohne Befund.
- Ungenerierter Sprechplan: **1.531 verschiedene Textbausteine, 2.109 Kontexte, 0 generierte Audios / 0 Credits**.
- Neues Prüfprotokoll: `kids-akademie/research/INDEPENDENT_REVIEW_131_133_20261014.md`.
- **Keine** wissenschaftliche Freigabe: **0/624**. Kein Merge auf `main`, kein Live-Deploy. Node-/Browser-Regression und unabhängige menschliche Prüfung weiterhin offen.
- **Nächster Unterrichtsblock: 134–136**; besondere Fiqh-Prüfungen bleiben getrennt und werden nicht als freigegeben behandelt.

---


## Ergänzung · Unterrichtsredaktion 119–129 (14.10.2026)

**Aktueller dokumentierter Umfang der individuellen Redaktion:** 29 Lektionen / 87 Altersfassungen im V38-Ausbau: zuvor 18 Lektionen aus 99–117 (ohne Fiqh 106) plus die elf Lektionen **119–129** (ohne die getrennt quellengeprüfte Fiqh-Stunde 118). Ein vorhandener Entwurf allein zählt nicht als pädagogisch geprüft.

- Neue Arbeitsmodule: `kids/akademie/curriculum-editorial-119-122-v1.js`, `curriculum-editorial-123-126-v1.js`, `curriculum-editorial-127-129-v1.js`. Alle drei werden in dieser Reihenfolge **nur auf dem PR-Arbeitszweig** in der Akademieansicht geladen.
- **Vier konkrete Qurʾān-Textkorrekturen** im effektiven Datenbestand: 6:59 arabische Wortgrenze `وَلَا يَابِسٍ`; 99:7 getrennt von 99:8; 2:286 als **Ausschnitt** statt vollständiger Vers; 39:53 mit `قُلْ` und ohne die eigenständigen Verse 39:54–55.
- Redaktion für 127–129: Gastfreundschaft und persönliche Grenzen; Lernpausen ohne erfundene Minutenregel; Reue, Hoffnung und Wiedergutmachung ohne Beschämung.
- **Lesende Konsistenzkontrolle:** 11 Lektionen × 3 Altersgruppen × (1 Intro + 4 Unterrichtszeilen + 1 Sprechskript) = **198/198 übereinstimmende Texte**; dazu die Einbindung der drei Module in korrekter Reihenfolge geprüft.
- Ungenerierter Sprechplan: **1.514 verschiedene Textbausteine / 2.109 Verwendungen / 0 Audio-Credits.** Keine Audioerzeugung, keine synthetische Qurʾān-Rezitation.
- Quellenakten: `research/INDEPENDENT_QURAN_AUDIT_123_126_20261014.md`, `research/INDEPENDENT_REVIEW_127_129_20261014.md`. Das sind **Teilprüfungen**, keine Gesamtfreigaben.
- **Freigabe weiter 0/624**. GitHub-PR #1113 bleibt Draft, kein Merge auf `main`, kein Live-Deploy.
- **Nächster Unterrichtstext-Block: 131–133**; Fiqh-Slot 130 bleibt unabhängig quellen- und pädagogisch prüfpflichtig. Künftige V38-Arabisch-Konsolidierung darf die jetzt korrigierten Versgrenzen nicht verlieren.

---


## Fortschreibung: Altersredaktion 119–129

- Die Unterrichtsblöcke **119–122, 123–126 und 127–129** sind in `kids/akademie/index.html` auf dem Arbeitszweig eingebunden. **11 weitere Lektionen / 33 Altersfassungen** besitzen nun individuelle Unterrichtstexte; zusammen mit der hier zuvor dokumentierten Arbeit an 99–117 sind dies **29 gezielt redaktionell vertiefte Lektionen / 87 Altersfassungen** (keine unabhängige Gesamtfreigabe).
- Versgrenze korrigiert: Slot **125**, Qurʾān **99:7** enthält im Kinder-Curriculum nur Vers 7; 99:8 bleibt separat.
- Versgrenze korrigiert: Slot **129**, Qurʾān **39:53** beginnt mit `قُلْ` und enthält nicht länger die Verse 39:54–55. Slot **128** kennzeichnet den gespeicherten Teil von 2:286 als **Auszug**, nicht als vollständigen Vers.
- Quellenakten: `research/EDITORIAL_REVIEW_119_122_20261014.md`, `research/EDITORIAL_REVIEW_123_126_20261014.md`, `research/EDITORIAL_REVIEW_127_129_20261014.md`. Offen gebliebene Primärquellenabrufe sind in den Einzelakten genannt, nicht als geprüft ausgegeben.
- Deutscher, **nicht erzeugter** Sprechtextplan `kids/data/academy-voice-plan-v38.json` nach Redaktion 119–129 abgeglichen: **1.525 einzigartige Textbausteine**, unverändert **2.109 Kontexte**, `generateCreditsUsed=0`. Der zusätzliche Textplan ist keine Aufnahmegenehmigung.
- Regressionstest `kids/tools/test-academy-editorial-123-126-v1.cjs` hinterlegt; **ein Node- oder Browser-Regressionstest wurde von dieser Sitzung nicht tatsächlich ausgeführt**. Ein schreibgeschützter Struktur- und Textkontextvergleich bei der Synchronisierung prüfte die 54 neuen Sprechkontexte für Slots 127–129.
- `sourceAudit.scientificApproval=false` und **0/624 wissenschaftlich freigegebene Altersfassungen** unverändert. Kein Audio, kein Merge, kein Live-Deploy.
- **Nächste Didaktik-Lektionen:** 131–133 (Slot 130 läuft gesondert unter Fiqh-Quellenprüfung), anschließend 134 ff.; Fiqh 180 ff., ältere Quellen und offener Testlauf separat.


> **Nur Arbeitszweig**, keine Kinder-Freigabe, keine Aufnahme, kein Merge, kein Live-Deploy. Diese Datei beschreibt die tatsächlich vorgenommenen Textänderungen und ersetzt keine unabhängige Quellenprüfung.

## Umfang der hier vorgenommenen Arbeit

- Repository: `Sero91ak/dar-al-tawhid-site`
- Zweig: `cursor/kids-akademie-208-fa8f`, Pull Request #1113.
- Jahresziel unverändert: 208 Lektionen / 624 Altersfassungen. Von der hier dokumentierten Redaktion wurden **18 Lektionen / 54 Altersfassungen** gezielt überarbeitet. Die übrigen Entwürfe sind **nicht deshalb geprüft**.
- Betroffene Slots: **99–105 und 107–117**; Slot 106 wurde wegen separat laufender Fiqh-Quellenarbeit bewusst nicht durch diesen Textlauf überschrieben.
- Alle `sourceAudit.scientificApproval`-Felder dieser elf Lektionen bleiben `false`. Auch der globale Freigabestatus bleibt unberührt.

## Tatsächliche Commits

| Teilbereich | Commit |
| --- | --- |
| Qurʾān-only-Anzeige und Quellenprüftext aus sichtbarer Unterrichtsübersicht ausklammern | `7987cf7d82f9098e0a5de86388b552caec538ba8` |
| Redaktion Lektionen 99–100, je drei Altersfassungen | `b5106aa04b02e03c9021dbb80c0828a89c44c916` |
| Geplante Sprechtexte 99–100 synchronisiert, **nichts generiert** | `4cbf2240a3dfe5de8eb18b7b83d26b1da75d9749` |
| Redaktion 101–103 (Bescheidenheit, Grenzen beim Verzeihen, Rücksicht) | `c256d8dbf470e6014f38559fe99c4fa6eafe196c` |
| Geplante Sprechtexte 101–103, **nichts generiert** | `0042504b68b93ecd467ecd3419063edae027ad5f` |
| Redaktion 104–105 (persönliche Grenzen, Neid ohne Beschämung) | `d5966264420b2a344005c8ea882a8e2c41dc5844` |
| Geplante Sprechtexte 104–105 | `85f6c505e64f646654ba6b65bc718c16cae898a7` |
| Redaktion 107–110 (Offenbarungskontext, ʿĪsā, Elternbitte, Schutz) | `c68f0f8b6ebc12786d98c5d1afe2cee02dc61817` |
| Versabgrenzung von Qurʾān 75:16 und 75:17 in Slot 107 korrigiert | `a05548cb31dbd31233e510e436167db9a3134a82` |
| Geplante Sprechtexte 107–110 | `ceb94887d96687fdc908fb0bac0b397aaa88cf09` |
| Redaktion 111–114 (Allahs Wissen, Gesandte, Ikhlāṣ, Dankbarkeit) | `6be61113eaac5c5cfa37f733c6daccd89816a7e7` |
| Geplante Sprechtexte 111–114 | `c7f2b71bf9774224ef67f0c5eb8f649a9fa23a9b` |
| Redaktion 115–117 (Qurʾān-Sorgfalt, Haushaltssicherheit, Geduld) | `0fe9522f2d1b94333edf5dcded8e89989ac9dca4` |
| Geplante Sprechtexte 115–117 | `878477a50dce5c32c1ba1d36e6ae7710f7c50cf5` |

## Inhaltliche Leitplanken

- Die geänderten Texte unterscheiden Qurʾān-Wortlaut, sinngemäße deutsche Erklärung und eigene Unterrichtsübung.
- Schutzsituationen werden **nicht nachgespielt**. Ein Kind trägt keine Schuld am Übergriff, auch wenn es vor Schreck nicht handeln konnte.
- Verzeihen darf nicht als Pflicht zum Schweigen oder zur erzwungenen Versöhnung dargestellt werden.
- Die bearbeiteten Slots 115–117 unterscheiden Rechtsfragen zu Qurʾān 56:79, Schutzregeln im Alltag und Geduld ausdrücklich von direkten Versgeboten.
- In Slot 107 war der als 75:16 gekennzeichnete arabische Text zuvor mit Worten aus Vers 75:17 verkettet. Das Qurʾān-Feld zeigt nun ausschließlich 75:16; der Folgevers bleibt als Kontext beschrieben.
- Geplante deutsche Sprechtexte wurden mit den geänderten Altersfassungen abgeglichen. Keine synthetische Qurʾān-Rezitation, keine Nutzung von ElevenLabs-Credits.

## Technische Prüfung

Eine **lesende, programmatische Konsistenzkontrolle** nach diesen Änderungen ergab:

- 111/111 V38-Lektionen im Objekt `additions`, 208 Slots laut `LESSON_STATUS.json`;
- 624 Alterszuordnungen laut `LESSON_STATUS.json`, davon zum Zeitpunkt der Kontrolle 0 freigegeben;
- 18 redaktionell geänderte Lektionen mit vollständigen drei Altersfassungen, jeweils vier Unterrichtszeilen;
- zu jedem geänderten `intro`, zu jeder `line` und zu jedem altersbezogenen `audioScript` ein passender Kontext im V38-Sprechplan;
- in den sichtbaren Einleitungen und Alters-Audios der V38-Lektionen keine Treffer für die konkret kontrollierten internen Marker „Keine Freigabe für Besucher“, „Keine synthetische Rezitation“, „wissenschaftliche Freigabe“, „Diese Stunde bleibt ein Entwurf“ oder „Der gespeicherte Auszug druckt“;
- `generateCreditsUsed=0`, keine unbeabsichtigte Umstellung des Freigabestatus;
- keine Fehler in diesen überprüften In-Memory-Invarianten.

**Einschränkung:** Das waren programmatische Datenkontrollen über die abgerufenen Repository-Dateien, **keine** vollständige GitHub-Actions/Node-Regression und **keine** unabhängige religionswissenschaftliche Originalquellenverifikation.

## Weiterarbeit

1. Ab Slot 119 (Slot 118 wird separat im Fiqh-Quellenlauf bearbeitet) die noch überwiegend schematischen V38-Unterrichtstexte einzeln pädagogisch vertiefen; Texte für alle drei Altersgruppen tatsächlich altersgerecht ausarbeiten.
2. Den bereits separat bearbeiteten Fiqh-Slot 106 und weitere 17 markierte Fiqh-Stunden nicht ohne eigenständigen Quellenvergleich als freigegeben behandeln.
3. Weiteres V38-Quellen- und Versgrenzen-Audit durchführen, insbesondere vollständige Verse vs. unvollständige Tafsīr-Auszüge.
4. Geplanten Sprechtextbestand nach jeder inhaltlichen Änderung **ohne Audioerzeugung** synchronisieren.
5. Danach unabhängige wissenschaftliche und pädagogische Freigabe, keine automatische Gesamtfreigabe.

Hinweis: Auf dem Zweig können parallel weitere unabhängige Commits entstehen. Vor jedem Update den aktuellen Branch-SHA und Dateibestand erneut lesen, damit nichts versehentlich überschrieben wird.
