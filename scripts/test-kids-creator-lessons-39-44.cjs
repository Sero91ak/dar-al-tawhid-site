#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const initial=["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js"];
const sandbox={window:{}};for(const f of initial)vm.runInNewContext(read(f),sandbox,{filename:f});
const before=sandbox.window.DARKidsAcademyCurriculum;assert.equal(Object.keys(before).length,37,"Keep original 37 curriculum records + standalone Sidq");
const draftPath="kids/creator-test/lessons-039-044.js";vm.runInNewContext(read(draftPath),sandbox,{filename:draftPath});
const all=sandbox.window.DARKidsAcademyCurriculum,pack=sandbox.window.DARKidsAcademyCreatorDraftsV23;
assert.equal(Object.keys(all).length,43);assert.equal(pack.count,6);assert.equal(pack.ageVersions,18);
assert.equal(pack.editorialApproved,false);assert.equal(pack.voiceApproved,false);assert.equal(pack.visitorReleased,false);
const roadmap=JSON.parse(read("kids/creator-test/yearly-curriculum-roadmap-v1.json"));
const calendar=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const drafted=roadmap.plannedSlots.filter(s=>s.status==="SOURCE_CHECKED_DRAFT_NOT_APPROVED");
assert.equal(drafted.length,6);
const scheduled=calendar.weeks.flatMap(w=>w.days).filter(d=>d.status==="source-checked-test-draft-not-approved");
assert.equal(scheduled.length,6);
assert.equal(calendar.goals.currentlyInCatalog,38);
let checks=0;
for(const item of drafted){
 const l=all[item.draftLessonId];assert.ok(l,"Draft id present: "+item.slot);
 assert.equal(l.editorialSlot,item.slot);
 assert.equal(l.editorialStatus,"SOURCE_CHECKED_DRAFT_NOT_APPROVED");
 assert.equal(item.completedLesson,false);assert.equal(item.visitorReleased,false);
 assert.equal(item.masterVoiceApproved,false);assert.equal(item.previewPassed,false);
 assert.equal(item.originalSourcesVerified,true);
 assert.equal(item.originalSourceRefs.length,2);
 assert.equal(l.sourceAudit.quranUrl,item.originalSourceRefs[0]);
 assert.equal(l.sourceAudit.hadithUrl,item.originalSourceRefs[1]);
 assert.equal(l.quran.excerpt,true);assert.ok(l.quran.arabic.length>10);
 assert.ok(l.hadith.source&&l.hadith.text);assert.equal(l.audioApproved,false);
 const day=scheduled.find(d=>d.editorialSlot===item.slot);
 assert.ok(day);assert.equal(day.lessonId,null);
 for(const age of ["4-5","6-8","9-10"]){
   assert.equal(l.ageText[age].lines.length,4);
   assert.ok(l.ageText[age].intro&&l.ageText[age].activity);
   assert.ok(l.questions[age].length>=2);
   assert.equal(item.textByAgeApproved[age],false);
   assert.equal(item.quizByAgeApproved[age],false);
   checks++;
 }
}
const preview=read("test/kids/akademie/index.html"),publicPage=read("kids/akademie/index.html");
assert.ok(preview.includes('src="/kids/creator-test/lessons-039-044.js'));
assert.ok(!publicPage.includes("lessons-039-044.js"),"Visitor academy must not load editor drafts");
assert.ok(preview.includes("redaktionelle Entwürfe"));
assert.ok(preview.includes("Meine praktische Übung"));
assert.match(preview,/name="robots" content="noindex,nofollow,noarchive"/);
assert.ok(!preview.includes("localStorage")&&!preview.includes("indexedDB"));
const s=preview.split("<script>").slice(-1)[0].split("</script>")[0];new vm.Script(s,{filename:"kids-creator-preview-inline.js"});
console.log("KIDS CREATOR SOURCE DRAFT QA PASS: 38 existing + 6 staging drafts, "+checks+" age versions, no visitor release.");
