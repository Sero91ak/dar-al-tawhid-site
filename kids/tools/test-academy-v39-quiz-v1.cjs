#!/usr/bin/env node
"use strict";
/* Offline data and UI-order regression for editorial V39 quiz revision. No audio or deployment. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const v38=fs.readFileSync(path.join(root,"kids/akademie/curriculum-v38.js"),"utf8");
const beginning=v38.indexOf("{",v38.indexOf("const additions="));
const ending=v38.indexOf("\n};\nfor(const [id,l]",beginning);
assert.ok(beginning>0 && ending>beginning,"V38 lesson JSON boundary must exist");
const originals=JSON.parse(v38.slice(beginning,ending+2));
assert.equal(Object.keys(originals).length,111);
const prior=Object.freeze({...originals});
const context={window:{DARKidsAcademyCurriculum:prior,DARKidsAcademyCurriculumV38:{count:111}}};
const v39=fs.readFileSync(path.join(root,"kids/akademie/curriculum-v39.js"),"utf8");
vm.runInNewContext(v39,context,{timeout:1200,filename:"curriculum-v39.js"});
const current=context.window.DARKidsAcademyCurriculum;
const meta=context.window.DARKidsAcademyCurriculumV39;
assert.equal(Object.keys(current).length,111,"all 111 V38 lessons retained");
assert.equal(meta.ids.length,12,"twelve revised lessons");
assert.equal(meta.approvedAgeVersions,0,"must not auto-approve age drafts");
assert.equal(meta.religiousSourcesVerified,false,"must not invent religious approval");
const banned=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|diese stunde bleibt ein entwurf|https?:\/\/|technische vollständigkeit ersetzt/i;
const ages=["4-5","6-8","9-10"];
let checked=0;
for(const id of meta.ids){
 assert.ok(originals[id],"unknown V39 lesson "+id);
 assert.notEqual(current[id],originals[id],"V39 must override "+id);
 assert.strictEqual(current[id].ageText,originals[id].ageText,"V39 must not alter teaching texts");
 assert.strictEqual(current[id].sourceAudit,originals[id].sourceAudit,"V39 must not alter research status");
 for(const age of ages){
  const q=current[id].questions[age],n=age==="4-5"?2:3;
  assert.equal(q.length,n,id+"/"+age+" quiz count");
  for(const question of q){
   checked++;
   assert.ok(question.prompt && question.hint && question.explain,id+"/"+age+" question fields");
   assert.ok(!banned.test(JSON.stringify(question)),id+"/"+age+" hidden internal text");
   if(question.type==="choice"){
    assert.equal(question.options.length,2,id+"/"+age+" choice options");
    assert.ok([0,1].includes(question.correct),id+"/"+age+" correct index");
    assert.notEqual(question.options[0],question.options[1]);
   }else if(question.type==="text") assert.ok(question.sample,id+"/"+age+" response example");
   else assert.fail("unsupported quiz type "+question.type);
  }
 }
}
for(const [id,lesson] of Object.entries(originals))
 if(!meta.ids.includes(id))assert.strictEqual(current[id],lesson,"unreviewed lesson changed "+id);
const html=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
const i38=html.indexOf('curriculum-v38.js?v='),i39=html.indexOf('curriculum-v39.js?v=');
assert.ok(i38>0 && i39>i38,"V39 must load after V38");
console.log("PASS V39: 111/111 V38 IDs retained; 12 revised lessons; "+checked+" individual questions; 0 releases/audio changes.");
