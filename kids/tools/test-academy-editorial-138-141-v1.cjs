#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["akhlaq-schaden-abwenden","adab-als-gast","tarbiyah-bildschirme-bewusst","nafs-hoffnung-barmherzigkeit"],ages=["4-5","6-8","9-10"];
const prior={};
for(const id of ids)prior[id]={id,topic:id,quran:{arabic:"ORIGINAL_QURAN"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:false,marker:"PRESERVE"},ageText:Object.fromEntries(ages.map(age=>[age,{intro:"OLD",lines:["OLD"],audioScript:"OLD",terms:["PRESERVE"]}]))};
const scope={window:{DARKidsAcademyCurriculum:Object.freeze(prior),DARKidsAcademyCurriculumEditorial134137:{version:"previous"}}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-138-141-v1.js"),scope,{filename:"curriculum-editorial-138-141-v1.js"});
const curr=scope.window.DARKidsAcademyCurriculum,meta=scope.window.DARKidsAcademyCurriculumEditorial138141;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);
const voice=JSON.parse(read("kids/data/academy-voice-editorial-138-141-delta-v1.json"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const get=(id,age,kind,index)=>voice.contexts.filter(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(index===undefined||c.index===index));
const unique=new Set();
for(const id of ids){
 const out=curr[id],old=prior[id];
 assert.equal(out.id,id);
 assert.equal(out.quran,old.quran);
 assert.equal(out.questions,old.questions);
 assert.equal(out.sourceAudit.scientificApproval,false);
 assert.equal(out.sourceAudit.marker,"PRESERVE");
 for(const age of ages){
  const x=out.ageText[age];
  assert.equal(x.lines.length,4);
  assert.ok(x.lines.every(t=>t.length>=40));
  assert.ok(x.intro.startsWith("Assalāmu ʿalaikum"));
  assert.ok(!/Masterstimme testen|Keine Freigabe für Besucher|Keine synthetische Rezitation/i.test(x.intro));
  assert.equal(x.terms,old.ageText[age].terms);
  unique.add(x.intro);
  assert.equal(get(id,age,"intro")[0].text,x.intro);
  assert.equal(get(id,age,"audio")[0].text,x.audioScript);
  x.lines.forEach((t,index)=>assert.equal(get(id,age,"line",index)[0].text,t));
 }
 assert.equal(get(id,"all","summary")[0].text,out.ageText["4-5"].audioScript);
}
assert.equal(unique.size,12);
const html=read("kids/akademie/index.html");
const seq=["curriculum-editorial-134-137-v1.js","curriculum-editorial-138-141-v1.js","term-coach-v24.js"].map(s=>html.indexOf(s));
assert.ok(seq[0]>=0&&seq[1]>seq[0]&&seq[2]>seq[1]);
console.log("KIDS editorial 138–141: four lessons, twelve ages, 76 voice text contexts; IDs and source gates PASS");
