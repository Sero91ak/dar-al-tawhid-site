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
- 90 Slots haben eine `lessonId` (Slots 1–90).
- 118 Slots (91–208) haben Thema und Altersziel im Ledger, aber keine Lektions-ID und keinen Unterrichtstext.
- 89 Module stehen im Archivkatalog und haben Fragen für 4–5, 6–8 und 9–10. Das ist keine religiöse Freigabe.
- `sidq` ist ein separates Modul und fehlt im 89er-Katalog.
- 6 Slots tragen `target-hadith-checked-online`: 79, 82, 83, 84, 85, 86.
- 50 weitere Slots tragen nur geerbte Metadaten `metadata-in-repository-not-reverified`.
- 152 Slots sind `not-reviewed`.
- Freigegebene Altersfassungen: 0 von 624.
- Live-Deploy: nicht ausgeführt.
- Audioerzeugung in diesem Lauf: nicht ausgeführt.

Die frühere Angabe „66 auf main, Arbeit bis 86“ ist damit nur teilweise bestätigt: Auf diesem Zweig sind 90 IDs vergeben, die Slots 87–90 sind Entwürfe mit nicht erneut geprüfter Quellenmetadaten, und Slot 91 ist der erste leere Slot.

## Pull Requests

- #1089, Zweig `kids/lessons-67-70-20261012`, Basis `main`, offen. Unterricht 67–90 und Masterauftrag.
- #1090, Zweig `test/kids-curriculum-70-synchronization`, Basis `main`, offen. Nur Test-App-Prüfdateien. Nicht mit Kinderdateien vermischen.

## Letzte abgeschlossene Arbeit in diesem Lauf

Bestandsaufnahme, Statusdatei, Quellenregister aus dem vorhandenen Quellenbank-Bestand, Methodik, Prüfprotokoll, Architektur und die nächsten Aufgaben. Keine neue Lektion 91–208 geschrieben, weil dafür keine neu geprüfte Fundstelle vorlag. Dorar lieferte bei einem Abruf HTTP 403, deshalb wurde keine Seite als erneut gelesen markiert.

## Bekannte Fehler

- Ältere `sourceAudit`-Daten im Curriculum sind geerbt. Sie sind keine neue Prüfung.
- Der Ledger-Test `kids/tools/test-academy-208-research-ledger-v1.cjs` erwartet 90 implementierte Slots und 6 Stichproben. Er ist in diesem Lauf grün. Das ist keine Quellenfreigabe.
- CI von #1089 und #1090 war beim letzten festgehaltenen Status nicht vollständig grün. Dieser Lauf hat die Workflows nicht erneut ausgeführt.
- `FINAL_REPORT.md` existiert absichtlich nicht. Der Produktionsabschluss ist nicht erreicht.

## Nächster Schritt

Slot 91, Woche 23, Donnerstag, Thema „Danke und Entschuldigung sagen“, Säule `adab`. Zuerst eine Lektions-ID im bestehenden Jahresplan vergeben, dann eine Fundstelle in `SOURCE_REGISTRY.json` prüfen, danach drei eigene Altersfassungen im bestehenden Curriculum-Muster anhängen. Nicht als fertig markieren, bevor die Fundstelle gelesen ist.
