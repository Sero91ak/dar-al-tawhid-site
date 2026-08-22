# Worker-Secrets Status – 2026-08-22

## Du hast nichts gelöscht

Die Meldung **„Cloudflare Secret GITHUB_TOKEN fehlt“** in der Admin-App kommt vom Worker
`dar-admin-publisher`, nicht von einem gelöschten Admin-Button.

Aktueller Health-Stand (geprüft):

- `hasGithubToken`: **false**
- `hasAdminSecret`: **false**
- `hasOneSignalKey`: **false**
- `hasTelegramToken`: **false**

## Was passiert ist

1. Cloudflare **Workers Builds** für `dar-admin-publisher` deployed oft die Besucher-App
   (Root-`wrangler.toml`) und überschreibt den API-Worker → Secrets am aktiven Worker weg.
2. GitHub Actions kann nur Secrets zurückschreiben, die **in Repo → Settings → Secrets** liegen.
3. Deploy-Log vom **19.08.**: `WORKER_GITHUB_TOKEN`, `DAR_GITHUB_TOKEN`, `REPO_GITHUB_TOKEN`
   und `ADMIN_PUBLISH_SECRET` waren **leer**. Nur OneSignal + Telegram wurden damals synced.
4. Der Secret-Watchdog wollte alle ~20 Min. redeployen, scheiterte aber an fehlendem
   `actions/checkout` (`fatal: not a git repository`).

## Sofort reparieren (Werte musst du eintragen – Agent kann sie nicht erfinden)

### 1) GitHub Actions Secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Zweck |
|--------|--------|
| `WORKER_GITHUB_TOKEN` | GitHub PAT mit `repo` → wird Worker-Secret `GITHUB_TOKEN` (Live-Publish Bibliothek) |
| `ADMIN_PUBLISH_SECRET` | Admin-API Auth (gleiches Secret wie in Admin-Einstellungen) |
| `ONESIGNAL_API_KEY_NEW` | Push |
| `TELEGRAM_BOT_TOKEN` | Telegram |
| `TELEGRAM_TOPICS_CHAT_ID` | Forum-Topics (optional) |

### 2) Deploy auslösen

Actions → **Deploy Admin Publisher Worker** → Run workflow → Branch `main`.

### 3) Cloudflare Builds absichern

Dashboard → Workers → **dar-admin-publisher** → Settings → Build:

- **Root directory** = `cloudflare`, **oder**
- Builds **deaktivieren** (Deploy nur über GitHub Action)

### 4) Prüfen

`https://dar-admin-publisher.sero91ak.workers.dev/health`

Erwartet: `"hasGithubToken":true`, `"hasAdminSecret":true`.

Danach in der Admin-App erneut **Live veröffentlichen + Push**.
