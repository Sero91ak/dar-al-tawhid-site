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
  var pendingFrame = 0;
  var pendingTimer = 0;
  var pendingToken = 0;
  var saveTimer = 0;
  var hooks = null;
  var abortBound = false;

  function getY() {
    return Math.max(0, global.scrollY || global.document.documentElement.scrollTop || 0);
  }

  function cancelPendingScroll() {
    pendingToken += 1;
    if (pendingFrame) {
      global.cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
    }
    if (pendingTimer) {
      global.clearTimeout(pendingTimer);
      pendingTimer = 0;
    }
  }

  function bindScrollAbort() {
    if (abortBound) return;
    abortBound = true;
    var abort = function () {
      cancelPendingScroll();
    };
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (type) {
      global.addEventListener(type, abort, { passive: true, capture: true });
    });
  }

  function stableScrollTo(y, opts) {
    opts = opts || {};
    y = Math.max(0, Number(y) || 0);
    var current = getY();
    if (Math.abs(current - y) < 1 && !pendingFrame && !pendingTimer && opts.force !== true) return y;
    cancelPendingScroll();
    var token = pendingToken;
    var apply = function () {
      if (token !== pendingToken) return false;
      global.scrollTo({ top: y, behavior: 'auto' });
      return true;
    };
    pendingFrame = global.requestAnimationFrame(function () {
      pendingFrame = 0;
      apply();
      if (opts.retry === true) {
        var delay = opts.delay == null ? 120 : opts.delay;
        pendingTimer = global.setTimeout(function () {
          pendingTimer = 0;
          apply();
        }, delay);
      }
    });
    return y;
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
    bindScrollAbort();
    bindScrollSave();
    patchInputFocus();
  }

  global.DARScrollManager = {
    init: initScrollHooks,
    getY: getY,
    cancelPendingScroll: cancelPendingScroll,
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
