#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const content=fs.readFileSync(path.join(root,"cloudflare/push-nine-language-copy.js"),"utf8");
const approved=require("./push-copy-nine-languages-draft.json");
const keys=Object.keys(approved.copy);
(async()=>{
 const mod=await import("data:text/javascript;base64,"+Buffer.from(content).toString("base64"));
 assert.equal(mod.ALL_LOCAL_CODES.length,9);
 assert.deepEqual(new Set(keys),new Set(mod.ALL_LOCAL_CODES));
 const prayers=["fajr","dhuhr","asr","maghrib","isha"];
 let copies=0,scenarios=0;
 for(const lang of keys){
  for(const prayer of prayers){
   for(const mode of ["entry","advance"]){
    for(const minutes of mode==="advance"?[5,10,15]:[0]){
     const map=mod.prayerMessage(approved,prayer,mode,minutes,"06:30",lang);
     const src=approved.copy[lang]["prayer_"+prayer+"_"+mode];
     const fill=str=>str.replaceAll("{minutes}",String(minutes)).replaceAll("{time}","06:30");
     assert.equal(map.headings.en,fill(src.title));
     assert.equal(map.contents.en,fill(src.body));
     assert.ok(map.headings.en.startsWith(mod.EMOJI[prayer]+" "));
     assert.deepEqual(Object.keys(map.headings),["en"]);
     scenarios++;
    }
    copies++;
   }
  }
  const t=mod.prayerMessage(approved,"tahajjud","entry",0,"",lang);
  assert.ok(t.headings.en.startsWith("🌙 "));
  for(const type of ["daily_dua","daily_recommendation"]){
    const d=mod.dailyMessage(approved,type,lang);
    assert.equal(d.headings.en,approved.copy[lang][type].title);
    assert.equal(d.contents.en,approved.copy[lang][type].body);
    copies++;
  }
 }
 const group=mod.prayerMessage(approved,"fajr","advance",10,"06:30");
 assert.equal(group.headings.de,approved.copy.de.prayer_fajr_advance.title.replace("{minutes}","10"));
 assert.equal(group.headings.tr,approved.copy.tr.prayer_fajr_advance.title.replace("{minutes}","10"));
 assert.equal(group.contents.tr,approved.copy.tr.prayer_fajr_advance.body.replace("{minutes}","10").replace("{time}","06:30"));
 assert.deepEqual(new Set(Object.keys(group.headings)),new Set(mod.SUPPORTED_BY_ONESIGNAL));
 assert.ok(!("ckb" in group.headings),"Unsupported provider language must use per-sub copy");
 assert.ok(!("ku" in group.headings),"Unsupported provider language must use per-sub copy");
 assert.throws(()=>mod.prayerMessage(approved,"fajr","advance",1573,"06:30"),/Invalid selected/);
 assert.throws(()=>mod.prayerMessage(approved,"fajr","advance",10,"wrong"),/computed target/);
 console.log(JSON.stringify({ok:true,locales:keys.length,individualizedCopyChecks:copies,prewarningAndEntryScenarios:scenarios,providerLocales:mod.SUPPORTED_BY_ONESIGNAL,sends:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
