#!/usr/bin/env node
"use strict";
/* KIDS_PARENTS_DASHBOARD_V1432 — no destructive data/layout regressions. */
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const html=read("kids/index.html");
assert.equal(html,read("kids/start.html"),"3 entrypoints: start");
assert.equal(html,read("kids/shell.html"),"3 entrypoints: shell");
const js=read("kids/parents-dashboard-v1432.js");
const css=read("kids/parents-dashboard-v1432.css");
const sw=read("kids/sw.js");
const offline=read("kids/offline-library-v1.js");
const birth=read("kids/kids-birth-month-v1431.js");
assert.doesNotThrow(()=>new Function(js),"parent JS syntax");
assert.doesNotThrow(()=>new Function(sw),"SW syntax");
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"parent CSS valid brace structure");
for(const asset of ["parents-dashboard-v1432.js?v=1434","parents-dashboard-v1432.css?v=1433"])
  assert(html.includes(asset)&&sw.includes(asset),"parent dashboard assets published and precached: "+asset);
assert(html.includes('navigator.serviceWorker.register("/kids/sw.js?v=1434"'),"main app must register newest offline cache");
assert(sw.includes('dar-al-tawhid-kids-v1434'),"SW cache version");
assert(html.lastIndexOf("parents-dashboard-v1432.css")>html.lastIndexOf("kids-girl-palette-authority-v1427.css"),"dashboard style must be last");
for(const id of ["parentBirthSave","parentBirthPanel","minuteSlider","parentStoriesDone",
 "parentDuasDone","parentQuizCorrect","parentTodayDone","profileList","profileAdd","profileBring","profileAsk"]){
 assert(html.includes('id="'+id+'"'),"existing parent element removed: "+id);
}
for(const marker of ["kids-parent-overview","kidsParentName","kidsParentManage","kidsParentAccounts",
 "kidsParentOffline","kidsParentBirthFold","kidsParentCurrentAge"]){
 assert(js.includes(marker),"parent dashboard lacks "+marker);
}
assert(js.includes("accountDetails.scrollIntoView"),"Manage account button must navigate to controls");
assert(js.includes("arrangeOffline"),"offline library must be after age settings");
assert(js.includes("new MutationObserver"),"late-loaded offline library must be handled");
assert(js.includes("birthFold.open=false"),"birth detail must collapse after validated save");
assert(js.includes("birthSave.disabled"),"birth save validation missing");
for(const marker of ["#parentBirthSave",".app[data-gender=\"girl\"]","#kidsParentIdentityMeta",
 ".age-tabs[hidden]","#kidsParentStorySettings"]){
 assert(css.includes(marker),"scoped parent styling missing "+marker);
}
assert(css.includes("-webkit-text-fill-color:#432d48!important"),
 "girl save button may have unreadable pale text in iOS");
assert(css.includes("-webkit-text-fill-color:#243744!important"),
 "boy save button may have unreadable pale text in iOS");
assert(js.includes("textContent=display"),"child profile name must be escaped, not HTML inserted");
assert(!js.includes("localStorage.setItem("),"parent dashboard must not rewrite profiles, ages or learning states");
assert(!js.includes("kids_login")&&!js.includes("kids_register")&&!js.includes("kids_save"),
 "parent dashboard must not change account RPC flow");
assert(offline.includes('id="kidsOfflineLibrary"')||offline.includes('panel.id="kidsOfflineLibrary"'),
 "offline downloader still available");
assert(offline.includes('KIDS_OFFLINE_START'),"offline download flow unchanged");
assert(birth.includes('dar.kids.birthMonth.v1.'),"local-only birth month source preserved");
console.log("KIDS_PARENTS_DASHBOARD_V1432_OK: 3 shells, color contrast, folds, profiles, existing actions, offline");
