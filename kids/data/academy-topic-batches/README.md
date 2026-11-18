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
