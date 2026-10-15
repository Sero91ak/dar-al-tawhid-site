# DĀR AL TAWḤĪD TV — native Android-TV APK from the official website

**Decision (owner, 15 Oct 2026):** Distribute native Android TV / Google TV APK through **https://dar-al-tawhid.de/tv/** without requiring the Google Play Store. Do not substitute the TV app with a browser PWA, and do not automatically replace the public APK while the Apple-TV-to-Android port is unfinished.

## Stable public surface: DO NOT replace on staging

| Surface | What is live before parity release |
|---|---|
| `/tv/` | Existing signed TV APK installation instructions + version-aware download card |
| `/tv.apk` | Site router 302 **pinned to** official `android-website-v1.54/dar-al-tawhid-tv.apk` |
| GitHub official Release | `android-website-v1.54`, TV package `de.daraltawhid.tv`, public version **0.1.54** |
| Native development | PR **#911**, isolated branch `feat/android-tv-apple-tv-layout-parity-20261009` |
| Current TV QA signed candidates | GitHub Actions artifacts, **internal only**; compiling them does not approve a public release |

The homepage, other browser apps, PWA, iOS, adult Android phone and Kids must remain unchanged by the TV release lane.

## Independent website release selector

- `tv/official-tv-release.js` works **only on /tv/**. It accepts both legacy `android-website-v1.<code>` and new independent `tv-website-v1.<code>` tags.
- It verifies public/non-draft/non-prerelease GitHub release metadata, an expected single TV APK asset, exact URL, `SHA256` digest, build timestamp and version-code suffix before displaying a version-aware download.
- New TV-only releases **do not require a smartphone APK**, and never change `/download/official-release-links.js` used by the existing Android phone storefront.
- If the newest candidate has invalid metadata, show no version-aware button and leave the pinned, known-good `/tv.apk` link accessible. On GitHub API outages or devices with unsupported browsers, users can still access the pinned short URL.
- **No auto-update installation**: website links prompt the normal Android installer. The user must grant the relevant downloader permission and approve installation. Do not advise disabling Play Protect.
- A new TV release shown on `/tv/` does not silently move `/tv.apk`; that short URL remains intentionally pinned until a separately reviewed website-router update.

## Manual TV-only publication (NEVER run until owner authorizes)

Workflow: `.github/workflows/android-tv-manual-web-release.yml`.

**Required before manual publication:**

1. Complete native Apple TV parity in `android/tv/`, including original scenes/background, D-pad focus, four dashboard modes, Adhān, Qurʾān, calendar/today, idle/screensaver, lifecycle/audio arbitration.
2. Device test the signed candidate on compatible Android TV/Google TV/Fire TV hardware: 1080p/4K, physical remote, every control, foreground/background, network interruption, sound, font legibility, App reinstall and **upgrade of an existing v0.1.54 install without losing data**. Save results with PR #911.
3. Merge approved code to `main` without modifying consumer apps. Run **DĀR AL TAWḤĪD TV · Native QA APK** on `main` using `workflow_dispatch` to build the exact final commit and a signing-key-compatible release candidate.
4. Manually invoke **DĀR AL TAWḤĪD TV · Signed website APK (manual approval)** on `main`, supply exact successful **main-branch** Native QA `source_run_id`, full `expected_commit`, `expected_version_code`, and both explicit approval fields.
5. The workflow checks the source run, SHA, merged code, APK package ID `de.daraltawhid.tv`, Leanback, monotonically increasing versionCode and expected versionName `0.2.<versionCode>`. It also checks that the APK **signing certificate is identical** to the currently published v0.1.54 TV APK. It aborts on signature mismatch.
6. Once all checks pass, **only** `dar-al-tawhid-tv.apk` and `SHA256SUMS.txt` are published as `tv-website-v1.<versionCode>`. **No other app artifact** is published or altered.
7. After a manual TV-release smoke test, update **only** the pinned `/tv.apk` target inside `cloudflare/site-router.js`, run the router health/regression guards, and deploy the website deliberately. Until then, the pinned v0.1.54 remains the guaranteed fallback.

**Never:** create a public GitHub Release using a short-lived internal test artifact unless its origin, signature, final merged build and actual device testing have been checked. Never publish automatically on each PR, push or CI success.

## Updates without a store

1. Shared Qurʾān/Tadabbur/content catalogs can continue to change via the existing backend where supported by the native app. This does *not* update native application code.
2. Native bug fixes and new Android TV features require a **new versionCode and a new signed APK**. The original `applicationId` and signing identity must be preserved for an in-place update.
3. Installed TV apps may be extended with a **check-for-update** function and a link to `/tv/`; installer confirmation is still required on ordinary consumer Android/Fire TV devices. Do not imply unattended silent updates.
4. Protect the known-good release: retain former GitHub release and checksum for rollback. Downgrading a newer Android installation generally requires uninstalling it, which risks user data; prefer a fixed APK signed with the same key and **higher** versionCode.

## Device compatibility

Android TV / Google TV and Android-based Fire TV variants support sideloading subject to their vendor restrictions. Amazon Vega OS, Samsung Tizen, LG webOS and tvOS **cannot** install an Android APK. Browsers on TVs often do not support a PWA installer or APK download manager: use a trusted downloader, file transfer or USB and follow the device's standard installation dialog.

## Regression tests

- `node tv/test-official-tv-release.cjs`
- `node --check tv/official-tv-release.js`
- CI: `.github/workflows/android-tv-download-page-qa.yml`
- Existing independent phone release selector untouched: `download/official-release-links.js`.
