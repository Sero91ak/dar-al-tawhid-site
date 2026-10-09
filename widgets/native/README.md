# Native homescreen widgets

The shared preview remains under `/widgets/`. Native Android support is connected to the adult Android shell.

## Android

Implemented providers:

- `PrayerTimesWidgetProvider`
  - resizable home-screen widget
  - reads the same location/method settings exported from `darPrayerSettingsV1`
  - refreshes from the existing public `/api/prayer/times` endpoint
  - keeps the last successful payload as an offline fallback
  - tap opens `daraltawhid://prayer`
- `DailyFaithWidgetProvider`
  - Qurʾānic duʿāʾ rotation
  - local/offline content
  - tap opens `daraltawhid://dua`

The in-app widget page uses Android 8+ `requestPinAppWidget()`; the Android launcher still shows its normal system confirmation before placement.

## PWA limitation

An installed PWA cannot register an Android `AppWidgetProvider`. Real launcher widgets therefore require the native Android package. The web/PWA widget page remains a preview/configuration surface.

## Apple

WidgetKit remains the native iOS implementation. Keep prayer-time calculation/source parity across both native platforms.
