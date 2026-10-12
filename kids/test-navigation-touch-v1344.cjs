/* KIDS navigation intent regression – Node 20, no external packages. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const kids=fs.readFileSync(path.join(__dirname,"navigation-v1182.js"),"utf8");
assert.match(kids,/KIDS_TOUCH_INTENT_GUARD_V1344/);
assert.match(kids,/gestureVersion:"button-only-navigation-v1343"/);

const kidListeners = new Map();
let kidNow = 500;
const styleStore = Object.create(null);
const kidRoot = {
  dataset: {},
  style: {
    setProperty(key, value) { styleStore[key] = value; },
    getPropertyValue(key) { return styleStore[key] || ""; }
  }
};
const kidDoc = {
  readyState: "loading",
  documentElement: kidRoot,
  head: { appendChild() {} },
  scrollingElement: { scrollTop: 0 },
  getElementById() { return null; },
  createElement() { return { id: "", textContent: "" }; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener(type, cb) {
    if (!kidListeners.has(type)) kidListeners.set(type, []);
    kidListeners.get(type).push(cb);
  }
};
const kidWindow = { innerWidth: 390, scrollY: 0, addEventListener() {} };
vm.runInNewContext(kids, {
  window: kidWindow, document: kidDoc,
  requestAnimationFrame() {},
  setTimeout() {},
  performance: { now: () => kidNow }
}, { filename: "navigation-v1182.js" });
assert.equal(kidListeners.get("DOMContentLoaded").length, 1);
kidListeners.get("DOMContentLoaded")[0]();

const kidTab = {
  dataset: { target: "stories" },
  closest(selector) {
    if (selector.startsWith("button,a,")) return this;
    if (selector === ".nav-btn[data-target]") return this;
    return null;
  }
};
function fireKid(type, overrides = {}) {
  const e = {
    target: kidTab, touches: [], changedTouches: [],
    detail: 1, isTrusted: true, cancelable: true,
    ...overrides, stopped: false, prevented: false,
    stopImmediatePropagation() { this.stopped = true; },
    preventDefault() { this.prevented = true; }
  };
  for (const fn of kidListeners.get(type) || []) {
    fn(e);
    if (e.stopped) break;
  }
  return e;
}
function finger(id, x, y = 20) { return { identifier: id, clientX: x, clientY: y }; }
fireKid("touchstart", { touches: [finger(23, 20)] });
fireKid("touchmove", { touches: [finger(23, 38)] });
fireKid("touchend", { changedTouches: [finger(23, 38)] });
assert.equal(fireKid("click").stopped, true, "Kids: after a drag, tab click must be suppressed");
kidNow += 1000;
fireKid("touchstart", { touches: [finger(24, 20)] });
fireKid("touchend", { changedTouches: [finger(24, 23)] });
assert.equal(fireKid("click").stopped, false, "Kids: genuine short tab tap must remain");
fireKid("touchstart", { touches: [finger(25, 20)] });
fireKid("touchmove", { touches: [finger(25, 39)] });
fireKid("touchcancel");
assert.equal(fireKid("click").stopped, false, "Kids: cancelled touch must not poison next click");


console.log("OK: KIDS dragged tabs, short taps and cancelled gestures");
