#!/usr/bin/env node
"use strict";
/**
 * Complete DĀR adult synthetic 9-language push proof (no network).
 * Device/dispatch are TEST FIXTURES ONLY. Generic manuscripts are editorially reviewed but NOT a live delivery approval.
 *
 * Five prayer-entry + fifteen (5 prayers x 5/10/15 min) advance
 * + one Taḥajjud + four daily/article = 25 event configurations.
 * Nine synthetic subscriptions per event = 225 isolated messages.
 */
const assert=require("node:assert/strict");
const {localeCodes,buildPreview}=require("./push-i18n-resolver.cjs");
const manuscript=require("./push-copy-nine-languages-draft.json");
const registry=require("./locales.json");
const languages=localeCodes(registry);
const prayers=["fajr","dhuhr","asr","maghrib","isha"];
const cases=[];
for(const prayer of prayers){
 cases.push({key:"prayer_"+prayer+"_entry",
  event:{type:"prayer",eventKey:"TEST|2026-10-22|"+prayer+"|entry",environment:"test",prayerKey:prayer,mode:"entry",time:"06:15"}});
 for(const minutes of [5,10,15]){
  cases.push({key:"prayer_"+prayer+"_advance",
   event:{type:"prayer",eventKey:"TEST|2026-10-22|"+prayer+"|advance|"+minutes,
    environment:"test",prayerKey:prayer,mode:"advance",minutes,time:"06:15"}});
 }
}
cases.push({key:"prayer_tahajjud_entry",
 event:{type:"prayer",eventKey:"TEST|2026-10-22|tahajjud|entry",
  environment:"test",prayerKey:"tahajjud",mode:"entry",time:"02:30"}});
for(const kind of ["daily_dua","daily_recommendation","daily_ayah","new_post"]){
 cases.push({key:kind,event:{
  type:kind,eventKey:"TEST|2026-10-22|"+kind,environment:"test",
  contentId:"TEST-CANONICAL:"+kind,sourceHash:"test-only-revision",
  qNumber:kind==="new_post"?271:undefined,
  qRegistryVerified:kind==="new_post"?true:undefined,
  postSlug:kind==="new_post"?"test-post-slug":undefined,
  routeVerified:(kind==="new_post"||kind==="daily_ayah")?true:undefined,
    deepLink:kind==="daily_ayah"?"https://dar-al-tawhid.de/#quran/1/1":undefined
 }});
}
assert.equal(cases.length,25);
const subscriptions=languages.map((code,i)=>({
 subscription_id:"TEST_SYNTHETIC_"+String(i).padStart(2,"0"),
 app_locale:code,app_environment:"test",enabled:true,push_opted_in:true,
 daily_dua_enabled:true,daily_recommendation_enabled:true,daily_ayah_enabled:true
}));
const allIds=new Set();
let count=0;
const perEvent=[];
for(const scenario of cases){
 const copies=Object.fromEntries(languages.map(code=>{
  const draft=manuscript.copy[code]?.[scenario.key];
  assert.ok(draft,code+":"+scenario.key);
  assert.equal(draft.status,"approved","Generic notification text must pass delegated editorial review");
  // Synthetic revision binding exists ONLY in memory for offline fixture; the
  // real daily/post content still requires verified sourceHash, opt-in and link.
  return [code,{title:draft.title,body:draft.body,status:"approved",
   sourceHash:"test-only-revision"}];
 }));
 const report=buildPreview({event:scenario.event,copies,registrations:subscriptions,registry});
 assert.equal(report.sent,false);
 assert.equal(report.uniqueRecipients,languages.length);
 assert.equal(report.fallbackCount,0);
 for(let i=0;i<report.messages.length;i++){
  const m=report.messages[i],p=m.payload;
  assert.equal(m.copyLocale,languages[i]);
  assert.equal(p.include_subscription_ids.length,1);
  assert.ok(p.headings.en.trim()&&p.contents.en.trim());
  assert.doesNotMatch(p.headings.en+" "+p.contents.en,/\{[^}]+\}/);
  assert.equal(p.data.app_locale,languages[i]);
  if(scenario.event.type==="prayer"){
   assert.match(p.url,/#prayer$/);
   if(scenario.event.mode==="advance"){
    assert.ok((p.headings.en+" "+p.contents.en).includes(String(scenario.event.minutes)));
    assert.ok(p.contents.en.includes("06:15"));
   }
  }else{
   assert.equal(p.data.content_id,scenario.event.contentId);
   if(scenario.event.type==="new_post"){
    assert.equal(p.data.source_url,"https://dar-al-tawhid.de/q/271/");
   }
  }
  assert.ok(!allIds.has(p.idempotency_key),"duplicate event/idempotency per subscription");
  allIds.add(p.idempotency_key);
  count++;
 }
 perEvent.push({event:scenario.key,advanceMinutes:scenario.event.minutes||null,recipients:report.messages.length});
}
assert.equal(count,225);
assert.equal(allIds.size,225);
process.stdout.write(JSON.stringify({
 dryRun:true,networkRequests:0,liveNotificationsSent:0,
 syntheticSourceRevisionInMemoryOnly:true,storedGenericCopyEditoriallyApproved:true,
 productionDispatchAuthorized:false,
 languageCount:languages.length,distinctTestEventConfigurations:cases.length,
 syntheticDeliveries:count,idempotencyKeys:allIds.size,success:true,
 coverage:perEvent
},null,2)+"\n");
