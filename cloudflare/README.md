# DAR Admin Publisher Worker

Dieser Worker veroeffentlicht Admin-Beitraege serverseitig ins Repository `Sero91ak/dar-al-tawhid-site`.

Die Admin-App spricht nicht mehr direkt mit GitHub. Sie sendet Markdown und Dateiname an den Worker. Der Worker nutzt das Cloudflare-Secret `GITHUB_TOKEN`.

## Deploy

### Option A: Lokal (empfohlen beim ersten Mal)

```bash
cd cloudflare
npm install -g wrangler   # falls noch nicht installiert
wrangler login            # Browser öffnet sich → Cloudflare anmelden
```

Secrets **einmalig** setzen (GitHub Fine-grained Token mit Repo-Schreibzugriff):

```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put ADMIN_PUBLISH_SECRET
```

`ADMIN_PUBLISH_SECRET` = dasselbe Passwort, das du in der Admin-App unter „Admin-Secret verbinden“ eingibst.

Deploy:

```bash
./deploy.sh
# oder: wrangler deploy
```

Prüfen:

```bash
curl https://dar-admin-publisher.sero91ak.workers.dev/health
```

Mit Admin-Secret (nächste Beitragsnummer):

```bash
curl -H "X-Admin-Secret: DEIN_SECRET" \
  https://dar-admin-publisher.sero91ak.workers.dev/api/admin/next-number
```

Erwartung nach Merge: `"postCount":391,"nextNumber":392`

### Option B: GitHub Actions (automatisch bei Push auf main)

In GitHub → Settings → Secrets → Actions:

| Secret | Inhalt |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token mit „Workers Scripts Edit“ |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID aus Cloudflare Dashboard |

Workflow: `.github/workflows/deploy-admin-publisher.yml`  
Manuell starten: Actions → „Deploy Admin Publisher Worker“ → Run workflow

## Einrichtung

1. `wrangler.toml.example` nach `wrangler.toml` kopieren.
2. Secrets setzen:

```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put ADMIN_PUBLISH_SECRET
```

3. Deploy:

```bash
wrangler deploy -c wrangler.toml
```

4. In Cloudflare eine Route auf die Website legen, empfohlen:

```text
dar-al-tawhid.de/api/admin/*
```

Dann kann die Admin-App mit der Standard-URL `/api/admin/publish` veroeffentlichen.

Wenn du stattdessen die `workers.dev` URL nutzt, trage sie in der Admin-App im Feld `Worker URL` ein, zum Beispiel:

```text
https://dar-admin-publisher.DEIN-SUBDOMAIN.workers.dev/publish
```

## Endpunkte

- `GET /health`: prueft Worker, Repo und ob Secrets vorhanden sind.
- `GET /api/admin/next-number`: liefert `postCount`, `nextNumber` und `maxSerial` aus `posts-index.json`.
- `POST /publish`: erstellt Markdown-Datei und aktualisiert `content/posts/posts-index.json`.

Die naechste Beitragsnummer basiert auf der Anzahl der Index-Eintraege plus 1 (z. B. 391 Beitraege → naechste Nr. 392), nicht auf der hoechsten Seriennummer im Dateinamen. Doppelte Titel werden beim Veroeffentlichen abgelehnt.

## Sicherheit

Der Worker verlangt `ADMIN_PUBLISH_SECRET` als Header `X-Admin-Secret`.
Der GitHub-Token darf nie in der Admin-App oder im Browser gespeichert werden.
# Deploy trigger 2026-06-17T07:41:15Z
