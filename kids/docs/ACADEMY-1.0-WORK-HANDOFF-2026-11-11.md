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
