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
