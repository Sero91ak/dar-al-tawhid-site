/**
 * Test-App only: right-side thumb navigation for phone landscape and open folds.
 * Portrait phones and tablets keep the regular bottom navigation.
 */
(function (global) {
  "use strict";

  var path = String(global.location && global.location.pathname || "");
  if (!(path === "/test" || path.indexOf("/test/") === 0)) return;

  var root = document.documentElement;
  var active = false;
  var rafId = 0;
  var navProperties = [
    "position", "left", "right", "top", "bottom", "width", "min-width",
    "max-width", "height", "min-height", "max-height", "margin", "padding",
    "flex-direction", "justify-content", "align-items", "gap", "border-radius",
    "transform", "-webkit-transform", "z-index"
  ];

  function userAgent() {
    return String(global.navigator && global.navigator.userAgent || "");
  }

  function isTablet() {
    var ua = userAgent();
    var platform = String(global.navigator && global.navigator.platform || "");
    var touchPoints = Number(global.navigator && global.navigator.maxTouchPoints || 0);
    if (/iPad/i.test(ua)) return true;
    if (/Macintosh/i.test(ua) && (touchPoints > 1 || platform === "MacIntel" && touchPoints > 1)) {
      return true;
    }
    return /Android/i.test(ua) && !/Mobile/i.test(ua);
  }

  function hasCoarsePointer() {
    try {
      return !!global.matchMedia && global.matchMedia("(pointer: coarse)").matches;
    } catch (error) {
      return false;
    }
  }

  function isPhoneOrFold(width, height) {
    var ua = userAgent();
    if (/DarAlTawhid-iOS|iPhone|iPod|Android.*Mobile/i.test(ua)) return true;
    return hasCoarsePointer() && Math.min(width, height) <= 720;
  }

  function measure() {
    if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.measure === "function") {
      return global.DarAdaptiveLayout.measure();
    }
    var viewport = global.visualViewport;
    return {
      width: Math.round(viewport && viewport.width || global.innerWidth || root.clientWidth || 0),
      height: Math.round(viewport && viewport.height || global.innerHeight || root.clientHeight || 0)
    };
  }

  function routeBlocksThumbNav() {
    var body = document.body;
    return !body ||
      body.classList.contains("reader-mode") ||
      body.classList.contains("is-ilm-chat-route");
  }

  function shouldActivate() {
    var metrics = measure();
    var width = Number(metrics.width) || 0;
    var height = Number(metrics.height) || 0;
    var landscape = width > height;
    var foldDual = root.getAttribute("data-fold-dual") === "1";
    return !isTablet() &&
      isPhoneOrFold(width, height) &&
      width >= 600 &&
      Math.min(width, height) <= 720 &&
      (landscape || foldDual) &&
      !routeBlocksThumbNav();
  }

  function setNavPosition(nav) {
    nav.classList.remove("is-adaptive-rail", "is-adaptive-centered");
    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("left", "auto", "important");
    nav.style.setProperty("right", "max(8px, env(safe-area-inset-right, 0px))", "important");
    nav.style.setProperty("top", "50%", "important");
    nav.style.setProperty("bottom", "auto", "important");
    nav.style.setProperty("width", "68px", "important");
    nav.style.setProperty("min-width", "68px", "important");
    nav.style.setProperty("max-width", "68px", "important");
    nav.style.setProperty(
      "height",
      "min(390px, calc(100dvh - max(18px, env(safe-area-inset-top, 0px)) - max(18px, env(safe-area-inset-bottom, 0px))))",
      "important"
    );
    nav.style.setProperty("min-height", "272px", "important");
    nav.style.setProperty("max-height", "390px", "important");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("padding", "5px", "important");
    nav.style.setProperty("flex-direction", "column", "important");
    nav.style.setProperty("justify-content", "space-between", "important");
    nav.style.setProperty("align-items", "stretch", "important");
    nav.style.setProperty("gap", "2px", "important");
    nav.style.setProperty("border-radius", "25px", "important");
    nav.style.setProperty("transform", "translate3d(0, -50%, 0)", "important");
    nav.style.setProperty("-webkit-transform", "translate3d(0, -50%, 0)", "important");
    nav.style.setProperty("z-index", "80", "important");
  }

  function clearNavPosition(nav) {
    navProperties.forEach(function (property) {
      nav.style.removeProperty(property);
    });
  }

  function apply() {
    var nav = document.getElementById("bottomNav");
    if (!nav) return false;
    var next = shouldActivate();

    if (next) {
      root.classList.add("dar-test-thumb-nav");
      root.setAttribute("data-test-thumb-nav", "right");
      setNavPosition(nav);
      active = true;
      return true;
    }

    root.classList.remove("dar-test-thumb-nav");
    root.removeAttribute("data-test-thumb-nav");
    if (active) {
      clearNavPosition(nav);
      active = false;
      if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.syncNav === "function") {
        global.DarAdaptiveLayout.syncNav();
      }
    }
    return false;
  }

  /*
   * The existing dock and adaptive controllers call this before writing their
   * own bottom-nav position. Returning true gives this controller exclusive
   * ownership while the right-side mode is required and prevents flicker.
   */
  function takeControl() {
    return apply();
  }

  function schedule() {
    if (rafId) return;
    rafId = global.requestAnimationFrame(function () {
      rafId = 0;
      apply();
    });
  }

  function start() {
    schedule();
    global.addEventListener("dar:layoutchange", schedule);
    global.addEventListener("resize", schedule, { passive: true });
    global.addEventListener("orientationchange", schedule, { passive: true });
    global.addEventListener("popstate", schedule, { passive: true });
    global.addEventListener("hashchange", schedule, { passive: true });
    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", schedule, { passive: true });
    }
    document.addEventListener("click", schedule, true);
  }

  global.DarTestThumbNav = {
    takeControl: takeControl,
    apply: apply,
    isActive: function () {
      return active;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
