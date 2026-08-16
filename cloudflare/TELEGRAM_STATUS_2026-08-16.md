# Telegram Status 2026-08-16

## Befund
- Live `https://dar-admin-publisher.sero91ak.workers.dev/health` → **HTTP 404**
- GitHub Action `Deploy Admin Publisher Worker` schlägt seit mehreren Runs fehl
- Fehler: Cloudflare API Auth `10000` beim Zugriff auf R2-Bucket `dar-video-studio`
- Dadurch konnte der Worker (inkl. Telegram-Hashtag→Topic-Routing) nicht neu deployed werden

## Fix in diesem Branch
- `[[r2_buckets]]` aus `wrangler.toml` entfernt (Deploy-Blocker)
- Telegram-Health-Endpoint `/api/admin/telegram/health` ergänzt
- `/health` listet Telegram-Endpunkte

## Nach Merge / Deploy
1. Workflow „Deploy Admin Publisher Worker“ muss grün werden
2. `/health` muss `hasTelegramToken: true` zeigen
3. Optional: `/api/admin/telegram/route-last` mit Admin-Secret testen
4. R2 später wieder anbinden, wenn API-Token R2-Rechte hat
