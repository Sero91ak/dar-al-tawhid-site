# DĀR AL TAWḤĪD Voice Studio v1

Private Produktionsoberfläche für DĀR AL TAWḤĪD Kids.

## Was fertig ist

- Web-UI: `/test/voice-studio/`
- zentrale Aussprachebibliothek statt Zweitliste
- LOCKED-/VERIFIED-Erkennung
- Originaltext und interner Sprechtext getrennt
- lokale HTTP-Engine mit Health-/Capabilities-/Analyze-/Generate-Endpunkten
- aktive v1-Engine: Chatterbox Multilingual V3
- automatische, zurückhaltende Sprach-Nachbearbeitung mit ffmpeg, falls vorhanden
- Qurʾān-/Langarabisch-Schutz: keine synthetische Rezitation
- Publish-Button bleibt ohne Audio/Engine gesperrt
- R2/Cloudflare-Access-Schnittstelle bewusst noch ohne Secrets
- macOS-Doppelklick-Start

## Alltag auf dem Mac

Einmalig im Finder im Repository:
`scripts/voice-studio/install-mac.command`

Rechtsklick → Öffnen.

Danach liegen unter:
`~/Applications/DAR-Voice-Studio/`

zwei Starter:

1. `DĀR Voice Engine.command`
2. `Voice Studio öffnen.command`

Im Alltag:
- zuerst DĀR Voice Engine doppelklicken
- danach Voice Studio öffnen doppelklicken
- Text einsetzen
- Begriffe prüfen
- Audio erzeugen
- anhören und WAV speichern

## Referenzstimme

Standard:
`~/SerhatVoice/Serhat_FINAL_REF.wav`

Alternativ kann vor dem Start `SERHAT_VOICE_REF` gesetzt werden.

Die Referenz soll trocken, sauber und natürlich sein. Das Profil kommt aus:
`data/pronunciation/voice-production-profile.json`

## API

- `GET /health`
- `GET /capabilities`
- `POST /analyze`
- `POST /generate`

Standard: `http://127.0.0.1:8787`

## Provider-Strategie

Die Weboberfläche kennt keinen festen Anbieter. Der Provider sitzt ausschließlich hinter der lokalen API.

v1:
- Chatterbox V3 = funktionsfähiger lokaler Fallback

vorbereitet:
- OmniVoice/MLX
- ElevenLabs Professional Voice Clone

Ein späterer Provider-Wechsel verändert weder UI noch Aussprachebibliothek.

## Qualitätsregeln

- sichtbarer wissenschaftlicher Text bleibt unverändert
- intern longest-specific-match-first
- Brand-Overrides bleiben verbindlich
- kritische Begriffe werden im UI als LOCKED markiert
- Qurʾān-Rezitation nur als echte Aufnahme
- kein Audio wird in Git committed
- spätere Delivery über Cloudflare R2

## Cloudflare später

Für Produktion:
- Cloudflare Access vor die private Voice-Studio-Route
- Cloudflare Tunnel zum Mac-Dienst
- R2 für WAV/M4A/MP3
- Metadaten in Git/JSON, Audio selbst nicht in Git

Diese Schritte brauchen account-spezifische Secrets und werden daher nicht hart im Repository hinterlegt.
