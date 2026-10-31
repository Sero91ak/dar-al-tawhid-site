#!/usr/bin/env node
"use strict";
/* Adult/Fold/Duo regression: capacity is owned by adaptive-layout.js.
 * No hardware or UI screenshots are simulated by this guard. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const base = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(base, name), "utf8");
const adaptive = read("assets/adaptive-layout.js");
const foldJS = read("assets/fold-split.js");
const foldCSS = read("assets/fold-split.css");
const frontCSS = read("assets/dar-visitor-frontstage-v1.css");
const globalCSS = read("assets/adult-fold-global-v1.css");
new vm.Script(adaptive);
new vm.Script(foldJS);

assert.match(foldCSS, /DAR_FOLD_CAPACITY_AUTHORITY_V1340_20261031/);
assert.match(foldCSS, /html\[data-fold-capacity="single"\]\[data-layout-surface\] body \.dar-fold/);
assert.match(foldCSS, /html\[data-fold-capacity="dual"\]\[data-layout-surface="workspace"\] body \.dar-fold/);
assert.match(frontCSS, /html\[data-dar-visitor-frontstage="1"\]\[data-fold-capacity="single"\] body\.has-bottom-nav \.dar-fold/);
assert.doesNotMatch(frontCSS, /html\[data-dar-visitor-frontstage="1"\] body\.has-bottom-nav \.dar-fold/);
assert.match(globalCSS, /data-fold-capacity="dual"/);
assert.match(globalCSS, /--fold-gap-current/);
assert.match(foldCSS, /--fold-gap-current/);
assert.match(adaptive, /global\.viewport && global\.viewport\.segments/);

const attrs = Object.create(null);
const cssVars = Object.create(null);
const classNames = new Set();
const viewport = { width: 390, height: 844, offsetTop: 0, scale: 1,
  addEventListener() {} };
const root = {
  clientWidth: 390, clientHeight: 844,
  classList: {
    contains(name) { return classNames.has(name); },
    add(name) { classNames.add(name); },
    remove(name) { classNames.delete(name); },
    toggle(name, on) { if (on) classNames.add(name); else classNames.delete(name); }
  },
  style: { setProperty(name,value) { cssVars[name] = value; } },
  getAttribute(name) { return attrs[name] || null; },
  setAttribute(name, value) { attrs[name] = String(value); }
};
const document = {
  readyState: "loading", documentElement: root,
  body: { classList: { contains() { return false; } } },
  addEventListener() {}, getElementById() { return null; },
  querySelectorAll() { return []; }
};
const window = {
  innerWidth: 390, innerHeight: 844,
  visualViewport: viewport,
  viewport: { segments: [] },
  localStorage: { getItem() { return "bottom"; } },
  requestAnimationFrame(cb) { cb(); return 1; },
  addEventListener() {}, dispatchEvent() {}
};
vm.runInNewContext(adaptive, {
  window, document,
  CustomEvent: class { constructor(type, opts) { this.type = type; this.detail = opts.detail; } },
  setTimeout() { return 1; }, clearTimeout() {}
}, { filename: "adaptive-layout.js" });
vm.runInNewContext(foldJS, {
  window, document,
  setTimeout() { return 1; }
}, { filename: "fold-split.js" });
const layout = window.DarAdaptiveLayout;
const fold = window.DarFold;
function resize(width, height, expectedDual, expectedMode) {
  root.clientWidth = window.innerWidth = width;
  root.clientHeight = window.innerHeight = height;
  viewport.width = width; viewport.height = height; viewport.scale = 1;
  layout.apply();
  assert.equal(attrs["data-fold-capacity"], expectedDual ? "dual" : "single",
    "Capacity " + width + "x" + height);
  assert.equal(attrs["data-fold-dual"], expectedDual ? "1" : "0",
    "Fold flag " + width + "x" + height);
  assert.equal(attrs["data-layout"], expectedMode, "Mode " + width + "x" + height);
  assert.equal(fold.isDual(), expectedDual, "Controllers agree " + width + "x" + height);
}
resize(390, 844, false, "compact");         // iPhone / Fold closed
resize(896, 414, false, "medium");          // ordinary landscape phone
resize(834, 1194, false, "medium");         // portrait tablet, insufficient width
resize(1024, 768, true, "expanded");        // tablet landscape / Fold open
resize(1024, 1366, true, "expanded");       // wide tablet portrait
resize(900, 520, false, "medium");          // short window, no two columns
resize(940, 700, true, "expanded");         // real 2-pane capacity

// Modern viewport.segments API: actual Duo/Fold hinge must lie IN THE GAP.
window.viewport.segments = [
  { x:0, y:0, width:500, height:800 },
  { x:524, y:0, width:500, height:800 }
];
resize(1024, 800, true, "expanded");
assert.equal(attrs["data-fold-segments"], "horizontal");
assert.equal(cssVars["--fold-gap-current"], "61px", "24px hinge plus inset and 16px safety clearance");
assert.ok(parseFloat(cssVars["--fold-rail-current"]) > 450,
  "Left master must fill its physical segment, not leak reader over the hinge");
assert.ok(parseFloat(cssVars["--fold-reader-available"]) >= 420,
  "Right reader must have minimum usable physical-segment width");

// A stacked Duo is never a side-by-side master/detail surface.
window.viewport.segments = [
  { x:0, y:0, width:1024, height:500 },
  { x:0, y:520, width:1024, height:500 }
];
resize(1024, 1040, false, "medium");
assert.equal(attrs["data-fold-segments"], "vertical");

// Bad/unavailable segment metadata must fall back to ordinary measured layout.
window.viewport.segments = [
  { x:0, y:0, width:500, height:700 },
  { x:990, y:0, width:500, height:700 }
];
resize(1024, 800, true, "expanded");
assert.equal(attrs["data-fold-segments"], "none");
window.viewport.segments = [];
resize(940, 700, true, "expanded");

viewport.width = 610; viewport.height = 420; viewport.scale = 1;
layout.apply();
assert.equal(attrs["data-fold-dual"], "1",
  "On-screen keyboard must not collapse a viable 940px master/detail window");
assert.equal(classNames.has("adaptive-keyboard-open"), true,
  "Keyboard state still uses the visual viewport");
viewport.width = 620; viewport.height = 450; viewport.scale = 1.4;
layout.apply();
assert.equal(attrs["data-fold-dual"], "1", "Pinch zoom cannot collapse layout capacity");

resize(390, 844, false, "compact");
assert.equal(attrs["data-layout-surface"], "single");

/* The DOM may stay mounted while a device folds. Validate that returning
   from a one-pane layout restores scrollTop of both surviving pane nodes. */
const foldEvents = Object.create(null);
const docEvents = Object.create(null);
const foldFrames = [];
let foldDual = true;
const trackShell = {
  isConnected:true,
  getAttribute(name) { return name === "data-fold-family" ? "quran" : ""; },
  querySelector(name) {
    return name === ".dar-fold__rail" ? trackRail :
      name === ".dar-fold__pane" ? trackPane : null;
  }
};
function scrollPart(name) {
  return {
    scrollTop:0,
    classList:{ contains(value) { return value === name; } },
    closest() { return trackShell; }
  };
}
const trackRail=scrollPart("dar-fold__rail");
const trackPane=scrollPart("dar-fold__pane");
const scrollDoc = {
  readyState:"complete",
  documentElement:{
    classList:{toggle(){}},
    style:{setProperty(){}},
    setAttribute(){}
  },
  body:{},
  addEventListener(type, handler) { docEvents[type]=handler; },
  querySelector() { return trackShell; },
  getElementById() { return null; }
};
const foldWindow = {
  location:{hash:"#/quran/1"},
  DarAdaptiveLayout:{
    measure() { return {width:1024,height:800}; },
    isDual() { return foldDual; },
    isDualViewport() { return foldDual; },
    getLayoutCapacity() { return {rail:320,reader:600}; }
  },
  requestAnimationFrame(fn) { foldFrames.push(fn);return foldFrames.length; },
  cancelAnimationFrame() {},
  addEventListener(type, handler) { foldEvents[type]=handler; }
};
vm.runInNewContext(foldJS,{window:foldWindow,document:scrollDoc,setTimeout(){return 1;}});
function flushFoldFrames() {
  for (let i=0; foldFrames.length && i<12; i++) {
    for (const frame of foldFrames.splice(0)) frame();
  }
  assert.equal(foldFrames.length,0,"Fold restore frames must settle");
}
flushFoldFrames();
trackRail.scrollTop=265;
trackPane.scrollTop=740;
docEvents.scroll({target:trackRail});
docEvents.scroll({target:trackPane});
foldDual=false;
foldEvents["dar:layoutchange"]();
flushFoldFrames();
trackRail.scrollTop=0; trackPane.scrollTop=0; // browser loses scroller on compact
foldDual=true;
foldEvents["dar:layoutchange"]();
flushFoldFrames();
assert.equal(trackRail.scrollTop,265,"Surah list position restored after unfolding");
assert.equal(trackPane.scrollTop,740,"Qur'an reader position restored after unfolding");
assert.equal(foldWindow.DarFold.isDual(),true,"DOM shell never needs replacement");

console.log("OK: adult Fold/Duo measured capacity, hinge and independent scroll retention");
