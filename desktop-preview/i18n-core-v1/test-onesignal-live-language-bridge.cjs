#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../../assets/dar-onesignal-language-sync.js"),"utf8");
const router=fs.readFileSync(path.join(__dirname,"../../cloudflare/site-router.js"),"utf8");
const prayer=fs.readFileSync(path.join(__dirname,"../../cloudflare/prayer-push-scheduler.js"),"utf8");
const daily=fs.readFileSync(path.join(__dirname,"../../cloudflare/daily-push-scheduler.js"),"utf8");
const failures=[];
for(const [label,text] of [["public router",router],["prayer",prayer],["daily",daily]]){
 if(label==="public router"&&!text.includes("/assets/dar-onesignal-language-sync.js?v=1"))failures.push(label+" not imported");
 if(label==="prayer"&&!text.includes("prayerMessage(approvedPushCopy"))failures.push(label+" not localized");
 if(label==="daily"&&!text.includes("dailyMessage(approvedPushCopy"))failures.push(label+" not localized");
}
assert.deepEqual(failures,[]);
async function run(){
 let locale="tr",requests=[],permissions=0,subscribes=0,events={};
 const os={User:{async setLanguage(value){requests.push(value)}}};
 const doc={readyState:"complete"};
 const win={
  OneSignal:os,
  OneSignalDeferred:[],
  document:doc,
  localStorage:{getItem(key){return key==="darAdultPreferredLocaleV1"?locale:null}},
  addEventListener(type,fn){events[type]=fn}
 };
 vm.runInNewContext(source,{window:win});
 await win.DARPushLocaleSync.pushLocale();
 assert.equal(requests[0],"tr");
 locale="fr";
 await events["dar-adult-locale-changed"]();
 await win.DARPushLocaleSync.pushLocale();
 assert.ok(requests.includes("fr"));
 locale="ckb";
 const res=await win.DARPushLocaleSync.pushLocale();
 assert.equal(res.reason,"individual_delivery_required");
 assert.equal(res.fallbackLocale,"de");
 assert.deepEqual(requests,["tr","fr","de"]);
 const repeat=await win.DARPushLocaleSync.pushLocale();
 assert.equal(repeat.unchanged,true);
 assert.deepEqual(requests,["tr","fr","de"]);
 assert.equal(permissions,0);
 assert.equal(subscribes,0);
 // A native subscription cannot be retagged through a Web SDK user.
 const nativeUser={OneSignal:os,DAR_IOS_ONESIGNAL_ID:"native-sub",
  document:doc,localStorage:{getItem(){return "tr"}},
  addEventListener(){}};
 vm.runInNewContext(source,{window:nativeUser});
 const blocked=await nativeUser.DARPushLocaleSync.pushLocale();
 assert.equal(blocked.reason,"native_sdk_locale_bridge_required");
 assert.deepEqual(requests,["tr","fr","de"]);
 console.log(JSON.stringify({ok:true,turkishProviderLanguageSynced:true,languageSwitchSynced:true,unsupportedProviderLocaleFailsClosed:true,routes:["visitor","test","public-browser"],promptedForPermissions:false}));
}
run().catch(e=>{console.error(e);process.exitCode=1});
