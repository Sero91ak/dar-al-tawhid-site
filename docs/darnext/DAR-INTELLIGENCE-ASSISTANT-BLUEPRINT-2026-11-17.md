# DĀR INTELLIGENCE – Next Generation Islamic Conversation Assistant
**Datum:** 17.11.2026
**GitHub-Auftrag:** https://github.com/Sero91ak/dar-al-tawhid-site/issues/1791
**Gesamtauftrag:** https://github.com/Sero91ak/dar-al-tawhid-site/issues/1789

**Freigabestatus:** KONZEPT / ISOLIERTE FORSCHUNG & IMPLEMENTIERUNGSPROTOTYPEN. KEINE LIVE-AKTIVIERUNG UND KEINE KOSTENPFLICHTIGE KI-ANBINDUNG. Der Nutzer erlaubt diese Entwicklungsrichtung unter der Bedingung einer hervorragenden islamischen Wissens-, Dialog- und Quellenqualität und ohne verpflichtende laufende Zusatzkosten. Es gibt keine Garantie, jede islamische Frage zuverlässig zu beantworten.

## A. Mission und Gesprächsverhalten
Die bestehende App DAR NEXT wird zu einer hochwertigen klassischen islamischen Wissens-App erweitert. Der Assistent soll keine schlichte Chatbox sein, sondern ein intelligenter, höflicher, zugänglicher Gesprächsbereich mit Begrüßung, normalen Unterhaltungen, Folgerückfragen, Begriffsdefinitionen, Lern-Erklärungen, Quiz-/Übungsaktionen, Quellen-Details und Kontextbezug. Es soll sich so weit wie nachweislich möglich natürlich anfühlen. Darf nicht behaupten, Muftī oder menschlicher Gelehrter zu sein.

Alle Fragen dürfen gestellt werden. Bei belegbaren Fragen fachlich geprüfte Antworten mit Fundstelle. Bei nicht belegbaren oder mehrdeutigen Fragen Unsicherheit offenlegen, nie religiöse Rechtsurteile/Ḥadīṯ-Grading/Überlieferungen erfinden. Der Assistent dient der Recherche und dem Lernen, nicht der garantierten Beantwortung aller theologischen Streitfragen.

## B. GitHub-Bestand zuerst prüfen
Im eingesehenen Entwicklungsbranch codex/darnext-native-masterauftrag-20261024:
- DARNext/Features/Assistant/DashboardAssistant.swift: KnowledgeAssistantTransport, LocalKnowledgeAssistantTransport, DashboardAssistantView; aktuell stichwortbasiert und keine generative Mehrturn-KI.
- DARNext/Data/LocalContentRepository.swift: lokaler suchfähiger Index auf Basis gebündelter Qurʾān-/Beitrags-/Duʿāʾ-/Bibliotheksressourcen mit Cache.
- DARNext/Data/DARNextContentSyncService.swift: offline-content-manifest.json per URLSession/ETag samt lokalem Fallback; keine nachgewiesene automatisch vollständige, verifizierte Synchronisierung neuer Inhaltsdateien und Suchindizes.
- DARNext/Shell/RootShell.swift: in älterem Branch eigene AI-Tab, obwohl die verbindliche Erwachsenen-Navigation Start · Quiz · Beiträge · Koran · Mehr lautet.

**Nie die Oktoberdateien ohne Branch-Abgleich als neuesten Stand ausgeben!** Vor Änderungen Arbeitsstand vom 16./17.11.2026, PRs, local Git, Designsystem, Nutzerregeln, Quellen- und Sprachvertrag prüfen.

## C. UX: Klassisches Erbe mit moderner nativer Präzision
- Premium-SwiftUI, bestehende Themes/Design-Tokens, matte Gold- und Smaragdakzente, ruhige Pergament-/Nachtblau-Flächen, hervorragende arabische und lateinische Typografie, feine Trennlinien.
- iPhone: einspaltige Chat-/Quellenansicht mit stabiler Bottom-Eingabe, Fokus-/Tastatur-Management und fließendem Karte→Quellenleser-Übergang.
- iPad, Fold/Duo, Split View, breite Displays: Dual-Pane nach VERFÜGBARER BREITE, links Gespräch, rechts geprüfter Originaltext und Nachweise, Verknüpfungen ohne Seitenneustart.
- Antwortkomponenten unterscheiden deutlich: kurze Antwort, belegter Originalwortlaut, geprüfte Übersetzung, Erklärung/Einordnung, Quellen-ID und Link, Quellenstatus und Unsicherheitsstatus.
- Aktionen: Originalbeleg, Vertiefen, zum Lernmodus, relevante Quellen, Lesestand, optional lokale Wiedergabe sofern vorhanden. Nur tatsächlich funktionsfähige Aktionen.
- 9 Erwachsenen-Sprachen de/ar/en/tr/ku/ckb/bs/fr/es mit RTL ar/ckb, Dynamic Type, VoiceOver, Voice Control, Reduce Motion, Screenreader-Antwortreihenfolge, Touchgrößen, Kontrast, keyboard-safe Layout, Offline-/Error-/Statusanzeige.
- Sanfte native Motion und zurückführende Card-Transitions. Keine künstlich leuchtende oder spielzeughafte Chatoberfläche. Kein doppelter Navigations-Tab.

## C1. VERBINDLICHER MULTIMODALER DIALOG: TIPPEN + SPRECHEN + MÄNNLICHE/WEIBLICHE ANTWORTSTIMME (17.11.2026)

**Vom Nutzer ausdrücklich beauftragt:** Jede Frage muss auf Wunsch entweder per Tastatur **oder Mikrofon** gestellt werden können; die Antwort muss lesbar sein und auf Wunsch vorgelesen werden. Bei der **Stimme des Assistenten für die Sprachausgabe** sind ausdrücklich **männlich** und **weiblich** als Auswahl vorzusehen. Eingabestimmen der Nutzer dürfen unabhängig von Geschlecht erkannt werden; die Auswahl bezieht sich auf die Stimme, mit der der Assistent antwortet.

### UX-/Produktvertrag
- **Eingabe:** immer sichtbar nutzbares Textfeld + Mikrofonbutton (Push-to-Talk, Start, Pause, Stop, Abbrechen, Aufnahmeindikator); nach Transkription das erkannte Gesprochene vor dem Absenden in einem editierbaren Textfeld anzeigen. Keine unbemerkte Dauermikrofon-Aktivierung. Eingabeform während derselben Unterhaltung frei wechseln.
- **Ausgabe:** Antwort immer als Text (inkl. Quellenkarten). Daneben Aktionen **Anhören, Pause, Fortsetzen, Stop**, optional stumm/automatisch vorlesen. Sprach- und Textmodus können in demselben Chat ineinander wechseln; beim Stopp keine verlorene Nachricht.
- **Stimmenwahl:** kompakte, gut erkennbare Auswahl **Männliche Stimme / Weibliche Stimme** (mit Vorschau/„Stimme testen“), bevorzugt auch konkret verfügbare Systemstimmennamen. Gewählte Stimme über Neustart und Sprachwechsel gemäß Benutzerentscheidung speichern; pro Sprache tatsächlich verfügbare Stimmen dynamisch erfassen. Wahl ist unabhängig vom Text-/Mikrofon-Modus. **Fehlt eine männliche oder weibliche Stimme in der gewählten Sprache auf dem Gerät, ehrlich kennzeichnen, nicht stillschweigend die andere Stimme behaupten oder eine ungeeignete Sprache ausgeben.** Entweder Download-/Systemhinweis bei möglichen Systemstimmen oder begründeter sprachkompatibler Fallback mit Nutzerbestätigung.
- **Stil:** warm, ruhig, respektvoll, natürliche Pausen, klare Schrift-/Audiobindung; Salām und klassische arabische Begriffe in verständlichem Fuṣḥā, fachliche Quellen- und Ṣaḥīḥ-/Sūrah-/Aṣ-Ṣiddīq-Aussprache vorab mit der vorhandenen DĀR-Aussprachebibliothek prüfen. **Qurʾān-Rezitation ausschließlich aus verifizierten vorhandenen Rezitator-Audiodateien**, nicht unkontrolliert synthetisierte Rezitation als authentisch ausgeben.
- **Ansicht:** iPhone und iPad responsive, Tastatur/Mikrofon/Player im Safe-Area-Layout; Audio-Wellenform nur wenn echt pegelgetrieben, kein dekorativer Fake; sichtbarer Live-Transkript-/Aufnahmestatus; RTL (ar/ckb), VoiceOver, reduzierte Animationen, große Schrift, Fokus, Bluetooth-/AirPlay-/Audio-Routing, Audio-Session-Interruption, Kopfhörer und Wechsel mit Qurʾān-Player testen.
- **Datenschutz:** Mikrofonfreigabe nur bei bewusster Betätigung; keine Hintergrundüberwachung; standardmäßig keine Uploads von Sprachdaten. Lokale Transkription nach Systemverfügbarkeit; Nutzer sieht und kontrolliert Text vor Absenden. Verlauf lokal/löschbar. Bei fehlendem Mikrofonrecht bleibt Texteingabe vollständig funktionsfähig.
- **Sprachabdeckung:** UI-Sprachen de/ar/en/tr/ku/ckb/bs/fr/es bleiben verpflichtend. Die tatsächlich unterstützten **Speech-to-Text-/Text-to-Speech-Sprachen** getrennt prüfen und in der UI klar zeigen; nicht behaupten, dass on-device Sprachein-/ausgabe in allen neun Sprachen verfügbar ist. Kein Auto-Wechsel auf externe Cloud-Dienste.
- **Kosten:** Sprachaufnahme, Speech-to-Text und Text-to-Speech mit **Apple-Bordmitteln ohne externe Token-/TTS-Abos** planen. Optional bestehende rechtmäßig nutzbare eigene Audioassets verwenden, aber keine neuen ElevenLabs-/Cloud-Kosten oder bezahlte Sprachmodelle auslösen.

### Konkrete technische Umsetzung – zuerst SDK-/Deployment-Target prüfen
- **Speech-to-Text:** bevorzugt `SpeechAnalyzer` + `SpeechTranscriber` und verfügbare lokale Sprachassets; Geräte-/Locale-Availability und Permission-/Info.plist-Bedingungen prüfen. Ältere OS-Versionen nur über `SFSpeechRecognizer` mit explizitem `requiresOnDeviceRecognition`, wo tatsächlich unterstützt; keine unbemerkte Servertranskription. Wenn nicht lokal unterstützt, manuelle Texteingabe anbieten.
- **Text-to-Speech:** `AVSpeechSynthesizer`, `AVSpeechUtterance`, `AVSpeechSynthesisVoice.speechVoices()`; Stimmfilter nach BCP47 `language`, `gender` (male/female/unspecified), `quality`, Identifier. Nutzerprofil hält z. B. ausgewählte Stimme und Locale in AppStorage; Voice-Preview. **Nicht aus dem Systemfeld `gender` ableiten, dass tatsächlich in jeder Locale beide Varianten bereitstehen.**
- **Sprachverarbeitung ist nicht das islamische Gesprächsmodell:** Speech-to-Text und TTS sind Ein-/Ausgabeschichten. Beleggebundene Antwortgenerierung bleibt der getrennte local-first AssistantEngine-Track aus Abschnitt D–I.
- **Testmatrix:** Sprech- und Texteingabe nacheinander in einem Gespräch, Mikrofon verweigert, Offline, kurze/lange Frage, arabischer Fachbegriff, Aussprache/Pausing, männliche/weibliche Stimme je unterstützter Locale, Locale-Wechsel, VoiceOver, Ohrhörer, Unterbrechungen, Qurʾān-Player-Audiokonflikte; reale Gerätetests/Recordings und klare Limits.

**Apple-Quellen:** https://developer.apple.com/documentation/speech ; https://developer.apple.com/documentation/speech/speechtranscriber ; https://developer.apple.com/documentation/avfaudio/avspeechsynthesisvoice ; https://developer.apple.com/documentation/avfaudio/avspeechsynthesisvoicegender ; https://developer.apple.com/documentation/avfaudio/avspeechsynthesizer

## D. Geprüfte Wissenspipeline (Grounded Retrieval)
Ablauf: Frage + Gesprächskontext → Intent-/Sprachanalyse → Retrieval ausschließlich aus redaktionell freigegebenem Bestand → maßgebliche Fundstelle mit originaler stabiler ID → ggf. Generierung mit lokalem Modell → strenge Verifikation von Quellen-IDs und wörtlichen Zitaten → Ausgabe mit klarer Trennung von Quelle/Einordnung oder beleggrenzender Abstinenz.

Original-Qurʾān darf nicht unbemerkt verändert werden. Authentizität, Isnād, Autor, Werk, Edition, Seite, Quellenlink und strittige Graduierung gehören zur verifizierten Provenienz. Ungeprüfte Internetfundstellen, Admin-Drafts, private Nutzerinhalte und ungeprüfte Modellgenerierung dürfen nicht als islamische Autorität eingelesen werden. Keine Quellen frei erfinden.

Suchindex: bestehende Repository-API erweitern statt Parallelarchitektur. Versionierte Original-IDs, arabische Unicode-/Ḥarakāt-/Hamza-Normalisierung, deutsche Transliteration, 9 Sprachen, Relevanzranking, locale-aware Search, lokale SQLite FTS5/gleichwertige Lösung. Optionale lokale Embeddings nur nach belegtem Nutzen.

## E. Dauerhaft aktuelle Quellen ohne App-Store-Pflichtupdate
Aus bestehendem Publisher eine **genehmigte öffentliche versionierte Wissensmanifest-Pipeline** erzeugen: sourceID, canonicalURL, locale, schemaVersion, publishedAt, reviewedAt, status (approved/withdrawn), SHA-256/Signatur, Versions- bzw. Delta-Paket. App lädt nur veröffentlichte und fachlich freigegebene neue geänderte Inhalte und atomar verifizierte Packs. Inkrementelle Reindexierung und Suchcache-Invalidierung. Bei Widerruf/tombstone sofort als Antwortquelle sperren. Offline last-known-good mit klarer Versionsanzeige, Rollback, keine stille Einpflege unsicherer Daten.

App-Aktualisierung realistisch bei Start/Wiederaufnahme/manuellem Refresh und in zulässigen OS-Hintergrundintervallen. Keine Echtzeit-Garantie und kein ungenehmigtes OneSignal/Cloudflare-Publishing. Produktinhalte dürfen neue Beiträge enthalten, das Modell muss dafür nicht permanent neu trainiert werden.

## F. Modellentwicklung – zwingend Zero-Paid-API
A: On-Device Foundation Models bei vorhandenem Apple-Intelligence-Modell, geeignetem Gerät, Locale und OS. Verfügbarkeit und supportsLocale zur Laufzeit prüfen; Kontextlimits beachten, Retrieval für lange Quellen. **Nur On-Device; Apple Private Cloud Compute nicht als lokal oder pauschal gratis darstellen.**
B: Core AI oder lokales lizenzrechtlich geprüftes alternatives Modell – nur wenn Größe, RAM, Energie, Modellqualität und alle neun Sprachen dies nach realen Messungen zulassen. Nicht annehmen, ein sehr kleines Modell wäre wie ein leistungsfähiger Cloud-Assistent.
C: Falls die lokal mögliche generative Qualität für islamische Wissensfragen nicht ausreichend ist: eine **ehrlich gekennzeichnete Quellen- und Lernassistenz** mit dialogischer Navigation, geprüften statischen Erklärungen, sinnvoller Suchverknüpfung und strukturierten Fragen statt falschem „Superintelligenz“-Versprechen.

**Verboten:** externe kostenpflichtige LLM-Endpunkte, Tokens/Credits/API-Key, automatischer Aboabschluss oder heimlicher Cloud-Fallback. Persönliche ChatGPT-Pläne sind keine API-Flatrate.

## G. Natürlicher Gesprächskontext und Datenschutz
Gesprächsverlauf kurz und nachvollziehbar als lokaler Zustand, pro Frage verbunden mit belegten Source-IDs; längeren Verlauf lokal verdichten ohne belegfremde Behauptungen. Nutzer kann Verlauf selbst löschen. Kein automatischer Export von Gespräch, Audio, Standort oder persönlichen Fragen; sprachbasierte Ein- und Ausgabe nur mit Berechtigung und nach aktueller Datenschutzprüfung. Kein freies unkontrolliertes Tool-Calling mit Produktiv-Schreibaktionen. Prompt Injection in importierten Inhalten ist untrusted data, keine Anweisung.

## H. Fachliches Evaluations- und Release-Gate
Bilde fachredaktionell verifizierte Testfälle mit Salām/Gespräch, Mehrturn, islamischem Begriffsverständnis, exakten Qurʾān-Belegen, Ḥadīṯ-Originalen/Bewertungen, ʿAqīdah/Fiqh, strittigen Stimmen, unmöglichen Fragen, halluzinierten Zitaten, Quellenwiderruf, neun Sprachen, RTL, Offline/Synchronisation und Prompt-Injection. 0 erfundene Quellenreferenzen und 0 als autoritativ präsentierte ungeprüfte Fatwas im Abnahmekorpus. Report zu Antwortqualität, Belegdichte, Abstinenz, Sprachunterstützung, Gerät, Antwortdauer, Speicher/CPU/Akku und App-Größe. Menschliche fachliche Prüfung unverzichtbar. Keine „100% islamkonform“-Werbebehauptung.

## I. Schritte für Work/Xcode
1. Aktuellsten echten DAR-NEXT-Branch und bestehende Assistant-/Content-Pipelines erfassen; Bestand nicht zurückbauen.
2. Sicheres Antwortdatenmodell und adaptive Source-/Chat-Views im eigenen Feature-Branch erstellen.
3. Verifizierbare lokale Wissensindex-/Delta-Sync-Simulation inklusive withdrawn-Quelle und Rollback testen.
4. Apple On-Device Foundation Models gegen Core AI-Lösungen und deterministische Fallbacks vergleichen. Geräte/Sprachen/Qualität/Lizenzen/Kosten tatsächlich testen.
5. Mehrturn-Pilot und reale UI-Tests zu Quellenkarten, iPhone/iPad, RTL, Reduce Motion, VoiceOver, Offline/Fehlern, Aktualisierungen und falschen Quellen.
6. Ergebnisse in Draft-PR und Qualitätsbericht dokumentieren. **Keine Freigabe für Produktivaktivierung, neue AI-Tab, Paid-API oder Cloud-Modelle ohne gesonderte Zustimmung.**

**Technische Ausgangsquellen (Apple, Nov 2026):**
https://developer.apple.com/documentation/foundationmodels/
https://developer.apple.com/documentation/foundationmodels/supporting-languages-and-locales-with-foundation-models.md
https://developer.apple.com/documentation/foundationmodels/generating-content-and-performing-tasks-with-foundation-models.md
https://developer.apple.com/core-ai/
https://developer.apple.com/videos/play/wwdc2026/326/

**In GitHub Issue #1791 als separaten Langzeit-Track pflegen, ohne die laufende Motion-/UX-Aufgabe #1789 zu blockieren.**
