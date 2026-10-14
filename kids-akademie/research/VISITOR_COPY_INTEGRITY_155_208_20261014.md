# DĀR AL TAWḤĪD KIDS AKADEMI – gesonderte Besuchertext- und Sprechtextprüfung (155–208)

**14.10.2026 · geschützter Arbeitszweig `chatgpt/kids-akademie-155-158-20261014`.**

## Tatsächlich geprüfter Umfang

Die vorhandenen **14 aufeinander aufbauenden Redaktionsmodule** `curriculum-editorial-155-158-v1.js` bis `curriculum-editorial-206-208-v1.js` wurden auf GitHub ausgelesen. Die jeweils dazugehörigen reinen Voice-Text-Deltas wurden mit den Kinderabschnitten abgeglichen.

| Prüfung | Befund |
| --- | --- |
| Neue individualisierte Unterrichtslektionen | **54/54** aus den Slots 155–208 vorhanden |
| Eigenständige Altersfassungen | **162/162** für 4–5 / 6–8 / 9–10 Jahre |
| Mit Kindern verknüpfte Text-/Sprachkontexte | **1.026/1.026** vorhanden |
| Intro- und Zeilenabweichungen zum Voice-Delta | **0** |
| Interne Entwicklungs-, Test-, QA- und Freigabevermerke in Kinderfeldern | **0 festgestellte** |
| Ausgelöste Audioerzeugung durch diese Redaktionsdateien | **0** (`generateCreditsUsed=0` in allen 14 Deltas) |
| Endgültig wissenschaftlich genehmigte Unterrichtsversionen | **0/624** |

Die ursprünglichen **208 Lektionsslots und 624 Altersentwürfe** bleiben bestehen. Diese Prüfung betrifft primär die *54 zuletzt redigierten Lektionen*. Sie beweist **keine** vollständige wissenschaftliche Einzelzitatprüfung der restlichen 154 Lektionen und ist keine Endfreigabe.

## Neue dauerhafte Sicherung

**Prüfskript:** `kids/tools/audit-academy-visitor-copy-155-208-v1.cjs`.

Der Test liest ausschließlich Dateien, löst weder Netzaufrufe noch eine Audioproduktion aus und prüft:
1. Exakte 54 Unterrichts-IDs gegen die vorhandenen Slots 155–208 aus `LESSON_STATUS.json`, keine Doppelbelegung.
2. Genau drei unterschiedlich formulierte Altersversionen mit je vier Kinder-Abschnitten pro Lektion, samt Lernziel, Beispielsituation, Praxis, Quellenabgrenzung und Zusammenfassung.
3. Abgleich von Intro und allen vier Kindertextzeilen mit den zugehörigen Voice-Textfeldern, einschließlich Audio- und Zusammenfassungskontexten.
4. Ausschluss interner Marker wie `scientificApproval`, `fiqhHumanReviewNeeded`, `sourceAudit`, `QA-Hinweis`, `Masterstimme`, `Staging`, `Preview`, `Audio-Test` oder `Keine Freigabe für Besucher` in allen Kindern zugänglichen Feldern.
5. Richtige Reihenfolge und Einmaligkeit aller 14 Modul-Skript-Tags im geschützten Akademie-`index.html`.
6. Erhaltung der zuvor korrigierten Qurʾān-Spannen **17:23–24**, **71:10**, **2:285**, **112:1–4** als ausdrückliche Regression-Sicherungen.
7. **0 TTS-Erzeugung**; alle Sprach-Deltas verbleiben im ungeprüften, nicht vertonten Zustand.

**Workflow:** `.github/workflows/kids-akademie-editorial-readonly-qa.yml` ist ergänzt, damit die Prüfung bei Änderungen am Unterricht automatisch ausgeführt wird.

**Erster neuer GitHub-Actions-Lauf:** [38539280349](https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/38539280349). Eine tatsächliche CI-Endbewertung nur nach abgeschlossenem Lauf vornehmen.

## Was noch nicht als erledigt gilt

- **Fachwissenschaftliche Freigabe aller 624 Altersfassungen**, besonders klassische hanbalitische Fiqh-Fragen und Quellen-/Überlieferungskontrolle.
- Allgemeine Alters-/Pädagogikbeurteilung der früheren Lektionen 1–154 über bereits einzelne korrigierte Grundlagenstunden hinaus.
- Gesamtsynchronisation der Delta-Sprechtexte mit dem kanonischen späteren Voice-Plan und menschliche Sprachfreigabe.
- Browser- und Geräteintegration für unterschiedliche iOS-/Android-Profile und End-to-End-Fortschrittstests.
- **Kein Merge auf `main`, kein Live-Deploy, keine Audioerzeugung und keine Aufhebung der Freigabesperren.**
