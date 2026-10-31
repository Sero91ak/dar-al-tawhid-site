/**
 * DĀR AL TAWḤĪD — Adaptive Layout Controller
 * Compact: Smartphone, Fold geschlossen, Tablet Hochformat → Einspalte
 * Expanded: Fold geöffnet, Tablet Querformat, große Breite → Zwei-Bereichs-Modus
 * Bottom-Nav bleibt unten — KEIN Left-Rail-Nav.
 * v9: Bottom-Nav immer zentrierte, adaptive Kapsel (Kids-Referenz, Fold/Tablet)
 */
(function (global) {
  "use strict";

  if (global.__DAR_ADAPTIVE_LAYOUT_V1326) return;
  global.__DAR_ADAPTIVE_LAYOUT_V1326 = true;

  var COMPACT_MAX = 599;
  /* v1326: capacity based — no device-name or fixed desktop-only breakpoint. */
  var EXPANDED_MIN = 900;
  var EXPANDED_PORTRAIT_MIN = 900;
  var EXPANDED_MIN_HEIGHT = 560;
  var SIDE_NAV_RESERVE = 76;
  var SIDE_NAV_MIN_WIDTH = 760;
  var SIDE_NAV_MIN_HEIGHT = 360;
  var RAIL_MIN = 300;
  var RAIL_MAX = 360;
  var MASTER_GAP = 18;
  var READER_MIN = 500;
  var currentMode = "";
  var rafId = 0;
  var started = false;
  var resizeObserver = null;
  var layoutAttributeObserver = null;
  var orientTimers = [];
  var lastAppliedViewportKey = "";
  var pendingForcedLayout = false;

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
    /* iOS/PWA orientation fix: visualViewport can keep the previous landscape
       width for a few frames. Never use max(), otherwise one stale source
       keeps the whole app in the old breakpoint after rotating back. */
    var w = clientW || innerW || vvW || 0;
    var h = clientH || innerH || vvH || 0;
    /* Layout capacity is based on the stable layout viewport, not a
       keyboard/toolbar/pinch-reduced visual viewport. Even matching aspect
       ratios can be misleading while the on-screen keyboard is visible.
       Still accept visualViewport when it actually matches the layout box. */
    if (vvW > 0 && vvH > 0 && clientW > 0 && clientH > 0 &&
        Math.abs(vvW - clientW) <= 2 && Math.abs(vvH - clientH) <= 2) {
      w = vvW;
      h = vvH;
    }
    var offsetTop = vv && typeof vv.offsetTop === "number" ? vv.offsetTop : 0;
    return { width: w, height: h, offsetTop: offsetTop };
  }

  function navPreference() {
    try {
      if (global.DarAdaptiveNavPlacement && typeof global.DarAdaptiveNavPlacement.getPreference === "function") {
        var live = global.DarAdaptiveNavPlacement.getPreference();
        if (live === "left" || live === "right" || live === "bottom") return live;
      }
    } catch (e) {}
    try {
      var stored = String(global.localStorage.getItem("darNavPositionV2") || "bottom");
      if (stored === "left" || stored === "right") return stored;
    } catch (e2) {}
    return "bottom";
  }

  function sideNavEffective(width, height) {
    var pref = navPreference();
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (pref !== "left" && pref !== "right") return false;
    if (w < SIDE_NAV_MIN_WIDTH || h < SIDE_NAV_MIN_HEIGHT) return false;
    if (document.documentElement && document.documentElement.classList.contains("adaptive-keyboard-open")) return false;
    return true;
  }

  function computeLayoutCapacity(width, height) {
    var w = Math.max(0, Number(width) || 0);
    var h = Math.max(0, Number(height) || 0);
    var sideReserve = sideNavEffective(w, h) ? SIDE_NAV_RESERVE : 0;
    var outer = Math.round(Math.max(24, Math.min(48, w * 0.04)));
    var usable = Math.max(0, w - sideReserve - outer);
    var rail = Math.round(Math.min(RAIL_MAX, Math.max(RAIL_MIN, usable * 0.31)));
    var reader = Math.max(0, usable - rail - MASTER_GAP);
    var readerMin = READER_MIN;
    /* Phone landscape stays a single app surface. A real master/detail split
       needs tablet/Fold-like short-edge height, not only a wide aspect ratio. */
    var phoneLandscape = w > h && h < EXPANDED_MIN_HEIGHT;
    var dual = !phoneLandscape && w >= EXPANDED_MIN && h >= EXPANDED_MIN_HEIGHT && reader >= readerMin;
    return {
      width: w,
      height: h,
      sideReserve: sideReserve,
      outerGutter: outer,
      usable: usable,
      rail: rail,
      gap: MASTER_GAP,
      reader: reader,
      readerMin: readerMin,
      dual: dual
    };
  }

  /**
   * v1326 capacity rule:
   * Dual is enabled only when the real remaining reader pane stays readable
   * after optional side-tab rail + master rail + spacing.
   */
  function isPhoneLandscapeViewport(width, height) {
    var w = Math.max(0, Number(width) || 0);
    var h = Math.max(0, Number(height) || 0);
    return w > h && h < EXPANDED_MIN_HEIGHT;
  }

  function isDualViewport(width, height) {
    return !!computeLayoutCapacity(width, height).dual;
  }

  function resolveLayoutMode(width, height) {
    var w = Number(width) || 0;
    if (w < 600) return "compact";
    return isDualViewport(width, height) ? "expanded" : "medium";
  }

  function navBottomCompact() {
    return "calc(max(7px, calc(env(safe-area-inset-bottom) - 18px)) + 3mm)";
  }

  /* Same absolute width as portrait: size from the short edge, never the wide landscape span. */
  var NAV_EASE = "width .48s cubic-bezier(.22,1,.36,1), max-width .48s cubic-bezier(.22,1,.36,1)";
  var widthLockUntil = 0;
  var lastLandscape = null;

  function capsuleWidthPx(width, height) {
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < 1) return 0;
    var short = h > 0 ? Math.min(w, h) : w;
    var gutter = Math.max(24, Math.round(short * 0.04));
    var avail = Math.max(280, short - gutter);
    var frac = short >= 700 ? 0.62 : 0.94;
    var cap = short >= 900 ? 860 : 900;
    return Math.min(cap, avail, Math.max(300, Math.round(short * frac)));
  }

  /* DAR_NAV_GEOMETRY_SINGLE_OWNER_V1_20261030
   * Both adult app lanes already define a stable #bottomNav geometry in CSS.
   * Never write left/width/height/transform/transition into the bar on a
   * route change. The old inline 'left:50%' conflicted with the TEST
   * left:0/right:0 auto-margin layout; transition on width moved the entire
   * five-tab glass capsule while a button was being tapped.
   * Responsive dimensions are CSS viewport based, not route based. */
  function applyNavLayout(mode, opts) {
    var nav = document.getElementById("bottomNav");
    if (!nav || nav.classList.contains("is-tab-loupe")) return;
    var metrics = measureViewport();
    var landscape = metrics.height > 0 && metrics.width >= metrics.height;
    nav.classList.toggle("is-nav-landscape", landscape);
    nav.classList.remove("is-adaptive-rail");
    nav.classList.add("is-adaptive-centered");
    // No inline geometry. Preserve the original five button nodes, events,
    // selected tab, active reader hiding and native iOS navigation bridge.
    lastLandscape = landscape;
  }

  function applyKeyboardState(metrics) {
    var root = document.documentElement;
    var layoutH =
      document.documentElement.clientHeight || global.innerHeight || metrics.height;
    var visualH = global.visualViewport && Number(global.visualViewport.height) || 0;
    var keyboardLikely = visualH > 0 && layoutH > 0 && visualH < layoutH - 120;
    root.classList.toggle("adaptive-keyboard-open", !!keyboardLikely);
    root.style.setProperty("--layout-vv-height", (visualH || metrics.height) + "px");
    root.style.setProperty("--layout-vv-offset-top", (metrics.offsetTop || 0) + "px");
  }

  function applyOrientationAttrs(metrics) {
    var root = document.documentElement;
    var landscape = metrics.width >= metrics.height;
    var dual = isDualViewport(metrics.width, metrics.height);
    var phoneLandscape = isPhoneLandscapeViewport(metrics.width, metrics.height);
    root.setAttribute("data-orientation", landscape ? "landscape" : "portrait");
    root.setAttribute("data-layout-surface", phoneLandscape ? "phone-landscape" : (dual ? "workspace" : "single"));
    root.classList.toggle("is-layout-landscape", landscape);
    root.classList.toggle("is-phone-landscape", phoneLandscape);
    root.classList.toggle("is-layout-wide", metrics.width >= 600);
    root.classList.toggle("is-fold-dual", dual);
    root.setAttribute("data-fold-dual", dual ? "1" : "0");
  }

  function applyLayout(force) {
    var metrics = measureViewport();
    /* The body/document ResizeObservers fire frequently on content rendering,
       but only actual viewport changes require recalculating root CSS tokens.
       Forced route/orientation updates still run unconditionally. */
    var viewportKey = metrics.width + "|" + metrics.height + "|" + (metrics.offsetTop || 0) +
      "|" + navPreference();
    /* Native WKWebView may overwrite data-layout on route changes without
       changing the viewport. Reassert the measured mode in that case. */
    if (!force && viewportKey === lastAppliedViewportKey &&
        document.documentElement.getAttribute("data-layout") ===
          resolveLayoutMode(metrics.width, metrics.height)) return;
    lastAppliedViewportKey = viewportKey;
    var mode = resolveLayoutMode(metrics.width, metrics.height);
    var dual = isDualViewport(metrics.width, metrics.height);
    var root = document.documentElement;
    var changed = mode !== currentMode;
    var externalOverride = root.getAttribute("data-layout") !== mode;
    var prevDual = root.getAttribute("data-fold-dual") === "1";

    var capacity = computeLayoutCapacity(metrics.width, metrics.height);
    root.style.setProperty("--layout-vw", metrics.width + "px");
    root.style.setProperty("--layout-vh", metrics.height + "px");
    root.style.setProperty("--fold-rail-current", capacity.rail + "px");
    root.style.setProperty("--fold-reader-available", capacity.reader + "px");
    root.style.setProperty("--fold-side-reserve", capacity.sideReserve + "px");
    root.style.setProperty("--fold-content-usable", capacity.usable + "px");
    root.setAttribute("data-fold-capacity", capacity.dual ? "dual" : "single");
    root.setAttribute("data-fold-reader-px", String(Math.round(capacity.reader)));
    if (changed || force || externalOverride) {
      currentMode = mode;
      root.setAttribute("data-layout", mode);
      root.classList.remove("data-layout-expanded-legacy");
    }

    applyOrientationAttrs(metrics);
    applyKeyboardState(metrics);
    applyNavLayout(mode);

    var dualChanged = prevDual !== dual;
    /* An external native attribute reset is a presentation-only correction;
       never broadcast an extra layoutchange that would cause native/WebView
       route rendering to re-enter the DOM mutation observer. */
    if (changed || force || dualChanged) {
      try {
        global.dispatchEvent(
          new CustomEvent("dar:layoutchange", {
            detail: {
              mode: mode,
              width: metrics.width,
              height: metrics.height,
              dual: dual,
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
    /* A forced update arriving during a pending ordinary resize must not get
       lost. Collapse all callbacks into one frame and preserve the force bit. */
    pendingForcedLayout = pendingForcedLayout || !!force;
    if (rafId) return;
    rafId = global.requestAnimationFrame(function () {
      rafId = 0;
      var mustForce = pendingForcedLayout;
      pendingForcedLayout = false;
      applyLayout(mustForce);
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
    [0, 160, 420, 850].forEach(function (ms) {
      orientTimers.push(
        setTimeout(function () {
          applyLayout(true);
        }, ms)
      );
    });
    orientTimers.push(
      setTimeout(function () {
        applyNavLayout(currentMode, { forceWidth: true });
      }, 900)
    );
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

    /* Attribute-only overrides (notably in the native iOS shell) must not
       strand tablets and unfolded screens in the compact breakpoint. Observe
       only the one owned attribute, not subtree styles or DOM content. */
    if (typeof MutationObserver === "function") {
      layoutAttributeObserver = new MutationObserver(function () {
        var metrics = measureViewport();
        if (document.documentElement.getAttribute("data-layout") !==
            resolveLayoutMode(metrics.width, metrics.height)) scheduleApply(false);
      });
      layoutAttributeObserver.observe(document.documentElement, {
        attributes: true, attributeFilter: ["data-layout"]
      });
    }

    global.addEventListener("resize", onResize, { passive: true });
    global.addEventListener("hashchange", function () { scheduleApply(true); }, { passive: true });
    global.addEventListener("pageshow", function () { scheduleApply(true); }, { passive: true });
    global.addEventListener("orientationchange", scheduleOrientBurst, { passive: true });

    if (global.screen && global.screen.orientation && typeof global.screen.orientation.addEventListener === "function") {
      try {
        global.screen.orientation.addEventListener("change", scheduleOrientBurst);
      } catch (e) {}
    }

    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", onResize, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) scheduleOrientBurst();
    });
  }

  var PLACE_KEY = "darAdaptiveNavPlaceV1";
  var COLLAPSE_KEY = "darAdaptiveNavCollapsedV1";
  function getPlacement() {
    try {
      var v = localStorage.getItem(PLACE_KEY);
      return v === "leading" ? "leading" : "trailing";
    } catch (e) {
      return "trailing";
    }
  }
  function setPlacement(v) {
    var next = v === "leading" ? "leading" : "trailing";
    try {
      localStorage.setItem(PLACE_KEY, next);
    } catch (e) {}
    applyLayout(true);
    return next;
  }
  function getCollapsed() {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }
  function setCollapsed(on) {
    try {
      localStorage.setItem(COLLAPSE_KEY, on ? "1" : "0");
    } catch (e) {}
    applyLayout(true);
    return !!on;
  }

  var api = {
    resolveLayoutMode: resolveLayoutMode,
    isDualViewport: isDualViewport,
    isPhoneLandscapeViewport: isPhoneLandscapeViewport,
    isPhoneLandscape: function () {
      var m = measureViewport();
      return isPhoneLandscapeViewport(m.width, m.height);
    },
    getLayoutCapacity: function (width, height) {
      if (arguments.length < 2) {
        var m = measureViewport();
        return computeLayoutCapacity(m.width, m.height);
      }
      return computeLayoutCapacity(width, height);
    },
    getPlacement: getPlacement,
    setPlacement: setPlacement,
    getCollapsed: getCollapsed,
    setCollapsed: setCollapsed,
    getMode: function () {
      return currentMode || resolveLayoutMode(measureViewport().width, measureViewport().height);
    },
    isDual: function () {
      var m = measureViewport();
      return isDualViewport(m.width, m.height);
    },
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
    SIDE_NAV_RESERVE: SIDE_NAV_RESERVE,
    SIDE_NAV_MIN_HEIGHT: SIDE_NAV_MIN_HEIGHT,
    RAIL_MIN: RAIL_MIN,
    RAIL_MAX: RAIL_MAX,
    READER_MIN: READER_MIN,
  };

  global.DarAdaptiveLayout = api;
  global.resolveLayoutMode = resolveLayoutMode;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);


/* v2026-10-08 · Match the carousel viewport to its ACTIVE slide only.
 * Each slide may contain a different amount of text. A flex track normally
 * has the height of its tallest child, leaving giant blank areas on short
 * cards. This reads the natural height; it never edits text, links or nav.
 */
(function (global) {
  "use strict";
  if (global.__DAR_SLIDE_CONTENT_HEIGHT_V1) return;
  global.__DAR_SLIDE_CONTENT_HEIGHT_V1 = true;

  var tracked = new WeakSet();
  var allSlides = new WeakSet();
  var pending = new Set();
  var scheduled = false;
  var rootObserver = null;
  var slideObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          var c = entry.target.closest("[data-slide-carousel]");
          if (c) queue(c);
        });
      }) : null;

  function measure(carousel) {
    if (!carousel.isConnected) return;
    var windowEl = carousel.querySelector(".post-slide-window");
    var slides = carousel.querySelectorAll(".post-slide");
    if (!windowEl || !slides.length) return;
    var raw = parseInt(carousel.dataset.active || "0", 10);
    var index = Number.isFinite(raw) ? Math.max(0, Math.min(slides.length - 1, raw)) : 0;
    var activeSlide = slides[index];
    var height = Math.ceil(Math.max(activeSlide.scrollHeight, activeSlide.offsetHeight));
    if (!Number.isFinite(height) || height < 1) return;
    if (Math.abs(windowEl.getBoundingClientRect().height - height) > 1) {
      windowEl.style.height = height + "px";
    }
  }

  function flush() {
    scheduled = false;
    pending.forEach(measure);
    pending.clear();
  }
  function queue(carousel) {
    if (!carousel || !carousel.isConnected) return;
    pending.add(carousel);
    if (!scheduled) {
      scheduled = true;
      global.requestAnimationFrame(flush);
    }
  }

  function scan() {
    document.querySelectorAll("[data-slide-carousel]").forEach(function (carousel) {
      if (!tracked.has(carousel)) {
        tracked.add(carousel);
        carousel.querySelectorAll(".post-slide").forEach(function (slide) {
          if (slideObserver && !allSlides.has(slide)) {
            allSlides.add(slide);
            slideObserver.observe(slide);
          }
        });
      }
      queue(carousel);
    });
  }
  function changed(records) {
    var hasAdditions = false;
    records.forEach(function (r) {
      if (r.type === "attributes" && r.target.matches &&
          r.target.matches("[data-slide-carousel]")) queue(r.target);
      else if (r.type === "childList") hasAdditions = true;
    });
    if (hasAdditions) scan();
  }

  function start() {
    if (!document.body) return;
    rootObserver = new MutationObserver(changed);
    rootObserver.observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["data-active"]
    });
    global.addEventListener("resize", scan, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scan).catch(function () {});
    }
    scan();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
