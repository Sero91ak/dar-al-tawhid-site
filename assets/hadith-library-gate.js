/* DĀR AL TAWḤĪD – locked Ḥadīṯ library gate */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_GATE__) return;
  window.__DAR_HADITH_LIBRARY_GATE__ = true;

  var ROOT_ID = "dar-hadith-library-gate";
  var LIVE_GATE = "/data/hadith-library-gate.json";
  var TEST_GATE = "/test/data/hadith-library-gate.json";
  var state = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isTestPath() {
    try { return location.pathname === "/test" || location.pathname.indexOf("/test/") === 0; }
    catch (e) { return false; }
  }

  function gateUrl() {
    return isTestPath() ? TEST_GATE : LIVE_GATE;
  }

  function toast(message) {
    try {
      if (window.__darToast) return window.__darToast(message);
      if (typeof showToast === "function") return showToast(message);
    } catch (e) {}
  }

  function navigateTo(hash) {
    try {
      if (!hash) hash = "#hadith-bibliothek";
      location.hash = hash;
    } catch (e) {}
  }

  function findMoreHost() {
    var selectors = [
      ".more-page",
      "[data-view='more']",
      "[data-route='more']",
      "#appView .premium-surface",
      "#appView section",
      "#appView"
    ];
    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (node && /mehr|weitere|einstellung|widgets|bereiche/i.test(node.textContent || "")) return node;
    }
    return document.getElementById("appView");
  }

  function isMoreRoute() {
    try {
      var raw = String(location.hash || "").replace(/^#\/?/, "").split(/[/?&]/)[0].toLowerCase();
      if (raw === "more" || raw === "mehr" || raw === "settings" || raw === "einstellungen") return true;
      if (document.body && document.body.classList.contains("is-more-route")) return true;
      var app = document.getElementById("appView");
      return !!(app && /mehr|weitere bereiche/i.test(app.textContent || ""));
    } catch (e) { return false; }
  }

  function renderCard(cfg) {
    cfg = cfg || {};
    var open = cfg.enabled === true && cfg.releasedByUser === true;
    var chips = Array.isArray(cfg.chips) ? cfg.chips : [];
    var html = [
      '<section id="' + ROOT_ID + '" class="dar-hadith-library-gate" data-hadith-library-gate="true">',
      '  <div class="dar-hadith-library-gate__top">',
      '    <h3 class="dar-hadith-library-gate__title">' + esc(cfg.cardTitle || "Ḥadīṯ-Bibliothek") + '</h3>',
      '    <span class="dar-hadith-library-gate__status">' + esc(cfg.label || (open ? "Freigegeben" : "In Bearbeitung")) + '</span>',
      '  </div>',
      '  <p class="dar-hadith-library-gate__sub">' + esc(cfg.cardSubtitle || "Wird vorbereitet und bleibt bis zur Freigabe gesperrt.") + '</p>',
      '  <div class="dar-hadith-library-gate__chips">' + chips.map(function (c) { return '<span class="dar-hadith-library-gate__chip">' + esc(c) + '</span>'; }).join("") + '</div>',
      '  <button type="button" class="dar-hadith-library-gate__button' + (open ? ' is-open' : '') + '" data-hadith-library-open="true">' + (open ? 'Ḥadīṯ-Bibliothek öffnen' : 'Noch nicht freigegeben') + '</button>',
      '  <p class="dar-hadith-library-gate__note">' + esc(open ? "Der Bereich ist freigegeben." : (cfg.lockedMessage || "Die Ḥadīṯ-Bibliothek ist vorbereitet, aber noch nicht freigegeben.")) + '</p>',
      '</section>'
    ].join("");
    return html;
  }

  function mount() {
    if (!state || !state.visibility || state.visibility.showInMoreAreaWhileLocked !== true) return;
    if (!isMoreRoute()) return;
    var host = findMoreHost();
    if (!host) return;
    var old = document.getElementById(ROOT_ID);
    if (old) old.remove();
    var wrap = document.createElement("div");
    wrap.innerHTML = renderCard(state);
    var card = wrap.firstElementChild;
    if (!card) return;
    var first = host.firstElementChild;
    if (first) host.insertBefore(card, first.nextSibling || null);
    else host.appendChild(card);
  }

  async function load() {
    try {
      var res = await fetch(gateUrl(), { cache: "no-store" });
      if (!res.ok) throw new Error("gate " + res.status);
      state = await res.json();
      mount();
    } catch (e) {
      state = {
        enabled: false,
        releasedByUser: false,
        label: "In Bearbeitung",
        cardTitle: "Ḥadīṯ-Bibliothek",
        cardSubtitle: "Wird vorbereitet: nach Buchkategorie, Werk, Kapitel, Seite, Nummer und Sharḥ geordnet.",
        lockedMessage: "Die Ḥadīṯ-Bibliothek ist vorbereitet, aber noch nicht freigegeben.",
        chips: ["Buchkategorie", "Werk", "Kapitel", "Seite", "Nummer", "Sharḥ"],
        visibility: { showInMoreAreaWhileLocked: true, allowOpenWhileLocked: false }
      };
      mount();
    }
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest("[data-hadith-library-open]");
    if (!btn) return;
    ev.preventDefault();
    var open = state && state.enabled === true && state.releasedByUser === true;
    if (!open) {
      toast("Ḥadīṯ-Bibliothek ist noch in Bearbeitung");
      return;
    }
    navigateTo((state && state.targetHash) || "#hadith-bibliothek");
  });

  function refreshSoon() { setTimeout(mount, 80); setTimeout(mount, 380); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
  else load();
  window.addEventListener("hashchange", refreshSoon);
  document.addEventListener("dar:render", refreshSoon);
  var mo = null;
  try {
    mo = new MutationObserver(refreshSoon);
    document.addEventListener("DOMContentLoaded", function () {
      var app = document.getElementById("appView");
      if (app) mo.observe(app, { childList: true, subtree: true });
    }, { once: true });
    var appNow = document.getElementById("appView");
    if (appNow) mo.observe(appNow, { childList: true, subtree: true });
  } catch (e) {}
})();
