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

TestFlight und App Store laden dieselbe Live-Seite (wie Store-Build 89, ohne Glas-Split):

`https://dar-al-tawhid.de/#home`

`DarAppShell.usesStagingWeb` bleibt `false`. Dar Test (`/test/`) ist nur die Website zum Prüfen, nicht die native App.

Vor jedem neuen TestFlight-Upload in Xcode die **Build-Nummer über der letzten Store-/TestFlight-Nummer** erhöhen (nach 89 also 90), dann Product → Archive → App Store Connect.

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
