#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["adab-mit-essen-nicht-spielen","tarbiyah-selbststaendigkeit","nafs-stille-und-sammlung","fiqh-takbirat-al-ihram"];
const topics={
"adab-mit-essen-nicht-spielen":"Mit Essen nicht spielen",
"tarbiyah-selbststaendigkeit":"Selbstständigkeit Schritt für Schritt",
"nafs-stille-und-sammlung":"Stille und Sammlung üben",
"fiqh-takbirat-al-ihram":"Takbīrat al-Iḥrām kennenlernen"
};
const v=JSON.parse(read("kids/data/academy-voice-editorial-171-174-delta-v1.json"));
assert.deepEqual(v.supersedesContextForLessonIds,ids);
assert.equal(v.contexts.length,76);
assert.equal(v.generateCreditsUsed,0);
assert.equal(v.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
assert.equal(v.status,"text-only-not-generated-not-approved");
const base={};for(const id of ids)base[id]={
id,topic:topics[id],quran:{surah:7,ayah:31,label:"old value"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:id==="fiqh-takbirat-al-ihram"}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial167170:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-171-174-v1.js"),{window:w},{filename:"editorial-171-174"});
const after=w.DARKidsAcademyCurriculum;
assert.equal(w.DARKidsAcademyCurriculumEditorial171174.ageVersionCount,12);
assert.equal(w.DARKidsAcademyCurriculumEditorial171174.scientificApproval,false);
assert.equal(w.DARKidsAcademyCurriculumEditorial171174.audioGenerated,false);
const html=read("kids/akademie/index.html");
const x=html.indexOf("curriculum-editorial-167-170-v1.js"),y=html.indexOf("curriculum-editorial-171-174-v1.js");
assert.ok(x>=0&&y>x,"editorial scripts must be loaded in order");
assert.equal(html.indexOf("curriculum-editorial-171-174-v1.js",y+1),-1,"duplicate script tag");
for(const id of ids){
 const lesson=after[id];
 assert.ok(lesson);
 assert.equal(lesson.sourceAudit.scientificApproval,false);
 assert.equal(lesson.questions,base[id].questions,"original quiz must survive");
 const unique=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=lesson.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);
  assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!unique.has(intro));unique.add(intro);
  assert.doesNotMatch(intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe/i);
  const get=(kind,i)=>v.contexts.find(o=>o.lessonId===id&&o.age===age&&o.kind===kind&&(i===undefined||o.index===i));
  assert.equal(get("intro")?.text,intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(v.contexts.find(o=>o.lessonId===id&&o.age==="all"&&o.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
assert.equal(after["tarbiyah-selbststaendigkeit"].quran.label,"Qurʾān 94:7–8");
assert.equal(after["tarbiyah-selbststaendigkeit"].quran.surah,94);
assert.equal(after["tarbiyah-selbststaendigkeit"].quran.ayah,7);
assert.equal(after["fiqh-takbirat-al-ihram"].sourceAudit.fiqhHumanReviewNeeded,true);
process.stdout.write("PASS: 171–174: 12 ages, 76 texts, 94:7–8 correction, Fiqh review and loader order\n");
