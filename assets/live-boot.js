/**
 * DAR AL TAWḤID — Live-Boot: erkennt veraltete Cloudflare-Cache-Version und lädt neu.
 * Wird von index.html über jsDelivr geladen (nicht über dar-al-tawhid.de gecacht).
 */
(function () {
  "use strict";

  if (typeof location === "undefined") return;
  if (/\/test(?:\/|$)/.test(location.pathname || "")) return;
  if ((location.pathname || "").indexOf("/admin") === 0) return;

  function run() {
    var local = String(window.__DAR_EXPECTED_BUILD || "").trim();
    if (!local) return;

    fetch("https://cdn.jsdelivr.net/gh/Sero91ak/dar-al-tawhid-site@main/version.json?_=" + Date.now(), {
      cache: "no-store"
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (remote) {
        if (!remote || !remote.buildId || String(remote.buildId) === local) return;
        var key = "darBootReload" + remote.buildId;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration("/").then(function (reg) {
            if (reg && reg.active) reg.active.postMessage({ type: "HARD_REFRESH" });
          });
        }
        var base = location.pathname || "/";
        location.replace(base + "?live=" + encodeURIComponent(remote.buildId) + location.hash);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
