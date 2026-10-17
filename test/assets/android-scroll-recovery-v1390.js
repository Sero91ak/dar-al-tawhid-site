/* DAR_TEST_ANDROID_TOUCH_SCROLL_RECOVERY_V1390 · 2026-10-17
 * Adult Dar Test only. Repair orphaned Quran sheet locks after route changes;
 * a genuinely visible sheet remains fully locked and functional.
 * Does not bind touchstart/touchmove, change navigation, audio, push or Kids.
 */
(function () {
  "use strict";
  if (window.__DAR_TEST_ANDROID_TOUCH_SCROLL_RECOVERY_V1390) return;
  window.__DAR_TEST_ANDROID_TOUCH_SCROLL_RECOVERY_V1390 = true;

  var lockKinds = ["qrc-sheet-open", "qov-sheet-open", "quran-panel-open"];
  var sheetSelectors = [
    "#qrcSettingsMount .qrc-sheet", "#qrcPickerMount .qrc-sheet",
    "#qrcInfoMount .qrc-sheet", "#qrcAyahMenuMount .qrc-sheet",
    "#qovDisplayMount .qov-sheet", "#qovDirectMount .qov-sheet",
    "#quranExplanationMount .quran-explain-sheet",
    ".qrc-sheet-backdrop", ".qov-sheet-backdrop",
    "#quranExplanationMount .quran-explain-overlay",
    ".quran-explain-overlay"
  ];
  var pending = false;
  var recovering = false;

  function visible(el) {
    if (!el || !el.isConnected || el.hidden ||
        el.closest("[hidden], [inert], [aria-hidden='true']")) return false;
    var style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" ||
        Number(style.opacity) < .08 || style.pointerEvents === "none") return false;
    var r = el.getBoundingClientRect();
    return r.width >= 32 && r.height >= 32;
  }

  function activeSheet() {
    for (var i = 0; i < sheetSelectors.length; i++) {
      var els = document.querySelectorAll(sheetSelectors[i]);
      for (var j = 0; j < els.length; j++) {
        if (visible(els[j])) return true;
      }
    }
    return false;
  }

  function lockPresent() {
    var html = document.documentElement, body = document.body;
    return !!body && lockKinds.some(function (name) {
      return html.classList.contains(name) || body.classList.contains(name);
    });
  }

  function recover() {
    if (recovering || !document.body || !lockPresent() || activeSheet()) return;
    recovering = true;
    try {
      /* Call the owning runtime's reset so its internal counter is cleared,
       * instead of merely hiding a CSS class and leaving the next sheet broken. */
      if (typeof window.forceResetQrcOverlayLocks === "function") {
        window.forceResetQrcOverlayLocks();
      } else {
        lockKinds.forEach(function (name) {
          document.documentElement.classList.remove(name);
          document.body.classList.remove(name);
        });
        document.documentElement.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("height");
        ["overflow", "position", "top", "left", "right", "width"].forEach(function (name) {
          document.body.style.removeProperty(name);
        });
      }
      window.__darTestLastScrollRecovery = {
        reason: "orphaned-quran-overlay-lock", route: location.hash,
        at: Date.now()
      };
    } catch (_) {} finally {
      recovering = false;
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      recover();
    });
  }

  /* Read-only diagnosis so a real Android regression run can distinguish
   * native touch blocking, CSS scroll locks and simply short content. */
  window.__darTestScrollDiagnostic = function () {
    var doc = document.scrollingElement;
    var html = document.documentElement, body = document.body;
    function info(el) {
      if (!el) return null;
      var s = getComputedStyle(el);
      return {
        top: el.scrollTop, scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight, overflowY: s.overflowY,
        touchAction: s.touchAction, position: s.position
      };
    }
    return {
      hash: location.hash,
      activeSheet: activeSheet(),
      lockPresent: lockPresent(),
      htmlClass: html.className,
      bodyClass: body && body.className,
      document: info(doc),
      html: info(html),
      body: info(body),
      view: info(document.getElementById("appView")),
      lastRecovery: window.__darTestLastScrollRecovery || null
    };
  };

  document.addEventListener("DOMContentLoaded", schedule, { once: true });
  window.addEventListener("pageshow", schedule, { passive: true });
  window.addEventListener("hashchange", function () {
    schedule();
    setTimeout(schedule, 180);
  }, { passive: true });
  window.addEventListener("dar:layoutchange", schedule, { passive: true });
  document.addEventListener("dar:view-rendered", schedule, { passive: true });

  /* Watch only overlay class changes, not all rendered page elements. */
  try {
    var observer = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        if (records[i].attributeName === "class") {
          schedule();
          break;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    else document.addEventListener("DOMContentLoaded", function () {
      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }, { once: true });
  } catch (_) {}
  schedule();
})();
