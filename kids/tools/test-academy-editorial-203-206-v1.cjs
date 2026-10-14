#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["adab-digital","fiqh-tashahhud","fiqh-taslim","fiqh-fehler-beim-ueben"];
const topics={"adab-digital":"Digitalen Adab üben","fiqh-tashahhud":"Tashahhud als Gebetsbestandteil","fiqh-taslim":"Den Gebetsabschluss kennenlernen","fiqh-fehler-beim-ueben":"Fehler beim Üben des Gebets"};
const V=JSON.parse(read("kids/data/academy-voice-editorial-203-206-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);assert.equal(V.contexts.length,76);
assert.equal(V.generateCreditsUsed,0);assert.equal(V.status,"text-only-not-generated-not-approved");
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:topics[id],quran:{label:"original",surah:1,ayah:1},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial199202:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-203-206-v1.js"),{window:w},{filename:"editorial-203-206"});
const next=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial203206;
assert.equal(meta.ageVersionCount,12);assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);assert.equal(meta.liveApproved,false);
const H=read("kids/akademie/index.html"),at199=H.indexOf("curriculum-editorial-199-202-v1.js"),at203=H.indexOf("curriculum-editorial-203-206-v1.js");
assert.ok(at199>=0&&at203>at199,"editorials must load in order");
assert.equal(H.indexOf("curriculum-editorial-203-206-v1.js",at203+1),-1);
for(const id of ids){
 const l=next[id],seen=new Set();
 assert.equal(l.sourceAudit.scientificApproval,false);
 assert.equal(l.questions,base[id].questions);
 assert.equal(l.quran,base[id].quran);
 if(id!=="adab-digital")assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],text=d.lines.join(" ");
  assert.equal(d.lines.length,4);assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,text);assert.equal(d.audioScript,topics[id]+". "+text);
  assert.ok(!seen.has(text),"same script for two ages");seen.add(text);
  for(const visible of [d.intro,d.evidence,d.summary])assert.doesNotMatch(visible,/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher/i);
  const match=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(match("intro")?.text,d.intro);assert.equal(match("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(match("line",i)?.text,d.lines[i]);
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: lessons 203-206, 12 different ages, 76 ungenerated texts, fiqh guards, unchanged quiz & Quran\n");
