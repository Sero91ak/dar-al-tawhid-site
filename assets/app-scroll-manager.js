/**
 * DAR AL TAWḤID — zentrale Scroll-Positions-Verwaltung
 * Verhindert ungewolltes Springen nach oben bei Navigation, Re-Render und UI-Aktionen.
 */
(function (global) {
  'use strict';

  if ('scrollRestoration' in global.history) {
    global.history.scrollRestoration = 'manual';
  }

  var preserveNext = false;
  var scrollTopNext = false;
  var pendingRestore = null;
  var saveTimer = 0;
  var hooks = null;

  function getY() {
    return Math.max(0, global.scrollY || global.document.documentElement.scrollTop || 0);
  }

  function stableScrollTo(y, opts) {
    opts = opts || {};
    y = Math.max(0, Number(y) || 0);
    var apply = function () {
      global.scrollTo({ top: y, behavior: 'auto' });
    };
    apply();
    global.requestAnimationFrame(function () {
      global.requestAnimationFrame(function () {
        apply();
        if (opts.retry !== false) {
          global.setTimeout(apply, opts.delay == null ? 50 : opts.delay);
          global.setTimeout(apply, opts.delay2 == null ? 160 : opts.delay2);
        }
      });
    });
  }

  function withScrollPreserved(fn) {
    var y = getY();
    var result;
    try {
      result = fn();
    } catch (err) {
      stableScrollTo(y);
      throw err;
    }
    if (result && typeof result.then === 'function') {
      return result.then(
        function (val) {
          stableScrollTo(y);
          return val;
        },
        function (err) {
          stableScrollTo(y);
          throw err;
        }
      );
    }
    stableScrollTo(y);
    return result;
  }

  function preserveNextRender() {
    preserveNext = true;
  }

  function markScrollToTop() {
    scrollTopNext = true;
  }

  function setPendingRestore(y) {
    pendingRestore = Math.max(0, Number(y) || 0);
  }

  function consumePreserveFlag() {
    if (scrollTopNext) {
      scrollTopNext = false;
      return { mode: 'top' };
    }
    if (preserveNext) {
      preserveNext = false;
      return { mode: 'preserve' };
    }
    if (pendingRestore != null) {
      var y = pendingRestore;
      pendingRestore = null;
      return { mode: 'restore', y: y };
    }
    return null;
  }

  function saveScrollPosition(route, y) {
    if (!hooks || !hooks.saveNavScroll || !route) return;
    hooks.saveNavScroll(route, y == null ? getY() : y);
  }

  function restoreScrollPosition(route) {
    if (!hooks || !hooks.getNavScroll || !route) return 0;
    return Math.max(0, Number(hooks.getNavScroll(route)) || 0);
  }

  function bindScrollSave() {
    global.addEventListener(
      'scroll',
      function () {
        clearTimeout(saveTimer);
        saveTimer = global.setTimeout(function () {
          if (!hooks || !hooks.getCurrentRoute || !hooks.saveNavScroll) return;
          var route = hooks.getCurrentRoute();
          if (!route || route.view === 'post' || route.view === 'dua' || route.view === 'quran-surah' || route.view === 'news-detail') return;
          hooks.saveNavScroll(route, getY());
        }, 100);
      },
      { passive: true }
    );
  }

  function patchInputFocus() {
    try {
      var proto = global.HTMLElement && global.HTMLElement.prototype;
      if (!proto || proto.__darFocusPatched) return;
      var orig = proto.focus;
      proto.focus = function (opts) {
        if (opts === undefined && this.matches && this.matches('input,textarea,select,[contenteditable="true"]')) {
          return orig.call(this, { preventScroll: true });
        }
        return orig.apply(this, arguments);
      };
      proto.__darFocusPatched = true;
    } catch (e) {}
  }

  function initScrollHooks(nextHooks) {
    hooks = nextHooks || null;
    bindScrollSave();
    patchInputFocus();
  }

  global.DARScrollManager = {
    init: initScrollHooks,
    getY: getY,
    stableScrollTo: stableScrollTo,
    withScrollPreserved: withScrollPreserved,
    preserveNextRender: preserveNextRender,
    markScrollToTop: markScrollToTop,
    setPendingRestore: setPendingRestore,
    consumePreserveFlag: consumePreserveFlag,
    saveScrollPosition: saveScrollPosition,
    restoreScrollPosition: restoreScrollPosition
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
