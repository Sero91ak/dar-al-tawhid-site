# Architektur der KIDS AKADEMI

Es gibt bereits eine Unterrichtsstruktur. Neue Lektionen gehören dort hinein, nicht in ein zweites System.

## Daten

- Jahresplan: `kids/data/academy-year-52weeks-v1.json`. Montag, Dienstag, Donnerstag und Freitag sind neue Themen. Mittwoch und Samstag sind Wiederholung. Sonntag ist frei. 208 Slots.
- Ledger: `kids/research/academy-208-research-ledger-v1.json`.
- Quellenbank: `kids/data/academy-source-bank-researched-v1.json`.
- Register der 208 Slots ohne neue Belege: `kids/data/academy-source-register-208-v1.json`.
- Archiv-Schnappschuss: `kids/unterrichtsarchiv.html`, Objekt `ARCHIVE_SNAPSHOT.catalog`.
- Curriculum-Module: `kids/akademie/curriculum-v1.js` und `curriculum-v22.js` bis `curriculum-v35.js`. Jedes spätere Paket hängt sich an `window.DARKidsAcademyCurriculum`, wenn die vorausgesetzte Lektion schon da ist.
- Fortschritt: `kids/akademie/school-progress-v11.js`. Eine unfertige Lektion pro Profil und Alter. Neue geprüfte Pakete werden hinten angehängt, damit alte Fortschrittsnummern nicht verrutschen. Kein Cloud-Sync.

## Altersfassungen

Im Archiv liegen bei 93 Modulen Fragen unter `questions["4-5"]`, `questions["6-8"]` und `questions["9-10"]`. Das Ledger zählt davon getrennt 60 ausdrücklichere Altersvarianten. Beides ist Entwurf, nicht Freigabe. 624 freigegebene Fassungen existieren nicht. Die Differenz zwischen Lektions-IDs und Katalogmodulen ist `sidq`: ein Sonderobjekt außerhalb des Katalogs. Vor Paket V36 waren das 90 IDs und 89 Module, danach 94 IDs und 93 Module.

## Tests, die zu diesem Bestand gehören

- `kids/tools/test-academy-208-research-ledger-v1.cjs`
- `kids/tools/build-akademie-handover-status-v1.cjs` erzeugt `kids-akademie/LESSON_STATUS.json` und bricht ab, wenn nicht 208, 94 und 114 herauskommen. Diese Schwelle muss beim nächsten Paket mitgezogen werden.
- Weitere Akademie-Tests unter `kids/tools/test-academy-v2*.cjs` und `scripts/test-kids-academy-*.js`. Test-App-Dateien gehören in den eigenen Zweig von Pull Request #1090.

## Gesperrt

Besucher-App, Push, Profile, Mädchen- und Jungen-Themes, bestehende Freischaltsperren, historische Fortschritte und die Tab-Leiste bleiben unverändert. Kein Merge auf `main`, kein Live-Deploy, keine ElevenLabs-Erzeugung.
