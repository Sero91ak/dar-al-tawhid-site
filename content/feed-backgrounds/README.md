# Feed-Hintergrundbilder (eigene Uploads)

Hier kannst du **eigene Hintergrundbilder** für den Premium-Feed ablegen.

## Ordner

- `content/feed-backgrounds/` — Live (Besucher-App, erst nach Freigabe)
- `content/staging/feed-backgrounds/` — Dar Test / Staging

Lade Bilder in den jeweiligen Ordner hoch (z. B. `moschee-01.jpg`) und trage sie in `backgrounds-index.json` ein.

## backgrounds-index.json

```json
{
  "version": 1,
  "items": [
    {
      "id": "moschee-01",
      "url": "/content/staging/feed-backgrounds/moschee-01.jpg",
      "label": "Moschee Innenraum"
    }
  ]
}
```

- **url** oder **src**: Pfad zum Bild (relativ zur App-Root, z. B. `/content/staging/feed-backgrounds/mein-bild.jpg`)
- **label**: optional, nur zur Übersicht

## Regeln

1. **Automatisch generierte Hintergründe** bleiben Standard: islamisch-konforme **4K-Unsplash-Bilder** (Natur, Moschee, Qurʾān, Bibliothek — keine Menschen, Tiere, westliche Bücher).
2. **Eigene Uploads** werden **zusätzlich** gemischt (ca. jeder vierte Beitrag kann ein Upload-Hintergrund nutzen, wenn Einträge vorhanden sind).
3. Bilder idealerweise **hochauflösend** (mind. 1920×2400, besser 4K), Quer- oder Hochformat 4:5.
4. Nur Inhalte, die zur App passen (islamisch, ohne verbotene Motive).

## Testen

Änderungen zuerst unter **Dar Test** (`/test/`) in `content/staging/feed-backgrounds/` prüfen.
