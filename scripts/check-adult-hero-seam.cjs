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
/* Regression: do not reintroduce broad native padding/relative-Hero
   overrides that detached the original Women Hero and search. */
for(const [lane,css] of [["visitor",visitor],["Test",test]]){
 assert.doesNotMatch(css,/GLOBAL_ADULT_STICKY_CLEARANCE_V1/,lane+" broad sticky override restored");
 assert.doesNotMatch(css,/GLOBAL_HERO_ROUTE_TOP_SEAM_V3/,lane+" blanket layout reset restored");
 assert.doesNotMatch(css,/NATIVE_HERO_TOP_SEAM_V2|TEST_NATIVE_HERO_TOP_SEAM_V2/,lane+" duplicate native patch restored");
 assert.equal([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,lane+" CSS brace balance");
}
const original=read("assets/adult-immersive-hero-v1.css");
assert.match(original,/\.dar-immersive-hero-stage > \.frauen-library-hero/,"Original photo must stay within one stage");
assert.match(original,/\.dar-immersive-hero-stage > :is\(\.frauen-library-search-wrap/,"Original search must stay inside same stage");
const nativeResponsive=read("assets/adult-responsive-viewport-v1381.css");
assert.match(nativeResponsive,/DAR_VISITOR_IOS_HERO_EDGE_SEARCH_V1404/,"Preserve original native photo-safe-area contract");
assert.match(visitorJs,/darAdultBrandHeaderSpacerV2/);
assert.match(visitor,/#darAdultBrandHeaderSpacerV2\{[^}]*height:var\(--dar-adult-brand-header-height/);
assert.match(ios,/root\.classList\.add\("dar-ios-native-app"\)/);
assert.match(ios,/body\.classList\.add\("dar-ios-native-app"\)/);
assert.match(router,/dar-adult-brand-header-v2\.css\?v=20261030-restore-original-hero-rail-v5/);
assert.match(worker,/dar-test-premium-header-v2\.css\?v=20261030-restore-original-hero-rail-v5/);
assert.match(edge,/DAR_ADULT_TOP_SCROLL_BOUNDARY_V4/);
assert.match(edge,/event\.preventDefault\(\)/);
console.log("PASS: original Hero/photo/search ownership preserved; no layered global sticky/safe-area overrides.");
