#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const batches=[
{group:"203-205",ids:["adab-digital","fiqh-tashahhud","fiqh-taslim"],topics:{"adab-digital":"Digitalen Adab üben","fiqh-tashahhud":"Tashahhud als Gebetsbestandteil","fiqh-taslim":"Den Gebetsabschluss kennenlernen"}},
{group:"206-208",ids:["fiqh-fehler-beim-ueben","fiqh-ramadan-fasten","fiqh-zakah-und-hajj"],topics:{"fiqh-fehler-beim-ueben":"Fehler beim Üben des Gebets","fiqh-ramadan-fasten":"Ramaḍān und Fasten kennenlernen","fiqh-zakah-und-hajj":"Zakāh und Ḥaǧǧ als Säulen"}}
];
const base={};for(const batch of batches)for(const id of batch.ids)base[id]={id,topic:batch.topics[id],quran:{surah:1,ayah:1,arabic:"original"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial199202:{scientificApproval:false}};
for(const batch of batches)vm.runInNewContext(read("kids/akademie/curriculum-editorial-"+batch.group+"-v1.js"),{window:w},{filename:batch.group});
const final=w.DARKidsAcademyCurriculum,html=read("kids/akademie/index.html");
let previous=html.indexOf("curriculum-editorial-199-202-v1.js");
assert.ok(previous>=0);
assert.ok(!html.includes('curriculum-editorial-203-206-v1.js'),"obsolete overlapping loader must be removed");
for(const batch of batches){
 const V=JSON.parse(read("kids/data/academy-voice-editorial-"+batch.group+"-delta-v1.json"));
 assert.deepEqual(V.supersedesContextForLessonIds,batch.ids);
 assert.equal(V.contexts.length,57);assert.equal(V.generateCreditsUsed,0);
 assert.equal(V.status,"text-only-not-generated-not-approved");
 assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
 const newAt=html.indexOf("curriculum-editorial-"+batch.group+"-v1.js");
 assert.ok(newAt>previous);previous=newAt;
 assert.equal(html.indexOf("curriculum-editorial-"+batch.group+"-v1.js",newAt+1),-1);
 for(const id of batch.ids){
  const lesson=final[id],seen=new Set();
  assert.equal(lesson.sourceAudit.scientificApproval,false);
  assert.equal(lesson.questions,base[id].questions,"original quiz preserved");
  assert.equal(lesson.quran,base[id].quran,"original Quran fields preserved");
  if(id!=="adab-digital")assert.equal(lesson.sourceAudit.fiqhHumanReviewNeeded,true);
  for(const age of ["4-5","6-8","9-10"]){
   const d=lesson.ageText[age],intro=d.lines.join(" ");
   assert.equal(d.lines.length,4);
   assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
   assert.equal(d.intro,intro);
   assert.equal(d.audioScript,batch.topics[id]+". "+intro);
   assert.ok(!seen.has(intro));seen.add(intro);
   for(const visible of [d.intro,d.goal,d.evidence,d.summary])assert.doesNotMatch(visible,/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher/i);
   const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
   assert.equal(get("intro")?.text,intro);
   assert.equal(get("audio")?.text,d.audioScript);
   for(let j=0;j<4;j++)assert.equal(get("line",j)?.text,d.lines[j]);
  }
  assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
 }
}
assert.equal(w.DARKidsAcademyCurriculumEditorial203205.ageVersionCount,9);
assert.equal(w.DARKidsAcademyCurriculumEditorial206208.ageVersionCount,9);
assert.equal(w.DARKidsAcademyCurriculumEditorial206208.scientificApproval,false);
assert.equal(w.DARKidsAcademyCurriculumEditorial206208.audioGenerated,false);
process.stdout.write("PASS: last 6 lessons, 18 independent age drafts, 114 zero-credit voice texts, source flags, unchanged quiz IDs, safe and unique loader order.\n");
