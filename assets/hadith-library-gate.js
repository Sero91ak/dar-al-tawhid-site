/* DĀR AL TAWḤĪD – Hadith-Bibliothek: eine Katalogzeile, gesperrt bis Freigabe */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_GATE_V4) return;
  window.__DAR_HADITH_LIBRARY_GATE_V4 = true;

  var TOAST_ID = "dar-hadith-library-gate-toast";
  var DATA_LOADER_ID = "dar-hadith-library-data-loader";
  var DEFAULT_STATE = {
    enabled: false,
    status: "in-progress",
    label: "Noch nicht freigegeben",
    releaseRequired: true,
    releasedByUser: false,
    targetHash: "#hadith-bibliothek",
    lockedMessage: "Ḥadīṯ-Bibliothek ist noch nicht freigegeben."
  };
  var gateState = DEFAULT_STATE;

  function basePath() {
    try {
      var p = String(location.pathname || "");
      if (p === "/test" || p.indexOf("/test/") === 0) return "/test/";
    } catch (e) {}
    return "/";
  }

  function assetPath(file) {
    return basePath() + "assets/" + file;
  }

  function dataPath(file) {
    return basePath() + "data/" + file;
  }

  function ensureDataLoader() {
    if (window.DARHadithLibraryData) return;
    if (document.getElementById(DATA_LOADER_ID)) return;
    var script = document.createElement("script");
    script.id = DATA_LOADER_ID;
    script.src = assetPath("hadith-library-data.js?v=3");
    script.setAttribute("defer", "");
    document.head.appendChild(script);
  }

  function currentHashKey() {
    var hash = String(location.hash || "").replace(/^#\/?/, "");
    return hash.split(/[/?&]/)[0].toLowerCase();
  }

  function isHadithRoute() {
    var key = currentHashKey();
    return key === "hadith" || key === "hadith-library" || key === "hadith-bibliothek" || key === "hadithbibliothek";
  }

  function isOpen() {
    return !!(gateState.enabled && gateState.releasedByUser === true);
  }

  function ensureCss() {
    if (document.querySelector('link[href*="hadith-library-gate.css"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = assetPath("hadith-library-gate.css?v=8");
    document.head.appendChild(link);
  }

  function mergeState(data) {
    if (!data || typeof data !== "object") return DEFAULT_STATE;
    var next = {};
    Object.keys(DEFAULT_STATE).forEach(function (key) { next[key] = DEFAULT_STATE[key]; });
    Object.keys(data).forEach(function (key) { next[key] = data[key]; });
    return next;
  }

  function loadGateState() {
    return fetch(dataPath("hadith-library-gate.json?v=3"), { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        gateState = mergeState(data);
        return gateState;
      })
      .catch(function () {
        gateState = DEFAULT_STATE;
        return gateState;
      });
  }

  function toast(message) {
    try {
      if (window.__darToast) { window.__darToast(message); return; }
      if (typeof showToast === "function") { showToast(message); return; }
    } catch (e) {}
    var node = document.getElementById(TOAST_ID);
    if (!node) {
      node = document.createElement("div");
      node.id = TOAST_ID;
      node.className = "dar-hadith-library-gate-toast";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(node.__darTimer);
    node.__darTimer = setTimeout(function () { node.classList.remove("is-visible"); }, 2600);
  }

  function stripInjectedCard() {
    var extra = document.getElementById("dar-hadith-library-gate");
    if (extra && extra.parentNode && extra.getAttribute("data-nav") !== "hadith") {
      extra.parentNode.removeChild(extra);
    }
  }

  function navigateToLibrary() {
    ensureDataLoader();
    if (!isOpen()) {
      toast(gateState.lockedMessage || DEFAULT_STATE.lockedMessage);
      return;
    }
    location.hash = gateState.targetHash || "#hadith-bibliothek";
  }

  function bindCatalogRow() {
    document.querySelectorAll(".more-feature-row[data-nav='hadith']").forEach(function (row) {
      if (row.getAttribute("data-dar-hadith-bound") === "1") return;
      row.setAttribute("data-dar-hadith-bound", "1");
      row.addEventListener("click", function (ev) {
        if (isOpen()) return;
        ev.preventDefault();
        ev.stopPropagation();
        navigateToLibrary();
      }, true);
    });
  }

  function blockLockedRoute() {
    if (!isHadithRoute()) return;
    if (isOpen()) return;
    toast(gateState.lockedMessage || DEFAULT_STATE.lockedMessage);
    try { location.hash = "#more"; } catch (e) {}
  }

  function refresh() {
    ensureCss();
    ensureDataLoader();
    stripInjectedCard();
    loadGateState().then(function () {
      blockLockedRoute();
      bindCatalogRow();
    });
  }

  window.DARHadithLibraryGate = {
    refresh: refresh,
    open: navigateToLibrary,
    state: function () { return gateState; },
    data: function () { return window.DARHadithLibraryData || null; },
    ensureDataLoader: ensureDataLoader
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
  window.addEventListener("hashchange", function () { setTimeout(refresh, 40); });
  document.addEventListener("dar:render", function () { setTimeout(refresh, 40); });
})();
