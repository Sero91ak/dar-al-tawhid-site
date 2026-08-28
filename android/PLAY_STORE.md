# Play Store — DAR AL TAWḤĪD Android

Package: `de.daraltawhid.app`
Version: `1.0` (versionCode 1)
App: native WebView of https://dar-al-tawhid.de (same approach as iOS)

Privacy: https://dar-al-tawhid.de/privacy
Support: https://dar-al-tawhid.de/
Email: dal.al.tauhid91@gmail.com

## What you still do in the browser (Google)

1. Open https://play.google.com/console
2. Pay the one-time Play Console fee if the account is new ($25).
3. Create app **DAR AL TAWḤĪD**, default language German, app type **App**, free.
4. Declarations: no ads; target audience 18+ if you prefer, or 13+ if Play asks for mixed educational content — pick what matches the iOS rating.
5. Upload the AAB from Desktop: `DAR-AL-TAWHID-Play-1.0.aab`
6. Use Google Play App Signing (default). Keep `android/upload-keystore.jks` and `android/keystore.properties` as a backup. If those files are lost, you cannot ship updates with this upload key.
7. Store listing: copy from `PLAY_LISTING.md`. Icon `play/icon-512.png`. Feature graphic `play/feature-graphic-1024x500.png`. Phone screenshots: at least 2 from an Android device or emulator (1080px+).
8. Data safety: see `PLAY_DATA_SAFETY.md`.
9. Content rating questionnaire (IARC).
10. OneSignal: in the OneSignal dashboard add an **Android** app with package `de.daraltawhid.app`, then put Firebase `google-services.json` in `android/app/` and rebuild. Without that file, the store listing still works; native FCM push is incomplete.

## Digital Asset Links

After Play Console shows the **app signing certificate SHA-256**, put it in the live site file:

`https://dar-al-tawhid.de/.well-known/assetlinks.json`

A template is in the website repo under `.well-known/assetlinks.json`. Replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` with the Play App Signing cert (not only the upload cert).

## Build this AAB again

Requires JDK 17. This machine uses `~/.dar-build/jdk-17.0.13+11`.

```bash
export JAVA_HOME="$HOME/.dar-build/jdk-17.0.13+11/Contents/Home"
export ANDROID_HOME="$HOME/.dar-build/android-sdk"
cd android
./gradlew :app:bundleRelease
```

The signed AAB is `android/app/build/outputs/bundle/release/app-release.aab`.
