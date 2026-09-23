/* DĀR AL TAWḤĪD – Global Hadith-Bibliothek Gate */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_GATE_V1) return;
  window.__DAR_HADITH_LIBRARY_GATE_V1 = true;

  var GATE_ID = "dar-hadith-library-gate";
  var TOAST_ID = "dar-hadith-library-gate-toast";
  var DEFAULT_STATE = {
    enabled: false,
    status: "in-progress",
    label: "In Bearbeitung",
    releaseRequired: true,
    releasedByUser: false,
    targetHash: "#hadith-bibliothek",
    cardTitle: "Ḥadīṯ-Bibliothek",
    cardSubtitle: "Nach Buchkategorie, Kapitel, Seite und Nummer vorbereitet",
    lockedMessage: "Die Ḥadīṯ-Bibliothek ist vorbereitet, aber noch nicht freigegeben.",
    chips: ["Buchkategorie", "Kapitel", "Seite", "Sharḥ"]
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

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function currentHashKey() {
    var hash = String(location.hash || "").replace(/^#\/?/, "");
    return hash.split(/[/?&]/)[0].toLowerCase();
  }

  function isMoreRoute() {
    var key = currentHashKey();
    return key === "more" || key === "mehr" || key === "settings" || key === "setup";
  }

  function isHadithRoute() {
    var key = currentHashKey();
    return key === "hadith" || key === "hadith-library" || key === "hadith-bibliothek" || key === "hadithbibliothek";
  }

  function ensureCss() {
    if (document.querySelector('link[href*="hadith-library-gate.css"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = assetPath("hadith-library-gate.css?v=1");
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
    return fetch(dataPath("hadith-library-gate.json"), { cache: "no-store" })
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
    if (!gateState.enabled || gateState.releasedByUser !== true) {
      toast(gateState.lockedMessage || DEFAULT_STATE.lockedMessage);
      return;
    }
    location.hash = gateState.targetHash || "#hadith-bibliothek";
  }

  function cardHtml() {
    var open = !!(gateState.enabled && gateState.releasedByUser === true);
    var chips = (gateState.chips || DEFAULT_STATE.chips).map(function (chip) {
      return '<span class="dar-hadith-library-gate__chip">' + esc(chip) + '</span>';
    }).join("");
    return [
      '<section id="' + GATE_ID + '" class="dar-hadith-library-gate" aria-label="Ḥadīṯ-Bibliothek">',
      '  <div class="dar-hadith-library-gate__inner">',
      '    <div class="dar-hadith-library-gate__eyebrow">Neu vorbereitet</div>',
      '    <h2 class="dar-hadith-library-gate__title">' + esc(gateState.cardTitle || DEFAULT_STATE.cardTitle) + '</h2>',
      '    <p class="dar-hadith-library-gate__text">' + esc(gateState.cardSubtitle || DEFAULT_STATE.cardSubtitle) + '</p>',
      '    <div class="dar-hadith-library-gate__meta">' + chips + '</div>',
      '    <div class="dar-hadith-library-gate__actions">',
      '      <span class="dar-hadith-library-gate__status">' + esc(gateState.label || DEFAULT_STATE.label) + '</span>',
      '      <button type="button" class="dar-hadith-library-gate__btn' + (open ? ' is-open' : '') + '" data-dar-hadith-library-open="1">' + (open ? 'Öffnen' : 'Noch gesperrt') + '</button>',
      '    </div>',
      '  </div>',
      '</section>'
    ].join("");
  }

  function findMountTarget() {
    var app = document.getElementById("appView") || document.body;
    if (!app) return null;
    return app.querySelector(".more-page") || app.querySelector(".settings-one-page") || app.querySelector(".premium-surface") || app.querySelector("main") || app;
  }

  function mountCard() {
    ensureCss();
    if (!isMoreRoute()) return;
    var target = findMountTarget();
    if (!target) return;
    var existing = document.getElementById(GATE_ID);
    if (existing) {
      existing.outerHTML = cardHtml();
      bind();
      return;
    }
    var wrap = document.createElement("div");
    wrap.innerHTML = cardHtml();
    var card = wrap.firstElementChild;
    if (!card) return;
    var afterHead = target.querySelector(".view-head, .more-head, header");
    if (afterHead && afterHead.parentNode === target) {
      afterHead.insertAdjacentElement("afterend", card);
    } else {
      target.insertBefore(card, target.firstChild);
    }
    bind();
  }

  function bind() {
    var card = document.getElementById(GATE_ID);
    if (!card || card.getAttribute("data-bound") === "1") return;
    card.setAttribute("data-bound", "1");
    card.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest("[data-dar-hadith-library-open]");
      if (!btn) return;
      ev.preventDefault();
      navigateToLibrary();
    });
  }

  function blockLockedRoute() {
    if (!isHadithRoute()) return;
    if (gateState.enabled && gateState.releasedByUser === true) return;
    toast(gateState.lockedMessage || DEFAULT_STATE.lockedMessage);
    try { location.hash = "#more"; } catch (e) {}
    setTimeout(mountCard, 80);
  }

  function refresh() {
    loadGateState().then(function () {
      blockLockedRoute();
      mountCard();
    });
  }

  function observe() {
    try {
      var root = document.getElementById("appView") || document.body;
      if (!root) return;
      var mo = new MutationObserver(function () {
        if (isMoreRoute()) setTimeout(mountCard, 40);
      });
      mo.observe(root, { childList: true, subtree: true });
    } catch (e) {}
  }

  window.DARHadithLibraryGate = {
    refresh: refresh,
    open: navigateToLibrary,
    state: function () { return gateState; }
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
