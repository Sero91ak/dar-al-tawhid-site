# DĀR AL TAWḤĪD KIDS AKADEMI – redaktioneller Integrationstest 155–208

**Datum:** 14.10.2026 · **Zweig:** `chatgpt/kids-akademie-155-158-20261014` · **Pull Request:** #1142 (Draft, Basis `cursor/kids-akademie-208-fa8f`). **Keine Endfreigabe, kein Merge auf main, kein Live-Deploy und keine Audioerzeugung.**

## Prüfergebnis: tatsächliche JavaScript-Ausführung im isolierten V8-Test

Am 14.10.2026 wurden die auf GitHub gespeicherten Modulquellen dynamisch eingelesen und in einer isolierten JavaScript-Laufzeit mit simuliertem `window.DARKidsAcademyCurriculum` **tatsächlich ausgeführt**. Die Testdaten enthielten sämtliche 208 bestehenden Lektions-IDs aus `kids-akademie/LESSON_STATUS.json`, die drei bekannten Altersgruppen und unveränderte Platzhalter für Quiz und Quellensperren. Dies ist ein **Laufzeit-Integritätstest der redaktionellen Overlays**, nicht ein vollständiger echter Browser-, Node- oder CI-End-to-End-Test.

| Kontrollpunkt | Ergebnis |
|---|---:|
| Nacheinander erfolgreich ausgeführte Editorial-Module | **14 / 14** |
| Tatsächlich geprüfte Lektions-IDs (Slots 155–208) | **54 / 54** |
| Unterschiedliche geprüfte Altersfassungen (je 4–5, 6–8, 9–10 Jahre) | **162 / 162** |
| Mit dem Kindertext verglichene Sprechtext-Kontexte | **1.026 / 1.026** |
| Fehlende / doppelt eingebundene Module in der Script-Reihenfolge | **0** |
| Abweichungen zwischen `lines`, `intro`, `audioScript` und Delta-Texten | **0** |
| Kinderseitige interne QA-/Debug-/Freigabebegriffe nach Korrektur | **0** |
| Audioerzeugungen und TTS-Credits | **0** |

Die zwei unabhängig ausführbaren Prüfabschnitte deckten ab:
- **155–182:** 7 Module, 28 Lektions-IDs, **84 Altersfassungen**, **532 Textkontexte**, keine Testabweichung.
- **183–208:** 7 Module, 26 Lektions-IDs, **78 Altersfassungen**, **494 Textkontexte**, keine Testabweichung.

**Zusätzlicher behobener Fehler:** In `kids/akademie/curriculum-editorial-163-166-v1.js`, Lektion **166**, Altersgruppe **9–10**, war das interne Feldwort `fiqhHumanReviewNeeded` im Kinder-`evidence`-Text sichtbar. Die entsprechende Formulierung wurde entfernt und durch eine normale fachliche Quellenabgrenzung ersetzt. Die Fiqh-Freigabesperre im separaten `sourceAudit` bleibt bestehen. Danach wurden alle 162 Altersfassungen erneut auf interne Begriffe geprüft.

## Dauerhaft angelegter automatischer Regressionstest

`kids/tools/test-academy-editorial-fullchain-v1.cjs` enthält einen ausführbaren Node.js-Test für alle **14 Module** und deren Text-Deltas. Vor dem späteren Zusammenführen mindestens folgenden Befehl ausführen:

```bash
node kids/tools/test-academy-editorial-fullchain-v1.cjs
```

Der Test schützt vorhandene Lektions-IDs, Quiz-Objekte und fachliche Sperren, überprüft Modulreihenfolge, die 162 Kinderfassungen und exakt 1.026 unvertonten Sprachtext-Kontexte. **Ein tatsächlicher Node-Lauf dieses gespeicherten Skripts ist noch nicht erfolgt.** Der isolierte V8-Test im ausführenden Werkzeug ist erfolgreich; er simuliert einen notwendigen Teil der Umgebung, nicht den Browser samt UI, Audio-, Profil- oder Offline-Speicherverhalten.

## Integrationsgrenzen und offene Qualitätsarbeiten

1. Die **bestehenden Lektionsentwürfe 1–154** sind nicht Gegenstand dieses isolierten 54er-Tests; sie benötigen ebenfalls fachliche und technische Gesamtprüfung. Die Jahresabdeckung 208/208 bedeutet nur vorhandene redaktionelle Entwürfe, **nicht 624 wissenschaftlich geprüfte Altersfassungen**. **0/624 endgültig freigegeben.**
2. Es gibt eine **nicht geladene, überlappende Alternativdatei `curriculum-editorial-203-206-v1.js`** mit dazugehörigem Voice-Delta. In der maßgeblichen Testvorschau werden stattdessen **`curriculum-editorial-203-205-v1.js` und `curriculum-editorial-206-208-v1.js`** verwendet. Die ältere Alternative **nicht zusätzlich aktivieren**, weil das Kindertexte und Sprechtext-Deltas doppeln würde.
3. Für die Fiqh-Lektionen (insbesondere **166, 174, 180, 186, 192, 198, 201 und 204–208**) muss die fachkundige hanbalitische Primärquellenkontrolle samt unterschiedlichen Fallgestaltungen und authentischer Sunnah fortgesetzt werden. Kinder nicht gefährden, einschüchtern oder zu einer medizinisch unsicheren Gebetshaltung bzw. Fastenpraxis drängen.
4. Voice-Deltas nicht für bezahlte TTS-Aufnahmen verwenden, bevor sie fachlich freigegeben, mit dem kanonischen Sprechplan konsolidiert und für deutsche Aussprache geprüft wurden. **Keine synthetische Qurʾān-Rezitation.**
5. Browser-/iOS-/Android-/PWA- und persistente Lernfortschrittstests, Node-Ausführung im CI und unabhängige wissenschaftliche Prüfung bleiben offen.

**Nächste verifizierbare Arbeit:** Source-Audit und Kindersicherheit bei Lektionen 1–154, beginnend mit systematischen Beleg-/Versgrenzen-Audits und danach echten CI- und UI-Läufen. Keine automatisierte Veröffentlichung ohne gesonderte Freigabe.
