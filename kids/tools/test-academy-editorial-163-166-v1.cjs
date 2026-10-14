#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["adab-nach-dem-essen-dankbar","tarbiyah-nach-fehlern-weiterlernen","nafs-nicht-jeden-wunsch-sofort","fiqh-zum-gebet-stehen"];
const topics={"adab-nach-dem-essen-dankbar":"Nach dem Essen dankbar sein","tarbiyah-nach-fehlern-weiterlernen":"Nach Fehlern weiterlernen","nafs-nicht-jeden-wunsch-sofort":"Nicht jeden Wunsch sofort erfüllen","fiqh-zum-gebet-stehen":"Zum Gebet stehen"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-163-166-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.status,"text-only-not-generated-not-approved");
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:topics[id],quran:{surah:1,ayah:1,arabic:"unchanged",label:"previous label"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:id==="fiqh-zum-gebet-stehen"}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial159162:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-163-166-v1.js"),{window:w},{filename:"editorial-163-166"});
assert.equal(w.DARKidsAcademyCurriculumEditorial163166.ageVersionCount,12);
assert.equal(w.DARKidsAcademyCurriculumEditorial163166.scientificApproval,false);
assert.equal(w.DARKidsAcademyCurriculumEditorial163166.audioGenerated,false);
const next=w.DARKidsAcademyCurriculum;
const page=read("kids/akademie/index.html");
const a=page.indexOf("curriculum-editorial-159-162-v1.js"),b=page.indexOf("curriculum-editorial-163-166-v1.js");
assert.ok(a>=0&&b>a,"loader registration order");
assert.equal(page.indexOf("curriculum-editorial-163-166-v1.js",b+1),-1,"loader duplicate");
for(const id of ids){
 const lesson=next[id];assert.ok(lesson,"new lesson missing");
 assert.equal(lesson.sourceAudit.scientificApproval,false);
 assert.deepEqual(lesson.questions,base[id].questions,"must preserve existing quiz");
 const distinct=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=lesson.ageText[age],joined=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,joined);
  assert.equal(d.audioScript,topics[id]+". "+joined);
  assert.ok(!distinct.has(joined),"age text must be distinct");distinct.add(joined);
  assert.doesNotMatch(joined,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe/i);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,joined);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
assert.equal(next["tarbiyah-nach-fehlern-weiterlernen"].quran.label,"Qurʾān 94:5–6");
assert.equal(next["nafs-nicht-jeden-wunsch-sofort"].quran.label,"Qurʾān 17:29");
assert.ok(!next["nafs-nicht-jeden-wunsch-sofort"].quran.arabic.trim().endsWith("إِنَّ"),"17:30 leaked into 17:29");
assert.equal(next["fiqh-zum-gebet-stehen"].sourceAudit.fiqhHumanReviewNeeded,true);
process.stdout.write("PASS: lessons 163–166 / 12 ages / 76 voice text contexts / two verse boundaries / fiqh human review / no audio or approval\n");
