/**
 * DAR AL TAWḤID — Boot: Cache-Update + Feed-Doppelheader sofort entfernen.
 * Wird über jsDelivr geladen (nicht über dar-al-tawhid.de gecacht).
 */
(function () {
  "use strict";

  if (typeof location === "undefined") return;
  if ((location.pathname || "").indexOf("/admin") === 0) return;

  var isTest = /\/test(?:\/|$)/.test(location.pathname || "");

  function isFeedRoute() {
    try {
      var parts = String(location.hash || "")
        .replace(/^#\/?/, "")
        .split("/")
        .filter(Boolean);
      if (!parts.length) return false;
      return parts[0].toLowerCase() === "feed" && parts[1] !== "topics";
    } catch (e) {
      return false;
    }
  }

  function stripFeedDuplicateHeader() {
    if (!isFeedRoute()) return;
    try {
      if (document.body) document.body.classList.add("is-feed-fullscreen");
      document.querySelectorAll("#appView > .view-head").forEach(function (el) {
        el.remove();
      });
    } catch (e) {}
  }

  function bindFeedHeaderGuard() {
    stripFeedDuplicateHeader();
    window.addEventListener("hashchange", stripFeedDuplicateHeader);
    if (document.documentElement) {
      new MutationObserver(stripFeedDuplicateHeader).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function runVersionCheck() {
    var local = String(window.__DAR_EXPECTED_BUILD || "").trim();
    if (!local) return;

    fetch("/test/version.json?_=" + Date.now(), {
      cache: "no-store"
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (remote) {
        if (!remote || !remote.buildId || String(remote.buildId) === local) return;
        var key = "darBootRefresh" + remote.buildId;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        window.__darRemoteBuildId = String(remote.buildId);
        window.__darAppVersionAvailable = true;
        try {
          window.dispatchEvent(new CustomEvent("dar:version-mismatch", {
            detail: { buildId: String(remote.buildId), localBuildId: local }
          }));
        } catch (e) {}
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration("/").then(function (reg) {
            if (reg && reg.active) reg.active.postMessage({ type: "HARD_REFRESH" });
            if (reg && typeof reg.update === "function") reg.update().catch(function () {});
          });
        }
      })
      .catch(function () {});
  }

  function boot() {
    bindFeedHeaderGuard();
    runVersionCheck();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
