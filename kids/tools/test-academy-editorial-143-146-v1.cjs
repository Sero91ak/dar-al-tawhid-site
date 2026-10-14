/* node kids/tools/test-academy-editorial-143-146-v1.cjs */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const base=path.resolve(__dirname,"..");
const index=fs.readFileSync(path.join(base,"akademie/index.html"),"utf8");
const editorial="curriculum-editorial-143-146-v1.js";
assert(index.includes(editorial),"editorial script missing from index");
assert(index.indexOf("curriculum-editorial-142-v1.js")<index.indexOf(editorial),"wrong editorial order");
const original={};
const ids=["quran-was-bedeutet-sunnah","sirah-hijrah-madinah","dua-beim-verlassen-des-hauses","family-unterschiedliche-herkunft"];
const ages=["4-5","6-8","9-10"];
for(const id of ids){original[id]={topic:id,sourceAudit:{scientificApproval:false},ageText:Object.fromEntries(ages.map(age=>[age,{goal:"previous",intro:"previous",lines:[]}])),questions:{sentinel:true},quran:{sentinel:true}};}
const window={DARKidsAcademyCurriculum:original,DARKidsAcademyCurriculumEditorial142:true};
vm.runInNewContext(fs.readFileSync(path.join(base,"akademie",editorial),"utf8"),{window});
const output=window.DARKidsAcademyCurriculum;
assert.equal(window.DARKidsAcademyCurriculumEditorial143146.ageVersionCount,12);
const voice=JSON.parse(fs.readFileSync(path.join(base,"data/academy-voice-editorial-143-146-delta-v1.json"),"utf8"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
for(const id of ids){
 assert(output[id].questions.sentinel&&output[id].quran.sentinel,"canonical contents changed");
 assert.equal(output[id].sourceAudit.scientificApproval,false);
 for(const age of ages){
  const data=output[id].ageText[age];
  assert.equal(data.lines.length,4,id+"/"+age);
  assert(data.lines.every(t=>t.length>60));
  assert.equal(data.intro,data.lines.join(" "));
  assert.equal(data.audioScript,id+". "+data.intro);
  assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind==="intro"&&x.text===data.intro));
  assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind==="audio"&&x.text===data.audioScript));
  for(const [index,text] of data.lines.entries())assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind==="line"&&x.index===index&&x.text===text));
 }
}
console.log("Editorial 143–146: 4 lessons, 12 ages, 76 text contexts, zero approval");
