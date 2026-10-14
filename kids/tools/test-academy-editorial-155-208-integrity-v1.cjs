#!/usr/bin/env node
"use strict";
/* DĀR AL TAWḤĪD KIDS AKADEMI
 * Protected editorial regression 155–208 (not a scientific signoff).
 * No network request, TTS invocation, UI deployment, or merge.
 */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const blocks=["155-158","159-162","163-166","167-170","171-174","175-178","179-182","183-186","187-190","191-194","195-198","199-202","203-205","206-208"];
const page=read("kids/akademie/index.html");
const allVoice=new Map(),original={},seenLessons=new Set(),loadedTags=[];
let actualVoiceCount=0;
for(const block of blocks){
 const filename="curriculum-editorial-"+block+"-v1.js";
 const at=page.indexOf(filename);
 assert.ok(at>=0,"script missing from loader: "+filename);
 assert.equal(page.indexOf(filename,at+1),-1,"duplicate script: "+filename);
 if(loadedTags.length)assert.ok(at>loadedTags[loadedTags.length-1],"bad module order: "+filename);
 loadedTags.push(at);
 const V=JSON.parse(read("kids/data/academy-voice-editorial-"+block+"-delta-v1.json"));
 assert.equal(V.status,"text-only-not-generated-not-approved");
 assert.equal(V.generateCreditsUsed,0);
 assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
 const names=new Set(V.supersedesContextForLessonIds);
 assert.equal(names.size,block==="203-205"||block==="206-208"?3:4,"wrong lesson count "+block);
 assert.equal(V.contexts.length,names.size*19,"6 contexts for each age + 1 per lesson");
 actualVoiceCount+=V.contexts.length;
 for(const id of names){
  assert.ok(!seenLessons.has(id),"duplicate active lesson: "+id);
  seenLessons.add(id);
  const cIntro=V.contexts.find(x=>x.lessonId===id&&x.age==="4-5"&&x.kind==="intro");
  const cAudio=V.contexts.find(x=>x.lessonId===id&&x.age==="4-5"&&x.kind==="audio");
  assert.ok(cIntro&&cAudio&&cAudio.text.endsWith(cIntro.text));
  const title=cAudio.text.slice(0,-cIntro.text.length-2);
  original[id]={
   id,topic:title,
   quran:{label:"untouched-original",arabic:"untouched"},
   questions:{"4-5":[1],"6-8":[2],"9-10":[3]},
   profileProgress:{untouched:true},
   ageText:{"4-5":{},"6-8":{},"9-10":{}},
   sourceAudit:{scientificApproval:false}
  };
  allVoice.set(id,V.contexts.filter(x=>x.lessonId===id));
 }
}
assert.equal(seenLessons.size,54);
assert.equal(actualVoiceCount,1026);
assert.ok(page.indexOf("curriculum-editorial-154-v1.js")>=0,"lesson 154 base overlay missing");
for(const inactive of ["curriculum-editorial-203-206-v1.js"]){
 assert.ok(!page.includes(inactive),"overlapping draft must not be loaded: "+inactive);
}
const w={DARKidsAcademyCurriculum:original,DARKidsAcademyCurriculumEditorial154:{scientificApproval:false}};
let loadCount=0;
for(const block of blocks){
 const source=read("kids/akademie/curriculum-editorial-"+block+"-v1.js");
 vm.runInNewContext(source,{window:w},{filename:block,timeout:2000});
 const meta=w["DARKidsAcademyCurriculumEditorial"+block.replace("-","")];
 assert.ok(meta,"no metadata for "+block);
 assert.equal(meta.scientificApproval,false);
 assert.equal(meta.audioGenerated,false);
 assert.equal(meta.liveApproved,false);
 assert.equal(meta.ageVersionCount,block==="203-205"||block==="206-208"?9:12);
 loadCount++;
}
let ageCount=0;
for(const id of seenLessons){
 const before=original[id],lesson=w.DARKidsAcademyCurriculum[id],V=allVoice.get(id);
 assert.ok(lesson&&lesson!==before,"lesson overlay did not update: "+id);
 assert.equal(lesson.questions,before.questions,"quiz overwritten: "+id);
 assert.equal(lesson.profileProgress,before.profileProgress,"progress overwritten: "+id);
 assert.equal(lesson.sourceAudit.scientificApproval,false,"premature scientific signoff: "+id);
 if(id.startsWith("fiqh-"))assert.equal(lesson.sourceAudit.fiqhHumanReviewNeeded,true,"missing fiqh human review: "+id);
 const distinct=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=lesson.ageText[age],spoken=d?.lines?.join(" ");
  assert.equal(d?.lines?.length,4,"missing sections: "+id+"/"+age);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary,"missing fields "+id+"/"+age);
  assert.equal(d.intro,spoken);
  assert.equal(d.audioScript,before.topic+". "+spoken);
  assert.ok(!distinct.has(spoken),"repeated age text: "+id);distinct.add(spoken);
  for(const visible of [d.goal,spoken,d.situation,d.practice,d.evidence,d.summary]){
   assert.doesNotMatch(visible,/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher|synthetische Rezitation/i,"internal text in child lesson "+id+"/"+age);
  }
  const get=(kind,i)=>V.find(x=>x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,d.intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let j=0;j<4;j++)assert.equal(get("line",j)?.text,d.lines[j]);
  ageCount++;
 }
 assert.equal(V.find(x=>x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
assert.equal(ageCount,162);
process.stdout.write("PASS: "+loadCount+" ordered modules, "+seenLessons.size+" lessons, "+ageCount+" individual age texts, "+actualVoiceCount+" zero-credit spoken contexts. Scientific approval still blocked.\n");
