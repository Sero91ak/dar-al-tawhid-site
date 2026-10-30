#!/usr/bin/env node
/* DĀR TEST adult adaptive tabs and daily knowledge: pre-deploy regression. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=x=>fs.readFileSync(path.join(root,x),"utf8");
const js=read("test/assets/dar-daily-hub-v1.js");
const css=read("test/assets/dar-daily-hub-v1.css");
const home=read("test/assets/dar-home-html-parity-v1.js");
new vm.Script(js,{filename:"dar-daily-hub-v1.js"});
assert.match(js,/!\/\^\\\/test/,"No effect outside /test");
assert.match(js,/\/test\\\/kids/,"KIDS must be excluded");
assert.match(js,/DAR_TEST_SMART_PROFILE_V1/,"One existing shared profile authority");
assert.match(js,/data-dar-adaptive-tab/,"Stable slot identity needed");
assert.match(js,/navigateTo\(dest\)/,"Tab routes must be real app routes");
assert.match(js,/female\?"frauen":"topics"/,"No Quiz in gender-aware tab");
assert.match(js,/data-ddh-open/,"Daily card must reopen modal");
assert.match(js,/data-ddh-answer/,"Answer options must function");
assert.match(js,/skipped:true,seen:true/,"A skipped question must not reopen automatically");
assert.match(js,/automaticOff/,"Optional prompt setting required");
assert.match(js,/aria-modal="true"/,"Dialog semantics required");
assert.match(js,/e\.key==="Escape"/,"Keyboard dismissal required");
assert.match(js,/timeZone:"Europe\/Berlin"/,"Canonical local day boundary");
assert.match(js,/accountSession/,"Account-local status isolation");
assert.match(js,/ddh-more-quiz/,"Quiz stays discoverable in Mehr");
assert.match(home,/dar-daily-hub-v1\.js\?v=/,"Active Home loader must load script");
assert.match(home,/dar-daily-hub-v1\.css\?v=/,"Active Home loader must load styles");
assert.match(css,/prefers-reduced-motion/,"Reduced-motion must be respected");
assert.match(css,/safe-area-inset-bottom/,"Mobile safe area required");
assert.match(css,/min-width:720px/,"Tablet/desktop responsive layout required");
assert.match(css,/data-theme="royal"/,"Royal palette support required");
assert.doesNotMatch(js,/fetch\s*\(|XMLHttpRequest|OneSignal|Notification\.requestPermission/,
 "No external costs, background requests, push or notifications");
const bank=js.match(/\{q:"/g)||[];
assert.equal(bank.length,12,"12 source-backed rotating questions required");
assert.equal((js.match(/ref:"Qurʾān /g)||[]).length,12,"Every question needs a Quran reference");
let current="woman",storage=new Map(),listeners={};
const mockWindow={DAR_TEST_SMART_PROFILE_V1:{get:()=>({gender:current})}};
const context=vm.createContext({
 window:mockWindow,location:{pathname:"/test/"},document:{readyState:"loading",addEventListener:(key,fn)=>listeners[key]=fn},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 console,Date,Number,Object,Array,Math,Intl
});
vm.runInContext(js,context);
const api=mockWindow.DAR_TEST_DAILY_HUB_V1;
assert.ok(api,"Test API should be registered");
assert.equal(api.bankSize,12);
assert.equal(api.profileTab(),"frauen");
current="man";assert.equal(api.profileTab(),"topics");
current="neutral";assert.equal(api.profileTab(),"topics");
assert.match(api.question().ref,/^Qurʾān /);
assert.equal(api.question().a.length,3);
const kids=vm.createContext({window:{},location:{pathname:"/test/kids/"},document:{}});
vm.runInContext(js,kids);
assert.equal(kids.window.DAR_TEST_DAILY_HUB_V1,undefined,"Kids route isolated");
console.log("PASS DĀR TEST adaptive navigation and 12 daily questions (safe web-only).");
