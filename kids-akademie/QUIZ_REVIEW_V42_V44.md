# KIDS AKADEMI – Quizredaktion V42 bis V44 · 14. Oktober 2026

**Arbeitszweig:** `cursor/kids-akademie-208-fa8f`, PR #1113. **Kein Merge, kein Live-Deploy, keine Audioerzeugung.**

## Umgesetzte Pakete

| Modul | Slots | Lektionen | Drei Altersgruppen | Quizfragen |
| --- | --- | ---: | ---: | ---: |
| V42 | 135–141, 143–146 | 11 | 33 | 88 |
| V43 | 147–153, 155–158 | 11 | 33 | 88 |
| V44 | 159–165, 167–170 | 11 | 33 | 88 |
| **Gesamt neu** | **135–170 außer 142, 154, 166** | **33** | **99** | **264** |

Die ausgelassenen Fiqh-Lektionen **142, 154 und 166** behalten ihre gesondert quellenbearbeiteten Quizfragen. Kein Qurʾān-Wortlaut, keine Lektions-ID, `ageText`-Fassung, `audioScript`, `sourceAudit`, Fortschrittsnummer oder Freigabestatus wurde durch die Quizmodule verändert.

Die Module sind in `kids/akademie/index.html` nach V38, V39, V40 und V41 in der Reihenfolge **V42 → V43 → V44** eingebunden.

## Bearbeitungsprinzip

Jede Lektion erhielt:
- **4–5:** zwei einfache, thematisch konkrete Entscheidungsfragen;
- **6–8:** zwei konkrete Auswahlfragen plus eine praktische Antwortfrage;
- **9–10:** zwei Verständnis-/Quellenabgrenzungsfragen plus eine Auswahlfrage.

Hinweise und Rückmeldungen sind kindgerecht mit islamischen Lobformulierungen versehen. Quellen und erfundene Unterrichtsübungen werden getrennt; keine nachträglich erfundenen Hadithnummern. Wichtige Sicherheitsthemen (Schuldzuweisung, überfordernde Aufgaben, öffentliche Bloßstellung und Zwang zur Versöhnung) wurden vorsichtig formuliert.

## Technische Prüfung

- Die tatsächlichen GitHub-Dateien `curriculum-v38.js` bis `curriculum-v44.js` wurden durch eine isolierte JavaScript-Auswertung in der richtigen Reihenfolge geladen: **alle Module V39–V44 erfolgreich**.
- Weiterhin **111 V38-Lektionen**, alle 264 neuen Quizfragen erreichbar, Quellenobjekte `quran` und `sourceAudit` unverändert, gesondert bearbeitete Fiqh-Lektionen 142/154/166 unangetastet.
- Eigene Node-Testskripte angelegt: `kids/tools/test-academy-v42-quiz-v1.cjs`, `test-academy-v43-quiz-v1.cjs` und `test-academy-v44-quiz-v1.cjs`.

**Nicht behaupten:** vollständiger Node-Testlauf, Browser-QA oder wissenschaftliche Originalquellen-Freigabe. Die unabhängige Quellenprüfung bleibt offen. `approvedAgeVersions` bleibt 0.

## Wiederaufnahme

Als Nächstes die verbleibenden Quizlektionen **171–208** redaktionell überarbeiten, **gesondert geprüfte Fiqh-Lektionen 174, 180, 186, 192, 198, 201, 204–208** nicht ohne Quellenkontrolle überschreiben. Danach jedes Untermodul und den kompletten Unterrichtsablauf in einem echten Node-/Browser-Test prüfen. Es besteht weiterhin wesentlicher Überarbeitungsbedarf der Unterrichtstexte, nicht nur der Quizfragen.
