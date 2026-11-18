# DĀR HOME V5 implementation status

This is a HOME-only development branch based on HOME V4. It is a reviewed test preview, not a production release and not the complete V5 program.

## Changes in this branch

- The Salbei-Elfenbein style follows the saved HOME appearance preference. The older display appearance selector is synchronized with that preference.
- V5 sets minimum font sizes for the next-prayer display, countdown, daily translation, source, and prayer times on compact displays. Long daily Arabic text, German translation, and source citations remain available in a touch-scrollable reading region.
- HOME supports a fixed wallpaper from the gallery or automatic scene selection by local time. The screensaver can follow the HOME scene, use a separate fixed scene, or select automatically.
- Existing per-device settings and custom wallpaper storage remain in browser local storage.
- A manifest at `media/apple-tv/catalog.json` lists the imported Apple TV scenes, adhan artwork, source project, and image transformation.
- The five local adhan images have an image fallback chain: native Apple TV artwork, existing public prayer motif, then the existing cinematic replacement image.
- The isolated Worker preview bundles the manifest, images, HOME files, and V5 stylesheet.

## Imported Apple TV assets

Source: the existing local `DarAlTawhidTV/Assets.xcassets` catalog.

- Prayer artwork: Faǧr, Ḍuhr, ʿAṣr, Maġrib, and ʿIšāʾ.
- Wallpaper scenes: Kaʿba day, sunrise, and sunset.
- Brand asset: transparent 512×512 native brand mark.
- The eight large scene files were converted to JPEG quality 78, capped at 1920 px on their longest edge. This keeps transferred scene files around 0.4–0.8 MB each.
- The brand mark was resized to 512×512 PNG and retains transparency.

No per-image licensing metadata was present in the source asset catalog. The source provenance is recorded, but commercial redistribution rights have not been independently established.

## Verification

GitHub Actions browser QA passed in run 44376880705.

The run checks the 1024×600, 1280×800, 1600×900, 1920×1200, and 800×1280 layouts. It measures minimum font sizes and the settings touch target; exercises appearance synchronization, long-content scrolling in both themes, automatic wallpaper selection, independent HOME and screensaver scenes, light-theme screensaver colors, reduced motion, local asset loading, Faǧr cinematic art, and preference persistence after reload.

The isolated HOME preview was deployed to:

- https://dar-home-kiosk-preview.sero91ak.workers.dev/

The isolated Worker deployment completed in run 44376839953. Direct HTTP checks returned 200 for the preview document, scripts, stylesheet, catalog, logo, all three wallpaper scenes, and all five prayer images.

## Remaining work and limits

- This branch improves the current V4 design; it does not yet deliver the full requested information architecture and settings redesign.
- No physical 7-, 8-, or 11-inch device is available in this test. The five browser viewports are layout checks, not hardware validation.
- Offline recovery, reconnection behavior, full Adhan playback, energy use, contrast over every possible photograph, and touch behavior still need deeper review.
- Browser autoplay is not a guarantee of background Adhan playback. A future native device service is needed for that.
- No Swift, iOS, tvOS, Android, live website, or production Worker source was changed or deployed.
