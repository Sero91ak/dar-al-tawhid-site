# DAR KI-Video-Studio – Anbieterempfehlung, Kosten und Secrets

**Status:** Staging only · keine Live-Freigabe · keine Besucher-Pushs

## 1. Empfehlung (günstigster geeigneter Weg)

**Primär:** [fal.ai](https://fal.ai) als einheitliche Provider-API  
**Auto-Modus:** wählt den günstigsten **verbundenen** Anbieter unter dem Video-Limit  
**Empfohlener Default-Clipweg:** fal MiniMax / Wan-ähnliche 9:16-Routen (~0,04–0,07 €/s)  
**Stimme:** ElevenLabs mit **einer festen** deutschen Männerstimme (`ELEVENLABS_VOICE_ID`)  
**Schnitt/Untertitel/Logo:** Shotstack Edit API (Stage) – empfohlen für Branding & H.264-Export  

Warum fal.ai?
- ein Secret für mehrere Modelle (Kling, Luma, Veo, günstige Alternativen)
- echte Bewegungsclips (kein Zoom auf Standbilder)
- Pay-per-use, gut steuerbar mit Monats-/Video-Budget

## 2. Laufende Kosten (Richtwerte 2026)

Annahmen pro Video: **~20 s Clips** + Stimme + Compose, Zielbudget **≤ 1,20 €/Video**.

| Position | Schätzung |
|---|---|
| Videoclips (fal, ~0,05 €/s × 20 s) | **~1,00 €** |
| ElevenLabs TTS (~400–700 Zeichen) | **~0,08–0,15 €** |
| Shotstack Compose (Stage/Prod) | **~0,10–0,25 €** |
| Cloudflare R2 + Worker | vernachlässigbar bei geringer Stückzahl |
| **Summe pro Video** | **~1,20–1,40 €** |

Wenn das Limit 1,20 € fest bleibt: Auto-Modus bevorzugt kürzere Clips / günstigere fal-Routen oder blockiert bei Überschreitung.

## 3. Kostenschätzung Monat

| Videos/Monat | ca. Clip+TTS+Compose | Hinweis |
|---|---|---|
| **10** | **12–14 €** | passt zu Monatsbudget 15 € |
| **20** | **24–28 €** | Monatsbudget auf ≥ 30 € erhöhen |
| **30** | **36–42 €** | Monatsbudget auf ≥ 45 € erhöhen |

## 4. Benötigte Konten

1. **Cloudflare** (bereits vorhanden) – Worker, Durable Object, R2  
2. **fal.ai** – Konto + API Key  
3. **ElevenLabs** – Konto + feste Voice-ID der DAR-Männerstimme  
4. **Shotstack** – API-Key für Compose. **Stage** (`SHOTSTACK_HOST`) nur interne Vorschau. **Production** (`SHOTSTACK_PROD_HOST` = `https://api.shotstack.io/edit/v1`) für Endfassungen ohne Anbieter-Wasserzeichen. 

Optional später: Runway, Adobe, direkte Veo/Kling-Konten (Adapter sind vorbereitet).

## 5. Cloudflare Secrets (einmalig, nur serverseitig)

```bash
cd cloudflare
npx wrangler secret put FAL_KEY
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put ELEVENLABS_VOICE_ID
npx wrangler secret put SHOTSTACK_API_KEY
# Vars in wrangler.toml: SHOTSTACK_HOST=.../edit/stage , SHOTSTACK_PROD_HOST=.../edit/v1
npx wrangler secret put VIDEO_STUDIO_SIGNING_SECRET
npx wrangler secret put VIDEO_STUDIO_TEST_TOKEN   # nur Autotest/Staging
# optional:
npx wrangler secret put RUNWAY_API_KEY
npx wrangler secret put VIDEO_STUDIO_LOGO_URL
npx wrangler secret put VIDEO_STUDIO_WATERMARK_URL
```

### Key-Prüfung (ohne Geheimnis preiszugeben)

Nach dem Setzen der Secrets Worker deployen und als Admin prüfen:

```bash
curl -sS -H "X-Admin-Secret: $ADMIN_PUBLISH_SECRET" \
  https://dar-admin-publisher.sero91ak.workers.dev/api/admin/video-studio/providers/status \
  | jq '.probes'
```

Erwartet:

- `probes.fal.ok: true` (fal-Keys haben typisch `uuid:hex`, Länge oft ≥ 69)
- `probes.elevenlabs.ok: true`
- `probes.shotstack.ok: true` und Host mit `/edit/stage`
- Endfassung nutzt Production (`edit/v1`) – Stage nur bei `composePreview: true`

Wenn `fal` oder `elevenlabs` `ok: false` mit HTTP 401 melden: Secret **neu** setzen (`wrangler secret put …`), ohne Anführungszeichen, ohne führendes `Key `, ohne Zeilenumbruch mitten im Key.

R2 (einmalig):

```bash
npx wrangler r2 bucket create dar-video-studio
# danach [[r2_buckets]] in cloudflare/wrangler.toml aktivieren und deployen
```

Durable Object `VIDEO_STUDIO_STORE` ist in `wrangler.toml` bereits verdrahtet.

**Niemals** Keys in HTML, Browser, GitHub oder Admin-LocalStorage speichern.  
Der Client sendet nur `X-Admin-Secret` (wie die übrige Admin-App).

## 6. Staging-Freigabesperre

- Alles zuerst nur Staging / PR #436  
- Kein Merge auf `main` ohne ausdrückliche Nutzerfreigabe  
- `approve` setzt nur internen Freigabestatus – **kein** Besucher-Push und keine Live-Veröffentlichung  
