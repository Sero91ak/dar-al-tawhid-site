#!/usr/bin/env node
"use strict";
/* Adult visitor header regression contract, independent of the Test and Kids shells. */
const fs = require("node:fs");
const assert = require("node:assert/strict");
const read = p => fs.readFileSync(p, "utf8");

const css = read("assets/dar-visitor-profile-picker-v1.css");
const sharedCss = read("assets/dar-adult-brand-header-v2.css");
const visitorPicker = read("assets/dar-visitor-profile-picker-v1.js");
const visitorLoader = read("assets/dar-home-test-parity-visitor.js");
const edgeRouter = read("cloudflare/site-router.js");
const iosWebView = read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const testHeader = read("test/assets/dar-test-premium-header-v2.js");

assert(css.includes("VISITOR_HEADER_SINGLE_ROW_V5"), "Missing visitor-only one-row layout");
assert(!/grid-row\s*:\s*2\s*!important/.test(css), "Legacy second-row visitor rule must not return");
assert(/grid-template-rows\s*:\s*minmax\(44px,auto\)\s*!important/.test(css), "One-row phone grid absent");
assert(/grid-template-columns\s*:\s*54px\s+minmax\(0,1fr\)\s+48px\s+48px/.test(css), "Tablet grid absent");

for(const marker of [
  "#darVisitorProfileButtonV1",
  "grid-column:3!important",
  "grid-column:4!important",
  "grid-row:1!important",
  ".dvp-chooser",
  ".dvp-palette-icon",
  "PROFILE_ICON_SAFE_AREA_V4",
  "VISITOR_PROFILE_CAPSULE_PARITY_V6"
]){
  assert(css.includes(marker), "Missing visitor header/popup contract: "+marker);
}
for(const property of [
 "border:1px solid var(--dtbh-line,rgba(128,91,104,.28))!important;",
 "background:var(--dtbh-btn,rgba(128,91,104,.10))!important;",
 "border-radius:13px!important;",
 "padding:3px!important;"
]){
 assert(css.includes(property),"Capsule parity broken: "+property);
}
assert(css.includes(".dtbh-row > #darVisitorProfileButtonV1")&&css.includes(".dtbh-row > .dtbh-toggle"),"Profile and palette must use same capsule selector");
assert(sharedCss.includes("dar-adult-brand-header-height"), "Header spacer height synchronization removed");
assert(visitorPicker.includes('row.insertBefore(trigger,theme)'), "Profile button order before palette changed");
assert(visitorPicker.includes('row.querySelector(".dtbh-toggle")'), "Original palette handler must be reused");
assert(!visitorPicker.includes("language-classic-v7"), "Visitor must not add language selector");
assert(testHeader.includes('button("Sprache auswählen","language")'), "Test language shortcut was changed");
const pickerURL = "/assets/dar-visitor-profile-picker-v1.css?v=20261030-profile-single-hub-v10";
const dashboardCSS = "/assets/dar-visitor-smart-profile-v1.css?v=20261030-my-dar-dashboard-v11";
const dashboardJS = "/assets/dar-visitor-smart-profile-v1.js?v=20261031-neutral-hooded-v14";
for(const [name,file] of [["Visitor lazy-loader",visitorLoader],["PWA edge response",edgeRouter]]){
 assert(file.includes(pickerURL),name+" does not load approved profile-picker style");
 assert(file.includes(dashboardCSS),name+" does not load current dashboard style");
 assert(file.includes(dashboardJS),name+" does not load current personal dashboard logic");
}
assert(iosWebView.includes("ios-visitor-my-dar-dashboard-20261030"), "Native iOS fallback cache key outdated");
console.log("PASS: adult visitor brand + profile + palette share one row; no Test/Kids or language regression.");
