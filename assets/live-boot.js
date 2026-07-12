/**
 * DAR AL TAWḤID — Boot: Cache-Update + Feed-Doppelheader + Chip-Pruning.
 * Wird über jsDelivr geladen (nicht über dar-al-tawhid.de gecacht).
 */
(function () {
  "use strict";

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

  function findHomeMoreSection() {
    var sections = document.querySelectorAll("section.home-more-section");
    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      if (section && (section.querySelector("#homeMoreBody") || /Mehr entdecken/i.test(section.textContent || ""))) {
        return section;
      }
    }
    return null;
  }

  function findLatestPostsSection() {
    var sections = document.querySelectorAll("section.section-block");
    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      if (section && section.querySelector("#latestGrid")) return section;
    }
    for (var j = 0; j < sections.length; j += 1) {
      var candidate = sections[j];
      var heading = candidate && candidate.querySelector(".section-head h3");
      if (heading && /Neueste Beiträge/i.test(heading.textContent || "")) return candidate;
    }
    return null;
  }

  function compactHomeMoreSection() {
    var section = findHomeMoreSection();
    if (!section) return;

    var latest = findLatestPostsSection();
    if (latest && latest.parentNode === section.parentNode && latest !== section) {
      latest.parentNode.insertBefore(section, latest);
    }

    if (section.dataset.homeMoreBound === "1") return;
    section.dataset.homeMoreBound = "1";
    section.setAttribute("role", "button");
    section.setAttribute("tabindex", "0");
    section.setAttribute("aria-label", "Mehr entdecken öffnen");
    section.style.cursor = "pointer";
    section.style.minHeight = "0";
    section.style.height = "auto";
    section.style.maxHeight = "none";
    section.style.margin = "10px 0";
    section.style.padding = "10px 11px";
    section.style.borderRadius = "16px";

    var head = section.querySelector(".collapsible-head");
    if (head) {
      head.style.justifyContent = "space-between";
      head.style.alignItems = "center";
      head.style.gap = "10px";
      head.style.flexWrap = "wrap";
      head.style.marginBottom = "0";
    }

    var toggle = section.querySelector('[data-collapse-target="homeMoreBody"]');
    if (toggle) {
      toggle.style.marginLeft = "auto";
      toggle.style.minWidth = "104px";
      toggle.style.flexShrink = "0";
    }

    var body = section.querySelector("#homeMoreBody");
    if (body) body.style.marginTop = "9px";

    section.addEventListener("click", function (event) {
      if (event.target && event.target.closest && event.target.closest("button,a,input,select,textarea,label")) return;
      if (toggle && typeof toggle.click === "function") toggle.click();
    });
    section.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (toggle && typeof toggle.click === "function") toggle.click();
      }
    });
  }

  function scheduleHomeMoreFix() {
    if (homeMoreScheduled) return;
    homeMoreScheduled = true;
    var done = function () {
      homeMoreScheduled = false;
      try {
        compactHomeMoreSection();
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

    fetch("/version.json", { cache: "no-store" })
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
      .catch(function () {});
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
