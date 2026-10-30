#!/usr/bin/env node
"use strict";
/* NATIVE_HERO_TOP_SEAM_V2: fixed Header consumes exactly one native safe-top,
   while unchanged original Hero begins flush with its in-flow Header spacer.
   This checks Test + visitor without editing a Hero image or navigation. */
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const visitor=read("assets/dar-adult-brand-header-v2.css");
const test=read("test/assets/dar-test-premium-header-v2.css");
const visitorJs=read("assets/dar-adult-brand-header-v2.js");
const worker=read("cloudflare/test-app-worker.js");
const router=read("cloudflare/site-router.js");
const ios=read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const edge=read("assets/dar-adult-top-scroll-boundary-v1.js");
const edgeTest=read("test/assets/dar-adult-top-scroll-boundary-v1.js");
new vm.Script(visitorJs);
new vm.Script(edge);
assert.equal(edge,edgeTest,"No scroll stop drift between Test and visitor");
assert.match(visitor,/NATIVE_HERO_TOP_SEAM_V2/);
assert.match(test,/TEST_NATIVE_HERO_TOP_SEAM_V2/);
for(const [lane,css] of [["visitor",visitor],["Test",test]]){
 assert.match(css,/body\.dar-ios-native-app\.has-bottom-nav:not\(\.is-feed-fullscreen\)\s*\{\s*padding-top:0!important/,
 lane+" native body must drop DUPLICATE inset when brand spacer is active");
 assert.match(css,/#appView\.view\s*\{\s*margin-top:0!important/);
 assert.doesNotMatch(css,/NATIVE_HERO_TOP_SEAM_V2[\s\S]*?(?:\.frauen-library-hero|\.dar-hero\s*\{)[^}]*?(?:height:|background-image:|background-size:|background-position:)/,
  lane+" seam must never resize, crop or replace a Hero");
 assert.equal([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,lane+" CSS brace balance");
}
assert.match(visitorJs,/darAdultBrandHeaderSpacerV2/);
assert.match(visitor,/#darAdultBrandHeaderSpacerV2\{[^}]*height:var\(--dar-adult-brand-header-height/);
assert.match(ios,/root\.classList\.add\("dar-ios-native-app"\)/);
assert.match(ios,/body\.classList\.add\("dar-ios-native-app"\)/);
assert.match(router,/dar-adult-brand-header-v2\.css\?v=20261030-hero-top-seam-v2/);
assert.match(worker,/dar-test-premium-header-v2\.css\?v=20261030-hero-top-seam-v2/);
assert.match(edge,/DAR_ADULT_TOP_SCROLL_BOUNDARY_V4/);
assert.match(edge,/event\.preventDefault\(\)/);
console.log("PASS: Header native spacer is unique, Hero artwork untouched, Test/visitor aligned and first-touch stop preserved.");
