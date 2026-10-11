# DĀR AL TAWḤĪD — web-first iOS shell migration (isolated preparation)

Status: **PREPARATION ONLY — NOT RELEASED / NOT DEPLOYED**  
Scope: adult visitor iOS app `ios/DarAlTawhid/` only.  
Production `main`, the visitor website, Dar Test, the Kids app and the App Store build must remain unchanged until explicitly approved.

## Goal

Maximize future GitHub / Cloudflare-controlled changes to presentation and app content, while preserving the iOS shell for platform capabilities. Ordinary layout, text, visual themes, web-player, navigation, online content and web loading graphics should no longer require native source changes.

## Observed starting point (2026-10-11)

- `DarAppShell.swift` loads `https://dar-al-tawhid.de/#home` for the live adult app.
- `WebAppView.swift` installs a separate native UIKit loading overlay, showing a logo, progress, `App wird geladen`, and the former text `Quran • Sunnah • Athar` (text-only correction already committed to main).
- The Swift iOS-specific style injection explicitly hides the web `#dar-soft-boot` overlay and removes its DOM element.
- `assets/app-soft-boot.js` already has the approved `QUR’ĀN • SUNNAH • ĀTHĀR` and is used by the visitor/test web app.
- Native code also injects layout/CSS overrides and bridges for platform features; these must not be removed blindly.

## Non-negotiable safety conditions

1. All experiments occur in this isolated branch. **Never merge or deploy from this preparation branch automatically.**
2. Preserve the currently installed App Store visitor app and its production loading sequence during development.
3. Preserve native push subscription and delivery, permission handling, widgets, haptics, sharing, deep links, external navigation, file/PDF handling, keyboard, safe areas and error/retry handling.
4. Do not alter site routes, Kids app, adult web content, user accounts, production caching policy, or service worker as part of a native-only migration.
5. A native WebView can keep a neutral first-paint/offline/error fallback, but web-controlled loader content must be visible and avoid a duplicate loading overlay. **No blank/black screen while waiting for a network response.**
6. No unreviewed change to Apple-specific security settings, entitlements, signing, bundle identifiers or App Store metadata.
7. Prefer small, reversible edits and exact regression tests. Reject unexpected diffs from unrelated work.
8. Never declare a deployment or store update successful without verifying the actual publish.

## Implementation phases

- Phase A — capture current native/web boot flow, startup timings, injected CSS/JS precedence, WKWebView lifecycle and native bridge dependencies.
- Phase B — in branch only, remove native suppression of web loader and arrange boot handoff so native first paint stays safe until the web loader renders; avoid two competing 0–100% bars.
- Phase C — move only *presentation* overrides to web-managed CSS/JS, preserving minimal WKWebView safe-area / platform bridges.
- Phase D — add static checks for loader ownership and a smoke test matrix for web and native flows.
- Phase E — test a newly built **TestFlight-only** candidate on real iPhones and iPad, with offline/cold start, warm start, refresh and load failure.
- Phase F — seek explicit release approval before merging any changes into main or publishing a new App Store build.

## Acceptance matrix (must pass before release)

- Cold and warm start: one loader, correct `QUR’ĀN • SUNNAH • ĀTHĀR`, valid accessible contrast; no double flash or stalled fake progress.
- Network unavailable / timeout: present a usable offline or retry path; do not leave user at a frozen loader.
- iPhone Pro Max, smaller iPhone and iPad: safe top/bottom insets, readable headers, tappable navigation, stable tab position.
- Return navigation, app/background resume, external links and deep links: same behavior as released app.
- Qurʾān reading/audio player and PDF/library readers: no regression.
- Native prayer notifications and their deep links, push consent/subscription, shares/haptics/widgets: functional.
- Web-only theme/text/loader changes reflect Cloudflare release without a new native App Store binary, including cache refresh when online.
- Visitor website and Kids app retain current behavior.

## Release policy

Only a tested native change should become an App Store update. Web-only changes follow test → verified Cloudflare deployment; errors use a versioned web rollback. Native fallback behavior must be preserved because changing a distributed app binary cannot be rolled back instantaneously via GitHub.

This document defines guardrails, **not** a completed implementation.
