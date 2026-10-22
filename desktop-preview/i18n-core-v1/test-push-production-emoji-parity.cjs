#!/usr/bin/env node
"use strict";
/* Offline regression: exact German production copy, identical emojis per locale.
 * No messages sent. No worker started. No calculations or scheduling changed.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const corpus=require("./push-copy-nine-languages-draft.json");
const registry=require("./locales.json");
const daily=require(path.join(root,"content/admin/daily-push.json"));
const source=fs.readFileSync(path.join(root,"cloudflare/prayer-push-copy.js"),"utf8");
const scheduler=fs.readFileSync(path.join(root,"cloudflare/prayer-push-scheduler.js"),"utf8");
const emoji={fajr:"✨",dhuhr:"☀️",asr:"🌤️",maghrib:"🌥️",isha:"🌙",tahajjud:"🌙"};
const prayers=["fajr","dhuhr","asr","maghrib","isha"];
const name={fajr:"Fajr",dhuhr:"Dhuhr",asr:"ʿAṣr",maghrib:"Maghrib",isha:"ʿIshāʾ"};
function block(symbol){
 const match=source.match(new RegExp("export const "+symbol+" = \\{([\\s\\S]*?)\\n\\};"));
 assert.ok(match,"Production block missing "+symbol);
 return match[1];
}
const entryBlock=block("PRAYER_ENTRY_PUSH_VARIANTS");
const advanceBlock=block("PRAYER_ADVANCE_PUSH_VARIANTS");
function originalEntry(key){
 const lines=entryBlock.split("\n");
 const i=lines.findIndex(line=>line.trim()===key+": [");
 assert.ok(i!==-1,"Entry key missing "+key);
 const match=lines[i+1].trim().match(/^\{ title: "([^"]+)", body: "([^"]+)" \}$/);
 assert.ok(match,"Original entry changed "+key);
 return {title:match[1],body:match[2]};
}
function originalAdvance(key){
 const lines=advanceBlock.split("\n");
 const i=lines.findIndex(line=>line.trim()===key+": [");
 assert.ok(i!==-1,"Advance key missing "+key);
 const match=lines[i+1].trim().match(/^"([^"]+)"$/);
 assert.ok(match,"Original advance changed "+key);
 return match[1];
}
assert.equal(Object.keys(registry.locales).length,9);
assert.ok(scheduler.includes("PRAYER_TITLE_EMOJI[prayer.key]"));
for(const [p,e] of Object.entries(emoji))assert.ok(source.includes(p+': "'+e+'"'),"Prayer emoji table mismatch "+p);
let count=0, scenarios=0;
for(const code of Object.keys(registry.locales)){
 const data=corpus.copy[code];
 for(const key of prayers){
  const pref=emoji[key]+" ";
  const entry=data["prayer_"+key+"_entry"],advance=data["prayer_"+key+"_advance"];
  for(const v of [entry,advance]){
   assert.equal(v.status,"approved");
   assert.ok(v.title.startsWith(pref),code+" "+key+" emoji mismatch");
   assert.equal(v.productionGermanEmoji,emoji[key]);
   assert.ok(v.title.length<=95&&v.body.length<=220);
  }
  assert.doesNotMatch(entry.title+entry.body,/[{}]/);
  assert.ok(advance.title.includes("{minutes}"));
  assert.ok(advance.body.includes("{minutes}")&&advance.body.includes("{time}"));
  if(code==="de"){
   assert.deepEqual({title:entry.title,body:entry.body},originalEntry(key));
   assert.equal(advance.title,pref+name[key]+" in {minutes} Min");
   assert.equal(advance.body,originalAdvance(key));
  }
  for(const min of [5,10,15]){
   const rendered=(advance.title+" "+advance.body).replaceAll("{minutes}",String(min)).replaceAll("{time}","06:35");
   assert.ok(rendered.includes(String(min))&&rendered.includes("06:35"));
   assert.doesNotMatch(rendered,/[{}]/);
   scenarios++;
  }
  count+=2;
 }
 const t=data.prayer_tahajjud_entry;
 assert.ok(t.title.startsWith("🌙 "));
 if(code==="de")assert.deepEqual({title:t.title,body:t.body},originalEntry("tahajjud"));
 count++;
 for(const [key,cfg] of [["daily_dua",daily.dailyDua],["daily_recommendation",daily.recommendation]]){
  const item=data[key];
  assert.equal(item.status,"approved");
  assert.equal(item.productionGermanEmoji,"");
  assert.equal(item.requiresRuntimeContentVerification,true);
  assert.doesNotMatch(item.title,/^\p{Extended_Pictographic}/u);
  assert.doesNotMatch(item.title+item.body,/[{}]/);
  if(code==="de")assert.deepEqual({title:item.title,body:item.body},{title:cfg.title,body:cfg.body});
  count++;
 }
}
assert.equal(count,117);
assert.equal(scenarios,135);
assert.equal(corpus.productionParity.liveDeliveryUnchanged,true);
assert.equal(corpus.productionParity.dynamicDailyPostTitleNotAutomaticallyTranslated,true);
console.log(JSON.stringify({ok:true,locales:9,textPairs:count,advanceScenarios:scenarios,emojis:emoji,notificationsSent:0}));
