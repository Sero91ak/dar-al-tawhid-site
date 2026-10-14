#!/usr/bin/env node
"use strict";
// Regression for the split PR-only Fiqh slot 130 and separate lessons 131–133.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["fiqh-gebetszeiten-kennenlernen","quran-tajwid-hoeren","sirah-muhammad-in-makkah","dua-nach-dem-essen-danken"],ages=["4-5","6-8","9-10"];
const topics={
 "fiqh-gebetszeiten-kennenlernen":"Die Gebetszeiten kennenlernen",
 "quran-tajwid-hoeren":"Einfaches Tajwīd-Hören",
 "sirah-muhammad-in-makkah":"Muḥammad ﷺ in Makkah",
 "dua-nach-dem-essen-danken":"Nach dem Essen danken"
};
const base={};
for(const id of ids)base[id]={
 id,topic:topics[id],
 quran:{surah:2,ayah:172,arabic:"يَاأَيُّهَا الَّذِينَ آمَنُوا",excerpt:false},
 questions:{"4-5":[1],"6-8":[2],"9-10":[3]},
 sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:id==="fiqh-gebetszeiten-kennenlernen",marker:"KEEP"},
 ageText:Object.fromEntries(ages.map(a=>[a,{goal:"OLD",intro:"OLD",lines:["OLD"],audioScript:"OLD",terms:["KEEP"]}]))
};
const env={window:{DARKidsAcademyCurriculum:Object.freeze(base),DARKidsAcademyCurriculumEditorial127129:{version:"prior"}}};
const run=(f)=>vm.runInNewContext(read("kids/akademie/"+f),env,{filename:f});
run("curriculum-editorial-130-v1.js");
assert.equal(env.window.DARKidsAcademyCurriculumEditorial130.ageVersionCount,3);
run("curriculum-editorial-131-133-v1.js");
assert.equal(env.window.DARKidsAcademyCurriculumEditorial131133.ageVersionCount,9);
const now=env.window.DARKidsAcademyCurriculum;
const voice1=JSON.parse(read("kids/data/academy-voice-editorial-130-delta-v1.json"));
const voice2=JSON.parse(read("kids/data/academy-voice-editorial-131-133-delta-v1.json"));
assert.equal(voice1.contexts.length,19);
assert.equal(voice2.contexts.length,57);
for(const v of [voice1,voice2]){assert.equal(v.generateCreditsUsed,0);assert.equal(v.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);}
const contexts=[...voice1.contexts,...voice2.contexts];
const get=(id,age,kind,index)=>contexts.filter(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(index===undefined||c.index===index));
const intros=new Set();
for(const id of ids){
 const x=now[id],before=base[id];
 assert.equal(x.id,id);
 assert.equal(x.questions,before.questions);
 assert.equal(x.sourceAudit.scientificApproval,false);
 assert.equal(x.sourceAudit.marker,"KEEP");
 assert.equal(x.sourceAudit.fiqhHumanReviewNeeded,id==="fiqh-gebetszeiten-kennenlernen");
 if(id==="sirah-muhammad-in-makkah"){assert.equal(x.sourceAudit.hadithNumber,3);assert.equal(x.sourceAudit.scientificApproval,false);}
 if(id==="dua-nach-dem-essen-danken"){
  assert.equal(x.sourceAudit.hadithNumber,2734);
  assert.ok(x.quran.arabic.startsWith("يَا أَيُّهَا"));
 }
 for(const age of ages){
  const a=x.ageText[age];
  assert.equal(a.lines.length,4);
  assert.ok(a.lines.every(t=>t.length>=35));
  assert.ok(a.intro.startsWith("Assalāmu ʿalaikum"));
  assert.ok(!/Keine Freigabe für Besucher|Masterstimme testen|Keine synthetische Rezitation/i.test(a.intro));
  assert.equal(a.terms,before.ageText[age].terms);
  intros.add(a.intro);
  assert.equal(get(id,age,"intro").length,1);
  assert.equal(get(id,age,"intro")[0].text,a.intro);
  assert.equal(get(id,age,"audio").length,1);
  assert.equal(get(id,age,"audio")[0].text,a.audioScript);
  a.lines.forEach((line,i)=>assert.equal(get(id,age,"line",i)[0].text,line));
 }
 assert.equal(get(id,"all","summary").length,1);
 assert.equal(get(id,"all","summary")[0].text,x.ageText["4-5"].audioScript);
}
assert.equal(intros.size,12);
const html=read("kids/akademie/index.html");
const scriptOrder=["curriculum-editorial-127-129-v1.js","curriculum-editorial-130-v1.js","curriculum-editorial-131-133-v1.js","curriculum-editorial-134-137-v1.js"].map(s=>html.indexOf(s));
assert.ok(scriptOrder.every((x,i)=>x>=0&&(!i||x>scriptOrder[i-1])));
console.log("KIDS 130 / 131–133: split modules, 4 lessons, 12 age texts, 76 voice contexts, unchanged IDs, Fiqh gate PASS");
