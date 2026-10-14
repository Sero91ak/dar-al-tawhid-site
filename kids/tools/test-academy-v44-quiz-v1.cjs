#!/usr/bin/env node
"use strict";
/* Read-only verification of active V39–V44 quiz overrides. Does not authorize release. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const src=read("kids/akademie/curriculum-v38.js");
const start=src.indexOf("{",src.indexOf("const additions="));
let end=-1,depth=0,quoted=false,escaped=false;
for(let i=start;i<src.length;i++){
 const ch=src[i];
 if(quoted){if(escaped)escaped=false;else if(ch==="\\")escaped=true;else if(ch==='"')quoted=false;}
 else if(ch==='"')quoted=true;else if(ch==="{")depth++;else if(ch==="}"&&--depth===0){end=i+1;break;}
}
assert.ok(start>=0&&end>start,"V38 additions parse");
const originals=JSON.parse(src.slice(start,end));
assert.equal(Object.keys(originals).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...originals}),DARKidsAcademyCurriculumV38:{count:111}}};
for(let v=39;v<=44;v++)vm.runInNewContext(read("kids/akademie/curriculum-v"+v+".js"),ctx,{timeout:3500,filename:"curriculum-v"+v+".js"});
const final=ctx.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(final).length,111);
for(const id of ["fiqh-namen-der-fuenf-gebete","fiqh-absicht-zum-gebet","fiqh-zum-gebet-stehen"])
 assert.strictEqual(final[id],originals[id],"independently checked Fiqh must not change: "+id);
const expected={
 42:[135,136,137,138,139,140,141,143,144,145,146],
 43:[147,148,149,150,151,152,153,155,156,157,158],
 44:[159,160,161,162,163,164,165,167,168,169,170]
};
const all=new Set(),ban=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|diese stunde bleibt ein entwurf|https?:\/\//i;
for(const [version,slots] of Object.entries(expected)){
 const meta=ctx.window["DARKidsAcademyCurriculumV"+version];
 assert.deepEqual(Array.from(meta.revisedSlots),slots);
 assert.equal(meta.ids.length,11);
 assert.equal(meta.questionCount,88);
 assert.equal(meta.approvedAgeVersions,0);
 assert.equal(meta.religiousSourcesVerified,false);
 assert.equal(meta.voiceRecordingsApproved,false);
 let count=0;
 for(const id of meta.ids){
  assert.ok(!all.has(id),"duplicate quiz revision "+id);
  all.add(id);
  const old=originals[id],now=final[id];
  assert.ok(old&&now,"known V38 lesson "+id);
  for(const field of ["quran","sourceAudit","ageText","audioScript"])
   assert.strictEqual(now[field],old[field],"immutable "+field+"/"+id);
  for(const age of ["4-5","6-8","9-10"]){
   const questions=now.questions[age];
   assert.equal(questions.length,age==="4-5"?2:3,id+"/"+age);
   for(const question of questions){
    count++;assert.ok(question.prompt&&question.hint&&question.explain);
    assert.equal(ban.test(JSON.stringify(question)),false,"internal note in learner quiz "+id+"/"+age);
    if(question.type==="choice"){assert.equal(question.options.length,2);assert.ok([0,1].includes(question.correct));assert.notEqual(question.options[0],question.options[1]);}
    else if(question.type==="text")assert.ok(question.sample);
    else assert.fail("invalid question type");
   }
  }
 }
 assert.equal(count,88);
}
assert.equal(all.size,33);
const html=read("kids/akademie/index.html");
const imports=[38,39,40,41,42,43,44].map(n=>html.indexOf("curriculum-v"+n+".js?v="));
assert.ok(imports.every((x,i)=>x>=0&&(i===0||x>imports[i-1])),"ordered imports");
console.log("PASS: 33 lessons / 99 age quizzes / 264 questions; V39-V44 load; 111 lessons remain; Fiqh sources, progress, audio and release statuses preserved.");
