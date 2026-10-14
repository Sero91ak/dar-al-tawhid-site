#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,".."),html=fs.readFileSync(path.join(base,"akademie/index.html"),"utf8");
const dep="curriculum-editorial-154-v1.js",name="curriculum-editorial-155-158-v1.js",coach="term-coach-v24.js";
assert(html.includes(dep)&&html.includes(name)&&html.includes(coach));
assert(html.indexOf(dep)<html.indexOf(name)&&html.indexOf(name)<html.indexOf(coach));
const topics={"quran-woher-stammt-ein-hadith":"Woher stammt ein Ḥadīṯ?","sirah-sahabah-vorbild":"Ṣaḥābah und gutes Vorbild","dua-adhkar-ohne-zwang":"Adhkār ohne Zwang wiederholen","family-gemeinschaft-gutes":"Für die Gemeinschaft etwas Gutes tun"};
const ages=["4-5","6-8","9-10"],original={};
for(const [id,topic]of Object.entries(topics))original[id]={topic,quran:{original:true},questions:{original:true},sourceAudit:{scientificApproval:false},ageText:Object.fromEntries(ages.map(age=>[age,{intro:"old",lines:[]}]))};
const window={DARKidsAcademyCurriculum:original,DARKidsAcademyCurriculumEditorial154:true};
vm.runInNewContext(fs.readFileSync(path.join(base,"akademie",name),"utf8"),{window});
const data=window.DARKidsAcademyCurriculum,voice=JSON.parse(fs.readFileSync(path.join(base,"data/academy-voice-editorial-155-158-delta-v1.json"),"utf8"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
assert.equal(window.DARKidsAcademyCurriculumEditorial155158.ageVersionCount,12);
for(const [id,topic]of Object.entries(topics)){
 assert(data[id].quran.original&&data[id].questions.original);
 assert.equal(data[id].sourceAudit.scientificApproval,false);
 for(const age of ages){const d=data[id].ageText[age],intro=d.lines.join(" "),audio=topic+". "+intro;
  assert.equal(d.lines.length,4);assert.equal(d.intro,intro);assert.equal(d.audioScript,audio);
  for(const[kind,text]of [["intro",intro],["audio",audio]])assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&x.text===text),id+"/"+age+"/"+kind);
  d.lines.forEach((text,index)=>assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind==="line"&&x.index===index&&x.text===text),id+"/"+age+"/"+index));
 }
}
console.log("Editorial 155–158: 4 original lesson IDs, 12 age editions, 76 matching text contexts, 0 approvals.");
