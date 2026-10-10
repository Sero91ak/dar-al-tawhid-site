/**
 * Soft boot overlay for visitor + test web apps (iOS parity).
 * v675 · Android-PWA: Standard-Logo + 0–100%-Loader mit robustem PWA-Startmarker.
 * Launcher-/Installations-Icon bleibt strikt getrennt vom Boot-Logo.
 */
(function () {
  /* PUBLIC WEBSITE: NEVER SHOW APP SOFT BOOT */
  try {
    var __darBootUa = String(navigator.userAgent || "");
    var __darBootPath = String(location.pathname || "");
    var __darBootNative =
      /DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(__darBootUa) ||
      window.DAR_OFFICIAL_IOS_APP === true ||
      window.DAR_IOS_NATIVE_APP === true ||
      window.DAR_ANDROID_NATIVE_APP === true;
    var __darBootStandalone = false;
    try {
      var __darBootParamsEarly = new URLSearchParams(location.search || "");
      var __darBootLaunchMarker = __darBootParamsEarly.get("pwa") === "1";
      var __darBootRemembered = false;
      try { __darBootRemembered = sessionStorage.getItem("dar_pwa_launch_session_v1") === "1"; } catch (__darRememberErr) {}
      __darBootStandalone =
        !!(window.matchMedia && (
          window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches ||
          window.matchMedia("(display-mode: minimal-ui)").matches
        )) ||
        window.navigator.standalone === true ||
        __darBootLaunchMarker ||
        __darBootRemembered;
      if (__darBootStandalone) {
        try { sessionStorage.setItem("dar_pwa_launch_session_v1", "1"); } catch (__darRememberWriteErr) {}
      }
    } catch (__darStandaloneErr) {}
    var __darDesktopPublic = !!document.querySelector('link[href*="/desktop-preview/desktop-overhaul.css"]');
    var __darPublicRoot = (__darBootPath === "/" || __darBootPath === "/index.html");

    // Normal website browsing never receives the app loader. Installed PWA standalone does.
    if (!__darBootNative && !__darBootStandalone && __darDesktopPublic) {
      window.__darSoftBootPublicSkip = true;
      return;
    }
    if (!__darBootNative && !/\bAndroid\b/i.test(__darBootUa) && __darPublicRoot) {
      try {
        if (document.documentElement) {
          document.documentElement.classList.remove("dar-soft-booting");
          document.documentElement.style.visibility = "hidden";
          document.documentElement.style.background = "#fbfaf6";
        }
      } catch (__darHideErr) {}
      var __darBootParams = new URLSearchParams(location.search || "");
      var __darBootPage = (__darBootParams.get("page") || "start").toLowerCase();
      ["homescreen","app","mobile","source","darsw"].forEach(function (k) { __darBootParams.delete(k); });
      __darBootParams.set("page", __darBootPage);
      var __darBootTarget = "/desktop-preview/?" + __darBootParams.toString();
      location.replace(__darBootTarget);
      return;
    }
  } catch (__darPublicGateErr) {}
  if (window.__darSoftBootInstalled) return;
  window.__darSoftBootInstalled = true;

  var OVERLAY_ID = "dar-soft-boot";
  var STANDARD_BOOT_LOGO = "/watermark-my-logo-full.png";
  var MAX_FAKE = 0.94;
  var FADE_HOLD_MS = 280;
  var HUNDRED_HOLD_MS = 380;
  var MIN_SHOW_MS = 1250;
  var HARD_TIMEOUT_MS = 6500;
  // Isolated /pwa/ boot: never present 100% before the real app has rendered.
  var IS_DEDICATED_PWA = /^\/pwa(?:\/|$)/.test(String(location.pathname || ""));
  var PWA_READY_TIMEOUT_MS = 16000;
  var THEME_FILLS = {
    dark: "#050706",
    light: "#f7f0df",
    soft: "#f2e6e2",
    royal: "#07162c",
    bordeaux: "#140B0C",
    "dar-al-layl": "#050605",
    eisgold: "#e8f3fb",
    aurora: "#080806"
  };
  var progress = 0;
  var finished = false;
  var finishScheduled = false;
  var syncing = false;
  var timer = null;
  var hardTimer = null;
  var startedAt = Date.now();
  var barEl = null;
  var pctEl = null;
  var overlayEl = null;

  function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch (e) { return false; }
  }
  function resolveThemeId() {
    try {
      var t = (document.documentElement && document.documentElement.getAttribute("data-theme")) || "";
      if (t && THEME_FILLS[t]) return t;
      t = localStorage.getItem("darThemeV1") || "dark";
      if (t === "emerald" || t === "smaragd" || t === "aurora") t = "dark";
      if (!THEME_FILLS[t]) t = "dark";
      return t;
    } catch (e) { return "dark"; }
  }
  function hexFromCssValue(raw) {
    if (!raw) return "";
    var m = String(raw).trim().match(/#[0-9a-fA-F]{3,8}/);
    return m ? m[0] : "";
  }
  function resolveFill() {
    var mapped = THEME_FILLS[resolveThemeId()];
    if (mapped) return mapped;
    try {
      var root = document.documentElement;
      if (root) {
        var cs = getComputedStyle(root);
        var live = hexFromCssValue(cs.getPropertyValue("--outer-bg-flat")) || hexFromCssValue(cs.getPropertyValue("--theme-page-bg")) || hexFromCssValue(cs.getPropertyValue("--dar-boot-fill")) || hexFromCssValue(cs.getPropertyValue("--bg"));
        if (live) return live;
      }
    } catch (e) {}
    return THEME_FILLS.dark;
  }
  function syncEdgeFill() {
    if (syncing || finished) return resolveFill();
    syncing = true;
    try {
      var fill = resolveFill();
      var root = document.documentElement;
      if (!root) return fill;
      root.style.setProperty("--dar-boot-fill", fill);
      root.style.removeProperty("--theme-page-bg");
      if (!finished) {
        root.classList.add("dar-soft-booting");
        root.style.setProperty("background-color", fill, "important");
      }
      var meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        (document.head || root).appendChild(meta);
      }
      meta.setAttribute("content", fill);
      var tile = document.querySelector('meta[name="msapplication-TileColor"]');
      if (tile) tile.setAttribute("content", fill);
      if (overlayEl) overlayEl.style.backgroundColor = fill;
      window.__DAR_BOOT_FILL = fill;
      return fill;
    } catch (e) { return THEME_FILLS.dark; }
    finally { syncing = false; }
  }
  function removeAllOverlays(keep) {
    try {
      var nodes = document.querySelectorAll("#" + OVERLAY_ID);
      for (var i = 0; i < nodes.length; i++) {
        if (keep && nodes[i] === keep) continue;
        if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
      }
    } catch (e) {}
  }
  function standardOverlayMarkup() {
    return '<img class="dar-soft-boot__mark" src="' + STANDARD_BOOT_LOGO + '" alt="" width="148" height="148" decoding="async">' +
      '<p class="dar-soft-boot__title brand-title">' + (window.DAR_BRAND_NAME || "DĀR AL TAWḤĪD") + '</p>' +
      '<p class="dar-soft-boot__sub">QUR’ĀN • SUNNAH • ĀTHĀR</p>' +
      '<div class="dar-soft-boot__track" aria-hidden="true"><div class="dar-soft-boot__bar"></div></div>' +
      '<p class="dar-soft-boot__pct">0%</p>';
  }
  function enforceStandardOverlay(el) {
    if (!el) return;
    try {
      var mark = el.querySelector(".dar-soft-boot__mark");
      var track = el.querySelector(".dar-soft-boot__track");
      var bar = el.querySelector(".dar-soft-boot__bar");
      var pct = el.querySelector(".dar-soft-boot__pct");
      var title = el.querySelector(".dar-soft-boot__title");
      if (!mark || !track || !bar || !pct || !title) {
        el.innerHTML = standardOverlayMarkup();
        return;
      }
      if (mark.getAttribute("src") !== STANDARD_BOOT_LOGO) mark.setAttribute("src", STANDARD_BOOT_LOGO);
      mark.setAttribute("width", "148");
      mark.setAttribute("height", "148");
      mark.removeAttribute("data-dar-pwa-logo");
    } catch (e) {
      try { el.innerHTML = standardOverlayMarkup(); } catch (e2) {}
    }
  }
  function ensureOverlay() {
    if (finished) return overlayEl;
    var existing = document.querySelectorAll("#" + OVERLAY_ID);
    overlayEl = existing.length ? existing[existing.length - 1] : document.getElementById(OVERLAY_ID);
    if (overlayEl) {
      removeAllOverlays(overlayEl);
      if (overlayEl.parentNode === document.documentElement && document.body) {
        try { document.body.appendChild(overlayEl); } catch (e) {}
      }
      enforceStandardOverlay(overlayEl);
      barEl = overlayEl.querySelector(".dar-soft-boot__bar");
      pctEl = overlayEl.querySelector(".dar-soft-boot__pct");
      syncEdgeFill();
      return overlayEl;
    }
    overlayEl = document.createElement("div");
    overlayEl.id = OVERLAY_ID;
    overlayEl.setAttribute("role", "status");
    overlayEl.setAttribute("aria-live", "polite");
    overlayEl.innerHTML = standardOverlayMarkup();
    var host = document.body || document.documentElement;
    host.appendChild(overlayEl);
    barEl = overlayEl.querySelector(".dar-soft-boot__bar");
    pctEl = overlayEl.querySelector(".dar-soft-boot__pct");
    syncEdgeFill();
    return overlayEl;
  }
  function paint() {
    var pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
    if (barEl) barEl.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
  }
  function tick() {
    if (finished) return;
    var remain = MAX_FAKE - progress;
    if (remain <= 0.002) { progress = MAX_FAKE; paint(); return; }
    progress += remain * 0.045;
    if (progress > MAX_FAKE) progress = MAX_FAKE;
    paint();
  }
  function startRamp() {
    if (timer || finished) return;
    if (prefersReducedMotion()) { progress = MAX_FAKE; paint(); return; }
    timer = setInterval(tick, 60);
  }
  function clearRamp() { if (timer) { clearInterval(timer); timer = null; } }
  function finish() {
    if (finished) return;
    if (IS_DEDICATED_PWA && !viewLooksReady()) return;
    var elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SHOW_MS) {
      if (!finishScheduled) { finishScheduled = true; setTimeout(finish, MIN_SHOW_MS - elapsed); }
      return;
    }
    finished = true;
    window.__darSoftBootLocked = true;
    window.__darAppBootPainted = true;
    finishScheduled = false;
    clearRamp();
    if (hardTimer) { clearTimeout(hardTimer); hardTimer = null; }
    progress = 1;
    paint();
    setTimeout(function () {
      try {
        if (document.documentElement) {
          var root = document.documentElement;
          root.classList.remove("dar-soft-booting");
          root.style.removeProperty("background-color");
          root.style.removeProperty("background");
          root.style.removeProperty("background-image");
          root.style.removeProperty("--theme-page-bg");
          var live = resolveFill();
          root.style.setProperty("--dar-boot-fill", live);
          window.__DAR_BOOT_FILL = live;
          var meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", live);
        }
      } catch (e) {}
      var all = [];
      try { all = document.querySelectorAll("#" + OVERLAY_ID); } catch (e) {}
      if (!all.length) return;
      setTimeout(function () {
        for (var i = 0; i < all.length; i++) { try { all[i].classList.add("is-done"); } catch (e) {} }
        setTimeout(function () { removeAllOverlays(null); overlayEl = null; }, 300);
      }, FADE_HOLD_MS);
    }, HUNDRED_HOLD_MS);
  }
  function viewLooksReady() {
    try {
      if (window.__darAppBootOk && !IS_DEDICATED_PWA) return true;
      var view = document.getElementById("appView") || document.getElementById("pageRoot");
      if (!view) return false;
      var text = (view.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text === "App wird geladen…" || text === "App wird geladen...") return false;
      if (view.querySelector(".loading") && text.length < 40) return false;
      return text.length > 24 || !!view.querySelector("section, article, .premium-surface, .sf-app, .qov-page, .more-page, .quiz-home");
    } catch (e) { return false; }
  }
  function showPwaBootFailure() {
    if (finished || !IS_DEDICATED_PWA || viewLooksReady()) { maybeFinish(); return; }
    clearRamp();
    progress = MAX_FAKE;
    paint();
    var host = ensureOverlay();
    if (!host || host.querySelector("#dar-pwa-boot-retry")) return;
    var message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.style.cssText = "max-width:320px;text-align:center;font-size:13px;line-height:1.5;margin:2px 18px 0";
    message.textContent = "Die App konnte nicht vollständig geladen werden. Bitte erneut versuchen.";
    var retry = document.createElement("button");
    retry.id = "dar-pwa-boot-retry";
    retry.type = "button";
    retry.style.cssText = "border:1px solid #d4b56a;border-radius:12px;padding:11px 22px;background:transparent;color:inherit;font:700 13px system-ui;cursor:pointer";
    retry.textContent = "Erneut laden";
    retry.addEventListener("click", function () {
      location.replace("/pwa/?pwa=1&retry=" + Date.now());
    });
    host.appendChild(message);
    host.appendChild(retry);
  }
  function maybeFinish() {
    if (finished || window.__darSoftBootLocked) return;
    var ready = viewLooksReady();
    if (!window.__darAppBootOk && !ready) return;
    // Legacy visitor/test app still uses the explicit boot-ready signal.
    // Desktop/PWA uses #pageRoot and may finish as soon as its real content is painted.
    if (!window.__darAppBootOk && !document.getElementById("pageRoot")) return;
    finish();
  }
  function releaseChrome() {
    try {
      var root = document.documentElement;
      if (root) {
        root.classList.remove("dar-soft-booting");
        root.style.removeProperty("background-color");
        root.style.removeProperty("background");
        root.style.removeProperty("background-image");
      }
      if (document.body) document.body.style.removeProperty("overflow");
      removeAllOverlays(null);
      overlayEl = null;
    } catch (e) {}
  }
  function install() {
    /* PUBLIC WEBSITE SOFT BOOT GUARD v2 */
    try {
      var ua = String(navigator.userAgent || "");
      var pth = String(location.pathname || "");
      var nativeReq = /DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(ua) ||
        window.DAR_OFFICIAL_IOS_APP === true || window.DAR_IOS_NATIVE_APP === true || window.DAR_ANDROID_NATIVE_APP === true;
      var standaloneReq = false;
      try {
        var installParams = new URLSearchParams(location.search || "");
        var installLaunchMarker = installParams.get("pwa") === "1";
        var installRemembered = false;
        try { installRemembered = sessionStorage.getItem("dar_pwa_launch_session_v1") === "1"; } catch (eRememberInstall) {}
        standaloneReq =
          !!(window.matchMedia && (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.matchMedia("(display-mode: fullscreen)").matches ||
            window.matchMedia("(display-mode: minimal-ui)").matches
          )) ||
          window.navigator.standalone === true ||
          installLaunchMarker ||
          installRemembered ||
          window.__DAR_PWA_STANDARD_BOOT === true;
      } catch (eStandalone) {}
      var desktopPublic = !!document.querySelector('link[href*="/desktop-preview/desktop-overhaul.css"]');
      if (!nativeReq && !standaloneReq && ((pth === "/" || pth === "/index.html") || desktopPublic)) {
        finished = true;
        releaseChrome();
        return;
      }
      if (standaloneReq) {
        try {
          window.__DAR_PWA_STANDARD_BOOT = true;
          document.documentElement.classList.add("dar-pwa-standalone-boot");
        } catch (ePwaClass) {}
      }

      var root = document.documentElement;
      var isIosNative = (root && root.classList.contains("dar-ios-native-app")) || /DarAlTawhid-iOS/i.test(ua);
      var isAndroidNative = (root && root.classList.contains("dar-android-native-app")) || !!window.DAR_ANDROID_NATIVE_APP || /DarAlTawhidAndroid/i.test(ua);
      if (isIosNative || isAndroidNative) {
        try {
          if (isAndroidNative) {
            window.DAR_ANDROID_NATIVE_APP = true;
            if (root) root.classList.add("is-android", "dar-android-native-app");
          }
        } catch (e2) {}
        finished = true;
        releaseChrome();
        return;
      }
    } catch (e) {}
    try {
      var early = THEME_FILLS[resolveThemeId()] || THEME_FILLS.dark;
      window.__DAR_BOOT_FILL = early;
      if (document.documentElement) {
        document.documentElement.style.setProperty("--dar-boot-fill", early);
        document.documentElement.style.removeProperty("--theme-page-bg");
        document.documentElement.classList.add("dar-soft-booting");
      }
    } catch (e) {}
    ensureOverlay();
    paint();
    startRamp();
    hardTimer = setTimeout(function () {
      if (IS_DEDICATED_PWA && !viewLooksReady()) showPwaBootFailure();
      else finish();
    }, IS_DEDICATED_PWA ? PWA_READY_TIMEOUT_MS : HARD_TIMEOUT_MS);
    try {
      if (/Android/i.test(String(navigator.userAgent || "")) && !IS_DEDICATED_PWA) {
        setTimeout(function () { if (!finished) finish(); }, 2200);
        setTimeout(function () { if (finished) return; try { releaseChrome(); finished = true; window.__darSoftBootLocked = true; } catch (e3) {} }, 3800);
      }
    } catch (e4) {}
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { ensureOverlay(); syncEdgeFill(); paint(); setTimeout(maybeFinish, 60); }, { once: true });
    } else { syncEdgeFill(); setTimeout(maybeFinish, 60); }
    window.addEventListener("load", function () { setTimeout(maybeFinish, 40); setTimeout(function () { if (!finished && (!IS_DEDICATED_PWA || viewLooksReady())) finish(); }, 4000); });
    window.addEventListener("pageshow", function (ev) { try { if (ev && ev.persisted && /Android/i.test(String(navigator.userAgent || ""))) { location.reload(); return; } } catch (e) {} setTimeout(maybeFinish, 40); });
    window.addEventListener("hashchange", function () { if (finished || window.__darSoftBootLocked) return; setTimeout(maybeFinish, 60); });
    try {
      var mo = new MutationObserver(function (records) {
        if (finished || syncing) return;
        var themeChanged = false;
        for (var i = 0; i < records.length; i++) { if (records[i].attributeName === "data-theme") themeChanged = true; }
        if (themeChanged) syncEdgeFill();
        maybeFinish();
      });
      var startObserve = function () {
        var view = document.getElementById("appView") || document.getElementById("pageRoot");
        if (view) mo.observe(view, { childList: true, subtree: true, characterData: true });
        if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      };
      if (document.body) startObserve(); else document.addEventListener("DOMContentLoaded", startObserve, { once: true });
    } catch (e) {}
    window.__darSoftBootFinish = finish;
    window.__darSoftBootSyncFill = syncEdgeFill;
  }
  install();
})();

/* HADITH_LIBRARY_GATE_LOADER_V3 */
(function () {
  if (window.__DAR_HADITH_LIBRARY_GATE_LOADER_V3) return;
  window.__DAR_HADITH_LIBRARY_GATE_LOADER_V3 = true;
  function base() {
    try {
      var p = String(location.pathname || "");
      if (p === "/test" || p.indexOf("/test/") === 0) return "/test/assets/";
    } catch (e) {}
    return "/assets/";
  }
  function loadCss() {
    var existing = document.querySelector('link[href*="hadith-library-gate.css"]');
    if (existing) {
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = base() + "hadith-library-gate.css?v=8";
    document.head.appendChild(link);
  }
  function loadJs() {
    var existing = document.querySelector('script[src*="hadith-library-gate.js"]');
    if (existing) {
      return;
    }
    var script = document.createElement("script");
    script.setAttribute("defer","");
    script.src = base() + "hadith-library-gate.js?v=12";
    (document.head || document.documentElement).appendChild(script);
  }
  function boot() { loadCss(); loadJs(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
