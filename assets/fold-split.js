/**
 * DAR AL TAWḤĪD — Fold / Tablet Master-Detail (feste Fold-Regel)
 * LINKS ≈ 34 % finden/auswählen · RECHTS ≈ 66 % öffnen/lesen
 * Compact (<720): normale Smartphone-App — Zustand bleibt in der Route.
 * Expanded (≥720): Zwei Arbeitsbereiche, Bottom-Nav bleibt unten (kein Left-Rail).
 */
(function (global) {
  "use strict";

  var DUAL_MIN = 700;
  var RAIL_MIN = 320;
  var RAIL_MAX = 380;

  function measureWidth() {
    var vv = global.visualViewport;
    var w = Math.round(
      Math.max(
        (vv && vv.width) || 0,
        (document.documentElement && document.documentElement.clientWidth) || 0,
        global.innerWidth || 0
      )
    );
    return w || 0;
  }

  function layoutMode() {
    try {
      return String(document.documentElement.getAttribute("data-layout") || "");
    } catch (e) {
      return "";
    }
  }

  function isDual() {
    var mode = layoutMode();
    if (mode === "expanded") return true;
    if (mode === "compact") return false;
    /* medium / unknown: width gate (Fold open, iPad, Android tablet) */
    return measureWidth() >= DUAL_MIN;
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
    RAIL_MIN: RAIL_MIN,
    RAIL_MAX: RAIL_MAX,
    measureWidth: measureWidth,
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
