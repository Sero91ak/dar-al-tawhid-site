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

The wrapper loads the live visitor app:

`https://dar-al-tawhid.de/#home`

Current modes:

- `.staging` -> `https://dar-al-tawhid.de/test/?env=staging&source=ios-testflight#home`
- `.live` -> `https://dar-al-tawhid.de/#home`

## Home-Screen-Widgets (iPhone / iPad / Mac Catalyst)

Nach dem ersten Archive mit aktiver Apple-Developer-Mitgliedschaft:

1. App auf dem Gerät installieren (TestFlight Internal).
2. Home-Bildschirm lange drücken → **+** → **DAR AL TAWḤĪD**.
3. Widgets wählen:
   - **Nächstes Gebet** (klein, mit Timer)
   - **Gebetszeiten Liste** (klein)
   - **Tagesgebetszeiten** (klein / mittel / groß)
   - **Qibla** (klein)
   - **Heute empfohlen** (mittel / groß)
   - **Āyah des Tages** (mittel / groß, Deutsch + Lautschrift)
   - **Duʿāʾ des Tages** (mittel / groß, Deutsch + Lautschrift)

Die Widgets folgen dem aktuellen Erscheinungsbild der App (Dunkel, Hell, Sanft, Royal, Layl, Aurora, Bordeaux). Ohne Standort gilt Berlin als Standard. Inhalte (Beitrag, Duʿāʾ) kommen aus der App bzw. `content/updates/daily.json`.

In Xcode unter Signing für **App und Widget** dieselbe Team-ID setzen und die App-Group aktivieren.

## iPad und Mac

Das Target ist `1,2` (iPhone + iPad) mit `SUPPORTS_MACCATALYST`. Alle Web-Funktionen laufen in der gleichen WKWebView. Mac: Destination „My Mac (Designed for iPad)“ oder Mac Catalyst. Android-Widgets folgen in einem späteren Schritt; zuerst iOS/TestFlight.
