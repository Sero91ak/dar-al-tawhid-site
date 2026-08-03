# DAR KI-Video-Studio – Freigabebericht (Staging)

**Datum:** 2026-08-03  
**Branch:** `cursor/video-studio-dar-brand-standard-e34c`  
**Kein Merge auf main · keine Besucher-Veröffentlichung · keine Pushs**

## Verbindlicher DAR-Standard (v2)

Umgesetzt in Worker + Admin:

1. **Kein Fremdwasserzeichen in der Endfassung** – Shotstack Stage nur interne Vorschau (`composePreview: true`). Standard-Render über **Production** (`SHOTSTACK_PROD_HOST` / `edit/v1`).
2. **DAR-Branding** – dezentes Wasserzeichen (`watermark-my-logo-full.png` / Logo), Social-Block mit Emblemen (Telegram, Website, Instagram).
3. **Bildbeitrags-Optik** – elegante Typografie, abschnittsweise Einblendungen (kein durchgehender Untertitelstreifen).
4. **Texthierarchie** – optional Brand → Sprecher (`… رحمه الله sagte:`) → Aussage in 2–4 Blöcken → Quelle → CTA/Social.
5. **Stimme** – exakter Vorlesetext, ruhigere ElevenLabs-Settings, keine Umformulierung.
6. **QA-Gate** – u. a. `noForeignWatermark`, `brandingComplete`, `textHierarchyOk`, `voiceExact`, `safeAreasOk`.
7. **Freigabeablauf** – erzeugen → Vorschau → Download → Teilen → intern freigeben. **Feed/Push nie automatisch.**

## Früherer Autotest (technisch)

| Feld | Wert |
|---|---|
| Job | `video_msd33g8n_d444e26b` |
| Status | completed (damals **Shotstack Stage**) |
| Ist-Kosten | ~0,79 € |
| Hinweis | Stage-Wasserzeichen möglich – **nicht** als Marken-Endfassung freigeben |

Neue Endfassungen müssen `shotstackEnv: v1` und QA `noForeignWatermark: true` haben.

## Freigabe

Staging/Test prüfen. **Kein main-Merge / kein Live-Push / kein Besucher-Feed ohne ausdrückliche Freigabe.**
