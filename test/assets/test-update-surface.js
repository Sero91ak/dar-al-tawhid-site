/* DAR_TEST_UPDATE_SURFACE_V1 – gleiche Update-Fläche wie bei einem echten App-Update */
(function (root) {
  "use strict";
  var FLAG = "darTestForcedUpdateBannerV1";
  var FAKE_REMOTE = "app-shell-v1027-pending";

  function isTest() {
    try {
      var p = String(location.pathname || "");
      if (p.indexOf("/test/kids") === 0 || p.indexOf("/kids") === 0) return false;
      return p.indexOf("/test/") === 0 || p === "/test";
    } catch (e) {
      return false;
    }
  }

  function alreadyApplied() {
    try { return localStorage.getItem(FLAG) === "1"; } catch (e) { return false; }
  }

  function markApplied() {
    try { localStorage.setItem(FLAG, "1"); } catch (e) {}
  }

  function offer() {
    if (!isTest() || alreadyApplied()) return;
    var api = root.DARGlobalUpdate;
    if (!api || typeof api.show !== "function") return false;
    root.__darRemoteBuildId = FAKE_REMOTE;
    api.show({
      buildId: FAKE_REMOTE,
      localBuild: String(root.APP_BUILD_ID || root.__DAR_EXPECTED_BUILD || ""),
      title: "Neue Version verfügbar",
      text: "Eine neue Version von DĀR AL TAWḤĪD ist bereit.",
      apply: function () {
        markApplied();
        if (typeof root.hardRefreshApp === "function") return root.hardRefreshApp();
        location.reload();
      }
    });
    return true;
  }

  function boot() {
    if (!isTest() || alreadyApplied()) return;
    var n = 0;
    function tick() {
      if (offer()) return;
      n += 1;
      if (n < 40) setTimeout(tick, 120);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tick, { once: true });
    } else {
      tick();
    }
  }

  boot();
})(window);
