#!/usr/bin/env node
"use strict";
/* KIDS_SALAF_FOUR_PER_TOPIC_V1: minimum launch density, never render
 * this internal planning file in the child-facing visitor app.
 * Evidence/isnad requires separate scholarly source review. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"kids/data/salaf-library-v1.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"kids/data/salaf-launch-four-per-category-v1.json"),"utf8"));
const expected=["rahma","sidq","sabr","ilm","adab","family","hikma","shukr"];
assert.equal(plan.totalTarget,32,"Launch target must remain at least 32 stories");
assert.equal(plan.targetPerCategory,4,"All eight categories must start with four stories");
assert.deepEqual(plan.categories.map(x=>x.id),expected,"Category order or identity changed");
const ids=new Set(),sources=new Set(),contents=new Set();let total=0;
for(const item of data.items){
 assert.ok(item.id&&!ids.has(item.id),"Duplicate story: "+item.id);ids.add(item.id);
 assert.ok(expected.includes(item.category),"Unknown Salaf category: "+item.category);
 if(item.verification!=="approved"||item.editorialRelease!==true)continue;
 total++;
 assert.ok(typeof item.masterStoryText==="string"&&item.masterStoryText.length>=1700,"Master story must be complete: "+item.id);
 assert.match(item.masterStoryText,/^As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, mein lieber Bruder, meine liebe Schwester\./,"Opening and both profiles: "+item.id);
 assert.match(item.masterStoryText,/As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh\.\s*$/,"Full salām ending: "+item.id);
 assert.ok(!contents.has(item.masterStoryText),"Reused narrative text: "+item.id);contents.add(item.masterStoryText);
 assert.ok(Array.isArray(item.sources)&&item.sources.length&&item.sources.every(s=>s.author&&s.work&&s.reference&&s.url&&s.assessment==="verified"),"Reliable bibliographic metadata required: "+item.id);
 assert.equal(item.audioMaster,null,"No fabricated paid audio: "+item.id);
 assert.equal(item.eligibilityReview?.community,"ahl-as-sunnah-early-generations","Early Ahl al-Sunnah persona: "+item.id);
}
for(const section of plan.categories){
 const approved=data.items.filter(x=>x.category===section.id&&x.verification==="approved"&&x.editorialRelease===true);
 assert.ok(approved.length>=4,"Not enough published Salaf stories for "+section.id);
 assert.deepEqual(approved.map(x=>x.id),section.approvedIds,"Out-of-date internal progress tracker "+section.id);
 const pending=data.items.filter(x=>x.category===section.id&&(x.verification!=="approved"||x.editorialRelease!==true)).map(x=>x.id);
 assert.deepEqual(pending,section.pendingIds,"Pending review list drift "+section.id);
 assert.equal(section.emptySlots,Math.max(0,4-approved.length-pending.length),"Slot count drift "+section.id);
}
assert.ok(total>=32,"Salaf launch must have >=32 source-grounded finished texts");
const renderer=fs.readFileSync(path.join(root,"kids/salaf-library-v1.js"),"utf8");
assert.ok(renderer.includes('i.verification==="approved"&&i.editorialRelease===true'),"Reader must hide unapproved drafts");
assert.ok(renderer.includes("KIDS_SOURCE_TEXT_ONLY_V1414"),"No clickable external sources in visitor");
console.log("PASS KIDS_SALAF_FOUR_PER_TOPIC_V1:",total,"approved texts across 8 topics, at least 4 per topic");
