#!/usr/bin/env node
"use strict";
/* Regression contract for DĀR adult visitor + /test/, all shared viewports.
   Guard layout layers, not the reading contents, prayer or push subsystems. */
const fs=require("node:fs");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const load=p=>fs.readFileSync(p,"utf8");
const visitorJs=load("assets/dar-adult-brand-header-v2.js");
const visitorCss=load("assets/dar-adult-brand-header-v2.css");
const testJs=load("test/assets/dar-test-premium-header-v2.js");
const testCss=load("test/assets/dar-test-premium-header-v2.css");
const majlisJs=load("test/assets/ilm-research-chat.js");
const router=load("cloudflare/site-router.js");
for(const [path,js] of [
 ["assets/dar-adult-brand-header-v2.js",visitorJs],
 ["test/assets/dar-test-premium-header-v2.js",testJs],
 ["test/assets/ilm-research-chat.js",majlisJs]
])new vm.Script(js,{filename:path});
for(const [name,css] of [["visitor",visitorCss],["test",testCss]]){
 const braces=[...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0);
 assert.equal(braces,0,name+" CSS braces unbalanced");
}
assert.match(visitorJs,/FIXED_HEADER_OCCLUSION_V1/);
assert.match(visitorJs,/--dar-adult-header-obscured-top/);
assert.match(visitorJs,/getBoundingClientRect\(\)/);
assert.match(visitorJs,/ResizeObserver/);
assert.match(visitorJs,/darAdultBrandHeaderSpacerV2/,"Keep the original in-flow spacer");
assert.match(visitorCss,/DAR_FIXED_HEADER_OCCLUSION_V1/);
assert.match(visitorCss,/scroll-padding-top:calc\(var\(--dar-adult-header-obscured-top/);
assert.match(visitorCss,/\.ilm-chat-header\{[\s\S]*?top:var\(--dar-adult-header-obscured-top/);
assert.match(testJs,/TEST_HEADER_OCCLUSION_V1/);
assert.match(testJs,/--dar-test-occlusion-top/);
assert.match(testJs,/visualViewport/);
assert.match(testCss,/TEST_HEADER_OCCLUSION_LAYOUT_V1/);
/* A previous global sticky rule shifted first-frame photographic Heroes
   and detached the Frauen search. Only the Majlis scroll-anchor protection
   stays in the brand CSS; specialist Hero modules own their layout. */
for(const [name,css] of [["visitor",visitorCss],["test",testCss]]){
 assert.doesNotMatch(css,/GLOBAL_ADULT_STICKY_CLEARANCE_V1/,name+" reintroduced broad sticky override");
 assert.doesNotMatch(css,/GLOBAL_HERO_ROUTE_TOP_SEAM_V3/,name+" reintroduced broad app/hero shift");
 assert.doesNotMatch(css,/FRAUEN_DIRECT_STICKY_FALLBACK_V6/,name+" reintroduced pre-wrapper shift");
}
const originalHero=load("assets/adult-immersive-hero-v1.css");
assert.match(originalHero,/\.dar-immersive-hero-stage\{/,"Existing Frauen Hero owns sticky");
assert.match(originalHero,/\.dar-immersive-hero-stage > :is\(\.frauen-library-search-wrap/,"Search must remain owned by single stage");
assert.match(testCss,/#appView \.ilm-chat-header\{[\s\S]*?top:var\(--dar-test-occlusion-top/);
assert.match(testCss,/\.ilm-message-list\{[\s\S]*?scroll-padding-top/);
assert.doesNotMatch(majlisJs,/\.ilm-chat-header\{position:sticky!important;top:0!important/,"Late override may not reset to top zero");
assert.match(majlisJs,/top:var\(--dar-test-occlusion-top/);
assert.doesNotMatch(majlisJs,/last\.getBoundingClientRect\(\)\.top - 110/,"Hardcoded scroll offset caused clipped questions");
assert.match(majlisJs,/var globalBottom=globalHeader\?/);
assert.match(router,/dar-adult-brand-header-v2\.css\?v=20261030-restore-original-hero-rail-v5/);
assert.match(router,/dar-adult-brand-header-v2\.js\?v=20261030-fixed-occlusion-v1/);
assert.doesNotMatch(testCss,/body\s*\{\s*padding-top:/,"No blanket body padding");
console.log("PASS: brand header preserves original Hero/search authority; Majlis independently retains scroll clearance.");
