#!/usr/bin/env node
"use strict";
/* Adult foldable header & prayer visual contract. Does not alter prayer engine. */
const fs=require("node:fs"), vm=require("node:vm"), assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const visitorHeader=read("assets/dar-adult-brand-header-v2.css");
const testHeader=read("test/assets/dar-test-premium-header-v2.css");
const visitorHome=read("assets/dar-home-test-parity-visitor.js");
const testHome=read("test/assets/dar-home-html-parity-v1.js");
const siteRouter=read("cloudflare/site-router.js");
const testWorker=read("cloudflare/test-app-worker.js");
const native=read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
for(const [file,src] of [
 ["assets/dar-home-test-parity-visitor.js",visitorHome],
 ["test/assets/dar-home-html-parity-v1.js",testHome]
])new vm.Script(src,{filename:file});
assert.match(visitorHeader,/ADULT_DUO_FOLD_COMPACT_RAIL_V1/);
assert.match(testHeader,/TEST_DUO_FOLD_COMPACT_RAIL_V1/);
assert.match(visitorHeader,/padding-top:0!important/,"Remove duplicate native body padding only when visitor brand active");
assert.match(visitorHeader,/dar-ios-native-app\.dar-adult-global-brand-ready/);
assert.match(visitorHeader,/@media \(min-width:520px\) and \(max-height:920px\) and \(orientation:landscape\)/);
assert.match(testHeader,/@media\(min-width:520px\) and \(max-height:920px\) and \(orientation:landscape\)/);
assert.match(visitorHeader,/@media \(horizontal-viewport-segments:2\)/);
assert.match(visitorHeader,/safe-area-inset-right/);
assert.match(testHeader,/safe-area-inset-right/);
assert.match(visitorHeader,/min-height:44px!important/);
assert.match(testHeader,/min-height:44px!important/);
assert.match(native,/resolvedSafeAreaInsets\(for: webView\)/,"Native safe inset bridge must remain");
for(const [lane,src] of [["visitor",visitorHome],["test",testHome]]){
 assert.match(src,/SMART_PRAYER_INFORMATION_HIERARCHY_V2/,lane+" prayer hierarchy absent");
 assert.match(src,/\.datp-item:not\(\.datp-right\) \.datp-number/);
 assert.match(src,/\.datp-right \.datp-number/);
 assert.match(src,/\.datp-counter\{/);
 assert.match(src,/\.datp-now\{/);
 assert.match(src,/\.datp-dates\{/);
 assert.match(src,/content:attr\(data-calendar-label\)/);
 assert.match(src,/var calendarLabels=/);
 assert.match(src,/setAttribute\("data-calendar-label",calendarNames\[0\]\)/);
 assert.match(src,/setAttribute\("data-calendar-label",calendarNames\[1\]\)/);
 assert.match(src,/hideCanonicalSource\(hub\)/,"Prayer timing authority must not be removed");
 assert.match(src,/window\.setInterval\(update,1000\)/,"Live countdown must still tick");
 assert.match(src,/card\.dataset\.dhpRoute="prayer"/,"Prayer click navigation must remain");
}
assert.match(siteRouter,/dar-adult-brand-header-v2\.css\?v=20261030-duo-compact-v1/);
assert.match(siteRouter,/dar-home-test-parity-visitor\.js\?v=20261030-prayer-hierarchy-v2/);
assert.match(testWorker,/dar-test-premium-header-v2\.css\?v=20261030-duo-compact-v1/);
assert.match(testWorker,/dar-home-html-parity-v1\.js\?v=20261030-prayer-hierarchy-v2/);
assert.doesNotMatch(visitorHeader,/body\s*\{\s*padding-top:0!important/,"Do not reset body safe area indiscriminately");
console.log("PASS: both adult apps support compact Duo/Fold safe header, separate live prayer/calendar hierarchy, and versioned delivery.");
