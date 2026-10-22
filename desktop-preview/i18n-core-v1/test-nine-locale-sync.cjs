#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync("desktop-preview/i18n-core-v1/locale-preference-sync.js","utf8");
const storage=new Map();
const window={localStorage:{
 getItem:key=>storage.has(key)?storage.get(key):null,
 setItem:(key,value)=>storage.set(key,String(value))
}};
vm.runInNewContext(source,{window});
const bridge=window.DarAdultLocalePreference;
assert.deepEqual(Array.from(bridge.registeredLocales).sort(),["de","ar","en","tr","ku","ckb","bs","fr","es"].sort());
assert.equal(bridge.defaultAvailable.length,7);
const callbacks=[];
const account=bridge.create({onChange:(code,reason)=>callbacks.push([code,reason])});
(async()=>{
 assert.equal((await account.select("fr")).state,"invalid");
 assert.equal(account.locale(),"de");
 assert.equal((await account.select("tr")).state,"local-only");
 assert.equal(storage.get(bridge.storageKey),"tr");
 const enabled=bridge.create({onChange:code=>callbacks.push([code,"released"]),isAvailable:code=>code==="fr"||code==="es"});
 assert.equal((await enabled.select("fr")).state,"local-only");
 assert.equal(storage.get(bridge.storageKey),"fr");
 assert.equal((await enabled.select("es")).state,"local-only");
 assert.equal(storage.get(bridge.storageKey),"es");
 assert.ok(callbacks.length===3);
 console.log("PASS nine registered locales; FR/ES cannot activate without explicit release");
})().catch(e=>{console.error(e);process.exitCode=1});
