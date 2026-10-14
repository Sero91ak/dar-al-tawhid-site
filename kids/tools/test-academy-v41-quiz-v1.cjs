#!/usr/bin/env node
"use strict";
/* Read-only regression of V39–V41 age-graded quizzes. No audio, network or deploy. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const v38=read("kids/akademie/curriculum-v38.js");
const first=v38.indexOf("{",v38.indexOf("const additions=")),last=v38.indexOf("\n};\nfor(const [id,l]",first);
assert.ok(first>=0&&last>first);
const originals=JSON.parse(v38.slice(first,last+2));
assert.equal(Object.keys(originals).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...originals}),DARKidsAcademyCurriculumV38:{count:111}}};
for(const version of [39,40,41])
 vm.runInNewContext(read("kids/akademie/curriculum-v"+version+".js"),ctx,{timeout:1500});
const combined=ctx.window.DARKidsAcademyCurriculum;
const ids=[39,40,41].flatMap(v=>ctx.window["DARKidsAcademyCurriculumV"+v].ids);
assert.equal(ids.length,36);assert.equal(new Set(ids).size,36);
assert.equal(Object.keys(combined).length,111);
let count=0;
const ban=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|dies(?:e|er) stunde bleibt ein entwurf|https?:\/\//i;
for(const id of ids){
 const old=originals[id],current=combined[id];
 assert.ok(old&&current,id);
 assert.notStrictEqual(current,old);
 assert.strictEqual(current.sourceAudit,old.sourceAudit,"sources unchanged "+id);
 assert.strictEqual(current.quran,old.quran,"original Qurʾān unchanged "+id);
 assert.strictEqual(current.ageText,old.ageText,"spoken lessons unchanged "+id);
 for(const age of ["4-5","6-8","9-10"]){
  const questions=current.questions[age],wanted=age==="4-5"?2:3;
  assert.equal(questions.length,wanted,id+"/"+age);
  for(const q of questions){
   count++;
   assert.ok(q.prompt&&q.explain&&q.hint);
   assert.ok(!ban.test(JSON.stringify(q)),id+"/"+age+" leaked meta");
   if(q.type==="choice"){assert.equal(q.options.length,2);assert.ok([0,1].includes(q.correct));assert.notEqual(q.options[0],q.options[1]);}
   else if(q.type==="text")assert.ok(q.sample);
   else assert.fail("bad question type");
  }
 }
}
for(const [id,original]of Object.entries(originals))if(!ids.includes(id))
 assert.strictEqual(combined[id],original,"unrevised lesson not changed");
for(const v of [39,40,41]){
 const meta=ctx.window["DARKidsAcademyCurriculumV"+v];
 assert.equal(meta.religiousSourcesVerified,false);
 assert.equal(meta.approvedAgeVersions,0);
 assert.equal(meta.voiceRecordingsApproved,false);
}
const html=read("kids/akademie/index.html"),positions=[38,39,40,41].map(v=>html.indexOf("curriculum-v"+v+".js?v="));
assert.ok(positions.every(x=>x>0)&&positions.every((x,i)=>i===0||x>positions[i-1]),"import order");
console.log("PASS: 111 lessons retained; 36 quiz revisions / "+count+" questions; Qurʾān, sources and spoken lesson scripts preserved.");
