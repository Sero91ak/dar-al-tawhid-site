#!/usr/bin/env node
"use strict";
/* Adult iOS WKWebView must use the same adaptive geometry as Android/PWA.
   Layout-only regression guard: no changes to prayer, push or navigation. */
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const native = fs.readFileSync("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift", "utf8");
const web = fs.readFileSync("assets/adaptive-layout.js", "utf8");
const css = fs.readFileSync("assets/adaptive-layout.css", "utf8");

assert.match(native, /DAR_IOS_PWA_ADAPTIVE_PARITY_V1/, "Explicit iOS parity contract missing");
assert.doesNotMatch(native, /root\.setAttribute\(["']data-layout["']\s*,\s*["']compact["']\)/,
  "iOS must not force medium/expanded web layouts back to compact");
assert.match(native, /override func layoutSubviews\(\)/,
  "Native view size changes must refresh the safe-area bridge");
assert.match(native, /lastAppliedSafeInsets: UIEdgeInsets\?/);
for (const edge of ["top", "left", "right", "bottom"]) {
  assert.ok(native.includes("previous." + edge + " - appliedInsets." + edge),
    "Safe-area update must compare " + edge);
}
assert.match(native, /configuration\.userContentController = userContentController/);
assert.match(native, /DarNativePermissions\.shared\.requestLocationIfNeeded\(\)/);
assert.match(native, /DarPrayerLiveActivityController\.refresh\(\)/);

const firstController = web.slice(0, web.indexOf("/* v2026-10-08 · Match"));
assert.ok(firstController.includes("global.DarAdaptiveLayout = api"),
  "Canonical adaptive layout controller is required");
const window = {};
const document = {
  readyState: "loading",
  addEventListener() {}
};
vm.runInNewContext(firstController, { window, document, console }, { filename: "adaptive-layout.js" });
const adaptive = window.DarAdaptiveLayout;
assert.ok(adaptive);

const cases = [
  [390, 844, "compact", false],    // iPhone portrait / Fold cover
  [512, 870, "compact", false],    // compact cover-like width
  [820, 1180, "medium", false],    // iPad portrait
  [900, 500, "medium", false],     // phone landscape: never desktop dual
  [1024, 768, "expanded", true],   // iPad landscape
  [1194, 834, "expanded", true]    // wide tablet/window
];
for (const [width, height, expectedMode, expectedDual] of cases) {
  assert.equal(adaptive.resolveLayoutMode(width, height), expectedMode,
    "Incorrect layout for " + width + "x" + height);
  assert.equal(adaptive.isDualViewport(width, height), expectedDual,
    "Incorrect dual mode for " + width + "x" + height);
}
assert.match(css, /data-layout-surface="phone-landscape"/);
assert.match(css, /data-layout-surface="workspace"/);
console.log("PASS: iOS no longer forces compact; PWA compact/medium/expanded and safe-area behaviors guarded.");
