# Nächste Aufgaben

Keine neue Lektion als fertig zählen, bevor die Fundstelle gelesen und in `kids-akademie/research/SOURCE_REGISTRY.json` mit `verificationStatus` eingetragen ist.

1. Slots 91–94 stehen als Entwürfe in `kids/akademie/curriculum-v36.js`, mit drei Altersfassungen, ohne Audio und ohne Freigabe. Offen daran: Dorar und al-Maktaba HTTP 403, Hadithnummer von Artikel 76979, Hadithnummer auf der Manār-Seite zu 5:6, Maß des Kopfstreichens, al-Mughnī dazu nicht gelesen. Entschuldigung, Hilfeholen bei einer erwachsenen Person und das Nennen einer Gabe sind Übungen.
2. Slot 95, Woche 24, Donnerstag, `quran`, „Sūrat an-Nās kennenlernen“. Versgrenzen aus dem arabischen Text nehmen. Keine synthetische Rezitation. Nächstes Curriculum-Paket erst nach gelesener Seite.
6. Slots 96–102 stehen im Ledger mit Themen, aber ohne ID: Mūsā und Mut; Duʿāʾ vor dem Lernen; Mobbing und Hilfe; Allah hört Bittgebete; Qurʾān als Offenbarung; nicht mit guten Taten prahlen; Verzeihen und Grenzen. Dieselbe Reihenfolge, jeweils ein Quellenpaket vor dem Text.
7. Slots 87–90 (`aqidah-allahs-barmherzigkeit-hoffen`, `aqidah-glauben-an-offenbarte-buecher`, `ikhlas-lob-bescheiden-annehmen`, `akhlaq-grosszuegig-freiwillig-teilen`) haben Entwürfe in `kids/akademie/curriculum-v35.js`, aber nur `metadata-in-repository-not-reverified`. Die dort genannten Nummern erneut gegen den arabischen Text lesen, bevor sie als geprüft gelten.
8. `sidq` gegen die Originaldatei prüfen, nicht durch ein leeres Objekt ersetzen. Pfad laut Ledger: Sonderobjekt außerhalb des Archivkatalogs. Die frühere Differenz 90 IDs zu 89 Modulen ist diese Ausnahme. Nach V36: 94 IDs und 93 Katalogmodule.
9. Nach jedem Paket von höchstens 20 Lektionen: `node kids/tools/build-akademie-handover-status-v1.cjs` und `node kids/tools/test-academy-208-research-ledger-v1.cjs` ausführen, dann `PROJECT_HANDOVER.md` an den neuen Commit anpassen.
