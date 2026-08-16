# Telegram Status 2026-08-16

## Kurz
Der Worker-Code ist da. Die **Secret-Werte** kann kein Agent wiederherstellen – sie liegen weder im Repo noch in diesem Cloud-Agenten.

Du hast sie sehr wahrscheinlich **nicht bewusst gelöscht**. Was passiert ist:

1. Der Admin-Worker war zeitweise 404 / neu deployed.
2. Cloudflare-Worker-Secrets waren danach leer.
3. In **GitHub Actions Secrets** fehlen unter genau diesen Namen die Werte (Deploy-Log: „Secret übersprungen (leer)“):
   - `TELEGRAM_BOT_TOKEN`
   - `ADMIN_PUBLISH_SECRET`
   - `WORKER_GITHUB_TOKEN` / `DAR_GITHUB_TOKEN` / `REPO_GITHUB_TOKEN`
4. Andere Secrets **existieren** noch und wurden gesetzt: z. B. `ONESIGNAL_API_KEY_NEW`, Pexels/Unsplash/Pixabay.

## Secrets wiederherstellen (einfachster Weg)

### A) Werte holen
1. **Telegram-Bot-Token**  
   Telegram → [@BotFather](https://t.me/BotFather) → `/mybots` → deinen Bot → **API Token**  
   (Falls unsicher: Token dort neu erzeugen.)
2. **Admin-Publish-Secret**  
   Das Passwort/Secret, das du im Admin unter Worker-Secret speicherst.  
   Oft noch im Browser: Admin öffnen → ggf. schon vorausgefüllt.  
   Sonst ein neues starkes Secret wählen und **überall gleich** setzen.
3. **GitHub-Token für den Worker** (optional, für Publish aus dem Worker)  
   GitHub → Settings → Developer settings → Personal access tokens → Token mit `repo`-Rechten.

### B) In GitHub eintragen (damit jeder Deploy sie wieder sync)
Repo `Sero91ak/dar-al-tawhid-site` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Name | Wert |
|------|------|
| `TELEGRAM_BOT_TOKEN` | BotFather-Token |
| `ADMIN_PUBLISH_SECRET` | dein Admin-Secret |
| `WORKER_GITHUB_TOKEN` | GitHub PAT (empfohlen) |

Optional falls genutzt: `TELEGRAM_CHANNEL_ID`, `TELEGRAM_TOPICS_CHAT_ID` / `TELEGRAM_FORUM_CHAT_ID`.

### C) Worker neu deployen
Actions → **Deploy Admin Publisher Worker** → **Run workflow** → Branch `main`.

Danach prüfen:

`https://dar-admin-publisher.sero91ak.workers.dev/health`

Erwartung:
- `"ok": true`
- `"hasTelegramToken": true`
- `"hasAdminSecret": true`
- `"deployMarker": "telegram-secrets-user-restore-v4"` (nach diesem Redeploy)

## Alternative nur in Cloudflare
Workers & Pages → `dar-admin-publisher` → Settings → Variables and Secrets → Encrypt:

- `TELEGRAM_BOT_TOKEN`
- `ADMIN_PUBLISH_SECRET`
- `GITHUB_TOKEN`

Ohne die gleichen Namen in GitHub Actions gehen die Werte beim nächsten Sync/Deploy wieder verloren, wenn die GH-Secrets leer bleiben.
