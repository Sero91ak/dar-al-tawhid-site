# DAR AL TAWḤID – Stabilität & Rollback

## Letzter gesicherter Stand

| Branch | Commit | Beschreibung |
|--------|--------|--------------|
| `stable-last-working` | `5154cfb` | Notfall-Fix Besucher-App (hardRefreshApp Syntax) – App startet wieder |

Aktueller Live-Stand: Branch **`main`** → **Cloudflare Workers Static Assets** (`dar-al-tawhid-site`, statisch).  
Admin/Push: Cloudflare Worker **`dar-admin-publisher`** (`cloudflare/wrangler.toml`).  
Deploy: Cloudflare Git-Build **`npx wrangler deploy`** (Root-`wrangler.toml` mit `[assets]`) oder GitHub Action **Deploy Besucher-App (Cloudflare Workers)**.

## Cloudflare Workers Static Assets (Besucher-App) – Einrichtung

| Schritt | Wo | Einstellung |
|--------|-----|-------------|
| 1 | Cloudflare → **Workers & Pages** → **dar-al-tawhid-site** | Git: `Sero91ak/dar-al-tawhid-site`, Branch **main** |
| 2 | **Settings → Build** | **Deploy command:** `npx wrangler deploy` (korrekt für statische App) |
| 3 | Build command | **None** oder `npm run build` |
| 4 | Root directory | `/` |
| 5 | Repo-Root | `wrangler.toml` mit `[assets] directory = "."`, `.assetsignore` |
| 5b | API-Token (GitHub Actions) | **Account → Workers Scripts → Edit** + **Cache Purge** |
| 6 | GitHub Pages | Custom Domain **deaktivieren** (nur Cloudflare hosten) |

Nach fehlgeschlagenem Build: **View build** → Log prüfen, dann **Retry deployment**.

## Rollback (Notfall)

### GitHub / lokal

```bash
git fetch origin stable-last-working
git checkout stable-last-working
# oder einzelne Dateien:
git checkout stable-last-working -- index.html admin/index.html service-worker.js
```

### Cloudflare Pages (Besucher)

1. Cloudflare → **Workers & Pages** → **dar-al-tawhid-site** → **Deployments**
2. Letztes grünes Deployment → **Rollback** / **Retry**
3. Oder: GitHub → **Actions** → **Deploy Besucher-App (Cloudflare Pages)** erneut starten

### Cloudflare CDN

1. Dashboard → **Caching** → **Purge Everything**
2. Optional: **Development Mode** 3 h (Cache-Bypass)

### Cloudflare Worker (Admin Publisher)

1. Workers → `dar-admin-publisher` → **Deployments**
2. Vorherige Version → **Rollback**

### Cache leeren (Besucher)

- Startseite → **Aktualisieren**
- oder URL: `https://dar-al-tawhid.de/?appRefresh=1#home`
- Admin-Konsole: `__DAR_ADMIN_REPAIR__()` (nur Admin)

## Kritische Dateien

- `index.html` – Besucher-App (muss ohne JS-Syntaxfehler parsen)
- `admin/index.html` – Admin Command Center
- `service-worker.js` / `admin/sw.js` – getrennte Caches
- `content/posts/posts-index.json` – Beitragsindex
- `content/updates/daily.json` – Tagesinhalt für App + Daily-Push
- `cloudflare/worker.js` – Publish, Push, Gebetszeiten

## Deploy-Regeln

1. **Kein direkter Push auf `main`** ohne grünen CI-Check (`Canonical State Guard` + `App Health Check`)
2. **Massen-Lösch-Schutz:** `node scripts/repo-integrity-guard.js` blockiert Deploy/Merge wenn Kern-Ordner fehlen oder zu viele Dateien auf einmal gelöscht werden (Schutz gegen Vorfall `07a66819`)
3. Neue Features zuerst in **Test-App** (`/?env=staging`) prüfen
4. **Live-Veröffentlichung** nur wenn Besucher-App-Schutz im Admin **startklar** zeigt
5. Keine Bild-Editor-/Design-Änderungen während Push-/Kern-Reparaturen

## Healthcheck

- Öffentlich: `/admin/health.html` (Admin-PIN)
- Admin Upload: **Besucher-App Schutz** Panel
- Worker: `GET /api/admin/visitor-health` (mit Admin Secret)
- CI: `node scripts/app-health-check.js`
- **Repo-Integrität:** `node scripts/repo-integrity-guard.js` (Kern-Dateien, Mindestanzahl, Massen-Lösch-Limit)
- **Version-Update-Schutz:** `node scripts/version-update-guard.js` (Banner-Schleife, HARD_REFRESH, Willkommens-Push)
- **Push-Schutz:** `node scripts/push-system-guard.js`

## Geschützte Update-Logik (nicht entfernen)

- Versions-Banner nur bei echtem `version.json`-Unterschied
- Schleifen-Schutz via `dar_version_update_pending` (sessionStorage, 120 s Cooldown)
- `Aktualisieren` → `repairPushConnection` (nicht nur `maintainPushHealth`) + `HARD_REFRESH` + Willkommens-Push
- `maintainPushHealth` → `syncPushRegistrationAndWelcome` (nicht `syncPushRegistrationOnly`)
- CI blockiert Deploy wenn Marker fehlen oder verbotene Muster auftauchen (`VERSION_UPDATE_GUARD` in `index.html` + `test/index.html`)
