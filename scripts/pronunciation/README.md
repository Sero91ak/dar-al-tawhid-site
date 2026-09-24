# Aussprache-Tooling

Diese Skripte sind provider-unabhängig und bereiten Erzähltexte für die eigene Stimmproduktion vor.

- `pronunciation-library.mjs`: Loader und längste-Match-zuerst-Engine
- `prepare-narration.mjs`: CLI für Textdateien
- `validate-pronunciation-library.mjs`: Integritätsprüfung der 3.727 Regeln

Beispiel:

```bash
node scripts/pronunciation/validate-pronunciation-library.mjs
node scripts/pronunciation/prepare-narration.mjs story.txt story.spoken.txt
```

Der sichtbare Originaltext bleibt unverändert. Nur der Audiopfad erhält die Alias-/IPA-Fassung.

## Autoritative Verifikation

`validate-authoritative-pronunciation.mjs` prüft zusätzlich:

- Vorhandensein der hinterlegten IPA/JIPA/Qurʾānic-Corpus/ALA-LC-Quellen,
- Kernphoneme des Arabischen,
- exakte Brand-Overrides,
- Sonnenbuchstaben-Assimilation in normalen `al-`-Formen,
- formale IPA-Felder der Runtime-Regeln.

Die eigentliche TTS-Ausgabe bleibt provider-unabhängig; Alias ist Synthese-Fallback, IPA ist phonetische Referenz.
