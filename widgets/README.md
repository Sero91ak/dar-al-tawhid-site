# DAR AL TAWḤĪD – Prayer Times Widget

Isolated module. Errors here must never crash the main app.

## Structure

```
widgets/
  index.html                 # Mehr → Widgets control + preview
  shared/prayer-math.js      # Same solar math as main app
  shared/widget-log.js       # Internal error buffer
  storage/prayer-cache.js    # 60-day offline cache + widget config
  theme/widget-theme.js      # light / dark / royal tokens
  fallback/fallback-ui.js    # Safe empty/setup views
  prayer-times/
    prayer-widget.js         # Adapter + render (compact/medium/large)
    prayer-widget.css
  tests/prayer-widget.test.js
test/widgets/index.html      # Redirect into /widgets/ for Dar Test
```

## Phase status

- Phase 1: technical foundation ✅
- Phase 2: plain readable UI + themes ✅
- Phase 3: native iOS/Android home-screen widgets – later
- Phase 5: background images / ornaments – later

## Storage keys (widget-only)

- `darWidgetPrayerCacheV1`
- `darWidgetConfigV1`

Read-only from main app:

- `darPrayerSettingsV1` (location + method)
- `darThemeV1` (auto theme)

## Run tests

```bash
node widgets/tests/prayer-widget.test.js
```
