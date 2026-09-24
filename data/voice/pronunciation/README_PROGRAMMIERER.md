# DĀR AL TAWḤĪD - Islamisches Aussprachewörterbuch für ElevenLabs

Stand: 17.09.2026

## Inhalt
- 901 kanonische Begriffe/Phrasen
- 3719 konkrete Match-Regeln inklusive Schreibvarianten und Groß-/Kleinschreibung
- 3719 IPA-Regeln für ElevenLabs v3/kompatible Modelle

## Empfohlener Weg
Nicht tausende Regeln per Browser anklicken. ElevenLabs unterstützt den direkten Import eines PLS-Aussprachewörterbuchs über die API.

### Variante A - robuste Alias-Regeln
Datei: `dar_al_tawhid_alias_master.pls`

Diese Datei verwendet Ersatzschreibweisen und ist als breite Fallback-Lösung gedacht. Sie entspricht dem Prinzip des Studio-Feldes "Schreib es so, wie es klingt".

### Variante B - präzisere IPA-Regeln
Datei: `dar_al_tawhid_v3_ipa_master.pls`

Für nicht-englische IPA-Aussprache sollte ElevenLabs `eleven_v3` verwendet werden. IPA ist linguistisch präziser als eine deutsche Ersatzschreibweise, muss aber mit der tatsächlich geklonten Stimme hörgeprüft werden.

## API-Import
Endpoint:
POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file

Beispiel:
```bash
curl -X POST "https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F "file=@dar_al_tawhid_alias_master.pls" \
  -F "name=DAR AL TAWHID - Islamisches Aussprachewoerterbuch DE" \
  -F "description=Islamische Begriffe, Namen, Formeln und Schreibvarianten fuer deutsche Audioinhalte"
```

Alternativ kann `elevenlabs_create_from_rules_alias.json` mit dem Endpoint `/v1/pronunciation-dictionaries/add-from-rules` verarbeitet werden.

## Wichtige technische Hinweise
1. PLS-Matches sind case-sensitive. Darum enthält das Paket bewusst Varianten in Groß-/Kleinschreibung.
2. `dar_al_tawhid_islamic_pronunciation_master.csv` ist die zentrale Bearbeitungsdatei. Änderungen zuerst dort pflegen.
3. Alias-Regeln sind TTS-orientierte Lautschreibungen, keine wissenschaftliche Transliteration.
4. IPA-Regeln sind ein sehr guter Ausgangspunkt, aber die konkrete Ausgabe hängt weiterhin von Modell und geklonter Stimme ab. Vor Produktivbetrieb muss ein Hörtest der Core-Liste erfolgen.
5. Bei konfligierenden Regeln sollte immer der längere, spezifischere Ausdruck bevorzugt werden, z.B. `ʿUmar ibn al-Khaṭṭāb` vor `ʿUmar`.
6. Nicht gleichzeitig Alias- und IPA-Master mit identischen Graphemen auf dasselbe Projekt anwenden, bevor das Konfliktverhalten getestet wurde. Für v3 zuerst IPA testen; sonst Alias verwenden.

## Empfohlener QA-Ablauf
- Core-Regeln importieren und 20-30 repräsentative Sätze generieren.
- Problemwörter in ElevenLabs mit Play-Vorschau testen.
- Bei v3 problematische Wörter bevorzugt per IPA korrigieren.
- Danach Master-Datei importieren.
- Neue Begriffe immer in CSV + PLS + JSON synchron halten.

## Quellen zur ElevenLabs-Integration
- PLS-Datei-Import: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-file
- Programmatische Nutzung: https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/pronunciation-dictionaries
- Regeln hinzufügen: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/add

## Umfang / Grenze
Dieses Paket ist ein umfangreiches praktisches Masterlexikon für islamische deutschsprachige Inhalte. Es kann nicht buchstäblich jedes arabische oder islamwissenschaftliche Wort abdecken. Das Vokabular ist offen und wächst mit Büchern, Namen und Fachgebieten. Die Struktur ist deshalb absichtlich erweiterbar.