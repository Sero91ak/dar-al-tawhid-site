# Feed-Hintergrundbilder (automatisch + kuratiert)

## Struktur

- **JSON-Index:** `content/staging/feed-backgrounds/feed-backgrounds.json` (Dar Test) · `content/feed-backgrounds/feed-backgrounds.json` (Live)
- **Bilddateien:** `/assets/feed-backgrounds/{kategorie}/` und `/assets/feed-backgrounds/auto/{kategorie}/`
  - Kategorien: `nature`, `quran`, `dua`, `knowledge`, `tawhid`, `aqidah`, `adab`, `akhirah`, `mosque`, `books`, `abstract`, `gradients`

## Automatischer Sync

Cloudflare Worker: `syncFeedBackgroundImages()` in `cloudflare/feed-backgrounds-sync.js`

- Quellen: **Pexels**, **Unsplash**, **Pixabay** (nur Whitelist-Suchbegriffe)
- Ablauf: API-Suche → Download → Metadaten-Prüfung → lokale Speicherung (GitHub Assets) → Freigabe nur bei `approved: true`
- **Keine Hotlinks** im Besucher-Feed — nur `/assets/feed-backgrounds/...`
- Täglich + bei Pool &lt; 40 + manuell über Admin
- Tageslimit: 20 Downloads (konfigurierbar in `settings.dailyDownloadLimit`)
- Ziel-Pool: mindestens 80 freigegebene Bilder

### Worker-Secrets (einmalig)

```bash
wrangler secret put PEXELS_API_KEY
wrangler secret put UNSPLASH_ACCESS_KEY
wrangler secret put PIXABAY_API_KEY
```

## Admin

Tab **Feed-Hintergründe** → Bereich **Automatische Feed-Bilder**

- Status, Pool, letzte Sync, Quellen, Fehler
- Buttons: Synchronisieren, Aktive/Gesperrte, Sperren, Bereinigen

Manueller Upload (optional): Bild hochladen → prüfen → freigeben.

## Sicherheit

Ein Bild erscheint im Feed nur wenn:

- `status: active`, `approved: true`, `securityStatus: approved`
- `isIslamicallySafe: true`
- `containsHumans/Animals/Faces: false`
- `hasWatermark/hasLogo/hasTextOverlay: false`
- `allowedFor` enthält `feed`

Bei Unsicherheit: **Gradient-Fallback** (kein unsicheres Bild).

## Feed-Auswahl

`selectFeedBackground(item, theme)` in `assets/premium-feed-app.js`:

- Manuell: `backgroundId` + `backgroundMode: manual`
- Automatisch: Kategorie/Thema/Tags → Priorität → deterministischer Seed
- Anti-Wiederholung: letzte 15 Hintergründe
- Fallback: Theme-Gradient

## Legacy

`backgrounds-index.json` bleibt für Abwärtskompatibilität.
