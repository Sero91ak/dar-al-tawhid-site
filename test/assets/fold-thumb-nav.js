/**
 * DĀR AL TAWḤĪD · Duos-inspired responsive navigation for the adult TEST app.
 * Only repositions the existing #bottomNav. No app boot changes, body observer,
 * extra floating status UI or visitor/KIDS dependencies.
 * Upstream geometry reference: rmb707/Duos-Public (MIT), LayoutModel.kt.
 */
(function (global) {
  "use strict";

  var path = String(global.location && global.location.pathname || "");
  if (path !== "/test" && path.indexOf("/test/") !== 0) return;
  if (global.__DAR_ADAPTIVE_NAV_V1325) return;
  global.__DAR_ADAPTIVE_NAV_V1325 = true;

  var root = document.documentElement;
  var STORE = "darNavPositionV2";
  var SETTINGS = "darDuosNavMetricsV2";
  var current = "bottom";
  var activeNav = null;
  var frame = 0;
  var bursts = [];
  var layoutKey = "";
  var controlsId = "darNavPositionSettingsV1325";
  var managedStyle = [
    "position", "left", "right", "top", "bottom",
    "width", "min-width", "max-width",
    "height", "min-height", "max-height",
    "margin", "padding", "flex-direction", "justify-content",
    "align-items", "gap", "border-radius",
    "transform", "-webkit-transform", "z-index", "transition",
    "pointer-events"
  ];
  var good = { bottom: true, left: true, right: true };

  function pref() {
    try {
      var value = String(global.localStorage.getItem(STORE) || "bottom");
      return good[value] ? value : "bottom";
    } catch (_) { return "bottom"; }
  }
  function clamp(value, min, max, fallback) {
    var n = Number(value);
    return isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function metricsPref() {
    var saved = {};
    try { saved = JSON.parse(global.localStorage.getItem(SETTINGS) || "{}") || {}; } catch (_) {}
    return {
      width: clamp(saved.width, 56, 84, 68),
      spacing: clamp(saved.spacing, 0, 12, 0),
      vertical: clamp(saved.vertical, 0, 1, .56)
    };
  }
  function viewport() {
    var el = document.documentElement;
    var w = Math.round((el && el.clientWidth) || global.innerWidth || 0);
    var h = Math.round((el && el.clientHeight) || global.innerHeight || 0);
    // Safari's visualViewport may lag a rotation. Use it only when its
    // orientation agrees with the layout viewport.
    var visual = global.visualViewport;
    if (visual && visual.width > 0 && visual.height > 0 &&
        (visual.width >= visual.height) === (w >= h)) {
      w = Math.round(visual.width);
      h = Math.round(visual.height);
    }
    return { w: w, h: h };
  }
  function isKeyboardOpen(v) {
    if (root.classList.contains("adaptive-keyboard-open")) return true;
    var el = document.activeElement;
    var editable = el && (el.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ""));
    return !!(editable && global.visualViewport &&
      (root.clientHeight || global.innerHeight) - global.visualViewport.height > 110);
  }
  function mode(preference, v) {
    if (!good[preference] || preference === "bottom" || !document.body) return "bottom";
    if (document.body.classList.contains("is-ilm-chat-route") || isKeyboardOpen(v)) return "bottom";
    // Covers all form factors by available space, never user agent strings.
    // Compact portrait and narrow split-window: keep full bottom navigation.
    if (v.w < 640 || v.h < 318) return "bottom";
    if (v.w < v.h && v.w < 760) return "bottom";
    return preference;
  }
  function geometry(v, settings, count) {
    var n = Math.max(1, count || 5);
    var width = settings.width;
    var safeTop = 12;
    var safeBottom = 12;
    var space = settings.spacing;
    var minHeight = n * 44 + 16 + (n - 1) * space;
    var idealHeight = n * 48 + 16 + (n - 1) * space;
    var available = Math.max(0, v.h - safeTop - safeBottom);
    if (available < minHeight) return null;
    var height = Math.min(idealHeight, available);
    // Original Duos uses a normalized dockPosition (0..1), clamped to fit.
    var top = clamp(v.h * settings.vertical - height / 2,
      safeTop, v.h - height - safeBottom, safeTop);
    return {
      width: width, height: height, top: top, reserve: width + 28,
      icon: Math.min(42, Math.max(30, Math.round(width * 76 / 106))),
      spacing: space
    };
  }

  function setRoot(preference, effective, g) {
    root.setAttribute("data-dar-nav-preference", preference);
    root.setAttribute("data-dar-nav-position", effective);
    root.classList.toggle("dar-test-side-nav", effective !== "bottom");
    root.classList.remove("dar-test-thumb-nav");
    if (g) {
      root.style.setProperty("--dar-side-nav-size", g.width + "px");
      root.style.setProperty("--dar-side-nav-reserve", g.reserve + "px");
      root.style.setProperty("--dar-duos-nav-height", g.height + "px");
      root.style.setProperty("--dar-duos-nav-top", g.top + "px");
      root.style.setProperty("--dar-duos-nav-icon", g.icon + "px");
      root.style.setProperty("--dar-duos-nav-gap", g.spacing + "px");
    }
  }

  function takeSide(nav, side, g) {
    nav.classList.remove("is-adaptive-centered");
    nav.classList.add("is-adaptive-rail");
    var s = nav.style;
    // The existing adaptive controller previously writes inline !important.
    // Set these only on actual geometry changes, never per DOM mutation.
    var pos = side === "right" ? "right" : "left";
    s.setProperty("position", "fixed", "important");
    s.setProperty("left", side === "left" ? "max(12px, env(safe-area-inset-left, 0px))" : "auto", "important");
    s.setProperty("right", side === "right" ? "max(12px, env(safe-area-inset-right, 0px))" : "auto", "important");
    s.setProperty("top", g.top + "px", "important");
    s.setProperty("bottom", "auto", "important");
    s.setProperty("width", g.width + "px", "important");
    s.setProperty("min-width", g.width + "px", "important");
    s.setProperty("max-width", g.width + "px", "important");
    s.setProperty("height", g.height + "px", "important");
    s.setProperty("min-height", "0", "important");
    s.setProperty("max-height", g.height + "px", "important");
    s.setProperty("margin", "0", "important");
    s.setProperty("padding", "8px", "important");
    s.setProperty("flex-direction", "column", "important");
    s.setProperty("justify-content", "space-evenly", "important");
    s.setProperty("align-items", "center", "important");
    s.setProperty("gap", g.spacing + "px", "important");
    s.setProperty("border-radius", "30px", "important");
    s.setProperty("transform", "none", "important");
    s.setProperty("-webkit-transform", "none", "important");
    s.setProperty("z-index", "96", "important");
    s.setProperty("pointer-events", "auto", "important");
    s.setProperty("transition", "opacity .18s ease, background-color .18s ease", "important");
  }
  function restoreBottom(nav) {
    if (!nav || !nav.classList.contains("is-adaptive-rail")) return;
    managedStyle.forEach(function (key) { nav.style.removeProperty(key); });
    nav.classList.remove("is-adaptive-rail");
    layoutKey = "";
    // Restore the already-existing bottom-capsule geometry, not a new one.
    try {
      if (global.DarAdaptiveLayout &&
          typeof global.DarAdaptiveLayout.syncNav === "function")
        global.DarAdaptiveLayout.syncNav();
    } catch (_) {}
  }
  function navButtons(nav) {
    return nav && nav.querySelectorAll ?
      nav.querySelectorAll(".bottom-nav-btn").length || 5 : 5;
  }

  function choicesMarkup() {
    var p = pref();
    function option(value, title, desc) {
      return '<button type="button" data-dar-nav-choice="' + value +
        '" aria-pressed="' + (p === value ? "true" : "false") + '">' +
        '<strong>' + title + '</strong><small>' + desc + '</small></button>';
    }
    return '<section id="' + controlsId +
      '" class="settings-section dar-nav-position-settings" aria-labelledby="darNavPositionTitleV1325">' +
      '<div class="dar-nav-position-kicker">NAVIGATION</div>' +
      '<h3 id="darNavPositionTitleV1325">Position der Tab-Leiste</h3>' +
      '<p>Im Hochformat kompakt unten; im Querformat wahlweise als seitliche Icon-Leiste.</p>' +
      '<div class="dar-nav-position-options" role="group" aria-label="Navigationsposition">' +
      option("left", "Links", "Linkshänder") +
      option("bottom", "Unten", "Standard") +
      option("right", "Rechts", "Rechtshänder") +
      '</div><p class="dar-nav-position-status" id="darNavPositionStatusV1325"></p>' +
      '<div class="dar-duos-geometry-settings">' +
      '<label>Leistenbreite <output data-metric-output="width"></output>' +
      '<input type="range" data-duos-metric="width" min="56" max="84" step="1"></label>' +
      '<label>Abstand <output data-metric-output="spacing"></output>' +
      '<input type="range" data-duos-metric="spacing" min="0" max="12" step="1"></label>' +
      '<label>Vertikale Position <output data-metric-output="vertical"></output>' +
      '<input type="range" data-duos-metric="vertical" min="0" max="100" step="1"></label>' +
      '</div></section>';
  }
  function installSettingsRenderer() {
    // Existing settings renderers may call this function during view creation.
    global.renderAdaptiveNavPanel = choicesMarkup;
  }
  function settingsPanel() {
    if (!document.body || !document.body.classList.contains("is-settings-route")) return null;
    var panel = document.getElementById(controlsId);
    if (panel) return panel;
    var host = document.getElementById("appView");
    if (!host || !document.createElement) return null;
    var element = document.createElement("section");
    element.innerHTML = choicesMarkup();
    panel = element.firstElementChild;
    if (!panel) return null;
    var heading = host.querySelector(".settings-page-head");
    var hub = document.getElementById("dar-setup-hub");
    if (hub && hub.insertAdjacentElement) hub.insertAdjacentElement("afterend", panel);
    else if (heading && heading.insertAdjacentElement) heading.insertAdjacentElement("afterend", panel);
    else host.appendChild(panel);
    return panel;
  }
  function updatePanel(p, effective) {
    var panel = settingsPanel();
    if (!panel) return;
    panel.querySelectorAll("[data-dar-nav-choice]").forEach(function (b) {
      var selected = b.getAttribute("data-dar-nav-choice") === p;
      b.classList.toggle("is-selected", selected);
      b.setAttribute("aria-pressed", String(selected));
    });
    var status = panel.querySelector("#darNavPositionStatusV1325");
    if (status) {
      status.textContent = p !== "bottom" && effective === "bottom" ?
        "Seitliche Leiste gespeichert · bei wenig Platz automatisch unten." :
        effective === "bottom" ? "Navigation unten aktiv." :
        "Navigation " + (effective === "left" ? "links" : "rechts") + " aktiv.";
    }
    var m = metricsPref();
    ["width", "spacing", "vertical"].forEach(function (name) {
      var input = panel.querySelector('[data-duos-metric="' + name + '"]');
      var value = name === "vertical" ? Math.round(m.vertical * 100) : m[name];
      if (input && Number(input.value) !== value) input.value = String(value);
      var output = panel.querySelector('[data-metric-output="' + name + '"]');
      if (output) output.textContent = value + (name === "vertical" ? " %" : " px");
    });
  }
  function apply() {
    var nav = document.getElementById("bottomNav");
    if (!nav || !document.body) return false;
    if (activeNav && activeNav !== nav) restoreBottom(activeNav);
    activeNav = nav;
    var v = viewport();
    var p = pref();
    var effective = mode(p, v);
    var m = metricsPref();
    var g = effective === "bottom" ? null : geometry(v, m, navButtons(nav));
    if (!g) effective = "bottom";
    // Do not repeatedly mutate nav styles while route content renders.
    var nextKey = effective + "|" + v.w + "|" + v.h + "|" +
      (g ? [g.width, g.top, g.height, g.spacing].join(":") : "none");
    var changed = nextKey !== layoutKey || effective !== current;
    current = effective;
    setRoot(p, effective, g);
    if (changed) {
      layoutKey = nextKey;
      if (g) takeSide(nav, effective, g);
      else restoreBottom(nav);
    }
    updatePanel(p, effective);
    return true;
  }
  function setPreference(value) {
    var next = good[value] ? value : "bottom";
    try { global.localStorage.setItem(STORE, next); } catch (_) {}
    schedule();
    try {
      global.dispatchEvent(new CustomEvent("dar:navpositionchange", { detail: { preference: next } }));
    } catch (_) {}
    return next;
  }
  function setMetric(name, value) {
    if (!({width:1, spacing:1, vertical:1})[name]) return;
    var m = metricsPref();
    m[name] = name === "width" ? clamp(value,56,84,68) :
      name === "spacing" ? clamp(value,0,12,0) : clamp(value / 100,0,1,.56);
    try { global.localStorage.setItem(SETTINGS, JSON.stringify(m)); } catch (_) {}
    schedule();
  }
  function schedule() {
    if (frame) return;
    frame = global.requestAnimationFrame(function () {
      frame = 0;
      apply();
    });
  }
  function rotate() {
    bursts.forEach(function (id) { global.clearTimeout(id); });
    bursts = [];
    schedule();
    [140, 420, 850].forEach(function (delay) {
      bursts.push(global.setTimeout(schedule, delay));
    });
  }
  function onSettingsClick(event) {
    var b = event.target && event.target.closest &&
      event.target.closest("[data-dar-nav-choice]");
    if (!b) return;
    event.preventDefault();
    setPreference(b.getAttribute("data-dar-nav-choice"));
  }
  function onMetricsInput(event) {
    var field = event.target && event.target.closest &&
      event.target.closest("[data-duos-metric]");
    if (field) setMetric(field.getAttribute("data-duos-metric"), field.value);
  }
  function start() {
    installSettingsRenderer();
    schedule();
    global.addEventListener("resize", schedule, { passive: true });
    global.addEventListener("orientationchange", rotate, { passive: true });
    global.addEventListener("pageshow", rotate, { passive: true });
    global.addEventListener("hashchange", rotate, { passive: true });
    global.addEventListener("popstate", schedule, { passive: true });
    global.addEventListener("dar:layoutchange", schedule);
    global.addEventListener("dar:view-rendered", rotate);
    if (global.visualViewport)
      global.visualViewport.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("click", onSettingsClick, true);
    document.addEventListener("input", onMetricsInput, true);
  }
  global.DarAdaptiveNavPlacement = {
    getPreference: pref,
    setPreference: setPreference,
    getEffectivePosition: function () { return current; },
    apply: apply,
    measure: viewport
  };
  global.DarTestThumbNav = {
    takeControl: apply,
    apply: apply,
    isActive: function () { return current !== "bottom"; }
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(typeof window !== "undefined" ? window : this);
