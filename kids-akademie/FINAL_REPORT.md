# Abschlussbericht KIDS AKADEMI · 13. Oktober 2026

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
- `kids/data/academy-voice-plan-v38.json` enthält 1513 ungenerierte deutsche Sprechtexte. `generateCreditsUsed` ist 0. Arabische Qurʾān-Worte stehen nicht in den Sprechtexten.

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
