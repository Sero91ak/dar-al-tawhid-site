/**
 * Broadcast bridge: main app / widget page can request a local refresh.
 * No network. No loops. Isolated channel.
 */
(function (global) {
  "use strict";

  const VERSION = "widget-bridge-v1";
  const CHANNEL = "dar-prayer-widget-v1";
  const EVENT = "dar-widget-refresh";
  let bc = null;

  function getChannel() {
    if (bc) return bc;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel(CHANNEL);
      }
    } catch (e) {
      bc = null;
    }
    return bc;
  }

  function publish(reason) {
    const payload = {
      type: "refresh",
      reason: String(reason || "manual"),
      at: Date.now(),
      version: VERSION
    };
    try {
      const ch = getChannel();
      if (ch) ch.postMessage(payload);
    } catch (e) {}
    try {
      document.dispatchEvent(new CustomEvent(EVENT, { detail: payload }));
    } catch (e) {}
    try {
      localStorage.setItem("darWidgetPingV1", String(Date.now()));
    } catch (e) {}
  }

  function subscribe(handler) {
    if (typeof handler !== "function") return function () {};
    const onMsg = (ev) => {
      try { handler(ev && ev.data ? ev.data : { type: "refresh" }); } catch (e) {}
    };
    const onCustom = (ev) => {
      try { handler(ev.detail || { type: "refresh" }); } catch (e) {}
    };
    const onStorage = (ev) => {
      if (ev && ev.key === "darWidgetPingV1") {
        try { handler({ type: "refresh", reason: "storage" }); } catch (e) {}
      }
    };
    try {
      const ch = getChannel();
      if (ch) ch.addEventListener("message", onMsg);
    } catch (e) {}
    try {
      document.addEventListener(EVENT, onCustom);
      window.addEventListener("storage", onStorage);
    } catch (e) {}
    return function unsubscribe() {
      try {
        const ch = getChannel();
        if (ch) ch.removeEventListener("message", onMsg);
      } catch (e) {}
      try {
        document.removeEventListener(EVENT, onCustom);
        window.removeEventListener("storage", onStorage);
      } catch (e) {}
    };
  }

  global.DarWidgetBridge = {
    VERSION,
    CHANNEL,
    EVENT,
    publish,
    subscribe
  };
})(typeof window !== "undefined" ? window : globalThis);
