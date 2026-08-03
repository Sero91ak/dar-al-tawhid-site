# DAR KI-Video-Studio – Freigabebericht (Staging)

**Datum:** 2026-08-03  
**Branch:** `cursor/video-studio-provider-live-e34c` (PR #439) · Staging `#436`  
**Kein Merge auf main · keine Besucher-Veröffentlichung · keine Pushs**

## Autonomer Test – ERFOLG

| Feld | Wert |
|---|---|
| Job | `video_msd33g8n_d444e26b` |
| Status | **completed** |
| Provider | fal.ai Wan 2.5 Auto |
| Dauer Clips | 15 s (3 × 5 s) |
| **Ist-Kosten** | **0,79 €** |
| Schätzung | 0,75 € |
| Laufzeit Pipeline | ~345 s |
| Shotstack | Stage only |
| QA | alle Checks bestanden |

Aussage: Imām Mālik — „Die letzten dieser Ummah werden nur durch das gerettet, wodurch die Ersten gerettet wurden.“

Signierte Admin-Vorschau (befristet): siehe Autotest-Report / Admin KI-Video-Studio.

## Kostenhinweis

**fal.ai ist nicht kostenlos.** Bewegte Clips werden pay-per-use berechnet (~0,05 €/s bei 480p).  
Shotstack Stage und Cloudflare R2 sind vergleichsweise vernachlässigbar; ElevenLabs TTS war in diesem Lauf ~0,04 € Anteil.

Zielbudget ≤ 1,20 €/Video: **eingehalten (0,79 €).**

## Probes

- fal: OK  
- ElevenLabs TTS: OK  
- Shotstack Stage: OK  
- R2 + Signing + Store: OK  

## Freigabe

Staging-Stand und Testvideo sind prüfbereit. **Kein main-Merge / kein Live-Push ohne ausdrückliche Freigabe.**
