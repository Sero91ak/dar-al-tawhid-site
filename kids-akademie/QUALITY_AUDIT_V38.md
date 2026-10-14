# Qualitätsprüfung KIDS AKADEMI – V38 (13.10.2026)

## Redaktioneller Fortschritt · 14. Oktober 2026

**Neue Quiz-Revisionen auf demselben Arbeitszweig:**
- `kids/akademie/curriculum-v39.js`: Slots **99–110**; zwölf vorbereitete Lektionen; **elf aktiv ergänzte Lektionen mit 88 Quizfragen** für die drei Altersgruppen. Die quellenbezogen nachgearbeitete, aber noch nicht wissenschaftlich freigegebene Fiqh-Lektion 106 bleibt aus V38 erhalten.
- `kids/akademie/curriculum-v40.js`: Slots **111–122**; ebenfalls elf aktive Lektionen und **88 Quizfragen**; Fiqh-Lektion 118 behält ihre gesondert mit klassischen Quellen nachgearbeiteten, weiterhin nicht wissenschaftlich freigegebenen V38-Fragen.
- `kids/akademie/curriculum-v41.js`: Slots **123–134**; elf aktive Lektionen mit weiteren **88 Quizfragen**; Fiqh-Lektion 130 behält ihre gesondert mit klassischen Quellen nachgearbeiteten, weiterhin nicht freigegebenen V38-Fragen.
- Alle drei Revisionen werden in `kids/akademie/index.html` nach V38 geladen. `curriculum-v38.js`, Qurʾān-Wortlaute, `sourceAudit`, bisherige Fortschrittspositionen und die Audio-Textpläne bleiben dabei unangetastet. Keine Audioerzeugung.
- Ergänzte Regressionstests: `kids/tools/test-academy-v39-quiz-v1.cjs`, `kids/tools/test-academy-v40-quiz-v1.cjs`, `kids/tools/test-academy-v41-quiz-v1.cjs`. Die Quiz-Überschreibungen wurden unabhängig in einer simulierten JavaScript-Laufzeit auf korrekte Lektions-IDs, alle drei Altersfassungen, Vollständigkeit der Fragen, korrekte Antwortindizes und unveränderte Freigabe-Metadaten geprüft. **CLI-/Browser-Tests wurden nicht ausgeführt**, da das GitHub-Repository hier nur über den Connector verfügbar war.
- **Nächster Quiz-Block:** Slots **135–146**. Danach 147–158 usw. Die 74 Slots **135–208** bleiben für die individuelle Quiz-Redaktion offen; Lektion 98 war ein Sonderfall, und ältere Slots 1–97 benötigen ebenfalls wissenschaftliche/fachliche Prüfung.
- **Freigabe:** 0/624; wissenschaftliche Quellenprüfung und individuelle Überarbeitung aller Unterrichts-Langtexte weiterhin offen.


## Umsetzung nach der ersten Befundaufnahme

Der oben dokumentierte **Ausgangszustand** wurde auf dem Arbeitszweig nachgebessert:
- V38: Altersbegrüßungen, sprechbare Erläuterungen und Fragen bereinigt; freigabe- und entwicklungsbezogene Prüfvermerke nicht mehr in den kinderseitig verwendeten Altersfeldern.
- V38: 110 Quizpakete thematisch neu gebunden; insgesamt 888 Fragen in 333 Altersentwürfen. 33 durch Redaktion leer gewordene Textzeilen ergänzt.
- Akademieansicht: der leere/ungeprüfte Hadith-Platzhalter wird bei Qurʾān-only-Lektionen versteckt, Quellenüberschrift und Schrittmarkierung angepasst.
- Sprechplan: 1.407 unique Textbausteine mit 2.109 Kontexteinträgen synchronisiert, weiterhin `reviewStatus=not-generated` und `generateCreditsUsed=0`.
- Reproduzierbarer Strict-Audit: `node kids/tools/audit-academy-visitor-copy-v1.cjs --strict`. Der Node-Lauf ist in dieser Sitzung **nicht ausgeführt** worden; die Datenstruktur wurde unabhängig anhand der GitHub-Dateien durchgerechnet.

Dies ist **eine technische und redaktionelle Bereinigung, keine wissenschaftliche Freigabe**. Die Ausgangsmängel in diesem Bericht sind als dokumentierte Vorher-Situation zu verstehen. Ausführliche, individuelle Langform-Unterrichtstexte, eindeutige Quellenzuordnung und klassische Fiqh-Nachweise bleiben zu überprüfen.



**Status:** Unabhängiger redaktioneller Repository-Audit; KEINE wissenschaftliche Freigabe, KEIN Live-Deploy, KEINE Audioerzeugung.

## Prüfgegenstand

- Arbeitszweig `cursor/kids-akademie-208-fa8f`, PR #1113, Ausgangscommit `8a527f69b0dd0219afe5fd1510114780a9711023`.
- Tatsächlich gelesen und programmatisch strukturell ausgewertet: `kids/akademie/curriculum-v38.js`, Objekt `additions`, 111 Einträge (Slots 98–208).
- Ergänzend gelesen: `kids-akademie/PROJECT_HANDOVER.md`, `FINAL_REPORT.md`, `NEXT_TASKS.md`, `LESSON_STATUS.json` und `research/SOURCE_REGISTRY.json`.

## Reproduzierbare Befunde

1. **Kindertext und interne Redaktionsnotiz werden vermischt (hoch):** Unter anderem enthalten die Altersfassungen der Lektion `tawhid-allah-hoert-bittgebete` die Sätze „Keine synthetische Rezitation“ und „Keine Freigabe für Besucher“. Die Fassung 9–10 nennt zudem „Eine wissenschaftliche Freigabe ist damit nicht ausgesprochen. Diese Stunde bleibt ein Entwurf.“ Ähnliche interne Formulierungen finden sich in `iman-quran-als-offenbarung` und weiteren V38-Lektionen. Das gehört in `sourceAudit` bzw. interne QA-Felder, nicht in `ageText.*.intro` oder sprechbare Unterrichtstexte. **Nicht einfach durch blindes globales Löschen ersetzen**, da Sinnzusammenhang und Kindersicherheit erhalten bleiben müssen.
2. **Wiederkehrende maschinelle Einleitungsschablonen (hoch):** In den jüngeren/mittleren Fassungen von 99–208 sind regelmäßig „Heute geht es um …“, „Wir lesen …“, „So kann das im Alltag aussehen …“, „Die Aufgabe …“, „Die Grenze der Stunde …“ enthalten; 9–10 nennt regelmäßig die technische URL und nicht für Kinder bestimmte Prüfhinweise. Für einen kindgerechten, liebevollen Unterricht individuell redigieren.
3. **Textumfang allein belegt keine fertige Lektion (hoch):** 110 Lektionen 99–208: Median der Einleitung `ageText['4-5'].intro` = 434 Zeichen (Minimum 299, Maximum 668), bei 6–8 = 915 Zeichen (749–1402), bei 9–10 = 1123 Zeichen (955–1608). Die Einleitungen sind ein Teil der Lektion, dennoch als Langform-Unterricht und Audiovorlage unzureichend geprüft. Einleitung, restliche Lernabschnitte, Fragen und Übungen gemeinsam bewerten.
4. **Lektion 98 ist ein stärker ausformulierter Sonderfall (positiv, aber nicht freigegeben):** `family-mobbing-erkennen-hilfe-holen` lehrt wiederholtes Hänseln erkennen, keine Schuld beim betroffenen Kind, vertrauenswürdige Erwachsene aufsuchen, keine gespielten Übergriffe. Es unterscheidet korrekt Unterrichts-Schutzregel von Qurʾān 49:11, 16:90, 49:10. Fachliche Prüfung und Absicherung der Schutzsprache bleiben ausstehend.
5. **Quellen-/Fiqh-Status weiterhin offen (hoch):** `approvedAgeVersions=0`, `approvedLessons=0`. 17 Fiqh-Slots sind in `NEXT_TASKS.md` zur klassischen hanbalitischen Prüfung markiert: 106, 118, 130, 142, 154, 166, 174, 180, 186, 192, 198, 201, 204, 205, 206, 207, 208. Zudem 34 ältere `not-reviewed`-Slots und 50 Slots mit nicht erneut geprüften Metadaten. `SOURCE_REGISTRY.json` umfasst laut Register 106 Quellenobjekte, darunter historische und nicht mehr erneut abgerufene Nachweise.
6. **Korrekte Zählweise beibehalten:** 208 Lektions-IDs / 207 Archivkatalogmodule plus separates `sidq`, 624 Alterszuordnungen; Verfügbarkeit ist nicht gleich Freigabe.

## Redaktionelle Vorgabe

- Alle Altersfassungen als **wirklichen Unterricht** verfassen: liebevolle kindgerechte Anrede, greifbare Erklärung von Qurʾān/Hadith/athar, nachvollziehbare Beispiele, freundliche Quizfragen mit Antworten, passende Aufgaben, islamisch angemessener Abschluss.
- Quellen-/Prüfmetadaten **nur intern** halten, nicht im Kindertext und nicht als TTS-Ausgabe. Das gilt ausdrücklich auch für 9–10 Jahre.
- Gesicherte Wortlaute, sinngemäße Erläuterung, Tafsīr, Unterrichtsdidaktik getrennt halten; keine ausgedachten Hadithnummern oder Fiqh-Urteile. Quellenprüfung bleibt eigenständiger Prozess.
- Prüfe nach Änderungen: Build-/Akademie-Regressionen, Vollständigkeit der 208 Slots, alte Fortschritts-IDs, Geschlechterprofile, tägliche Freischaltung, den `sidq`-Sonderfall sowie alle vorhandenen Audio-Textpläne **ohne Audio zu generieren**.

## Prioritäten und Wiederaufnahme

1. V38 durchgehend nach internen Freigabe-/QA-/Meta-Formulierungen in **allen sprechbaren Feldern** prüfen; danach von Slot 99 aufwärts pädagogisch redigieren. Slot 98 gesondert gegenprüfen.
2. Die 17 Fiqh-Stunden mit wirklich gelesenen Primärstellen und klassischen hanbalitischen Werken kontrollieren, geerbte/nicht geprüfte Quellen separat kennzeichnen.
3. Für jede tatsächlich vollständig geprüfte Lektion Prüfung, Quelle, Datum und offene Punkte in einer nachprüfbaren Auditliste erfassen. Nicht pauschal 624 Freigaben vergeben.
4. Bis zur ausdrücklichen Entscheidung: **kein Merge auf main, kein Deploy, keine Audioerzeugung, keine Kosten**.

Dieser Bericht beschreibt verifizierte Struktur- und Textbeobachtungen am Arbeitszweig; er ist weder eine Vollprüfung aller Qurʾānstellen noch eine religiöse Freigabe.
