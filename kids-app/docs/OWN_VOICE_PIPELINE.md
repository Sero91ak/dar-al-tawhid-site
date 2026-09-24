# Eigene Stimme + islamische Aussprache

## Ziel

DĀR AL TAWḤĪD Kids verwendet langfristig fertige Eigenproduktionen mit der autorisierten eigenen Stimme. Die zentrale Aussprachebibliothek liegt unter:

`data/pronunciation/pronunciation-rules.json`

Sie enthält 901 kanonische Begriffe und 3.719 Schreib-/Aussprachevarianten.

## Produktionsweg

1. Geprüften Erzähltext erstellen.
2. Sichtbare wissenschaftliche Transliteration unverändert lassen.
3. Vor der Sprachproduktion den Text mit `scripts/pronunciation/prepare-narration.mjs` aufbereiten.
4. Eigene Stimme: Raumhall und Hintergrundgeräusche reduzieren, natürliches Timbre bewahren.
5. Ganze Sätze/Abschnitte sprechen bzw. mit der eigenen autorisierten Stimmproduktion erzeugen.
6. Hörtest gegen Alias + IPA + QA-Sätze.
7. Fertiges Master-Audio als WAV archivieren; App-Fassung als M4A/AAC oder MP3.
8. Story-`audioResource` setzen. `NarrationService` spielt fertiges Audio bevorzugt ab.

## Fallback

Wenn noch kein fertiges Story-Audio vorhanden ist, nutzt die native Entwicklungsfassung AVSpeechSynthesizer. Auch dieser Fallback läuft vorab durch `PronunciationLexicon`.

Die Web-Kids-Vorschau lädt dieselbe Bibliothek aus `/test/kids/data/pronunciation-rules.json`.

## Qurʾān

Qurʾān-Rezitation wird niemals durch synthetische Erzählstimme ersetzt. Dafür bleiben echte Rezitationsaufnahmen zuständig.

## Weitere Apps / Farid Kids

Andere Kinder-/Audio-Anwendungen sollen keine eigene, abweichende Wortliste pflegen. Sie konsumieren dieselbe zentrale `pronunciation-rules.json` und denselben Voice-Production-Profile-Standard. Dadurch bleibt die Aussprache appübergreifend identisch.
