/* DAR_GLOBAL_HERODOCK_V2_20261109
 * One adult app Hero geometry owner for original photographic route headers.
 * Keeps the ORIGINAL header/search in the original DOM: direct-child CSS,
 * event delegation, input focus, article identity and navigation survive.
 * No cloning, no 100vw breakout, no scroll-driven positioning, no moving
 * source nodes or modifying the protected Frauen V1416 HeroDock.
 * Future image Heroes opt in via [data-dar-herodock="photo"] on the header.
 */
(function (win, doc) {
  "use strict";
  if (win.__DAR_GLOBAL_HERODOCK_V2) return;
  if (/^\/(?:kids|test\/kids|admin|redaktion)(?:\/|$)/.test(location.pathname)) return;
  win.__DAR_GLOBAL_HERODOCK_V2 = true;
  var ACTIVE_ATTR = "data-dar-global-herodock";
  var SEARCH_ATTR = "data-dar-global-herodock-search";
  var spacers = "dar-global-herodock-spacer";
  var active = null, frame = 0, ownerObserver = null, appObserver = null;
  var resizeObserver = null, currentApp = null, inLayout = false;
  var routeSelectors = [
    'body.is-post-route #appView > .post-reader > .post-reader-title',
    'body.is-topics-route #appView > .topics-hub > .view-head',
    'body.is-topic-route #appView > .topic-collection-page > .view-head',
    'body.is-hadith-route #appView .hadith-hub > .view-head',
    'body.is-hadith-route #appView .hadith-detail > .post-reader-title',
    'body.is-dua-route #appView .dua-hub > .view-head',
    'body.is-dua-route #appView .dua-detail > .view-head',
    'body.is-scholars-route #appView .scholars-index > .scholars-index__header',
    'body.is-scholar-route #appView .scholars-index > .scholars-index__header',
    'body.is-gelehrten-route #appView .scholars-index > .scholars-index__header',
    'body.is-library-route #appView .books-library-shell > .view-head',
    'body.is-books-route #appView .books-library-shell > .view-head',
    'body.is-prophets-route #appView .prophets-hub > .view-head',
    'body.is-prophet-route #appView .prophets-hub > .view-head',
    '#appView [data-dar-herodock="photo"]',
    '#appView [data-hero-kind][data-hero-scroll="sticky"] > .dar-hero-stage'
  ];
  function isAllowed() {
    var body = doc.body;
    return !!(body && body.classList.contains("has-bottom-nav") &&
      !body.classList.contains("is-frauen-route") &&
      !doc.getElementById("darFrauenHeroDockV1416") &&
      !body.classList.contains("desktop-overhaul-v18") &&
      !doc.documentElement.classList.contains("dar-global-herodock-disabled") &&
      doc.getElementById("appView"));
  }
  function visible(el) {
    if (!el || !el.isConnected || el.closest('[hidden],[aria-hidden="true"],[inert]'))
      return false;
    var rect = el.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 20) return false;
    var style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }
  function hasPhoto(el) {
    if (!visible(el)) return false;
    if (el.dataset.darHerodock === "photo") return true;
    var surfaces = [el];
    var overlay = el.querySelector(':scope > .dar-hero');
    if (overlay) surfaces.push(overlay);
    for (var i = 0; i < surfaces.length; i++) {
      var item = surfaces[i];
      if (/url\(/i.test(getComputedStyle(item).backgroundImage)) return true;
      if (/url\(/i.test(getComputedStyle(item, "::before").backgroundImage)) return true;
      if (/url\(/i.test(getComputedStyle(item, "::after").backgroundImage)) return true;
    }
    /* A genuine wide <img>/<picture>, never a portrait avatar or icon. */
    var imgs = el.querySelectorAll('img,picture img');
    for (var j = 0; j < imgs.length; j++) {
      var box = imgs[j].getBoundingClientRect();
      if (box.width >= Math.min(360, el.getBoundingClientRect().width * .65) &&
          box.height >= 105) return true;
    }
    return false;
  }
  function choose() {
    if (!isAllowed()) return null;
    var found = doc.querySelectorAll(routeSelectors.join(","));
    for (var i = 0; i < found.length; i++) {
      var hero = found[i];
      if (!hasPhoto(hero) || !hero.parentElement) continue;
      /* One real Hero per route; never promote a nested card/gallery. */
      if (hero.closest("dialog,[role=dialog],.modal,.reader-overlay,.qrc-shell,.quran-page")) continue;
      var parent = hero.parentElement;
      var search = hero.nextElementSibling;
      if (!search || !search.matches('.main-search,#hadithSearchBlock,.dar-hero-search')) search = null;
      return {hero: hero, parent: parent, search: search};
    }
    return null;
  }
  function restoreInline(node, original, attribute) {
    if (!node) return;
    node.removeAttribute(attribute);
    if (original === null) node.removeAttribute("style");
    else node.setAttribute("style", original);
  }
  function release() {
    if (!active) return;
    if (resizeObserver) resizeObserver.disconnect();
    restoreInline(active.hero, active.heroStyle, ACTIVE_ATTR);
    if (active.search) restoreInline(active.search, active.searchStyle, SEARCH_ATTR);
    if (active.spacer && active.spacer.parentNode) active.spacer.remove();
    active = null;
  }
  function activate(item) {
    release();
    var hero = item.hero, search = item.search;
    var spacer = doc.createElement("div");
    spacer.className = spacers;
    spacer.setAttribute("aria-hidden", "true");
    item.parent.insertBefore(spacer, hero);
    active = {
      hero: hero, parent: item.parent, search: search, spacer: spacer,
      heroStyle: hero.getAttribute("style"),
      searchStyle: search ? search.getAttribute("style") : null
    };
    hero.setAttribute(ACTIVE_ATTR, "v2");
    if (search) search.setAttribute(SEARCH_ATTR, "v2");
    if (typeof ResizeObserver === "function") {
      if (!resizeObserver) resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(hero);
      if (search) resizeObserver.observe(search);
    }
  }
  function set(el, key, value) {
    if (el.style.getPropertyValue(key) !== value ||
        el.style.getPropertyPriority(key) !== "important")
      el.style.setProperty(key, value, "important");
  }
  function pane(hero) {
    var app = doc.getElementById("appView");
    var foldTest = doc.documentElement.classList.contains("dar-fold-v2-active")
      ? doc.getElementById("darFoldV2Pane") : null;
    if (foldTest && foldTest.contains(hero)) return foldTest.getBoundingClientRect();
    var within = hero.closest(".dar-fold__pane,.prophets-pane,.dar-reader-pane");
    if (within && within.getBoundingClientRect().width >= 300)
      return within.getBoundingClientRect();
    var rect = app.getBoundingClientRect();
    var clientWidth = doc.documentElement.clientWidth || win.innerWidth;
    /* A genuine split reading pane begins to the right of a rail. Otherwise
     * the image fills the ENTIRE device, not a centered 1080px article cap. */
    if (rect.left > 100 && rect.width < clientWidth * .85 &&
        doc.documentElement.getAttribute("data-fold-capacity") === "dual") return rect;
    return {left: 0, top: 0, width: clientWidth, right: clientWidth};
  }
  function headerBottom() {
    var fold = doc.documentElement.classList.contains("dar-fold-v2-active");
    if (fold) {
      var bar = doc.getElementById("darFoldV2Topbar");
      if (bar) return Math.max(0, Math.ceil(bar.getBoundingClientRect().bottom));
      return parseFloat(getComputedStyle(doc.documentElement)
        .getPropertyValue("--dar-fold-v2-top")) || 48;
    }
    var header = doc.getElementById("darAdultBrandHeaderV2") ||
      doc.getElementById("darTestBrandHeaderV1");
    if (header && visible(header)) return Math.max(0, Math.ceil(header.getBoundingClientRect().bottom));
    var styles = getComputedStyle(doc.documentElement);
    return Math.max(0,
      parseFloat(styles.getPropertyValue("--dar-test-occlusion-top")) ||
      parseFloat(styles.getPropertyValue("--dar-adult-header-obscured-top")) ||
      parseFloat(styles.getPropertyValue("--dar-visitor-sticky-clearance")) || 0);
  }
  function position(el, wantLeft, wantTop, wantWidth) {
    var width = Math.max(1, Math.round(wantWidth));
    set(el, "position", "fixed");
    set(el, "inset", "auto");
    set(el, "right", "auto");
    set(el, "bottom", "auto");
    set(el, "left", "0px");
    set(el, "top", "0px");
    set(el, "width", width + "px");
    set(el, "max-width", "none");
    set(el, "min-width", "0px");
    set(el, "margin", "0px");
    set(el, "transform", "none");
    set(el, "-webkit-transform", "none");
    set(el, "transition", "none");
    set(el, "animation", "none");
    set(el, "box-sizing", "border-box");
    set(el, "z-index", "180");
    var rect = el.getBoundingClientRect();
    /* Fixed positioning can be viewport-relative OR pane-relative when
     * WebKit/Chromium encounters a containing block (Fold's container-type).
     * Calibrate against actual pixels; never assume 100vw or a fixed gutter. */
    var offsetX = Math.round(wantLeft - rect.left);
    var offsetY = Math.round(wantTop - rect.top);
    if (offsetX) set(el, "left", offsetX + "px");
    if (offsetY) set(el, "top", offsetY + "px");
    return el.getBoundingClientRect();
  }
  function size() {
    if (!active || !active.hero.isConnected ||
        !active.parent.isConnected) return;
    var box = pane(active.hero);
    var top = headerBottom();
    var maxWidth = doc.documentElement.clientWidth || win.innerWidth;
    var left = Math.max(0, Math.min(maxWidth - 1, Math.round(box.left)));
    var width = Math.max(1, Math.min(maxWidth - left, Math.round(box.width)));
    var hero = active.hero;
    set(hero, "min-height", "clamp(210px, 42cqw, 380px)");
    set(hero, "max-height", "none");
    set(hero, "height", "auto");
    set(hero, "aspect-ratio", "auto");
    set(hero, "border-radius", "0px");
    set(hero, "background-size", "cover");
    set(hero, "background-repeat", "no-repeat");
    set(hero, "isolation", "isolate");
    var heroRect = position(hero, left, top, width);
    var height = Math.ceil(heroRect.height);
    if (!Number.isFinite(height) || height < 60 || height > 1200) return;
    var total = height;
    if (active.search && active.search.isConnected) {
      var overlap = Math.min(12, height * .035);
      var searchWidth = Math.max(1, Math.min(width - 20, 920));
      var searchLeft = left + Math.round((width - searchWidth) / 2);
      set(active.search, "border-radius", "0px");
      set(active.search, "-webkit-backdrop-filter", "none");
      set(active.search, "backdrop-filter", "none");
      var searchRect = position(active.search, searchLeft, top + height - overlap, searchWidth);
      total = height - overlap + Math.ceil(searchRect.height);
    }
    if (active.spacer) {
      set(active.spacer, "height", Math.max(0,total) + "px");
      set(active.spacer, "min-height", "0px");
    }
  }
  function reconcile() {
    frame = 0;
    if (inLayout) return;
    inLayout = true;
    try {
      var candidate = choose();
      if (!candidate) { release(); return; }
      if (!active || active.hero !== candidate.hero ||
          active.parent !== candidate.parent || active.search !== candidate.search)
        activate(candidate);
      size();
    } finally { inLayout = false; }
  }
  function schedule() {
    if (frame) return;
    frame = win.requestAnimationFrame(reconcile);
  }
  function watch() {
    var app = doc.getElementById("appView");
    if (app && app !== currentApp) {
      if (appObserver) appObserver.disconnect();
      appObserver = new MutationObserver(schedule);
      appObserver.observe(app, {childList:true, subtree:true});
      currentApp = app;
    }
  }
  function start() {
    if (!doc.body) return;
    ownerObserver = new MutationObserver(function () { watch(); schedule(); });
    ownerObserver.observe(doc.body, {attributes:true,attributeFilter:["class","data-layout"],
      childList:true});
    new MutationObserver(schedule).observe(doc.documentElement, {attributes:true,
      attributeFilter:["class","data-theme","data-theme-variant",
        "data-fold-capacity","data-layout-surface","dir"]});
    win.addEventListener("resize",schedule,{passive:true});
    win.addEventListener("orientationchange",schedule,{passive:true});
    win.addEventListener("hashchange",schedule);
    win.addEventListener("pageshow",schedule);
    doc.addEventListener("dar:view-rendered",schedule);
    watch(); schedule();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  /* Read-only QA contract. No public UI, route, settings or storage writes. */
  win.DARGlobalHeroDockV2 = {
    inspect: function() {
      return {active:!!(active&&active.hero.isConnected),
        hero:active?active.hero.className:null,
        hasSearch:!!(active&&active.search),
        spacer:active&&active.spacer?active.spacer.getBoundingClientRect().height:0,
        owner:"adult-global-herodock-v2"};
    }
  };
})(window,document);
