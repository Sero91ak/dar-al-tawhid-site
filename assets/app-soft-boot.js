/**
 * Soft boot overlay for visitor + test web apps (iOS parity).
 * v670 · Titel DĀR AL TAWḤĪD; Leiste rund (CSS in index). Overlay nie auf <html>.
 */
(function () {
  if (window.__darSoftBootInstalled) return;
  window.__darSoftBootInstalled = true;

  var OVERLAY_ID = "dar-soft-boot";
  var MAX_FAKE = 0.94;
  var FADE_HOLD_MS = 280;
  var HUNDRED_HOLD_MS = 380;
  var MIN_SHOW_MS = 900;
  var HARD_TIMEOUT_MS = 6500;
  /* Original-Hauptfarben je Erscheinungsbild (THEME_META / theme-page-bg) */
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
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  }

  function resolveThemeId() {
    try {
      var t = (document.documentElement && document.documentElement.getAttribute("data-theme")) || "";
      if (t && THEME_FILLS[t]) return t;
      t = localStorage.getItem("darThemeV1") || "dark";
      if (t === "emerald" || t === "smaragd" || t === "aurora") t = "dark";
      if (!THEME_FILLS[t]) t = "dark";
      return t;
    } catch (e) {
      return "dark";
    }
  }

  function hexFromCssValue(raw) {
    if (!raw) return "";
    var m = String(raw).trim().match(/#[0-9a-fA-F]{3,8}/);
    return m ? m[0] : "";
  }

  function resolveFill() {
    /* Immer zuerst aktuelles Erscheinungsbild — kein festgeklebtes Boot-Blau. */
    var mapped = THEME_FILLS[resolveThemeId()];
    if (mapped) return mapped;
    try {
      var root = document.documentElement;
      if (root) {
        var cs = getComputedStyle(root);
        var live =
          hexFromCssValue(cs.getPropertyValue("--outer-bg-flat")) ||
          hexFromCssValue(cs.getPropertyValue("--theme-page-bg")) ||
          hexFromCssValue(cs.getPropertyValue("--dar-boot-fill")) ||
          hexFromCssValue(cs.getPropertyValue("--bg"));
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
      /* Nur Boot-Fill setzen — --theme-page-bg NIEMALS inline (blockiert Theme-CSS). */
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
      if (overlayEl) {
        overlayEl.style.backgroundColor = fill;
      }
      window.__DAR_BOOT_FILL = fill;
      return fill;
    } catch (e) {
      return THEME_FILLS.dark;
    } finally {
      syncing = false;
    }
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

  function ensureOverlay() {
    if (finished) return overlayEl;
    var existing = document.querySelectorAll("#" + OVERLAY_ID);
    overlayEl = existing.length ? existing[existing.length - 1] : document.getElementById(OVERLAY_ID);
    if (overlayEl) {
      removeAllOverlays(overlayEl);
      if (overlayEl.parentNode === document.documentElement && document.body) {
        try { document.body.appendChild(overlayEl); } catch (e) {}
      }
      barEl = overlayEl.querySelector(".dar-soft-boot__bar");
      pctEl = overlayEl.querySelector(".dar-soft-boot__pct");
      syncEdgeFill();
      return overlayEl;
    }
    overlayEl = document.createElement("div");
    overlayEl.id = OVERLAY_ID;
    overlayEl.setAttribute("role", "status");
    overlayEl.setAttribute("aria-live", "polite");
    overlayEl.innerHTML =
      '<img class="dar-soft-boot__mark" src="/watermark-my-logo-full.png" alt="" width="148" height="148" decoding="async">' +
      '<p class="dar-soft-boot__title brand-title">' + (window.DAR_BRAND_NAME || "DĀR AL TAWḤĪD") + '</p>' +
      '<p class="dar-soft-boot__sub">Qurʾān · Sunnah · Āthār</p>' +
      '<div class="dar-soft-boot__track" aria-hidden="true"><div class="dar-soft-boot__bar"></div></div>' +
      '<p class="dar-soft-boot__pct">0%</p>';
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
    if (remain <= 0.002) {
      progress = MAX_FAKE;
      paint();
      return;
    }
    progress += remain * 0.045;
    if (progress > MAX_FAKE) progress = MAX_FAKE;
    paint();
  }

  function startRamp() {
    if (timer || finished) return;
    if (prefersReducedMotion()) {
      progress = MAX_FAKE;
      paint();
      return;
    }
    timer = setInterval(tick, 60);
  }

  function clearRamp() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function finish() {
    if (finished) return;
    var elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SHOW_MS) {
      if (!finishScheduled) {
        finishScheduled = true;
        setTimeout(finish, MIN_SHOW_MS - elapsed);
      }
      return;
    }
    finished = true;
    window.__darSoftBootLocked = true;
    window.__darAppBootPainted = true;
    finishScheduled = false;
    clearRamp();
    if (hardTimer) {
      clearTimeout(hardTimer);
      hardTimer = null;
    }
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
        for (var i = 0; i < all.length; i++) {
          try { all[i].classList.add("is-done"); } catch (e) {}
        }
        setTimeout(function () {
          removeAllOverlays(null);
          overlayEl = null;
        }, 300);
      }, FADE_HOLD_MS);
    }, HUNDRED_HOLD_MS);
  }

  function viewLooksReady() {
    try {
      if (window.__darAppBootOk) return true;
      var view = document.getElementById("appView");
      if (!view) return false;
      var text = (view.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text === "App wird geladen…") return false;
      if (view.querySelector(".loading") && text.length < 40) return false;
      return text.length > 24 || !!view.querySelector("section, article, .premium-surface, .sf-app, .qov-page, .more-page, .quiz-home");
    } catch (e) {
      return false;
    }
  }

  function maybeFinish() {
    if (finished || window.__darSoftBootLocked) return;
    if (!window.__darAppBootOk && !viewLooksReady()) return;
    if (!window.__darAppBootOk) return;
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
    try {
      if (
        (document.documentElement && document.documentElement.classList.contains("dar-ios-native-app")) ||
        /DarAlTawhid-iOS/i.test(String(navigator.userAgent || ""))
      ) {
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
      finish();
    }, HARD_TIMEOUT_MS);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        ensureOverlay();
        syncEdgeFill();
        paint();
        setTimeout(maybeFinish, 60);
      }, { once: true });
    } else {
      syncEdgeFill();
      setTimeout(maybeFinish, 60);
    }

    window.addEventListener("load", function () {
      setTimeout(maybeFinish, 40);
      setTimeout(function () { if (!finished) finish(); }, 4000);
    });
    window.addEventListener("pageshow", function (ev) {
      try {
        if (ev && ev.persisted && /Android/i.test(String(navigator.userAgent || ""))) {
          location.reload();
          return;
        }
      } catch (e) {}
      setTimeout(maybeFinish, 40);
    });
    window.addEventListener("hashchange", function () {
      if (finished || window.__darSoftBootLocked) return;
      setTimeout(maybeFinish, 60);
    });

    try {
      var mo = new MutationObserver(function (records) {
        if (finished || syncing) return;
        var themeChanged = false;
        for (var i = 0; i < records.length; i++) {
          if (records[i].attributeName === "data-theme") themeChanged = true;
        }
        if (themeChanged) syncEdgeFill();
        maybeFinish();
      });
      var startObserve = function () {
        var view = document.getElementById("appView");
        if (view) mo.observe(view, { childList: true, subtree: true, characterData: true });
        if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        /* Never observe style — syncEdgeFill writes style and would loop forever (black screen). */
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      };
      if (document.body) startObserve();
      else document.addEventListener("DOMContentLoaded", startObserve, { once: true });
    } catch (e) {}

    window.__darSoftBootFinish = finish;
    window.__darSoftBootSyncFill = syncEdgeFill;
  }

  install();
})();
