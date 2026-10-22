#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const script=fs.readFileSync(path.join(root,"assets/dar-onesignal-language-sync.js"),"utf8");
const router=fs.readFileSync(path.join(root,"cloudflare/site-router.js"),"utf8");
assert.equal((router.match(/dar-onesignal-language-sync\.js\?v=1/g)||[]).length,3,
 "Adult-native, public-browser and test shells must each include locale sync");
assert.doesNotMatch(script,/\.optIn\s*\(|requestPermission\s*\(/);
(async()=>{
 let locale="tr",events={},sent=[];
 const global={
  OneSignal:{User:{async setLanguage(code){sent.push(code)}}},
  OneSignalDeferred:[],
  document:{readyState:"complete"},
  localStorage:{getItem(key){return key==="darAdultPreferredLocaleV1"?locale:null}},
  addEventListener(name,cb){events[name]=cb;}
 };
 vm.runInNewContext(script,{window:global});
 await global.DARPushLocaleSync.pushLocale();
 assert.equal(sent[0],"tr");
 locale="fr";
 events["dar-adult-locale-changed"]();
 await global.DARPushLocaleSync.pushLocale();
 assert.equal(sent[sent.length-1],"fr");
 locale="ckb";
 const fallback=await global.DARPushLocaleSync.pushLocale();
 assert.equal(fallback.reason,"individual_delivery_required");
 assert.ok(sent.every(code=>code!=="ckb"));
 console.log(JSON.stringify({passed:true,turkish:true,french:true,kurdishFailsClosed:true,subscriptionsChanged:false,notificationsSent:0}));
})().catch(e=>{console.error(e);process.exitCode=1});
