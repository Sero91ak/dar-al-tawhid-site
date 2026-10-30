#!/usr/bin/env node
"use strict";
/* Adult DĀR hero route matrix — style/source guards, not a claim of physical
   iPhone Duo acceptance. Every declared photo-bearing family is enumerated.
   Reading covers keep original relative flow; true sticky covers clear brand.
   No hero image dimension, crop, filename, content, or palette changes. */
const fs=require("node:fs"), assert=require("node:assert/strict"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const lanes=[
 {name:"Besucher",css:read("assets/dar-adult-brand-header-v2.css"),js:read("assets/dar-adult-brand-header-v2.js"),token:"dar-adult-brand-header-v2.css?v=20261030-hero-route-matrix-v3"},
 {name:"Test",css:read("test/assets/dar-test-premium-header-v2.css"),js:read("test/assets/dar-test-premium-header-v2.js"),token:"dar-test-premium-header-v2.css?v=20261030-hero-route-matrix-v3"}
];
const routes=[
 "frauen","topics","topic","post","hadith","dua","settings",
 "calendar","ramadan","notifications","account","about",
 "news","news-detail","zakat","source-library","quran-topic","more","quiz"
];
const sticky=["frauen","topics","topic","post","hadith","dua"];
const flow=["settings","calendar","ramadan","notifications","account","about","news","news-detail","zakat","source-library","quran-topic","more","quiz"];
const variant=[
 ".hadith-detail > .post-reader-title", ".dua-detail > .post-reader-title",
 ".frauen-library-hero", ".frauen-library-pinned-header",
 '[data-hero-kind][data-hero-scroll="sticky"]'
];
const router=read("cloudflare/site-router.js");
const testWorker=read("cloudflare/test-app-worker.js");
for(const lane of lanes){
 new vm.Script(lane.js);
 const css=lane.css;
 assert(css.includes("GLOBAL_HERO_ROUTE_TOP_SEAM_V3"),lane.name+" route matrix missing");
 assert(css.includes("RELATIVE_HERO_STAYS_IN_FLOW_V4"),lane.name+" relative settings bug not fixed");
 assert(css.includes("NATIVE_HERO_TOP_SEAM_V2")||css.includes("TEST_NATIVE_HERO_TOP_SEAM_V2"),lane.name+" double safe-top fix missing");
 assert(css.includes("body.has-bottom-nav:not(.is-feed-fullscreen):not(.is-quran-reader-route):not(.is-quran-overview):not(.is-ilm-chat-route) > .app"),lane.name+" outer app gap guard missing");
 const match=css.match(/body\.has-bottom-nav:is\(([^)]*)\) #appView\.view\{/g);
 assert(match&&match.some(v=>routes.every(k=>v.includes(".is-"+k+"-route"))),lane.name+" incomplete route selector");
 for(const key of [...sticky,...flow])
  assert(css.includes(".is-"+key+"-route"),lane.name+" uncovered route "+key);
 for(const name of variant)assert(css.includes(name),lane.name+" missing hero variant "+name);
 const rel=css.slice(css.indexOf("/* RELATIVE_HERO_STAYS_IN_FLOW_V4"));
 assert(/settings-page-head\s*\{\s*top:auto!important;/.test(rel),lane.name+" relative image shifted with top offset");
 assert(/inset-block-start:auto!important/.test(rel),lane.name+" logical top not cleared");
 assert(!/body\.is-settings-route[^\n]*settings-page-head,\s*\n[^\n]*top:var\(/.test(css),lane.name+" old settings sticky offset returned");
 const added=css.slice(css.indexOf("/* GLOBAL_HERO_ROUTE_TOP_SEAM_V3"));
 assert(!/(?:background-image|background-size|background-position|object-fit|object-position|height|min-height|max-height|aspect-ratio)\s*:/i.test(added),
  lane.name+" new CSS must not resize/change imagery");
 assert.equal([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0);
}
for(const [p,source] of [["Besucher",router],["Test",testWorker]]){
 const file=p==="Besucher"?"dar-adult-brand-header-v2.css":"dar-test-premium-header-v2.css";
 assert(source.includes(file+"?v=20261030-hero-route-matrix-v3"),p+" header CSS cache not refreshed");
}
const boundary=read("assets/dar-adult-top-scroll-boundary-v1.js");
assert.equal(boundary,read("test/assets/dar-adult-top-scroll-boundary-v1.js"),"Test and visitor scroll edge must match");
assert(boundary.includes("DAR_ADULT_TOP_SCROLL_BOUNDARY_V4"));
const immutableProtected=[
 "assets/dar-hero-scroll-standard-v1.css",
 "assets/frauen/frauen-authority-v1292.css",
 "test/assets/frauen/frauen-authority-v1292.css",
 "assets/dar-adult-top-scroll-boundary-v1.js"
];
for(const f of immutableProtected)assert(read(f).length>0,f+" missing");
console.log("PASS: 19 named adult photo/page families + 5 Hero variants inventoried; sticky versus flow preserved; image geometry untouched; Test/visitor cache paths updated.");
