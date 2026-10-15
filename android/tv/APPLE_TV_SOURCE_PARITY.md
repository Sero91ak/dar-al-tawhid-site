# DĀR AL TAWḤĪD TV — tvOS-to-Android source parity contract

**Status: audit complete, native feature port IN PROGRESS — NOT 1:1 approved.**

## Source of truth — verified from owner-provided Xcode ZIP, 15 Oct 2026

The uploaded Xcode project contains an actual **DarAlTawhidTV** tvOS target and its tvOS shared Xcode scheme. It also contains a separate **DarAlTawhidTVMobile** target: do not confuse the two.

Original tvOS reference directory (inside the owner-provided archive, **not** copied to this public repository):
`DarAlTawhid/DarAlTawhidTV/`. This directory contains 42 Swift files and the original TV image assets. Use this as the authoritative reference. No screenshots or HTML previews may substitute for its controls or state-machine behavior.

Do **not** publish the owner's complete ZIP, vendor frameworks, signing materials, Info.plist secrets, or unreviewed resource bundles. Import only individually reviewed and optimized TV-owned assets. No consumer APK releases before owner approval and real-device tests.

## Core views / functional parity map

| tvOS original | Android TV implementation target | Acceptance contract |
|---|---|---|
| `DarAlTawhidTVApp.swift` | Android TV Activity + lifecycle-aware runtime coordinator | Own and coordinate playback, adhan, idle screensaver, onboarding, scene selection, foreground refresh |
| `ContentView.swift` | Native TV dashboard in Jetpack Compose for TV (not a phone WebView) | **Four modes** exactly: Gebetszeiten, Heute, Kalender, Qurʾān; preserve focus and dialog return behavior |
| `TVDashboardChrome.swift` | Focus-aware TV UI chrome | TV chips, left/right/up/down D-pad, focus rings, header/footer, no system focus-plate overlap |
| `TVTheme.swift` | Native design tokens and typography | Match SwiftUI colors, fonts, spacing, background dimming; test 1920×1080 and 3840×2160 |
| `TVSceneManager.swift` | Scene selector + state storage and lifecycle | User-selectable scenes, automatic defaults, crossfades and weather/time-dependent behavior |
| `TVKaabaBackground*.imageset`, `TVBrandMark.imageset` | Reviewed Android TV drawable assets | **Original owner-supplied PNGs exist**. TVKaabaBackground 1672×941; multiple sunrise/day/sunset/weather backgrounds are 7680×4320. Avoid an invented gradient as final artwork. Optimize for APK size/memory before import |
| `TVPrayer.swift`, `TVPrayerLocationPicker.swift` | Prayer engine + city/location picker | Same 12° twilight setting, asr factor, timezone, next-prayer countdown, location permission/fallback, saved settings |
| `TVWeather.swift`, `TVWeatherViews.swift` | TV weather display | Correct weather location, error behavior and idle handling |
| `TVVerseAndPrayerRows.swift`, `TadabburRemoteService.swift` | Qurʾān + same-āyah verified Tadabbur on home | Qurʾān text from Reader ONLY; never present Ḥadīṯ or Tafsīr as Qurʾān; pair by exact verse reference |
| `QuranTabView.swift`, `QuranContentService.swift`, `QuranPlaybackStore.swift` | Native Qurʾān reader and Media3 player | 114 Sūrah, synced Arabic/German āyah, Play/Pause/Stop/Prev/Next, continuous auto-advance, saved position, audio source fallback |
| `QuranReciterService.swift`, `QuranReciterPicker.swift`, `QuranAudioDiskPack.swift` | Reciter chooser, per-reciter downloads, on-disk audio cache | Same reciter IDs, selection persistence, offline handling and picker focus restoration |
| `TVAdhan.swift`, `TVAdhanPicker.swift`, `TVAdhanLibrary.swift`, `TVAdhanOverlay.swift` | Android Adhān schedule + overlay/player | Fajr-specific voice; chosen regular voice; schedule clock behavior; no double triggering; handle interruption and resume Qurʾān correctly. Android power-management constraints require explicit testing |
| `IdleScreensaverController.swift`, `HadithScreensaverRotationView.swift`, `ScreensaverRotationService.swift` | Native in-app screensaver state machine | Idle timer, user-input wake/exit, verified item rotation, no surprise screen replacement during reader or modal, seconds-based hold timings |
| `TVSettingsPanel.swift`, `DarOnboardingSystem.swift` | Native TV settings + onboarding/help | User settings, all navigable actions, persistence and modal focus-return |
| `RemoteContentService.swift`, `HadithRemoteService.swift`, `AppleTVContentRegistry.swift`, `TVOfflineMediaCache.swift` | Shared content repositories and atomic offline caches | Use existing common dar-al-tawhid.de content catalogs; background refresh on a timer, on app start and return to foreground; last known good cache survives failures |

## Original navigation / layout rules

- The tvOS `TVDashboardMode` values are **prayer**, **today**, **calendar**, **quran**. The current pre-port Android TV shell has three unrelated tabs; that is a known critical parity gap.
- The four large sections are displayed by a horizontal focusable selector. Each has its **own content hierarchy**, not a copy of the same dashboard.
- Prayer view: **left** countdown and prayer list (~40% width), **right** verified Qurʾān/Tadabbur (~48% width), separated by a vertical hairline.
- Today view: countdown/weather on left, a distinct today stack on right.
- Calendar view: Islamic calendar/holidays on left, next prayer/duʿāʾ and seven-day preview on right.
- Qurʾān view: in-dashboard reader with its own control row, reciter and Sūrah picker; remote Play/Pause should work when appropriate.
- Header contains brand, Adhān control, Qurʾān mini player, clock/date/weather. Modals: adhan, surah, reciter, scene, location, settings. Focus must return meaningfully on dismiss.
- Support system Back / D-pad and active-audio/screen-saver suppression; state restore after process restart.

## Time-based routines in the actual tvOS application

- `DarAlTawhidTVApp.swift` runs its prayer/adhaan due check at a **1-second** iteration while the app is active; use an Android-appropriate schedule model that handles TV background restrictions.
- `maintainRemoteContent()` refreshes catalogs in a **15-minute** loop in the app source. Android has only a coarse six-hour home refresh currently. Implement equivalent bounds without excessive wakeups and preserve the offline fallback.
- Screensaver activation/suppression and adhan/Qurʾān playback interaction have dedicated controllers; do not introduce independent competing media players that speak over one another.

## Media and asset reality

- The original tvOS ZIP **does include** `TVKaabaBackground.png`, `TVKaabaDay.png`, `TVKaabaSunrise.png`, `TVKaabaSunset.png`, weather variations, Adhān artwork and `TVBrandMark.png`.
- It does **not** include an MP4/MOV/HEVC video binary; the video is not required to start the native visual parity work.
- Bitmap assets must be downsampled to TV target resolution and checked for licensing, alpha/color profile, APK size, playback memory and gradient overlays. The current public Android APK must remain untouched during staging.

## Delivery gates

1. Confirm exact native mode state machine/focus model with unit tests.
2. Implement Compose for TV surface and compare screen by screen with the **actual tvOS SwiftUI source**; do not use the existing independent HTML prototype as the Android UI reference.
3. Implement audio and Adhān controllers, ensuring player arbitration, reciter picker and saved state.
4. Implement prayer engine/location/weather, today/calendar and scene selection using original resource names and rules.
5. Implement idle/screensaver/onboarding/settings and offline cache parity.
6. Run Android native build, unit/UI/D-pad tests, read 10-foot typography at 1080p/4K and compare on real Android TV/Fire TV. Verify all 4 modes and modals, Arabic typography, long translations, life-cycle/idle/adhaan interlocks.
7. Owner acceptance: only then merge PR #911, generate/publish new signed APK and change public `/tv.apk`.

**Current commit state:** This file is a parity *specification*, not an assertion that the above features are already implemented on Android.
