/**
 * DĀR AL TAWḤĪD — Adaptive Layout Engine (Test)
 * Fensterbasiert: Breite, Höhe, Aspekt, Safe Area, Fold/Hinge, Split-Screen.
 * Kein Gerätetyp, keine Modellnamen, keine festen Displayauflösungen.
 * Visitor bleibt unberührt (isTestApp-Gating).
 * TEST_COPY v930 — AdaptiveAppShell + Tokens + Nav-Morph + Multi-Pane
 */
(function (global) {
  "use strict";

  var T = {
    COMPACT_MAX: 599,
    REGULAR_MIN: 600,
    EXPANDED_MIN: 700,
    EXPANDED_PORTRAIT_MIN: 840,
    WIDE_MIN: 1000,
    EXTRA_WIDE_MIN: 1100,
    PANE_MIN: 280,
    DUAL_MIN_HEIGHT: 520,
    RAIL_MIN_WIDTH: 620,
    RAIL_MIN_HEIGHT: 300,
    RAIL_PREF: 56,
    RAIL_COLLAPSED: 44,
    FLOAT_EDGE: 10,
    NAV_PAD: 8,
    TOUCH_MIN: 44,
    ANIM_MS: 280,
    READER_MAX: "42rem",
    FORM_MAX: "40rem",
  };

  var PLACE_KEY = "dar_sidebar_placement";
  var COLLAPSE_KEY = "dar_sidebar_collapsed";

  var currentMode = "";
  var currentDensity = "";
  var currentRail = false;
  var lastState = null;
  var rafId = 0;
  var started = false;
  var resizeObserver = null;
  var orientTimers = [];
  var savedScrollY = 0;
  var navReady = false;

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

  function readViewportSegments() {
    try {
      if (global.matchMedia && global.matchMedia("(horizontal-viewport-segments: 3)").matches) {
        return 3;
      }
    } catch (e) {}
    try {
      if (global.matchMedia && global.matchMedia("(horizontal-viewport-segments: 2)").matches) {
        return 2;
      }
    } catch (e2) {}
    try {
      var segs = global.visualViewport && global.visualViewport.segments;
      if (segs && segs.length >= 2) return segs.length;
    } catch (e3) {}
    return 1;
  }

  function readHinge() {
    var segs = readViewportSegments();
    var regions = [];
    var start = 0;
    var gap = 0;
    try {
      var vs = global.visualViewport && global.visualViewport.segments;
      if (vs && vs.length >= 2) {
        segs = vs.length;
        var i;
        for (i = 0; i < vs.length - 1; i++) {
          var a = vs[i];
          var b = vs[i + 1];
          var s = Math.round(a.x + a.width);
          var g = Math.max(0, Math.round(b.x - s));
          regions.push({ start: s, gap: g, index: i });
        }
        start = regions[0].start;
        gap = regions[0].gap;
      }
    } catch (e) {}
    return { segments: segs, start: start, gap: gap, regions: regions };
  }

  function resolveDensity(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < T.REGULAR_MIN) return "compact";
    if (w >= T.EXTRA_WIDE_MIN && w >= T.PANE_MIN * 3) return "extra_wide";
    if (w >= T.WIDE_MIN && (w >= h || w >= T.WIDE_MIN)) return "wide";
    if (w >= T.REGULAR_MIN) return "regular";
    return "compact";
  }

  function resolveLayoutMode(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    var d = resolveDensity(w, h);
    if (isTestApp()) {
      if (d === "extra_wide" || d === "wide") return "expanded";
      if (d === "regular") return "medium";
      return "compact";
    }
    if (w < T.REGULAR_MIN) return "compact";
    if (isDualViewport(w, h) && (h >= T.DUAL_MIN_HEIGHT || w >= h || w >= T.EXPANDED_PORTRAIT_MIN)) {
      return "expanded";
    }
    return "medium";
  }

  function isDualViewport(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < T.PANE_MIN * 2) return false;
    var hinge = readHinge();
    if (hinge.segments >= 2 && w >= T.PANE_MIN * 2) return true;
    if (h < T.DUAL_MIN_HEIGHT && hinge.segments < 2) return false;
    if (w >= T.EXPANDED_PORTRAIT_MIN && h >= T.DUAL_MIN_HEIGHT) return true;
    if (w >= T.EXPANDED_MIN && h >= T.DUAL_MIN_HEIGHT) return true;
    return false;
  }

  function resolvePaneCount(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    var hinge = readHinge();
    if (hinge.segments >= 3 && w >= T.PANE_MIN * 3) return 3;
    if (hinge.segments >= 2 && w >= T.PANE_MIN * 2) return 2;
    if (isDualViewport(w, h)) return 2;
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
    if (w < T.RAIL_MIN_WIDTH || h < T.RAIL_MIN_HEIGHT) return false;
    var landscape = w >= h;
    if (landscape && w >= T.RAIL_MIN_WIDTH) return true;
    if ((density === "extra_wide" || density === "wide") && w >= T.WIDE_MIN && h >= 500) return true;
    return false;
  }

  function navBottomCompact() {
    return "calc(max(7px, calc(env(safe-area-inset-bottom) - 18px)) + 3mm)";
  }

  function hideRailToggle() {
    var btn = document.getElementById("darAdaptiveRailToggle");
    if (btn) btn.hidden = true;
  }

  function railWidthFor(metrics, collapsed) {
    if (collapsed) return T.RAIL_COLLAPSED;
    var h = Number(metrics && metrics.height) || 0;
    return h > 0 && h < 800 ? 52 : T.RAIL_PREF;
  }

  function glassNav(nav) {
    nav.style.setProperty("background", "rgba(255,255,255,.04)", "important");
    nav.style.setProperty("border", "1px solid rgba(255,255,255,.08)", "important");
    nav.style.setProperty("border-radius", "27px", "important");
    nav.style.setProperty("box-shadow", "0 6px 18px rgba(0,0,0,.14)", "important");
    nav.style.setProperty("-webkit-backdrop-filter", "blur(10px) saturate(1.08)", "important");
    nav.style.setProperty("backdrop-filter", "blur(10px) saturate(1.08)", "important");
  }

  function applyChromeInsets(leading, width) {
    var root = document.documentElement;
    var railReserve = width + T.FLOAT_EDGE + T.NAV_PAD;
    var left = leading
      ? "calc(" + railReserve + "px + env(safe-area-inset-left, 0px))"
      : "max(" + T.NAV_PAD + "px, env(safe-area-inset-left, 0px), var(--dar-native-safe-left, 0px))";
    var right = leading
      ? "max(" + T.NAV_PAD + "px, env(safe-area-inset-right, 0px), var(--dar-native-safe-right, 0px))"
      : "calc(" + railReserve + "px + env(safe-area-inset-right, 0px))";
    root.style.setProperty("--layout-chrome-left", left);
    root.style.setProperty("--layout-chrome-right", right);
    root.style.setProperty("--layout-player-strip", "0px");
    root.classList.remove("dar-player-strip");
    root.style.setProperty("--bottom-tab-capsule-w", "40px");
    root.style.setProperty("--bottom-tab-capsule-h", "36px");
    root.style.setProperty("--layout-nav-margin", T.FLOAT_EDGE + "px");
    var mini = document.getElementById("darQuranMiniPlayer");
    if (mini) mini.style.cssText = "";
  }

  function applySideRail(nav, metrics) {
    var placement = readPlacement();
    var collapsed = readCollapsed();
    var leading = placement === "leading";
    var width = railWidthFor(metrics, collapsed);
    var edge = T.FLOAT_EDGE;
    var sideInset = "max(" + edge + "px, calc(env(safe-area-inset-" + (leading ? "left" : "right") + ", 0px) + " + edge + "px))";

    nav.classList.add("is-adaptive-rail");
    nav.classList.remove("is-adaptive-centered", "dar-test-thumb-nav");
    nav.removeAttribute("hidden");
    nav.setAttribute("data-rail-collapsed", collapsed ? "1" : "0");
    hideRailToggle();

    nav.style.setProperty("display", "flex", "important");
    nav.style.setProperty("visibility", "visible", "important");
    nav.style.setProperty("opacity", "1", "important");
    nav.style.setProperty("pointer-events", "auto", "important");
    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("top", "50%", "important");
    nav.style.setProperty("bottom", "auto", "important");
    if (leading) {
      nav.style.setProperty("left", sideInset, "important");
      nav.style.setProperty("right", "auto", "important");
    } else {
      nav.style.setProperty("right", sideInset, "important");
      nav.style.setProperty("left", "auto", "important");
    }
    nav.style.setProperty("width", width + "px", "important");
    nav.style.setProperty("min-width", width + "px", "important");
    nav.style.setProperty("max-width", width + "px", "important");
    nav.style.setProperty("height", "auto", "important");
    nav.style.setProperty("min-height", "0", "important");
    nav.style.setProperty("max-height", "min(78dvh, 520px)", "important");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("padding", "8px 4px", "important");
    nav.style.setProperty("flex-direction", "column", "important");
    nav.style.setProperty("justify-content", "space-around", "important");
    nav.style.setProperty("align-items", "stretch", "important");
    nav.style.setProperty("gap", "2px", "important");
    nav.style.setProperty("transform", "translate3d(0,-50%,0)", "important");
    nav.style.setProperty("-webkit-transform", "translate3d(0,-50%,0)", "important");
    nav.style.setProperty("z-index", "120", "important");
    nav.style.setProperty("overflow", "hidden", "important");
    nav.style.setProperty("isolation", "isolate", "important");
    nav.style.setProperty("box-sizing", "border-box", "important");
    glassNav(nav);

    Array.prototype.forEach.call(document.querySelectorAll(".bottom-nav"), function (el) {
      if (el !== nav) el.style.setProperty("display", "none", "important");
    });

    var root = document.documentElement;
    root.style.setProperty("--layout-rail-width", width + "px");
    root.setAttribute("data-nav-rail", "1");
    root.setAttribute("data-nav-mode", "side");
    root.setAttribute("data-nav-placement", placement);
    root.setAttribute("data-nav-collapsed", collapsed ? "1" : "0");
    if (document.body) {
      document.body.style.setProperty("padding-bottom", "0px", "important");
    }
    applyChromeInsets(leading, width);
  }

  function applyBottomNav(nav, mode) {
    hideRailToggle();
    nav.classList.remove("is-adaptive-rail");
    nav.removeAttribute("data-rail-collapsed");
    var root = document.documentElement;
    root.setAttribute("data-nav-rail", "0");
    root.setAttribute("data-nav-mode", "bottom");
    root.style.setProperty("--layout-rail-width", "0px");
    root.style.setProperty("--layout-chrome-left", "max(0px, env(safe-area-inset-left, 0px))");
    root.style.setProperty("--layout-chrome-right", "max(0px, env(safe-area-inset-right, 0px))");
    root.style.removeProperty("--bottom-tab-capsule-w");
    root.style.removeProperty("--bottom-tab-capsule-h");
    ["darQuranMiniPlayer", "darQuranPlayer"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.cssText = "";
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
    nav.style.setProperty("padding", "5px", "important");
    nav.style.setProperty("z-index", "40", "important");
    nav.style.setProperty("overflow", "hidden", "important");
    glassNav(nav);
  }

  function applyNavLayout(mode, metrics) {
    var nav = document.getElementById("bottomNav");
    if (!nav) return;
    if (document.body && document.body.classList.contains("is-ilm-chat-route")) return;
    if (document.body && document.body.classList.contains("reader-mode")) return;

    metrics = metrics || measureViewport();
    var density = resolveDensity(metrics.width, metrics.height);
    var rail = wantsSideRail(metrics.width, metrics.height, density);
    var switching = navReady && currentRail !== rail;
    if (switching) nav.classList.add("is-nav-morphing");
    currentRail = rail;
    if (rail) applySideRail(nav, metrics);
    else applyBottomNav(nav, mode);
    navReady = true;
    if (switching) {
      setTimeout(function () {
        nav.classList.remove("is-nav-morphing");
      }, T.ANIM_MS + 40);
    }
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

  function applyHingeMetrics(metrics) {
    var root = document.documentElement;
    var hinge = readHinge();
    root.setAttribute("data-viewport-segments", String(hinge.segments));
    root.style.setProperty("--layout-aspect", String((metrics.aspect || 1).toFixed(3)));
    root.style.setProperty("--layout-hinge-gap", hinge.gap + "px");
    root.style.setProperty("--layout-hinge-start", hinge.start ? hinge.start + "px" : "50%");
    root.style.setProperty("--layout-fold-regions", String(hinge.regions.length));
    if (hinge.segments >= 2 && hinge.gap > 0) {
      root.classList.add("dar-has-hinge");
    } else {
      root.classList.remove("dar-has-hinge");
    }
    var mask = document.getElementById("darHingeMask");
    if (mask) mask.hidden = true;
  }

  function computeState(metrics) {
    metrics = metrics || measureViewport();
    var density = resolveDensity(metrics.width, metrics.height);
    var mode = resolveLayoutMode(metrics.width, metrics.height);
    var panes = resolvePaneCount(metrics.width, metrics.height);
    var dual = isDualViewport(metrics.width, metrics.height);
    var landscape = metrics.width >= metrics.height;
    var rail = wantsSideRail(metrics.width, metrics.height, density);
    var hinge = readHinge();
    return {
      width: metrics.width,
      height: metrics.height,
      aspect: metrics.aspect,
      offsetTop: metrics.offsetTop,
      widthClass: mode,
      heightClass: metrics.height < 500 ? "short" : metrics.height < 800 ? "regular" : "tall",
      density: density,
      orientationMode: landscape ? "landscape" : "portrait",
      isWide: metrics.width >= T.REGULAR_MIN,
      isShort: metrics.height < 500,
      isMultiPane: panes >= 2,
      panes: panes,
      dual: dual,
      navigationMode: rail ? "side" : "bottom",
      rail: rail,
      placement: readPlacement(),
      collapsed: readCollapsed(),
      foldingRegions: hinge.regions,
      viewportSegments: hinge.segments,
      hingeStart: hinge.start,
      hingeGap: hinge.gap,
    };
  }

  function applyLayout(force) {
    var metrics = measureViewport();
    var state = computeState(metrics);
    var root = document.documentElement;
    var changed =
      state.widthClass !== currentMode ||
      state.density !== currentDensity ||
      (lastState && lastState.navigationMode !== state.navigationMode) ||
      (lastState && lastState.panes !== state.panes);

    if (isTestApp()) {
      root.classList.add("dar-test-adaptive");
      root.setAttribute("data-nav-placement", state.placement);
    } else {
      root.classList.remove("dar-test-adaptive");
    }

    currentMode = state.widthClass;
    currentDensity = state.density;
    lastState = state;

    root.setAttribute("data-layout", state.widthClass);
    root.setAttribute("data-density", state.density);
    root.setAttribute("data-panes", String(state.panes));
    root.setAttribute("data-orientation", state.orientationMode);
    root.setAttribute("data-height-class", state.heightClass);
    root.classList.toggle("is-layout-landscape", state.orientationMode === "landscape");
    root.classList.toggle("is-layout-wide", state.isWide);
    root.classList.toggle("is-fold-dual", state.dual);
    root.setAttribute("data-fold-dual", state.dual ? "1" : "0");
    root.style.setProperty("--layout-vw", state.width + "px");
    root.style.setProperty("--layout-vh", state.height + "px");
    root.style.setProperty("--layout-pane-count", String(state.panes));
    root.style.setProperty("--layout-reader-max", T.READER_MAX);
    root.style.setProperty("--layout-form-max", T.FORM_MAX);
    root.style.setProperty("--layout-anim", T.ANIM_MS + "ms");
    root.style.setProperty("--touch-min", T.TOUCH_MIN + "px");
    var fs =
      state.density === "extra_wide" ? 1.04 : state.density === "wide" ? 1.02 : 1;
    root.style.setProperty("--layout-type-scale", String(fs));

    applyKeyboardState(metrics);
    applyHingeMetrics(metrics);
    applyNavLayout(state.widthClass, metrics);

    if (changed || force) {
      try {
        global.dispatchEvent(
          new CustomEvent("dar:layoutchange", {
            detail: state,
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
      savedScrollY =
        global.DARScrollManager && typeof global.DARScrollManager.getY === "function"
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
    try {
      new MutationObserver(function () {
        if (currentRail) scheduleApply(true);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    } catch (eObs) {}

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
    getState: function () {
      return lastState || computeState();
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
    TOKENS: T,
    COMPACT_MAX: T.COMPACT_MAX,
    EXPANDED_MIN: T.EXPANDED_MIN,
    EXPANDED_PORTRAIT_MIN: T.EXPANDED_PORTRAIT_MIN,
    EXPANDED_MIN_HEIGHT: T.DUAL_MIN_HEIGHT,
  };

  global.DarAdaptiveLayout = api;
  global.resolveLayoutMode = resolveLayoutMode;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
