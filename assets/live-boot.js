/**
 * DAR AL TAWḤID — Boot: Cache-Update + Feed-Doppelheader + Chip-Pruning + Hadith-Gate-Guard.
 * Lokal aus /assets/live-boot.js (kein CDN-Wartezeit).
 */
(function () {
  "use strict";

  function darDiag(context, err) {
    try {
      if (typeof console !== "undefined" && console.debug) console.debug("[dar-live-boot] " + context, err);
    } catch (_e) {}
  }

  var domWorkScheduled = false;
  var domWorkQueue = [];

  function scheduleDomWork(fn) {
    domWorkQueue.push(fn);
    if (domWorkScheduled) return;
    domWorkScheduled = true;
    var flush = function () {
      domWorkScheduled = false;
      var queue = domWorkQueue.slice();
      domWorkQueue.length = 0;
      queue.forEach(function (run) {
        try {
          run();
        } catch (e) {}
      });
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(flush);
    else setTimeout(flush, 16);
  }

  if (typeof location === "undefined") return;
  if ((location.pathname || "").indexOf("/admin") === 0) return;

  var isTest = /\/test(?:\/|$)/.test(location.pathname || "");
  var VERSION_STATE_KEY = "dar_app_version_state_v1";
  var HADITH_GATE_ID = "dar-hadith-library-gate";
  var TAG_CLASS_RE = /(chip|chips|badge|pill|tag|tags|keyword|keywords)/i;
  var PRUNE_SELECTOR = [
    '[class*="chip"]',
    '[class*="badge"]',
    '[class*="pill"]',
    '[class*="tag"]',
    '[class*="keyword"]',
  ].join(",");
  var SKIP_ANCESTORS = "nav,footer,form,select,input,textarea,option,[role='tablist'],[contenteditable='true'],[data-keep-tags='true']";
  var pruneScheduled = false;
  var homeMoreScheduled = false;
  var hadithGateScheduled = false;

  function isFeedRoute() {
    try {
      var parts = String(location.hash || "")
        .replace(/^#\/?/, "")
        .split("/")
        .filter(Boolean);
      if (!parts.length) return false;
      return parts[0].toLowerCase() === "feed" && parts[1] !== "topics";
    } catch (e) {
      return false;
    }
  }

  function stripFeedDuplicateHeader() {
    if (!isFeedRoute()) return;
    try {
      if (document.body) document.body.classList.add("is-feed-fullscreen");
      document.querySelectorAll("#appView > .view-head").forEach(function (el) {
        el.remove();
      });
    } catch (e) {}
  }

  function foldText(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ʾ|ʿ|’|‘|`|´|ˈ|ˌ|ː|-/g, " ")
      .replace(/[^a-z0-9\s\u00C0-\u024F\u0600-\u06FF]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function currentRouteKey() {
    try {
      return String(location.hash || "").replace(/^#\/?/, "").split(/[/?&]/)[0].toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function isMoreRoute() {
    var key = currentRouteKey();
    return key === "more" || key === "mehr" || key === "settings" || key === "setup" || key === "einstellungen";
  }

  function shouldPruneNode(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(SKIP_ANCESTORS) || el.closest(SKIP_ANCESTORS)) return false;
    if (el.closest("#dar-hadith-library-gate,.more-feature-row,#dar-setup-hub,.dar-setup-hub")) return false;
    var tagName = el.tagName;
    var cls = String(el.className || "");
    var text = foldText(el.textContent || "");
    if (TAG_CLASS_RE.test(cls)) return true;
    if ((tagName === "SPAN" || tagName === "DIV" || tagName === "LI" || tagName === "SMALL") && text) {
      if (text.length <= 32 && /[#\[]/.test(String(el.textContent || ""))) return true;
    }
    return false;
  }

  function pruneEmptyContainers(root) {
    if (!root || !root.querySelectorAll) return;
    var selectors = [
      '[class*="chip"]',
      '[class*="badge"]',
      '[class*="pill"]',
      '[class*="tag"]',
      '[class*="keyword"]'
    ].join(",");
    root.querySelectorAll(selectors).forEach(function (el) {
      if (!el || el.nodeType !== 1) return;
      if (el.matches(SKIP_ANCESTORS) || el.closest(SKIP_ANCESTORS)) return;
      if (el.closest("#dar-hadith-library-gate,.more-feature-row,#dar-setup-hub,.dar-setup-hub")) return;
      var hasUsefulChild = el.querySelector("button,a,input,select,textarea,img,svg");
      var hasText = foldText(el.textContent || "").length > 0;
      if (!hasUsefulChild && !hasText) {
        el.remove();
      }
    });
  }

  function pruneVisibleChips(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(PRUNE_SELECTOR).forEach(function (el) {
      if (shouldPruneNode(el)) el.remove();
    });
    pruneEmptyContainers(root);
  }

  function scheduleChipPrune() {
    if (pruneScheduled) return;
    pruneScheduled = true;
    var done = function () {
      pruneScheduled = false;
      try {
        pruneVisibleChips(document);
      } catch (e) {}
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(done);
    else setTimeout(done, 16);
  }

  function bindFeedHeaderGuard() {
    scheduleDomWork(stripFeedDuplicateHeader);
    window.addEventListener("hashchange", function () {
      scheduleDomWork(stripFeedDuplicateHeader);
    });
    if (document.documentElement) {
      new MutationObserver(function () {
        scheduleDomWork(stripFeedDuplicateHeader);
      }).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function bindChipPruneGuard() {
    scheduleChipPrune();
    window.addEventListener("hashchange", scheduleChipPrune);
    window.addEventListener("load", scheduleChipPrune);
    document.addEventListener("DOMContentLoaded", scheduleChipPrune);
    if (document.documentElement) {
      new MutationObserver(function () {
        scheduleChipPrune();
      }).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function removeHomeMoreSections() {
    var selectors = ["section.home-more-section", "section.feature-discovery-section"];
    var removed = false;
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (section) {
        if (section) {
          section.remove();
          removed = true;
        }
      });
    });
    return removed;
  }

  function scheduleHomeMoreFix() {
    if (homeMoreScheduled) return;
    homeMoreScheduled = true;
    var done = function () {
      homeMoreScheduled = false;
      try {
        removeHomeMoreSections();
      } catch (e) {}
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(done);
    else setTimeout(done, 16);
  }

  function findLearningTarget() {
    var app = document.getElementById("appView") || document.body;
    if (!app || !app.querySelectorAll) return null;
    var headings = app.querySelectorAll("h1,h2,h3,h4,.section-title,.more-section-title,.group-title,.card-title,.panel-title,.settings-title,.view-title,strong,b");
    for (var i = 0; i < headings.length; i += 1) {
      var text = foldText(headings[i].textContent || "");
      if (text === "lernen wissen" || text.indexOf("lernen wissen") === 0 || text.indexOf("lernen und wissen") === 0) {
        var section = headings[i].closest("section,article,.more-section,.settings-group,.premium-card,.card,.panel,.dar-section,.learn-section") || headings[i].parentElement;
        return section && (section.querySelector(".list,.more-list,.settings-list,.feature-list,.learning-list,.dar-list,.menu-list,.stack,.items") || section);
      }
    }
    var blocks = app.querySelectorAll("section,article,.more-section,.settings-group,.premium-card,.card,.panel,.dar-section,.learn-section");
    for (var j = 0; j < blocks.length; j += 1) {
      var blockText = foldText(blocks[j].textContent || "");
      var hasLearningItems = blockText.indexOf("die propheten") !== -1 || blockText.indexOf("din quiz") !== -1 || blockText.indexOf("beitrage") !== -1 || blockText.indexOf("quran") !== -1;
      if (hasLearningItems) return blocks[j].querySelector(".list,.more-list,.settings-list,.feature-list,.learning-list,.dar-list,.menu-list,.stack,.items") || blocks[j];
    }
    return null;
  }

  function compactHadithGateHtml() {
    return [
      '<section id="' + HADITH_GATE_ID + '" class="dar-hadith-library-gate" aria-label="Ḥadīṯ-Bibliothek" data-dar-hadith-library-open="1">',
      '  <div class="dar-hadith-library-gate__icon" aria-hidden="true">📚</div>',
      '  <div class="dar-hadith-library-gate__body">',
      '    <div class="dar-hadith-library-gate__topline">',
      '      <h3 class="dar-hadith-library-gate__title">Ḥadīṯ-Bibliothek</h3>',
      '      <span class="dar-hadith-library-gate__status">Noch nicht freigegeben</span>',
      '    </div>',
      '    <p class="dar-hadith-library-gate__text">Šarḥ wird vorbereitet.</p>',
      '  </div>',
      '</section>'
    ].join("");
  }

  function enforceHadithGatePlacement() {
    /* Katalogzeile in Mehr bleibt. Extra-Gate-Karte nicht einsetzen. */
  }

  function scheduleHadithGateGuard() {
    if (hadithGateScheduled) return;
    hadithGateScheduled = true;
    var done = function () {
      hadithGateScheduled = false;
      enforceHadithGatePlacement();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(done);
    else setTimeout(done, 16);
  }

  function bindHadithGateGuard() {
    scheduleHadithGateGuard();
    window.addEventListener("hashchange", scheduleHadithGateGuard);
    window.addEventListener("load", scheduleHadithGateGuard);
    window.addEventListener("pageshow", scheduleHadithGateGuard);
    document.addEventListener("dar:render", scheduleHadithGateGuard);
    if (document.documentElement) {
      new MutationObserver(function () {
        scheduleHadithGateGuard();
      }).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  function readVersionState() {
    try {
      var raw = localStorage.getItem(VERSION_STATE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function parseShellBuildNum(buildId) {
    var match = String(buildId || "").match(/app-shell-v(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function runVersionCheck() {
    var local = String(window.__DAR_EXPECTED_BUILD || "").trim();
    if (!local) return;

    fetch(isTest ? "/test/version.json" : "/version.json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (remote) {
        if (!remote || !remote.buildId) return;
        var remoteBuildId = String(remote.buildId);
        if (remoteBuildId === local) return;
        var localNum = parseShellBuildNum(local);
        var remoteNum = parseShellBuildNum(remoteBuildId);
        if (localNum > remoteNum) return;
        if (remoteNum > localNum) {
          try {
            var stuckKey = "dar_version_stuck_guard_v1";
            var stuck = JSON.parse(sessionStorage.getItem(stuckKey) || "{}");
            if (String(stuck.buildId) === remoteBuildId && (Number(stuck.tries) || 0) >= 1) return;
          } catch (e) {}
          try {
            if ("caches" in window) {
              caches.keys().then(function (keys) {
                keys.forEach(function (k) {
                  if (/^dar-al-tawhid-offline-light-/i.test(k)) caches.delete(k);
                });
              });
            }
          } catch (e) {}
          try {
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.getRegistration("/").then(function (reg) {
                try { reg && reg.active && reg.active.postMessage({ type: "HARD_REFRESH" }); } catch (e) {}
                if (reg && typeof reg.update === "function") reg.update().catch(function () {});
              });
            }
          } catch (e) {}
        }
        var state = readVersionState();
        if (state && (String(state.appliedBuildId || "") === remoteBuildId || String(state.acknowledgedBuildId || "") === remoteBuildId) && remoteBuildId !== local) {
          try {
            var cleared = Object.assign({}, state, { appliedBuildId: "", acknowledgedBuildId: "", pendingBuildId: remoteBuildId });
            localStorage.setItem("dar_app_version_state_v1", JSON.stringify(cleared));
          } catch (e) {}
          state = readVersionState();
        }
        if (state && state.updateOfferBlockedUntil && Date.now() < Number(state.updateOfferBlockedUntil) && String(state.updateOfferBlockedBuildId || "") === remoteBuildId) return;
        try {
          var stuck = JSON.parse(sessionStorage.getItem("dar_version_stuck_guard_v1") || "{}");
          if (String(stuck.buildId) === remoteBuildId && (Number(stuck.tries) || 0) >= 3) return;
        } catch (e) {}
        window.__darRemoteBuildId = remoteBuildId;
        if (typeof window.DAR_AUTO_REFRESH === "object" && typeof window.DAR_AUTO_REFRESH.check === "function") {
          try { window.dispatchEvent(new CustomEvent("dar:version-mismatch", { detail: { buildId: remoteBuildId, localBuildId: local } })); } catch (e) {}
          return;
        }
        window.__darAppVersionAvailable = true;
        try {
          window.dispatchEvent(new CustomEvent("dar:version-mismatch", {
            detail: { buildId: remoteBuildId, localBuildId: local }
          }));
        } catch (e) {}
      })
      .catch(function (err) {
        darDiag("version check fetch failed", err);
      });
  }



  // DAR_FORCED_UI_UPDATE_V1007
  var FORCED_UI_UPDATE_ID = "app-shell-v1007-topfix";
  var FORCED_UI_UPDATE_KEY = "dar_forced_ui_update_v1007";

  function isDarAppLike() {
    try {
      var ua = String(navigator.userAgent || "");
      var q = new URLSearchParams(location.search || "");
      return /DarAlTawhid-iOS|DarAlTawhidAndroid/i.test(ua)
        || navigator.standalone === true
        || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
        || q.get("homescreen") === "1"
        || q.get("app") === "1";
    } catch (e) { return false; }
  }

  function installRuntimeSolidTop() {
    try {
      if (document.getElementById("dar-runtime-solid-top-v1007")) return;
      var style = document.createElement("style");
      style.id = "dar-runtime-solid-top-v1007";
      style.textContent = [
        "html.dar-ios-native-app,html.dar-android-native-app,html.is-standalone-pwa{--dar-runtime-top:var(--quran-page-bg,var(--theme-feed-bg,var(--dar-edge-fill,var(--page-cover,var(--outer-bg-flat,var(--bg,#050706))))))}",
        "html.dar-ios-native-app :is(.top-shell,.header,.header.theme-hero-surface,.sf-top,.qov-header,.qov-filter-bar,.qpt-topbar,.app-bar,.view-head,.settings-page-head),html.dar-android-native-app :is(.top-shell,.header,.header.theme-hero-surface,.sf-top,.qov-header,.qov-filter-bar,.qpt-topbar,.app-bar,.view-head,.settings-page-head),html.is-standalone-pwa :is(.top-shell,.header,.header.theme-hero-surface,.sf-top,.qov-header,.qov-filter-bar,.qpt-topbar,.app-bar,.view-head,.settings-page-head){-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;background-image:none!important;background:var(--dar-runtime-top)!important;background-color:var(--dar-runtime-top)!important}",
        "html.dar-ios-native-app :is(.top-edge-fade,.top-swim-aura,#topEdgeFade,#topSwimAura),html.dar-android-native-app :is(.top-edge-fade,.top-swim-aura,#topEdgeFade,#topSwimAura),html.is-standalone-pwa :is(.top-edge-fade,.top-swim-aura,#topEdgeFade,#topSwimAura){display:none!important;visibility:hidden!important;opacity:0!important;height:0!important;background:none!important;filter:none!important;pointer-events:none!important}"
      ].join("");
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {}
  }

  function forceUiRefreshNow() {
    try { localStorage.setItem(FORCED_UI_UPDATE_KEY, FORCED_UI_UPDATE_ID); } catch (e) {}
    try {
      if ("caches" in window) caches.keys().then(function(keys){keys.forEach(function(k){if(/^dar-al-tawhid-offline-light-/i.test(k))caches.delete(k);});});
    } catch (e) {}
    try {
      if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistration("/").then(function(reg){
        try { if(reg && reg.active) reg.active.postMessage({type:"HARD_REFRESH"}); } catch (e) {}
        try { if(reg && typeof reg.update==="function") reg.update(); } catch (e) {}
      });
    } catch (e) {}
    try {
      var u = new URL(location.href);
      u.searchParams.set("darui","1007");
      u.searchParams.set("cb",String(Date.now()));
      location.replace(u.toString());
    } catch (e) { location.reload(); }
  }

  function showForcedUiUpdate() {
    if (!isDarAppLike()) return;
    try { if (String(localStorage.getItem(FORCED_UI_UPDATE_KEY) || "") === FORCED_UI_UPDATE_ID) return; } catch (e) {}
    if (!document.body || document.getElementById("dar-forced-ui-update-v1007")) return;
    var overlay = document.createElement("div");
    overlay.id = "dar-forced-ui-update-v1007";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.innerHTML = '<div class="dar-fu-card"><div class="dar-fu-kicker">DĀR AL TAWḤĪD</div><h2>Aktualisierung bereit</h2><p>Die App-Oberfläche wurde aktualisiert. Einmal neu laden, damit der obere Bereich ohne Blur/Glass übernommen wird.</p><button type="button" id="darForcedUiUpdateBtn">Jetzt aktualisieren</button></div>';
    var style = document.createElement("style");
    style.id = "dar-forced-ui-update-style-v1007";
    style.textContent = "#dar-forced-ui-update-v1007{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:#050706;color:#f5efe1;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif}#dar-forced-ui-update-v1007 .dar-fu-card{width:min(100%,430px);padding:28px 22px 22px;border:1px solid rgba(216,190,122,.28);border-radius:28px;background:#0b0d0c;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.55)}#dar-forced-ui-update-v1007 .dar-fu-kicker{font:700 11px/1.2 Georgia,serif;letter-spacing:.2em;color:#d8be7a}#dar-forced-ui-update-v1007 h2{margin:12px 0 8px;font-size:25px;line-height:1.1}#dar-forced-ui-update-v1007 p{margin:0;color:rgba(245,239,225,.72);font-size:14px;line-height:1.5}#dar-forced-ui-update-v1007 button{width:100%;min-height:54px;margin-top:20px;border:0;border-radius:17px;background:#d8be7a;color:#111;font-size:15px;font-weight:900}";
    (document.head || document.documentElement).appendChild(style);
    document.body.appendChild(overlay);
    var btn = document.getElementById("darForcedUiUpdateBtn");
    if (btn) btn.addEventListener("click", forceUiRefreshNow);
  }

  function boot() {
    installRuntimeSolidTop();
    showForcedUiUpdate();
    bindFeedHeaderGuard();
    bindChipPruneGuard();
    bindHadithGateGuard();
    scheduleHomeMoreFix();
    window.addEventListener("hashchange", scheduleHomeMoreFix);
    window.addEventListener("load", scheduleHomeMoreFix);
    window.addEventListener("pageshow", scheduleHomeMoreFix);
    window.addEventListener("popstate", scheduleHomeMoreFix);
    if (document.documentElement) {
      new MutationObserver(function () {
        scheduleHomeMoreFix();
      }).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    setTimeout(runVersionCheck, 2500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
