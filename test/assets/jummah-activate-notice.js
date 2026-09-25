/* DAR_JUMMAH_ACTIVATE_NOTICE_V1 – nur Test-App, oben, edel, nicht Besucher */
(function (global) {
  "use strict";
  var ROOT = "darJummahActivateNotice";
  var STYLE = "darJummahActivateNoticeStyle";
  var STORE = "darJummahActivateNoticeV1";
  var NOTICE_ID = "jummah-prod-2026-09-25";

  function isTest() {
    try {
      var p = String(location.pathname || "");
      return p.indexOf("/test/") === 0 || p === "/test";
    } catch (e) {
      return false;
    }
  }

  function dismissed() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      return String(raw.id || "") === NOTICE_ID && raw.closed === true;
    } catch (e) {
      return false;
    }
  }

  function markClosed() {
    try { localStorage.setItem(STORE, JSON.stringify({ id: NOTICE_ID, closed: true, at: new Date().toISOString() })); } catch (e) {}
  }

  function ensureStyle() {
    if (document.getElementById(STYLE)) return;
    var el = document.createElement("style");
    el.id = STYLE;
    el.textContent = [
      "#"+ROOT+"{position:fixed;top:0;left:0;right:0;z-index:2147483602;display:flex;justify-content:center;pointer-events:none;padding:0 12px;transform:translate3d(0,-120%,0);transition:transform 420ms cubic-bezier(.16,.84,.32,1)}",
      "#"+ROOT+".is-open{transform:translate3d(0,0,0);pointer-events:auto}",
      "#"+ROOT+" .jan-panel{width:min(100%,560px);margin-top:max(8px,env(safe-area-inset-top,0px));padding:14px 15px 13px;border-radius:0 0 20px 20px;color:var(--ink,var(--cream,#f6f0e2));background:color-mix(in srgb,var(--card,#16120e) 92%,transparent);border:1px solid color-mix(in srgb,var(--gold2,#c9a96a) 42%,var(--line,rgba(128,128,128,.22)));border-top:0;box-shadow:0 16px 36px rgba(0,0,0,.28);backdrop-filter:blur(16px)}",
      "#"+ROOT+" .jan-kicker{margin:0;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:900;color:var(--gold2,#c9a96a)}",
      "#"+ROOT+" .jan-title{margin:5px 0 6px;font-family:var(--serif,Georgia,serif);font-size:clamp(18px,5vw,23px);line-height:1.15;color:var(--ink,var(--cream,#f6f0e2));font-weight:600}",
      "#"+ROOT+" .jan-lead{margin:0 0 10px;font-size:12.4px;line-height:1.45;color:var(--muted,#9f9a90)}",
      "#"+ROOT+" .jan-list{margin:0;padding:0;list-style:none;display:grid;gap:6px}",
      "#"+ROOT+" .jan-list li{font-size:12px;line-height:1.35;color:var(--ink,var(--cream,#f6f0e2));padding-left:14px;position:relative}",
      "#"+ROOT+" .jan-list li:before{content:'';position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:50%;background:var(--gold2,#c9a96a)}",
      "#"+ROOT+" .jan-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}",
      "#"+ROOT+" .jan-btn{min-height:40px;border-radius:13px;border:1px solid color-mix(in srgb,var(--gold2,#c9a96a) 40%,var(--line,rgba(128,128,128,.22)));background:transparent;color:var(--ink,var(--cream,#f6f0e2));font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}",
      "#"+ROOT+" .jan-btn.is-main{background:color-mix(in srgb,var(--gold2,#c9a96a) 16%,transparent);border-color:color-mix(in srgb,var(--gold2,#c9a96a) 55%,transparent)}",
      "#"+ROOT+" .jan-close{position:absolute;top:10px;right:12px;width:32px;height:32px;border:0;background:transparent;color:var(--muted,#9f9a90);font-size:22px;line-height:1;cursor:pointer}",
      "#"+ROOT+" .jan-panel{position:relative}",
      "html[data-theme='light'] #"+ROOT+" .jan-panel,html[data-theme='soft'] #"+ROOT+" .jan-panel{background:color-mix(in srgb,var(--card,#fff) 94%,transparent)}"
    ].join("\n");
    document.head.appendChild(el);
  }

  function go(view) {
    try {
      if (typeof global.navigate === "function") { global.navigate(view); return; }
    } catch (e) {}
    location.hash = "#" + view;
  }

  function close() {
    var root = document.getElementById(ROOT);
    if (root) root.classList.remove("is-open");
    markClosed();
    setTimeout(function () { if (root && root.parentNode) root.parentNode.removeChild(root); }, 430);
  }

  function mount() {
    if (!isTest() || dismissed() || document.getElementById(ROOT)) return;
    ensureStyle();
    var root = document.createElement("div");
    root.id = ROOT;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Jumuʿah aktiviert");
    root.innerHTML =
      '<div class="jan-panel">' +
        '<button type="button" class="jan-close" data-jan="close" aria-label="Schließen">×</button>' +
        '<p class="jan-kicker">Test · Aktivierung</p>' +
        '<h2 class="jan-title">Jumuʿah ist jetzt aktiv</h2>' +
        '<p class="jan-lead">Der Freitag-Bereich aus der Test-App läuft autonom. Heute Freitag erscheint die Karte auf der Startseite.</p>' +
        '<ul class="jan-list">' +
          '<li>Automatisch nur am Freitag, in deiner Zeitzone</li>' +
          '<li>ʿAṣr, Maghrib und besondere Duʿāʾ-Zeit live</li>' +
          '<li>Ṣalāh auf den Propheten ﷺ und aktueller Freitagsimpuls</li>' +
          '<li>Mehr zu Jumuʿah öffnet den vollständigen Bereich</li>' +
          '<li>52-Wochen-Serie, intern überwacht – nicht für Besucher</li>' +
        "</ul>" +
        '<div class="jan-actions">' +
          '<button type="button" class="jan-btn is-main" data-jan="home">Zur Startseite</button>' +
          '<button type="button" class="jan-btn" data-jan="jummah">Mehr zu Jumuʿah</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(root);
    requestAnimationFrame(function () { root.classList.add("is-open"); });
    root.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-jan]") : null;
      if (!t) return;
      var act = t.getAttribute("data-jan");
      if (act === "close") { close(); return; }
      if (act === "home") { close(); go("home"); return; }
      if (act === "jummah") { close(); go("jummah"); }
    });
  }

  function boot() {
    if (!isTest()) return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
    else mount();
  }

  boot();
})(window);
