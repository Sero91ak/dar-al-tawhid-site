#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const base=path.resolve(__dirname,"../..");
const load=p=>fs.readFileSync(path.join(base,p),"utf8");
const ids=["fiqh-gebetszeiten-kennenlernen","quran-tajwid-hoeren","sirah-muhammad-in-makkah","dua-nach-dem-essen-danken"];
const ages=["4-5","6-8","9-10"];
const lessons={};
for(const id of ids)lessons[id]={
 id,topic:id,quran:{arabic:"ORIGINAL_ARABIC",surah:17,ayah:78},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},
 sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:id==="fiqh-gebetszeiten-kennenlernen",testMarker:"KEEP"},
 ageText:Object.fromEntries(ages.map(age=>[age,{intro:"OLD",lines:["OLD"],audioScript:"OLD",terms:["KEEP"]}]))
};
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze(lessons),DARKidsAcademyCurriculumEditorial127129:{version:"previous"}}};
vm.runInNewContext(load("kids/akademie/curriculum-editorial-130-133-v1.js"),ctx,{filename:"editorial-130-133.js"});
const curr=ctx.window.DARKidsAcademyCurriculum,meta=ctx.window.DARKidsAcademyCurriculumEditorial130133;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.audioGenerated,false);
assert.equal(meta.scientificApproval,false);
assert.deepEqual(Object.keys(curr).sort(),ids.slice().sort());
const voice=JSON.parse(load("kids/data/academy-voice-editorial-130-133-delta-v1.json"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const get=(id,age,kind,i)=>voice.contexts.filter(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(i===undefined||c.index===i));
const intros=new Set();
for(const id of ids){
 const a=curr[id],old=lessons[id];
 assert.equal(a.id,id);
 assert.equal(a.quran,old.quran);
 assert.equal(a.questions,old.questions);
 assert.equal(a.sourceAudit.scientificApproval,false);
 assert.equal(a.sourceAudit.fiqhHumanReviewNeeded,id==="fiqh-gebetszeiten-kennenlernen");
 assert.equal(a.sourceAudit.testMarker,"KEEP");
 for(const age of ages){
  const d=a.ageText[age];
  assert.equal(d.lines.length,4);
  assert.ok(d.lines.every(t=>t.length>=40));
  assert.ok(d.intro.startsWith("Assalāmu ʿalaikum"));
  assert.ok(!/Masterstimme testen|Keine Freigabe für Besucher|Keine synthetische Rezitation/.test(d.intro));
  assert.equal(d.terms,old.ageText[age].terms);
  intros.add(d.intro);
  assert.equal(get(id,age,"intro").length,1);
  assert.equal(get(id,age,"intro")[0].text,d.intro);
  assert.equal(get(id,age,"audio").length,1);
  assert.equal(get(id,age,"audio")[0].text,d.audioScript);
  d.lines.forEach((line,index)=>assert.equal(get(id,age,"line",index)[0].text,line));
 }
 assert.equal(get(id,"all","summary").length,1);
 assert.equal(get(id,"all","summary")[0].text,a.ageText["4-5"].audioScript);
}
assert.equal(intros.size,12);
const html=load("kids/akademie/index.html");
const order=["curriculum-editorial-127-129-v1.js","curriculum-editorial-130-133-v1.js","term-coach-v24.js"].map(s=>html.indexOf(s));
assert.ok(order[0]>=0&&order[1]>order[0]&&order[2]>order[1]);
console.log("KIDS editorial 130–133: 4 lessons, 12 age versions, 76 text contexts, fiqh gate and stable IDs PASS");
