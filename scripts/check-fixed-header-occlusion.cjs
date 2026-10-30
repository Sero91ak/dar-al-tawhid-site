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
assert.match(visitorCss,/GLOBAL_ADULT_STICKY_CLEARANCE_V1/);
assert.match(testCss,/GLOBAL_ADULT_STICKY_CLEARANCE_V1/);
for(const [name,css] of [["visitor",visitorCss],["test",testCss]]){
 for(const marker of [
  ".is-frauen-route #appView .dar-immersive-hero-stage",
  ".is-topics-route #appView .topics-hub > .view-head",
  ".is-topic-route #appView .topic-collection-page > .view-head",
  ".is-post-route #appView .post-reader > .post-reader-title",
  ".is-hadith-route #appView .hadith-hub > .view-head",
  ".is-dua-route #appView .dua-hub > .view-head",
  ".is-settings-route #appView.view > .view-head.settings-page-head",
  '[data-hero-scroll="sticky"] > .dar-hero-stage',
  "--dar-immersive-hero-height"
 ])assert(css.includes(marker),name+" missing sticky clearance "+marker);
}
assert.match(testCss,/#appView \.ilm-chat-header\{[\s\S]*?top:var\(--dar-test-occlusion-top/);
assert.match(testCss,/\.ilm-message-list\{[\s\S]*?scroll-padding-top/);
assert.doesNotMatch(majlisJs,/\.ilm-chat-header\{position:sticky!important;top:0!important/,"Late override may not reset to top zero");
assert.match(majlisJs,/top:var\(--dar-test-occlusion-top/);
assert.doesNotMatch(majlisJs,/last\.getBoundingClientRect\(\)\.top - 110/,"Hardcoded scroll offset caused clipped questions");
assert.match(majlisJs,/var globalBottom=globalHeader\?/);
assert.match(router,/dar-adult-brand-header-v2\.css\?v=20261030-duo-compact-v1/);
assert.match(router,/dar-adult-brand-header-v2\.js\?v=20261030-fixed-occlusion-v1/);
assert.doesNotMatch(testCss,/body\s*\{\s*padding-top:/,"No blanket body padding");
console.log("PASS: visitor/Test header measured; Majlis sticky+scroll clear it; desktop/mobile assets current; no duplicate body spacer.");
