/**
 * DAR AL TAWḤID — Boot: Cache-Update + Feed-Doppelheader + Chip-Pruning.
 * Wird über jsDelivr geladen (nicht über dar-al-tawhid.de gecacht).
 */
(function () {
  "use strict";

  function darDiag(context, err) {
    try {
      if (typeof console !== "undefined" && console.debug) console.debug("[dar-live-boot] " + context, err);
    } catch (_e) {}
  }

  if (typeof location === "undefined") return;
  if ((location.pathname || "").indexOf("/admin") === 0) return;

  var isTest = /\/test(?:\/|$)/.test(location.pathname || "");
  var VERSION_STATE_KEY = "dar_app_version_state_v1";
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

  function shouldPruneNode(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(SKIP_ANCESTORS) || el.closest(SKIP_ANCESTORS)) return false;
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
    stripFeedDuplicateHeader();
    window.addEventListener("hashchange", stripFeedDuplicateHeader);
    if (document.documentElement) {
      new MutationObserver(stripFeedDuplicateHeader).observe(document.documentElement, {
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

  function runVersionCheck() {
    var local = String(window.__DAR_EXPECTED_BUILD || "").trim();
    if (!local) return;

    fetch(isTest ? "/test/version.json" : "/version.json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (remote) {
        if (!remote || !remote.buildId || String(remote.buildId) === local) return;
        var state = readVersionState();
        var remoteBuildId = String(remote.buildId);
        if (state && state.acknowledgedBuildId === remoteBuildId) return;
        window.__darRemoteBuildId = String(remote.buildId);
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

  function boot() {
    bindFeedHeaderGuard();
    bindChipPruneGuard();
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
    runVersionCheck();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
