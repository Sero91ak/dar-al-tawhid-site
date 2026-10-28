/**
 * DĀR AL TAWḤĪD — Adaptive Layout Controller
 * Compact: Smartphone, Fold geschlossen, Tablet Hochformat → Einspalte
 * Expanded: Fold geöffnet, Tablet Querformat, große Breite → Zwei-Bereichs-Modus
 * Workspace V2: original five-tab navigation switches between bottom (compact)
 * and a leading rail (wide); folded/iPad list-detail panes own separate scrolling.
 */
(function (global) {
  "use strict";

  if (global.__DAR_ADAPTIVE_LAYOUT_V1326) return;
  global.__DAR_ADAPTIVE_LAYOUT_V1326 = true;

  var COMPACT_MAX = 599;
  /* v1326: capacity based — no device-name or fixed desktop-only breakpoint. */
  var EXPANDED_MIN = 760;
  var EXPANDED_PORTRAIT_MIN = 760;
  var EXPANDED_MIN_HEIGHT = 540;
  var SIDE_NAV_RESERVE = 76;
  var SIDE_NAV_MIN_WIDTH = 760;
  var SIDE_NAV_MIN_HEIGHT = 360;
  var RAIL_MIN = 240;
  var RAIL_MAX = 360;
  var MASTER_GAP = 18;
  var READER_MIN = 440;
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
    if (vvW > 0 && vvH > 0 && clientW > 0 && clientH > 0) {
      var vvLandscape = vvW >= vvH;
      var clientLandscape = clientW >= clientH;
      if (vvLandscape === clientLandscape) {
        w = vvW;
        h = vvH;
      }
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
    var sideReserve = w >= 880 && h >= 560 ? 106 : 0;
    var outer = Math.round(Math.max(24, Math.min(40, w * 0.035)));
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

  function applyNavLayout(mode, opts) {
    var nav = document.getElementById("bottomNav");
    if (!nav) return;
    if (nav.classList.contains("is-tab-loupe")) return;
    // DĀR Workspace V2 owns original five-tab positioning on expanded iPads/Folds.
    if (global.DarAdultWorkspaceV2 && global.DarAdultWorkspaceV2.ownsNavigation()) return;
    // DUOS_SINGLE_OWNER_V1381 (Dar Test only).
    // The legacy bottom-bar controller must NEVER recenter a side rail,
    // including during SPA view replacement, orientation races and before
    // DarAdaptiveNavPlacement has published its next effective state.
    // This is intentionally DOM/capacity based and independent of JS timing.
    var testPath = String(global.location && global.location.pathname || "");
    if (testPath === "/test" || testPath.indexOf("/test/") === 0) {
      var rootForNav = document.documentElement;
      var layoutW = Number(rootForNav && rootForNav.clientWidth) || Number(global.innerWidth) || 0;
      var layoutH = Number(rootForNav && rootForNav.clientHeight) || Number(global.innerHeight) || 0;
      var blockedSide = rootForNav && rootForNav.classList.contains("adaptive-keyboard-open");
      var inChat = document.body && document.body.classList.contains("is-ilm-chat-route");
      if (layoutW >= 640 && layoutH >= 340 && !blockedSide && !inChat) {
        var prefSide = "bottom";
        try {
          prefSide = global.DarAdaptiveNavPlacement &&
            typeof global.DarAdaptiveNavPlacement.getPreference === "function"
            ? global.DarAdaptiveNavPlacement.getPreference()
            : String(global.localStorage.getItem("darNavPositionV2") || "bottom");
        } catch (_) {}
        var domSide = rootForNav && rootForNav.getAttribute("data-dar-nav-position");
        if (prefSide === "left" || prefSide === "right" ||
            domSide === "left" || domSide === "right" ||
            nav.classList.contains("is-adaptive-rail")) return;
      }
    }
    try {
      if (global.DarAdaptiveNavPlacement &&
          typeof global.DarAdaptiveNavPlacement.getEffectivePosition === "function") {
        var side = global.DarAdaptiveNavPlacement.getEffectivePosition();
        if (side === "left" || side === "right") return;
      }
    } catch (e0) {}
    try {
      if (global.DarTestThumbNav && typeof global.DarTestThumbNav.isActive === "function" &&
          global.DarTestThumbNav.isActive()) return;
    } catch (e1) {}
    if (document.body && document.body.classList.contains("is-ilm-chat-route")) {
      return;
    }
    if (document.body && document.body.classList.contains("reader-mode")) {
      return;
    }

    var metrics = measureViewport();
    var landscape = metrics.height > 0 && metrics.width >= metrics.height;
    var target = capsuleWidthPx(metrics.width, metrics.height);
    var now = Date.now();
    var orientChanged = lastLandscape !== null && lastLandscape !== landscape;
    var forceWidth = opts && opts.forceWidth;

    nav.classList.toggle("is-nav-landscape", landscape);
    nav.classList.remove("is-adaptive-rail");
    nav.classList.add("is-adaptive-centered");
    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("left", "50%", "important");
    nav.style.setProperty("right", "auto", "important");
    nav.style.setProperty("transition", NAV_EASE, "important");
    nav.style.setProperty("top", "auto", "important");
    nav.style.setProperty("bottom", navBottomCompact(), "important");
    nav.style.setProperty("height", "auto", "important");
    nav.style.setProperty("min-height", "68px", "important");
    nav.style.setProperty("max-height", "none", "important");
    nav.style.setProperty("transform", "translateX(-50%)", "important");
    nav.style.setProperty("-webkit-transform", "translateX(-50%)", "important");
    nav.style.setProperty("flex-direction", "row", "important");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("z-index", "40", "important");

    if (target > 0 && (forceWidth || orientChanged || now >= widthLockUntil)) {
      /* Layout reads force style calculation: only measure for actual rotation.
         Ordinary resize/route checks can set the target width directly. */
      var from = target;
      if (orientChanged) {
        var bounds = nav.getBoundingClientRect();
        from = Math.round((bounds && bounds.width) || target);
      }
      if (orientChanged && Math.abs(from - target) > 8) {
        nav.style.setProperty("width", from + "px", "important");
        nav.style.setProperty("max-width", from + "px", "important");
        try {
          nav.offsetWidth;
        } catch (e) {}
        global.requestAnimationFrame(function () {
          nav.style.setProperty("width", target + "px", "important");
          nav.style.setProperty("max-width", target + "px", "important");
        });
        widthLockUntil = now + 500;
      } else {
        nav.style.setProperty("width", target + "px", "important");
        nav.style.setProperty("max-width", target + "px", "important");
      }
      try {
        document.documentElement.style.setProperty("--dar-nav-width", target + "px");
      } catch (e2) {}
    }
    lastLandscape = landscape;
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

/* DAR_ADULT_WORKSPACE_V2_20261028
 * One viewport model for adult visitor WKWebView, Safari and Android WebView/PWA.
 * Keeps original #bottomNav DOM node, real routes, colors and content unchanged.
 * The fold pane split is rendered by existing DarFold.shell; this controller
 * owns layout mode, parent for the same nav, keyboard and orientation changes.
 */
(function(global){
  "use strict";
  if(global.DarAdultWorkspaceV2)return;
  var path=String(global.location&&global.location.pathname||"");
  if(/^\/test(?:\/|$)/.test(path))return; // isolated DAR TEST navigation lane
  var doc=global.document||document;
  if(!doc||!doc.documentElement)return; // support isolated static VM tests
  var root=doc.documentElement;
  var originalParent=null, originalNext=null, originalStyles=null;
  var navNode=null, side=false, pending=0, lastKey="", lastMode="";
  var props=["position","left","right","top","bottom","width","min-width","max-width",
    "height","min-height","max-height","margin","padding","transform","-webkit-transform",
    "flex-direction","justify-content","align-items","gap","z-index","transition","pointer-events"];
  function size(){
    var w=Math.max(0,root.clientWidth||global.innerWidth||0);
    var h=Math.max(0,root.clientHeight||global.innerHeight||0);
    var vv=global.visualViewport,field=doc.activeElement;
    var keyboard=!!(vv&&h-vv.height>140&&field&&
      (field.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(field.tagName||"")));
    var cap=global.DarAdaptiveLayout&&global.DarAdaptiveLayout.getLayoutCapacity?
      global.DarAdaptiveLayout.getLayoutCapacity(w,h):null;
    var rail=cap&&cap.rail?cap.rail:Math.min(360,Math.max(240,(w-32)*.31));
    var reserve=w>=880&&h>=560?106:0;
    var reader=w-reserve-Math.max(24,Math.min(40,w*.035))-rail-18;
    var dual=!keyboard&&w>=760&&h>=540&&reader>=440&&!!(!cap||cap.dual);
    var vertical=dual&&w>=880&&h>=560;
    var mode=vertical?"wide":dual?"dual":"single";
    var rtl=root.getAttribute("dir")==="rtl"||root.dir==="rtl";
    return {width:w,height:h,keyboard:keyboard,dual:dual,
      vertical:vertical,mode:mode,rtl:rtl,rail:Math.round(rail),reader:Math.round(reader)};
  }
  function snapshot(nav){
    originalParent=nav.parentNode;originalNext=nav.nextSibling;
    originalStyles={};navNode=nav;
    props.forEach(function(p){
      originalStyles[p]=[nav.style.getPropertyValue(p),nav.style.getPropertyPriority(p)];
    });
  }
  function restore(nav){
    if(!side)return;
    nav.classList.remove("dar-ws2-original-tabs");
    if(originalStyles)props.forEach(function(p){
      var v=originalStyles[p];
      if(v&&v[0])nav.style.setProperty(p,v[0],v[1]);
      else nav.style.removeProperty(p);
    });
    if(originalParent&&originalParent.isConnected&&nav.parentNode===root){
      if(originalNext&&originalNext.parentNode===originalParent)
        originalParent.insertBefore(nav,originalNext);
      else originalParent.appendChild(nav);
    }
    side=false;originalStyles=null;navNode=null;
    try{
      if(global.DarAdaptiveLayout&&global.DarAdaptiveLayout.syncNav)
        global.DarAdaptiveLayout.syncNav();
    }catch(e){}
  }
  function moveToSide(nav,rtl){
    if(!side||navNode!==nav){snapshot(nav);side=true;}
    if(nav.parentNode!==root)root.appendChild(nav); // never clone the 3D tabs
    nav.classList.remove("is-adaptive-centered");
    nav.classList.add("dar-ws2-original-tabs");
    var dirty=nav.style.getPropertyValue("position")!=="fixed"||
      nav.style.getPropertyValue("transform")!=="translateY(-50%)"||
      nav.style.getPropertyValue("left")!==(rtl?"auto":"max(10px,env(safe-area-inset-left,0px))")||
      nav.style.getPropertyValue("right")!==(rtl?"max(10px,env(safe-area-inset-right,0px))":"auto");
    if(!dirty)return;
    var values={
      position:"fixed",top:"50%",bottom:"auto",
      left:rtl?"auto":"max(10px,env(safe-area-inset-left,0px))",
      right:rtl?"max(10px,env(safe-area-inset-right,0px))":"auto",
      width:"76px","min-width":"76px","max-width":"76px",
      height:"min(404px,calc(100dvh - 36px))","min-height":"0","max-height":"404px",
      margin:"0",padding:"6px",transform:"translateY(-50%)",
      "-webkit-transform":"translateY(-50%)","flex-direction":"column",
      "justify-content":"space-evenly","align-items":"center",gap:"2px",
      "z-index":"96",transition:"none","pointer-events":"auto"
    };
    Object.keys(values).forEach(function(p){
      nav.style.setProperty(p,values[p],"important");
    });
  }
  function sync(){
    if(!doc.body)return;
    var m=size();
    var nav=doc.getElementById("bottomNav");
    var newKey=[m.width,m.height,m.mode,m.keyboard,m.rtl].join("|");
    if(newKey!==lastKey){
      root.setAttribute("data-dar-workspace",m.mode);
      root.setAttribute("data-dar-workspace-nav",m.vertical?"side":"bottom");
      root.setAttribute("data-dar-workspace-dir",m.rtl?"rtl":"ltr");
      root.style.setProperty("--dar-ws2-list-width",m.rail+"px");
      root.style.setProperty("--dar-ws2-reader-available",m.reader+"px");
      lastKey=newKey;
    }
    if(m.vertical&&nav)moveToSide(nav,m.rtl);
    else if(nav)restore(nav);
    if(lastMode!==m.mode){
      lastMode=m.mode;
      // Existing master/detail route component retains selection and scroll.
      if(global.DarFold&&typeof global.DarFold.sync==="function"){
        try{global.DarFold.sync()}catch(e){}
      }
    }
  }
  function schedule(){
    if(pending)return;
    pending=global.requestAnimationFrame(function(){pending=0;sync()});
  }
  var api={
    measure:size,
    sync:sync,
    ownsNavigation:function(){return side;},
    getMode:function(){return lastMode||size().mode}
  };
  global.DarAdultWorkspaceV2=api;
  // Compatibility for existing app status/introspection callers.
  global.DarAdultFoldWide={measure:size,sync:sync};
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  ["resize","orientationchange","pageshow","hashchange","dar:view-rendered","dar:layoutchange"].forEach(function(k){
    global.addEventListener(k,schedule,{passive:true});
  });
  if(global.visualViewport)
    global.visualViewport.addEventListener("resize",schedule,{passive:true});
  // After route navigation, original tab is never copied; retain its handlers.
  doc.addEventListener("click",function(e){
    if(e.target&&e.target.closest&&e.target.closest("#bottomNav .bottom-nav-btn"))
      schedule();
  },true);
})(typeof window!=="undefined"?window:this);
