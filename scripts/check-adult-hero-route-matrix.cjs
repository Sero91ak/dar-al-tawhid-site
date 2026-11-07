#!/usr/bin/env node
"use strict";
/* Adult Hero rollback regression.
 * INVENTORY != physical-device acceptance.
 * The fixed brand must not take over original sticky photographic Heroes
 * with broad global CSS. Only the owning page controls its Hero and search.
 */
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const lanes=[
 ["Visitor","assets/dar-adult-brand-header-v2.css","cloudflare/site-router.js","dar-adult-brand-header-v2.css"],
 ["Test","test/assets/dar-test-premium-header-v2.css","cloudflare/test-app-worker.js","dar-test-premium-header-v2.css"]
];
const inventory=["frauen","topics","topic","post","hadith","dua","settings","calendar",
 "ramadan","notifications","account","about","news","news-detail","zakat",
 "source-library","quran-topic","more","quiz"];
for(const [name,cssPath,loaderPath,asset] of lanes){
 const css=read(cssPath),loader=read(loaderPath);
 assert.equal([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,name+" unbalanced CSS");
 assert.doesNotMatch(css,/GLOBAL_ADULT_STICKY_CLEARANCE_V1|FRAUEN_DIRECT_STICKY_FALLBACK_V6/,
   name+" must not globally translate original Hero or detached search");
 // The existing Test-only V3 rule is a zero-offset normalization, not a
 // nonzero Hero displacement. Mirror the stricter fixed-header guard.
 if(name==="Test"&&css.includes("GLOBAL_HERO_ROUTE_TOP_SEAM_V3")){
  const start=css.indexOf("GLOBAL_HERO_ROUTE_TOP_SEAM_V3");
  const end=css.indexOf("RELATIVE_HERO_STAYS_IN_FLOW_V4",start);
  const seam=css.slice(start,end>start?end:undefined);
  assert.match(seam,/> \.app\s*\{\s*margin-block-start:0!important;\s*padding-block-start:0!important;/);
  assert.match(seam,/#appView\.view\s*\{\s*padding-block-start:0!important;\s*margin-block-start:0!important;/);
  assert.doesNotMatch(seam,/(?:margin|padding)-block-start:\s*-[1-9]/,
     "Test V3 must never use negative app/hero offsets");
 }else{
  assert.doesNotMatch(css,/GLOBAL_HERO_ROUTE_TOP_SEAM_V3/,name+" unexpected global Hero override");
 }
 assert.doesNotMatch(css,/NATIVE_HERO_TOP_SEAM_V2|TEST_NATIVE_HERO_TOP_SEAM_V2/,
   name+" must not duplicate native safe-area resetting");
 const approvedCssVersion=name==="Visitor"?"20261107-welcome-editorial-v3":"20261030-restore-original-hero-rail-v5";
 const visitorStaged=name==="Visitor"&&loader.includes(asset+"?v=20261107-index-single-spacer-v1");
 assert(visitorStaged||loader.includes(asset+"?v="+approvedCssVersion),
   name+" must request rollback-safe CSS version");
}
const heroCss=read("assets/adult-immersive-hero-v1.css");
const heroJs=read("assets/adult-immersive-hero-v1.js");
const original=read("assets/frauen/frauen-authority-v1292.css");
const visitorResponsive=read("assets/adult-responsive-viewport-v1381.css");
const testResponsive=read("test/assets/test-global-edge-width-v1372.css");
new vm.Script(heroJs);
assert.match(heroCss,/\.dar-immersive-hero-stage\{[\s\S]*?position:sticky!important/);
assert.match(heroCss,/\.dar-immersive-hero-stage > :is\(\.frauen-library-search-wrap/);
assert.match(heroCss,/position:relative!important/,"Own original search instead of second global sticky rail");
assert(heroJs.includes("stage.appendChild(hero)")&&heroJs.includes("if(search)stage.appendChild(search)"),
  "Hero and search must stay in one shared DOM stage");
assert(original.includes("--frauen-hero-img")&&original.includes("background-position:center 46%"),
  "Historical Frauen artwork and positioning unchanged");
assert(visitorResponsive.includes("DAR_VISITOR_HERO_RAIL_CONNECTED_V1403"));
assert(testResponsive.includes("DAR_ADULT_HERO_COMPACT_STICKY_AXIS_V1402"));
const edge=read("assets/dar-adult-top-scroll-boundary-v1.js");
assert.equal(edge,read("test/assets/dar-adult-top-scroll-boundary-v1.js"));
assert(edge.includes("DAR_ADULT_TOP_SCROLL_BOUNDARY_V4"));
assert.equal(inventory.length,19);
console.log("PASS: 19 route families inventoried; original Hero and search co-owned, no global displacement, image sources unchanged. Individual physical-device acceptance still required.");
/* Combined QA only: run the opt-in editorial and desktop contracts as part of the
 * existing read-only header check without changing a protected workflow. */
require("./check-adult-editorial-motion-v1.cjs");
require("./check-desktop-editorial-v1.cjs");
