/**
 * DAR AL TAWḤĪD — Fold / Tablet Master-Detail (verbindliche Regel)
 * LINKS ≈ 34 % finden/auswählen · RECHTS ≈ 66 % öffnen/lesen
 * Dual: Tablet Querformat (≥700) ODER große Portrait-Breite (≥840, Fold offen)
 * Compact: Smartphone, Fold zu, Tablet Hochformat — Zustand bleibt in der Route.
 * Bottom-Nav bleibt unten (kein Left-Rail).
 */
(function (global) {
  "use strict";

  var DUAL_MIN = 700;
  var DUAL_PORTRAIT_MIN = 840;
  var RAIL_MIN = 320;
  var RAIL_MAX = 380;

  function measureViewport() {
    if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.measure === "function") {
      try {
        return global.DarAdaptiveLayout.measure();
      } catch (e) {}
    }
    var vv = global.visualViewport;
    var w = Math.round(
      Math.max(
        (vv && vv.width) || 0,
        (document.documentElement && document.documentElement.clientWidth) || 0,
        global.innerWidth || 0
      )
    );
    var h = Math.round(
      Math.max(
        (vv && vv.height) || 0,
        (document.documentElement && document.documentElement.clientHeight) || 0,
        global.innerHeight || 0
      )
    );
    return { width: w || 0, height: h || 0, offsetTop: 0 };
  }

  function measureWidth() {
    return measureViewport().width;
  }

  function isDualViewport(width, height) {
    if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.isDualViewport === "function") {
      try {
        return !!global.DarAdaptiveLayout.isDualViewport(width, height);
      } catch (e) {}
    }
    var w = Number(width) || 0;
    var h = Number(height) || 0;
    if (w < DUAL_MIN) return false;
    if (w >= h) return true;
    if (w >= DUAL_PORTRAIT_MIN) return true;
    return false;
  }

  function isDual() {
    try {
      if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.isDual === "function") {
        return !!global.DarAdaptiveLayout.isDual();
      }
    } catch (e) {}
    var m = measureViewport();
    return isDualViewport(m.width, m.height);
  }

  function emptyPane(message) {
    var msg = String(message || "Inhalt wählen");
    return (
      '<div class="dar-fold__empty" role="status">' +
      '<p class="dar-fold__empty-mark" aria-hidden="true">✦</p>' +
      "<p>" +
      msg +
      "</p>" +
      "</div>"
    );
  }

  /**
   * @param {string} railHtml - left: list / folders / search
   * @param {string} paneHtml - right: opened content
   * @param {{family?:string, emptyMsg?:string, compactMode?:'rail'|'pane'|'auto', forceDual?:boolean, railId?:string, paneId?:string}} opts
   */
  function shell(railHtml, paneHtml, opts) {
    opts = opts || {};
    var dual = opts.forceDual != null ? !!opts.forceDual : isDual();
    var rail = railHtml == null ? "" : String(railHtml);
    var pane = paneHtml == null ? "" : String(paneHtml);

    if (!dual) {
      var cm = opts.compactMode || "auto";
      if (cm === "pane") return pane || rail;
      if (cm === "rail") return rail || pane;
      /* auto: prefer pane (open content) when present */
      return pane || rail;
    }

    if (!pane) pane = emptyPane(opts.emptyMsg || "Links etwas auswählen");

    return (
      '<div class="dar-fold" data-fold-family="' +
      String(opts.family || "") +
      '" data-fold-mode="dual">' +
      '<aside class="dar-fold__rail" id="' +
      String(opts.railId || "darFoldRail") +
      '">' +
      rail +
      "</aside>" +
      '<section class="dar-fold__pane" id="' +
      String(opts.paneId || "darFoldPane") +
      '">' +
      pane +
      "</section>" +
      "</div>"
    );
  }

  function syncRootClass() {
    try {
      var root = document.documentElement;
      var dual = isDual();
      root.classList.toggle("is-fold-dual", dual);
      root.setAttribute("data-fold-dual", dual ? "1" : "0");
      root.style.setProperty("--fold-rail-min", RAIL_MIN + "px");
      root.style.setProperty("--fold-rail-max", RAIL_MAX + "px");
    } catch (e) {}
  }

  function start() {
    syncRootClass();
    global.addEventListener(
      "dar:layoutchange",
      function () {
        syncRootClass();
      },
      { passive: true }
    );
    global.addEventListener(
      "resize",
      function () {
        syncRootClass();
      },
      { passive: true }
    );
    global.addEventListener(
      "orientationchange",
      function () {
        setTimeout(syncRootClass, 80);
        setTimeout(syncRootClass, 320);
      },
      { passive: true }
    );
  }

  var api = {
    DUAL_MIN: DUAL_MIN,
    DUAL_PORTRAIT_MIN: DUAL_PORTRAIT_MIN,
    RAIL_MIN: RAIL_MIN,
    RAIL_MAX: RAIL_MAX,
    measureWidth: measureWidth,
    measureViewport: measureViewport,
    isDualViewport: isDualViewport,
    isDual: isDual,
    emptyPane: emptyPane,
    shell: shell,
    sync: syncRootClass,
  };

  global.DarFold = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
