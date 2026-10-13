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
  // Use real available CSS space, not model names or hardware pixels.
  // The rail needs 68px + 36px gutter and leaves >=536px for content.
  var SIDE_MIN_WIDTH = 640;
  var SIDE_MIN_HEIGHT = 390; // Five accessible tabs need vertical space
  var currentEffective = "bottom";
  var sideApplied = false;
  var lastRailSignature = "";
  var originalDockParent = null;
  var originalDockSibling = null;
  var rafId = 0;
  var idleTimer = 0;
  var scrollFadeTimer = 0;
  var burstTimers = [];
  var observer = null;
  var observedRail = null;
  var restoringBottom = false;

  // Single-owner guard: other legacy SPA controllers may still write
  // left:50% during navigation. Observe only the existing nav element,
  // never the entire app/body; recover only when it is actually displaced.
  function monitorRail(nav) {
    if (observedRail === nav || typeof MutationObserver !== "function") return;
    if (observer) observer.disconnect();
    observedRail = nav;
    observer = new MutationObserver(function () {
      if (currentEffective !== "left" && currentEffective !== "right") return;
      if (nav.parentNode !== document.documentElement ||
          !nav.classList.contains("is-adaptive-rail") ||
          nav.style.getPropertyValue("left") === "50%" ||
          nav.style.getPropertyValue("top") === "auto" ||
          nav.style.getPropertyValue("right") === "auto" && currentEffective === "right" ||
          nav.style.getPropertyValue("left") === "auto" && currentEffective === "left") {
        schedule();
      }
    });
    observer.observe(nav, { attributes: true, attributeFilter: ["style", "class"] });
  }

  var navProperties = [
    "position", "left", "right", "top", "bottom",
    "width", "min-width", "max-width",
    "height", "min-height", "max-height",
    "margin", "margin-left", "margin-right", "padding", "flex-direction",
    "justify-content", "align-items", "gap",
    "border-radius", "transform", "-webkit-transform",
    "z-index", "transition", "pointer-events"
  ];

  function readPreference() {
    try {
      // Emergency recovery for a broken side rail or stale stored position.
      // Explicit navigation to /test/?navSafe=1 restores the original bottom bar.
      // No automatic changes for regular users; affects only this Test URL.
      var qs = new URLSearchParams((global.location && global.location.search) || "");
      if (qs.get("navSafe") === "1") {
        global.localStorage.setItem(STORAGE_KEY, "bottom");
        return "bottom";
      }
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

  // iOS rotation: visualViewport can retain the previous orientation.
  // Follow the layout viewport; only use visualViewport for keyboard detection.
  function measure() {
    var el = document.documentElement;
    var w = Math.round((el && el.clientWidth) || global.innerWidth || 0);
    var h = Math.round((el && el.clientHeight) || global.innerHeight || 0);
    var vv = global.visualViewport;
    var input = document.activeElement;
    var keyboard = !!(vv && h && vv.height && h - vv.height > 140 &&
      input && (input.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(input.tagName || "")));
    return {
      width: w, height: h,
      offsetTop: vv && typeof vv.offsetTop === "number" ? Math.round(vv.offsetTop) : 0,
      keyboard: keyboard
    };
  }

  function sideAllowed(preference, metrics) {
    if (preference !== "left" && preference !== "right") return false;
    if (!document.body) return false;
    var width = Number(metrics && metrics.width) || 0;
    var height = Number(metrics && metrics.height) || 0;
    if (width < SIDE_MIN_WIDTH || height < SIDE_MIN_HEIGHT) return false;
    if (root.classList.contains("adaptive-keyboard-open") || !!(metrics && metrics.keyboard)) return false;
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

  // Duos LayoutModel.kt: 68dp dock, 56–84dp supported, normalized 56%
  // vertical anchor; Dar uses its five genuine tabs (not launcher shortcuts).
  // A separate 36px lane/gutter prevents content from running under the dock.
  function ensureRailViewportParent(nav) {
    // Route layouts can transform BODY and its #appChromeDock. A fixed child
    // of a transformed BODY is anchored to the content column, so the sidebar
    // jumps to the middle on Qur'an/Beiträge transitions. Move the existing
    // nav (and its attached listeners) to the viewport-level HTML element.
    // It stays the SAME DOM node; there is no cloned navigation.
    if (nav.parentNode === document.documentElement) return;
    if (!originalDockParent || !originalDockParent.isConnected) {
      originalDockParent = nav.parentNode;
      originalDockSibling = nav.nextSibling;
    }
    document.documentElement.appendChild(nav);
  }

  function restoreOriginalDockParent(nav) {
    if (!nav || nav.parentNode !== document.documentElement) return;
    if (!originalDockParent || !originalDockParent.isConnected) return;
    if (originalDockSibling && originalDockSibling.parentNode === originalDockParent) {
      originalDockParent.insertBefore(nav, originalDockSibling);
    } else {
      originalDockParent.appendChild(nav);
    }
  }

  // Position relative to the physical viewport, not to a transformed split
  // container. Spacious 100px rail, five 62px targets, 8px spacing.
  function applySidePosition(nav, side, metrics) {
    if (!document.body) return;
    ensureRailViewportParent(nav);
    monitorRail(nav);
    var screenHeight = Math.max(0, Number(metrics && metrics.height) || global.innerHeight || 0);
    var desiredHeight = 5 * 62 + 4 * 8 + 20;
    var dockHeight = Math.min(desiredHeight, Math.max(0, screenHeight - 24));
    var dockTop = Math.max(12, Math.min(screenHeight - dockHeight - 12,
      Math.round(screenHeight * 0.56 - dockHeight / 2)));
    root.style.setProperty("--dar-duos-rail-top", dockTop + "px");
    root.style.setProperty("--dar-duos-rail-height", dockHeight + "px");
    root.style.setProperty("--dar-duos-rail-width", "100px");
    nav.classList.remove("is-adaptive-centered");
    nav.classList.add("is-adaptive-rail");
    // Always refresh the side properties after a route/layout event. The
    // separate adaptive controller may have written 'left:50%' in between;
    // caching only the height would leave the rail stuck in the middle.
    var properties = {
      position:"fixed",
      left:side === "left" ? "max(12px, env(safe-area-inset-left, 0px))" : "auto",
      right:side === "right" ? "max(12px, env(safe-area-inset-right, 0px))" : "auto",
      top:dockTop + "px", bottom:"auto",
      width:"100px", "min-width":"100px", "max-width":"100px",
      height:dockHeight + "px", "min-height":"0", "max-height":dockHeight + "px",
      margin:"0", "margin-left":"0", "margin-right":"0",
      padding:"10px 12px", "flex-direction":"column",
      "justify-content":"space-between", "align-items":"center", gap:"8px",
      "border-radius":"30px", transform:"none", "-webkit-transform":"none",
      "z-index":"96", "pointer-events":"auto", transition:"none"
    };
    Object.keys(properties).forEach(function (key) {
      nav.style.setProperty(key, properties[key], "important");
    });
    lastRailSignature = side + "|" + screenHeight + "|" + dockTop;
    sideApplied = true;
  }

  function clearSidePosition(nav) {
    if (!sideApplied && (!nav || !nav.classList.contains("is-adaptive-rail"))) return;
    navProperties.forEach(function (property) {
      nav.style.removeProperty(property);
    });
    nav.classList.remove("is-adaptive-rail");
    restoreOriginalDockParent(nav);
    sideApplied = false;
    lastRailSignature = "";

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
    if (scrollFadeTimer) {
      global.clearTimeout(scrollFadeTimer);
      scrollFadeTimer = 0;
    }
  }

  function scheduleIdle() {
    root.classList.remove("dar-nav-reader-idle");
  }

  function onScrollActivity() {
    if (currentEffective !== "left" && currentEffective !== "right") return;
    root.classList.add("dar-nav-scrolling");
    if (scrollFadeTimer) global.clearTimeout(scrollFadeTimer);
    scrollFadeTimer = global.setTimeout(function () {
      scrollFadeTimer = 0;
      root.classList.remove("dar-nav-scrolling");
    }, 240);
  }

  function wakeNav() {
    if (currentEffective !== "left" && currentEffective !== "right") return;
    root.classList.remove("dar-nav-scrolling");
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
      applySidePosition(nav, effective, metrics);
    } else {
      clearSidePosition(nav);
      root.classList.remove("dar-nav-reader-idle","dar-nav-scrolling");
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

  var settleTimer = 0;
  var lastViewportShape = "";
  function shape() {
    var el = document.documentElement;
    return ((el && el.clientWidth) || global.innerWidth || 0) + "x" +
      ((el && el.clientHeight) || global.innerHeight || 0);
  }
  function scheduleBurst() {
    // Keep the orientation snapshot in sync with the event itself, so a late
    // visualViewport resize does not restart a second rotation animation.
    lastViewportShape = shape();
    clearBurst();
    if (settleTimer) global.clearTimeout(settleTimer);
    root.classList.add("dar-test-nav-rotating");
    schedule();
    [80, 180, 360, 650, 960].forEach(function (delay) {
      burstTimers.push(global.setTimeout(schedule, delay));
    });
    settleTimer = global.setTimeout(function () {
      root.classList.remove("dar-test-nav-rotating");
      settleTimer = 0;
    }, 1040);
  }
  function onViewportResize() {
    var next = shape();
    if (next !== lastViewportShape) {
      var oldShape = lastViewportShape.split("x").map(Number);
      var newShape = next.split("x").map(Number);
      lastViewportShape = next;
      if (oldShape.length === 2 && oldShape[0] && oldShape[1] &&
          (oldShape[0] >= oldShape[1]) !== (newShape[0] >= newShape[1])) {
        scheduleBurst();
        return;
      }
    }
    schedule();
  }

  function start() {
    installSettingsRenderer();
    schedule();

    global.addEventListener("dar:layoutchange", schedule);
    global.addEventListener("dar:view-rendered", schedule);
    global.addEventListener("dar:navpositionchange", schedule);
    lastViewportShape = shape();
    global.addEventListener("resize", onViewportResize, { passive: true });
    global.addEventListener("orientationchange", scheduleBurst, { passive: true });
    if (global.screen && global.screen.orientation && typeof global.screen.orientation.addEventListener === "function") {
      global.screen.orientation.addEventListener("change", scheduleBurst, { passive: true });
    }
    global.addEventListener("pageshow", scheduleBurst, { passive: true });
    global.addEventListener("popstate", schedule, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) scheduleBurst();
    });
    global.addEventListener("hashchange", function () {
      schedule();
      global.setTimeout(schedule, 90);
      global.setTimeout(schedule, 250);
    }, { passive: true });

    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", onViewportResize, { passive: true });
    }

    global.addEventListener("scroll", onScrollActivity, { passive: true });
    global.addEventListener("wheel", onScrollActivity, { passive: true });
    global.addEventListener("pointerdown", wakeNav, { passive: true });
    global.addEventListener("touchstart", wakeNav, { passive: true });
    global.addEventListener("keydown", wakeNav);

    // At startup the normal bar must be usable immediately. Delayed checks
    // cover late SPA mounting without activating the rotation animation.
    global.setTimeout(schedule, 140);
    global.setTimeout(schedule, 480);
  }

  document.addEventListener("click", function (event) {
    // Reassert viewport anchoring after SPA replaces a master/detail view.
    var clickedNav = event.target && event.target.closest && event.target.closest("#bottomNav .bottom-nav-btn");
    if (clickedNav) {
      // Reassert immediately after a route swap, before the old bottom
      // controller can paint its 50%-centered geometry for several frames.
      global.setTimeout(schedule, 0);
      global.setTimeout(schedule, 36);
      global.setTimeout(schedule, 160);
    }
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
