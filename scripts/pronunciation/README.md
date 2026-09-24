# Aussprache-Tooling

Diese Skripte sind provider-unabhängig und bereiten Erzähltexte für die eigene Stimmproduktion vor.

- `pronunciation-library.mjs`: Loader und längste-Match-zuerst-Engine
- `prepare-narration.mjs`: CLI für Textdateien
- `validate-pronunciation-library.mjs`: Integritätsprüfung der 3.719 Regeln

Beispiel:

```bash
node scripts/pronunciation/validate-pronunciation-library.mjs
node scripts/pronunciation/prepare-narration.mjs story.txt story.spoken.txt
```

Der sichtbare Originaltext bleibt unverändert. Nur der Audiopfad erhält die Alias-/IPA-Fassung.
