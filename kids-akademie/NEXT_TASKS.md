# Nächste Aufgaben

Keine neue Lektion als fertig zählen, bevor die Fundstelle gelesen und in `kids-akademie/research/SOURCE_REGISTRY.json` mit `verificationStatus` eingetragen ist.

1. Slot 91, Woche 23, Donnerstag, Säule `adab`, Thema „Danke und Entschuldigung sagen“. Dateien: `kids/data/academy-year-52weeks-v1.json` hat noch keine `lessonId`. Eine ID nur vergeben, wenn der Text im nächsten Curriculum-Paket `kids/akademie/curriculum-v36.js` wirklich angelegt wird. Quelle fehlt. Nächster Schritt: eine passende Stelle zu Dank oder Entschuldigung in Buḫārī oder Muslim lesen und als `SRC-` Eintrag speichern, danach drei eigene Altersfassungen.
2. Slot 92, Woche 23, Freitag, `tarbiyah`, „Bei Problemen Hilfe holen“. Dieselbe Lücke. Kinderschutz nicht als bloßes Versöhnungsthema behandeln.
3. Slot 93, Woche 24, Montag, `nafs`, „Dankbarkeit im Herzen“. Quelle fehlt.
4. Slot 94, Woche 24, Dienstag, `fiqh`, „Wuḍūʾ: Waschen und Streichen unterscheiden“. Hanbalitische Stelle in al-Mughnī lesen. Die vorhandene Islamweb-Notiz `SRC-NOTE-MUGHNI-NIYYAH` gilt nur für die Absicht und darf hier nicht wiederverwendet werden.
5. Slot 95, Woche 24, Donnerstag, `quran`, „Sūrat an-Nās kennenlernen“. Versgrenzen aus dem arabischen Text nehmen. Keine synthetische Rezitation.
6. Slots 96–102 stehen im Ledger mit Themen, aber ohne ID: Mūsā und Mut; Duʿāʾ vor dem Lernen; Mobbing und Hilfe; Allah hört Bittgebete; Qurʾān als Offenbarung; nicht mit guten Taten prahlen; Verzeihen und Grenzen. Dieselbe Reihenfolge, jeweils ein Quellenpaket vor dem Text.
7. Slots 87–90 (`aqidah-allahs-barmherzigkeit-hoffen`, `aqidah-glauben-an-offenbarte-buecher`, `ikhlas-lob-bescheiden-annehmen`, `akhlaq-grosszuegig-freiwillig-teilen`) haben Entwürfe in `kids/akademie/curriculum-v35.js`, aber nur `metadata-in-repository-not-reverified`. Die dort genannten Nummern erneut gegen den arabischen Text lesen, bevor sie als geprüft gelten.
8. `sidq` gegen die Originaldatei prüfen, nicht durch ein leeres Objekt ersetzen. Pfad laut Ledger: Sonderobjekt außerhalb der 89 Archivmodule.
9. Nach jedem Paket von höchstens 20 Lektionen: `node kids/tools/build-akademie-handover-status-v1.cjs` und `node kids/tools/test-academy-208-research-ledger-v1.cjs` ausführen, dann `PROJECT_HANDOVER.md` an den neuen Commit anpassen.
