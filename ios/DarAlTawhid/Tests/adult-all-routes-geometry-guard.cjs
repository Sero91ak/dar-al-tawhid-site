#!/usr/bin/env node
"use strict";
/* Adult visitor all-route adaptive contract. No network, no credentials,
   no Kids or native push changes. Called from adult touch-navigation CI. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../../..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const css = read("assets/adaptive-layout.css");
const adaptive = read("assets/adaptive-layout.js");
const routeInventory = read("test/assets/test-global-edge-width-v1372.css");
const marker = "DAR_ADULT_ALL_ROUTES_FLUID_V1";
assert.equal(css.split(marker).length, 2, "Exactly one shared fluid route geometry layer");
const block = css.split(marker)[1];
const routes = [
  "is-home-route", "is-topics-route", "is-topic-route", "is-post-route",
  "is-quran-overview", "is-quran-reader-route", "is-quran-topic-route",
  "is-hadith-route", "is-dua-route", "is-frauen-route", "is-quiz-route",
  "is-more-route", "is-settings-route", "is-notifications-route",
  "is-account-route", "is-about-route", "is-news-route",
  "is-news-detail-route", "is-calendar-route", "is-zakat-route",
  "is-ramadan-route", "is-source-library-route"
];
for (const route of routes) {
  assert.ok(routeInventory.includes("." + route), "Unaccounted adult route " + route);
}
const shellClasses = [
  ".home-v380-shell", ".topics-hub", ".topic-collection-page",
  ".post-reader", ".qov-page", ".qrc-shell", ".quran-topic-page",
  ".hadith-hub", ".dua-hub", ".frauen-page", ".quiz-shell",
  ".more-page", ".settings-page", ".notification-center-page",
  ".account-page", ".about-page", ".source-library-page",
  ".lib-page", ".dar-fold", ".dar-fold__rail", ".dar-fold__pane"
];
for (const cls of shellClasses) {
  assert.ok(block.includes(cls), "Missing adaptive family shell " + cls);
}
assert.match(block, /body\.has-bottom-nav #appView\.view/);
assert.match(block, /min-inline-size:\s*0/);
assert.match(block, /max-inline-size:\s*100%/);
assert.match(block, /max-width:\s*599\.98px/);
assert.match(block, /min-width:\s*600px/);
assert.match(block, /max-height:\s*559\.98px/);
assert.match(block, /env\(safe-area-inset-left/);
assert.match(block, /env\(safe-area-inset-right/);
assert.match(block, /env\(safe-area-inset-top/);
assert.match(block, /env\(safe-area-inset-bottom/);
assert.match(block, /grid-template-columns:\s*repeat\(auto-fit/);
assert.match(block, /\[role="dialog"\]/);
assert.match(block, /prefers-reduced-motion/);
assert.doesNotMatch(block, /(?:display:\s*none\s*!important|visibility:\s*hidden\s*!important)/i,
  "Do not hide a route to hide overflow");
assert.doesNotMatch(block, /(?:overflow-x:\s*(?:hidden|clip)\s*!important)/i,
  "Do not conceal unadapted content");
assert.doesNotMatch(block, /(?:position:\s*fixed|touch-action:\s*none|pointer-events:\s*none)/i,
  "Do not alter touch, fixed surfaces or audio players");
assert.match(adaptive, /function resolveLayoutMode\(width, height\)/);
assert.match(adaptive, /function computeLayoutCapacity\(width, height\)/);
let braces = 0;
for (const char of block) {
  if (char === "{") braces++;
  else if (char === "}") braces--;
  assert.ok(braces >= 0, "Unexpected closing rule");
}
assert.equal(braces, 0, "Incomplete CSS rule");
console.log("OK: " + routes.length + " adult route classes, " +
  shellClasses.length + " family shells, compact/fold/tablet/landscape/safe-area CSS contract");
