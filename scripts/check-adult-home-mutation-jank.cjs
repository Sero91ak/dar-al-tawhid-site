#!/usr/bin/env node
"use strict";
/* Regression: noisy DOM text updates must not repeatedly re-run global
 * visitor boot scans or force a Home parity reconciliation. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const boot = fs.readFileSync(path.join(root, "assets/live-boot.js"), "utf8");
const home = fs.readFileSync(path.join(root, "assets/dar-home-test-parity-visitor.js"), "utf8");
const motion = fs.readFileSync(path.join(root, "assets/adult-hero-height-runtime-v1403.js"), "utf8");

const observers = [];
const frames = [];
const handlers = {};
let scans = 0;
const app = { id: "appView" };
const body = {
  classList: { add() {}, contains() { return false; } },
  querySelectorAll() { return []; }
};
const document = {
  readyState: "complete",
  body,
  documentElement: {},
  getElementById(id) { return id === "appView" ? app : null; },
  querySelectorAll() { scans += 1; return []; },
  addEventListener(name, fn) { (handlers[name] ||= []).push(fn); }
};
const location = { pathname: "/", search: "", hash: "#home" };
const window = {
  addEventListener(name, fn) { (handlers[name] ||= []).push(fn); },
  dispatchEvent() {}
};
class MutationObserverMock {
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(node, options) { this.node = node; this.options = options; }
}
vm.runInNewContext(boot, {
  window, document, location,
  navigator: { userAgent: "DarAlTawhid-iOS", onLine: false },
  URLSearchParams, MutationObserver: MutationObserverMock,
  requestAnimationFrame(fn) { frames.push(fn); },
  setTimeout() {},
  console,
  localStorage: { getItem() { return null; } }
}, { timeout: 1500 });
function flush() {
  let limit = 10;
  while (frames.length && limit--) {
    const batch = frames.splice(0, frames.length);
    for (const fn of batch) fn();
  }
  assert.ok(limit > 0, "unexpected recurring frame work");
}
flush();
assert.equal(observers.length, 3, "boot must not register four document-wide observers");
const before = scans;
const clockTextChange = [{ type: "childList", addedNodes: [{ nodeType: 3 }], removedNodes: [] }];
for (const observer of observers) observer.callback(clockTextChange);
flush();
assert.equal(scans, before, "clock text mutations must not re-scan the document");
function added(classFragment) {
  return [{ type: "childList", addedNodes: [{
    nodeType: 1,
    matches(selector) { return selector.includes(classFragment); },
    querySelector() { return null; }
  }] }];
}
const chip = observers.find(o => o.node === app && o.options.subtree === true);
const feed = observers.find(o => o.node === app && !o.options.subtree);
const homeMore = observers.find(o => o.node === body);
assert.ok(chip && feed && homeMore, "all observers should be scoped");
chip.callback(added("chip"));
flush();
assert.ok(scans > before, "new chip nodes should still be pruned");
const beforeHomeMore = scans;
homeMore.callback(added("home-more-section"));
flush();
assert.ok(scans > beforeHomeMore, "new unsupported Home sections should still be removed");
location.hash = "#feed";
const beforeFeed = scans;
feed.callback(added(".view-head"));
flush();
assert.ok(scans > beforeFeed, "feed duplicate-header check should still work");

assert.match(home, /resume&&resume\.textContent!==name/, "Home must not rewrite unchanged Qurʾān text");
assert.match(home, /target\.childNodes\.length\)target\.replaceChildren\(\)/, "Friday mirror should not write empty state repeatedly");
assert.match(home, /observe\(top,\{subtree:false,childList:true\}\)/, "prayer clock text must not cause continuous Home sync");
assert.ok(motion.includes("var stepped=Math.round(progress*100)/100"), "scroll paint progress must be coalesced");
const routerSource = fs.readFileSync(path.join(root, "cloudflare/site-router.js"), "utf8");
assert.ok(routerSource.includes("/assets/dar-home-test-parity-visitor.js?v=20261111-home-performance-v1"), "fresh Home asset revision missing");
assert.ok(routerSource.includes("/assets/adult-hero-height-runtime-v1403.js?v=visitor-hero-safearea-v1404-20261111-scroll-performance-v1"), "fresh Hero scroll asset revision missing");
console.log("ADULT HOME MUTATION JANK: OK");
