# Native homescreen notes (Phase 3+)

This folder documents how the web widget maps to native shells later.
The live product today is the **PWA/web preview** under `/widgets/`.

## Apple WidgetKit (Small)

| Item | Value |
|------|--------|
| Preview size | 158×158 CSS px |
| Content | Next prayer · time · countdown |
| Deep link | `/widgets/?platform=apple&size=apple-small` |

Native implementation later: WidgetKit timeline provider reading the same offline day packets (`darWidgetPrayerCacheV1` / App Group shared store).

## Android App Widget (resizable)

| Item | Value |
|------|--------|
| Behavior | User-resizable (2×2 → 4×4) |
| Preview | Drag corner on `/widgets/?platform=android` |
| Density | `xs` / `sm` / `md` / `lg` via `DarWidgetSizes.densityFromBox` |

Native later: `AppWidgetProvider` + `resizeMode="horizontal|vertical"`; on size change map dp cells to the same density bands and reuse layout rules from `layoutForDensity`.

## Rule

Do **not** recalculate prayer times differently in native code. Reuse or port `widgets/shared/prayer-math.js` and the validated day packets only.
