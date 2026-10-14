#!/usr/bin/env node
"use strict";
// Protect original V1 foundations, all 33 age-specific explanations and 209 ungenerated voice contexts.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const group=["002-005","006-009","010-012"],ages=["4-5","6-8","9-10"];
const ledger=JSON.parse(read("kids-akademie/LESSON_STATUS.json")).lessons;
const html=read("kids/akademie/index.html");
const w={};vm.runInNewContext(read("kids/akademie/curriculum-v1.js"),{window:w});
const original=w.DARKidsAcademyCurriculum;assert.equal(Object.keys(original).length,11);
const protectedInfo=new Map(Object.entries(original).map(([id,x])=>[id,{quran:x.quran,hadith:x.hadith,questions:x.questions}]));
let count=0,contexts=0,position=html.indexOf("curriculum-v47.js"),reviewed=[];
for(const block of group){
 const needle="curriculum-editorial-core-"+block+"-v1.js",nextPos=html.indexOf(needle);
 assert.ok(nextPos>position,"loader must follow V47 and preceding editorial module "+block);
 assert.equal(html.indexOf(needle,nextPos+1),-1,"duplicate loader "+block);
 position=nextPos;
 vm.runInNewContext(read("kids/akademie/"+needle),{window:w});
 const meta=w["DARKidsAcademyCurriculumEditorialCore"+block.replace("-","")];
 assert.equal(meta.scientificApproval,false);
 assert.equal(meta.audioGenerated,false);
 assert.equal(meta.liveApproved,false);
 const ids=Array.from(meta.ids);
 assert.equal(meta.ageVersionCount,ids.length*3);
 const voice=JSON.parse(read("kids/data/academy-voice-editorial-core-"+block+"-delta-v1.json"));
 assert.equal(voice.status,"text-only-not-generated-not-approved");
 assert.equal(voice.generateCreditsUsed,0);
 assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
 assert.deepEqual(voice.supersedesContextForLessonIds,ids);
 assert.equal(voice.contexts.length,ids.length*19);
 for(const id of ids){
  assert.ok(!reviewed.includes(id),"duplicate legacy ID "+id);
  reviewed.push(id);
  const now=w.DARKidsAcademyCurriculum[id],before=protectedInfo.get(id);
  assert.ok(before);
  assert.equal(now.questions,before.questions,"old quiz changed "+id);
  assert.equal(now.quran,before.quran,"original Qurʾān changed "+id);
  assert.equal(now.hadith,before.hadith,"original Hadith changed "+id);
  assert.equal(now.sourceAudit.scientificApproval,false);
  if(id.startsWith("fiqh-"))assert.equal(now.sourceAudit.fiqhHumanReviewNeeded,true,"Fiqh approval guard missing "+id);
  const distinct=new Set();
  for(const age of ages){
   const d=now.ageText[age],spoken=d.lines.join(" "),entries=voice.contexts.filter(z=>z.lessonId===id&&z.age===age);
   assert.equal(d.lines.length,4,id+"/"+age+" lacks four child lines");
   assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary,id+"/"+age+" incomplete");
   assert.equal(d.intro,spoken);
   assert.equal(d.audioScript,now.topic+". "+spoken);
   assert.ok(!distinct.has(spoken),id+" age texts must be truly distinct");distinct.add(spoken);
   assert.doesNotMatch([d.goal,...d.lines,d.evidence,d.practice,d.situation,d.summary].join(" "),/scientificApproval|fiqhHumanReviewNeeded|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher|synthetische Rezitation/i);
   assert.equal(entries.length,6);
   assert.equal(entries.find(z=>z.kind==="intro")?.text,spoken);
   assert.equal(entries.find(z=>z.kind==="audio")?.text,d.audioScript);
   for(let i=0;i<4;i++)assert.equal(entries.find(z=>z.kind==="line"&&z.index===i)?.text,d.lines[i]);
   count++;
  }
  assert.equal(voice.contexts.find(z=>z.lessonId===id&&z.age==="all"&&z.kind==="summary")?.text,now.ageText["4-5"].audioScript);
 }
 contexts+=voice.contexts.length;
}
assert.equal(reviewed.length,11);assert.equal(new Set(reviewed).size,11);
assert.deepEqual(new Set(reviewed),new Set(ledger.filter(x=>x.slot>=2&&x.slot<=12).map(x=>x.lessonId)));
assert.equal(count,33);assert.equal(contexts,209);
console.log("PASS V1 core: 11 original lesson IDs; 33 distinct age versions; 209 zero-credit voice contexts; source/quiz objects unchanged; internal flags confined to audit.");
