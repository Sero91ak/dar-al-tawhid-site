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
console.log("PASS DĀR Admin 48h launch: locked before all 16 live/reviewed, exact server timestamp, no extension after re-save, original women target only. No real publish.");
