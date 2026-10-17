# TAWḤĪD KIDS — neun bereits bezahlte `eleven_v4`-Originale exportieren

**NUR historische, schon bezahlte Dateien zurückholen. Keine Stimme regenerieren, keine API-POST- oder Guthabenbuchung.** Diese Anleitung dokumentiert den tatsächlich verbundenen ElevenLabs-Flow mit neun vorhandenen statischen Audio-Referenzen (Stand: 17.10.2026). Eine Referenz allein beweist NICHT, dass der Download bereits funktioniert. Quellen-/Aussprachefreigaben bleiben ausstehend.

## Original-Flow

[ElevenLabs: KIDS bereits bezahlte V4-Audios](https://elevenlabs.io/app/flows/n2ovmGko2iTlNWTAEqHk)

Vorgeschriebene Stimme: `DkU7j9uO4ZEtLD2iRZSH`, Modell `eleven_v4`. Alle neun Einträge müssen als **Original-MP3** aus dem bestehenden Generierungsresultat exportiert werden (keine erneute Erzeugung / kein anderes Modell).

| Bereits bezahlte Generation-ID / genauer Dateiname | Vorhandenes Flow-Audioelement |
|---|---|
| `GvXeGQ9Kr1lVy7LEAv5T.mp3` | KIDS previously-paid V4 praise original – recovery reference |
| `DX5z8FWaCS4FDx3KrloO.mp3` | KIDS 001 retry – previously paid V4 |
| `AToalNGbxiRe1zfOnDG3.mp3` | KIDS 001 explanation – previously paid V4 |
| `FGX65uXKWBnjULDxg3X1.mp3` | KIDS 002 question opening – previously paid V4 |
| `KIgCxJO3RDxhsIFJSYUB.mp3` | KIDS 002 question core – previously paid V4 |
| `UUmC2fDiXaV5W1IQSumA.mp3` | KIDS 002 question guidance – previously paid V4 |
| `aoKJuahenrKHfUE5OD9j.mp3` | KIDS 002 praise – previously paid V4 |
| `2xy9ZLej1wPTrnvAr9p7.mp3` | KIDS 002 retry – previously paid V4 |
| `1UAwmEQ77D4BmA9DttHZ.mp3` | KIDS 002 explanation – previously paid V4 |

## Import ohne neue Sprachcredits

1. Im vorhandenen Flow für jedes der neun Audioelemente die gespeicherte Originaldatei herunterladen, soweit der Account die Originaldownload-Funktion anbietet. Nicht `Generate`, `Regenerate` oder `Run` betätigen. Falls statische Referenz kein herunterladbares Original enthält: **anhalten**, keine Ersatzaufnahme bezahlen.
2. Die wirklichen Originaldateien exakt mit den Generation-IDs in der linken Spalte benennen; nur die bereits heruntergeladenen MP3-Dateien in `paid-flow-originals.zip` packen. Bereits vorhandene 47 Originale müssen nicht erneut geliefert werden.
3. Die ZIP-Datei ausschließlich im **Reviewzweig** nach `kids/assets/kids-quiz-audio/v4-paid-flow-inbox/paid-flow-originals.zip` einfügen. Keine API-Schlüssel, signierten Medienlinks, Nutzer-Cookies oder privaten Kontodaten ins Repository schreiben.
4. Der bestehende Workflow `kids-v4-prepaid-flow-restore.yml` importiert echte MP3s per `import_quiz_v4_prepaid_flow_originals.py --zip`, prüft Zuordnung, Tonformat, erwartete Aufnahmedauer und SHA-256, aktualisiert anschließend den Audio-Zusammenbau und die Zuordnung der 450 Fragen und löscht die temporär eingereichte ZIP aus dem Reviewzweig.
5. Nur wenn der technische Import nachweislich 56/56 Originale registriert, darf der technische Status für 4–6 Jahre **150/150** anzeigen. Das ist keine menschliche Hörfreigabe und keine Veröffentlichung in der Besucher-App.

**Erwartete Sperre:** Vorige authentifizierte ElevenLabs-GET-Versuche meldeten teilweise `HTTP 402 paid_plan_required`. Deshalb darf dieses Verfahren nicht mit einem neuen kostenpflichtigen TTS-Aufruf ersetzt werden.

**Bereits ohne Sprachcredits geprüft:** Historische GitHub-Backup-Suche hat bislang 40 Archive (ca. 217 MB) ohne Treffer auf diese neun IDs untersucht. Eine zusätzliche Suche nach weiteren Originalbackup-Dateien ist im Reviewzweig implementiert; deren Ergebnis vor einer Erfolgsmeldung prüfen.
