# DAR AL TAWḤID iOS

Native iOS wrapper for TestFlight distribution.

## First TestFlight flow

1. Open `DarAlTawhid.xcodeproj` in Xcode.
2. Select the `DarAlTawhid` target.
3. In Signing & Capabilities, select your Apple Developer team.
4. Keep the bundle identifier or change it once before uploading.
5. Choose Any iOS Device, then Product > Archive.
6. Distribute App > App Store Connect > Upload.
7. In App Store Connect, create a TestFlight external group and public invite link.

The first build loads:

`https://dar-al-tawhid.de/test/?env=staging&source=ios-testflight#home`

Before the first real live release, change `environment` in `DarAlTawhid/WebAppView.swift` from `.staging` to `.live`.

Current modes:

- `.staging` -> `https://dar-al-tawhid.de/test/?env=staging&source=ios-testflight#home`
- `.live` -> `https://dar-al-tawhid.de/#home`

## Home-Screen-Widgets (iPhone / iPad / Mac Catalyst)

Nach dem ersten Archive mit aktiver Apple-Developer-Mitgliedschaft:

1. App auf dem Gerät installieren (TestFlight Internal).
2. Home-Bildschirm lange drücken → **+** → **DAR AL TAWḤĪD**.
3. Widgets wählen:
   - **Gebetszeiten** (klein / mittel / groß)
   - **Qibla** (klein)
   - **Heute** (klein / mittel)
   - **Āyah und Duʿāʾ** (klein / mittel)

Die App teilt Standort aus `darPrayerSettingsV1` über die App-Group `group.de.daraltawhid.app` mit den Widgets. Ohne Standort gilt Berlin als Standard. Tippen öffnet `daraltawhid://prayer|qibla|home|quran`.

In Xcode unter Signing für **App und Widget** dieselbe Team-ID setzen und die App-Group aktivieren.

## iPad und Mac

Das Target ist `1,2` (iPhone + iPad) mit `SUPPORTS_MACCATALYST`. Alle Web-Funktionen laufen in der gleichen WKWebView. Mac: Destination „My Mac (Designed for iPad)“ oder Mac Catalyst. Android-Widgets folgen in einem späteren Schritt; zuerst iOS/TestFlight.
