#!/usr/bin/env node
"use strict";
/**
 * Strict, OFFLINE check for push copy. Never publishes or contacts OneSignal.
 * No npx, model APIs and external accounts are used.
 */
const test=require("node:test");
const assert=require("node:assert/strict");
const data=require("./push-copy-nine-languages-draft.json");
const registry=require("./locales.json");
const manifest=require("./onesignal-nine-language-drafts.json");
const codes=Object.keys(registry.locales);
const expected=[
 ...["fajr","dhuhr","asr","maghrib","isha"].flatMap(p=>["prayer_"+p+"_entry","prayer_"+p+"_advance"]),
 "prayer_tahajjud_entry","daily_dua","daily_recommendation","daily_ayah","new_post"
];
function fill(value,params){
 return value.replace(/\{([a-z_]+)\}/gi,(_m,key)=>{
  assert.ok(key in params,"Unexpected unfilled token "+key);
  return String(params[key]);
 });
}
test("all 15 source events have unique OneSignal draft template IDs",()=>{
 assert.equal(expected.length,15);
 assert.equal(new Set(expected).size,15);
 assert.deepEqual(Object.keys(manifest.templates).sort(),expected.slice().sort());
 assert.equal(new Set(Object.values(manifest.templates).map(x=>x.id)).size,15);
});
test("copy set follows all 9 registered locales (RTL remains RTL)",()=>{
 assert.equal(codes.length,9);
 assert.deepEqual(Object.keys(data.copy).sort(),codes.slice().sort());
 assert.equal(registry.locales.ar.dir,"rtl");
 assert.equal(registry.locales.ckb.dir,"rtl");
 for(const code of codes){
  assert.deepEqual(Object.keys(data.copy[code]).sort(),expected.slice().sort());
 }
});
test("135 explicitly delegated editorially approved generic copy pairs, not live authorization",()=>{
 let count=0;
 for(const code of codes){
  for(const key of expected){
   const item=data.copy[code][key];
   assert.equal(item.status,"approved",code+":"+key);
   assert.equal(item.reviewMethod,"AI_assisted_editorial");
   const scope = key.startsWith("prayer_")
     ? "exact_production_German_semantic_parity"
     : (key==="daily_dua"||key==="daily_recommendation")
       ? "configured_German_fallback_semantic_parity"
       : "generic_notification_copy_only";
   assert.equal(item.reviewScope,scope,code+":"+key+" review scope");
   assert.equal(item.requiresRuntimeContentVerification,["daily_dua","daily_recommendation","daily_ayah","new_post"].includes(key));
   assert.ok(typeof item.title==="string"&&item.title.trim(),code+":"+key+" missing title");
   assert.ok(typeof item.body==="string"&&item.body.trim(),code+":"+key+" missing body");
   assert.ok(item.title.length<=95,code+":"+key+" title too long");
   assert.ok(item.body.length<=220,code+":"+key+" body too long");
   assert.equal(/\{prayer\}/i.test(item.title+item.body),false,"unresolved prayer name");
   count++;
  }
 }
 assert.equal(count,135);
 assert.equal(data.sending,false);
 assert.equal(data.review.approvedCount,135);
 assert.equal(data.review.nativeSpeakerCertified,false);
 assert.equal(data.review.pushRoutingApproved,false);
 assert.equal(data.review.deviceDeliveryApproved,false);
});
test("every prayer prewarning accepts exact 5, 10, 15-minute values",()=>{
 for(const code of codes){
  for(const prayer of ["fajr","dhuhr","asr","maghrib","isha"]){
   const item=data.copy[code]["prayer_"+prayer+"_advance"];
   for(const minutes of [5,10,15]){
    const title=fill(item.title,{minutes,time:"06:30"});
    const body=fill(item.body,{minutes,time:"06:30"});
    assert.match(title+body,new RegExp(String(minutes)));
    assert.match(body,/06:30/);
    assert.doesNotMatch(title+body,/\{[^}]+\}/);
   }
  }
 }
});
test("prayer entry and other daily push previews have no unbound tokens",()=>{
 for(const code of codes){
  for(const key of expected.filter(k=>!k.endsWith("_advance"))){
   const text=data.copy[code][key].title+" "+data.copy[code][key].body;
   assert.doesNotMatch(text,/\{[^}]+\}/);
  }
 }
});
