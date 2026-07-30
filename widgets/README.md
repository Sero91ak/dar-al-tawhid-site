# DAR AL TAWḤĪD – Prayer Times Widget

Isolated module. Errors here must never crash the main app.

## Structure

```
widgets/
  index.html                 # Mehr → Widgets (Apple / Android / Install)
  shared/prayer-math.js      # Same solar math as main app
  shared/widget-sizes.js     # Apple frames + Android density
  shared/widget-bridge.js    # Local refresh broadcast
  shared/widget-log.js
  storage/prayer-cache.js    # 60-day offline cache + widget config
  theme/widget-theme.js
  fallback/fallback-ui.js
  prayer-times/
    prayer-widget.js         # compact / medium / large / apple-* / android
    prayer-widget.css
  native/README.md           # Notes for future WidgetKit / App Widget
  tests/prayer-widget.test.js
```

## Phase status

- Phase 1: technical foundation ✅
- Phase 2: plain readable UI + themes ✅
- Phase 3: Apple small + Android resizable preview + install/deep links ✅
- Phase 5: background images / ornaments – later

## Sizes

| Size | Notes |
|------|--------|
| `apple-small` | 158×158 – next prayer, time, countdown |
| `apple-medium` | 338×158 |
| `apple-large` | full day |
| `android` | CSS `resize` + density `xs…lg` |
| compact / medium / large | generic previews |

## Storage keys (widget-only)

- `darWidgetPrayerCacheV1`
- `darWidgetConfigV1`

## Run tests

```bash
node widgets/tests/prayer-widget.test.js
```
