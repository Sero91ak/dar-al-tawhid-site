# Telegram Status 2026-08-16

## Erledigt
- PR #568 gemerged
- Worker wieder erreichbar: `/health` → ok
- R2-Deploy-Blocker entfernt

## Offen / kritisch
Nach Redeploy meldet `/health`:
- `hasTelegramToken: false`
- `hasGithubToken: false`
- `hasAdminSecret: false`

Ursache: Worker war 404/neu aufgesetzt → Cloudflare-Secrets waren leer.

## Fix
Deploy-Workflow synct Kern-Secrets (Admin, GitHub-Token-Aliase, OneSignal, Telegram) nach `wrangler deploy`.

Wenn `TELEGRAM_BOT_TOKEN` nicht als GitHub Actions Secret existiert, muss er einmalig gesetzt werden:
`wrangler secret put TELEGRAM_BOT_TOKEN`
