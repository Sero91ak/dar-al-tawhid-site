/**
 * DĀR AL TAWḤĪD — Fold / Tablet Master-Detail (verbindliche Regel)
 * LINKS ≈ 34 % finden/auswählen · RECHTS ≈ 66 % öffnen/lesen
 * Dual: Tablet Querformat (≥700) ODER große Portrait-Breite (≥840, Fold offen)
 * Compact: Smartphone, Fold zu, Tablet Hochformat — Zustand bleibt in der Route.
 * Bottom-Nav bleibt unten (kein Left-Rail).
 */
(function (global) {
  "use strict";

  if (global.__DAR_FOLD_SPLIT_V1326) return;
  global.__DAR_FOLD_SPLIT_V1326 = true;

  var DUAL_MIN = 900;
  var DUAL_PORTRAIT_MIN = 900;
  var RAIL_MIN = 300;
  var RAIL_MAX = 360;
  var READER_MIN = 500;
  var syncRaf = 0;

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
    var sideReserve = 0;
    try {
      var pref = String(global.localStorage.getItem("darNavPositionV2") || "bottom");
      if ((pref === "left" || pref === "right") && w >= 760 && h >= 360) sideReserve = 72;
    } catch (e2) {}
    var outer = Math.round(Math.max(24, Math.min(48, w * 0.04)));
    var usable = Math.max(0, w - sideReserve - outer);
    var rail = Math.round(Math.min(RAIL_MAX, Math.max(RAIL_MIN, usable * 0.31)));
    var reader = Math.max(0, usable - rail - 18);
    return w >= DUAL_MIN && h >= 560 && reader >= READER_MIN;
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
    var rail = railHtml == null ? "" : String(railHtml);
    var pane = paneHtml == null ? "" : String(paneHtml);
    var cm = opts.compactMode || "auto";
    var singleShow = cm === "rail" ? "rail" : cm === "pane" ? "pane" : (pane ? "pane" : "rail");
    var forceMode = opts.forceDual == null ? "auto" : (opts.forceDual ? "dual" : "single");
    if (!pane) pane = emptyPane(opts.emptyMsg || "Links etwas auswählen");

    return (
      '<div class="dar-fold" data-fold-family="' +
      String(opts.family || "") +
      '" data-fold-mode="dual" data-fold-single-show="' +
      singleShow +
      '" data-fold-force="' +
      forceMode +
      '">' +
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
      var metrics = measureViewport();
      var dual = isDualViewport(metrics.width, metrics.height);
      var capacity = null;
      if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.getLayoutCapacity === "function") {
        try { capacity = global.DarAdaptiveLayout.getLayoutCapacity(metrics.width, metrics.height); } catch (e0) {}
      }
      var rail = capacity && capacity.rail ? capacity.rail : RAIL_MIN;
      var reader = capacity && capacity.reader ? capacity.reader : Math.max(0, metrics.width - rail - 16);

      root.classList.toggle("is-fold-dual", dual);
      root.setAttribute("data-fold-dual", dual ? "1" : "0");
      root.setAttribute("data-fold-capacity", dual ? "dual" : "single");
      root.style.setProperty("--fold-rail-min", RAIL_MIN + "px");
      root.style.setProperty("--fold-rail-max", RAIL_MAX + "px");
      root.style.setProperty("--fold-rail-current", Math.round(rail) + "px");
      root.style.setProperty("--fold-reader-available", Math.round(reader) + "px");
    } catch (e) {}
  }

  function scheduleSync() {
    if (syncRaf) return;
    syncRaf = global.requestAnimationFrame(function () {
      syncRaf = 0;
      syncRootClass();
    });
  }

  function start() {
    syncRootClass();
    global.addEventListener(
      "dar:layoutchange",
      function () {
        scheduleSync();
      },
      { passive: true }
    );
    global.addEventListener("resize", scheduleSync, { passive: true });
    global.addEventListener(
      "orientationchange",
      function () {
        setTimeout(scheduleSync, 160);
        setTimeout(scheduleSync, 520);
      },
      { passive: true }
    );
    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", scheduleSync, { passive: true });
    }
  }

  var api = {
    DUAL_MIN: DUAL_MIN,
    DUAL_PORTRAIT_MIN: DUAL_PORTRAIT_MIN,
    RAIL_MIN: RAIL_MIN,
    RAIL_MAX: RAIL_MAX,
    READER_MIN: READER_MIN,
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
