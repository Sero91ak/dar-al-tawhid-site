# TAWḤĪD KIDS – QUIZ V4 · KOPIERBARE ÜBERGABE (aktueller GitHub-Stand)

**Geltungsbereich:** interner Quiz-Reviewzweig, **nicht** öffentliche App.
**Pflichtmodell:** `eleven_v4`, **Masterstimme:** Serhat Abu Malik, Voice-ID `DkU7j9uO4ZEtLD2iRZSH`.
**Untersagt:** Flash/ältere TTS, wiederholte kostenpflichtige Generierung bereits bezahlter Aufnahmen, fingierte MP3s, Freigabe ohne menschliche Hörkontrolle.

- GitHub: https://github.com/Sero91ak/dar-al-tawhid-site/pull/1143
- Arbeitszweig: `review/kids-quiz-v4-batch-001-020-20261014`
- Commit beim Erstellen dieses Berichts: `9d9035426363892506b824561fdc39a6b8555a89`
- Originalkatalog: **900**, davon **450 ausgewählt (150 je Altersgruppe)** und **450 Reserve**; ursprüngliche IDs beibehalten.
- Im Quiz-Reviewbestand zugeordnete echte V4-MP3s: **276 unterschiedliche MP3-SHAs**, mehrfach wiederverwendet für **1044 Frage-/Lob-/Retry-/Erklärungsteile**.
- Technisch vierteilig vollständig: **72/450**, noch unvollständig: **378/450**.
- Letzter V4-Kostenaudit: **1392 neue Sprachfragmente** = **65057 Unicode-Zeichen**; **0 neue Lob-/Retry-Fragmente**, **0 neue V4-Texte für 4–6 Jahre**.
- Nach Originalkosten getrennt: **80 Fragen nur durch bereits bezahlte MP3s blockiert**, **298 Fragen benötigen neue V4-Originaltexte**.
- Alter 4-6: **70/150** komplett; vorhandene Hörteile question=100, correct=85, retry=85, explanation=148.
- Alter 7-8: **2/150** komplett; vorhandene Hörteile question=2, correct=150, retry=150, explanation=14.
- Alter 9-10: **0/150** komplett; vorhandene Hörteile question=0, correct=150, retry=150, explanation=10.
- Ursprünglich bezahlte ElevenLabs-Flow-Aufnahmen: **56**, davon **47 importiert**, **9 noch ohne heruntergeladene Original-MP3-Datei**.
- Zusätzlich im Originalregister: **374 Textschlüssel**, davon **327 direkte bezahlte V4-Ledger-Einträge**; keine doppelten Text- oder Provider-Request-IDs im geprüften Ledger.
- Kosten für den bisherigen Import und diese Berichterstellung: **0 neue ElevenLabs-Sprachcredits**.
- Noch geschätzter Bedarf für alle 450 nach gegenwärtigem Plan: **79075.79 Credits**; **keine bestätigte Rechnungsabbuchung** (Ledger enthält Schätzwerte).
- Menschliche Aussprache-/Hörfreigabe: **0**. Freigabeschalter: **aus**. Kein Live-Push und kein Merge.
- Rückimportierte Selbstauskünfte zur Hörprüfung: **0**; gemeldete Audiofehler: **0**. Diese Einträge sind noch KEINE unabhängig bestätigte Freigabe.

Genauer kostenfreier Restplan: `kids/review-only/QUIZ-V4-NAECHSTE-SCHRITTE.md` und `kids/review-only/quiz-v4-450-next-completion-priority.json`.

## Noch fehlende, **bereits bezahlte** Originalaufnahmen

Die neun historischen `eleven_v4`-Originale existieren als ElevenLabs-Flow-Assets; der bisherige direkte API-GET ist mit `HTTP 402 paid_plan_required` blockiert. **Nicht neu synthetisieren.**

Generation-IDs: `1UAwmEQ77D4BmA9DttHZ, 2xy9ZLej1wPTrnvAr9p7, AToalNGbxiRe1zfOnDG3, DX5z8FWaCS4FDx3KrloO, FGX65uXKWBnjULDxg3X1, GvXeGQ9Kr1lVy7LEAv5T, KIgCxJO3RDxhsIFJSYUB, UUmC2fDiXaV5W1IQSumA, aoKJuahenrKHfUE5OD9j`.

Original-Flow: https://elevenlabs.io/app/flows/n2ovmGko2iTlNWTAEqHk

## Gesamte Hörprüfung für 450 Fragen (kostenfrei)

Der aktuelle Gesamt-Hörprüfungsbau verwendet echte, zuvor gespeicherte MP3-Originale, nach SHA geprüft. Die beiden interaktiven Seiten und ihre Hördateien werden unter `START-HIER.html` zusammengeführt; die menschlichen Freigaben bleiben unerteilt.

Neuer Build: `python3 kids/tools/build_quiz_v4_all450_master_hearing_review.py`.
GitHub-Workflow: https://github.com/Sero91ak/dar-al-tawhid-site/actions/workflows/kids-v4-all450-master-hearing-package.yml
Privates Actions-Artefakt: `tawhid-kids-v4-all450-human-hearing-offline-bundle`. Niemals ins öffentliche KIDS-Frontend einbauen.

## Prüfentscheidungen sicher rückimportieren

Prüfdateien aus dem Offline-Hörpaket werden ausschließlich anhand echter V4-MP3-Prüfsummen, genauer Textzuordnung und korrekter Altersgruppe akzeptiert.
Importer: `python3 kids/tools/import_quiz_v4_human_hearing_reviews.py`.
Internes Ledger: `kids/review-only/quiz-v4-450-human-hearing-submission-ledger.json`.
CI: https://github.com/Sero91ak/dar-al-tawhid-site/actions/workflows/kids-v4-hearing-results-secure-import.yml
Selbstauskünfte bleiben von unabhängigen Audiofreigaben und der öffentlichen Quiz-Freigabe strikt getrennt. Der Importer validiert jedes Mal die REALEN MP3-Bytes gegen SHA-256, weist doppelte JSON-Schlüssel zurück und speichert weder Prüfernamen noch freie Notiztexte im GitHub-Bericht.

## Kostenplan für fehlende V4-Originale

Lesen: `kids/review-only/QUIZ-V4-AUDIO-KOSTENCHECK.md`.
Die aktuelle, nicht vom Provider bestätigte 79.075,79-Credit-Prognose und das bisherige Budgetziel 27.860 Credits weichen erheblich ab. Eine reine Kürzung wiederholter Anmoderationen erzielt nach dem ersten nicht-destruktiven Vergleich nur einen Teil der nötigen Reduktion; die 450 Originalfragen und Lerninhalte unverändert erhalten.
Bezahlte V4-Neugenerierungen niemals automatisch anstoßen. Exakte Text-SHA gegen bezahlte Originale und Provider-Abrechnung prüfen.

## Kürzere Originalsprache für 7–10 Jahre – nur redaktioneller Entwurf

Neuer kostenfreier Textentwurf: `kids/review-only/QUIZ-V4-SPRECHTEXT-OPTIMIERUNG-ENTWURF.md` und `kids/review-only/quiz-v4-older300-compact-spoken-proposals.json`.
Er umfasst 300 Originalfragen mit identischen Antwortmöglichkeiten und ursprünglichen Erklärungen. Nur redundante Anmoderationen und Schlussfloskeln werden herausgenommen. Es wurden noch KEINE MP3s regeneriert und KEINE Quellen geändert.
Eine prozentuale Einsparung bei der rohen Feldtextlänge ist noch keine gleich hohe bestätigte Credit-Ersparnis; vorhandene V4-Sprachsegmente müssen in jedem Fall wiederverwendet werden.

## Automatischer V4-MP3-Import nach späteren kostenpflichtigen Originalen

Die beiden bestehenden, ausdrücklich manuell freizugebenden V4-Produktionsabläufe `.github/workflows/kids-v4-450-paid-batch02.yml` und `.github/workflows/kids-v4-450-paid-batch03.yml` importieren künftig jede gespeicherte neue Aufnahme automatisch in den internen Quizbereich: SHA-Originalprüfung, Offline-Zusammenbau für beide Altersgruppen, vollständiger 450-Fragen-Status, MP3-Frage-IDs und aktualisierte Übergabe – erst danach Speicherung mit Backup. Die öffentliche App wird nicht freigeschaltet.

Zero-Credit-Sicherheitstest: `kids/tools/test_quiz_v4_paid_postimport_workflows.py`; CI: `.github/workflows/kids-v4-paid-postimport-regression.yml`.
Für die 150 jüngsten Fragen wurde die kostenpflichtige Kampagne repariert: Fehlen keine neuen Texte, beendet sie sich vor Guthabenprüfung und vor jedem ElevenLabs-POST. Stattdessen sind die neun zuvor bezahlten Originale wiederherzustellen.

## Kostenfreie Wiederherstellung der neun historischen V4-Originale – drei Wege

Drei bestehende Importwege sind für die vollständige automatische Quiz-Weiterverarbeitung abgesichert: ZIP-Import über `.github/workflows/kids-v4-prepaid-flow-restore.yml`, verschlüsselter Original-Link-Import über `.github/workflows/kids-v4-secure-original-import.yml` und reiner GET-Import über `.github/workflows/kids-v4-last9-paid-free-get.yml`.
Nach einem ECHTEN Originalimport werden SHA-/Codecprüfung, Quiz-MP3-Zusammenbau für beide Altersbereiche, Fortschrittsdateien für 450 Fragen, Frage-ID-Staging und diese Übergabe automatisch aktualisiert. Sind alle 56 Originale vorhanden, muss die technische 4–6-Abdeckung auf exakt 150/150 steigen. Das ist noch keine menschliche Hörfreigabe.
Null-Credit-Regressionsprüfung: `kids/tools/test_quiz_v4_prepaid_end_to_end_wiring.py` via `.github/workflows/kids-v4-prepaid-endtoend-qa.yml`. Bei bisheriger Provider-Antwort HTTP 402 sind die Originalbytes weiterhin NICHT heruntergeladen; kein erneuter Kauf.

## Erster exakt gebundener V4-Auftrag für 7–10 Jahre

Aus den 450 ausgewählten Fragen sind **20 ältere Quizfragen (10 × 7–8 und 10 × 9–10)** als erste Produktionsstufe festgelegt. Dafür sind **65 eindeutig neue Original-V4-Sprachbausteine (1.842 Zeichen)** vorbereitet. Neue Abrechnung erst nach Prüfung der Originalquellen und einer getrennten ausdrücklichen Zustimmung zu Sprachcredits.

Der ausführbare, fortsetzbare Kostengenerator `kids/tools/generate_quiz_v4_older_stage1_exact.py` benutzt ausschließlich die 65 unveränderlichen Sprachtext-Prüfsummen dieser Stufe. `--audit` kostet 0 Credits; `--produce` erfordert zwei bestätigte Freigaben und begrenzt jede Ausführung auf höchstens zehn Original-MP3s und höchstens 850 prognostizierte Credits. Quelle der unveränderten Texte: `.github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json`.
Manuelle Produktions-Pipeline: `.github/workflows/kids-v4-older-stage1-exact-paid.yml`. Kostenfreier CI-Vortest: `.github/workflows/kids-v4-older-stage1-exact-audit.yml`. Sie speichert Originale mit Ledger/Backups sowie die danach neu zusammengesetzten privaten Quiz-Hördateien. Kein Live-Deploy.
Letzte gespeicherte 65er-Restzahl: **65**; nächste wartende Originale: **10**; reine Kostenschätzung dafür: **233.54** Credits. Keine neue MP3 als erzeugt behaupten, bevor das Ledger/MP3-Hash dies beweist.

## Interne Quellen-/Antwortprüfung vor kostenpflichtiger V4-Aufnahme

Interne Quelle-Antwort-Prüfung: `.github/reports/KIDS-V4-STAGE1-QUELLEN-UND-ANTWORTCHECK.md` und `.github/reports/kids-v4-older-stage1-source-and-answer-audit.json`. Nur im privaten GitHub-Review; keine Internet-Quellenlinks in der Kinder-App.
Automatisch überprüfte ursprüngliche 20 Frage-Antwort-Quellen-Zuordnungen: **20**. Zusätzlich öffentlich lokalisierte passende Belegstellen für **7** Fragen; übrige benötigen eine zusätzliche unabhängige Quellenkontrolle. Nicht mit menschlicher theologischer/fachlicher Abnahme verwechseln.
Präzisionshinweise besonders zu Qurʾān 16:43 (Kontext vs. pädagogische Anwendung), Qurʾān 5:6 (Waschen vs. Wischen) und Hadithnummern verschiedener Ausgaben beachten.
Nur nach wirklicher inhaltlicher und finanzieller Freigabe neue V4-Stimmenaufnahmen erzeugen, nie die Original-MP3s überschreiben.

## Nächste verbindliche Schritte

1. Original-MP3-Dateien für die fehlenden Generation-IDs aus der bereits bezahlten ElevenLabs-Erzeugung exportieren; exakt `<generationId>.mp3` benennen. Für fehlende Dateien niemals Ersatz-V4 kostenpflichtig bestellen.
2. Im Reviewzweig über `kids/tools/import_quiz_v4_prepaid_flow_originals.py --zip ORIGINAL_NINE_MP3.zip` oder den vorhandenen GitHub-Workflow `.github/workflows/kids-v4-prepaid-flow-restore.yml` importieren; dabei echte MP3-Daten, Original-ID, Laufzeit, SHA256 und Codec prüfen.
3. Automatisch `kids/tools/quiz_v4_first150_offline_join.py` und `kids/tools/stage_quiz_v4_existing_mp3_import.py` erneut ausführen; neue Zuordnungen in `kids/review-only/quiz-v4-450-actual-mp3-import.json` speichern.
4. Vor jeder weiteren kostenpflichtigen Produktion den kostenfreien Abschlussplan `kids/tools/plan_quiz_v4_finish_without_duplicate_credits.py` erneut erstellen, alle existierenden V4-Texte, 56 alten paid Flow IDs und mindestens 327 direkten kostenpflichtigen Belege mit `kids/tools/test_quiz_v4_no_double_charge_guard.py` abgleichen; Kosten optimieren.
5. Alle vier Audiofelder pro Frage erst technisch und dann mit dem vorhandenen interaktiven Gesamt-Hörpaket (`kids/tools/build_quiz_v4_all450_master_hearing_review.py`) per menschlicher Hörprobe prüfen; arabische Aussprache und korrekte deutsche Inhalte beurteilen; Freigabe bleibt strikt aus.
6. Die 450 ausgewählten Quizfragen in der Kinder-Test-App mit altersabhängiger Darstellung, Offlinebetrieb und stabiler Fortschrittsspeicherung testen. Konflikte mit aktuellem `main` vor jedem Merge beheben; keine Salaf-/Mädchen-Farbänderungen überschreiben.
7. Erst nach erfolgreichem `python3 kids/tools/quiz_v4_selected450_release_gate.py --strict`, Qualitätsprüfung und ausdrücklicher Freigabe live veröffentlichen.

## Für den nächsten Chat

„Arbeite selbstständig weiter im GitHub-Repository `Sero91ak/dar-al-tawhid-site`, PR #1143 / Branch `review/kids-quiz-v4-batch-001-020-20261014`. Lies `kids/review-only/QUIZ-V4-UEBERGABE-AKTUELL.md`, `kids/review-only/QUIZ-V4-NAECHSTE-SCHRITTE.md` sowie `kids/review-only/quiz-v4-handover-latest.json` und die aktuellen QA-Dateien, bevor du Änderungen machst. Nur Serhat Master `eleven_v4`. Keine doppelt bezahlten MP3s regenerieren, keine neuen Sprachcredits ohne klaren Kostenabgleich. Importiere echte bereits bezahlte MP3s in den Quiz-Reviewbestand; prüfe alle Änderungen; aktualisiere anschließend diese Übergabedateien. Berichte immer den tatsächlichen GitHub-Commit, belegte Tests, Restblocker und Live-Status.“

_Stand ausschließlich aus JSON-Ledger und V4-Importdaten berechnet. GitHub-CI-Ergebnis und Mergefähigkeit müssen beim nächsten Arbeitsbeginn frisch gelesen werden._
