# TAWḤĪD KIDS – Lernakademie: verbindliche Work-Übergabe (11.11.2026)

**Bereich:** Nur TAWḤĪD KIDS. Weder die Erwachsenen-App noch DĀR AL TAWḤĪD NEXT, TV oder Dar Test verändern.
**Zweig:** `audit/kids-academy-audio-inventory-20261106`
**Review:** https://github.com/Sero91ak/dar-al-tawhid-site/pull/1705
**Live/TestFlight:** Kein Audio-Deploy erfolgt. Keine ungeprüfte Datei darf öffentlich abgespielt werden.

## Tatsächlicher Stand

| Bereich | Stand |
|---|---|
| Curriculum | 66 vorhandene Lektionen (Ṣidq + 65), 198 Altersfassungen (4–5 / 6–8 / 9–10), 528 Auswahlfragen |
| Weitere Einheiten | 142 der geplanten 208 Lektionen noch hinter Quellen-/Redaktionsfreigabe |
| Gesamt-Audioinventar | 1.588 eindeutige Kandidatenphrasen der bereits vorhandenen 66 Lektionen, keine automatisch öffentlich freigegebene V4-Masteraufnahme |
| Erste Lektion Ṣidq | 80 eindeutige exakte V30-Sprechtexte (drei Altersstufen, beide Profile), 8 Fragen |
| Ṣidq Pilot-V4 | 4 echte V4-Aufnahmen unter `kids/data/academy-audio-staging-sidq-v4-20261111.json` |
| Ṣidq V30 V4 | 64 zusätzliche echte V4-Aufnahmen unter `kids/data/academy-audio-staging-sidq-v30-20261111.json` |
| Ṣidq Aufnahmeabdeckung | 80/80 echte V4-Audiodateien im Prüfzweig erfasst, 0/80 menschlich für die Kinder-App freigegeben |
| Ṣidq Aussprachefreigabe | 12 Fuṣḥā-sensitive Dateien separat in Staging aufgenommen; ihre menschliche Aussprachefreigabe steht aus |

## Maschinengeprüfte Quellen

- `kids/data/academy-sidq-v4-voice-plan-v30.json`: exakte Ṣidq-Unterrichtsskripte, Alterskontexte und Antwort-Reihenfolge.
- `kids/data/academy-sidq-v30-safe-batches-20261111.json`: feste 16 Chargen × vier originalgetreue Texte, 4.249 Rohzeichen, zwölf gesperrte Fuṣḥā-Texte.
- `kids/tools/produce-academy-sidq-v30-safe-batch.py`: Produktionsweg über das bestehende DAR Voice Studio `kids_story`, ElevenLabs `eleven_v4`, Voice ID `DkU7j9uO4ZEtLD2iRZSH`.
- `kids/tools/test-academy-sidq-v30-staging-qa.cjs`: prüft die 68 ersten Audio-Hashes; die vollständigen 80 Dateien werden zusätzlich über `kids/tools/test-academy-sidq-v4-full-stage-v31.cjs` kontrolliert.
- `kids/tools/audit-academy-audio-inventory-v1.cjs`: globaler Curriculum- und Textbestand ohne Credits.
- GitHub CI: `Kids Academy Audio Inventory`, `Kids Academy V9 Curriculum Guard`, `Kids Academy Holistic Audit`, `Full Salam QA`, `App Lane Guard`.
- Erfolgreiche Produktionsaktion: `https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/42999589160`.
- 68-Clip Hörpaket (GitHub Artefakt, 14 Tage): `https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/43000631940`, **kids-sidq-v30-all-68-owner-v4-hearing-kit**.

## Harte Regeln – vor jeder weiteren Rechnung prüfen

1. Nur vorhandene eigene Stimme und `eleven_v4`, keine neue Clone/Flash-TTS-Stimme. Unveränderter `kids_story` Profilvertrag (stability .62, similarity .88, style .16, speed .91, boost true).
2. Vorhandene Aussprachebibliothek: `DAR AL TAWHID Arabic Master 2.9.122` mit ID `Q8w3SxtoVo8NSjsnlJEd` und Version `wSzgkGpAwEDiTak8DApc`. **Technischer Warnhinweis:** Voice Studio hängt die globale PLS derzeit bewusst nicht an; ein bekannter sprachübergreifender Konflikt beschädigt deutsche Wörter wie „Nur“. Deshalb wurden nur 64 deutsche risikoarme Segmente automatisiert; echte Fuṣḥā-Bestandteile erst fachgerecht vorbereiten, isoliert anhören und danach kombinieren.
3. Niemals künstliche Qurʾān-Rezitation oder bloß transkribierte „Rezitations“-Ersatzdateien; dafür ausschließlich vorhandene echte Rezitatoren.
4. Keine Originalphrase doppelt bezahlen: Hash aus vorbereitetem Text, Voice-ID, Modell, Story-Settings, Wörterbuchversion und SHA-256-Mediadatei. Keine verdeckte automatische Retry-Schleife.
5. Höchstens vier Clips und 1.200 vorbereitete Zeichen **pro Produktionsaufruf**. Bei Fehler bereits vorhandene Medien und Manifest sichern, vor Wiederholung prüfen.
6. Geprüfte Dateien dürfen erst **nach menschlicher Hörfreigabe** und sachlicher Quellenprüfung in den öffentlichen Manifest übernommen werden; TestFlight/Live nicht automatisch deployen.
7. Personalisiertes Profil: Display „Lieber Bruder Malik.“ / „Liebe Schwester Maryam.“; Audio-Clip „Lieber Bruder.“ / „Liebe Schwester.“ aus echter Masteraufnahme. Keine Live-Generierung von persönlichen Kindernamen.
8. Alter 4–5, 6–8 und 9–10 vollständig getrennt prüfen; keine Schreib- oder Sprachaufnahme-Quizbuttons, ausschließlich Auswahlantworten; sichtbare Quiz-Antwortreihenfolge muss gesprochener Nummerierung entsprechen.

## Nächste zusammenhängende Work-Ausführung

Erstens die **80 echten Aufnahmen hörprüfen** (Fuṣḥā-Voll-Salām, Betonung, Stimmgleichheit, Ausklingen und Verständlichkeit), QA-Entscheidung pro Clip speichern und nur ausgewiesene problematische Sätze neu aufnehmen. Diese Prüfung lässt sich nicht allein durch Hashwerte ersetzen.

Zweitens die **12 jetzt separat aufgenommenen Fuṣḥā-sensiblen Ṣidq-Zeilen** anhand vorhandener Masterreferenzen und ihrer Quellen abhören; ausschließlich fehlerhafte Aufnahmen nach genauer Diagnose korrigieren. Die globale PLS mit bekannten Kollisionen keinesfalls blind aktivieren.

Drittens die bestehenden **65 weiteren Lektionen** nach Quellen und pädagogischer Qualität prüfen. Die nächste 64er-Serie aus source-auditierten Texten liegt unter `kids/data/academy-v32-first64-source-audited-safe.json`; der deduplizierende kostenbegrenzte V4-Runner und sein CI-Gate sind neu unter `kids/tools/produce-academy-v32-first64-safe-batch.py` und `.github/workflows/kids-academy-v32-first64-production.yml` vorbereitet. Keine automatische Publikation. Die **142 gesperrten Lektionen** nicht als fertig oder audiofreigegeben ausgeben.

Viertens erst nach Freigabe sämtliche Audios im KIDS-Playback verfügbar machen und auf iPhone, iPad sowie Android/Fold testen; native TestFlight-App und App-Store-Checkliste separat abschließen.

**Erfolgsdefinition:** Nicht „CI grün“ oder „Datei existiert“, sondern geprüfter vollständiger Unterricht, korrekte Fuṣḥā, exakte Quellendeckung, korrektes Audio und belastbare App-Funktion für alle drei Altersstufen.

## Stand-Nachtrag (11.11.2026, 11:50 Europe/Berlin)

Die ältere 68/80-Zwischenmeldung ist überholt. `kids/data/academy-sidq-v4-coverage-v31.json` zählt nun 80/80 gespeicherte Originalaufnahmen bei 0/80 menschlichen Freigaben, davon zwölf Fuṣḥā-sensitive Komposita. Die nächste 64er-Quelle wurde nach Änderungen der Quizfragen erneut ohne ungeeignete freie Antworten exportiert. Der neue V4-Runner erhält eine kostenfreie CI-Vorprüfung und eine explizite einmalige Produktionsfreigabe; Erfolg und Kosten dürfen nur anhand realer GitHub-Workflow- und Manifestdaten gemeldet werden.

## Produktions- und Hörnachtrag – 11.11.2026

**Aktueller geprüfter Stand:** 144 echte ElevenLabs-V4-KIDS-Aufnahmen sind in der isolierten Review-Branch gesichert: 80 exakte Ṣidq-Texte und 64 weitere, aus dem gegenwärtigen Quellenstand ausgewählte Sprechtexte. Sämtliche 144 Audio-Kandidaten sind weiterhin **nicht** menschlich freigegeben und **nicht** öffentlich abgespielt. Die 12 Fuṣḥā-sensiblen Ṣidq-Kombinationen sind aufgenommen, aber ausdrücklich weiterhin einer hörenden Aussprachekontrolle vorbehalten.

**Neue 64er-Serie:** Der einmalige autorisierte, kostenkontrollierte GitHub-Lauf [43007057637](https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/43007057637) wurde erfolgreich abgeschlossen. Das Manifest `kids/data/academy-v32-first64-audio-staging-20261111.json` enthält 64 einzigartige Dateipfade, 64 SHA-256-Prüfsummen, ausschließlich `eleven_v4` / `DkU7j9uO4ZEtLD2iRZSH`, 236,4 Sekunden Gesamtdauer und `approvedForPlayback: false`. Die Inhalte stammen aus `kids/data/academy-v32-first64-source-audited-safe.json`; der korrigierte Export schließt die jüngsten nicht mehr zulässigen offenen Antwortaufforderungen aus.

**Interne Hörpakete:** Ṣidq 80/80 aus GitHub-Actions-Lauf [43006994534](https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/43006994534). Neue 64/64 mit vollständigen SHA-Prüfungen aus GitHub-Actions-Lauf [43008051296](https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/43008051296), Artefakt `TAWHID-KIDS-V32-64-V4-HOERPRUEFUNG`. Im Chat zusätzlich mobile Einzelspieler als verifizierte, eigenständige HTML-Dateien erstellt; diese sind keine Produktiv-Bestandteile.

**Offene Qualitäts- und Freigabegates:** Menschliche Prüfung aller 144 Aufnahmen auf Aussprache, Serhat-Masterstimme, Voll-Salām/Fuṣḥā, Störungen und Inhalts-/Quellentreue; 33 von 65 weiteren bestehenden Lektionen mit fehlendem Quellen-Audit sowie 142 von 208 geplanten Lektionen mit ausstehender redaktioneller Freigabe; App-Integration und native Geräte-Tests stehen noch aus. Keine automatischen weiteren bezahlten Batches ohne kostensicheren Dedup-/Quellen-Check und dokumentierte Freigabe; keine Änderungen an öffentlich verwendeten KIDS-/Adult-Manifesten.

---

## 11.11.2026 – Verbindliche Eigentümerkorrektur Fuṣḥā (V33)

**STOPP ALLER NEUEN KIDS-LERNAKADEMIE-V4-AUDIOAUFNAHMEN.** Der Eigentümer hat bei der Hörprüfung fehlerhafte Aussprache von **Sūrat at-Tawbah, Sūrat an-Naḥl, Ṣaḥīḥ Muslim** und weiteren arabischen Quellenbezeichnungen gemeldet. Der bisherige Sprechweg wandelte sogar Quellen- und Versnummern zu vorgetragenen deutschen Zahlwörtern um. Das war falsch.

**Klare Trennung von sichtbarem Text und Audio:**

| Sichtbare Angabe in der Lektion (bleibt unverändert) | Vorgesehener Sprechtext (ohne Quellen-IDs) |
|---|---|
| Sūrat at-Tawbah 9:119 | Sūrat at-Tawbah |
| Sūrat an-Naḥl 16:90 | Sūrat an-Naḥl |
| Ṣaḥīḥ Muslim 2607a | Ṣaḥīḥ Muslim |
| Qurʾān 9:119 | Qurʾān |

**Arabische Referenzschreibweise zur Fuṣḥā-Hörprüfung:** سُورَةُ التَّوْبَةِ · سُورَةُ النَّحْلِ · صَحِيحُ مُسْلِمٍ. Diese Schreibweise bzw. eine Latin-Normalisierung allein beweist **keine** korrekte TTS-Ausgabe. Echte Master-Audiobibliothek und eigene kontrollierte arabische Segmente zuerst prüfen und an realen Hörproben bestätigen.

Die Richtlinie `kids/data/academy-voice-policy-v10.json` enthält `production.ownerPronunciationHold.enabled: true`. Der zentrale KIDS-Generator `kids/tools/build-academy-v9-staging.py::generate_audio` sperrt sämtliche kostenpflichtige Erzeugung **vor** dem Cloudflare-/ElevenLabs-Aufruf. `kids/tools/academy_source_voice.py` erstellt unabhängig von sichtbaren Quellenangaben einen nummernfreien Sprechtext; unbekannte oder fehlerhaft artikulierte Surennamen bleiben auf Halt bis zur Hörfreigabe.

Die **zwölf Fuṣḥā-sensiblen Ṣidq-Originalaufnahmen** sind im bestehenden Staging ausdrücklich mit `ownerPronunciationHold` markiert; drei davon enthalten Quellen-IDs im Originaltext und sind für die bisherige Sprechfassung klar zurückgewiesen. Ursprüngliche Audiodateien werden zur Diagnose aufbewahrt, jedoch nicht veröffentlicht und nicht in den Freigabebestand übernommen. Auch die übrigen 132 Originale sind weiterhin **nicht** menschlich hörfreigegeben. **Kein öffentliches KIDS-/TestFlight-Deployment, kein Einfluss auf Adult-Apps, keine ungeprüfte Neuaufnahme und keine neuen Credits.**

Vor Aufhebung des Stopps: Fuṣḥā-Sprechausgaben mit Master-Audiobibliothek vergleichen, nummernfreie Sprechtexte kontrollieren, nur konkret bemängelte Aufnahmen mit ausdrücklicher erneuter Freigabe kostenbewusst neu produzieren, alle Hörproben auf dem echten Endgerät freigeben.

---


## 11.11.2026 – Erweiterung: GLOBALE Fuṣḥā-Ausspracheprüfung einschließlich Ṣidq/Ṣiddīq

Der Nutzer hat klargestellt: Nicht nur Sūrat at-Tawbah, Sūrat an-Naḥl und Ṣaḥīḥ Muslim werden falsch gesprochen, sondern weitere arabische Begriffe, **ausdrücklich auch der Begriff „Siddiq“**. Damit sind alle arabischstämmigen Ausdrücke und alle 144 noch nicht freigegebenen Aufnahmen in der KIDS-Lernakademie erneut unter einer **globalen Fuṣḥā-Hörsperre**; ein bestimmtes Wort darf nicht allein aufgrund einer Master-PLS-Umschrift als korrekt gelten.

**Bedeutungs-/Lautkontrast:** Ṣidq (صِدْق, Wahrhaftigkeit, kurze Vokalfolge) ist von Ṣiddīq (صِدِّيق, besonders Wahrhaftiger, verdoppeltes d und langes ī) zu unterscheiden. Die aktuelle erste Akademie-Lektion heißt Ṣidq; bei „Ṣiddīq“ handelt es sich nicht um dieselbe Lesung. Nicht stillschweigend das eine Wort für das andere verwenden.

**Befund in der echten Masterbibliothek:** `data/pronunciation/DAR_AL_TAWHID_ElevenLabs_ARABIC_MASTER_29122.pls` enthält 10.099 Einträge. Die dortigen Aliase für `Ṣidq` → `Sidq` und `aṣ-Ṣiddīq` → `as-Siddiiq` sind **nicht** unabhängige hörgeprüfte Fuṣḥā-Aufnahmen; sie können in ElevenLabs falsch umgesetzt werden. Der Cloudflare-Story-Voice-Kanal wendet das globale Wörterbuch wegen Sprachkollisionen nicht automatisch an. Keine Aktivierung der gesamten PLS als vermeintliche Lösung.

**Globale technische Sicherung:** `kids/data/academy-voice-policy-v10.json::production.ownerPronunciationHold` gilt für alle arabischen Wörter unabhängig von Schreibweise, Altersstufe, Quellenrolle oder Lernmodul und sperrt neue kostenpflichtige Produktionen. `kids/tools/audit-academy-arabic-pronunciation.py` wertet die 144 vorhandenen Staging-Texte gegen das arabische Masterlexikon aus und meldet 18 Kernbegriffe mit ihren Fundstellen; es setzt kein einziges Release-Flag und verbraucht keine Credits. Alle übrigen Aufnahmen müssen dennoch vollständig hörgeprüft werden, auch wenn ein Ausdruck nicht vom regulären Terminologie-Scan erkannt wird.

**Korrekturweg vor künftiger Produktion:** Arabische Begriffe mit korrektem Original und Vokalisation aus der vorhandenen Nutzer-Audiobibliothek abgleichen; bei gemischtem Deutsch-Arabisch nur geprüfte Sprachsegmente `de` / `ar` gemäß `data/pronunciation/voice-language-isolation-v1.json` verwenden; Referenznummern ausschließlich in der UI belassen; Probestücke auf dem echten iPhone abhören und Eigentümerfreigabe dokumentieren. Erst danach gezielte und kostenkontrollierte Re-Aufnahme statt pauschaler massenhafter Wiederholung. Die sichtbaren Lektionstexte und ihre Quellen sind nicht nachträglich für die TTS-Aussprache zu verfälschen.

**Kein Live-/TestFlight-/Adult-App-Change.**

---

## 12.11.2026 – V34: 144/144 kontrollierte Sprechentwürfe statt 144 fehlerhaft nachgesprochener Audios

**Präziser Stand:** Der KIDS-only-Exporter `kids/tools/prepare-academy-fusha-v34-review.py` hat **144/144** existierende, eindeutige Sprechtexte aufbereitet; **0 unklassifizierte Textzeilen** nach manueller Einarbeitung der Fälle `ﷺ` und `Allahs`. Der erfolgreiche Null-Credit-Lauf `43186376311` (11/12 Nov, Zeitstempel gemäß Actions) exportiert die vollständige Review-Matrix als Artifact `KIDS-ACADEMY-V34-FUSHA-REVIEW-144-NO-AUDIO`. Dies sind **neue Sprechskripte, keine neuen Audiodateien**.

**Sachliche Korrekturen:** Der hörbare deutsche Erklärungstext wird von arabischen Wörtern getrennt und in einem festen Schema als `de` und `ar` dokumentiert. Beispielsweise wird `Ṣidq` nur als eigenständiges `صِدْق`-Segment und `aṣ-Ṣiddīq` als eigenes `الصِّدِّيق`-Segment vorbereitet; beide dürfen nicht vermischt werden. `Sūrat at-Tawbah 9:119` wird im Sprechskript zu dem arabischen Titel `سُورَةُ التَّوْبَةِ` **ohne** gesprochene Quellen-/Versnummer. `Ṣaḥīḥ Muslim 2607a` analog zu `صَحِيحُ مُسْلِمٍ`. Die sichtbaren KIDS-Lektionsquellen bleiben unverändert, einschließlich Nummern. Die arabische Ṣalawāt-Ligatur `ﷺ` wird als arabisches Segensspruchsegment behandelt, **nicht** irrtümlich als synthetisch zu rezitierende Qurʾān-Passage.

**Sechs gesonderte Inhaltsprüfungen:** Die deutschen Genitivformulierungen mit `Allahs` werden nicht mehr als unnatürlich kombinierte deutsch-arabische Wörter an V4 übergeben. Stattdessen gibt es **sechs explizite, ausschließlich für den Hörtext vorgeschlagene Umformulierungen**, die `spokenOnlyGrammaticalParaphrase:true` und `paraphraseRequiresMeaningAndHearingApproval:true` tragen. Die sichtbaren Quizantworten/Fragen bleiben buchstabengetreu. Diese sechs Vorschläge müssen vor jeder Verwendung auf semantische Gleichwertigkeit und Aussprache geprüft werden.

**Definitiv deaktiviert:** Die alten Fuṣḥā-V30-Sprechvorlagen `kids/data/academy-sidq-v30-fusha-qa-batches-20261111.json` enthalten gesprochene Zahlwörter und deutsche Surennamen-Ersatzformen. `kids/tools/produce-academy-sidq-v30-fusha-qa-batch.py` erlaubt keine weitere kostenpflichtige Aufnahme daraus (nur schreibfreie Diagnose), und `kids/tools/build-academy-v9-staging.py` hält alle neuen Audioaufrufe aufgrund des Eigentümerstopps weiterhin vor dem API-Call an.

**Ganz wichtig:** 144/144 **technisch vorbereitete Sprechskripte** bedeuten **nicht** 144 korrigierte Aufnahmen. Erst nach realer Einzel-Hörprüfung mit der Eigentümer-Fuṣḥā-Audiobibliothek und V4-Masterstimme dürfen einzelne begrenzte Re-Recording-Piloten nach dokumentierter Eigentümerfreigabe produziert werden. 144 archivierte Originalaufnahmen weiterhin 0 öffentlich freigegeben. Kein TestFlight, kein Live, kein Erwachsenen-App-Change.

**Belege:** [Actions V34](https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/43186376311) · [PR #1705](https://github.com/Sero91ak/dar-al-tawhid-site/pull/1705)
