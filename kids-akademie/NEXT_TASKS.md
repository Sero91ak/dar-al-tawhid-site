# Nächste Aufgaben

Keine neue Lektion als fertig zählen, bevor die Fundstelle gelesen und in `kids-akademie/research/SOURCE_REGISTRY.json` mit `verificationStatus` eingetragen ist.

1. Slots 91–94 stehen als Entwürfe in `kids/akademie/curriculum-v36.js`, mit drei Altersfassungen, ohne Audio und ohne Freigabe. Offen daran: Dorar und al-Maktaba HTTP 403, Hadithnummer von Artikel 76979, Hadithnummer auf der Manār-Seite zu 5:6, Maß des Kopfstreichens, al-Mughnī dazu nicht gelesen. Entschuldigung, Hilfeholen bei einer erwachsenen Person und das Nennen einer Gabe sind Übungen.
2. Slots 95–97 stehen als Entwürfe in `kids/akademie/curriculum-v37.js`. Sūrat an-Nās ist vollständig von der Tafsīr-Seite gelesen. Bei 20:45–46 und 20:114 steht auf der jeweiligen Seite kein Hadith; es wurde keiner ergänzt. Keine synthetische Rezitation.
3. Slot 98, Woche 25, Montag, `family`, „Mobbing erkennen und Hilfe holen“. Nächste Lektion. Eine Fundstelle zu Schaden durch Wort oder Hand erst lesen, dann schreiben.
4. Slots 99–102 stehen im Ledger mit Themen, aber ohne ID: Allah hört Bittgebete; Qurʾān als Offenbarung; nicht mit guten Taten prahlen; Verzeihen und Grenzen. Dieselbe Reihenfolge, jeweils ein Quellenpaket vor dem Text. Slot 99 kann Qurʾān 2:186 von der schon gesehenen Ibn-Kaṯīr-Seite Inhalt 49/166 verwenden, sobald die Lektion geschrieben wird; der Hadith dazu ist noch nicht gelesen.
5. Slots 87–90 (`aqidah-allahs-barmherzigkeit-hoffen`, `aqidah-glauben-an-offenbarte-buecher`, `ikhlas-lob-bescheiden-annehmen`, `akhlaq-grosszuegig-freiwillig-teilen`) haben Entwürfe in `kids/akademie/curriculum-v35.js`, aber nur `metadata-in-repository-not-reverified`. Die dort genannten Nummern erneut gegen den arabischen Text lesen, bevor sie als geprüft gelten.
6. `sidq` gegen die Originaldatei prüfen, nicht durch ein leeres Objekt ersetzen. Die Differenz 90 IDs zu 89 Modulen ist dieses Sonderobjekt. Nach V36 und V37: 97 IDs und 96 Katalogmodule.
7. Nach jedem Paket von höchstens 20 Lektionen: `node kids/tools/build-akademie-handover-status-v1.cjs` und `node kids/tools/test-academy-208-research-ledger-v1.cjs` ausführen, dann `PROJECT_HANDOVER.md` an den neuen Commit anpassen.
