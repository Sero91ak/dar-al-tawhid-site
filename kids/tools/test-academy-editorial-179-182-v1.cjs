#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["nafs-wertschaetzend-mit-sich","fiqh-quran-rezitation-im-gebet","tawhid-keine-goettliche-macht-fuer-geschoepfe","iman-glaube-und-gute-worte"];
const topics={
 "nafs-wertschaetzend-mit-sich":"Wertschätzend mit sich selbst umgehen",
 "fiqh-quran-rezitation-im-gebet":"Die Qurʾān-Rezitation im Gebet",
 "tawhid-keine-goettliche-macht-fuer-geschoepfe":"Keinen geschaffenen Dingen göttliche Macht zuschreiben",
 "iman-glaube-und-gute-worte":"Glaube und gute Worte"
};
const v=JSON.parse(read("kids/data/academy-voice-editorial-179-182-delta-v1.json"));
assert.deepEqual(v.supersedesContextForLessonIds,ids);
assert.equal(v.contexts.length,76);
assert.equal(v.generateCreditsUsed,0);
assert.equal(v.status,"text-only-not-generated-not-approved");
assert.equal(v.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:topics[id],quran:{surah:1,ayah:1,label:"legacy verse"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:id==="fiqh-quran-rezitation-im-gebet"}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial175178:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-179-182-v1.js"),{window:w},{filename:"editorial-179-182"});
const meta=w.DARKidsAcademyCurriculumEditorial179182,next=w.DARKidsAcademyCurriculum;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);
const html=read("kids/akademie/index.html");
const a=html.indexOf("curriculum-editorial-175-178-v1.js"),b=html.indexOf("curriculum-editorial-179-182-v1.js");
assert.ok(a>=0&&b>a);
assert.equal(html.indexOf("curriculum-editorial-179-182-v1.js",b+1),-1);
for(const id of ids){
 const l=next[id],seen=new Set();
 assert.ok(l&&l.sourceAudit.scientificApproval===false);
 assert.equal(l.questions,base[id].questions);
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);
  assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!seen.has(intro));seen.add(intro);
  assert.doesNotMatch(intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe|künstlichen Ersatz für die Qurʾān-Rezitation/i);
  const get=(kind,i)=>v.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(v.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
assert.equal(next["tawhid-keine-goettliche-macht-fuer-geschoepfe"].quran.label,"Qurʾān 112:1–4");
assert.equal(next["fiqh-quran-rezitation-im-gebet"].sourceAudit.fiqhHumanReviewNeeded,true);
process.stdout.write("PASS: 179–182: 12 child-facing age texts / 76 zero-cost narration texts / source boundary / fiqh guard\n");
