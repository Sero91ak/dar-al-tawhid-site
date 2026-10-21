# TAWḤĪD KIDS – bereits bezahlte ElevenLabs V4-Originale sicher übernehmen

**Ziel:** Die ersten **150 Quizfragen für 4–6-Jährige** ohne doppelte ElevenLabs-Kosten vertonen. Die 255 neuen Originalsegmente und alle vorhandenen 327 MP3s sind bereits gespeichert und technisch geprüft. Die fehlenden Originaldateien wurden zuvor in ElevenLabs Flows **bezahlt**, aber nicht in GitHub importiert. Die Kinder-App bleibt solange unverändert.

## Gesicherter Ausgangspunkt

- Alle **56 unterschiedlichen** alten V4-Generierungs-IDs sind in `kids/data/quiz-v4-prepaid-originals-import-index.json` einzeln dokumentiert. Davon sind **45** für die ersten 150 Fragen erforderlich. Etliche Aufnahmen werden für mehrere Fragen wiederverwendet.
- Die alten Aufnahmen dürfen **nicht erneut generiert** werden. Es geht ausdrücklich um **Download/Export der bereits abgeschlossenen Aufnahmen**, nicht um „Run“, „Generate“ oder erneutes Berechnen.
- Stimme **Serhat Abu Malik – Master**, `DkU7j9uO4ZEtLD2iRZSH`; Modell `eleven_v4`. Keine Fremdstimmen oder automatische Sprachersatzfunktion.

## Ein ZIP-Import ohne neue Sprach-Credits

1. Öffne die zugehörigen originalen Ergebnisse in ElevenLabs Flows und lade die schon bezahlten MP3-Dateien herunter. [ElevenLabs Flows](https://elevenlabs.io/app/flows). Im ursprünglichen Start-Flow liegen beispielsweise die vier Bestandteile der ersten Frage: [Flow der ersten Frage](https://elevenlabs.io/app/flows/3opB2L8NB0ChRtz3I28a).
2. Benenne die MP3s nach ihrer Generation-ID aus der Indexdatei, beispielsweise `ki4e57kvaTCDQxzLio3o.mp3`. Alternative: Lege `flow-audio-map.json` in dasselbe ZIP, z. B. `{"ki4e57kvaTCDQxzLio3o":"heruntergeladen-001.mp3"}`. Es ist nicht erforderlich, alle 56 gleichzeitig zu besitzen; Teilimporte sind möglich.
3. Packe die MP3s unter dem Namen `paid-flow-originals.zip` in **eine einzige ZIP-Datei**, ohne zusätzliche andere Dateien.
4. Lade die ZIP **ausschließlich in den Review-Zweig** `review/kids-quiz-v4-batch-001-020-20261014` in den Pfad `kids/assets/kids-quiz-audio/v4-paid-flow-inbox/paid-flow-originals.zip` hoch. Nicht auf `main` hochladen.
5. Die GitHub-Aktion `.github/workflows/kids-v4-prepaid-flow-restore.yml` erkennt die ZIP-Datei automatisch. Sie prüft Dateinamen gegen die 56 bezahlten IDs, MP3-Codec, Tonlänge gegenüber der ursprünglichen Generierung, Prüfsummen und den richtigen V4-Metadaten. Anschließend trägt sie die Originale im lokalen Audioregister ein, erstellt vorhandene vollständige Hörvorschauen erneut und entfernt den ZIP-Container aus dem aktuellen Review-Dateistand.
6. Der Import erfordert **0 neue ElevenLabs-Credits**. Änderungen sind ausschließlich für den Review-Zweig bestimmt. Erst die manuelle Hörkontrolle und anschließend die bestehenden Release-Gates dürfen die Test-App- und Live-Freigabe ermöglichen.

## Für Entwickler und GitHub-Agenten

```bash
python3 kids/tools/import_quiz_v4_prepaid_flow_originals.py --audit
python3 kids/tools/test_quiz_v4_prepaid_import.py
python3 kids/tools/import_quiz_v4_prepaid_flow_originals.py --zip kids/assets/kids-quiz-audio/v4-paid-flow-inbox/paid-flow-originals.zip
python3 kids/tools/quiz_v4_first150_offline_join.py
python3 kids/tools/qa_quiz_v4_saved_mp3.py
python3 kids/tools/quiz_v4_selected450_release_gate.py
```

**Wichtig:** Die Sprach- und Ausspracheprüfung bleibt auch bei einem technisch einwandfreien Import offen. Ein Testton darf niemals als fertige menschliche Originalaufnahme übernommen werden. Es werden keine Originale gelöscht oder kostenpflichtig neu erzeugt, falls eine ZIP-Datei fehlt oder nur teilweise gefüllt ist.

**Aktueller Freigabestatus:** `kids/data/quiz-curation-release.json` → `enabled=false` und kein Live-Push. Die übrigen 450 Reservefragen bleiben unter `kids/data/quiz-kids-expansion-reserve-450.json` erhalten.
