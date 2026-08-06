/**
 * DAR AL TAWḤĪD — Adaptive Layout Controller
 * Single source for Compact / Medium / Expanded.
 * Uses ResizeObserver + visualViewport; no UA / device model detection.
 */
(function (global) {
  "use strict";

  var COMPACT_MAX = 599;
  var EXPANDED_MIN = 840;
  var EXPANDED_MIN_HEIGHT = 600;
  var currentMode = "";
  var rafId = 0;
  var started = false;
  var resizeObserver = null;

  function resolveLayoutMode(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    /* Compact: cover display / phone / narrow split */
    if (w < 600) return "compact";
    /* Medium: Fold open portrait (~600–839), short height / flex mode, split */
    if (w < 840 || h < 600) return "medium";
    /* Expanded: Fold Ultra / tablet landscape / desktop (≥840 × ≥600) */
    return "expanded";
  }

  function measureViewport() {
    var vv = global.visualViewport;
    var w = Math.round(
      (vv && vv.width) ||
        document.documentElement.clientWidth ||
        global.innerWidth ||
        0
    );
    var h = Math.round(
      (vv && vv.height) ||
        document.documentElement.clientHeight ||
        global.innerHeight ||
        0
    );
    var offsetTop = vv && typeof vv.offsetTop === "number" ? vv.offsetTop : 0;
    return { width: w, height: h, offsetTop: offsetTop };
  }

  function navBottomCompact() {
    return "calc(max(7px, calc(env(safe-area-inset-bottom) - 18px)) + 3mm)";
  }

  function applyNavLayout(mode) {
    var nav = document.getElementById("bottomNav");
    if (!nav) return;
    if (document.body && document.body.classList.contains("is-ilm-chat-route")) {
      return;
    }
    if (document.body && document.body.classList.contains("reader-mode")) {
      return;
    }

    nav.classList.toggle("is-adaptive-rail", mode === "expanded");
    nav.classList.toggle("is-adaptive-centered", mode === "medium");

    if (mode === "expanded") {
      nav.style.setProperty("position", "fixed", "important");
      nav.style.setProperty("left", "max(10px, env(safe-area-inset-left))", "important");
      nav.style.setProperty("right", "auto", "important");
      nav.style.setProperty("top", "max(12px, env(safe-area-inset-top))", "important");
      nav.style.setProperty("bottom", "max(12px, env(safe-area-inset-bottom))", "important");
      nav.style.setProperty("width", "var(--layout-rail-width, 84px)", "important");
      nav.style.setProperty("max-width", "var(--layout-rail-width, 84px)", "important");
      nav.style.setProperty("height", "auto", "important");
      nav.style.setProperty("min-height", "0", "important");
      nav.style.setProperty("max-height", "none", "important");
      nav.style.setProperty("transform", "none", "important");
      nav.style.setProperty("-webkit-transform", "none", "important");
      nav.style.setProperty("margin", "0", "important");
      nav.style.setProperty("z-index", "40", "important");
      return;
    }

    if (mode === "medium") {
      nav.style.setProperty("position", "fixed", "important");
      nav.style.setProperty("left", "50%", "important");
      nav.style.setProperty("right", "auto", "important");
      nav.style.setProperty(
        "width",
        "min(var(--layout-navigation-max, 800px), calc(100vw - 28px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))",
        "important"
      );
      nav.style.setProperty("max-width", "var(--layout-navigation-max, 800px)", "important");
      nav.style.setProperty("top", "auto", "important");
      nav.style.setProperty("bottom", navBottomCompact(), "important");
      nav.style.setProperty("transform", "translateX(-50%)", "important");
      nav.style.setProperty("-webkit-transform", "translateX(-50%)", "important");
      nav.style.removeProperty("height");
      nav.style.removeProperty("min-height");
      nav.style.removeProperty("max-height");
      nav.style.setProperty("margin", "0", "important");
      nav.style.setProperty("z-index", "40", "important");
      return;
    }

    /* compact: restore dock defaults without fighting other chrome */
    var inset = "14px";
    try {
      var w = measureViewport().width;
      if (w <= 700) inset = "10px";
    } catch (e) {}
    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("left", "max(" + inset + ", env(safe-area-inset-left))", "important");
    nav.style.setProperty("right", "max(" + inset + ", env(safe-area-inset-right))", "important");
    nav.style.setProperty("top", "auto", "important");
    nav.style.setProperty("bottom", navBottomCompact(), "important");
    nav.style.setProperty("width", "auto", "important");
    nav.style.setProperty("max-width", "none", "important");
    nav.style.setProperty("transform", "none", "important");
    nav.style.setProperty("-webkit-transform", "none", "important");
    nav.style.removeProperty("height");
    nav.style.removeProperty("min-height");
    nav.style.removeProperty("max-height");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("z-index", "40", "important");
  }

  function applyKeyboardState(metrics) {
    var root = document.documentElement;
    var layoutH =
      document.documentElement.clientHeight || global.innerHeight || metrics.height;
    var keyboardLikely =
      metrics.height > 0 && layoutH > 0 && metrics.height < layoutH - 120;
    root.classList.toggle("adaptive-keyboard-open", !!keyboardLikely);
    root.style.setProperty("--layout-vv-height", metrics.height + "px");
    root.style.setProperty("--layout-vv-offset-top", (metrics.offsetTop || 0) + "px");
  }

  function applyLayout(force) {
    var metrics = measureViewport();
    var mode = resolveLayoutMode(metrics.width, metrics.height);
    var root = document.documentElement;
    var changed = mode !== currentMode;

    if (changed || force) {
      currentMode = mode;
      root.setAttribute("data-layout", mode);
      root.style.setProperty("--layout-vw", metrics.width + "px");
      root.style.setProperty("--layout-vh", metrics.height + "px");
    }

    applyKeyboardState(metrics);
    applyNavLayout(mode);

    if (changed || force) {
      try {
        global.dispatchEvent(
          new CustomEvent("dar:layoutchange", {
            detail: {
              mode: mode,
              width: metrics.width,
              height: metrics.height,
            },
          })
        );
      } catch (e) {}
    }
  }

  function scheduleApply(force) {
    if (rafId) return;
    rafId = global.requestAnimationFrame(function () {
      rafId = 0;
      applyLayout(!!force);
    });
  }

  function syncNav() {
    if (!currentMode) {
      applyLayout(true);
      return;
    }
    applyNavLayout(currentMode);
  }

  function onResize() {
    scheduleApply(false);
  }

  function start() {
    if (started) {
      scheduleApply(true);
      return;
    }
    started = true;
    applyLayout(true);

    if (typeof ResizeObserver === "function") {
      try {
        resizeObserver = new ResizeObserver(function () {
          scheduleApply(false);
        });
        resizeObserver.observe(document.documentElement);
        if (document.body) resizeObserver.observe(document.body);
      } catch (e) {
        resizeObserver = null;
      }
    }

    global.addEventListener("resize", onResize, { passive: true });
    global.addEventListener("orientationchange", function () {
      scheduleApply(true);
    }, { passive: true });

    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", onResize, { passive: true });
      global.visualViewport.addEventListener("scroll", onResize, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) scheduleApply(true);
    });
  }

  var api = {
    resolveLayoutMode: resolveLayoutMode,
    getMode: function () {
      return currentMode || resolveLayoutMode(measureViewport().width, measureViewport().height);
    },
    measure: measureViewport,
    apply: function () {
      applyLayout(true);
    },
    syncNav: syncNav,
    start: start,
    COMPACT_MAX: COMPACT_MAX,
    EXPANDED_MIN: EXPANDED_MIN,
    EXPANDED_MIN_HEIGHT: EXPANDED_MIN_HEIGHT,
  };

  global.DarAdaptiveLayout = api;
  global.resolveLayoutMode = resolveLayoutMode;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
