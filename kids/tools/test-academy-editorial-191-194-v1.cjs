#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["nafs-istighfar","fiqh-aus-dem-ruku-aufrichten","tawhid-mit-eigenen-worten","iman-sechs-glaubenssaeulen"];
const titles={"nafs-istighfar":"Regelmäßig um Vergebung bitten","fiqh-aus-dem-ruku-aufrichten":"Aus dem Rukūʿ aufrichten","tawhid-mit-eigenen-worten":"Tawḥīd mit eigenen Worten erklären","iman-sechs-glaubenssaeulen":"Die sechs Glaubenssäulen wiederholen"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-191-194-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.status,"text-only-not-generated-not-approved");
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};
for(const id of ids)base[id]={id,topic:titles[id],quran:{surah:1,ayah:1,arabic:"unchanged",label:"original"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial187190:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-191-194-v1.js"),{window:w},{filename:"editorial-191-194"});
const after=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial191194;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);
const html=read("kids/akademie/index.html");
const a=html.indexOf("curriculum-editorial-187-190-v1.js"),b=html.indexOf("curriculum-editorial-191-194-v1.js");
assert.ok(a>=0&&b>a,"review files must load in sequence");
assert.equal(html.indexOf("curriculum-editorial-191-194-v1.js",b+1),-1,"no duplicate loader");
for(const id of ids){
 const lesson=after[id],seen=new Set();assert.ok(lesson&&lesson.sourceAudit.scientificApproval===false);
 assert.deepEqual(lesson.questions,base[id].questions);
 if(id==="fiqh-aus-dem-ruku-aufrichten")assert.equal(lesson.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){
  const d=lesson.ageText[age],intro=d.lines.join(" ");assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);assert.equal(d.audioScript,titles[id]+". "+intro);
  assert.ok(!seen.has(intro));seen.add(intro);
  assert.doesNotMatch([d.intro,d.situation,d.practice,d.evidence,d.summary].join(" "),/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|scientificApproval|fiqhHumanReviewNeeded/i);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
assert.equal(after["nafs-istighfar"].quran.label,"Qurʾān 71:10");
assert.equal(after["iman-sechs-glaubenssaeulen"].quran.label,"Qurʾān 2:285");
assert.equal(after["tawhid-mit-eigenen-worten"].quran.label,"Qurʾān 112:1–4");
assert.equal(after["fiqh-aus-dem-ruku-aufrichten"].quran,base["fiqh-aus-dem-ruku-aufrichten"].quran);
process.stdout.write("PASS: 191–194; 12 age drafts; 76 voice text contexts; three source corrections; Fiqh review maintained; no audio or approval\n");
