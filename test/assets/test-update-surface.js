/* DAR_TEST_UPDATE_SURFACE_V2 – echter version.json-Vergleich, sichtbarer Banner */
(function (root) {
  "use strict";
  var FLAG = "darTestForcedUpdateBannerV2";

  function isTest() {
    try {
      var p = String(location.pathname || "");
      if (p.indexOf("/test/kids") === 0 || p.indexOf("/kids") === 0) return false;
      return p.indexOf("/test/") === 0 || p === "/test";
    } catch (e) {
      return false;
    }
  }

  function localBuild() {
    return String(root.APP_BUILD_ID || root.__DAR_EXPECTED_BUILD || "").trim();
  }

  function alreadyApplied(remote) {
    try { return localStorage.getItem(FLAG) === String(remote || ""); } catch (e) { return false; }
  }

  function markApplied(remote) {
    try { localStorage.setItem(FLAG, String(remote || "")); } catch (e) {}
  }

  function num(id) {
    var m = String(id || "").match(/v(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function offer(remote) {
    if (!isTest() || !remote) return false;
    var local = localBuild();
    if (!local || remote === local || num(remote) <= num(local)) return false;
    if (alreadyApplied(remote)) return false;
    var api = root.DARGlobalUpdate;
    if (!api || typeof api.show !== "function") return false;
    root.__darRemoteBuildId = remote;
    api.show({
      buildId: remote,
      localBuild: local,
      title: "Neue Version verfügbar",
      text: "Eine neue Version von DĀR AL TAWḤĪD ist bereit.",
      apply: function () {
        markApplied(remote);
        if (typeof root.hardRefreshApp === "function") return root.hardRefreshApp();
        location.reload();
      }
    });
    return true;
  }

  function boot() {
    if (!isTest()) return;
    fetch("/test/version.json?u=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (remote) {
        var id = remote && remote.buildId ? String(remote.buildId) : "";
        var n = 0;
        function tick() {
          if (offer(id)) return;
          n += 1;
          if (n < 40) setTimeout(tick, 120);
        }
        tick();
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})(window);
