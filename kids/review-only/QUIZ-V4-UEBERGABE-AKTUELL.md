# TAWḤĪD KIDS – QUIZ V4 · KOPIERBARE ÜBERGABE (aktueller GitHub-Stand)

**Geltungsbereich:** interner Quiz-Reviewzweig, **nicht** öffentliche App.
**Pflichtmodell:** `eleven_v4`, **Masterstimme:** Serhat Abu Malik, Voice-ID `DkU7j9uO4ZEtLD2iRZSH`.
**Untersagt:** Flash/ältere TTS, wiederholte kostenpflichtige Generierung bereits bezahlter Aufnahmen, fingierte MP3s, Freigabe ohne menschliche Hörkontrolle.

- GitHub: https://github.com/Sero91ak/dar-al-tawhid-site/pull/1143
- Arbeitszweig: `review/kids-quiz-v4-batch-001-020-20261014`
- Commit beim Erstellen dieses Berichts: `210b714bad561921aaa8a09f93392c7ad4f577ca`
- Originalkatalog: **900**, davon **450 ausgewählt (150 je Altersgruppe)** und **450 Reserve**; ursprüngliche IDs beibehalten.
- WICHTIG: Bei den 450 ausgewählten Originalfragen sind `reviewStatus=approved` und `verification=approved` bereits dokumentiert. Keinen neuen pauschalen Inhaltsprüfungsdurchgang anstoßen; Arbeitsziel bleibt die echte MP3-Audiofertigstellung und separate Hörprüfung.
- Im Quiz-Reviewbestand zugeordnete echte V4-MP3s: **794 unterschiedliche MP3-SHAs**, mehrfach wiederverwendet für **1584 Frage-/Lob-/Retry-/Erklärungsteile**.
- Technisch vierteilig vollständig: **343/450**, noch unvollständig: **107/450**.
- Letzter V4-Kostenaudit: **75 neue Sprachfragmente** = **5068 Unicode-Zeichen**; **0 neue Lob-/Retry-Fragmente**, **0 neue V4-Texte für 4–6 Jahre**.
- Nach Originalkosten getrennt: **80 Fragen nur durch bereits bezahlte MP3s blockiert**, **18 Fragen benötigen neue V4-Originaltexte**.
- Alter 4-6: **70/150** komplett; vorhandene Hörteile question=100, correct=85, retry=85, explanation=148.
- Alter 7-8: **139/150** komplett; vorhandene Hörteile question=144, correct=150, retry=150, explanation=142.
- Alter 9-10: **134/150** komplett; vorhandene Hörteile question=138, correct=150, retry=150, explanation=142.
- Ursprünglich bezahlte ElevenLabs-Flow-Aufnahmen: **56**, davon **47 importiert**, **9 noch ohne heruntergeladene Original-MP3-Datei**.
- Zusätzlich im Originalregister: **1777 Textschlüssel**, davon **1730 direkte bezahlte V4-Ledger-Einträge**; keine doppelten Text- oder Provider-Request-IDs im geprüften Ledger.
- Erste neue V4-Aufnahmerunde für ältere Kinder: **21 ECHTE Original-MP3s** mit **21 eindeutigen Anbieter-Anfragebelegen**; dafür geschätzte **486.47 Credits**. **Tatsächliche Provider-Abbuchung bisher NICHT abgeglichen**.
- ACHTUNG: **1 ungeklärte(r) V4-POST-Versuch(e)** sind ohne bestätigte MP3 gespeichert und von neuen kostenpflichtigen Anfragen AUSGESCHLOSSEN. Zuerst Originalbytes/Kostenbeleg klären, keinesfalls den betreffenden Text nochmals synthetisieren.
- Kosten ausschließlich für den kostenlosen Import-/QA-/Berichtslauf: **0 neue ElevenLabs-Sprachcredits**. Diese Null gilt NICHT für die bereits kostenpflichtig generierten V4-Originalaufnahmen.
- Noch geschätzter Bedarf für alle 450 nach gegenwärtigem Plan: **79075.79 Credits**; **keine bestätigte Rechnungsabbuchung** (Ledger enthält Schätzwerte).
- Menschliche Aussprache-/Hörfreigabe: **0**. Freigabeschalter: **aus**. Kein Live-Push und kein Merge.
- Rückimportierte Selbstauskünfte zur Hörprüfung: **0**; gemeldete Audiofehler: **0**. Diese Einträge sind noch KEINE unabhängig bestätigte Freigabe.

Genauer kostenfreier Restplan: `kids/review-only/QUIZ-V4-NAECHSTE-SCHRITTE.md` und `kids/review-only/quiz-v4-450-next-completion-priority.json`.
Zusätzliche globale Kostensperre: **10** echte Originaltexte sind im verbundenen ElevenLabs Flow noch reserviert/eingereicht und dürfen nicht erneut in eine kostenpflichtige TTS-Auswahl geraten. **1** davon sind bereits eingereicht, **7** sind vorerst unbezahlt reserviert. Der gesamte Audioabschlussplan unterscheidet diese Originale von wirklich neuen Sprachfragmenten.
Nur bei frisch erzeugtem Abschlussplan: **5** Fragen warten ausschließlich auf verbundene Flow-Originale. Wirklich neue noch zu generierende V4-Sprachfragmente nach Deduplizierung: **21**. Diese Werte sind keine neue providerbestätigte Abrechnung.

## Noch fehlende, **bereits bezahlte** Originalaufnahmen

Die neun historischen `eleven_v4`-Originale existieren als ElevenLabs-Flow-Assets; der bisherige direkte API-GET ist mit `HTTP 402 paid_plan_required` blockiert. **Nicht neu synthetisieren.**

Generation-IDs: `1UAwmEQ77D4BmA9DttHZ, 2xy9ZLej1wPTrnvAr9p7, AToalNGbxiRe1zfOnDG3, DX5z8FWaCS4FDx3KrloO, FGX65uXKWBnjULDxg3X1, GvXeGQ9Kr1lVy7LEAv5T, KIgCxJO3RDxhsIFJSYUB, UUmC2fDiXaV5W1IQSumA, aoKJuahenrKHfUE5OD9j`.

Original-Flow: https://elevenlabs.io/app/flows/n2ovmGko2iTlNWTAEqHk
Alle neun vorhandenen Audioelemente sind im Original-Flow eindeutigen Generation-IDs zugeordnet. Exakte Originaldateinamen und sichere Wiederherstellung: `kids/review-only/QUIZ-V4-LETZTE9-ORIGINALE-EXPORT.md`.
Frühere GitHub-Backup-Archive bereits gescannt: **18** echte ZIP-Archive, darunter **0** neu wiederhergestellte Generationen. Das ist eine begrenzte, NICHT vollständige Bestandsprüfung. Die erweiterte Suche berücksichtigt zusätzliche Archive/Dateinamen und braucht einen neuen belegten Actions-Lauf.

## Zusätzliche kostenfreie Suche in historischen GitHub-Audioarchiven

Die ursprünglichen neun bereits bezahlten MP3-Dateien waren über ElevenLabs-GET wiederholt blockiert (Flow-GET 402, alternativ History-GET 400). Der erfolgreiche GitHub-Wiederherstellungslauf https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/39007730585 speicherte nur die 47 bereits vorhandenen Originalaufnahmen und meldete ausdrücklich 0 neue Originale. Dies NICHT als 9/9-Wiederherstellung ausgeben.
Zusätzliche read-only/ohne ElevenLabs-TTS implementierte Archivsuche: `kids/tools/recover_quiz_v4_nine_from_github_action_archives.py`; CI `.github/workflows/kids-v4-scan-previous-paid-audio-backups.yml`. Sie untersucht streng begrenzte historische GitHub-Audio-Backup-Artefakte auf die exakten neun Generation-IDs und importiert nur wirklich gefundene MP3-Originalbytes unter der bereits geltenden MP3/ID/Laufzeit-/SHA-Kontrolle.
Wichtigster Scanner-Fix: Die alte Suchrunde verbrauchte 297 MB für 48 ZIP-Archive, ohne auf alle benannten alten Backupfamilien zuzugreifen. Die neue Stichprobe verteilt höchstens sechs Archive je Backup-Namen über junge, mittlere und alte Zeitpunkte. Nur tatsächliche MP3-Originalbytes ändern den Wiederherstellungsstatus; vor einem neuen grünen CI-Lauf keine neun Originale als gefunden ausgeben.
Wichtig: Erst den fertigen Laufbericht `kids/review-only/quiz-v4-nine-originals-github-archive-recovery.json` und den echten Audio-Status lesen. Ein laufender oder erfolgreich beendeter GitHub-Workflow beweist allein noch keine neue Originaldatei. Ist nichts gefunden, keine Sprachcredits erneut kaufen: ausschließlich echten Originalexport aus dem ElevenLabs-Flow besorgen.

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

## ZIP-Importblocker behoben – echter Quellbestand weiterhin unverändert

Im GitHub-Workflow `.github/workflows/kids-v4-prepaid-flow-restore.yml` sind zwei konkrete Fehler beseitigt: Der synthetische MP3-Regressions-Test gleicht die tatsächliche Kennzeichnung importierter Originale ab, ohne die Testdatei als echte bezahlte Sprachaufnahme zu bezeichnen; ein fehlerhaft eingerücktes Shell-Heredoc wurde durch das Prüfskript `kids/tools/assert_quiz_v4_prepaid_postimport.py` ersetzt. Zusätzlich prüft der Test die Shell-Syntax über `bash -n`. GitHub-Actions-Importtest #39017154136: erfolgreich.
Es wurden durch den Test KEINE neuen Original-MP3s importiert; die fehlenden 9 historischen Dateien sind über bestehende GET-Routen bislang mit HTTP 402 (`paid_plan_required`) bzw. HTTP 400 blockiert. Der Flow enthält ihre Generation-IDs, jedoch keine herunterladbare MP3-URL. Nur echten MP3-Export importieren, niemals synthetische Testaufnahmen übernehmen.

## Kostenfreie Wiederherstellung der neun historischen V4-Originale – drei Wege

Drei bestehende Importwege sind für die vollständige automatische Quiz-Weiterverarbeitung abgesichert: ZIP-Import über `.github/workflows/kids-v4-prepaid-flow-restore.yml`, verschlüsselter Original-Link-Import über `.github/workflows/kids-v4-secure-original-import.yml` und reiner GET-Import über `.github/workflows/kids-v4-last9-paid-free-get.yml`.
Nach einem ECHTEN Originalimport werden SHA-/Codecprüfung, Quiz-MP3-Zusammenbau für beide Altersbereiche, Fortschrittsdateien für 450 Fragen, Frage-ID-Staging und diese Übergabe automatisch aktualisiert. Sind alle 56 Originale vorhanden, muss die technische 4–6-Abdeckung auf exakt 150/150 steigen. Das ist noch keine menschliche Hörfreigabe.
Null-Credit-Regressionsprüfung: `kids/tools/test_quiz_v4_prepaid_end_to_end_wiring.py` via `.github/workflows/kids-v4-prepaid-endtoend-qa.yml`. Bei bisheriger Provider-Antwort HTTP 402 sind die Originalbytes weiterhin NICHT heruntergeladen; kein erneuter Kauf.
Zusätzlicher offizieller Null-Credit-Wiederherstellungsversuch seit 17.10.2026: `kids/tools/recover_quiz_v4_missing9_get_only.py` durchsucht nun GET `/v1/history` mit Filter `source=Flows`, `voice_id` und `model_id=eleven_v4` nach den **genau neun historisch bezahlten Texten**. Das berücksichtigt, dass ElevenLabs-Flow-generation_id NICHT zwangsläufig history_item_id ist. Die Suche bleibt auf 5 × 100 Verlaufseinträge begrenzt; keine erneute Sprachgenerierung.
WICHTIG: Gleicher Text allein ist KEIN Beweis derselben alten Aufnahme. Ein Original darf nur importiert werden, wenn ein eindeutiger Treffer zusätzlich per History-ID oder Request-ID nachweislich mit der ursprünglichen Generation-ID verknüpft ist. Doppelte oder unverbundene Treffer bleiben ungeklärt und dürfen NICHT als alte Originale etikettiert werden.
Offline-Sicherheitstest: `kids/tools/test_quiz_v4_flow_history_discovery.py` (richtige ID, Mehrdeutigkeit, falsche Stimme, 402, Pagination). Der ausführende GET-only-Workflow `.github/workflows/kids-v4-last9-paid-free-get.yml` startet nach GitHub-Actions-Freigabe. Erst danach aus dem importierten MP3-SHA und dem Statusbericht ablesen, ob tatsächlich eine Datei zurückkam.

## Neuer Originalaudio-Rückholweg für ungeklärte V4-Abbuchung

Die ursprünglichen 10 V4-Original-MP3s sind im GitHub-Register/Abrechnungsledger gespeichert. Zusätzlich ist ein früherer kostenpflichtiger V4-Aufruf mit unklarem Ergebnis gegen jede erneute Ausgabe gesperrt.
Neues Script: `kids/tools/recover_quiz_v4_uncertain_history.py`; Null-Credit-GitHub-Aktion: `.github/workflows/kids-v4-uncertain-paid-history-recovery.yml`.
Die ElevenLabs-Verlaufssuche darf ausschließlich GET `/v1/history` verwenden und eine gespeicherte MP3 nur aus GET `/v1/history/{history_item_id}/audio` abrufen. Zuordnung nur bei genau einer Übereinstimmung von Original-Sprachtext, `eleven_v4`, Master-Voice-ID und historischem Anfrage-Zeitfenster. Bei 402, nicht eindeutigem Treffer oder fehlendem Provider-Zugriff: NICHT erneut kaufen.
Letzter im GitHub-Report gespeicherter Ergebnisstatus: `FINISHED_READ_ONLY_HISTORY_RECOVERY`; echte hierdurch wiederhergestellte Original-MP3s: **0**. Der Wert 0 bleibt maßgeblich, solange keine Originalbytes mit SHA und Provider-History-ID gesichert wurden.

## Erster exakt gebundener V4-Auftrag für 7–10 Jahre

Aus den 450 ausgewählten Fragen sind **20 ältere Quizfragen (10 × 7–8 und 10 × 9–10)** als erste Produktionsstufe festgelegt. Dafür sind **65 eindeutig neue Original-V4-Sprachbausteine (1.842 Zeichen)** vorbereitet. Die 450 Originalfragen sind bereits als geprüft/approved dokumentiert; kein erneuter pauschaler Quellenprüfungsdurchgang. Vor neuen TTS-Kosten nur unveränderte Frage-/Sprechtext-Hashes, echten Audio-Bestand und frühere Zahlungen automatisch abgleichen; separate ausdrückliche Kreditfreigabe bleibt Pflicht.

Der ausführbare, fortsetzbare Kostengenerator `kids/tools/generate_quiz_v4_older_stage1_exact.py` benutzt ausschließlich die 65 unveränderlichen Sprachtext-Prüfsummen dieser Stufe. `--audit` kostet 0 Credits; `--produce` erfordert zwei bestätigte Freigaben und begrenzt jede Ausführung auf höchstens zehn Original-MP3s und höchstens 850 prognostizierte Credits. Quelle der unveränderten Texte: `.github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json`.
Manuelle Produktions-Pipeline: `.github/workflows/kids-v4-older-stage1-exact-paid.yml`. Die frühere doppelte Frageprüfung ist abgeschafft: Stattdessen wird nur die vorhandene `approved`-Freigabe der 450 Originalfragen bestätigt; das eigentliche Ausgabe-Budget wird separat genehmigt. Kostenfreier CI-Vortest: `.github/workflows/kids-v4-older-stage1-exact-audit.yml`. Sie speichert Originale mit Ledger/Backups sowie die danach neu zusammengesetzten privaten Quiz-Hördateien. Kein Live-Deploy.
V4-Originale dieser ersten 65er-Stufe: **50 tatsächlich gespeicherte MP3s** + **10 im Flow reservierte/angefragte Originale ohne MP3** + **1 früherer TTS-POST mit unbestätigtem Ergebnis, gegen Neukauf gesperrt** + **4 wirklich neu produzierbare, unreservierte Texte** = 65. Nur die letzte Kategorie darf nach separater Freigabe Credits kosten. Der Rest wird durch Wiederverwendung oder Originalexport geklärt.
Nächste freigabepflichtige Aufnahmerunde: **4 Texte**; geschätzte **218.04 Credits**, kein Provider-Rechnungswert. Bei reservierten Flow-Aufnahmen zuerst echten Anbieterstatus und exportierbare Original-MP3 prüfen, keinesfalls automatisch erneut bezahlen.

## Nachweis der tatsächlich gespeicherten bezahlten V4-Original-MP3s

Null-Credit-Prüfskript: `python3 kids/tools/audit_quiz_v4_stage1_paid_audio_integrity.py --report` und Workflow `.github/workflows/kids-v4-stage1-paid-original-integrity.yml`. Prüft jede im ersten älteren Batch bereits bezahlte V4-Original-MP3 **byteweise gegen SHA-256**, Text-/Modell-/Voice-ID sowie die beiden Kopien des Request-Journals und das Zahlungsledger. Erzeugt keine Stimme, bewirkt keine menschliche Audiofreigabe und keinen Live-Deploy.
Zusätzlich ruft der etablierte Null-Credit-Regressionstest `kids/tools/test_quiz_v4_older_stage1_exact.py` dieselbe echte Byteprüfung auf. Ein automatischer CI-Bericht ist nur dann als bestanden zu betrachten, wenn GitHub den Job tatsächlich ausgeführt und mit `success` beendet hat; `action_required` gilt NICHT als bestandener Test.
Nach der ersten realen 10er-Aufnahme sind zehn kostenpflichtige Anbieter-Request-IDs im Originalledger dokumentiert; dadurch wurden vier weitere Quizfragen technisch vollständig vertont. Vor endgültiger Hörkontrolle besteht weiterhin keine Live-Freigabe. Der Vergleich mit der tatsächlichen ElevenLabs-Credit-Abrechnung bleibt offen.

## Interne Quellen-/Antwortprüfung vor kostenpflichtiger V4-Aufnahme

Interne Quelle-Antwort-Prüfung: `.github/reports/KIDS-V4-STAGE1-QUELLEN-UND-ANTWORTCHECK.md` und `.github/reports/kids-v4-older-stage1-source-and-answer-audit.json`. Nur im privaten GitHub-Review; keine Internet-Quellenlinks in der Kinder-App.
Neu: 20-Fragen-Direktquellenliste mit zugehörigen Originalfragen, exakt richtiger Antwort und fachlichen Kontext-Hinweisen: `kids/review-only/QUIZ-V4-ERST20-QUELLEN-DIREKTNACHWEISE.md` (nur internes Review). Sie dokumentiert 20 passende Islamweb-/Dorar-Nachweise, bedeutet aber KEINE unabhängige menschliche Quellenfreigabe.
Automatisch überprüfte ursprüngliche 20 Frage-Antwort-Quellen-Zuordnungen: **20**. Zusätzlich öffentlich lokalisierte passende Belegstellen für **20** Fragen; übrige benötigen eine zusätzliche unabhängige Quellenkontrolle. Nicht mit menschlicher theologischer/fachlicher Abnahme verwechseln.
Präzisionshinweise besonders zu Qurʾān 16:43 (Kontext vs. pädagogische Anwendung), Qurʾān 5:6 (Waschen vs. Wischen) und Hadithnummern verschiedener Ausgaben beachten.
Nur nach wirklicher inhaltlicher und finanzieller Freigabe neue V4-Stimmenaufnahmen erzeugen, nie die Original-MP3s überschreiben.
Aktuelle zusätzliche Schutzregel: Der V4-Quellenprüfer muss auch nach bereits gespeicherten Teil-Batches mit 55, 45 usw. fehlenden Originalen erneut bestehen. Die kostenpflichtige Stufe berechnet dafür jedes Mal einen SHA-256-Fingerabdruck aus Originalquelle, gespeicherten MP3-Zuordnungen, vorherigen Kostenbelegen und den nächsten genauen Sprechtext-SHAs.
Nur wenn der ausdrücklich bestätigte Batch-Fingerabdruck exakt zur neu geprüften Quelle und zum aktuellen Ledger passt, darf der Produktionscode überhaupt eine Anfrage an ElevenLabs senden. Bei Abweichung: STOP vor Provider-GET oder TTS-POST; keine stillschweigende Kreditfreigabe.
Zusätzliche Absicherung: unmittelbar VOR jedem potenziell kostenpflichtigen POST schreibt der Generator einen als UNBESTÄTIGT markierten SHA-/Batch-Eintrag in `kids/data/quiz-v4-older-stage1-request-journal.json` und spiegelt ihn in `kids/data/quiz-v4-older-stage1-usage.json`. Die Usage-Datei ist bereits Teil des GitHub-Actions-Backups mit `if: always()`. Nach erhaltenen originalen MP3-Bytes werden Ledger und Originalregister atomar gespeichert; eine unsichere frühere Abrechnung oder unterbrochene Anfrage verbietet jede erneute Generierung derselben Sprachaufnahme, bis die Originaldatei/Provider-Abbuchung geklärt wurde.
Aktuell im Reviewprotokoll vorhandener Fingerabdruck: `14e7d8770294163bd565004438e6420683095b3cbe007581b346da0260708741`. Nach jeder MP3-Ergänzung erneut berechnen.

## Sicherer echter V4-Originalabruf und Kostenschutz bei Unterbrechung

Beim nächsten *ausdrücklich bezahlten* 7–10-Jahre-Originalbatch wird vor jedem ElevenLabs-POST der SHA256 des genauen gesprochenen Textes in ein Write-Ahead-Protokoll geschrieben. Ein HTTP-Fehler, Zeitablauf oder Abbruch nach einer möglicherweise abgerechneten Anfrage führt nicht zu einem automatischen zweiten Kauf. Stattdessen zuerst über Provider-Beleg bzw. echte Original-MP3-Datei abgleichen.
Die aktuelle Sicherung verwendet `kids/data/quiz-v4-older-stage1-request-journal.json` und eine **identische Kopie** unter `requestJournal` in `kids/data/quiz-v4-older-stage1-usage.json`. Die bestehende GitHub-Actions-Backup-Regel erfasst bereits die Usage-Datei auch bei Fehlern. Wird die lokale Journaldatei vermisst, kann die Backup-Kopie vor jedem weiteren POST eine unklare Vorbelastung nachweisen.
Der Null-Credit-Regressionscode `kids/tools/test_quiz_v4_older_stage1_exact.py` testet genau den Fall einer simulierten unklaren früheren Anfrage ohne synthetische MP3 und erwartet einen Stop mit `NEVER REBUY`. Sicherung im GitHub-Artefakt ist nicht dasselbe wie ein erfolgreich auf GitHub veröffentlichter Original-MP3-Commit: Bei Runner-Abbruch Recovery-Artefakt zuerst inspizieren und in den Reviewzweig zurückimportieren.
Letzter offener Gratis-GET-Versuch bestätigt neun verbliebene, vorher bezahlte V4-IDs mit `flowGetHTTP=402` und `historyAudioHTTP=400`, **0 authentische neue MP3s importiert**. Der API-GET verlangt zuerst die Freigabe des Originalexports; die bisherigen Sprachcredits dürfen nicht noch einmal ausgegeben werden.

## Originale aus fehlgeschlagenen bezahlten GitHub-Actions-Läufen retten

GitHub-Actions lädt bei der exakt begrenzten 7–10-Jahre-V4-10er-Aufnahmerunde unter `tawhid-kids-v4-older-stage1-exact-prepaid-safekeeping` einen ZIP-Backupstand hoch – auch wenn der nachgelagerte MP3-Zusammenbau oder GitHub-Push scheitert. Echte zuvor abgebuchte Originale und die Sperrvermerke NIEMALS neu kaufen.
Neuer **rein lokaler, kostenfreier und ausschließlich privater** Original-Recovery-Importer: `python3 kids/tools/restore_quiz_v4_stage1_paid_run_backup.py --zip ARTIFACT.zip` (Prüfung ohne Änderungen); nach bestandenem SHA-/Originalledger-/Audio-Prüfbericht `python3 kids/tools/restore_quiz_v4_stage1_paid_run_backup.py --zip ARTIFACT.zip --import` (nur in diesem Reviewcheckout).
Der Import akzeptiert sowohl von GitHub Actions verkürzte ZIP-Pfade als auch vollständige Projektpfade und verweigert manipulierte Alte-Aufnahmen, fehlende echte MP3-Bytes, abweichende Kostenbelege und Pfadmanipulation. Nur nach bestandenem Import Audio-Neuzusammenbau und Statusaktualisierung ausführen; niemals automatisch Live veröffentlichen.
Besonders wichtig: Ein abgebrochener Provider-Aufruf mit unklarem Abrechnungsergebnis bleibt als `REQUEST_STARTED_UNCONFIRMED` erhalten, selbst wenn die MP3-Datei fehlt. Vor jeder weiteren bezahlten V4-Anfrage zwingend zuerst Ledger und Originalexport abgleichen.
Kostenloser Negativtest: `kids/tools/test_quiz_v4_stage1_paid_backup_restore.py` und `.github/workflows/kids-v4-stage1-paid-backup-restore-qa.yml`; der Test erzeugt selbst KEINE Audioaufnahme und kann keine Credits abbuchen.

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
