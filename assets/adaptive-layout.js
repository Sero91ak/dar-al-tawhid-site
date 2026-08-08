/**
 * DAR AL TAWḤĪD — Adaptive Layout Controller
 * compact <600 · medium 600–719 · expanded ≥720 (Fold open / Tablet)
 * Expanded = content master-detail (DarFold). Bottom-Nav bleibt unten — KEIN Left-Rail-Nav.
 * v7: expanded dual gate + orientation burst (Android Fold lag)
 */
(function (global) {
  "use strict";

  var COMPACT_MAX = 599;
  var EXPANDED_MIN = 700;
  var EXPANDED_MIN_HEIGHT = 480;
  var currentMode = "";
  var rafId = 0;
  var started = false;
  var resizeObserver = null;
  var orientTimers = [];

  function resolveLayoutMode(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < 600) return "compact";
    /* Fold open, Fold Ultra, iPad, Android tablet — dual content */
    if (w >= EXPANDED_MIN && (h >= EXPANDED_MIN_HEIGHT || w >= h)) return "expanded";
    return "medium";
  }

  function measureViewport() {
    var vv = global.visualViewport;
    var innerW = Math.round(global.innerWidth || 0);
    var innerH = Math.round(global.innerHeight || 0);
    var clientW = Math.round(
      (document.documentElement && document.documentElement.clientWidth) || 0
    );
    var clientH = Math.round(
      (document.documentElement && document.documentElement.clientHeight) || 0
    );
    var vvW = vv && vv.width ? Math.round(vv.width) : 0;
    var vvH = vv && vv.height ? Math.round(vv.height) : 0;
    var w = Math.max(vvW, clientW, innerW) || vvW || clientW || innerW || 0;
    var h = vvH || clientH || innerH || 0;
    if (!h) h = Math.max(clientH, innerH) || 0;
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

    /* NEVER left-rail nav — Fold dual is content split only */
    nav.classList.remove("is-adaptive-rail");
    var wide = mode === "medium" || mode === "expanded";
    nav.classList.toggle("is-adaptive-centered", wide);

    if (wide) {
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
      nav.style.setProperty("height", "auto", "important");
      nav.style.setProperty("min-height", "0", "important");
      nav.style.setProperty("max-height", "none", "important");
      nav.style.setProperty("transform", "translateX(-50%)", "important");
      nav.style.setProperty("-webkit-transform", "translateX(-50%)", "important");
      nav.style.setProperty("flex-direction", "row", "important");
      nav.style.setProperty("margin", "0", "important");
      nav.style.setProperty("z-index", "40", "important");
      return;
    }

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
    nav.style.setProperty("height", "auto", "important");
    nav.style.setProperty("transform", "none", "important");
    nav.style.setProperty("-webkit-transform", "none", "important");
    nav.style.setProperty("flex-direction", "row", "important");
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

  function applyOrientationAttrs(metrics) {
    var root = document.documentElement;
    var landscape = metrics.width >= metrics.height;
    root.setAttribute("data-orientation", landscape ? "landscape" : "portrait");
    root.classList.toggle("is-layout-landscape", landscape);
    root.classList.toggle("is-layout-wide", metrics.width >= 600);
    root.classList.toggle("is-fold-dual", metrics.width >= EXPANDED_MIN);
  }

  function applyLayout(force) {
    var metrics = measureViewport();
    var mode = resolveLayoutMode(metrics.width, metrics.height);
    var root = document.documentElement;
    var changed = mode !== currentMode;

    if (changed || force) {
      currentMode = mode;
      root.setAttribute("data-layout", mode);
      root.classList.remove("data-layout-expanded-legacy");
      root.style.setProperty("--layout-vw", metrics.width + "px");
      root.style.setProperty("--layout-vh", metrics.height + "px");
    }

    applyOrientationAttrs(metrics);
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
              dual: mode === "expanded",
              orientation: metrics.width >= metrics.height ? "landscape" : "portrait",
            },
          })
        );
      } catch (e) {}
      if (global.DarFold && typeof global.DarFold.sync === "function") {
        try {
          global.DarFold.sync();
        } catch (e2) {}
      }
    }
  }

  function scheduleApply(force) {
    if (rafId) return;
    rafId = global.requestAnimationFrame(function () {
      rafId = 0;
      applyLayout(!!force);
    });
  }

  function clearOrientTimers() {
    for (var i = 0; i < orientTimers.length; i++) {
      clearTimeout(orientTimers[i]);
    }
    orientTimers = [];
  }

  function scheduleOrientBurst() {
    clearOrientTimers();
    scheduleApply(true);
    [50, 150, 350, 700].forEach(function (ms) {
      orientTimers.push(
        setTimeout(function () {
          applyLayout(true);
        }, ms)
      );
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
    global.addEventListener("orientationchange", scheduleOrientBurst, { passive: true });

    if (global.screen && global.screen.orientation && typeof global.screen.orientation.addEventListener === "function") {
      try {
        global.screen.orientation.addEventListener("change", scheduleOrientBurst);
      } catch (e) {}
    }

    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", onResize, { passive: true });
      global.visualViewport.addEventListener("scroll", onResize, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) scheduleOrientBurst();
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
