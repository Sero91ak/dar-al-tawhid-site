#!/usr/bin/env node
"use strict";
/* Read-only regression for DĀR Admin's ONE 48h female knowledge launch.
 * Mocks GitHub state in memory. No real worker requests, commits, pushes. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const keys=["content/focus-feed/feed-index.json","content/admin/frauen-batch-16-2026-11-18.json","assets/frauen/frauen-neufokus-v1.json","assets/frauen/frauen-entry-locales-v1.json"];
const batch=read(keys[1]),sources=[...new Set(batch.records.map(r=>r.sourceFile))];
const db=Object.fromEntries([...keys,...sources].map(p=>[p,read(p)]));
let writes=0;
const helpers={
 githubGet:async (env,owner,repo,path,branch)=>{
  assert.equal(branch,"main");
  const item=db[path];return item?{content:Buffer.from(JSON.stringify(item)).toString("base64"),sha:"test-sha"}:null;
 },
 base64ToUtf8:s=>Buffer.from(s,"base64").toString("utf8"),
 githubPut:async(env,owner,repo,path,content,commitMessage,branch,sha)=>{
  assert.equal(branch,"main");assert.equal(sha,"test-sha");
  db[path]=JSON.parse(content);writes++;return {commit:{sha:"test-commit-"+writes}};
 }
};
(async()=>{
const worker=fs.readFileSync(path.join(root,"cloudflare/focus-feed-admin.js"),"utf8");
const mod=await import("data:text/javascript;base64,"+Buffer.from(worker).toString("base64"));
const id="neufokus-frauenwissen-16-20261118",env={GITHUB_BRANCH:"main"};
const input={id,title:"NEUFOKUS · 16 neue Frauenbeiträge",status:"live",
 targetType:"category",targetId:"frauen",targetUrl:"frauen",visibility:"48h",staging:false};
const attempt=()=>mod.saveFeedEntry(env,input,helpers);
const expectBlock=async label=>{
 await assert.rejects(attempt(),/Frauen-Neufokus:/,label);
 assert.equal(writes,0,"Blocked attempt wrote to repository: "+label);
};
await expectBlock("Unreviewed content must not activate focus");
for(const row of batch.records){
 const e=db[row.sourceFile].eintraege.find(x=>x.kennung===row.id);assert.ok(e);
 e.quellenstatus="geprueft";e.freigabeDurchSerhat=true;
}
await expectBlock("All visible source files alone must not bypass scholarly/translation QA");
db[keys[1]].state="published-live-verified";
for(const row of db[keys[1]].records){
 row.sourceReview="approved";row.translationReview="approved";row.uiQa="passed";row.publishQa="passed";
}
const first=await attempt();
assert.equal(first.ok,true);assert.equal(first.item.visibility,"48h");
const firstStart=Date.parse(first.item.startsAt),firstExpiry=Date.parse(first.item.expiresAt);
assert.ok(Number.isFinite(firstStart));
assert.equal(firstExpiry-firstStart,48*3600000,"48h must be exact independent of Berlin DST");
assert.ok(Math.abs(Date.now()-firstStart)<15000,"Start must match first server publication");
assert.equal(writes,1);
await new Promise(r=>setTimeout(r,10));
const second=await attempt();
assert.equal(second.item.startsAt,first.item.startsAt,"Re-saving must never restart clock");
assert.equal(second.item.expiresAt,first.item.expiresAt,"Re-saving must never prolong 48h");
const badInput={...input,targetId:"recent"};
await assert.rejects(mod.saveFeedEntry(env,badInput,helpers),/Ziel muss der originale Frauenbereich sein/);
assert.equal(writes,2);
// Saving a completely unrelated card must not erase Frauen visibility or
// immutable publication time during the original window.
await mod.saveFeedEntry(env,{id:"another-focus-card",title:"Other saved card",status:"draft"},helpers);
let index=await mod.readFeedIndex(env,{staging:false},helpers);
let retained=index.index.items.find(x=>x.id===id);
assert.equal(retained.visibility,"48h","Normalizing another card must preserve 48h visibility");
assert.equal(retained.firstPublishedAt,first.item.firstPublishedAt,"Other card changed original launch time");
assert.equal(retained.expiresAt,first.item.expiresAt,"Other card extended the window");
assert.ok(mod.filterPublicFeed(index.index).some(x=>x.id===id),"Saving other card removed live Frauen focus");
// Switching back to draft and then live must NEVER reset the same clock.
await mod.saveFeedEntry(env,{...input,status:"draft"},helpers);
index=await mod.readFeedIndex(env,{staging:false},helpers);
retained=index.index.items.find(x=>x.id===id);
assert.equal(retained.firstPublishedAt,first.item.firstPublishedAt,"Draft transition erased first publication");
assert.ok(!mod.filterPublicFeed(index.index).some(x=>x.id===id),"Draft must not be publicly visible");
const third=await attempt();
assert.equal(third.item.startsAt,first.item.startsAt,"Republishing must not restart 48h");
assert.equal(third.item.expiresAt,first.item.expiresAt,"Republishing must not extend 48h");
assert.equal(third.item.visibility,"48h","Visibility must survive draft/live cycle");
assert.equal(writes,5);
console.log("PASS DĀR Admin 48h launch: guarded publication, immutable 48h window, unrelated card write preserves visibility, draft/live cycle cannot extend, no real publish.");
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
