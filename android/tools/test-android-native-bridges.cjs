#!/usr/bin/env node
"use strict";
// Tests the actual JavaScript inside the Android Kotlin WebView bridge.
// Never uses a production API, a device ID, OneSignal, or a network request.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const main = fs.readFileSync(
  path.resolve(__dirname, "../app/src/main/java/de/daraltawhid/app/MainActivity.kt"),
  "utf8"
);
const snippets = [...main.matchAll(/window\.webkit\.messageHandlers\.darAppIcon=\{[\s\S]*?\n\s+\};/g)].map(m => m[0]);
assert.equal(snippets.length, 2, "Both early and late Android bridges must exist");

for (const [index, snippet] of snippets.entries()) {
  function clickTest(request, tapped, expired = false) {
    const changes = [];
    const now = Date.now();
    const window = {
      webkit: { messageHandlers: {} },
      __darAndroidIconClick: tapped ? { id: tapped, time: now - (expired ? 3000 : 100) } : null,
      __darAndroidRefreshUi() {}
    };
    const ctx = vm.createContext({ window, DarNative: { setAppIcon(id) { changes.push(id); } }, Date });
    vm.runInContext(snippet, ctx, { timeout: 1000 });
    window.webkit.messageHandlers.darAppIcon.postMessage(request);
    return changes;
  }
  assert.deepEqual(clickTest({ name: "AppIconTypeCreme" }, "type-creme"), ["type-creme"],
    "iOS-style name should select actual Android clicked icon");
  assert.deepEqual(clickTest({ id: "emblem-nachtblau" }, "emblem-nachtblau"),
    ["emblem-nachtblau"]);
  assert.deepEqual(clickTest({ name: "AppIconTypeNavyAr" }, "type-navy-ar"),
    ["type-navy-ar"]);
  assert.deepEqual(clickTest({ name: "AppIconTypeCreme" }, "type-navy"), [],
    "Mismatched payload must not switch icon");
  assert.deepEqual(clickTest({ id: "type-creme" }, "type-creme", true), [],
    "Stale click must not change app icon");
  assert.deepEqual(clickTest({ id: "type-creme" }, null), [],
    "No actual click must not trigger native icon switch");
  console.log("bridge " + (index + 1) + ": real tap, iOS name, Android id and safety tests passed");
}
assert.match(main, /registerForActivityResult\(\s*ActivityResultContracts\.RequestMultiplePermissions\(\)/,
  "Missing Android runtime location permission");
assert.match(main, /onGeolocationPermissionsShowPrompt/,
  "Missing location permission handoff to WebView");
assert.match(main, /request\?\.deny\(\)/,
  "Unscoped WebView media permissions must not be granted");
console.log("ANDROID_NATIVE_BRIDGE_TEST OK");
