# DĀR AL TAWḤĪD KIDS AKADEMI – Redaktionsabschluss der 208 Unterrichtsthemen

**14.10.2026 · interner GitHub-Arbeitszweig `chatgpt/kids-akademie-155-158-20261014` · Draft-PR #1142**  
**Wichtig: redaktionell komplett ≠ wissenschaftlich freigegeben ≠ öffentlich veröffentlicht.**

## Gesamtstand

| Bestandteil | Status |
|---|---|
| Jahresplan | 52 Wochen × 4 Unterrichtsthemen = **208 eindeutige Lektionen** |
| Altersfassungen | 4–5, 6–8, 9–10 Jahre × 208 = **624 angelegte Altersversionen** |
| Individuelle Redaktionsrunde 119–208 | Bis **208** durchgeführt, jüngste 54 Slots 155–208 in 14 aktiven JS-Modulen |
| Neu redigierte Altersversionen 155–208 | **162** |
| Vorbereitete Sprechtextkontexte 155–208 | **1.026 text-only**, **0 TTS-Credits** |
| Wissenschaftliche Endfreigabe | Projektweit weiterhin **0/624** |
| Live-Release / Merge nach `main` | **Nicht erfolgt** |
| Browser-/Node-/CI-Gesamtlauf | **Noch auszuführen** |
| Audio / synthetische Qurʾān-Rezitation | **Nicht erzeugt** |

## Aktive Unterrichts-Ladefolge

`curriculum-editorial-154-v1.js` → `155-158` → `159-162` → `163-166` → `167-170` → `171-174` → `175-178` → `179-182` → `183-186` → `187-190` → `191-194` → `195-198` → `199-202` → **`203-205` → `206-208`**.

**Warnung:** Die nicht aktive Datei `curriculum-editorial-203-206-v1.js` und ihr Text-Voice-Delta existieren zusätzlich aus einem parallelen Arbeitslauf. **Nicht gleichzeitig** mit den aktiven `203-205` / `206-208`-Dateien einbinden oder in einen kanonischen Sprachplan übernehmen. Sonst wird Lektion 206 doppelt definiert und der Audio-Import uneindeutig.

## Tatsächliche Integritätsprüfungen

- **14 aktive Modulfassungen** 155–208 wurden in einer isolierten JavaScript-Laufzeit **nacheinander erfolgreich ausgeführt**.
- **54/54 eindeutige Lektions-IDs**, **162/162 eigenständige Altersfassungen**, **216/216 Laufzeitprüfungen erfolgreich** (Lektionsgrunddaten erhalten, Texte vorhanden, vorzeitige Freigabe verhindert).
- Für **alle 14 aktiven Voice-Deltas** wurde der Textvergleich zur aktiven Unterrichtsfassung separat kontrolliert: **162/162 Altersfassungen konsistent**, **1.026** unvertonten Text-Kontexte, keine gefundenen Text-/Audio-Mismatches.
- Alle 14 aktiven Script-Tags erscheinen **einmalig und in richtiger Reihenfolge**. Der letzte Abschnitt 203–205 / 206–208 wurde gesondert mit **35/35 Laufzeit- und Kontextprüfungen** kontrolliert.
- In aktiven Kindertexten wurden keine sichtbaren Schlüssel `scientificApproval`, `fiqhHumanReviewNeeded`, `sourceAudit`, `Masterstimme` oder `Keine Freigabe für Besucher` gefunden. Das bisherige einzelne Quellenfeld aus 174 wurde korrigiert.
- **Reproduzierbarer, neu gespeicherter Node-Regressionstest:** `node kids/tools/test-academy-editorial-155-208-integrity-v1.cjs`. **Das Skript liegt im Repository; es ist noch kein ausgeführter GitHub-Actions-/Node-Lauf dokumentiert.** Die oben genannten Ergebnisse stammen aus separaten schreibgeschützten Datenchecks und der Ausführung der JavaScript-Module.

## Wissenschaftliche Prüfsperren – insbesondere Fiqh

- Quellenakten zu allen neu redigierten Blöcken liegen in `kids-akademie/research/EDITORIAL_REVIEW_*_20261014.md`. Für schwierige Teile zusätzliche selbständige Primärakten zu 180, 192, 204–206, 207–208. Belegverifikation und Hadithprüfung dürfen **nicht** allein aus grünen Techniktests abgeleitet werden.
- Qurʾān-Versgrenzen wurden bei 94:5–6, 17:29, 39:53, 71:10, 112:1–4 etc. punktuell kontrolliert/korrigiert. **Jede** arabische Stelle, Zuschreibung und deutsche Erklärung über alle 208 Themen muss dennoch in einer eigenen vollständigen Quellenkontrolle abschließend abgeglichen werden.
- Fiqh: 166, 174, 180, 186, 192, 198, 201, 204, 205, 206, 207 und 208 erfordern besonders sorgfältige hanbalitische Fachprüfung. Weitere Fiqh-Themen vor 166 ebenso; `fiqhHumanReviewNeeded=true` und `scientificApproval=false` bleiben als Sicherheitskennzeichen erhalten.
- Kinderpflichten nicht überdehnen: Fasten bei körperlich geeigneten Kindern gesondert vom verpflichtenden Erwachsenenfasten; Zakāh **kann** bei hinreichendem Kindervermögen anfallen und wird dann durch Vormund behandelt (Ibn Qudāmah, `al-Mughnī` [Islamweb 15/1386](https://www.islamweb.net/ar/library/content/15/1386)); Ḥaǧǧ-Pflicht erfordert Voraussetzungen einschließlich Volljährigkeit. Aus historischen Fiqh-Quellen **keine** körperlichen Straf- oder Hungerzwangsanweisungen an Kinder ableiten.
- Islamische Kindererziehung: keine sektiererische Polemik, kein Einschüchtern, kein automatischer Takfīr, kein Urteil über verborgene Absichten; Trost und erreichbare Übungen altersgemäß.

## Nächste Produktionsphase (nicht erledigt)

1. Node-Test des kompletten Jahres-Overlays und bereits vorhandene Qualitätsprüfungen (`kids/tools/audit-academy-visitor-copy-v1.cjs --strict`, die individuellen Tests, Voice-Plan-Sync im Check-Modus) tatsächlich ausführen, CI-Grün dokumentieren.
2. Unabhängigen fachwissenschaftlichen Quellen-/Fiqh-Prüflauf für **alle 208 Lektionen, 624 Altersfassungen** durchführen; Originalzitat, genaue Quelle, ggf. Nummer/Band/Seite und Textgrenzen bei jedem Beleg nachweisen.
3. Quizfragen für alle Altersstufen sinnvoll individualisieren, vorhandene Lernprogression und Benutzerprofile unverändert halten.
4. Doppelten, **inaktiven** Entwurf 203–206 und dessen Sprachtext-Delta nur nach gesonderter Merge-Entscheidung archivieren/bereinigen; auf keinen Fall zusammen mit der aktiven 203–205/206–208-Ladefolge verwenden.
5. Erst nach wissenschaftlicher, pädagogischer und technischer Freigabe über Veröffentlichung nachdenken. Audio erst danach mit der echten zugelassenen Stimme und ohne synthetische Qurʾān-Rezitation separat planen.

**Aktueller Status:** Die **Erstellung und individuelle Redaktion bis Slot 208** ist im Entwurf abgeschlossen. **0/624 wissenschaftlich endfreigegeben**, **kein Live-Deploy**, **0 neue TTS-Credits**.
