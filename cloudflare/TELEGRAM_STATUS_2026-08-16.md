# Telegram / Worker Secrets – Status

## Du hast nichts bewusst gelöscht
Die Werte lagen nie im Repo. Ein Agent kann sie **nicht** aus dem Nichts wiederherstellen.

Was passiert ist:
1. Cloudflare **Workers Builds** für `dar-admin-publisher` deployed oft die **Besucher-App** (Root-`wrangler.toml`) unter dem Namen `dar-admin-publisher` → `/health` wird 404 und zeigt die Website.
2. Danach fehlen am aktiven Worker die Secrets bzw. GitHub Actions hat sie unter diesen Namen nicht gesetzt.
3. Admin-/GitHub-Secrets existieren noch in **älteren Worker-Versionen** in Cloudflare. **Telegram-Token** war in GitHub Actions leer.

## Sofort in Cloudflare (wichtigste Aktion)
1. [Dashboard](https://dash.cloudflare.com) → Workers → **dar-admin-publisher** → **Settings** → **Build**
2. Entweder:
   - **Root directory** = `cloudflare` (damit `cloudflare/wrangler.toml` genutzt wird), **oder**
   - **Builds deaktivieren** (Deploy nur über GitHub Action „Deploy Admin Publisher Worker“)
3. Speichern.

Ohne diesen Schritt überschreibt Workers Builds den API-Worker immer wieder mit der Besucher-App.

## Secrets wieder eintragen (GitHub)
Repo → **Settings** → **Secrets and variables** → **Actions** → New repository secret:

| Name | Woher |
|------|--------|
| `TELEGRAM_BOT_TOKEN` | Telegram → @BotFather → dein Bot → API Token |
| `ADMIN_PUBLISH_SECRET` | Das Secret aus dem Admin (oft noch im Browser gespeichert) |
| `WORKER_GITHUB_TOKEN` | GitHub PAT mit `repo` (für Publish) |

Dann: Actions → **Deploy Admin Publisher Worker** → Run workflow (`main`).

## Prüfen
`https://dar-admin-publisher.sero91ak.workers.dev/health`

Soll enthalten:
- `"service":"dar-admin-publisher"`
- `"hasTelegramToken":true` (nach Token-Eintrag)
- `"hasAdminSecret":true`

## Was der Deploy-Workflow jetzt macht
- Deploy aus `cloudflare/`
- Wartet und **reclaimt** den Worker, falls Workers Builds ihn überschrieben hat
- Setzt vorhandene GitHub-Secrets per `versions secret bulk` (richtige Version-ID)
