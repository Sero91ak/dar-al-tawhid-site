/**
 * DĀR AL TAWḤĪD · TEST ONLY · Adaptive navigation placement v1325
 *
 * One existing #bottomNav, three user positions:
 * - bottom: current centered glass capsule with labels
 * - left/right: narrow vertical glass rail, 3D icons only
 *
 * Side rails are enabled only when enough viewport space exists. On a narrow
 * phone the saved preference is preserved but the effective position falls
 * back to bottom. No route content is rebuilt and no scroll position changes.
 */
(function (global) {
  "use strict";

  var path = String(global.location && global.location.pathname || "");
  if (!(path === "/test" || path.indexOf("/test/") === 0)) return;
  if (global.__DAR_ADAPTIVE_NAV_V1325) return;
  global.__DAR_ADAPTIVE_NAV_V1325 = true;

  var root = document.documentElement;
  var STORAGE_KEY = "darNavPositionV2";
  var VALID = { bottom: true, left: true, right: true };
  var SIDE_MIN_WIDTH = 760;
  var SIDE_MIN_HEIGHT = 360;
  var currentEffective = "bottom";
  var sideApplied = false;
  var rafId = 0;
  var idleTimer = 0;
  var burstTimers = [];
  var observer = null;
  var restoringBottom = false;

  var navProperties = [
    "position", "left", "right", "top", "bottom",
    "width", "min-width", "max-width",
    "height", "min-height", "max-height",
    "margin", "padding", "flex-direction",
    "justify-content", "align-items", "gap",
    "border-radius", "transform", "-webkit-transform",
    "z-index", "transition"
  ];

  function readPreference() {
    try {
      var value = String(global.localStorage.getItem(STORAGE_KEY) || "bottom");
      return VALID[value] ? value : "bottom";
    } catch (error) {
      return "bottom";
    }
  }

  function writePreference(value) {
    var next = VALID[value] ? value : "bottom";
    try {
      global.localStorage.setItem(STORAGE_KEY, next);
    } catch (error) {}
    return next;
  }


  function renderAdaptiveNavPanelMarkup() {
    var preference = readPreference();
    function button(value,label,small,mark) {
      var selected = preference === value;
      return '<button type="button" class="' + (selected ? 'is-selected' : '') +
        '" data-dar-nav-choice="' + value + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="dar-nav-choice-mark dar-nav-choice-mark--' + mark + '" aria-hidden="true"></span>' +
        '<strong>' + label + '</strong><small>' + small + '</small></button>';
    }
    return '<section class="settings-section dar-nav-position-settings" id="darNavPositionSettingsV1325" aria-labelledby="darNavPositionTitleV1325">' +
      '<div class="dar-nav-position-kicker">NAVIGATION</div>' +
      '<div class="dar-nav-position-head"><div>' +
        '<h3 id="darNavPositionTitleV1325">Position der Tab-Leiste</h3>' +
        '<p>Unten wie bisher oder seitlich als schmale 3D-Icon-Leiste. Auf schmalen Displays bleibt sie automatisch unten.</p>' +
      '</div></div>' +
      '<div class="dar-nav-position-options" role="group" aria-label="Position der Tab-Leiste">' +
        button("left","Links","Linkshänder","left") +
        button("bottom","Unten","Standard","bottom") +
        button("right","Rechts","Rechtshänder","right") +
      '</div>' +
      '<p class="dar-nav-position-status" id="darNavPositionStatusV1325"></p>' +
    '</section>';
  }

  function installSettingsRenderer() {
    try {
      global.renderAdaptiveNavPanel = renderAdaptiveNavPanelMarkup;
    } catch (error) {}
  }

  function measure() {
    if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.measure === "function") {
      try {
        return global.DarAdaptiveLayout.measure();
      } catch (error) {}
    }
    var viewport = global.visualViewport;
    var clientWidth = document.documentElement ? document.documentElement.clientWidth : 0;
    var clientHeight = document.documentElement ? document.documentElement.clientHeight : 0;
    return {
      width: Math.round((viewport && viewport.width) || clientWidth || global.innerWidth || 0),
      height: Math.round((viewport && viewport.height) || clientHeight || global.innerHeight || 0),
      offsetTop: Math.round((viewport && viewport.offsetTop) || 0)
    };
  }

  function sideAllowed(preference, metrics) {
    if (preference !== "left" && preference !== "right") return false;
    if (!document.body) return false;
    var width = Number(metrics && metrics.width) || 0;
    var height = Number(metrics && metrics.height) || 0;
    if (width < SIDE_MIN_WIDTH || height < SIDE_MIN_HEIGHT) return false;
    if (root.classList.contains("adaptive-keyboard-open")) return false;
    if (document.body.classList.contains("is-ilm-chat-route")) return false;
    return true;
  }

  function effectivePosition(preference, metrics) {
    return sideAllowed(preference, metrics) ? preference : "bottom";
  }

  function setRootState(preference, effective) {
    root.setAttribute("data-dar-nav-preference", preference);
    root.setAttribute("data-dar-nav-position", effective);
    root.classList.toggle("dar-test-side-nav", effective === "left" || effective === "right");
    root.classList.remove("dar-test-thumb-nav");
  }

  function applySidePosition(nav, side) {
    nav.classList.remove("is-adaptive-centered");
    nav.classList.add("is-adaptive-rail");
    nav.style.setProperty("position", "fixed", "important");
    nav.style.setProperty("left", side === "left" ? "max(8px, env(safe-area-inset-left, 0px))" : "auto", "important");
    nav.style.setProperty("right", side === "right" ? "max(8px, env(safe-area-inset-right, 0px))" : "auto", "important");
    nav.style.setProperty("top", "50%", "important");
    nav.style.setProperty("bottom", "auto", "important");
    nav.style.setProperty("width", "70px", "important");
    nav.style.setProperty("min-width", "70px", "important");
    nav.style.setProperty("max-width", "70px", "important");
    nav.style.setProperty(
      "height",
      "min(390px, calc(100dvh - max(18px, env(safe-area-inset-top, 0px)) - max(18px, env(safe-area-inset-bottom, 0px))))",
      "important"
    );
    nav.style.setProperty("min-height", "292px", "important");
    nav.style.setProperty("max-height", "390px", "important");
    nav.style.setProperty("margin", "0", "important");
    nav.style.setProperty("padding", "6px", "important");
    nav.style.setProperty("flex-direction", "column", "important");
    nav.style.setProperty("justify-content", "space-between", "important");
    nav.style.setProperty("align-items", "stretch", "important");
    nav.style.setProperty("gap", "2px", "important");
    nav.style.setProperty("border-radius", "26px", "important");
    nav.style.setProperty("transform", "translate3d(0,-50%,0)", "important");
    nav.style.setProperty("-webkit-transform", "translate3d(0,-50%,0)", "important");
    nav.style.setProperty("z-index", "80", "important");
    nav.style.setProperty("transition", "opacity .22s cubic-bezier(.22,1,.36,1), background-color .22s ease, border-color .22s ease", "important");
    sideApplied = true;
  }

  function clearSidePosition(nav) {
    if (!sideApplied) return;
    navProperties.forEach(function (property) {
      nav.style.removeProperty(property);
    });
    nav.classList.remove("is-adaptive-rail");
    sideApplied = false;

    if (!restoringBottom && global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.syncNav === "function") {
      restoringBottom = true;
      try {
        global.DarAdaptiveLayout.syncNav();
      } catch (error) {}
      restoringBottom = false;
    }
  }

  function isReadingContext() {
    var body = document.body;
    if (!body) return false;
    if (
      body.classList.contains("is-post-route") ||
      body.classList.contains("is-quran-route") ||
      body.classList.contains("is-hadith-route") ||
      body.classList.contains("reader-mode")
    ) return true;
    return !!document.querySelector(
      ".article,.post-reader,.post-body,.quran-reader-shell,.quran-ayah-list,.dua-detail-box,.lib-detail,.qsrc-detail,.hadith-detail,.pdf-viewer,[data-pdf-viewer],iframe[src*='.pdf'],embed[type='application/pdf']"
    );
  }

  function clearIdleTimer() {
    if (idleTimer) {
      global.clearTimeout(idleTimer);
      idleTimer = 0;
    }
  }

  function scheduleIdle() {
    clearIdleTimer();
    root.classList.remove("dar-nav-reader-idle");
    if (currentEffective !== "left" && currentEffective !== "right") return;
    idleTimer = global.setTimeout(function () {
      idleTimer = 0;
      if ((currentEffective === "left" || currentEffective === "right") && isReadingContext()) {
        root.classList.add("dar-nav-reader-idle");
      }
    }, 1100);
  }

  function wakeNav() {
    if (currentEffective !== "left" && currentEffective !== "right") return;
    root.classList.remove("dar-nav-reader-idle");
    scheduleIdle();
  }

  function settingsHost() {
    return document.getElementById("appView") || document.querySelector(".view");
  }

  function ensureSettingsControl() {
    if (!document.body || !document.body.classList.contains("is-settings-route")) return null;
    var host = settingsHost();
    if (!host) return null;

    var panel = document.getElementById("darNavPositionSettingsV1325");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "darNavPositionSettingsV1325";
      panel.className = "settings-section dar-nav-position-settings";
      panel.setAttribute("aria-labelledby", "darNavPositionTitleV1325");
      panel.innerHTML =
        '<div class="dar-nav-position-kicker">NAVIGATION</div>' +
        '<div class="dar-nav-position-head">' +
          '<div><h3 id="darNavPositionTitleV1325">Position der Tab-Leiste</h3>' +
          '<p>Unten mit Beschriftung oder seitlich als schmale 3D-Icon-Leiste.</p></div>' +
        '</div>' +
        '<div class="dar-nav-position-options" role="group" aria-label="Position der Tab-Leiste">' +
          '<button type="button" data-dar-nav-choice="left" aria-pressed="false"><span class="dar-nav-choice-mark dar-nav-choice-mark--left" aria-hidden="true"></span><strong>Links</strong><small>für Linkshänder</small></button>' +
          '<button type="button" data-dar-nav-choice="bottom" aria-pressed="false"><span class="dar-nav-choice-mark dar-nav-choice-mark--bottom" aria-hidden="true"></span><strong>Unten</strong><small>Standard</small></button>' +
          '<button type="button" data-dar-nav-choice="right" aria-pressed="false"><span class="dar-nav-choice-mark dar-nav-choice-mark--right" aria-hidden="true"></span><strong>Rechts</strong><small>für Rechtshänder</small></button>' +
        '</div>' +
        '<p class="dar-nav-position-status" id="darNavPositionStatusV1325"></p>';

      panel.addEventListener("click", function (event) {
        var button = event.target && event.target.closest && event.target.closest("[data-dar-nav-choice]");
        if (!button) return;
        event.preventDefault();
        setPreference(button.getAttribute("data-dar-nav-choice"));
      });

      var setup = document.getElementById("dar-setup-hub");
      var heading = host.querySelector(".settings-page-head");
      if (setup && setup.parentNode) {
        setup.insertAdjacentElement("afterend", panel);
      } else if (heading && heading.parentNode) {
        heading.insertAdjacentElement("afterend", panel);
      } else {
        host.insertBefore(panel, host.firstChild || null);
      }
    }
    return panel;
  }

  function updateSettingsControl(preference, effective) {
    var panel = ensureSettingsControl();
    if (!panel) return;
    panel.querySelectorAll("[data-dar-nav-choice]").forEach(function (button) {
      var selected = button.getAttribute("data-dar-nav-choice") === preference;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    var status = panel.querySelector("#darNavPositionStatusV1325");
    if (!status) return;
    if (preference !== "bottom" && effective === "bottom") {
      status.textContent = "Gespeichert: " + (preference === "left" ? "Links" : "Rechts") + " · Auf diesem schmalen Display bleibt die Leiste automatisch unten.";
    } else if (effective === "left") {
      status.textContent = "Aktiv: links · Bereichsauswahl wird auf breiten Ansichten nach rechts gespiegelt.";
    } else if (effective === "right") {
      status.textContent = "Aktiv: rechts · Bereichsauswahl bleibt auf breiten Ansichten links.";
    } else {
      status.textContent = "Aktiv: unten · 3D-Icons und Beschriftungen bleiben wie gewohnt sichtbar.";
    }
  }

  function apply() {
    var nav = document.getElementById("bottomNav");
    if (!nav) {
      ensureSettingsControl();
      return false;
    }

    var preference = readPreference();
    var metrics = measure();
    var effective = effectivePosition(preference, metrics);
    setRootState(preference, effective);

    currentEffective = effective;
    if (effective === "left" || effective === "right") {
      applySidePosition(nav, effective);
    } else {
      clearSidePosition(nav);
      root.classList.remove("dar-nav-reader-idle");
      clearIdleTimer();
    }
    updateSettingsControl(preference, effective);
    if (effective === "left" || effective === "right") scheduleIdle();
    return true;
  }

  function setPreference(value) {
    var next = writePreference(value);
    schedule(true);
    try {
      global.dispatchEvent(new CustomEvent("dar:navpositionchange", { detail: { preference: next } }));
    } catch (error) {}
    return next;
  }

  function schedule() {
    if (rafId) return;
    rafId = global.requestAnimationFrame(function () {
      rafId = 0;
      apply();
    });
  }

  function clearBurst() {
    burstTimers.forEach(function (id) { global.clearTimeout(id); });
    burstTimers = [];
  }

  function scheduleBurst() {
    clearBurst();
    [0, 120, 360, 720, 1220].forEach(function (delay) {
      burstTimers.push(global.setTimeout(schedule, delay));
    });
  }

  function start() {
    installSettingsRenderer();
    schedule();

    global.addEventListener("dar:layoutchange", schedule);
    global.addEventListener("dar:view-rendered", schedule);
    global.addEventListener("dar:navpositionchange", schedule);
    global.addEventListener("resize", schedule, { passive: true });
    global.addEventListener("orientationchange", scheduleBurst, { passive: true });
    global.addEventListener("pageshow", scheduleBurst, { passive: true });
    global.addEventListener("popstate", schedule, { passive: true });
    global.addEventListener("hashchange", schedule, { passive: true });

    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", schedule, { passive: true });
    }

    global.addEventListener("scroll", wakeNav, { passive: true });
    global.addEventListener("wheel", wakeNav, { passive: true });
    global.addEventListener("pointerdown", wakeNav, { passive: true });
    global.addEventListener("touchstart", wakeNav, { passive: true });
    global.addEventListener("keydown", wakeNav);

    if (document.body && typeof MutationObserver === "function") {
      observer = new MutationObserver(function () {
        schedule();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest && event.target.closest("[data-dar-nav-choice]");
    if (!button) return;
    event.preventDefault();
    setPreference(button.getAttribute("data-dar-nav-choice"));
  }, true);

  global.DarAdaptiveNavPlacement = {
    getPreference: readPreference,
    setPreference: setPreference,
    getEffectivePosition: function () { return currentEffective; },
    apply: apply,
    measure: measure
  };

  /* Compatibility for the old test prototype name. */
  global.DarTestThumbNav = {
    takeControl: function () { return apply(); },
    apply: apply,
    isActive: function () { return currentEffective === "left" || currentEffective === "right"; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
