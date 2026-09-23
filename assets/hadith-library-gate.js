/* DĀR AL TAWḤĪD – Global Hadith-Bibliothek Gate */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_GATE_V3) return;
  window.__DAR_HADITH_LIBRARY_GATE_V3 = true;

  var GATE_ID = "dar-hadith-library-gate";
  var TOAST_ID = "dar-hadith-library-gate-toast";
  var DATA_LOADER_ID = "dar-hadith-library-data-loader";
  var DEFAULT_STATE = {
    enabled: false,
    status: "in-progress",
    label: "Noch nicht freigegeben",
    releaseRequired: true,
    releasedByUser: false,
    targetHash: "#hadith-bibliothek",
    cardTitle: "Ḥadīṯ-Bibliothek",
    cardSubtitle: "Šarḥ wird vorbereitet.",
    lockedMessage: "Ḥadīṯ-Bibliothek ist noch nicht freigegeben.",
    chips: ["Šarḥ", "Quelle"]
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
    script.setAttribute("defer","");
    document.head.appendChild(script);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().toLowerCase();
  }

  function currentHashKey() {
    var hash = String(location.hash || "").replace(/^#\/?/, "");
    return hash.split(/[/?&]/)[0].toLowerCase();
  }

  function isMoreRoute() {
    var key = currentHashKey();
    return key === "more" || key === "mehr";
  }

  function isHadithRoute() {
    var key = currentHashKey();
    return key === "hadith" || key === "hadith-library" || key === "hadith-bibliothek" || key === "hadithbibliothek";
  }

  function ensureCss() {
    var existing = document.querySelector('link[href*="hadith-library-gate.css"]');
    if (existing) {
      existing.href = assetPath("hadith-library-gate.css?v=6");
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = assetPath("hadith-library-gate.css?v=6");
    document.head.appendChild(link);
  }

  function mergeState(data) {
    if (!data || typeof data !== "object") return DEFAULT_STATE;
    var next = {};
    Object.keys(DEFAULT_STATE).forEach(function (key) { next[key] = DEFAULT_STATE[key]; });
    Object.keys(data).forEach(function (key) { next[key] = data[key]; });
    if (!Array.isArray(next.chips)) next.chips = DEFAULT_STATE.chips;
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
      if (window.__darToast) {
        window.__darToast(message);
        return;
      }
      if (typeof showToast === "function") {
        showToast(message);
        return;
      }
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

  function navigateToLibrary() {
    ensureDataLoader();
    if (!gateState.enabled || gateState.releasedByUser !== true) {
      toast(gateState.lockedMessage || DEFAULT_STATE.lockedMessage);
      return;
    }
    location.hash = gateState.targetHash || "#hadith-bibliothek";
  }

  function cardHtml() {
    var open = !!(gateState.enabled && gateState.releasedByUser === true);
    var statusText = open ? "Öffnen" : (gateState.label || DEFAULT_STATE.label);
    var title = esc(gateState.cardTitle || DEFAULT_STATE.cardTitle);
    var subtitle = esc(gateState.cardSubtitle || DEFAULT_STATE.cardSubtitle);
    return '<button type="button" id="' + GATE_ID + '" class="more-feature-row dar-hadith-library-gate" data-dar-hadith-library-open="1" data-feature-search="hadith hadit bibliothek sharh sarh erklaerung"><span class="feature-icon" aria-hidden="true">📚</span><span><h4>' + title + ' <span class="feature-badge">' + esc(statusText) + '</span></h4><p>' + subtitle + '</p></span></button>';
  }

  function removeCard() {
    var existing = document.getElementById(GATE_ID);
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function appRoot() {
    return document.getElementById("appView") || document.body;
  }

  function findListInside(section) {
    if (!section) return null;
    return section.querySelector(".more-group-grid,.list,.more-list,.settings-list,.feature-list,.learning-list,.dar-list,.menu-list,.stack,.items") || section;
  }

  function findLearningPlacement() {
    var app = appRoot();
    if (!app) return null;
    var groups = app.querySelectorAll(".more-group");
    for (var i = 0; i < groups.length; i += 1) {
      var heading = groups[i].querySelector("h3");
      var text = normalizeText(heading && heading.textContent);
      if (text !== "lernen & wissen") continue;
      var grid = groups[i].querySelector(".more-group-grid");
      if (grid && !groups[i].closest("#dar-setup-hub,.dar-setup-hub,.settings-one-page")) return grid;
    }
    return null;
  }

  function mountCard() {
    try {
    ensureCss();
    ensureDataLoader();

    if (!isMoreRoute()) {
      removeCard();
      return;
    }

    var target = findLearningPlacement();
    if (!target) {
      removeCard();
      return;
    }

    removeCard();
    var wrap = document.createElement("div");
    wrap.innerHTML = cardHtml();
    var card = wrap.firstElementChild;
    if (!card) return;
    target.appendChild(card);
    bind();
    } catch (e) {}
  }

  function bind() {
    var card = document.getElementById(GATE_ID);
    if (!card || card.getAttribute("data-bound") === "1") return;
    card.setAttribute("data-bound", "1");
    card.addEventListener("click", function (ev) {
      var opener = ev.target && ev.target.closest && ev.target.closest("[data-dar-hadith-library-open]");
      if (!opener) return;
      ev.preventDefault();
      navigateToLibrary();
    });
  }

  function blockLockedRoute() {
    if (!isHadithRoute()) return;
    ensureDataLoader();
    if (gateState.enabled && gateState.releasedByUser === true) return;
    toast(gateState.lockedMessage || DEFAULT_STATE.lockedMessage);
    try { location.hash = "#more"; } catch (e) {}
    setTimeout(mountCard, 80);
  }

  function refresh() {
    if (!isMoreRoute() && !isHadithRoute()) {
      removeCard();
      return;
    }
    ensureDataLoader();
    loadGateState().then(function () {
      blockLockedRoute();
      mountCard();
    });
  }

  function observe() {}

  window.DARHadithLibraryGate = {
    refresh: refresh,
    open: navigateToLibrary,
    state: function () { return gateState; },
    data: function () { return window.DARHadithLibraryData || null; },
    ensureDataLoader: ensureDataLoader
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { refresh(); observe(); });
  } else {
    refresh();
    observe();
  }
  window.addEventListener("hashchange", function () { setTimeout(refresh, 40); });
  document.addEventListener("dar:render", function () { setTimeout(refresh, 40); });
})();
