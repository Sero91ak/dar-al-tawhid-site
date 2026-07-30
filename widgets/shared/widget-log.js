/**
 * Minimal internal widget logger – never shows to users.
 */
(function (global) {
  "use strict";
  const VERSION = "widget-log-v1";
  const BUF = [];
  const MAX = 40;

  function push(level, fn, err) {
    try {
      BUF.push({
        level,
        fn: String(fn || ""),
        message: err && err.message ? String(err.message) : String(err || ""),
        at: new Date().toISOString(),
        version: VERSION,
        os: (navigator && navigator.platform) || ""
      });
      if (BUF.length > MAX) BUF.shift();
    } catch (_) {}
  }

  global.DarWidgetLog = {
    VERSION,
    error(fn, err) { push("error", fn, err); },
    dump() { return BUF.slice(); }
  };
})(typeof window !== "undefined" ? window : globalThis);
