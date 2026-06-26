# DAR AL TAWḤID – Stabilität & Rollback

## Letzter gesicherter Stand

| Branch | Commit | Beschreibung |
|--------|--------|--------------|
| `stable-last-working` | `5154cfb` | Notfall-Fix Besucher-App (hardRefreshApp Syntax) – App startet wieder |

Aktueller Live-Stand: Branch **`main`** → **GitHub Pages** (`CNAME`: dar-al-tawhid.de).  
Cloudflare davor nur **CDN/DNS** + Worker **`dar-admin-publisher`** (Admin/Push).  
**Nicht** Cloudflare Pages/Worker `dar-al-tawhid-site` mit `wrangler deploy` — das blockiert Updates.

## GitHub Pages (Besucher-App) – Einrichtung

| Schritt | Wo | Einstellung |
|--------|-----|-------------|
| 1 | GitHub → Repo → **Settings → Pages** | Source: **Deploy from branch** → `main` → **`/` (root)** |
| 2 | Custom domain | **dar-al-tawhid.de** (HTTPS enforced) |
| 3 | Cloudflare **DNS** | `CNAME` `@` → **`sero91ak.github.io`** (Proxied orange) |
| 4 | Cloudflare **Workers & Pages** | Projekt **`dar-al-tawhid-site`** mit `npx wrangler deploy`: **Custom Domain entfernen** oder Projekt löschen |
| 5 | Nach Deploy | Workflow **Besucher-App GitHub Pages Live** oder **Purge live site cache** |

GitHub liefert die App; Cloudflare darf sie nur cachen, nicht als Worker neu bauen.

## Rollback (Notfall)

### GitHub / lokal

```bash
git fetch origin stable-last-working
git checkout stable-last-working
# oder einzelne Dateien:
git checkout stable-last-working -- index.html admin/index.html service-worker.js
```

### GitHub Pages (Besucher)

1. GitHub → Repo → **Actions** → **pages build and deployment** → letztes grünes Deploy
2. Oder: Commit auf `main` zurücksetzen und erneut pushen

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
2. Neue Features zuerst in **Test-App** (`/?env=staging`) prüfen
3. **Live-Veröffentlichung** nur wenn Besucher-App-Schutz im Admin **startklar** zeigt
4. Keine Bild-Editor-/Design-Änderungen während Push-/Kern-Reparaturen

## Healthcheck

- Öffentlich: `/admin/health.html` (Admin-PIN)
- Admin Upload: **Besucher-App Schutz** Panel
- Worker: `GET /api/admin/visitor-health` (mit Admin Secret)
- CI: `node scripts/app-health-check.js`
- **Version-Update-Schutz:** `node scripts/version-update-guard.js` (Banner-Schleife, HARD_REFRESH, Willkommens-Push)
- **Push-Schutz:** `node scripts/push-system-guard.js`

## Geschützte Update-Logik (nicht entfernen)

- Versions-Banner nur bei echtem `version.json`-Unterschied
- Schleifen-Schutz via `dar_version_update_pending` (sessionStorage, 120 s Cooldown)
- `Aktualisieren` → `repairPushConnection` (nicht nur `maintainPushHealth`) + `HARD_REFRESH` + Willkommens-Push
- `maintainPushHealth` → `syncPushRegistrationAndWelcome` (nicht `syncPushRegistrationOnly`)
- CI blockiert Deploy wenn Marker fehlen oder verbotene Muster auftauchen (`VERSION_UPDATE_GUARD` in `index.html` + `test/index.html`)
