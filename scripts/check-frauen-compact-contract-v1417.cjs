#!/usr/bin/env node
"use strict";
/* FRAUEN_COMPACT_EDITORIAL_V1417_CONTRACT: CSS-only component styling. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const css=read("assets/frauen/frauen-compact-editorial-v1417.css");
const rules=css.replace(/\/\*[\s\S]*?\*\//g,"").replace(/@media\s*\([^)]*\)/g,"");
const prod=read("cloudflare/site-router.js");
const test=read("cloudflare/test-app-worker.js");
assert.match(css,/FRAUEN COMPACT EDITORIAL V1417/);
assert.match(css,/#darFrauenHeroDockV1416 > \.frauen-library-hero/);
assert.match(css,/#appView \.frauen-library-card\.has-visual/);
assert.match(css,/#appView \.frauen-library-area-card\.has-visual/);
assert.match(css,/min-height:48px!important/);
assert.match(css,/font-size:max\(16px,1rem\)!important/);
assert.match(css,/min-height:max-content!important/);
assert.match(css,/-webkit-line-clamp:unset!important/);
assert.doesNotMatch(rules,/(?:background-image|background-size|background-position)\s*:/i,
  "Must preserve exact original photo URL, zoom and placement");
assert.doesNotMatch(rules,/transform\s*:|position\s*:\s*fixed|position\s*:\s*sticky|overflow-y\s*:/,
  "Must not own geometry, scroll or fixed docking");
assert.doesNotMatch(rules,/(?:overflow\s*:\s*hidden|display\s*:\s*none|visibility\s*:\s*hidden|line-clamp\s*:\s*[1-9]|max-height\s*:\s*[0-9]+px)/i,
  "Card text may never be clipped to simulate compactness");
assert.doesNotMatch(rules,/100vw|preventDefault|touchmove|addEventListener|body\.style|filter\s*:|backdrop-filter\s*:/i,
  "Never affect V1416 runtime, image effects or native touch");
assert.equal((prod.match(/injectFrauenCompactEditorialV1417\(html\);/g)||[]).length,3,
  "CSS must reach native iOS, PWA and Test fallback only");
assert.match(prod,/function injectFrauenCompactEditorialV1417\(html\)/);
assert.match(test,/id="darFrauenCompactEditorialV1417"/);
for(const file of ["assets/frauen/frauen-fiqh.js","assets/frauen/frauen-live-adapter.js"]){
 const original=read(file);
 assert.match(original,/Frauen|frauen/i);
}
let brackets=0;
for(const c of rules){if(c==="{")brackets++;if(c==="}")brackets--;assert.ok(brackets>=0)}
assert.equal(brackets,0,"CSS braces unbalanced");
console.log("PASS: V1417 isolated CSS-only compact editor; no photo/layout/scroll/text regressions.");
