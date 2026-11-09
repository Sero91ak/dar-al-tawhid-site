#!/usr/bin/env node
"use strict";
/* DAR GLOBAL HERODOCK V2 — immutable architecture and surface scoping gate. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const js=read("assets/dar-global-herodock-v2.js");
const css=read("assets/dar-global-herodock-v2.css");
const visitor=read("cloudflare/site-router.js");
const test=read("cloudflare/test-app-worker.js");
const docs=read("docs/adult-responsive-layout-contract.md");
new vm.Script(js,{filename:"assets/dar-global-herodock-v2.js"});
assert.match(js,/DAR_GLOBAL_HERODOCK_V2_20261109/);
assert.match(css,/DAR_GLOBAL_HERODOCK_V2_20261109/);
assert.match(js,/body\.is-post-route #appView > \.post-reader > \.post-reader-title/);
assert.match(js,/body\.is-hadith-route #appView \.hadith-hub > \.view-head/);
assert.match(js,/data-dar-herodock="photo"/,"Future opt-in missing");
assert.match(js,/is-frauen-route/,"Frauen V1416 must be separate");
assert.match(js,/darFrauenHeroDockV1416/,"Frauen original photo must not be stolen");
assert.match(js,/el\.style\.setProperty\(key, value, "important"\)/);
assert.match(js,/new ResizeObserver\(schedule\)/);
assert.match(js,/spacer\.className = spacers/);
assert.match(js,/item\.parent\.insertBefore\(spacer, hero\)/);
const executable = js.replace(/\/\*[\s\S]*?\*\//g,"").replace(/^\s*\/\/[^\n]*$/gm,"");
assert.doesNotMatch(executable,/appendChild\(hero\)|cloneNode\(|new\s+Image\(|addEventListener\(["'](?:scroll|touchmove)["']|preventDefault\(|\.scrollTo\(|100vw/,
 "No duplicate hero, event rebinding, native touch interception or viewport breakout");
assert.match(js,/dar-fold-v2-active/,"Split reader geometry");
assert.match(js,/--dar-adult-header-obscured-top/,"Reuse global measured header");
assert.match(css,/\[data-dar-global-herodock="v2"\]/);
assert.match(css,/\.dar-global-herodock-spacer/);
const cssExecutable=css.replace(/\/\*[\s\S]*?\*\//g,"");
assert.doesNotMatch(cssExecutable,/100vw|scroll-behavior:smooth|overflow-y:hidden!important/);
assert.equal((visitor.match(/injectAdultGlobalHeroDockV2\(html\);/g)||[]).length,3,
 "PWA, iOS native and Test fallback must load the same Dock; not desktop");
assert.match(visitor,/function injectAdultGlobalHeroDockV2\(html\)/);
assert.match(visitor,/addStyleWithoutMovingDoctype\(html, style\)/,
 "Never inject CSS before HTML5 doctype");
assert.match(visitor,/\/assets\/dar-global-herodock-v2\.js\?v=20261109-photo-dock-v2/);
assert.match(test,/\/assets\/dar-global-herodock-v2\.js\?v=20261109-photo-dock-v2/);
assert.match(docs,/Global HeroDock V2/,"Future global design rule absent");
assert.ok(fs.existsSync("scripts/check-global-herodock-v2.cjs"));
console.log("PASS global HeroDock V2: one in-situ original Hero owner; no Frauen/desktop/Kids or scroll interception.");
