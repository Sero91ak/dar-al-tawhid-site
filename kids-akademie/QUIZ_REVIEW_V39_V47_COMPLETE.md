# KIDS AKADEMI – Abschluss der Nicht-Fiqh-Quizredaktion · 14.10.2026

**Arbeitszweig:** `cursor/kids-akademie-208-fa8f`; Pull Request #1113. Ausschließlich Entwurfszweig. **Kein Merge auf `main`, kein Live-Deploy, keine Audioerzeugung, keine ElevenLabs-Credits.**

## Ergebnis

Die neuen Module `kids/akademie/curriculum-v42.js` bis `curriculum-v47.js` ergänzen die bereits vorhandenen V39–V41-Quizüberarbeitungen. **Alle 93 Nicht-Fiqh-Lektionen der Slots 99–208** verfügen damit im aktiven Entwurfs-Curriculum über individuell formulierte, altersbezogene Quizfragen. Lektion 98 war bereits separat ausgearbeitet.

| Modul | Slots | Nicht-Fiqh-Lektionen | Fragen |
|---|---|---:|---:|
| V39–V41 (vorhanden) | 99–134 | 33 | 264 |
| V42 | 135–141, 143–146 | 11 | 88 |
| V43 | 147–153, 155–158 | 11 | 88 |
| V44 | 159–165, 167–170 | 11 | 88 |
| V45 | 171–173, 175–179, 181–182 | 10 | 80 |
| V46 | 183–185, 187–191, 193–194 | 10 | 80 |
| V47 | 195–197, 199–200, 202–203 | 7 | 56 |
| **Zusammen** | **99–203 ohne Fiqh** | **93** | **744** |

**Dieser neue Arbeitslauf allein:** V42–V47 = **60 Lektionen / 180 Alters-Quizfassungen / 480 Quizfragen**. Pro Lektion erhalten 4–5-Jährige zwei Entscheidungsfragen, 6–8-Jährige zwei Entscheidungs- und eine Textfrage und 9–10-Jährige eine Entscheidungs- und zwei Textfragen.

Die 17 vorgegebenen Fiqh-Lektionen **106, 118, 130, 142, 154, 166, 174, 180, 186, 192, 198, 201, 204, 205, 206, 207 und 208** werden absichtlich nicht durch allgemeine Quizmodule überschrieben: Bei ihnen hat die fachliche Quellenprüfung Priorität, teilweise sind bereits eigens bearbeitete Fiqh-Fragen vorhanden.

## Technische Kontrolle

Aktuelle Originaldateien wurden aus GitHub gelesen und in isolierter JavaScript-Ausführung in realer Reihenfolge V38–V47 geladen.

- Sämtliche Module V39–V47 ließen sich fehlerfrei ausführen.
- **111/111 neue Curriculum-Einträge erhalten**, **60 eindeutige V42–V47-IDs** und **480 neue Fragen**.
- Alle Qurʾān-Daten, `sourceAudit`-Objekte, `ageText` und `audioScript` blieben durch V42–V47 referenziell unverändert; keine der neun in den neuen Paketen übersprungenen Fiqh-Lektionen wurde überschrieben.
- Alle sechs Module bleiben auf `approvedAgeVersions:0`, `religiousSourcesVerified:false`, `voiceRecordingsApproved:false`.
- `kids/akademie/index.html` bindet die Versionen in korrekter Reihenfolge ein.
- Neuer lokaler Node-Test als Datei: `kids/tools/test-academy-v47-quiz-v1.cjs`. Zuvor weitere Tests v42, v43, v44 angelegt.

**Einschränkung:** Ein vollständig gestarteter Node-Prozess im echten Projekt, visuelle Browserprüfungen und eine unabhängige Prüfung aller religiösen Originalbelege wurden in diesem Arbeitslauf **nicht** durchgeführt. Das ist eine redaktionelle Quizüberarbeitung, **keine Endfreigabe**.

## Nächste Arbeit

1. Die 17 Fiqh-Lektionen weiter anhand tatsächlich eingesehener klassischer hanbalitischer Quellen prüfen; für 204–208 fehlt besonders viel.
2. Die eigentlichen Unterrichtstexte `ageText` für 99–208 auf Tiefe, sprachliche Individualität, Quellenklarheit und Kindersicherheit **einzeln** redigieren. Gute Quizfragen allein bedeuten noch keinen fertig überprüften Unterricht.
3. Alte 34 `not-reviewed`-Quellenfälle und 50 nur geerbte Metadaten nachprüfen.
4. Tatsächlichen Node-/Browser-Regressionstest, Fortschrittsprüfung und QA der Quizdarstellung durchführen. `sidq` separat lassen.
5. Erst danach menschliche wissenschaftliche/pädagogische Freigabe; bis dahin **0 von 624** freigegeben.

Wichtig für andere Bearbeiter: vor jeder Änderung den neuen Zweigkopf lesen; parallel bestehende Fiqh-Korrekturen und Qualitätsdokumente nicht überschreiben.
