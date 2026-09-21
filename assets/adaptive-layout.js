/**
 * DĀR AL TAWḤĪD — Adaptive Layout Engine
 * Größenbasiert: Breite + Höhe + Aspekt + Safe Area + Fenster.
 * Kein Gerätetyp (kein iPhone/iPad/Fold-UA).
 * Visitor: Compact/Medium/Expanded, Bottom-Nav (unverändert).
 * Test: COMPACT / REGULAR / WIDE / EXTRA_WIDE + optionale Seiten-Nav.
 */
(function (global) {
  "use strict";

  var COMPACT_MAX = 599;
  var EXPANDED_MIN = 700;
  var EXPANDED_PORTRAIT_MIN = 840;
  var EXPANDED_MIN_HEIGHT = 480;
  var WIDE_MIN = 720;
  var EXTRA_WIDE_MIN = 1100;
  var PANE_MIN = 280;
  var RAIL_PREF = 56;
  var RAIL_COLLAPSED = 28;
  var PLACE_KEY = "dar_sidebar_placement";
  var COLLAPSE_KEY = "dar_sidebar_collapsed";

  var currentMode = "";
  var currentDensity = "";
  var currentRail = false;
  var rafId = 0;
  var started = false;
  var resizeObserver = null;
  var orientTimers = [];
  var savedScrollY = 0;

  function isTestApp() {
    try {
      var p = String((global.location && global.location.pathname) || "");
      return p === "/test" || p.indexOf("/test/") === 0;
    } catch (e) {
      return false;
    }
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
    var aspect = h > 0 ? w / h : 1;
    return { width: w, height: h, offsetTop: offsetTop, aspect: aspect };
  }

  function isDualViewport(width, height) {
    var w = Number(width);
    var h = Number(height);
    if (!Number.isFinite(w)) w = 0;
    if (!Number.isFinite(h)) h = 0;
    if (isTestApp()) {
      if (w < EXPANDED_MIN) return false;
      if (w < PANE_MIN * 2) return false;
      return true;
    }
    if (w < EXPANDED_MIN) return false;
    if (w >= h) return true;
    if (w >= EXPANDED_PORTRAIT_MIN) return true;
    return false;
  }

  function resolveLayoutMode(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (isTestApp()) {
      var d = resolveDensity(w, h);
      if (d === "extra_wide") return "expanded";
      if (d === "wide") return "expanded";
      if (d === "regular") return "medium";
      return "compact";
    }
    if (w < 600) return "compact";
    if (isDualViewport(w, h) && (h >= EXPANDED_MIN_HEIGHT || w >= h || w >= EXPANDED_PORTRAIT_MIN)) {
      return "expanded";
    }
    return "medium";
  }

  function resolveDensity(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < 600) return "compact";
    if (w >= EXTRA_WIDE_MIN && w >= PANE_MIN * 3) return "extra_wide";
    if (w >= WIDE_MIN && (w >= h || w >= 900)) return "wide";
    if (w >= 600) return "regular";
    return "compact";
  }

  function resolvePaneCount(width, height) {
    var w = Number(width) || 0;
    if (w >= PANE_MIN * 3 + RAIL_PREF && w >= EXTRA_WIDE_MIN) return 3;
    if (w >= PANE_MIN * 2 && w >= EXPANDED_MIN) return 2;
    return 1;
  }

  function readPlacement() {
    try {
      var v = String(global.localStorage.getItem(PLACE_KEY) || "trailing").toLowerCase();
      return v === "leading" ? "leading" : "trailing";
    } catch (e) {
      return "trailing";
    }
  }

  function readCollapsed() {
    try {
      return global.localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setPlacement(next) {
    var v = String(next || "") === "leading" ? "leading" : "trailing";
    try {
      global.localStorage.setItem(PLACE_KEY, v);
    } catch (e) {}
    applyLayout(true);
  }

  function setCollapsed(next) {
    try {
      global.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch (e) {}
    applyLayout(true);
  }

  function routeBlocksRail() {
    var body = document.body;
    var root = document.documentElement;
    if (!body) return true;
    if (body.classList.contains("is-ilm-chat-route")) return true;
    if (body.classList.contains("reader-mode") || root.classList.contains("reader-mode")) return true;
    return false;
  }

  function wantsSideRail(width, height, density) {
    if (!isTestApp()) return false;
    if (routeBlocksRail()) return false;
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < 620 || h < 300) return false;
    var landscape = w >= h;
    if (landscape && w >= 620) return true;
    if (density === "extra_wide" && w >= EXTRA_WIDE_MIN && h >= 500) return true;
    return false;
  }

  function navBottomCompact() {
    return "calc(max(7px, calc(env(safe-area-inset-bottom) - 18px)) + 3mm)";
  }

  function ensureRailToggle(nav, collapsed) {
    var btn = document.getElementById("darAdaptiveRailToggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "darAdaptiveRailToggle";
      btn.type = "button";
      btn.className = "dar-adaptive-rail-toggle";
      btn.setAttribute("aria-label", "Navigation ein- oder ausklappen");
      nav.insertBefore(btn, nav.firstChild);
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        setCollapsed(!readCollapsed());
      });
    }
    btn.hidden = false;
    btn.textContent = collapsed ? "‹" : "›";
    if (readPlacement() === "leading") {
      btn.textContent = collapsed ? "›" : "‹";
    }
  }

  function hideRailToggle() {
    var btn = document.getElementById("darAdaptiveRailToggle");
    if (btn) btn.hidden = true;
  }

  function applySideRail(nav, metrics) {
    var placement = readPlacement();
    var collapsed = readCollapsed();
    var leading = placement === "leading";
    var width = collapsed ? RAIL_COLLAPSED : RAIL_PREF;
    var insetL = "env(safe-area-inset-left, 0px)";
    var insetR = "env(safe-area-inset-right, 0px)";
    var insetT = "env(safe-area-inset-top, 0px)";
    var insetB = "env(safe-area-inset-bottom, 0px)";

    nav.classList.add("is-adaptive-rail");
    nav.classList.remove("is-adaptive-centered", "dar-test-thumb-nav");
    nav.removeAttribute("hidden");
    nav.style.setProperty("display", "flex", "important");
    nav.style.setProperty("visibility", "visible", "important");
    nav.style.setProperty("opacity", "1", "important");
    nav.setAttribute("data-rail-collapsed", collapsed ? "1" : "0");
    ensureRailToggle(nav, collapsed);

    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("top", "0", "important");
    nav.style.setProperty("bottom", "0", "important");
    nav.style.setProperty("height", "100dvh", "important");
    nav.style.setProperty("min-height", "100dvh", "important");
    nav.style.setProperty("max-height", "100dvh", "important");
    nav.style.setProperty("width", width + "px", "important");
    nav.style.setProperty("min-width", width + "px", "important");
    nav.style.setProperty("max-width", width + "px", "important");
    nav.style.setProperty("transform", "translate3d(0,0,0)", "important");
    nav.style.setProperty("-webkit-transform", "translate3d(0,0,0)", "important");
    nav.style.setProperty("flex-direction", "column", "important");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("padding", collapsed ? "4px 2px" : "8px 4px", "important");
    nav.style.setProperty("padding-top", "max(8px, " + insetT + ")", "important");
    nav.style.setProperty("padding-bottom", "max(8px, " + insetB + ")", "important");
    nav.style.setProperty("border-radius", "0", "important");
    nav.style.setProperty("z-index", "80", "important");
    nav.style.setProperty("gap", "2px", "important");
    nav.style.setProperty("justify-content", "flex-start", "important");
    nav.style.setProperty("align-items", "stretch", "important");
    nav.style.setProperty("box-sizing", "border-box", "important");
    nav.style.setProperty("transition", "left .28s ease, right .28s ease, top .28s ease, bottom .28s ease, width .28s ease", "important");

    if (leading) {
      nav.style.setProperty("left", "0px", "important");
      nav.style.setProperty("right", "auto", "important");
      nav.style.setProperty("padding-left", "max(2px, " + insetL + ")", "important");
    } else {
      nav.style.setProperty("right", "0px", "important");
      nav.style.setProperty("left", "auto", "important");
      nav.style.setProperty("padding-right", "max(2px, " + insetR + ")", "important");
    }

    var root = document.documentElement;
    root.style.setProperty("--layout-rail-width", width + "px");
    root.setAttribute("data-nav-rail", "1");
    root.setAttribute("data-nav-placement", placement);
    root.setAttribute("data-nav-collapsed", collapsed ? "1" : "0");
    if (document.body) {
      document.body.style.setProperty("padding-bottom", "0px", "important");
    }
    applyChromeInsets(leading, width);
  }

  function applyChromeInsets(leading, width) {
    var left = leading ? width + "px" : "0px";
    var right = leading ? "0px" : width + "px";
    var root = document.documentElement;
    root.style.setProperty("--layout-chrome-left", left);
    root.style.setProperty("--layout-chrome-right", right);
    ["darQuranMiniPlayer", "darQuranPlayer"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.setProperty("left", left, "important");
      el.style.setProperty("right", right, "important");
      el.style.setProperty("width", "auto", "important");
      el.style.setProperty("max-width", "none", "important");
    });
  }

  function applyBottomNav(nav, mode) {
    hideRailToggle();
    nav.classList.remove("is-adaptive-rail");
    nav.removeAttribute("data-rail-collapsed");
    var root = document.documentElement;
    root.setAttribute("data-nav-rail", "0");
    root.style.setProperty("--layout-rail-width", "0px");
    root.style.setProperty("--layout-chrome-left", "0px");
    root.style.setProperty("--layout-chrome-right", "0px");
    ["darQuranMiniPlayer", "darQuranPlayer"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.removeProperty("left");
      el.style.removeProperty("right");
      el.style.removeProperty("width");
      el.style.removeProperty("max-width");
    });
    if (document.body && isTestApp()) {
      document.body.style.removeProperty("padding-left");
      document.body.style.removeProperty("padding-right");
    }

    if (!isTestApp()) {
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
        nav.style.setProperty("transform", "translateX(-50%)", "important");
        nav.style.setProperty("-webkit-transform", "translateX(-50%)", "important");
        nav.style.setProperty("flex-direction", "row", "important");
        nav.style.setProperty("margin", "0", "important");
        nav.style.setProperty("z-index", "40", "important");
        return;
      }
    }

    var inset = "14px";
    try {
      var w = measureViewport().width;
      if (w <= 700) inset = "10px";
    } catch (e) {}
    nav.classList.remove("is-adaptive-centered");
    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("left", "max(" + inset + ", env(safe-area-inset-left))", "important");
    nav.style.setProperty("right", "max(" + inset + ", env(safe-area-inset-right))", "important");
    nav.style.setProperty("top", "auto", "important");
    nav.style.setProperty("bottom", navBottomCompact(), "important");
    nav.style.setProperty("width", "auto", "important");
    nav.style.setProperty("min-width", "0", "important");
    nav.style.setProperty("max-width", "none", "important");
    nav.style.setProperty("height", "auto", "important");
    nav.style.setProperty("min-height", "0", "important");
    nav.style.setProperty("max-height", "none", "important");
    nav.style.setProperty("transform", "none", "important");
    nav.style.setProperty("-webkit-transform", "none", "important");
    nav.style.setProperty("flex-direction", "row", "important");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("padding", "", "important");
    nav.style.setProperty("border-radius", "", "important");
    nav.style.setProperty("z-index", "40", "important");
    nav.style.setProperty("gap", "", "important");
  }

  function applyNavLayout(mode, metrics) {
    var nav = document.getElementById("bottomNav");
    if (!nav) return;
    if (document.body && document.body.classList.contains("is-ilm-chat-route")) return;
    if (document.body && document.body.classList.contains("reader-mode")) return;

    metrics = metrics || measureViewport();
    var density = resolveDensity(metrics.width, metrics.height);
    var rail = wantsSideRail(metrics.width, metrics.height, density);
    currentRail = rail;
    if (rail) applySideRail(nav, metrics);
    else applyBottomNav(nav, mode);
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
    var dual = isDualViewport(metrics.width, metrics.height);
    root.setAttribute("data-orientation", landscape ? "landscape" : "portrait");
    root.classList.toggle("is-layout-landscape", landscape);
    root.classList.toggle("is-layout-wide", metrics.width >= 600);
    root.classList.toggle("is-fold-dual", dual);
    root.setAttribute("data-fold-dual", dual ? "1" : "0");
  }

  function applyHingeMetrics(metrics) {
    var root = document.documentElement;
    var segs = 1;
    try {
      if (global.matchMedia && global.matchMedia("(horizontal-viewport-segments: 2)").matches) {
        segs = 2;
      }
    } catch (e) {}
    root.setAttribute("data-viewport-segments", String(segs));
    root.style.setProperty("--layout-aspect", String((metrics.aspect || 1).toFixed(3)));
  }

  function applyLayout(force) {
    var metrics = measureViewport();
    var mode = resolveLayoutMode(metrics.width, metrics.height);
    var density = resolveDensity(metrics.width, metrics.height);
    var panes = resolvePaneCount(metrics.width, metrics.height);
    var dual = isDualViewport(metrics.width, metrics.height);
    var root = document.documentElement;
    var changed = mode !== currentMode || density !== currentDensity;
    var prevDual = root.getAttribute("data-fold-dual") === "1";

    if (isTestApp()) {
      root.classList.add("dar-test-adaptive");
      root.setAttribute("data-nav-placement", readPlacement());
    } else {
      root.classList.remove("dar-test-adaptive");
    }

    if (changed || force) {
      currentMode = mode;
      currentDensity = density;
      root.setAttribute("data-layout", mode);
      root.setAttribute("data-density", density);
      root.setAttribute("data-panes", String(panes));
      root.classList.remove("data-layout-expanded-legacy");
      root.style.setProperty("--layout-vw", metrics.width + "px");
      root.style.setProperty("--layout-vh", metrics.height + "px");
      root.style.setProperty("--layout-pane-count", String(panes));
      var fs = density === "extra_wide" ? 1.06 : density === "wide" ? 1.03 : density === "regular" ? 1 : 0.98;
      root.style.setProperty("--layout-type-scale", String(fs));
    }

    applyOrientationAttrs(metrics);
    applyKeyboardState(metrics);
    applyHingeMetrics(metrics);
    applyNavLayout(mode, metrics);

    var dualChanged = prevDual !== dual;
    if (changed || force || dualChanged) {
      try {
        global.dispatchEvent(
          new CustomEvent("dar:layoutchange", {
            detail: {
              mode: mode,
              density: density,
              panes: panes,
              width: metrics.width,
              height: metrics.height,
              dual: dual,
              rail: currentRail,
              placement: readPlacement(),
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
    try {
      savedScrollY = global.DARScrollManager && typeof global.DARScrollManager.getY === "function"
        ? global.DARScrollManager.getY()
        : global.scrollY || document.documentElement.scrollTop || 0;
      if (global.DARScrollManager && typeof global.DARScrollManager.setPendingRestore === "function") {
        global.DARScrollManager.setPendingRestore(savedScrollY);
      }
    } catch (e) {}
    clearOrientTimers();
    applyLayout(true);
    orientTimers.push(
      setTimeout(function () {
        applyLayout(true);
        try {
          if (global.DARScrollManager && typeof global.DARScrollManager.stableScrollTo === "function") {
            global.DARScrollManager.stableScrollTo(savedScrollY);
          } else if (savedScrollY) {
            global.scrollTo(0, savedScrollY);
          }
        } catch (e2) {}
      }, 180)
    );
  }

  function syncNav() {
    if (!currentMode) {
      applyLayout(true);
      return;
    }
    applyNavLayout(currentMode, measureViewport());
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

    document.addEventListener(
      "click",
      function (ev) {
        var placeBtn = ev.target && ev.target.closest && ev.target.closest("[data-nav-placement]");
        if (placeBtn) {
          ev.preventDefault();
          setPlacement(placeBtn.getAttribute("data-nav-placement"));
          document.querySelectorAll("[data-nav-placement]").forEach(function (x) {
            x.classList.toggle("is-active", x.getAttribute("data-nav-placement") === readPlacement());
          });
        }
      },
      true
    );
    document.addEventListener(
      "change",
      function (ev) {
        var t = ev.target;
        if (t && t.getAttribute && t.getAttribute("data-nav-collapsed") != null) {
          setCollapsed(!!t.checked);
        }
      },
      true
    );
  }

  var api = {
    resolveLayoutMode: resolveLayoutMode,
    resolveDensity: resolveDensity,
    resolvePaneCount: resolvePaneCount,
    isDualViewport: isDualViewport,
    wantsRail: function () {
      var m = measureViewport();
      return wantsSideRail(m.width, m.height, resolveDensity(m.width, m.height));
    },
    getMode: function () {
      return currentMode || resolveLayoutMode(measureViewport().width, measureViewport().height);
    },
    getDensity: function () {
      var m = measureViewport();
      return currentDensity || resolveDensity(m.width, m.height);
    },
    isDual: function () {
      var m = measureViewport();
      return isDualViewport(m.width, m.height);
    },
    getPlacement: readPlacement,
    setPlacement: setPlacement,
    getCollapsed: readCollapsed,
    setCollapsed: setCollapsed,
    measure: measureViewport,
    apply: function () {
      applyLayout(true);
    },
    syncNav: syncNav,
    start: start,
    COMPACT_MAX: COMPACT_MAX,
    EXPANDED_MIN: EXPANDED_MIN,
    EXPANDED_PORTRAIT_MIN: EXPANDED_PORTRAIT_MIN,
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
