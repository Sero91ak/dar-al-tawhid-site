/**
 * Soft boot overlay for visitor + test web apps (iOS parity).
 * Asymptotic 0→~94%, snaps to 100% when the first real view is ready, then fades.
 */
(function () {
  if (window.__darSoftBootInstalled) return;
  window.__darSoftBootInstalled = true;

  var OVERLAY_ID = "dar-soft-boot";
  var MAX_FAKE = 0.94;
  var FADE_HOLD_MS = 350;
  var HARD_TIMEOUT_MS = 18000;
  var progress = 0;
  var finished = false;
  var timer = null;
  var hardTimer = null;
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

  function ensureOverlay() {
    overlayEl = document.getElementById(OVERLAY_ID);
    if (overlayEl) {
      barEl = overlayEl.querySelector(".dar-soft-boot__bar");
      pctEl = overlayEl.querySelector(".dar-soft-boot__pct");
      return overlayEl;
    }
    overlayEl = document.createElement("div");
    overlayEl.id = OVERLAY_ID;
    overlayEl.setAttribute("role", "status");
    overlayEl.setAttribute("aria-live", "polite");
    overlayEl.innerHTML =
      '<img class="dar-soft-boot__mark" src="/watermark-my-logo-full.png" alt="" width="72" height="72" decoding="async">' +
      '<p class="dar-soft-boot__title">DAR AL TAWḤĪD</p>' +
      '<div class="dar-soft-boot__track" aria-hidden="true"><div class="dar-soft-boot__bar"></div></div>' +
      '<p class="dar-soft-boot__pct">0%</p>';
    var host = document.body || document.documentElement;
    host.appendChild(overlayEl);
    barEl = overlayEl.querySelector(".dar-soft-boot__bar");
    pctEl = overlayEl.querySelector(".dar-soft-boot__pct");
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
    finished = true;
    clearRamp();
    if (hardTimer) {
      clearTimeout(hardTimer);
      hardTimer = null;
    }
    progress = 1;
    paint();
    var el = ensureOverlay();
    setTimeout(function () {
      el.classList.add("is-done");
      setTimeout(function () {
        try {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        } catch (e) {}
      }, 320);
    }, FADE_HOLD_MS);
  }

  function viewLooksReady() {
    try {
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

    ensureOverlay();
    paint();
    startRamp();
    hardTimer = setTimeout(function () {
      finish();
    }, HARD_TIMEOUT_MS);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(maybeFinish, 80);
      }, { once: true });
    } else {
      setTimeout(maybeFinish, 80);
    }

    window.addEventListener("pageshow", function () {
      setTimeout(maybeFinish, 40);
    });
    window.addEventListener("hashchange", function () {
      setTimeout(maybeFinish, 60);
    });

    try {
      var mo = new MutationObserver(function () {
        maybeFinish();
      });
      var startObserve = function () {
        var view = document.getElementById("appView");
        if (view) mo.observe(view, { childList: true, subtree: true, characterData: true });
        if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      };
      if (document.body) startObserve();
      else document.addEventListener("DOMContentLoaded", startObserve, { once: true });
    } catch (e) {}

    window.__darSoftBootFinish = finish;
  }

  install();
})();
