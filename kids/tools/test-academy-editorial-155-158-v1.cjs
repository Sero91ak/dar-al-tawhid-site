#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["quran-woher-stammt-ein-hadith","sirah-sahabah-vorbild","dua-adhkar-ohne-zwang","family-gemeinschaft-gutes"];
const topics={
 "quran-woher-stammt-ein-hadith":"Woher stammt ein Ḥadīṯ?",
 "sirah-sahabah-vorbild":"Ṣaḥābah und gutes Vorbild",
 "dua-adhkar-ohne-zwang":"Adhkār ohne Zwang wiederholen",
 "family-gemeinschaft-gutes":"Für die Gemeinschaft etwas Gutes tun"
};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-155-158-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.status,"text-only-not-generated-not-approved");
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
assert.equal(voice.contexts.length,76);
const base={};for(const id of ids)base[id]={id,topic:topics[id],quran:{surah:0,ayah:0,label:"old"},ageText:{"4-5":{}, "6-8":{}, "9-10":{}},questions:{"4-5":[1], "6-8":[2], "9-10":[3]},sourceAudit:{scientificApproval:false}};
const context={window:{DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial154:{scientificApproval:false}}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-155-158-v1.js"),context,{filename:"curriculum-editorial-155-158"});
const window=context.window,after=window.DARKidsAcademyCurriculum;
assert.equal(window.DARKidsAcademyCurriculumEditorial155158.ageVersionCount,12);
assert.equal(window.DARKidsAcademyCurriculumEditorial155158.scientificApproval,false);
assert.equal(window.DARKidsAcademyCurriculumEditorial155158.audioGenerated,false);
const index=read("kids/akademie/index.html");
const at154=index.indexOf("curriculum-editorial-154-v1.js"),at155=index.indexOf("curriculum-editorial-155-158-v1.js");
assert.ok(at154>=0&&at155>at154,"editorial scripts must be loaded in order");
assert.equal(index.indexOf("curriculum-editorial-155-158-v1.js",at155+1),-1,"script loaded more than once");
for(const id of ids){
 const l=after[id];assert.ok(l);
 assert.equal(l.sourceAudit.scientificApproval,false,"must remain scientifically blocked");
 assert.deepEqual(l.questions,base[id].questions,"original quiz contract must be unchanged");
 const unique=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age];assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.practice&&d.situation&&d.evidence&&d.summary);
  assert.equal(d.intro,d.lines.join(" "));
  assert.equal(d.audioScript,topics[id]+". "+d.intro);
  assert.doesNotMatch(d.intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe/i);
  assert.ok(!unique.has(d.intro),"age versions cannot be identical");unique.add(d.intro);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,d.intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
assert.equal(after["quran-woher-stammt-ein-hadith"].quran.label,"Qurʾān 53:3–4");
assert.equal(after["dua-adhkar-ohne-zwang"].quran.label,"Qurʾān 33:41–42");
assert.doesNotMatch(after["dua-adhkar-ohne-zwang"].quran.arabic,/هُوَ الَّذِي يُصَلِّي/,"33:43 cannot be in 33:41–42");
process.stdout.write("PASS: 4 lessons / 12 age drafts / 76 ungenerated voice texts / 2 verse span fixes / 0 approvals / index load order\n");
