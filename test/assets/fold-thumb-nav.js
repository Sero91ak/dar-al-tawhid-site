/**
 * Test-App: Thumb-Nav deaktiviert — Standard-Bottom-Nav bleibt.
 */
(function (global) {
  "use strict";
  global.DarTestThumbNav = {
    takeControl: function () { return false; },
    apply: function () { return false; },
    isActive: function () { return false; }
  };
})(typeof window !== "undefined" ? window : this);
