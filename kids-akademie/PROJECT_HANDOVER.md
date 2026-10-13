# START HERE – CHATGPT HANDOVER

DĀR AL TAWḤĪD KIDS AKADEMI. Stand vom 13. Oktober 2026. Alle 208 Slots haben auf diesem Zweig eine Lektion mit drei Altersfassungen. Die Meldung „97/208“ gehört zum Commit `3bd743a0b0`. Der Strukturentwurf 98–208 folgte in `21f1082990`. Danach wurden die Kindersätze der Slots 98–208 so geschrieben, dass die Gruppen 4–5 und 6–8 den Vers, den Alltag und die Übung lernen. Die Quellengrenze bleibt in der Quellenkarte und in der Fassung 9–10. Das ist keine wissenschaftliche Freigabe und kein Live-Deploy.

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

- 208 Unterrichtsslots im Jahresplan `kids/data/academy-year-52weeks-v1.json`, alle mit `lessonId` und Status `currently-in-catalog`.
- Slots 1–97 bleiben die früheren Pakete. Slots 98–208 stehen in `kids/akademie/curriculum-v38.js`, je drei Altersfassungen.
- 207 Module stehen im Archivkatalog und haben Fragen für 4–5, 6–8 und 9–10. `sidq` bleibt das separate Modul. 208 IDs sind 207 Katalogmodule plus `sidq`.
- Jede Altersfassung der Slots 98–208 enthält Lernziel, Unterrichtstext, Quellenhinweis, erklärte Begriffe, Alltag, Fragen mit Begründung, Übung, Zusammenfassung und deutschen Sprechtext. Lektion 98 ist gesondert ausformuliert. Die Lektionen 99–208 sprechen in den jüngeren Fassungen den gelesenen Sinn, die Situation und die Übung. Die Fassung 9–10 benennt, was die Seite nicht hergibt.
- 6 Slots tragen `target-hadith-checked-online`: 79, 82, 83, 84, 85, 86. Das sind ältere Dorar-Stichproben, in diesem Lauf nicht erneut geöffnet.
- 50 weitere Slots tragen nur geerbte Metadaten `metadata-in-repository-not-reverified`.
- 34 ältere Slots bleiben `not-reviewed`.
- Die Slots 91–208 tragen `primary-page-read-islamweb-2026-10-13`.
- Freigegebene Altersfassungen: 0 von 624. `religiousSourcesVerified` von Paket V38 steht auf false.
- Live-Deploy: nicht ausgeführt.
- Audioerzeugung: nicht ausgeführt. `kids/data/academy-voice-plan-v38.json` enthält 1521 ungenerierte deutsche Sprechtexte. `generateCreditsUsed` ist 0.

Die Slots 87–90 bleiben Entwürfe mit nicht erneut geprüfter Quellenmetadaten. Slots 98–208 bleiben Entwürfe aus gelesenen Ibn-Kaṯīr-Seiten, jetzt mit kindlicher Unterrichtssprache. Al-Mughnī wurde für die Fiqh-Stunden nicht gelesen. Lektion 98 verwendet zusätzlich die bereits gelesenen Stellen Qurʾān 16:90 und Qurʾān 49:10. „Du bist nicht schuld“ und der Weg zur vertrauten erwachsenen Person sind die Schutzregel der Stunde, kein eigener Verssatz.

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
- Der Ledger-Test zählt 208 implementierte Slots und weiter nur 6 ältere Dorar-Stichproben. Das ist keine Quellenfreigabe.
- `sidq` bleibt außerhalb des Katalogs: 208 IDs, 207 Katalogmodule.
- Technische Regressionstests dieses Laufs sind grün. Die Workflows auf GitHub wurden hier nicht erneut gestartet.
- Wissenschaftliche Freigabe ist nicht erteilt. Offene Punkte stehen in `NEXT_TASKS.md` und `FINAL_REPORT.md`.

## Nächster Schritt

Kein leerer Slot. Wiederaufnahme für eine unabhängige Prüfung: Lektion 98 `family-mobbing-erkennen-hilfe-holen`, danach der Reihe nach bis 208. Freigegebene Altersfassungen: 0 von 624. Dorar erneut lesen, wo es 403 gab; al-Mughnī für die Fiqh-Stunden; die 34 `not-reviewed` und 50 nur geerbten Metadaten. Kein Audio, kein Merge, kein Live-Deploy, bis das ausdrücklich freigegeben wird.
