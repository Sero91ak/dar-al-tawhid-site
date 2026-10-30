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
 assert.match(src,/SMART_PRAYER_COMPACT_TYPOGRAPHY_V3/,lane+" compact typography missing");
 assert.doesNotMatch(src,/SMART_PRAYER_INFORMATION_HIERARCHY_V2/,lane+" unwanted oversized design remains");
 assert.doesNotMatch(src,/var calendarLabels=/,lane+" extra calendar headings remain");
 assert.doesNotMatch(src,/data-calendar-label/,lane+" appended date headings remain");
 const compactStart=src.indexOf("/* SMART_PRAYER_COMPACT_TYPOGRAPHY_V3");
 const compactEnd=src.indexOf("`;",compactStart);
 assert.ok(compactStart>=0&&compactEnd>compactStart,lane+" compact style block missing");
 const colorOnly=src.slice(compactStart,compactEnd);
 assert.doesNotMatch(colorOnly,/^\s*(?:padding(?:-[\w-]+)?|margin(?:-[\w-]+)?|gap|row-gap|column-gap|font-size|line-height|grid-template-columns|grid-template-rows|min-height|height|width|border-radius)\s*:/m,
  lane+" enlarged prayer card / added rows in color-only enhancement");
 assert.match(colorOnly,/\.datp-date-dot\{\s*display:inline!important/,lane+" original calendar separator must remain");

 for(const component of [
  ".datp-item:not(.datp-right) .datp-number",
  ".datp-right .datp-number",
  ".datp-counter{",
  ".datp-now{",
  ".datp-greg{",
  ".datp-hijri{",
  ".datp-date-dot{"
 ])assert.ok(src.includes(component),lane+" color priority missing: "+component);
 assert.match(src,/\.datp-foot\{padding-top:8px;align-items:end\}/,lane+" original single-line date footer required");
 assert.match(src,/\.datp-dates\{display:flex;flex-direction:row;flex-wrap:nowrap/,lane+" date row must stay compact");
 assert.match(src,/\.datp-capsule\{position:relative;display:flex/,lane+" original countdown capsule preserved");
 assert.match(src,/\.datp-number\{display:block;font-size:clamp\(35px,10vw,44px\)/,lane+" preserve font dimensions");
 assert.match(src,/hideCanonicalSource\(hub\)/,"Prayer timing authority must not be removed");
 assert.match(src,/window\.setInterval\(update,1000\)/,"Live countdown must still tick");
 assert.match(src,/card\.dataset\.dhpRoute="prayer"/,"Prayer click navigation must remain");
}
assert.match(siteRouter,/dar-adult-brand-header-v2\.css\?v=20261030-duo-compact-v1/);
assert.match(siteRouter,/dar-home-test-parity-visitor\.js\?v=20261030-prayer-compact-colors-v3/);
assert.match(testWorker,/dar-test-premium-header-v2\.css\?v=20261030-duo-compact-v1/);
assert.match(testWorker,/dar-home-html-parity-v1\.js\?v=20261030-prayer-compact-colors-v3/);
assert.doesNotMatch(visitorHeader,/body\s*\{\s*padding-top:0!important/,"Do not reset body safe area indiscriminately");
console.log("PASS: both adult apps support compact Duo/Fold safe header, compact, differentiated prayer colors with unchanged date/footer layout, and versioned delivery.");
