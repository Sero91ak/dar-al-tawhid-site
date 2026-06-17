# DAR Admin Publisher Worker

Dieser Worker veroeffentlicht Admin-Beitraege serverseitig ins Repository `Sero91ak/dar-al-tawhid-site`.

Die Admin-App spricht nicht mehr direkt mit GitHub. Sie sendet Markdown und Dateiname an den Worker. Der Worker nutzt das Cloudflare-Secret `GITHUB_TOKEN`.

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
