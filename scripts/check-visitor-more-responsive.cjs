#!/usr/bin/env node
"use strict";
/* DĀR Visitor Mehr visual-contract guard: no top cards/toolbar collision. */
const fs=require("node:fs"), assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const quiz=read("assets/dar-visitor-daily-hub-v1.js");
const guide=read("assets/dar-visitor-onboarding-v1.js");
const css=read("assets/dar-visitor-onboarding-v1.css");
const router=read("cloudflare/site-router.js");
const loader=read("assets/dar-home-test-parity-visitor.js");
const ios=read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const more=read("assets/dar-more-final-v15.js");
const legacy=read("assets/dar-more-v15.js");
new Function(quiz); new Function(guide); new Function(loader); new Function(more); new Function(legacy);
assert(!quiz.includes('more.insertAdjacentElement("afterbegin",section)'),"Quiz card illegally prepended above Mehr");
assert(quiz.includes('more.querySelectorAll(".ddh-more-quiz").forEach'),"Stale quiz card not removed");
assert(quiz.includes('function syncCard()'),"Home daily question must stay");
assert(quiz.includes("syncNav(p)"),"Adaptive Frauen/Entdecken tab must stay");
assert(!guide.includes('more.insertAdjacentElement("afterbegin",box)'),"Oversized onboarding card illegally prepended");
assert(guide.includes('view.querySelector(".dm15-shell")||view.querySelector(".dar-more-v15")'),"Modern and legacy Mehr missing");
assert(guide.includes('.dm15-category[data-dm15-category="App"].is-current'),"Onboarding must belong to App tab");
assert(guide.includes('.dm-group[data-dm-group="app"] .dm-grid'),"Legacy App tab missing");
assert(guide.includes("dvo-more-replay--compact"),"Compact tutorial entry missing");
assert(guide.includes('data-dvo-restart="true"'),"Tutorial must remain openable");
assert(css.includes("VISITOR_MORE_RESPONSIVE_V2"),"Responsive Mehr CSS missing");
assert(css.includes(".dvo-more-replay--compact[hidden]{display:none!important}"),"Hidden replay entry not hidden");
assert(css.includes(".dar-more-v15 > .dm-actions"),"Legacy toolbar not repaired");
assert(css.includes("position:static!important"),"Toolbar must not be absolute");
assert(css.includes(".dm15-head .dm15-actions"),"Modern toolbar not repaired");
assert(css.includes("@media(max-width:380px)")&&css.includes("@media(min-width:720px)"),"Phone/tablet sizing not covered");
assert([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0)===0,"Unbalanced CSS");
for(const asset of [
 "dar-visitor-daily-hub-v1.css","dar-visitor-daily-hub-v1.js",
 "dar-visitor-onboarding-v1.css","dar-visitor-onboarding-v1.js"
]){
 const path="/assets/"+asset+"?v=20261030-mehr-responsive-v2";
 assert(router.includes(path),"Cloudflare visitor/Android stale asset "+asset);
 assert(loader.includes(path),"Native/visitor lazy-loader stale asset "+asset);
}
assert(ios.includes("ios-visitor-profile-capsule-20261030"),"Native iOS bridge stale");
console.log("PASS: Mehr starts with title; quiz remains on Home/Wissen; tutorial only in App; 3 actions responsive; caches updated.");
