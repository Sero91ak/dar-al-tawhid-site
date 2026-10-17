#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/kids/akademie/unterrichtszentrale-v23.html");
const creator=read("test/kids/akademie/index.html");
const catalog=JSON.parse(read("test/kids/akademie/redaktion-katalog-v1.json"));
const roadmap=JSON.parse(read("kids/data/academy-expansion-roadmap-v23.json"));
const gate=read("cloudflare/preview-gate.js");
assert.ok(creator.includes('href="/test/academy/unterrichtszentrale-v23.html"'),"Use only signed-session editorial command center");
assert.ok(creator.includes('href="/test/academy/audio-audit-v18.html"'),"Retain signed-session voice audit");
assert.ok(gate.includes('ACADEMY_NEW_ROOT')&&gate.includes('academyOwnerAssetPath'));
assert.ok(gate.includes('"/unterrichtszentrale-v23.html"'),"The existing signed URL must map to an actual editor asset");
assert.ok(!fs.existsSync(path.join(root,"test/kids/akademie/lehrplan.html")),"Never add a second weaker route around signed owner access");
assert.ok(html.includes('id="pillar"'),"Editor must offer a 12-strand filter");
assert.ok(html.includes('e.ageOutcomes[age]'),"Every proposed lesson needs visible age differentiation");
assert.ok(html.includes('e.releaseGate?.childAppUnlocked===false'),"Reject unverified published states");
assert.ok(html.includes('e.editorialTopicId')||html.includes('e.classroomScenario'));
assert.ok(html.includes('for(const age of ["4-5","6-8","9-10"])'));
assert.ok(html.includes('("detailSources").append(chooser,panel)')||html.includes('$("detailSources").append(chooser,panel)'));
assert.ok(!html.includes("ELEVENLABS_API_KEY"),"Editor never calls paid generation");
assert.ok(!html.includes(".innerHTML"),"Unverified text must render as textContent");
assert.equal(catalog.weekly.length,52);
assert.equal(catalog.entries.length,208);
const previewCatalogCount=catalog.entries.filter(e=>e.type==="catalog").length;
const previewPlannedCount=catalog.entries.filter(e=>e.type==="planned").length;
const liveCatalogCount=roadmap.existingLessonSlots.length;
const remainingPlanned=roadmap.plannedUnits.length;
// Dar Test and Kids are independently deployed, never report seven future
// lesson slots as playable until the canonical Kids lane has been verified.
const transitionalGap=previewPlannedCount-remainingPlanned;
assert.ok([0,7,12,20,24,28,32,36,40,44,48].includes(transitionalGap),"Only V25 seven and V26 five authenticated topic releases may lag behind signed Test editor");
assert.equal(previewCatalogCount+previewPlannedCount,208);
assert.equal(liveCatalogCount+remainingPlanned,208);
assert.equal(previewCatalogCount+transitionalGap,liveCatalogCount);
assert.equal(catalog.editorialExpansion.addedEditorialTopics,previewPlannedCount);
assert.equal(catalog.editorialExpansion.pillars.length,12);
const titles=new Set();
for(const item of catalog.entries.filter(e=>e.type==="planned")){
 const matching=roadmap.plannedUnits.find(u=>u.editorialSlot===item.slot);
 if(!matching){
  assert.ok([7,12,20,24,28,32,36,40,44,48].includes(transitionalGap),"No unapproved editorial topic may disappear from the protected editor");
  assert.ok(item.slot>=39&&item.slot<=86,"Only source-reviewed topics 39–58 may differ");
  assert.ok(roadmap.existingLessonSlots.some(x=>x.editorialSlot===item.slot),
   "The editorial item must correspond to a source-reviewed Kids catalog lesson");
  assert.equal(item.visitorReleaseVerified,false,"Lagging Test UI must NEVER claim a lesson is live");
  assert.equal(item.releaseGate.childAppUnlocked,false);
  assert.equal(item.releaseGate.reviewerApproved,false);
  assert.equal(item.releaseGate.quranSourceVerified,false);
  assert.equal(item.releaseGate.sunnahSourceVerified,false);
  assert.equal(item.releaseGate.voiceApproved,false);
  titles.add(item.title);continue;
 }
 assert.equal(item.title,matching.title);
 assert.equal(item.pillar,matching.pillar);
 assert.equal(item.pillarLabel,roadmap.strandSummary.find(p=>p.id===matching.pillar).label);
 assert.deepEqual(item.ageOutcomes,matching.ageOutcomes);
 assert.equal(item.classroomScenario,matching.classroomScenario);
 assert.equal(item.type,"planned","Editorial title must never become a real lesson");
 assert.equal(item.visitorReleaseVerified,false);
 assert.equal(item.releaseGate.childAppUnlocked,false);
 assert.equal(item.releaseGate.reviewerApproved,false);
 assert.equal(item.releaseGate.quranSourceVerified,false);
 assert.equal(item.releaseGate.sunnahSourceVerified,false);
 assert.equal(item.releaseGate.voiceApproved,false);
 assert.ok(item.ageOutcomes["4-5"]&&item.ageOutcomes["6-8"]&&item.ageOutcomes["9-10"]);
 titles.add(item.title);
}
assert.equal(titles.size,previewPlannedCount);
const snippets=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(snippets.length);for(const script of snippets)new vm.Script(script[1],{filename:"signed-owner-editor-v23.js"});
console.log("KIDS SIGNED V23 EDITOR PASS: 208 slots, "+previewPlannedCount+" conservative Test outlines, "+liveCatalogCount+" canonical source-reviewed Kids lessons, transition="+transitionalGap+"; strict child/audio gates intact.");
