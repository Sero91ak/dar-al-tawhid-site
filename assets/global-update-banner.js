(function (root) {
  "use strict";
  var STATE = { idle: "idle", available: "updateAvailable", installing: "updateInstalling", ready: "updateReady", error: "updateError" };
  var el = null;
  var state = STATE.idle;
  var pendingBuild = "";
  var applying = false;
  var onApply = null;

  function isAppExperience() {
    try {
      var path = String(location.pathname || "");
      if (path.indexOf("/test/kids") === 0 || path.indexOf("/kids") === 0) return false;
    } catch (e) {}
    return true;
  }

  function ensure() {
    if (el && el.parentNode) return el;
    el = document.getElementById("darGlobalUpdateBanner");
    if (!el) {
      el = document.createElement("div");
      el.id = "darGlobalUpdateBanner";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.innerHTML =
        '<div class="gub-inner">' +
          '<div class="gub-copy"><p class="gub-title">Neue Version verfügbar</p></div>' +
          '<button type="button" class="gub-btn" data-gub-apply>Aktualisieren</button>' +
        "</div>";
      (document.body || document.documentElement).appendChild(el);
    }
    if (!el.dataset.bound) {
      el.dataset.bound = "1";
      el.addEventListener("click", function (ev) {
        var btn = ev.target.closest("[data-gub-apply]");
        if (!btn) return;
        apply();
      });
    }
    return el;
  }

  function setCopy(title, text) {
    var n = ensure();
    var t = n.querySelector(".gub-title");
    var p = n.querySelector(".gub-text");
    if (t) t.textContent = title || "Neue Version verfügbar";
    if (p) p.textContent = "";
  }

  function hide() {
    state = STATE.idle;
    applying = false;
    if (!el) el = document.getElementById("darGlobalUpdateBanner");
    if (el) {
      el.classList.remove("is-open", "is-error");
      document.documentElement.classList.remove("dar-global-update-open");
    }
    root.__darAppVersionAvailable = false;
  }

  function show(opts) {
    opts = opts || {};
    if (!isAppExperience()) return false;
    var build = String(opts.buildId || root.__darRemoteBuildId || "").trim();
    var local = String(opts.localBuild || root.APP_BUILD_ID || root.__DAR_EXPECTED_BUILD || "").trim();
    if (build && local && build === local) {
      hide();
      return false;
    }
    try {
      if (build && sessionStorage.getItem("dar_gub_applied_" + build) === "1" && local === build) {
        hide();
        return false;
      }
    } catch (e) {}
    pendingBuild = build;
    onApply = typeof opts.apply === "function" ? opts.apply : defaultApply;
    ensure();
    setCopy(opts.title || "Neue Version verfügbar", opts.text || "Eine neue Version von DĀR AL TAWḤĪD ist bereit.");
    el.classList.remove("is-error");
    requestAnimationFrame(function () {
      el.classList.add("is-open");
      document.documentElement.classList.add("dar-global-update-open");
    });
    state = STATE.available;
    root.__darAppVersionAvailable = true;
    root.__darGlobalUpdateState = state;
    return true;
  }

  function defaultApply() {
    if (typeof root.hardRefreshApp === "function") root.hardRefreshApp();
    else location.reload();
  }

  async function activateWaitingWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      var reg = await navigator.serviceWorker.getRegistration("/");
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        try { reg.waiting.postMessage({ type: "HARD_REFRESH" }); } catch (e) {}
      }
    } catch (e) {}
  }

  async function apply() {
    if (applying) return;
    if (!navigator.onLine) {
      state = STATE.error;
      el && el.classList.add("is-error");
      setCopy("Aktualisierung nicht möglich", "Aktualisierung momentan nicht möglich. Internetverbindung prüfen.");
      return;
    }
    applying = true;
    state = STATE.installing;
    root.__darGlobalUpdateState = state;
    if (pendingBuild) {
      try { sessionStorage.setItem("dar_gub_applied_" + pendingBuild, "1"); } catch (e) {}
    }
    await activateWaitingWorker();
    try { await onApply(); } catch (e) {
      applying = false;
      state = STATE.error;
      setCopy("Aktualisierung nicht möglich", "Aktualisierung momentan nicht möglich. Internetverbindung prüfen.");
    }
  }

  var api = {
    STATE: STATE,
    isAppExperience: isAppExperience,
    show: show,
    hide: hide,
    apply: apply,
    getState: function () { return state; }
  };
  root.DARGlobalUpdate = api;
})(typeof window !== "undefined" ? window : globalThis);
