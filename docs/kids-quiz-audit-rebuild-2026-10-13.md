# DĀR AL TAWḤĪD KIDS — Quiz, technische und didaktische Überarbeitung (13.10.2026)

Status: **Prüfzweig / NICHT LIVE**. Auf diesem Zweig keine kostenpflichtige TTS-Erzeugung und keine Freigabe an Kinder.

## Ausgangslage, nachgewiesen

- Die Benutzeraufnahme vom 13.10.2026 zeigt leere Quiz- und Katalog-Bildflächen sowie überlagerte Bedienelemente beim Scrollen.
- `kids/data/quiz-kids.json`: exakt **900 veröffentlichte, freigegebene Fragen**, je **300** für `4-6`, `7-8`, `9-10`.
- Altersgruppe `4-6`: **288 von 300** mit Ja/Nein-Antworten.
- Bei **allen 900 Fragen** ist `success` wortgleich `Richtig. Sehr gut!` und `retry` wortgleich `Noch nicht. Hör gut zu und versuch es noch einmal.`. Als einzige feste Reaktion pädagogisch eintönig.
- Es existieren thematische und altersbezogene Bilder (`artwork`), aber keine individuell pro Frage hinterlegte Bilddatei.
- Das Haupt-HTML enthielt eine globale Quiz-Überschreibung mit einem externen, befristeten Bild-Link (`exp` 1791330036 = 07.10.2026 01:40 CEST); diese wichtige Regel verdrängte `--quiz-art` aus `quizArtworkForBand()`.
- Mehrere CSS-Revisionsblöcke reduzierten `.quiz-scene` auf Smartphones auf **96 bis 124 px**. Parallel waren `.quiz-stage` und `#quizBody` beide unabhängig scrollbar; Katalog und Dashboard bringen eigene Scrollcontainer mit.
- `kids/data/quiz-voice-batch.json` und die TTS-GitHub-Action wählen `eleven_flash_v2_5` für neue deutsche Quiztexte. `eleven_v4` wird insbesondere für echte arabische/Fuṣḥā-Segmente eingesetzt. Alle Audios sind dadurch **nicht** automatisch V4.
- `quizPrompt()` in `kids/index.html`, `quiz_prompt()` im Workflow und `quiz_prompt()` im Guard hängen bei Ja/Nein derzeit schlicht `Ja oder Nein?` an den Fragetext. Die Keys werden **wortgenau** im Audio-Manifest nachgeschlagen.
- Die tatsächliche Vollständigkeit und Modellverteilung des veröffentlichten `kids/data/quiz-audio.json` wurde nicht nachgewiesen (große Manifestdatei nicht in dieser Prüfung vollständig abrufbar). Keine unbelegte Audio-Freigabebehauptung.

## Auf diesem Zweig bereits geändert

1. `kids/index.html`: abgelaufene externe Quiz-Artwork-URL entfernt. Themen-/Altersbild `--quiz-art` aus vorhandenen lokalen Ressourcen wieder vorrangig, mit lokalem Ausfallbild. Versioniertes CSS-Asset; freundlicherer sichtbarer Hilfetext nach Altersstufe.
2. `kids/quiz-library.css`: echte verfügbare Breite statt 1180-px-Inhaltsgrenze; eine primäre Scrollfläche pro Quizmodus; unstetige Sticky-Filter für den Katalog entfernt; größere Szene, Button- und Schriftmaße nach Alter; responsive iPad-Zweispaltenlayout; Quiz-exklusive feminine Farbvariante.
3. **Nicht geändert:** Katalogfragen, Antworten, Quellen, Audio-Manifest, TTS-Modell, Service-Worker oder Lernfortschritt-Keys.

## Noch notwendige Audio-Arbeit (getrennt vom CSS-Fix)

- **Vorarbeit:** Die 900 aktuellen Frage-Prompts und sämtliche neuen, altersgerechten gesprochenen Anweisungen als eigenes, versioniertes V4-Textskript aufbauen. Gesprochene Aussage nicht nur per string replacement ändern.
- **4–6 Jahre:** Kurze, fröhliche, warme Frage, dann eine kurze Hilfestellung im Wechsel: „Was meinst du? Wenn du denkst, dass es stimmt, tippe auf Ja. Sonst auf Nein.“ Nicht bei 12 Non-Ja/Nein-Fragen die falsche Anleitung verwenden.
- **7–8 Jahre:** Kein monotoner Nummernvortrag; vier Antwortoptionen klar getrennt und mit natürlichen Sprechpausen, schwierige arabische Begriffe zuerst korrekt sagen und in einfacher Sprache erklären.
- **9–10 Jahre:** Etwas sachlicher; knappe Denkpause vor der Auswahl und stärkere inhaltliche Erklärung nach der Auflösung. Nicht unnötig kindlich.
- **Für alle:** Feedback- und Fehlerstimme variieren (jeweils 4–6 echte Alternativen je Alter). Ruhig, persönlich, nicht beschämend; immer erklärend. Die richtige Antwort wird vor der Auswahl nie verraten.
- **V4:** Deutsch und Fuṣḥā in der vorhandenen autorisierten Serhat-Masterstimme jeweils mit geeignetem Sprachprofil testen; arabische Originalwörter/Ṣalawāt nicht durch ungeprüfte deutsche Lautschriftersetzung verunstalten. Keine neue Arabisch-Aussprache ohne menschliche Hörfreigabe.
- Zunächst ein **12-Fragen-Pilot**, je 4 pro Altersstufe, bewusst gemischte Begriffe und Antworttypen. Vor jedem aufwendigen Bulk-Render Kosten und verbleibende Credits prüfen. Keine automatische Massenproduktion auf dem Release-Branch.
- Änderungen müssen synchron in `quizPrompt()`, `kids/tools/quiz_speech_guard.py`, der Generierungsaction, Audio-Manifest-Keys und Cache-Revision erfolgen. Alte genehmigte Aufnahmen beibehalten, solange sie nicht überprüft ersetzt sind.
- Ein Serien-Rollout erfolgt nur mit Qualitätsnachweis: korrekte Aussprache und deutscher Sinn, Natürlichkeit, passende Antwortreihenfolge, menschlicher Soundcheck, reproduzierbares Modell-Metadatum, vollständige Auslieferung, keine stummen Fragen.

## Freigabeprüfungen vor Live

- Reale Geräte: kompaktes iPhone, iPhone Pro Max, iPad Hoch/Quer, Galaxy Fold offen/geschlossen, Android PWA, iOS WebView.
- Für beide Kinderprofile: Jungen-/Mädchenfarbe, Bilder tatsächlich geladen (keine befristeten URLs), keine abgeschnittenen Texte, keine Überlagerung bei Scroll und Tastaturöffnung, Zurück-Button statt Seitenswipe.
- 4–6: Zwei große Ja/Nein-Felder; 7–8: Lesbarkeit der Antwortlisten; 9–10: längste Fragetexte; Offline und Wiederholung.
- Der Lernfortschritt muss vor/nach dem Update identisch sein; `kids.quiz.progress.v2.*` und `kids.quiz.session.v1` nicht zurücksetzen.
- Vor Veröffentlichung CSS-/JS-Syntax, referenzierte Bilddateien, Cache-/SW-Versionen und echte TTS-Assets überprüfen. Keine CI-/Produktionserfolge behaupten, bevor tatsächlich geprüft.
