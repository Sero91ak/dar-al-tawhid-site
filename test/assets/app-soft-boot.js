/**
 * Soft boot overlay for visitor + test web apps (iOS parity).
 * v658 · Edel Ladezeile + black-screen fix: no style↔observer loop; boot fill only while overlay is up.
 */
(function () {
  if (window.__darSoftBootInstalled) return;
  window.__darSoftBootInstalled = true;

  var OVERLAY_ID = "dar-soft-boot";
  var MAX_FAKE = 0.94;
  var FADE_HOLD_MS = 280;
  var MIN_SHOW_MS = 700;
  var HARD_TIMEOUT_MS = 6500;
  var THEME_FILLS = {
    dark: "#080806",
    light: "#f7f0df",
    soft: "#f2e6e2",
    royal: "#07162c",
    bordeaux: "#140B0C",
    "dar-al-layl": "#050605",
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

  function resolveFill() {
    try {
      if (window.__DAR_BOOT_FILL && /^#[0-9a-fA-F]{3,8}$/.test(window.__DAR_BOOT_FILL)) {
        return window.__DAR_BOOT_FILL;
      }
      var mapped = THEME_FILLS[resolveThemeId()];
      if (mapped) return mapped;
      var root = document.documentElement;
      if (root) {
        var cs = getComputedStyle(root);
        var live = (
          cs.getPropertyValue("--dar-boot-fill") ||
          cs.getPropertyValue("--theme-page-bg") ||
          cs.getPropertyValue("--outer-bg-flat") ||
          cs.getPropertyValue("--bg") ||
          ""
        ).trim();
        var hex = live.match(/#[0-9a-fA-F]{3,8}/);
        if (hex) return hex[0];
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

  function ensureOverlay() {
    overlayEl = document.getElementById(OVERLAY_ID);
    if (overlayEl) {
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
      '<img class="dar-soft-boot__mark" src="/watermark-my-logo-full.png" alt="" width="72" height="72" decoding="async">' +
      '<p class="dar-soft-boot__title">DAR AL TAWḤĪD</p>' +
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
    finishScheduled = false;
    clearRamp();
    if (hardTimer) {
      clearTimeout(hardTimer);
      hardTimer = null;
    }
    progress = 1;
    paint();
    var el = overlayEl || document.getElementById(OVERLAY_ID);
    try {
      if (document.documentElement) {
        document.documentElement.classList.remove("dar-soft-booting");
        document.documentElement.style.removeProperty("background-color");
        document.documentElement.style.removeProperty("background");
        document.documentElement.style.removeProperty("background-image");
      }
    } catch (e) {}
    if (!el) return;
    setTimeout(function () {
      try { el.classList.add("is-done"); } catch (e) {}
      setTimeout(function () {
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch (e) {}
        overlayEl = null;
      }, 300);
    }, FADE_HOLD_MS);
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
    if (finished) return;
    if (viewLooksReady()) finish();
  }

  function install() {
    try {
      if (document.documentElement && document.documentElement.classList.contains("dar-ios-native-app")) {
        finished = true;
        return;
      }
      if (/DarAlTawhid-iOS/i.test(String(navigator.userAgent || ""))) {
        finished = true;
        return;
      }
    } catch (e) {}

    try {
      var early = THEME_FILLS[resolveThemeId()] || THEME_FILLS.dark;
      window.__DAR_BOOT_FILL = early;
      if (document.documentElement) {
        document.documentElement.style.setProperty("--dar-boot-fill", early);
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
        if (overlayEl && document.body && overlayEl.parentNode !== document.body) {
          try { document.body.appendChild(overlayEl); } catch (e) {}
        }
        syncEdgeFill();
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
    window.addEventListener("pageshow", function () {
      setTimeout(maybeFinish, 40);
    });
    window.addEventListener("hashchange", function () {
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
