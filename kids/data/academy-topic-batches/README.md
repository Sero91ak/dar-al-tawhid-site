# TAWḤĪD KIDS · Lernakademie: themenweise Audioproduktion

## Stand 18.11.2026 – nur ein Themenbereich zur Zeit

Die Reihenfolge wird aus `kids/akademie/index.html` / `TOPIC_IDS` entnommen:

1. **Akhlāq**: `sidq` → `akhlaq-sabr` → `akhlaq-amanah` → danach die übrigen dynamisch registrierten Akhlāq-Lektionen.
2. **Adab**: `adab-salam` → `adab-worte` → `adab-respekt` → die übrigen.
3. **Fiqh**: `fiqh-taharah` → `fiqh-wudu` → `fiqh-salah` → die übrigen.
4. **ʿAqīdah**: `aqidah-tawhid` → `aqidah-iman` → `aqidah-ikhlas` → die übrigen.

Erst wenn ein Thema **alle** vorhandenen Altersfassungen (`4-5`, `6-8`, `9-10`), Profilanreden, Frage-/Antworttexte, Hinweise und Zusammenfassungen mit technisch validierten, akustisch geprüften und korrekt zugeordneten V4-Aufnahmen vollständig abdeckt, darf zum nächsten Thema gewechselt werden. Die Sequenz ist eine Produktionsreihenfolge; sie verändert **nicht** die pädagogischen Freischaltungen oder Kinder-Lernstände.

## Aktuell aktiv: Akhlāq / Ṣidq (Wahrhaftigkeit)

- Kanonische Quelle der Textschlüssel: `kids/data/academy-sidq-voice-plan-v18.json`, mit getrenntem vollständig ausgeschriebenem Salām aus `academy-full-salam-voice-plan-v19.json`.
- **58 gültige unterschiedliche Audiotexte** erfasst. Zwei historische verkürzte Salām-Varianten sind ausdrücklich aus der neuen Produktion ausgeschlossen.
- `akhlaq-sidq-inventory-v1.json`: 58 Einzelsätze mit Status und offenen Sprach-/Renderer-Prüfpunkten. Die Statuswerte sind **keine** Wiedergabefreigabe.
- `akhlaq-sidq-b01.json`: erste vier wortgenaue, rein deutsche Erzählpassagen für 4–5 Jahre, für beide Profile.
- **0/4 neue Audiodateien erzeugt**, **0/4 freigegeben**. Drei vorbestehende, noch nicht freigegebene V4-Pilotaufnahmen bleiben getrennt archiviert.
- Arabisches `ﷺ`, Fachwörter wie `Ṣidq`/ `Qurʾān` und der vollständige Salām müssen als überprüfte Arabisch-Segmente behandelt werden. Der globale arabische PLS darf nie einen deutschen Satz umschreiben.
- Quelle Wahrhaftigkeit: Qurʾān 9:119 und Ṣaḥīḥ Muslim 2607, siehe https://dorar.net/hadith/sharh/10209 . Textliche Nachweise ersetzen **keine** eigene akustische Abnahme.

## Sichere Ausführung der ersten Charge

Kostenfreier Vorabtest:

```sh
python3 kids/tools/build-academy-topic-batch-v1.py --dry-run
```

Tatsächliche Synthese erfolgt ausschließlich über das schon eingerichtete `/voice-studio/api/generate-with-timings` mit der bestehenden Serhat-Masterstimme und dem bewährten `kids_story`-Profil. Nur in einer autorisierten, geschützten Produktionsumgebung mit vorhandenem `ADMIN_PUBLISH_SECRET`:

```sh
export ELEVENLABS_TOPIC_JOB_ACK=kids-academy-akhlaq-sidq-b01-20261118
python3 kids/tools/build-academy-topic-batch-v1.py --generate
```

Der Geheimwert wird **nicht** in Code/Logs/Chat abgelegt. Der Lauf ist auf vier Sprachclips und maximal 350 vorbereitete Zeichen begrenzt, verwendet feste Text-SHA-Schlüssel und schreibt nur `kids/data/academy-audio-staging-akhlaq-sidq-b01.json` sowie real erzeugte `.m4a`-Dateien. Der öffentliche Player wird **nicht** verändert. Die Generierung muss von der autorisierten Umgebung tatsächlich ausgeführt werden; ein GitHub-Commit oder trockener CI-Test ist keine Audioerzeugung.

Jede neue Aufnahme benötigt danach eine **unabhängige inhaltliche und akustische Kontrolle** (u. a. Fuṣḥā, Ein-/Ausatmer, Wortgrenzen, Texttreue, Lautstärke, iPhone/iPad). Erst dann darf sie getrennt nach Freigabe in das öffentliche exakte Audio-Manifest überführt werden. Keine automatische Veröffentlichung und keine falschen Erfolgsmarkierungen.

## Nächster Produktionsschritt

Den aktuellen Ṣidq-Batch tatsächlich erzeugen und QA-fähig speichern. Danach weitere Ṣidq-Phrasen **nur innerhalb desselben Themas** und in weiteren begrenzten Chargen vorbereiten. Das nächste Akhlāq-Thema **Ṣabr** bleibt gesperrt, bis Ṣidq abgeschlossen ist.


## Verbindliche Freigaberegel: 100 % fertig → **LIVE** → nächstes Thema

**Nicht** nach dem ersten 4er-Batch wechseln. `Akhlāq → Ṣidq` besteht aus 58 gültigen unterschiedlichen Sprachtexten und drei Altersstufen. Vor einer Veröffentlichung werden alle 58 tatsächlichen Dateien einzeln gegen Text, Serhat-V4-`kids_story`-Identität, Quellennachweise, Fuṣḥā-Ausspracheprüfung, SHA-256 und Wiedergabe geprüft.

`kids/tools/publish-academy-topic-v1.py` verhindert die Teilveröffentlichung. Status ist kostenlos:

```sh
python3 kids/tools/publish-academy-topic-v1.py --status
```

Der Befehl `--publish` verweigert die Manifeständerung, solange ein einziger der 58 Texte fehlt oder der Einzelnachweis im `akhlaq-sidq-review-ledger-v1.json` nicht vollständig vorliegt. Er verwendet **nur reale Audiobinaries** aus der historischen V9-Staging-Sammlung oder aus separat erzeugten, identisch geprüften Ṣidq-Chargen; keine behaupteten oder fingierten Tondateien. Durch `--publish` wird zunächst das lokale `kids/data/academy-audio.json` zur Integration aktualisiert; **das allein bedeutet noch nicht, dass die Kinder-App live aktualisiert ist**.

`nextTopicLocked` ist das maßgebliche Feld dafür, ob `akhlaq-sabr` begonnen werden darf. Erst nach erfolgreichem PR/Merge in `main`, erfolgreichem produktivem Cloudflare-Deployment, Prüfung des live geladenen Audio-Manifests sowie Funktionstests auf iPhone/iPad und beiden Profilen werden `liveConfirmed: true` und `nextTopicLocked: false` gemeinsam dokumentiert. **Erst danach** `akhlaq-sabr` als nächstes Thema beginnen. Keine vorgezogene Freigabe, keine Freigabe nach bloßem CI-Erfolg, kein Ausfall-fallback auf Flash oder System-TTS. Die alte Produktionshistorie und der Lernfortschritt bleiben unverändert.

Jede neue Themenlektion wird als zusammenhängende, funktionsfähige Live-Version veröffentlicht, bevor die nächste startet.

## Zusätzlicher Produktionsstand · 18.11.2026

Der Nutzer hat die kostenpflichtige Erstellung mit der vorhandenen geklonten Serhat-V4-Masterstimme und die Veröffentlichung **ohne vorgeschaltete Hörproben** autorisiert. Diese Freigabe ersetzt keine real fehlenden Mediendateien.

Im vorhandenen ElevenLabs-Flow `zrB4zGdz9OTndLryQtIB` wurden inzwischen **26 unique Ṣidq V4 generation receipts** für 26 kanonische Texte erfolgreich bestätigt; außerdem gibt es eine ausdrücklich gewünschte zweite Aufnahme eines dieser Texte, somit **27 erzeugte Generationen**. Die exakten `sessionId`/`generationId`-Paare und Sprechtexte liegen unter `akhlaq-sidq-elevenlabs-generations-v1.json`. Keine der 26 neuen Binärdateien liegt bislang in GitHub, keine wurde live freigegeben. **Bitte nicht erneut kostenpflichtig erzeugen**, sondern die existierenden Generationen zuerst exportieren.

Die neuen Clips wurden über das verbundene ElevenLabs-Creative-Modell `eleven_v4` mit der echten geklonten Voice-ID `DkU7j9uO4ZEtLD2iRZSH`, `stability=0.62`, `similarity=0.88` produziert. Dieses Creative-Modell unterstützt **nicht** die bisherigen `kids_story`-Parameter `speed` oder `pronunciation_dictionary_locators`; ein direkter Export kann deshalb nicht mit `kids_story` bzw. „Fuṣḥā-Bibliothek angewendet“ etikettiert werden, solange diese Einstellungen nicht nachgewiesen sind. Keine falsche Profilbehauptung in einem Live-Manifest.

Für Fuṣḥā-Terminologie wurden die arabischen vokalisierten Formen von `Ṣidq`, `aṣ-Ṣiddīq`, `Sūrat at-Tawbah`, `Ṣaḥīḥ Muslim`, `Qurʾān`, `ﷺ` und dem vollständigen Salām anhand der verlinkten Qurʾān-/Ḥadīṯ-Quellen in `akhlaq-sidq-fusha-pronunciation-v1.json` hinterlegt. Diese arabischen Bestandteile sind **noch nicht** über die verpflichtende originale ElevenLabs-Aussprachebibliothek generiert, weil der aktuelle Connector deren Auswahl nicht erlaubt.

**Nächste ausführbare Etappe in einer verbundenen Work/Cloud-Browser-Umgebung:** Mit dem bestehenden ElevenLabs-Flow die 26 fertigen Medien einmalig exportieren, WAV/MP3 → korrektes `.m4a` (sofern nötig), genaue Dauer/SHA-256 prüfen, beim Import in `kids/assets/kids-academy-audio/` mit den Sprechtexten verbinden. Danach die fehlenden Fachbegriffe über den autorisierten DĀR-Voice-Studio-Pfad mit echter Fuṣḥā-Bibliothek erzeugen. Den Themenbereich erst nach vollständiger Audioabdeckung in einer einzigen zusammenhängenden Kinder-App-Version veröffentlichen. Der Nutzer hat Hörproben vor der Veröffentlichung ausdrücklich abgewählt; eine technische Datei-/Text-/Provenienzprüfung bleibt sinnvoll.
