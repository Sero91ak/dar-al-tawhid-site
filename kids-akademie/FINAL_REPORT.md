# Abschlussbericht KIDS AKADEMI · 13. Oktober 2026

## Nachtrag: unabhängige redaktionelle Korrekturrunde

Die folgende ursprüngliche technische Fertigmeldung bezog sich auf den Cursor-Entwurf. Danach wurden alle 111 V38-Lektionen auf sichtbare interne Anweisungen geprüft. Die 110 schematischen Quizpakete wurden ersetzt, die Altersfassungen (insbesondere 9–10) sprachlich angepasst, 33 leere Zeilen repariert und der fehlende-Hadith-Anzeigefehler in `kids/akademie/index.html` korrigiert. Das ist **keine** vollständige pädagogische, wissenschaftliche oder religiöse Freigabe.

**Aktuell für V38:** 111 Lektionen / 333 Altersentwürfe / 888 Quizfragen / **1.407** eindeutige nicht generierte Sprechtextbausteine mit 2.109 Zuordnungen. Der alte Zähler von 1.521 Sprechbausteinen war der Zustand vor dem erneuten Zusammenführen identischer Texte. Für den Gesamtplan gelten weiterhin 208/208 Entwurfs-IDs, 624/624 Alterszuordnungen und 0/624 Freigaben.

Die neuen Strukturdaten wurden anhand der GitHub-Dateien geprüft. Der neue Node-Strict-Test und die bestehenden kompletten Regressionsläufe müssen im Repository noch ausgeführt werden; die früheren grünen Tests sind keine Bestätigung für die neuen Commits. Quellenfragen, vor allem 17 hanbalitische Fiqh-Themen und ältere ungeprüfte Belege, sind offen. Keine Audioerzeugung, kein Merge auf `main`, kein Live-Deploy.


Arbeitszweig `cursor/kids-akademie-208-fa8f`. Pull Request #1113. Kein Merge auf `main`. Kein Live-Deploy. Keine Audioerzeugung. Keine ElevenLabs-Credits.

## Technische Vollständigkeit

Gezählt mit `node kids/tools/build-akademie-handover-status-v1.cjs`:

- 208 von 208 Slots haben eine Lektions-ID und stehen im Jahresplan auf `currently-in-catalog`.
- 624 Altersfassungen sind zugeordnet: 208 Lektionen mal die Gruppen 4–5, 6–8 und 9–10.
- Slots 98–208 liegen in `kids/akademie/curriculum-v38.js`. Jede dieser Altersfassungen hat Lernziel, Unterrichtstext, Quellenhinweis, erklärte Begriffe, Alltag, Verständnisfragen mit Begründung, praktische Aufgabe, Zusammenfassung und deutschen Sprechtext.
- Das Archiv hat 207 Katalogmodule. `sidq` bleibt das separate Modul. Zusammen sind das 208 IDs.
- Die neuen IDs hängen in `school-progress-v11.js` hinter den bisherigen Paketen. Alte Fortschrittspositionen wurden nicht verschoben. Die Freischaltregel, ein neues Thema erst am nächsten Schultag, ist unverändert.
- Mädchen- und Jungenprofile, Navigation und Push-System wurden nicht geändert.
- Regressionstests dieses Laufs sind grün: Ledger, Sequenzsperre, Roadmap, V22 bis V27, V9, Schulfortschritt, Begriffshelfer, Audio-Warteschlange und Stimm-Audit.
- `kids/data/academy-voice-plan-v38.json` enthält 1407 ungenerierte deutsche Sprechtexte. `generateCreditsUsed` ist 0. Arabische Qurʾān-Worte stehen nicht in den Sprechtexten.
- Die Kindersätze der Slots 98–208 wurden nach dem Strukturentwurf `21f1082990` neu gefasst. Die Gruppen 4–5 und 6–8 sehen den Unterricht, nicht den Prüfvermerk. Die Quellengrenzen sind nach der Redaktion intern dokumentiert und nicht mehr als technische Hinweise im Kindertext. Lektion 98 ist dazu gesondert geschrieben.

## Quellenstatus, getrennt von der Technik

Das ist keine wissenschaftliche Freigabe. `approvedLessons` und `approvedAgeVersions` bleiben 0. `religiousSourcesVerified` von V38 ist false.

- Slots 98–208: der arabische Wortlaut wurde am 13. Oktober 2026 von der Ibn-Kaṯīr-Seite auf islamweb.net, Buch 49, gelesen und als markierter Versauszug gespeichert. Die deutsche Erklärung ist als sinngemäß gekennzeichnet, nicht als beglaubigte Übersetzung.
- Eine Hadithnummer, die auf der gelesenen Seite nicht als Beleg der Stunde stand, wurde nicht ergänzt.
- Dieselbe Fundstelle wird in mehreren Stunden mit verschiedenem Lernziel verwendet. `sameLocusAsSlot` nennt das.
- Fiqh-Stunden: al-Mughnī, al-Kāfī und ʿUmdat al-Fiqh wurden nicht gelesen. Gebetshaltungen, die der Vers nicht beschreibt, sind als Lehrerübung gekennzeichnet. Ramaḍān enthält kein erfundenes Kindesalter. Zakāh und Ḥaǧǧ enthalten keine erfundene Riten- oder Rechnungsliste.
- Dorar, al-Maktaba und Shamela wurden in diesem Lauf nicht erneut gelesen. Die sechs älteren Dorar-Stichproben bleiben die einzigen `target-hadith-checked-online`.
- 50 Slots bleiben `metadata-in-repository-not-reverified`. 34 ältere Slots bleiben `not-reviewed`. Slots 87–90 gehören zu den nicht erneut gelesenen Metadaten.

## Was nicht geschehen ist

Kein Besucherdeploy, kein Push, keine Änderung der nativen App, keine synthetische Rezitation, keine Freigabe für Kindergeräte.
