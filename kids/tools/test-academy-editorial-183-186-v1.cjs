#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["akhlaq-hilfsbereitschaft-ohne-druck","adab-beim-unterricht-aufmerksam","nafs-schuldgefuehle-ohne-angstbilder","fiqh-ruku-kennenlernen"];
const titles={"akhlaq-hilfsbereitschaft-ohne-druck":"Hilfsbereitschaft ohne Druck","adab-beim-unterricht-aufmerksam":"Beim Unterricht aufmerksam sein","nafs-schuldgefuehle-ohne-angstbilder":"Schuldgefühle ohne Angstbilder besprechen","fiqh-ruku-kennenlernen":"Rukūʿ kennenlernen"};
const V=JSON.parse(read("kids/data/academy-voice-editorial-183-186-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);
assert.equal(V.contexts.length,76);
assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:titles[id],quran:{surah:1,ayah:1,arabic:"unchanged",label:"old"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:id==="fiqh-ruku-kennenlernen"}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial179182:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-183-186-v1.js"),{window:w},{filename:"editorial-183-186"});
const all=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial183186;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);
const html=read("kids/akademie/index.html");
const a=html.indexOf("curriculum-editorial-179-182-v1.js"),b=html.indexOf("curriculum-editorial-183-186-v1.js");
assert.ok(a>=0&&b>a,"editorial loading order");
assert.equal(html.indexOf("curriculum-editorial-183-186-v1.js",b+1),-1,"duplicate script");
for(const id of ids){
 const lesson=all[id],seen=new Set();
 assert.ok(lesson&&lesson.sourceAudit.scientificApproval===false);
 assert.equal(lesson.questions,base[id].questions);
 if(id==="nafs-schuldgefuehle-ohne-angstbilder"){
  assert.equal(lesson.quran.label,"Qurʾān 39:53");
  assert.ok(lesson.quran.arabic.trim().startsWith("قُلْ "));
  assert.ok(lesson.quran.arabic.trim().endsWith("الرَّحِيمُ"));
  assert.doesNotMatch(lesson.quran.arabic,/وَأَنِيبُوا إِلَى رَبِّكُمْ/,"39:54 must not appear under 39:53");
 }else assert.equal(lesson.quran,base[id].quran);
 if(id==="fiqh-ruku-kennenlernen")assert.equal(lesson.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){
  const d=lesson.ageText[age],joined=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,joined);assert.equal(d.audioScript,titles[id]+". "+joined);
  assert.ok(!seen.has(joined),"age versions must differ");seen.add(joined);
  for(const child of [d.intro,d.evidence,d.summary])assert.doesNotMatch(child,/scientificApproval|fiqhHumanReviewNeeded|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,joined);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 183-186 / 12 ages / 76 ungenerated texts / Quran 39:53 boundary / Fiqh 186 blocked\n");
