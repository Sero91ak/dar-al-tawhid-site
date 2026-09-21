/**
 * Test: Kapsel-Thumb-Nav abgelöst durch DarAdaptiveLayout (Seitenleiste).
 * takeControl bleibt API-kompatibel, übernimmt aber nie mehr die Navigation.
 */
(function (global) {
  "use strict";
  var path = String((global.location && global.location.pathname) || "");
  if (!(path === "/test" || path.indexOf("/test/") === 0)) return;

  function release() {
    var root = document.documentElement;
    root.classList.remove("dar-test-thumb-nav");
    root.removeAttribute("data-test-thumb-nav");
    return false;
  }

  global.DarTestThumbNav = {
    takeControl: release,
    apply: release,
    isActive: function () {
      return false;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", release, { once: true });
  } else {
    release();
  }
})(typeof window !== "undefined" ? window : this);
