/* Regression test for adult touch navigation and Kids swipe-back lock.
 * Runs without npm packages: node scripts/touch-navigation-guard-test.cjs
 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const chrome = fs.readFileSync(path.join(root, "assets/dar-app-chrome.js"), "utf8");
const adultSwift = fs.readFileSync(path.join(root, "ios/DarAlTawhid/DarAlTawhid/WebAppView.swift"), "utf8");
const alternateSwift = fs.readFileSync(path.join(root, "ios/DarAlTawhid/DarAlTawhid/FreshWebAppView.swift"), "utf8");

assert.match(chrome, /DAR_TOUCH_INTENT_GUARD_V1/);
assert.match(adultSwift, /allowsBackForwardNavigationGestures = false/);
assert.match(alternateSwift, /allowsBackForwardNavigationGestures = false/);
assert.doesNotMatch(adultSwift, /allowsBackForwardNavigationGestures = true/);
assert.doesNotMatch(alternateSwift, /allowsBackForwardNavigationGestures = true/);

const listeners = new Map();
let now = 1000;
const viewport = { setAttribute() {} };
const document = {
  addEventListener(type, handler) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(handler);
  },
  querySelector(selector) {
    return selector === 'meta[name="viewport"]' ? viewport : null;
  },
  head: { appendChild() {} },
  documentElement: {}
};
const window = { addEventListener() {} };
vm.runInNewContext(chrome, {
  window, document,
  MutationObserver: class { observe() {} },
  requestAnimationFrame() {},
  setTimeout() { return 0; },
  performance: { now: () => now }
}, { filename: "dar-app-chrome.js" });

function el(nav = false) {
  return {
    closest(selector) {
      return nav && selector === "[data-nav],[data-bottom-nav],#backBtn,#homeBtn,#qovBackBtn,#qrcBackBtn" ? this : null;
    },
    contains(other) { return other === this; }
  };
}
function fire(type, target, options = {}) {
  const e = {
    target, pointerId: 1, pointerType: "touch", isPrimary: true,
    clientX: 20, clientY: 20, detail: 1, isTrusted: true,
    cancelable: true, ...options,
    prevented: false, stopped: false,
    preventDefault() { this.prevented = true; },
    stopImmediatePropagation() { this.stopped = true; }
  };
  for (const handler of listeners.get(type) || []) {
    handler(e);
    if (e.stopped) break;
  }
  return e;
}
const nav = el(true);
const page = el(false);
function interaction({ distance = 0, target = nav, pointerType = "touch" } = {}) {
  fire("pointerdown", target, { pointerType });
  if (distance) fire("pointermove", target, { clientX: 20 + distance, pointerType });
  const release = fire("pointerup", target, { clientX: 20 + distance, pointerType });
  const click = fire("click", target, { pointerType });
  now += 900;
  return { release, click };
}

let result = interaction({ distance: 3 });
assert.equal(result.release.stopped, false, "Small tap jitter must remain navigable");
assert.equal(result.click.stopped, false, "Intentional click must remain navigable");

result = interaction({ distance: 16 });
assert.equal(result.release.stopped, true, "Scroll/drag must not activate on pointerup");
assert.equal(result.release.prevented, true, "Drag navigation activation must be cancelled");
assert.equal(result.click.stopped, true, "Synthetic post-drag click must not navigate");

result = interaction({ distance: 16, target: page });
assert.equal(result.release.stopped, false, "Scroll outside navigation must be left alone");
assert.equal(result.click.stopped, false, "Regular content clicks must not be blocked");

result = interaction({ distance: 5, pointerType: "mouse" });
assert.equal(result.release.stopped, false, "Mouse click must remain unchanged");

result = interaction({ distance: 16 });
assert.equal(result.release.stopped, true, "Further drags stay protected");
const keyboard = fire("click", nav, { detail: 0 });
assert.equal(keyboard.stopped, false, "Keyboard activation must remain available");

console.log("OK: adult navigation tap-vs-drag, back gestures and accessible keyboard activation");
