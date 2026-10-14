#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const ids=["family-kranken-und-aelteren-helfen","tawhid-schoene-namen-allahs","iman-letzter-gesandter","ikhlas-dua-aufrichtig"],ages=["4-5","6-8","9-10"];
const prev={};
for(const id of ids)prev[id]={id,topic:id,quran:{arabic:"QURAN_AS_BEFORE"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:false,marker:"PRESERVE"},ageText:Object.fromEntries(ages.map(a=>[a,{goal:"OLD",intro:"OLD",lines:["OLD"],audioScript:"OLD",terms:["PRESERVE"]}]))};
const env={window:{DARKidsAcademyCurriculum:Object.freeze(prev),DARKidsAcademyCurriculumEditorial130133:{version:"earlier"}}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-134-137-v1.js"),env,{filename:"curriculum-editorial-134-137-v1.js"});
const curr=env.window.DARKidsAcademyCurriculum,meta=env.window.DARKidsAcademyCurriculumEditorial134137;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);
const voice=JSON.parse(read("kids/data/academy-voice-editorial-134-137-delta-v1.json"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const get=(id,age,kind,index)=>voice.contexts.filter(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(index===undefined||c.index===index));
const intros=new Set();
for(const id of ids){
 const x=curr[id],old=prev[id];
 assert.equal(x.id,id);
 assert.equal(x.quran,old.quran);
 assert.equal(x.questions,old.questions);
 assert.equal(x.sourceAudit.scientificApproval,false);
 assert.equal(x.sourceAudit.marker,"PRESERVE");
 assert.equal(x.sourceAudit.fiqhHumanReviewNeeded,false);
 if(id==="ikhlas-dua-aufrichtig")assert.equal(x.sourceAudit.additionalQuranReference,"40:14");
 for(const age of ages){
  const a=x.ageText[age];
  assert.equal(a.lines.length,4);
  assert.ok(a.lines.every(t=>t.length>=35));
  assert.ok(a.intro.startsWith("Assalāmu ʿalaikum"));
  assert.ok(!/Masterstimme testen|Keine Freigabe für Besucher|Keine synthetische Rezitation/i.test(a.intro));
  assert.equal(a.terms,old.ageText[age].terms);
  intros.add(a.intro);
  assert.equal(get(id,age,"intro")[0].text,a.intro);
  assert.equal(get(id,age,"audio")[0].text,a.audioScript);
  a.lines.forEach((t,i)=>assert.equal(get(id,age,"line",i)[0].text,t));
 }
 assert.equal(get(id,"all","summary")[0].text,x.ageText["4-5"].audioScript);
}
assert.equal(intros.size,12);
const index=read("kids/akademie/index.html"),seq=["curriculum-editorial-130-133-v1.js","curriculum-editorial-134-137-v1.js","term-coach-v24.js"].map(s=>index.indexOf(s));
assert.ok(seq[0]>=0&&seq[1]>seq[0]&&seq[2]>seq[1]);
console.log("KIDS editorial 134–137: 4 lessons, 12 age texts, 76 voice contexts, protected source fields PASS");
