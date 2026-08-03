# DAR KI-Video-Studio – Freigabebericht (Staging)

**Datum:** 2026-08-03  
**Branch:** `cursor/video-studio-provider-live-e34c` (PR #439, Draft)  
**Issue:** #437  
**Kein Merge auf main · keine Besucher-Veröffentlichung · keine Pushs**

## Umgesetzt (serverseitig)

| Punkt | Status |
|---|---|
| 1. `VIDEO_STUDIO_SIGNING_SECRET` | gesetzt |
| 2. R2-Binding in `wrangler.toml` | aktiv (`VIDEO_STUDIO_R2` → `dar-video-studio`) |
| 3. fal.ai Wan 2.5 Auto 9:16 | verdrahtet |
| 4. ElevenLabs feste Stimme | verdrahtet |
| 5. Shotstack **nur Stage** | `SHOTSTACK_HOST=…/edit/stage`, Probe OK |
| 6. Jobs / Status / Cron-Resume / `/process` | aktiv |
| 7. Budget pro Video / Monat | erzwungen |
| 8. Private R2 + signierte URLs | aktiv |
| 9. Qualitätsprüfung | aktiv |
| 10. Autonomer Testauftrag | **blockiert** (siehe Keys) |
| 11. Responsive Static-Checks | OK |
| 12. Guards (push / repo / scope) | OK |

Worker health: `videoStudioStore/R2/Fal/Voice/Shotstack/Signing` = true · Shotstack Host Stage.

## Auth-Probes (live, Stand nach Key-Korrekturen)

```json
{
  "fal": {
    "ok": false,
    "present": true,
    "length": 69,
    "hasColon": true,
    "httpStatus": 403,
    "reason": "User is locked. Reason: Exhausted balance. Top up at fal.ai/dashboard/billing."
  },
  "elevenlabs": {
    "ok": false,
    "present": true,
    "length": 50,
    "prefix": "sk_08",
    "voiceIdLength": 20,
    "httpStatus": 401,
    "reason": "Invalid API key"
  },
  "shotstack": {
    "ok": true,
    "host": "https://api.shotstack.io/edit/stage",
    "isStage": true
  }
}
```

**FAL_KEY** Format ok — Konto wegen **Exhausted balance** gesperrt.  
**ELEVENLABS_API_KEY** ist hinterlegt (`sk_08…`, Länge 50), wird von ElevenLabs aber noch als **Invalid API key** abgelehnt (widerrufen, falsch kopiert oder falsches Konto).

## Was du jetzt tun musst

1. fal.ai Guthaben aufladen: https://fal.ai/dashboard/billing  
2. Bei ElevenLabs einen **neuen** API-Key erzeugen und setzen (ohne Anführungszeichen, eine Zeile):

```bash
cd cloudflare
npx wrangler secret put ELEVENLABS_API_KEY
# Voice-ID nur falls nötig:
npx wrangler secret put ELEVENLABS_VOICE_ID
```

Danach prüfen:

```bash
curl -sS -H "X-Admin-Secret: …" \
  https://dar-admin-publisher.sero91ak.workers.dev/api/admin/video-studio/providers/status | jq .probes
```

Wenn `fal.ok` und `elevenlabs.ok` true sind:

```bash
node scripts/run-video-studio-autotest.js
```

## Kosten (Ziel / Schätzung bis zum echten Lauf)

- Clips: 3 × 5 s × ~0,05 € ≈ **0,75 €**
- ElevenLabs TTS: ~**0,08–0,15 €**
- Shotstack Stage: ~**0,10–0,25 €**
- **Zielsumme:** ≈ **1,00–1,20 €** / Video (Limit 1,20 €)

Tatsächliche Kosten erscheinen erst nach erfolgreichem Autotest im Job-Feld `costEur`.

## Freigabe

Nach gültigen Keys + fertigem Testvideo erneut vorlegen. **Kein main-Merge und kein Live-Push ohne ausdrückliche Freigabe.**
