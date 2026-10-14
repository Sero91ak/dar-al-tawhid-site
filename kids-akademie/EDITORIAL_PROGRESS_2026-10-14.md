# Redaktioneller Arbeitsstand – 14. Oktober 2026

> **Nur Arbeitszweig**, keine Kinder-Freigabe, keine Aufnahme, kein Merge, kein Live-Deploy. Diese Datei beschreibt die tatsächlich vorgenommenen Textänderungen und ersetzt keine unabhängige Quellenprüfung.

## Umfang der hier vorgenommenen Arbeit

- Repository: `Sero91ak/dar-al-tawhid-site`
- Zweig: `cursor/kids-akademie-208-fa8f`, Pull Request #1113.
- Jahresziel unverändert: 208 Lektionen / 624 Altersfassungen. Von der hier dokumentierten Redaktion wurden **11 Lektionen / 33 Altersfassungen** gezielt überarbeitet. Die übrigen Entwürfe sind **nicht deshalb geprüft**.
- Betroffene Slots: **99–105 und 107–110**; Slot 106 wurde wegen separat laufender Fiqh-Quellenarbeit bewusst nicht durch diesen Textlauf überschrieben.
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

## Inhaltliche Leitplanken

- Die geänderten Texte unterscheiden Qurʾān-Wortlaut, sinngemäße deutsche Erklärung und eigene Unterrichtsübung.
- Schutzsituationen werden **nicht nachgespielt**. Ein Kind trägt keine Schuld am Übergriff, auch wenn es vor Schreck nicht handeln konnte.
- Verzeihen darf nicht als Pflicht zum Schweigen oder zur erzwungenen Versöhnung dargestellt werden.
- In Slot 107 war der als 75:16 gekennzeichnete arabische Text zuvor mit Worten aus Vers 75:17 verkettet. Das Qurʾān-Feld zeigt nun ausschließlich 75:16; der Folgevers bleibt als Kontext beschrieben.
- Geplante deutsche Sprechtexte wurden mit den geänderten Altersfassungen abgeglichen. Keine synthetische Qurʾān-Rezitation, keine Nutzung von ElevenLabs-Credits.

## Technische Prüfung

Eine **lesende, programmatische Konsistenzkontrolle** nach diesen Änderungen ergab:

- 111/111 V38-Lektionen im Objekt `additions`, 208 Slots laut `LESSON_STATUS.json`;
- 624 Alterszuordnungen laut `LESSON_STATUS.json`, davon zum Zeitpunkt der Kontrolle 0 freigegeben;
- 11 redaktionell geänderte Lektionen mit vollständigen drei Altersfassungen, jeweils vier Unterrichtszeilen;
- zu jedem geänderten `intro`, zu jeder `line` und zu jedem altersbezogenen `audioScript` ein passender Kontext im V38-Sprechplan;
- in den sichtbaren Einleitungen und Alters-Audios der V38-Lektionen keine Treffer für die konkret kontrollierten internen Marker „Keine Freigabe für Besucher“, „Keine synthetische Rezitation“, „wissenschaftliche Freigabe“, „Diese Stunde bleibt ein Entwurf“ oder „Der gespeicherte Auszug druckt“;
- `generateCreditsUsed=0`, keine unbeabsichtigte Umstellung des Freigabestatus;
- keine Fehler in diesen überprüften In-Memory-Invarianten.

**Einschränkung:** Das waren programmatische Datenkontrollen über die abgerufenen Repository-Dateien, **keine** vollständige GitHub-Actions/Node-Regression und **keine** unabhängige religionswissenschaftliche Originalquellenverifikation.

## Weiterarbeit

1. Ab Slot 111 die noch überwiegend schematischen V38-Unterrichtstexte einzeln pädagogisch vertiefen; Texte für alle drei Altersgruppen tatsächlich altersgerecht ausarbeiten.
2. Den bereits separat bearbeiteten Fiqh-Slot 106 und weitere 17 markierte Fiqh-Stunden nicht ohne eigenständigen Quellenvergleich als freigegeben behandeln.
3. Weiteres V38-Quellen- und Versgrenzen-Audit durchführen, insbesondere vollständige Verse vs. unvollständige Tafsīr-Auszüge.
4. Geplanten Sprechtextbestand nach jeder inhaltlichen Änderung **ohne Audioerzeugung** synchronisieren.
5. Danach unabhängige wissenschaftliche und pädagogische Freigabe, keine automatische Gesamtfreigabe.

Hinweis: Auf dem Zweig können parallel weitere unabhängige Commits entstehen. Vor jedem Update den aktuellen Branch-SHA und Dateibestand erneut lesen, damit nichts versehentlich überschrieben wird.
