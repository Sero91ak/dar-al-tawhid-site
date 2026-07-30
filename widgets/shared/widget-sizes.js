/**
 * DAR AL TAWḤĪD – Widget platform sizes & density (Phase 3)
 * Apple WidgetKit small + Android resizable density bands.
 */
(function (global) {
  "use strict";

  const VERSION = "widget-sizes-v1";

  /** Approximate system frames (CSS px) for previews. */
  const FRAMES = {
    "apple-small": { w: 158, h: 158, label: "Apple · Klein", platform: "ios" },
    "apple-medium": { w: 338, h: 158, label: "Apple · Mittel", platform: "ios" },
    "apple-large": { w: 338, h: 354, label: "Apple · Groß", platform: "ios" },
    "android-2x2": { w: 156, h: 156, label: "Android · 2×2", platform: "android" },
    "android-4x2": { w: 320, h: 156, label: "Android · 4×2", platform: "android" },
    "android-4x4": { w: 320, h: 320, label: "Android · 4×4", platform: "android" }
  };

  /**
   * Density from pixel box – used for Android drag-resize.
   * Priority: next prayer → time → countdown → list → city → extras
   */
  function densityFromBox(width, height) {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const area = w * h;
    if (w < 180 || h < 150 || area < 28000) return "xs";
    if (w < 260 || h < 190 || area < 52000) return "sm";
    if (w < 300 || h < 280 || area < 90000) return "md";
    return "lg";
  }

  function layoutForDensity(density) {
    const d = String(density || "md");
    return {
      showBrand: d !== "xs",
      showBrandShort: d === "xs" || d === "sm",
      showNextLabel: d !== "xs",
      showCountdown: true,
      showList: d === "md" || d === "lg",
      showSunrise: d === "lg",
      showMeta: d === "lg",
      showStale: d === "lg",
      compactRows: d === "md"
    };
  }

  function normalizeSize(size) {
    const s = String(size || "medium").toLowerCase();
    if (s === "apple-small" || s === "ios-small" || s === "small") return "apple-small";
    if (s === "apple-medium" || s === "ios-medium") return "apple-medium";
    if (s === "apple-large" || s === "ios-large") return "apple-large";
    if (s === "android" || s === "android-resizable") return "android";
    if (s === "compact" || s === "medium" || s === "large") return s;
    return "medium";
  }

  global.DarWidgetSizes = {
    VERSION,
    FRAMES,
    densityFromBox,
    layoutForDensity,
    normalizeSize
  };
})(typeof window !== "undefined" ? window : globalThis);
