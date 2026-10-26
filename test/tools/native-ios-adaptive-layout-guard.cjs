#!/usr/bin/env node
/* Native iOS layout ownership regression: WKWebView route boot may reset
   html[data-layout] to compact without changing width or orientation. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../../assets/adaptive-layout.js"), "utf8");
const attrs = Object.create(null);
const root = {
  clientWidth: 390, clientHeight: 844,
  classList: { contains() { return false; }, add() {}, remove() {}, toggle() {} },
  style: { setProperty() {} },
  getAttribute(name) { return attrs[name] || null; },
  setAttribute(name, value) { attrs[name] = String(value); }
};
const winListeners = Object.create(null);
const frames = [];
let onResizeObserver, onLayoutMutation;
class ResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe(node) { if (node === root) onResizeObserver = this.callback; }
}
class MutationObserver {
  constructor(callback) { this.callback = callback; }
  observe(node, options) {
    if (node === root && options.attributeFilter &&
        options.attributeFilter.includes("data-layout")) onLayoutMutation = this.callback;
  }
}
const document = {
  readyState: "loading", documentElement: root,
  body: { classList: { contains() { return false; } } },
  addEventListener() {}, getElementById() { return null; },
  querySelectorAll() { return []; }
};
const window = {
  innerWidth: 390, innerHeight: 844,
  localStorage: { getItem() { return "bottom"; } },
  requestAnimationFrame(fn) { frames.push(fn); return frames.length; },
  addEventListener(name, fn) { winListeners[name] = fn; },
  dispatchEvent() {}
};
vm.runInNewContext(source, {
  window, document, ResizeObserver, MutationObserver,
  CustomEvent: class { constructor(name, data) { this.type = name; this.detail = data.detail; } },
  setTimeout() { return 1; }, clearTimeout() {}
}, { filename: "adaptive-layout.js" });
window.DarAdaptiveLayout.start();
assert.equal(attrs["data-layout"], "compact", "Closed phone must use compact layout");
assert.ok(onLayoutMutation, "Data-layout override must be observed");
assert.ok(onResizeObserver, "Window geometry changes must be observed");
function flush() {
  for (let safety = 0; frames.length && safety < 10; safety++) {
    const batch = frames.splice(0);
    for (const callback of batch) callback();
  }
  assert.equal(frames.length, 0, "Layout must settle without an endless loop");
}
function resize(width, height, expected, axis) {
  root.clientWidth = window.innerWidth = width;
  root.clientHeight = window.innerHeight = height;
  onResizeObserver();
  flush();
  assert.equal(attrs["data-layout"], expected, width + "x" + height + " mode");
  assert.equal(attrs["data-orientation"], axis, width + "x" + height + " orientation");
}
resize(834, 1194, "medium", "portrait"); // tablet portrait
resize(1024, 1366, "expanded", "portrait"); // unfolded / tablet portrait
assert.equal(attrs["data-fold-dual"], "1", "Enough width must activate split mode");
root.setAttribute("data-layout", "compact"); // native iOS override with unchanged width
onLayoutMutation();
flush();
assert.equal(attrs["data-layout"], "expanded", "Repair native compact override");
root.setAttribute("data-layout", "compact");
winListeners.hashchange();
flush();
assert.equal(attrs["data-layout"], "expanded", "Repair on in-app page navigation");
resize(896, 414, "medium", "landscape"); // landscape phone, too short for a dual pane
assert.equal(attrs["data-fold-dual"], "0", "Phone landscape must not force a split");
resize(390, 844, "compact", "portrait"); // folded / compact
console.log("OK: adaptive layout ownership survives native override, route and orientation changes");
