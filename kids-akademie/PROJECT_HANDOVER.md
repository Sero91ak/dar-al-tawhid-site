# START HERE – CHATGPT HANDOVER

DĀR AL TAWḤĪD KIDS AKADEMI. Stand vom 13. Oktober 2026. Diese Datei beschreibt den Repository-Stand. Sie ist kein Freigabebericht und keine Behauptung, dass 208 Lektionen fertig sind.

## Einstieg

1. Arbeitszweig: `cursor/kids-akademie-208-fa8f`
2. Ausgangspunkt vor dieser Übergabe: Commit `50ce048314b01d8f5749767f2fa221c214b0e187` auf `kids/lessons-67-70-20261012` (Pull Request #1089).
3. Der Commit dieser Übergabe steht in der Git-Historie dieses Zweigs nach dem Ausgangspunkt. `git log -1 --oneline` auf diesem Zweig nennen.
4. Maschinenlesbarer Lektionsstand: `kids-akademie/LESSON_STATUS.json`
5. Quellen, die wirklich im Register stehen: `kids-akademie/research/SOURCE_REGISTRY.json`
6. Nächste konkrete Arbeit: `kids-akademie/NEXT_TASKS.md`
7. Technik: `kids-akademie/ARCHITECTURE.md`

## Was tatsächlich vorhanden ist

Gezählt mit `node kids/tools/build-akademie-handover-status-v1.cjs` gegen Jahresplan, Recherche-Ledger und `kids/unterrichtsarchiv.html`:

- 208 Unterrichtsslots im Jahresplan `kids/data/academy-year-52weeks-v1.json`.
- 97 Slots haben eine `lessonId` (Slots 1–97). Neu in diesem Fortsetzungslauf: Slots 91–94 in `curriculum-v36.js` und Slots 95–97 in `curriculum-v37.js`, je drei Altersfassungen.
- 111 Slots (98–208) haben Thema und Altersziel im Ledger, aber keine Lektions-ID und keinen Unterrichtstext.
- 96 Module stehen im Archivkatalog und haben Fragen für 4–5, 6–8 und 9–10. Das ist keine religiöse Freigabe.
- `sidq` ist ein separates Modul und fehlt im 96er-Katalog. 97 Lektions-IDs und 96 Katalogeinträge sind deshalb kein fehlender Unterricht: 96 plus das Sonderobjekt `sidq` ergeben 97. Vor diesen Paketen waren es 90 IDs und 89 Module, aus demselben Grund.
- 6 Slots tragen `target-hadith-checked-online`: 79, 82, 83, 84, 85, 86. Das sind ältere Dorar-Stichproben, in diesem Lauf nicht erneut geöffnet.
- 50 weitere Slots tragen nur geerbte Metadaten `metadata-in-repository-not-reverified`.
- 7 Slots (91–97) tragen `primary-page-read-islamweb-2026-10-13`.
- 145 Slots sind `not-reviewed`.
- Freigegebene Altersfassungen: 0 von 624. `religiousSourcesVerified` von Paket V36 steht auf false.
- Live-Deploy: nicht ausgeführt.
- Audioerzeugung in diesem Lauf: nicht ausgeführt. `kids/data/academy-voice-plan-v36.json` enthält nur ungenerierte deutsche Sprechtexte.

Die frühere Angabe „66 auf main, Arbeit bis 86“ ist damit nur teilweise bestätigt: Auf diesem Zweig sind 97 IDs vergeben. Die Slots 87–90 bleiben Entwürfe mit nicht erneut geprüfter Quellenmetadaten. Slots 91–97 sind Entwürfe mit gelesenen Islamweb-Seiten. Slot 98 ist der erste leere Slot.

## Pull Requests

- #1089, Zweig `kids/lessons-67-70-20261012`, Basis `main`, offen. Unterricht 67–90 und Masterauftrag.
- #1090, Zweig `test/kids-curriculum-70-synchronization`, Basis `main`, offen. Nur Test-App-Prüfdateien. Nicht mit Kinderdateien vermischen.

## Letzte abgeschlossene Arbeit in diesem Lauf

Paket V36, Slots 91–94, drei Altersfassungen je Lektion, ohne Audio und ohne Freigabe:

- 91 `adab-danke-und-entschuldigung`: Qurʾān 14:7 auf Islamweb, Tafsīr Ibn Kaṯīr, Inhalt 49/891. Abū Dāwūd 4811 auf der Bibliotheksseite zum Kapitel über den Dank. Bewertung ṣaḥīḥ nur aus Fatwa 34287 nach al-Albānī, nicht von der Abū-Dāwūd-Seite. Entschuldigung ist Übung.
- 92 `tarbiyah-bei-problemen-hilfe-holen`: Qurʾān 2:153, Ibn Kaṯīr, Inhalt 49/150. Hadithsatz auf Artikel 76979, Muslim zugeschrieben, ohne gedruckte Nummer. 2699 nicht übernommen. Einer erwachsenen Person Bescheid sagen ist Schutzübung.
- 93 `nafs-dankbarkeit-im-herzen`: dieselben zwei Stellen wie Slot 91, kein zweiter Hadith. Die genannte Gabe ist Übung.
- 94 `fiqh-wudu-waschen-und-streichen`: Auszug 5:6 und Hadith ohne Nummer auf Tafsīr al-Manār, Inhalt 65/790. Al-Buḫārī 135 nicht erneut gelesen. Maß des Kopfstreichens offen. Al-Mughnī dafür nicht gelesen.

Dorar `sharh/3429` und al-Maktaba lieferten HTTP 403. Diese Seiten sind nicht als erneut gelesen markiert.

Paket V37, Slots 95–97:

- 95 `quran-surat-an-nas-kennenlernen`: alle sechs Verse vokalisiert auf Ibn Kaṯīr, Inhalt 49/1988. Der Vorzugsabschnitt 49/1986 nennt al-Buḫārī und Muslim ohne Nummer. Keine synthetische Rezitation, kein Hauchen und kein Streichen als Übung.
- 96 `sirah-musa-und-mut`: Qurʾān 20:45–46 auf Inhalt 49/1137. Kein Hadith auf dieser Seite. Vers 20:47 wird nicht nachgespielt.
- 97 `dua-vor-dem-lernen-um-hilfe-bitten`: Qurʾān 20:114 auf Inhalt 49/1155. Die Lernbitte ist nur der Schlussteil. Kein Hadith auf dieser Seite.

## Bekannte Fehler

- Ältere `sourceAudit`-Daten im Curriculum sind geerbt. Sie sind keine neue Prüfung.
- Der Ledger-Test `kids/tools/test-academy-208-research-ledger-v1.cjs` zählt 97 implementierte Slots und 6 ältere Dorar-Stichproben. Er ist in diesem Lauf grün. Das ist keine Quellenfreigabe.
- Abweichung 90 IDs zu 89 Archivmodulen: `sidq` ist das Sonderobjekt außerhalb des Katalogs. Nach den Paketen V36 und V37 gilt dieselbe Regel: 97 IDs, 96 Katalogmodule, `sidq` weiter separat. Nichts wurde gelöscht, um die Zahlen gleichzuziehen.
- CI von #1089 und #1090 war beim letzten festgehaltenen Status nicht vollständig grün. Dieser Lauf hat die Workflows nicht erneut ausgeführt.
- `FINAL_REPORT.md` existiert absichtlich nicht. Der Produktionsabschluss ist nicht erreicht.

## Nächster Schritt

Slot 98, Woche 25, Montag, Säule `family`, Thema „Mobbing erkennen und Hilfe holen“. Eine gelesene Stelle zu Schaden durch Wort oder Hand suchen. Keine erfundene Geschichte. Danach die offenen Slots 99–208 nur mit gelesenen Stellen.
