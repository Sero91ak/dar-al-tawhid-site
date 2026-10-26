/* DĀR AL TAWḤĪD · fold division geometry relay.
   Native iOS may dispatch dar:native-fold-region with
   {axis:"vertical"|"horizontal",frame:{x,y,width,height},active:true,
    viewportWidth:number,viewportHeight:number}. Frames are already expanded
   by UIKit reserved-region margins and are in WKWebView point coordinates.
   Other browsers may expose visualViewport.segments. Neither is fabricated.
   Without a hardware signal, use symmetric reading halves with a minimum
   visual clearance. This does NOT purport to locate a physical hinge. */
(function (global) {
  "use strict";
  if (global.__DAR_FOLD_HINGE_WORKSPACE_V1) return;
  global.__DAR_FOLD_HINGE_WORKSPACE_V1 = true;
  var lastNative = null;
  var scheduled = false;
  var observer = null;

  function viewport() {
    var root = document.documentElement;
    return {
      w: Math.round(root.clientWidth || global.innerWidth || 0),
      h: Math.round(root.clientHeight || global.innerHeight || 0)
    };
  }
  function validNumber(n) { return typeof n === "number" && isFinite(n); }
  function normalizedRegion(data) {
    if (!data || typeof data !== "object" || data.active === false) return null;
    var frame = data.frame || data;
    var x = Number(frame.x), y = Number(frame.y);
    var width = Number(frame.width), height = Number(frame.height);
    if (![x,y,width,height].every(validNumber) || width < 0 || height < 0) return null;
    var axis = data.axis === "horizontal" || data.axis === "vertical"
      ? data.axis : (width <= height ? "vertical" : "horizontal");
    return { axis: axis, x: x, y: y, width: width, height: height,
      viewportWidth: Number(data.viewportWidth) || 0,
      viewportHeight: Number(data.viewportHeight) || 0 };
  }
  function browserSegmentRegion() {
    try {
      var vv = global.visualViewport;
      var segments = vv && vv.segments;
      if (!segments || segments.length !== 2) return null;
      var a = segments[0], b = segments[1];
      if (!a || !b) return null;
      var left = a.left <= b.left ? a : b;
      var right = left === a ? b : a;
      var v = viewport();
      if (right.left >= left.right && right.left - left.right < v.w * 0.3) {
        return normalizedRegion({ axis: "vertical",
          frame: { x: left.right, y: Math.min(left.top, right.top),
            width: right.left - left.right,
            height: Math.max(left.bottom, right.bottom) - Math.min(left.top, right.top) },
          viewportWidth: v.w, viewportHeight: v.h });
      }
      var top = a.top <= b.top ? a : b, bottom = top === a ? b : a;
      if (bottom.top >= top.bottom) return normalizedRegion({
        axis: "horizontal", frame: { x: Math.min(top.left, bottom.left),
          y: top.bottom, width: Math.max(top.right, bottom.right) - Math.min(top.left, bottom.left),
          height: bottom.top - top.bottom }, viewportWidth:v.w, viewportHeight:v.h });
    } catch (e) {}
    return null;
  }
  function measureShell(shell, division) {
    shell.removeAttribute("data-dar-hinge-measured");
    shell.style.removeProperty("--dar-hinge-left-pane");
    shell.style.removeProperty("--dar-hinge-right-pane");
    shell.style.removeProperty("--dar-hinge-local-gap");
    if (!division || division.axis !== "vertical") return false;
    var r = shell.getBoundingClientRect();
    var left = division.x - r.left;
    var right = r.right - (division.x + division.width);
    var gap = division.width;
    // Respect at least 12 points per edge within each region; CSS handles
    // the actual padding, while hardware exclusion is never narrowed.
    if (left < 270 || right < 270 || gap < 0 || gap > r.width * .33) return false;
    if (Math.abs(left + right + gap - r.width) > 3) return false;
    shell.style.setProperty("--dar-hinge-left-pane", Math.round(left) + "px");
    shell.style.setProperty("--dar-hinge-right-pane", Math.round(right) + "px");
    shell.style.setProperty("--dar-hinge-local-gap", Math.round(gap) + "px");
    shell.setAttribute("data-dar-hinge-measured", "1");
    return true;
  }
  function sync() {
    scheduled = false;
    var root = document.documentElement;
    if (!root || !document.body) return;
    var dims = viewport();
    var dual = root.getAttribute("data-fold-dual") === "1";
    var known = lastNative || browserSegmentRegion();
    // Ignore stale native physical coordinates if the viewport has rotated.
    if (known && known.viewportWidth && Math.abs(known.viewportWidth - dims.w) > 4) known = null;
    if (known && known.viewportHeight && Math.abs(known.viewportHeight - dims.h) > 4) known = null;
    var paired = (dual && dims.w >= 900 && dims.h >= 560) ||
      (!!known && dims.w >= 700 && dims.h >= 560);
    if (!paired) {
      root.removeAttribute("data-dar-hinge-layout");
      root.removeAttribute("data-dar-hinge-source");
      root.removeAttribute("data-dar-hinge-axis");
      document.querySelectorAll(".dar-fold[data-dar-hinge-measured]").forEach(function (shell) {
        measureShell(shell, null);
      });
      return;
    }
    root.setAttribute("data-dar-hinge-layout", "paired");
    root.setAttribute("data-dar-hinge-source", known ? "native" : "capacity");
    root.setAttribute("data-dar-hinge-axis", known ? known.axis : "none");
    root.style.setProperty("--dar-native-division-clearance",
      known ? Math.round(known.axis === "vertical" ? known.width : known.height) + "px" : "28px");
    document.querySelectorAll("#appView .dar-fold[data-fold-mode='dual']").forEach(function (shell) {
      measureShell(shell, known);
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    global.requestAnimationFrame(sync);
  }
  function nativeRegion(event) {
    var payload = event && event.detail;
    // Native reports inactive when the device lies completely flat. Keep the
    // two equal columns, but do not reserve a fictitious physical division.
    lastNative = normalizedRegion(payload);
    schedule();
  }
  function start() {
    // A native document-start injection may precede DOMContentLoaded. Consume
    // its latest region, then listen for posture updates without resetting
    // the user's active page or scroll position.
    lastNative = normalizedRegion(global.__DAR_NATIVE_FOLD_REGION);
    global.addEventListener("dar:native-fold-region", nativeRegion);
    global.addEventListener("resize", schedule, { passive: true });
    global.addEventListener("orientationchange", schedule, { passive: true });
    global.addEventListener("hashchange", schedule, { passive: true });
    global.addEventListener("dar:layoutchange", schedule, { passive: true });
    if (global.visualViewport) global.visualViewport.addEventListener("resize", schedule, {passive:true});
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(schedule);
      var app = document.getElementById("appView");
      if (app) observer.observe(app);
    }
    // Route content replaces the master/detail tree without changing width.
    var host = document.getElementById("appView");
    if (host && typeof MutationObserver === "function") {
      new MutationObserver(function (entries) {
        for (var i=0; i<entries.length; i++) {
          if (!entries[i].addedNodes.length) continue;
          for (var j=0; j<entries[i].addedNodes.length; j++) {
            var n=entries[i].addedNodes[j];
            if (n.nodeType===1 && (n.matches && n.matches(".dar-fold") ||
                n.querySelector && n.querySelector(".dar-fold"))) { schedule(); return; }
          }
        }
      }).observe(host, {childList:true,subtree:true});
    }
    sync();
  }
  global.DarFoldHinge = { sync: sync, normalize: normalizedRegion, viewport:viewport };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {once:true});
  } else start();
})(typeof window !== "undefined" ? window : this);
