# DĀR AL TAWḤĪD Voice Studio

Private Produktionsoberfläche für DĀR AL TAWḤĪD Kids.

## Verbindliche Adresse

Nur noch:

https://dar-al-tawhid.de/voice-studio/

Die alte Route unter \`/test/voice-studio/\` wird nicht mehr als Arbeitsadresse verwendet.

## Fertiger Stand

- eigenständige Route \`/voice-studio/\`
- PWA-Manifest und eigener Offline-Cache
- zentrale Aussprachebibliothek mit 902 Begriffen / 3.727 Regeln
- LOCKED-/VERIFIED-Erkennung
- sichtbarer Originaltext und interner Sprechtext getrennt
- lokale Voice Engine mit Health-/Analyze-/Generate-Endpunkten
- Chatterbox Multilingual V3 als lokale Engine
- zurückhaltendes ffmpeg-Mastering, falls ffmpeg vorhanden ist
- Qurʾān-/Langarabisch-Schutz: keine synthetische Rezitation
- Audio bleibt lokal und wird nicht in Git gespeichert

## Referenzstimme

Bevorzugt:

\`~/SerhatVoice/Serhat_Adobe_MASTER.wav\`

Fallback, wenn diese Datei nicht vorhanden ist:

\`~/SerhatVoice/Serhat_FINAL_REF.wav\`

Die Referenz soll trocken, sauber, natürlich, warm, sanft und klar sein.

## Mac

Einmalig:

\`scripts/voice-studio/install-mac.command\`

Danach liegen unter \`~/Applications/DAR-Voice-Studio/\`:

1. \`DĀR Voice Engine.command\`
2. \`Voice Studio öffnen.command\`

Im Alltag zuerst die Engine starten und danach das Studio öffnen.

## API

- \`GET /health\`
- \`GET /capabilities\`
- \`POST /analyze\`
- \`POST /generate\`

Standard: \`http://127.0.0.1:8787\`

Die Engine erlaubt CORS sowie Browserzugriffe auf den lokalen Loopback-Dienst. Sie bindet standardmäßig nur an \`127.0.0.1\`.

## Qualitätsregeln

- wissenschaftliche Schreibweise im sichtbaren Text unverändert lassen
- intern longest-specific-match-first
- kritische Begriffe als LOCKED behandeln
- eigene Stimme warm, sanft, klar, ehrlich und männlich halten
- keine harte oder metallische Klangästhetik
- Qurʾān-Rezitation nur als echte Aufnahme
