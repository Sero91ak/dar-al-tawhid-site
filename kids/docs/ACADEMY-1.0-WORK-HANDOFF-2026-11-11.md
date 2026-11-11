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
| Ṣidq Aufnahmeabdeckung | 68/80 erstellt, 0/80 menschlich für die Kinder-App freigegeben |
| Ṣidq offene Aussprache | 12 Texte mit Fuṣḥā-Fachwörtern, Qurʾān-/Ḥadīṯ-Namen oder ﷺ auf explizitem Hold |

## Maschinengeprüfte Quellen

- `kids/data/academy-sidq-v4-voice-plan-v30.json`: exakte Ṣidq-Unterrichtsskripte, Alterskontexte und Antwort-Reihenfolge.
- `kids/data/academy-sidq-v30-safe-batches-20261111.json`: feste 16 Chargen × vier originalgetreue Texte, 4.249 Rohzeichen, zwölf gesperrte Fuṣḥā-Texte.
- `kids/tools/produce-academy-sidq-v30-safe-batch.py`: Produktionsweg über das bestehende DAR Voice Studio `kids_story`, ElevenLabs `eleven_v4`, Voice ID `DkU7j9uO4ZEtLD2iRZSH`.
- `kids/tools/test-academy-sidq-v30-staging-qa.cjs`: prüft 68 Audio-Hashes, Dateiverfügbarkeit, Stimme, Zeit, exakte Texte, Quelle und Null öffentliche Freigaben; exportiert Hörpaket.
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

Erstens die **68 echten Aufnahmen hörprüfen** (Fuṣḥā-Voll-Salām, Betonung, Stimmgleichheit, Ausklingen und Verständlichkeit), QA-Entscheidung pro Clip speichern und nur ausgewiesene problematische Sätze neu aufnehmen. Diese Prüfung lässt sich nicht allein durch Hashwerte ersetzen.

Zweitens die **12 Fuṣḥā-sensiblen Ṣidq-Zeilen** mit vorhandener Masterbibliothek in sprachlich sichere Abschnitte vorbereiten, Quellen und religiöse Terminologie verifizieren, einige maßgebliche Vergleichsaudios erzeugen und anhören, anschließend maximal in Viererchargen die endgültigen V4-Dateien erstellen. Keine globale PLS mit bekannten Kollisionen blind aktivieren.

Drittens die bestehenden **65 weiteren Lektionen** nach bestätigten Quellen und pädagogischen Qualitätskriterien prüfen, exakte, deduplizierte V4-Phrasen je Altersstufe vorbereiten, nach Risiko priorisieren und kostenkontrolliert produzieren. Die **142 gesperrten Lektionen** nicht als fertig oder audiofreigegeben ausgeben.

Viertens erst nach Freigabe sämtliche Audios im KIDS-Playback verfügbar machen und auf iPhone, iPad sowie Android/Fold testen; native TestFlight-App und App-Store-Checkliste separat abschließen.

**Erfolgsdefinition:** Nicht „CI grün“ oder „Datei existiert“, sondern geprüfter vollständiger Unterricht, korrekte Fuṣḥā, exakte Quellendeckung, korrektes Audio und belastbare App-Funktion für alle drei Altersstufen.
