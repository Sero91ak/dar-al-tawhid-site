#!/usr/bin/env node
"use strict";
/* V39/V40 content regression; offline, read-only, zero audio expenditure. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const base=read("kids/akademie/curriculum-v38.js");
const st=base.indexOf("{",base.indexOf("const additions=")),en=base.indexOf("\n};\nfor(const [id,l]",st);
assert.ok(st>0&&en>st,"V38 additions must be available");
const original=JSON.parse(base.slice(st,en+2));assert.equal(Object.keys(original).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...original}),DARKidsAcademyCurriculumV38:{count:111}}};
for(const version of [39,40])
 vm.runInNewContext(read("kids/akademie/curriculum-v"+version+".js"),ctx,{timeout:1200,filename:"curriculum-v"+version+".js"});
const current=ctx.window.DARKidsAcademyCurriculum;
const ids=[...ctx.window.DARKidsAcademyCurriculumV39.ids,...ctx.window.DARKidsAcademyCurriculumV40.ids];
assert.equal(new Set(ids).size,24,"24 distinct lessons revised");
assert.equal(Object.keys(current).length,111,"all 111 lessons preserved");
let checked=0;
for(const id of ids){
 const before=original[id],after=current[id];
 assert.ok(before&&after,"lesson present "+id);
 assert.notStrictEqual(after,before,"quiz overrides active "+id);
 assert.strictEqual(after.ageText,before.ageText,"spoken content preserved "+id);
 assert.strictEqual(after.sourceAudit,before.sourceAudit,"source provenance preserved "+id);
 assert.strictEqual(after.quran,before.quran,"Arabic wording unchanged "+id);
 for(const age of ["4-5","6-8","9-10"]){
  const quizzes=after.questions[age];
  assert.equal(quizzes.length,age==="4-5"?2:3,"quiz count "+id+"/"+age);
  for(const quiz of quizzes){
   checked++;
   assert.ok(quiz.prompt&&quiz.hint&&quiz.explain,"complete feedback "+id+"/"+age);
   assert.ok(!/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|https?:\/\//i.test(JSON.stringify(quiz)),"child-safe quiz "+id+"/"+age);
   if(quiz.type==="choice"){
    assert.equal(quiz.options.length,2);
    assert.ok([0,1].includes(quiz.correct));
    assert.notEqual(quiz.options[0],quiz.options[1]);
   }else if(quiz.type==="text")assert.ok(quiz.sample);
   else assert.fail("unknown quiz type "+quiz.type);
  }
 }
}
for(const [id,lesson] of Object.entries(original))if(!ids.includes(id))
 assert.strictEqual(current[id],lesson,"unreviewed lesson remains unchanged "+id);
for(const v of [39,40]){
 const meta=ctx.window["DARKidsAcademyCurriculumV"+v];
 assert.equal(meta.approvedAgeVersions,0);
 assert.equal(meta.religiousSourcesVerified,false);
 assert.equal(meta.voiceRecordingsApproved,false);
}
const html=read("kids/akademie/index.html");
const positions=[38,39,40].map(v=>html.indexOf("curriculum-v"+v+".js?v="));
assert.ok(positions.every(x=>x>0)&&positions[0]<positions[1]&&positions[1]<positions[2],"scripts load in correct order");
console.log("PASS: 111 lessons preserved; 24 lessons and "+checked+" age-specific questions redacted and revised; sources/voices unchanged.");
