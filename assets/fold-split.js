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
      if ((pref === "left" || pref === "right") && w >= 760 && h >= 360) sideReserve = 76;
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
      var segments = null;
      try {
        segments = global.DarAdaptiveLayout && global.DarAdaptiveLayout.getFoldGeometry
          ? global.DarAdaptiveLayout.getFoldGeometry(metrics.width,metrics.height) : null;
      } catch (eSegments) {}

      /* Each half is its own reading surface. Align their inner edges to the
         actual segment positions instead of centering a 34/66 split across
         the hardware crease. Never set a phantom segment on an iPad. */
      root.setAttribute("data-fold-book", dual && segments ? "1" : "0");
      root.setAttribute("data-fold-source", segments ? segments.source : "none");
      var shells = document.querySelectorAll(".dar-fold[data-fold-mode='dual']");
      for (var si=0;si<shells.length;si++) {
        var shell = shells[si];
        if (!segments || !dual) {
          shell.style.removeProperty("--dar-fold-left-track");
          shell.style.removeProperty("--dar-fold-right-track");
          shell.style.removeProperty("--dar-fold-seam-gap");
          continue;
        }
        var rect=shell.getBoundingClientRect();
        var padding=12;
        var leftTrack=Math.max(0,segments.left.x+segments.left.width-rect.left-padding);
        var rightTrack=Math.max(0,rect.right-segments.right.x-padding);
        var seamGap=Math.max(0,rect.width-leftTrack-rightTrack);
        if (leftTrack>=225 && rightTrack>=225 && seamGap>=0) {
          shell.style.setProperty("--dar-fold-left-track",Math.floor(leftTrack)+"px");
          shell.style.setProperty("--dar-fold-right-track",Math.floor(rightTrack)+"px");
          shell.style.setProperty("--dar-fold-seam-gap",Math.ceil(seamGap)+"px");
        } else {
          shell.style.removeProperty("--dar-fold-left-track");
          shell.style.removeProperty("--dar-fold-right-track");
          shell.style.removeProperty("--dar-fold-seam-gap");
        }
      }

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

  // v1331: Keep the left navigation position when a new right-hand
  // route replaces the master/detail markup. Each column owns its scroll.
  // This is scoped to real Fold/tablet dual mode; compact phones are untouched.
  var scrollMemory = Object.create(null);
  var lastRenderedShell = null;
  var lastRenderedRoute = "";
  var restoreFrame = 0;
  function rememberFoldScroll(event) {
    if (!isDual() || !event || !event.target || !event.target.closest) return;
    var el = event.target;
    if (!el.classList || (!el.classList.contains("dar-fold__rail") && !el.classList.contains("dar-fold__pane"))) return;
    var shell = el.closest(".dar-fold[data-fold-mode='dual']");
    if (!shell) return;
    var family = shell.getAttribute("data-fold-family") || "other";
    var type = el.classList.contains("dar-fold__rail") ? "rail" : "pane";
    scrollMemory[family + ":" + type] = Math.max(0, el.scrollTop || 0);
  }
  function restoreFoldScrollAfterRender() {
    if (!isDual() || !document.querySelector) return;
    var shell = document.querySelector(".dar-fold[data-fold-mode='dual']");
    if (!shell || shell === lastRenderedShell) return;
    var route = String(global.location && global.location.hash || "");
    var family = shell.getAttribute("data-fold-family") || "other";
    var routeChanged = lastRenderedRoute !== route;
    lastRenderedShell = shell;
    lastRenderedRoute = route;
    if (restoreFrame) global.cancelAnimationFrame(restoreFrame);
    restoreFrame = global.requestAnimationFrame(function () {
      restoreFrame = 0;
      if (!shell.isConnected) return;
      var rail = shell.querySelector(".dar-fold__rail");
      var pane = shell.querySelector(".dar-fold__pane");
      if (rail) rail.scrollTop = scrollMemory[family + ":rail"] || 0;
      if (pane) pane.scrollTop = routeChanged ? 0 : (scrollMemory[family + ":pane"] || 0);
    });
  }
  function bindFoldScrollRetention() {
    if (document.__darFoldScrollRetentionV1331) return;
    document.__darFoldScrollRetentionV1331 = true;
    document.addEventListener("scroll", rememberFoldScroll, { capture: true, passive: true });
    var host = document.getElementById("appView") || document.body;
    if (host && typeof MutationObserver === "function") {
      /* Child updates inside an existing reader (audio, progress, cards) do
         not replace the fold shell. Only inspect additions that contain a
         newly mounted fold shell; avoid a DOM-wide query every mutation. */
      var mo = new MutationObserver(function (records) {
        if (!isDual()) return;
        for (var i = 0; i < records.length; i++) {
          var nodes = records[i].addedNodes;
          for (var j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            if (node.nodeType !== 1) continue;
            if ((node.matches && node.matches(".dar-fold[data-fold-mode='dual']")) ||
                (node.querySelector && node.querySelector(".dar-fold[data-fold-mode='dual']"))) {
              restoreFoldScrollAfterRender();
              scheduleSync(); // New route shell needs its own hinge coordinates.
              return;
            }
          }
        }
      });
      mo.observe(host, { childList: true, subtree: true });
    }
    global.addEventListener("hashchange", function () {
      // Keep the rail position, but the newly opened reader starts at its top.
      scrollMemory[String(document.querySelector(".dar-fold")?.getAttribute("data-fold-family") || "other") + ":pane"] = 0;
      global.requestAnimationFrame(restoreFoldScrollAfterRender);
    }, { passive: true });
    restoreFoldScrollAfterRender();
  }

  function start() {
    syncRootClass();
    bindFoldScrollRetention();
    global.addEventListener(
      "dar:layoutchange",
      function () {
        scheduleSync();
      },
      { passive: true }
    );
    try {
      if (global.navigator && global.navigator.devicePosture &&
          typeof global.navigator.devicePosture.addEventListener === "function") {
        global.navigator.devicePosture.addEventListener("change", scheduleSync, {passive:true});
      }
    } catch (ePosture) {}
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
