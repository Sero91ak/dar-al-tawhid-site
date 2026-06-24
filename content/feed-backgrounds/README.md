# Feed-Hintergrundbilder (kuratiert)

## Struktur

- **JSON-Index:** `content/staging/feed-backgrounds/feed-backgrounds.json` (Dar Test) · `content/feed-backgrounds/feed-backgrounds.json` (Live)
- **Bilddateien:** `/assets/feed-backgrounds/{kategorie}/`
  - Kategorien: `nature`, `quran`, `dua`, `knowledge`, `tawhid`, `aqidah`, `adab`, `akhirah`, `mosque`, `books`, `abstract`, `gradients`

## Admin

Tab **Feed-Hintergründe** in der DAR Admin-App:

1. Bild hochladen (erzeugt WebP: Voll, Mobile 720×960, Thumb 400×400)
2. Kategorie & Tags setzen
3. Sicherheit bestätigen (keine Menschen/Tiere/Gesichter)
4. **Freigeben & aktivieren** — erst dann im Feed sichtbar

## Sicherheit

Ein Bild erscheint im Feed nur wenn:

- `status: active`
- `approved: true`
- `securityStatus: approved`
- `containsHumans/Animals/Faces: false`
- `allowedFor` enthält `feed`

## Feed-Auswahl

`selectFeedBackground(item, theme)` in `assets/premium-feed-app.js`:

- Manuell: `backgroundId` + `backgroundMode: manual`
- Automatisch: Kategorie/Thema/Tags → Priorität → deterministischer Seed (`item.uid`)
- Fallback: Theme-Gradient

Keine externen Hotlinks, kein Unsplash, kein Pinterest.

## Legacy

`backgrounds-index.json` bleibt für Abwärtskompatibilität, wird aber nicht mehr für neue Feed-Hintergründe verwendet.
