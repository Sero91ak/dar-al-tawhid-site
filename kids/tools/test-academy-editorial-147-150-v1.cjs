/* node kids/tools/test-academy-editorial-147-150-v1.cjs */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const base=path.resolve(__dirname,"..");
const index=fs.readFileSync(path.join(base,"akademie/index.html"),"utf8");
const names=["curriculum-editorial-143-146-v1.js","curriculum-editorial-147-150-v1.js","term-coach-v24.js"];
for(const name of names)assert(index.includes(name),"missing script: "+name);
assert(index.indexOf(names[0])<index.indexOf(names[1])&&index.indexOf(names[1])<index.indexOf(names[2]),"unexpected module load order");
const topics={
"tawhid-rahman-rahim":"Ar-Raḥmān und Ar-Raḥīm",
"iman-juengster-tag":"Īmān an den Jüngsten Tag",
"ikhlas-gemeinsame-aufgaben":"Gemeinsame Aufgaben ohne Eitelkeit",
"akhlaq-versoehnung-nach-streit":"Versöhnung nach Streit"};
const ages=["4-5","6-8","9-10"],old={};
for(const [id,topic] of Object.entries(topics))old[id]={topic,sourceAudit:{scientificApproval:false,note:"original"},quran:{sentinel:"original"},questions:{sentinel:"original"},ageText:Object.fromEntries(ages.map(age=>[age,{intro:"unrevised",lines:[]}]))};
const win={DARKidsAcademyCurriculum:old,DARKidsAcademyCurriculumEditorial143146:{ageVersionCount:12}};
vm.runInNewContext(fs.readFileSync(path.join(base,"akademie",names[1]),"utf8"),{window:win});
const result=win.DARKidsAcademyCurriculum;
const voice=JSON.parse(fs.readFileSync(path.join(base,"data/academy-voice-editorial-147-150-delta-v1.json"),"utf8"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
assert.equal(win.DARKidsAcademyCurriculumEditorial147150.ageVersionCount,12);
const expected=(id,age,kind,text,index)=>voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&x.text===text&&(index===undefined||x.index===index));
for(const [id,topic] of Object.entries(topics)){
 assert.equal(result[id].quran.sentinel,"original",id+" quran");
 assert.equal(result[id].questions.sentinel,"original",id+" questions");
 assert.equal(result[id].sourceAudit.scientificApproval,false,id+" release");
 for(const age of ages){
  const v=result[id].ageText[age],intro=v.lines.join(" "),audio=topic+". "+intro;
  assert.equal(v.lines.length,4,id+"/"+age);
  assert(v.lines.every(t=>t.length>60),id+"/"+age+" short line");
  assert.equal(v.intro,intro);
  assert.equal(v.audioScript,audio);
  assert(expected(id,age,"intro",intro));
  assert(expected(id,age,"audio",audio));
  v.lines.forEach((text,index)=>assert(expected(id,age,"line",text,index),id+"/"+age+" line "+index));
 }
}
console.log("4 lesson IDs, 12 independent age editions, 76 matching text contexts, 0 approvals.");
