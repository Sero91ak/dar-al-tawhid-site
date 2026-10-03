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
    root.__darRemoteBuildId = remote;
    if (!api || typeof api.show !== "function") {
      var bar = document.getElementById("darTestUpdateOffer");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "darTestUpdateOffer";
        bar.setAttribute("role", "status");
        bar.style.cssText = "position:fixed;z-index:100001;left:12px;right:12px;top:calc(10px + env(safe-area-inset-top,0px));display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:16px;background:#17211B;color:#F7F4EA;font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.28)";
        var label = document.createElement("span");
        label.textContent = "Neue Test-Version bereit";
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = "Aktualisieren";
        button.style.cssText = "min-height:40px;padding:0 14px;border:0;border-radius:999px;background:#F7F4EA;color:#17211B;font:800 14px/1 system-ui,sans-serif";
        button.onclick = function () {
          markApplied(remote);
          if (typeof root.hardRefreshApp === "function") return root.hardRefreshApp();
          location.reload();
        };
        bar.appendChild(label);
        bar.appendChild(button);
        (document.body || document.documentElement).appendChild(bar);
      }
      return true;
    }
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
    // DAR Test updates are applied silently. No floating/capsule update CTA on the reading surface.
    var old=document.getElementById("darTestUpdateOffer");
    if(old&&old.parentNode)old.parentNode.removeChild(old);
    try{root.DARGlobalUpdate&&root.DARGlobalUpdate.hide&&root.DARGlobalUpdate.hide()}catch(e){}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})(window);
