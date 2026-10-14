#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(base,p),"utf8");
const ids=["adab-mit-gaesten-freundlich","tarbiyah-lernen-und-pausen","nafs-fehler-bereuen"],ages=["4-5","6-8","9-10"];
const lessons={};
for(const id of ids)lessons[id]={id,topic:id,quran:{arabic:"ORIGINAL_ARABIC",excerpt:false},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:false,marker:"PRESERVE"},ageText:Object.fromEntries(ages.map(a=>[a,{intro:"OLD",lines:["OLD"],terms:["PRESERVE"]}]))};
const context={window:{DARKidsAcademyCurriculum:Object.freeze(lessons),DARKidsAcademyCurriculumEditorial123126:{version:"prior"}}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-127-129-v1.js"),context,{filename:"curriculum-editorial-127-129-v1.js"});
const result=context.window.DARKidsAcademyCurriculum,voice=JSON.parse(read("kids/data/academy-voice-editorial-127-129-delta-v1.json"));
assert.equal(Object.keys(result).length,3);
assert.equal(context.window.DARKidsAcademyCurriculumEditorial127129.ageVersionCount,9);
assert.equal(voice.contexts.length,57);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const item=(id,age,kind,i)=>voice.contexts.filter(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(i===undefined||c.index===i));
const intros=[];
for(const id of ids){
 const old=lessons[id],l=result[id];
 assert.equal(l.id,id);
 assert.equal(l.questions,old.questions);
 assert.equal(l.sourceAudit.scientificApproval,false);
 assert.equal(l.sourceAudit.marker,"PRESERVE");
 if(id==="tarbiyah-lernen-und-pausen"){
  assert.equal(l.quran.excerpt,true);
  assert.ok(l.quran.arabic.startsWith("لَا يُكَلِّفُ"));
 }
 if(id==="nafs-fehler-bereuen"){
  assert.equal(l.quran.excerpt,false);
  assert.ok(l.quran.arabic.startsWith("قُلْ يَا عِبَادِيَ"));
  assert.ok(!l.quran.arabic.includes("وَأَنِيبُوا"));
 }
 for(const age of ages){
  const a=l.ageText[age];
  assert.equal(a.lines.length,4);
  assert.ok(a.lines.every(x=>x.length>=35));
  assert.ok(a.intro.startsWith("Assalāmu ʿalaikum"));
  assert.ok(!/Masterstimme testen|Keine Freigabe für Besucher|Keine synthetische Rezitation/i.test(a.intro));
  assert.equal(a.terms,old.ageText[age].terms);
  intros.push(a.intro);
  assert.equal(item(id,age,"intro")[0].text,a.intro);
  assert.equal(item(id,age,"audio")[0].text,a.audioScript);
  a.lines.forEach((x,i)=>assert.equal(item(id,age,"line",i)[0].text,x));
 }
 assert.equal(item(id,"all","summary")[0].text,l.ageText["4-5"].audioScript);
}
assert.equal(new Set(intros).size,9);
const index=read("kids/akademie/index.html"),a=index.indexOf("curriculum-editorial-123-126-v1.js"),b=index.indexOf("curriculum-editorial-127-129-v1.js"),c=index.indexOf("term-coach-v24.js");
assert.ok(a>=0&&b>a&&c>b);
console.log("KIDS editorial 127–129: 3 lessons, 9 age texts, 57 voice contexts, 2:286 excerpt, 39:53 boundary PASS");
