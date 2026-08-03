# DAR KI-Video-Studio – kompakter Autonomie-Stand

**Branch:** `cursor/video-studio-compact-autonomous-e34c`  
**Basis:** Endauftrag (zweistufig: Text → Szenenbild → 15 s Video)  
**Staging zuerst · kein main-Merge · kein Auto-Feed/Push**

## Oberfläche

Kompakte 4-Schritte-Produktion in `admin/video-studio.html` / `test/admin-video-studio.html`:

1. Text einfügen (+ optionale Textaufteilung)
2. Szenenbild erzeugen / hochladen / Bibliothek
3. Kosten bestätigen → Video erzeugen
4. Vorschau · Speichern · Teilen · optional Feed/Push

Server-Aufträge standardmäßig eingeklappt.

## Backend

- `POST /parse-text`, `/estimate`, `/scene-image`, `/scene-image/upload`
- Jobs brauchen `sceneImageUrl` + `costConfirmed:true`
- 3 × 5 s **image-to-video** (`fal-ai/wan-25-preview/image-to-video`)
- Compose weiter Production ohne Fremdwasserzeichen
- Feed/Push nur manuell nach Freigabe (Staging: kein Besucher-Push)

## Abnahme

Neuen Text + Szenenbild in Staging prüfen, dann Testvideo manuell abnehmen.
