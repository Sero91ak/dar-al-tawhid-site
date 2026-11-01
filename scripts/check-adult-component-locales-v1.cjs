#!/usr/bin/env node
"use strict";
/* Fail closed if a newly added adult UI omits one of nine required languages
 * or recreates the broken new-post popup actions and background access. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const registryJs=read("assets/i18n/adult-component-i18n-v1.js");
const moduleJs=read("assets/dar-home-recent-posts-v1.js");
const moduleCss=read("assets/dar-home-recent-posts-v1.css");
const builder=read("scripts/build-desktop-posts-index.js");
const router=read("cloudflare/site-router.js");
const languages=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.deepEqual(languages,["de","ar","en","tr","ku","ckb","bs","fr","es"]);
const first=moduleJs.indexOf("var labels={");
const last=moduleJs.indexOf("\n};\n",first);
assert(first>=0&&last>first,"Latest-posts UI translation dictionary missing");
const labels=vm.runInNewContext("("+moduleJs.slice(first+"var labels=".length,last+2)+")");
assert.deepEqual(Object.keys(labels),languages,"Nine adult UI locale catalogues required in exact app order");
for(const code of languages){
 assert(Array.isArray(labels[code])&&labels[code].length===17,code+" must have 17 UI strings");
 assert(labels[code].every(x=>typeof x==="string"&&x.trim()),code+" has empty UI label");
 for(const index of [0,1,2,3,4,5,7,8,9,11,12,13,14,15,16])assert(labels[code][index],code+" missing UI label "+index);
}
const win={localStorage:{getItem:()=> "tr"},addEventListener:()=>{}};
vm.runInNewContext(registryJs,{window:win});
const api=win.DARAdultComponentI18nV1;
assert(api&&api.languages.length===9,"Reusable adult UI registry missing");
assert.equal(api.register("recent-posts",labels),true);
assert.equal(api.t("recent-posts","7"),labels.tr[7],"App language not applied");
assert.throws(()=>api.register("incomplete",{de:{x:"one"}}),"Incomplete new feature language catalog passed");
assert(moduleJs.includes('var registry=w.DARAdultComponentI18nV1'),"Latest-posts UI bypasses shared adult locale registry");
assert(moduleJs.includes('var layer=e("dialog","dar-recent-notice-overlay")')&&moduleJs.includes("layer.showModal()"),"Popup must use the native top-layer dialog");
assert(moduleJs.includes("function bindNoticeAction(el,fn)")&&moduleJs.includes('el.addEventListener("pointerup"')&&moduleJs.includes('el.addEventListener("click"'),"Per-control iOS touch/click handlers missing");
assert(moduleJs.includes('bindNoticeAction(a,function(){dismissNotice(false);openPostById(p.id)})'),"Popup must dismiss before opening post");
assert(moduleJs.includes('bindNoticeAction(all,function(){dismissNotice(false);state.expanded=true;'),"View-all popup action missing");
assert(moduleJs.includes('bindNoticeAction(skip,function(){dismissNotice(true)})'),"Skip new-post batch missing");
assert(moduleJs.includes("child.inert=true")&&moduleJs.includes('root.style.setProperty("overflow","hidden","important")')&&moduleJs.includes('d.addEventListener("touchmove",noticeTouchGuard,{capture:true,passive:false})'),"WKWebView scroll/focus not locked");
assert(moduleJs.includes("unlockNoticeBackground()")&&moduleJs.includes("item.node.inert=item.inert")&&moduleJs.includes("restore(d.documentElement,lock.html)"),"Background not restored after close");
assert(moduleJs.includes('state.expanded?t(9):t(8)'),"View-all / close labels reversed");
assert(moduleJs.includes('t(7)+" ›"'),"Read post label must use correct translation");
assert(moduleJs.includes('function fetchTitleManifests(posts)'),"Localized titles not supported");
assert(builder.includes('localeManifest:/^\\/assets\\/'),"Canonical per-post locale manifest missing from generated index");
assert(moduleCss.includes("var(--notice-paper")&&moduleCss.includes("dialog#darRecentNoticeV1::backdrop")&&moduleJs.includes("applyNoticeTheme(layer)"),"Modern native modal appearance palette missing");
assert(router.indexOf('id="darAdultComponentI18nV1"')<router.indexOf('id="darHomeRecentPostsV1Js"'),"Shared locale registry must load before latest-posts component");
console.log("ADULT_UI_NINE_LOCALES_AND_POPUP OK: 9 languages, native dialog, direct touch actions, WKWebView lock, theme, localized titles.");
