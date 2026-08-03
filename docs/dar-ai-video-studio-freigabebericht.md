# DAR KI-Video-Studio – Freigabebericht (Staging)

**Datum:** 2026-08-03  
**Branch:** `cursor/video-studio-dar-brand-standard-e34c`  
**Kein Merge auf main · keine Besucher-Veröffentlichung · keine Pushs**

## Verbindlicher DAR-Standard (v2 / Template v3)

Umgesetzt in Worker + Admin gemäß `docs/dar-ai-video-studio-endauftrag.md`:

1. **Kein Fremdwasserzeichen in der Endfassung** – Shotstack Stage nur interne Vorschau (`composePreview: true`). Standard-Render über **Production** (`SHOTSTACK_PROD_HOST` / `edit/v1`).
2. **DAR-Branding** – Wasserzeichen, Social-Embleme, CTA, Credit `by Serhat Abu Malik`.
3. **Themenatmosphäre** – Presets für Wissen / Dhikr / Adab / Manhaǧ.
4. **Bildbeitrags-Optik** – elegante Typografie mit gezielter Wort-Hervorhebung, abschnittsweise Einblendungen.
5. **Texthierarchie** – Brand → Sprecher → Aussage (2–4) → Quelle → CTA/Social/Credit.
6. **Stimme** – exakter Vorlesetext, ruhige ElevenLabs-Settings.
7. **QA-Gate** – u. a. `noForeignWatermark`, `brandingComplete`, `textHierarchyOk`, `voiceExact`.
8. **Freigabeablauf** – erzeugen → Vorschau → Download → Teilen → intern freigeben → optional Feed/Push manuell (Staging: kein Besucher-Push).

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
