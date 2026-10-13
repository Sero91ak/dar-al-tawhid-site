# Architektur der KIDS AKADEMI

## V38-Redaktions- und Sperrregel

Bei Lektionen ohne tatsächlich übernommene Hadith-Überlieferung versteckt `kids/akademie/index.html` den Hadith-Quellenblock. Der Mangel an einer Nummer ist **keine** Kindererzählung und gehört in `sourceAudit`/Quellenregister, nicht in die sichtbaren Unterrichtssätze. Die Altersvarianten `ageText` und der Textplan `kids/data/academy-voice-plan-v38.json` müssen konsistent bleiben. Der Plan enthält aktuell **1.407** einzigartige deutsche Textbausteine und 2.109 Kontextverwendungen, alle unvertont. `religiousSourcesVerified` und `voiceRecordingsApproved` bleiben false.

Audit vor irgendeiner Freigabe: `node kids/tools/audit-academy-visitor-copy-v1.cjs --strict` und sämtliche vorhandenen Akademie-Regressionen. Das Prüfskript kontrolliert sensible sichtbare Felder, 111 V38-Lektionen, Altersfragen, die Textplan-Referenzen und den Anzeigeschutz. Die spätere Fachprüfung bleibt unabhängig vom Code-Audit.



Es gibt bereits eine Unterrichtsstruktur. Neue Lektionen gehören dort hinein, nicht in ein zweites System.

## Daten

- Jahresplan: `kids/data/academy-year-52weeks-v1.json`. Montag, Dienstag, Donnerstag und Freitag sind neue Themen. Mittwoch und Samstag sind Wiederholung. Sonntag ist frei. 208 Slots.
- Ledger: `kids/research/academy-208-research-ledger-v1.json`.
- Quellenbank: `kids/data/academy-source-bank-researched-v1.json`.
- Register der 208 Slots ohne neue Belege: `kids/data/academy-source-register-208-v1.json`.
- Archiv-Schnappschuss: `kids/unterrichtsarchiv.html`, Objekt `ARCHIVE_SNAPSHOT.catalog`.
- Curriculum-Module: `kids/akademie/curriculum-v1.js`, `curriculum-v2.js`, `curriculum-v22.js` und `curriculum-v25.js` bis `curriculum-v38.js`. Jedes spätere Paket hängt sich an `window.DARKidsAcademyCurriculum`, wenn die vorausgesetzte Lektion schon da ist. V38 hängt an `dua-vor-dem-lernen-um-hilfe-bitten` und enthält die Slots 98–208.
- Fortschritt: `kids/akademie/school-progress-v11.js`. Eine unfertige Lektion pro Profil und Alter. Neue geprüfte Pakete werden hinten angehängt, damit alte Fortschrittsnummern nicht verrutschen. Kein Cloud-Sync.

## Altersfassungen

Im Archiv liegen bei 207 Modulen Fragen unter `questions["4-5"]`, `questions["6-8"]` und `questions["9-10"]`. Das Ledger zählt 174 ausdrücklich strukturierte Altersvarianten. Beides ist Entwurf, nicht Freigabe. 624 Altersfassungen sind im Jahresplan vorhanden; freigegeben ist keine. Die Differenz zwischen Lektions-IDs und Katalogmodulen ist `sidq`: ein Sonderobjekt außerhalb des Katalogs. Nach V38 sind das 208 IDs und 207 Module.

## Tests, die zu diesem Bestand gehören

- `kids/tools/test-academy-208-research-ledger-v1.cjs`
- `kids/tools/build-akademie-handover-status-v1.cjs` erzeugt `kids-akademie/LESSON_STATUS.json` und bricht ab, wenn nicht 208 Slots, 208 Lektions-IDs und 0 leere Umrisse herauskommen.
- Weitere Akademie-Tests unter `kids/tools/test-academy-v2*.cjs` und `scripts/test-kids-academy-*.js`. Test-App-Dateien gehören in den eigenen Zweig von Pull Request #1090.

## Gesperrt

Besucher-App, Push, Profile, Mädchen- und Jungen-Themes, bestehende Freischaltsperren, historische Fortschritte und die Tab-Leiste bleiben unverändert. Kein Merge auf `main`, kein Live-Deploy, keine ElevenLabs-Erzeugung.
