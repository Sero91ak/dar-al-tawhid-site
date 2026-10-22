/* DAR TEST · Fold/Duo presentation layer · 2026-10-22.
   Read-only geometry: existing DarAdaptiveLayout/DarFold own navigation and routes.
   Never changes locale, appearance preference, player, account or live iOS shell. */
(function (win, doc) {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(win.location.pathname) || /^\/test\/kids(?:\/|$)/.test(win.location.pathname)) return;
  if (win.DarTestDuoViewportV1) return;
  var root = doc.documentElement, pending = false, last = "";
  function measure() {
    var width = Math.round(root.clientWidth || win.innerWidth || 0);
    var height = Math.round(root.clientHeight || win.innerHeight || 0);
    var keyboard = root.classList.contains("adaptive-keyboard-open");
    var nativeMode = root.getAttribute("data-layout") || "";
    var canDual = false;
    try {
      if (win.DarAdaptiveLayout && typeof win.DarAdaptiveLayout.isDualViewport === "function") {
        canDual = !!win.DarAdaptiveLayout.isDualViewport(width, height);
      } else {
        var usable = width - Math.max(24, Math.min(48, width * .04));
        canDual = width >= 900 && height >= 560 && usable - Math.min(360, Math.max(300, usable * .31)) - 18 >= 500;
      }
    } catch (_) { canDual = false; }
    /* Full-screen portrait iPhone, unfolded iPhone, iPad and Split View all use
       the actual viewport rather than a device name or orientation guess. */
    var stage = (!keyboard && canDual && width >= 900 && nativeMode !== "compact") ? "expanded" :
      (width >= 600 ? "medium" : "compact");
    return { stage: stage, width: width, height: height };
  }
  function update() {
    pending = false;
    var value = measure();
    if (last === value.stage) return;
    last = value.stage;
    root.setAttribute("data-dar-duo-stage", value.stage);
    try { win.dispatchEvent(new CustomEvent("dar-test-duo-stage", { detail: { stage: value.stage } })); } catch (_) {}
  }
  function schedule() {
    if (pending) return;
    pending = true;
    (win.requestAnimationFrame || function (fn) { return win.setTimeout(fn, 0); })(update);
  }
  win.DarTestDuoViewportV1 = { measure: measure, refresh: schedule };
  win.addEventListener("resize", schedule, { passive: true });
  win.addEventListener("orientationchange", schedule, { passive: true });
  win.addEventListener("pageshow", schedule, { passive: true });
  if (win.visualViewport) win.visualViewport.addEventListener("resize", schedule, { passive: true });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", schedule, { once: true });
  schedule();
})(window, document);
