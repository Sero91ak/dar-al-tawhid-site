# DAR AL TAWḤID – Stabilität & Rollback

## Letzter gesicherter Stand

| Branch | Commit | Beschreibung |
|--------|--------|--------------|
| `stable-last-working` | `5154cfb` | Notfall-Fix Besucher-App (hardRefreshApp Syntax) – App startet wieder |

Aktueller Live-Stand: Branch `main` auf GitHub → Cloudflare Pages.

## Rollback (Notfall)

### GitHub / lokal

```bash
git fetch origin stable-last-working
git checkout stable-last-working
# oder einzelne Dateien:
git checkout stable-last-working -- index.html admin/index.html service-worker.js
```

### Cloudflare Pages

1. Cloudflare Dashboard → Pages → Projekt → **Deployments**
2. Letztes grünes Deployment vor dem Fehler → **Rollback to this deployment**

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
