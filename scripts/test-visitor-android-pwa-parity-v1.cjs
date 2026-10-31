#!/usr/bin/env node
/* Adult visitor parity regression: installed Android PWA shares the same
 * profile dashboard as iOS WebKit and visitor browser. Never touches Kids. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const get=p=>fs.readFileSync(path.join(root,p),"utf8");
const assets=["dar-visitor-smart-profile-v1","dar-visitor-profile-picker-v1","dar-visitor-daily-hub-v1","dar-visitor-onboarding-v1"];
for(const a of assets){
  const src=get("assets/"+a+".js");
  new vm.Script(src,{filename:a+".js"});
  assert.ok(src.includes('location.pathname')||src.includes('location.pathname||'),a+" must scope itself to adult visitor");
  assert.ok(fs.statSync(path.join(root,"assets",a+".css")).size>200);
}
const visitor=get("assets/dar-home-test-parity-visitor.js");
new vm.Script(visitor,{filename:"dar-home-test-parity-visitor.js"});
assert.match(visitor,/darVisitorSmartProfileJsV1/);
assert.match(visitor,/darVisitorDailyHubJsV1/);
assert.match(visitor,/darVisitorOnboardingJsV1/);
const shell=get("cloudflare/site-router.js");
// Site router is an ES module; runtime syntax is checked by the build pipeline.
assert.match(shell,/url\.pathname === "\/pwa\/"/);
assert.match(shell,/activateAdultGlobalBrandV2\(html\)/);
for(const key of [
 "darVisitorSmartProfileJsV1","darVisitorProfilePickerJsV1",
 "darVisitorDailyHubJsV1","darVisitorOnboardingJsV1",
 "darVisitorSmartProfileCssV1","darVisitorProfilePickerCssV1",
 "darVisitorDailyHubCssV1","darVisitorOnboardingCssV1"
])assert.ok(shell.includes(key),"missing Android PWA app module: "+key);
assert.match(shell,/20261030-profile-single-hub-v10/);
assert.match(get("assets/dar-visitor-profile-picker-v1.js"),/data-dvp-quick="hub"/,"One Mein DĀR entry missing");
assert.equal((get("assets/dar-visitor-profile-picker-v1.js").match(/data-dvp-quick="/g)||[]).length,1,"Profile popup should not display four separate shortcuts");
assert.match(shell,/dar-home-test-parity-visitor\.js\?v=20261030-neutral-icon-v12/);
assert.match(shell,/dar-noble-3d-icons\.js\?v=20261030-android-global-parity-v8/);
assert.match(shell,/dar-adult-brand-header-v2\.css\?v=20261030-hero-route-matrix-v4/);
const manifest=JSON.parse(get("manifest.json"));
assert.ok(manifest.start_url.startsWith("/pwa/"));
assert.equal(manifest.scope,"/pwa/");
const sw=get("pwa/service-worker.js");
new vm.Script(sw,{filename:"pwa/service-worker.js"});
assert.match(sw,/CACHE_VERSION=CACHE_PREFIX\+'v3'/,"Never wipe users' existing offline cache");
assert.match(sw,/ADULT_VISITOR_LIVE_UI/);
assert.match(sw,/staticVersionedAsset\(u\)&&!liveLocaleAsset\(u\)&&!isAdultVisitorLiveUiAsset\(u\)/);
assert.match(sw,/fetch\(request,\{cache:'no-store'\}\)/);
assert.match(sw,/cache\.match\(request\)/);
assert.match(sw,/DAR_PWA_VISITOR_SHELL_UPDATED/,"Existing Android app must receive visitor release notification");
assert.match(sw,/X-Dar-PWA-Revision/,"Scoped Android PWA needs a revision-aware shell cache");
assert.match(sw,/new URL\(client\.url\)\.pathname\.startsWith\('\/pwa'\)/,"Updates must never affect browser/Kids clients");
assert.match(shell,/visitor-android-20261030-v10/,"Revision header missing from Android app response");
assert.match(shell,/darPwaReleaseNoticeJsV1/,"Android release notice must load at boot");
assert.match(shell,/darPwaReleaseNoticeCssV1/,"Android release notice styling missing");
const notice=get("assets/dar-pwa-release-notice-v1.js");
new vm.Script(notice,{filename:"dar-pwa-release-notice-v1.js"});
assert.match(notice,/^.*DAR_ANDROID_PWA_RELEASE_NOTICE_V1/m,"Release notice entrypoint missing");
assert.match(notice,/data-dar-pwa-update/,"Refresh must require an explicit user tap");
assert.match(notice,/location\.reload\(\)/,"Refresh action should preserve existing PWA URL");
assert.doesNotMatch(notice,/(?:localStorage|sessionStorage)\.clear\(\)|caches\.delete\(/,"Live update must preserve user profile and offline caches");
assert.ok(fs.statSync(path.join(root,"assets/dar-pwa-release-notice-v1.css")).size>200,"Release notice visual styling absent");
assert.doesNotMatch(sw,/clear\(\)|localStorage\.clear\(\)/);
const navIcons=get("assets/dar-noble-3d-icons.js");
assert.match(navIcons,/topics:"topics\.png"/);
for(const asset of ["home.png","frauen.png","topics.png","posts.png","quran.png","more.png","quiz.png"]){
 assert.ok(fs.existsSync(path.join(root,"assets/dar-3d-icons",asset)),asset+" missing");
}
const headerCSS=get("assets/dar-adult-brand-header-v2.css");
assert.match(headerCSS,/DAR ADULT COMPACT MARK HEADER V20261030/);
assert.match(headerCSS,/grid-template-columns/);
const pwaProfile=get("assets/dar-visitor-smart-profile-v1.js");
const daily=get("assets/dar-visitor-daily-hub-v1.js");
function simulate(route){
 const memory=new Map(),win={},events={},doc={
  body:{classList:{contains(){return false}}},
  readyState:"loading",addEventListener:(name,cb)=>events[name]=cb,
  dispatchEvent(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}
 };
 const location={pathname:route,hash:""};
 const globals={
  window:win,document:doc,location,
  localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
  requestAnimationFrame:()=>{},console,CustomEvent:function(t,obj){this.type=t;this.detail=obj&&obj.detail},
  setTimeout:()=>{},MutationObserver:function(){this.observe=()=>{}}
 };
 vm.runInNewContext(pwaProfile,globals,{timeout:2500});
 vm.runInNewContext(daily,globals,{timeout:2500});
 return win;
}
for(const route of ["/","/pwa/","/pwa/index.html"]){
 const w=simulate(route);
 assert.ok(w.DAR_VISITOR_SMART_PROFILE_V1,"Profile unavailable on "+route);
 assert.ok(w.DAR_VISITOR_DAILY_HUB_V1,"Daily hub unavailable on "+route);
 w.DAR_VISITOR_SMART_PROFILE_V1.setGender("woman");
 assert.equal(w.DAR_VISITOR_DAILY_HUB_V1.profileTab(),"frauen",route);
 w.DAR_VISITOR_SMART_PROFILE_V1.setGender("man");
 assert.equal(w.DAR_VISITOR_DAILY_HUB_V1.profileTab(),"topics",route);
 w.DAR_VISITOR_SMART_PROFILE_V1.setGender("neutral");
 assert.equal(w.DAR_VISITOR_DAILY_HUB_V1.profileTab(),"topics",route);
 assert.equal(w.DAR_VISITOR_DAILY_HUB_V1.bankSize,12,route);
}
const kids=simulate("/test/kids/");
assert.equal(kids.DAR_VISITOR_SMART_PROFILE_V1,undefined,"Kids must stay isolated");
const onboarding=get("assets/dar-visitor-onboarding-v1.js");
assert.match(onboarding,/\/pwa/);
assert.match(onboarding,/data-dvo-gender/);
assert.match(onboarding,/data-dvo-restart/);
assert.match(onboarding,/STEPS=\["profile","start","quran","search","qibla","women","more","account","notes"\]/);
console.log("PASS: installed Android PWA + iOS visitor share women / men / neutral dashboard, 3D nav, daily Qur'an quiz, onboarding, safe offline update (Kids isolated).");
