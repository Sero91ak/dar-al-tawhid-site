#!/usr/bin/env node
"use strict";
// Protected QA: execute all age-editorial overlays from 155 through 208 in order.
// No audio APIs, no publishing and no website network access.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const groups=["155-158","159-162","163-166","167-170","171-174","175-178","179-182","183-186","187-190","191-194","195-198","199-202","203-205","206-208"];
const ages=["4-5","6-8","9-10"];
const ledger=JSON.parse(read("kids-akademie/LESSON_STATUS.json")).lessons;
assert.equal(ledger.length,208,"full academic year must remain 208 lesson IDs");
assert.equal(new Set(ledger.map(x=>x.lessonId)).size,208);
const baseline={};
for(const item of ledger){
 const ageText={};for(const age of ages)ageText[age]={intro:"previous",lines:["previous"],immutableKey:"unchanged"};
 baseline[item.lessonId]={
  id:item.lessonId,topic:item.topic,ageText,
  questions:{"4-5":[{id:1}],"6-8":[{id:2}],"9-10":[{id:3}]},
  quran:{surah:1,ayah:1,label:"original",arabic:"original"},
  sourceAudit:{scientificApproval:false},keepThisField:"do-not-erase"
 };
}
const protectedQuestions=new Map(ledger.map(x=>[x.lessonId,baseline[x.lessonId].questions]));
const page=read("kids/akademie/index.html");
const w={DARKidsAcademyCurriculum:baseline,DARKidsAcademyCurriculumEditorial154:{scientificApproval:false}};
const expectedIds=[];
let prevPos=-1,checkedContexts=0,childAges=0;
const leaked=/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|QA-Hinweis|Keine Freigabe für Besucher|Masterstimme|Audiotest|Debug|Preview|Staging|synthetische Rezitation/i;
for(const group of groups){
 const modulePath="kids/akademie/curriculum-editorial-"+group+"-v1.js";
 const needle="curriculum-editorial-"+group+"-v1.js";
 const pos=page.indexOf(needle);
 assert.ok(pos>prevPos,"index loader missing or misordered "+group);
 assert.equal(page.indexOf(needle,pos+1),-1,"module loaded more than once "+group);
 prevPos=pos;
 vm.runInNewContext(read(modulePath),{window:w},{filename:modulePath,timeout:1000});
 const suffix=group.replace("-","");
 const meta=w["DARKidsAcademyCurriculumEditorial"+suffix];
 assert.ok(meta,"module metadata missing "+group);
 assert.equal(meta.scientificApproval,false,"module must stay unapproved "+group);
 assert.equal(meta.audioGenerated,false,"module must not generate audio "+group);
 assert.equal(meta.liveApproved,false,"module must not be live-approved "+group);
 const ids=Array.from(meta.ids);
 assert.equal(meta.ageVersionCount,ids.length*3,"age count mismatch "+group);
 const delta=JSON.parse(read("kids/data/academy-voice-editorial-"+group+"-delta-v1.json"));
 assert.equal(delta.generateCreditsUsed,0);
 assert.equal(delta.status,"text-only-not-generated-not-approved");
 assert.equal(delta.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
 assert.deepEqual(delta.supersedesContextForLessonIds,ids);
 assert.equal(delta.contexts.length,ids.length*19,"six contexts per age + one summary per lesson");
 const unique=new Set();
 for(const id of ids){
  assert.ok(!expectedIds.includes(id),"duplicate overwritten lesson in multiple overlays: "+id);
  expectedIds.push(id);
  const lesson=w.DARKidsAcademyCurriculum[id];
  assert.ok(lesson,"missing lesson "+id);
  assert.equal(lesson.keepThisField,"do-not-erase","unrelated data lost "+id);
  assert.equal(lesson.questions,protectedQuestions.get(id),"quiz object replaced "+id);
  assert.equal(lesson.sourceAudit.scientificApproval,false,"wrong scientific approval "+id);
  for(const age of ages){
   const content=lesson.ageText[age],intro=content.lines.join(" ");
   assert.equal(content.lines.length,4,"incomplete lines "+id+"/"+age);
   assert.ok(content.goal&&content.practice&&content.evidence&&content.situation&&content.summary,"missing education fields "+id+"/"+age);
   assert.equal(content.intro,intro,"intro mismatch "+id+"/"+age);
   assert.equal(content.audioScript,lesson.topic+". "+intro,"spoken text mismatch "+id+"/"+age);
   assert.ok(!unique.has(intro),"identical age scripts "+id+"/"+age);unique.add(intro);
   const visible=[content.goal,...content.lines,content.practice,content.evidence,content.situation,content.summary].join(" ");
   assert.doesNotMatch(visible,leaked,"internal dev text leaked "+id+"/"+age);
   const contexts=delta.contexts.filter(x=>x.lessonId===id&&x.age===age);
   assert.equal(contexts.length,6,"wrong voice context count "+id+"/"+age);
   assert.equal(contexts.find(x=>x.kind==="intro")?.text,intro,"voice intro mismatch "+id+"/"+age);
   assert.equal(contexts.find(x=>x.kind==="audio")?.text,content.audioScript,"voice audio mismatch "+id+"/"+age);
   for(let i=0;i<4;i++)assert.equal(contexts.find(x=>x.kind==="line"&&x.index===i)?.text,content.lines[i],"voice line mismatch "+id+"/"+age+"/"+i);
   childAges++;
  }
  const summary=delta.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary");
  assert.equal(summary?.text,lesson.ageText["4-5"].audioScript,"summary mismatch "+id);
 }
 checkedContexts+=delta.contexts.length;
}
assert.equal(expectedIds.length,54,"the tail 155–208 must cover 54 lessons");
assert.deepEqual(expectedIds,ledger.filter(x=>x.slot>=155).map(x=>x.lessonId),"missing or misordered slots");
assert.equal(childAges,162,"expected 162 individual ages from 155–208");
assert.equal(checkedContexts,1026,"expected 1026 ungenerated text contexts from 155–208");
assert.ok(!page.includes('src="/kids/akademie/curriculum-editorial-203-206-v1.js"'),"orphan duplicate editorial overlay activated");
for(const lesson of ledger.filter(x=>x.slot>=155&&x.pillar==="fiqh")){
 assert.equal(w.DARKidsAcademyCurriculum[lesson.lessonId].sourceAudit.fiqhHumanReviewNeeded,true,"missing human Fiqh review "+lesson.slot);
}
console.log("PASS fullchain: "+groups.length+" JS modules executed, "+expectedIds.length+" lesson IDs, "+childAges+" age drafts, "+checkedContexts+" ungenerierte Sprechtexte, no child-facing dev text, no altered quizzes, no release flags.");
