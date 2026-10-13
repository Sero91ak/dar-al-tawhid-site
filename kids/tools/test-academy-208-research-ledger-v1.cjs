#!/usr/bin/env node
"use strict";
/** Regression guard for the permanent 208-slot source handoff. Zero network calls, zero credits. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const json=p=>JSON.parse(read(p));
const ledger=json("kids/research/academy-208-research-ledger-v1.json");
const year=json("kids/data/academy-year-52weeks-v1.json");
const roadmap=json("kids/data/academy-expansion-roadmap-v23.json");
const html=read("kids/unterrichtsarchiv.html");
const match=html.match(/const ARCHIVE_SNAPSHOT=(\{.*?\});\nfunction populateArchive\(/s);
assert.ok(match,"A complete archive snapshot must remain available");
const snapshot=JSON.parse(match[1]);
assert.equal(ledger.lessons.length,208,"The research ledger must list exactly 208 slots");
assert.equal(ledger.counts.slots,208);
const slots=year.weeks.flatMap(w=>w.days.filter(d=>d.mode==="new").map(d=>({...d,week:w.week})));
assert.equal(year.weeks.length,52);
assert.equal(slots.length,208);
assert.equal(new Set(ledger.lessons.map(l=>l.slot)).size,208,"No duplicate slot numbers");
const implemented=slots.filter(s=>!!s.lessonId),missing=slots.filter(s=>!s.lessonId);
assert.equal(implemented.length+missing.length,208);
assert.equal(year.goals.currentlyInCatalog,implemented.length);
assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,missing.length);
assert.equal(roadmap.curriculum.alreadyImplementedLessons,implemented.length);
assert.equal(roadmap.curriculum.proposedAdditionalLessons,missing.length);
assert.equal(ledger.counts.implemented,implemented.length,"Ledger needs refresh when curriculum count changes");
assert.equal(ledger.counts.remaining,missing.length,"Ledger needs refresh when curriculum count changes");
assert.equal(roadmap.plannedUnits.length,missing.length);
assert.equal(snapshot.year.goals.currentlyInCatalog,implemented.length,"Archive year snapshot stale");
assert.equal(snapshot.roadmap.plannedUnits.length,missing.length,"Archive roadmap snapshot stale");
assert.equal(Object.keys(snapshot.catalog).length+1,implemented.length,"Archive catalog must hold all lessons except special sidq");
const planned=new Map(roadmap.plannedUnits.map(x=>[x.editorialSlot,x]));
const ids=new Set();
for(let i=0;i<208;i++){
 const s=slots[i],l=ledger.lessons[i];
 assert.equal(s.editorialSlot,i+1);
 assert.equal(l.slot,i+1);
 assert.equal(l.week,s.week);
 assert.equal(l.weekday,s.weekday);
 assert.equal(l.lessonId,s.lessonId);
 if(s.lessonId){
  assert.ok(!ids.has(s.lessonId),"Duplicate lesson ID "+s.lessonId);
  ids.add(s.lessonId);
  assert.equal(l.status,"in-feature-branch-draft");
  if(s.lessonId!=="sidq"){
   const entry=snapshot.catalog[s.lessonId];
   assert.ok(entry,"Missing archived content "+s.lessonId);
   assert.equal(l.lessonTitle,entry.title);
   assert.equal(l.quran?.arabic,entry.quran?.arabic);
   assert.equal(l.hadith?.source,entry.hadith?.source);
   assert.equal(l.hadithUrl,entry.sourceAudit?.hadithUrl||null);
   const hasAges=!!(entry.ageText&&["4-5","6-8","9-10"].every(a=>entry.ageText[a]?.lines?.length===4&&entry.questions?.[a]?.length>=2));
   assert.equal(l.threeAgeStructured,hasAges);
  }
 }else{
  assert.equal(l.status,"editorial-outline-locked");
  const o=planned.get(i+1);assert.ok(o,"Missing planned unit "+(i+1));
  assert.equal(l.topic,o.title);assert.equal(l.pillar,o.pillar);
  assert.equal(l.classroomScenario,o.classroomScenario);
  assert.equal(l.releaseGate?.childAppUnlocked,false);
  assert.equal(l.voiceApproved,false);
 }
}
assert.equal(ledger.counts.explicitAge,ledger.lessons.filter(l=>l.threeAgeStructured).length);
assert.equal(ledger.counts.sourceAuditMetadata,ledger.lessons.filter(l=>!!l.sourceAudit).length);
assert.equal(ledger.counts.externallyChecked,ledger.lessons.filter(l=>!!l.independentCheck).length);
for(const row of ledger.lessons.filter(l=>!!l.independentCheck)){
 assert.ok(row.independentCheck.url.startsWith("https://dorar.net/"));
 assert.equal(row.hadithUrl,row.independentCheck.url);
}
console.log("KIDS RESEARCH LEDGER PASS:",implemented.length,"/208 implemented;",missing.length,"planned;",ledger.counts.explicitAge,"explicit age variants;",ledger.counts.externallyChecked,"independent spot checks; zero audio.");
