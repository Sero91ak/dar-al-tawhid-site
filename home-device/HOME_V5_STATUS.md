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

GitHub Actions browser QA passed in run 44392596242. The run covered 1024×600, 1280×800, 1600×900, 1920×1200, and 800×1280. It verified minimum text sizes, the settings touch target, no bottom navigation, theme synchronization, long Arabic/German/source content scrolling in both themes, automatic and separate wallpapers, reduced motion, local asset loading, Faǧr artwork, and preference persistence.

The same run simulated offline and online browser states. Prayer times remained locally calculated while offline, and the online DĀR feed returned after reconnection. This is browser network emulation, not a physical device or prolonged offline test.

The landscape settings category rail and separate detail pane passed the updated browser assertion in run 44395473730. At 1280×800 the rail measured 243 px and the detail pane 922 px, with no overlap.

The isolated HOME preview is:

- https://dar-home-kiosk-preview.sero91ak.workers.dev/

The isolated Worker deployment completed in run 44395473800. A direct request to the deployed V5 stylesheet returned HTTP 200 and included the landscape settings layout. The preview URL above now serves the settings rail.

## Remaining work and limits

- The current branch improves the HOME V4 design and settings presentation. It does not yet complete the requested start-page information architecture or a full V5 redesign.
- The settings page has seven categories and working existing controls, but some capabilities are demos or placeholders. In particular, brightness is a browser visual filter, there is no secure phone-to-device pairing, and a native device service is still needed for reliable background Aḏān.
- Physical 7-, 8-, and 11-inch device validation, long-duration audio and energy tests, actual touch behavior, and visual review across the full photo library remain open.
- Browser autoplay is not a guarantee of background Aḏān playback. No native Aḏān service was built.
- No per-image license metadata was present in the local Apple-TV asset catalog. The source project was accessible and its artwork was reused, but commercial redistribution rights have not been independently established.
- No Swift, iOS, tvOS, Android, live website, or production Worker source was changed or deployed. Only the isolated HOME test Worker is in scope.
