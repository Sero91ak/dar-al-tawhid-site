#!/usr/bin/env node
"use strict";
/* Non-mutating V42–V47 quiz regression. Run: node kids/tools/test-academy-v47-quiz-v1.cjs */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const src=read("kids/akademie/curriculum-v38.js");
const start=src.indexOf("{",src.indexOf("const additions="));
let end=-1,depth=0,quoted=false,escape=false;
for(let i=start;i<src.length;i++){
 const ch=src[i];
 if(quoted){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch==='"')quoted=false;}
 else if(ch==='"')quoted=true;else if(ch==="{")depth++;else if(ch==="}"&&--depth===0){end=i+1;break;}
}
assert.ok(start>=0&&end>start,"V38 additions parse");
const originals=JSON.parse(src.slice(start,end));
assert.equal(Object.keys(originals).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...originals}),DARKidsAcademyCurriculumV38:{count:111}}};
for(let version=39;version<=47;version++)
 vm.runInNewContext(read("kids/akademie/curriculum-v"+version+".js"),ctx,{timeout:3500,filename:"curriculum-v"+version+".js"});
const curriculum=ctx.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(curriculum).length,111);
const sets={
 42:[135,136,137,138,139,140,141,143,144,145,146],
 43:[147,148,149,150,151,152,153,155,156,157,158],
 44:[159,160,161,162,163,164,165,167,168,169,170],
 45:[171,172,173,175,176,177,178,179,181,182],
 46:[183,184,185,187,188,189,190,191,193,194],
 47:[195,196,197,199,200,202,203]
};
const immutableFiqh=["fiqh-namen-der-fuenf-gebete","fiqh-absicht-zum-gebet","fiqh-zum-gebet-stehen",
 "fiqh-takbirat-al-ihram","fiqh-quran-rezitation-im-gebet","fiqh-ruku-kennenlernen",
 "fiqh-aus-dem-ruku-aufrichten","fiqh-sujud","fiqh-zwischen-niederwerfungen-sitzen"];
for(const id of immutableFiqh)assert.strictEqual(curriculum[id],originals[id],"Fiqh excluded: "+id);
const all=new Set(),ban=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|diese stunde bleibt ein entwurf|https?:\/\//i;
let total=0;
for(const [ver,slots] of Object.entries(sets)){
 const meta=ctx.window["DARKidsAcademyCurriculumV"+ver];
 assert.deepEqual(Array.from(meta.revisedSlots),slots);
 assert.equal(meta.ids.length,slots.length);
 assert.equal(meta.questionCount,slots.length*8);
 assert.equal(meta.approvedAgeVersions,0);
 assert.equal(meta.religiousSourcesVerified,false);
 assert.equal(meta.voiceRecordingsApproved,false);
 for(const id of meta.ids){
  assert.ok(!all.has(id),"lesson revised twice: "+id);all.add(id);
  const a=originals[id],b=curriculum[id];
  assert.ok(a&&b,"known lesson "+id);
  for(const k of ["quran","sourceAudit","ageText","audioScript"])
   assert.strictEqual(b[k],a[k],"preserved "+k+" for "+id);
  for(const age of ["4-5","6-8","9-10"]){
   const questions=b.questions[age],wanted=age==="4-5"?2:3;
   assert.equal(questions.length,wanted,id+"/"+age);
   for(const q of questions){
    total++;assert.ok(q.prompt&&q.hint&&q.explain,id+"/"+age);
    assert.equal(ban.test(JSON.stringify(q)),false,"internal memo in quiz "+id+"/"+age);
    if(q.type==="choice"){assert.equal(q.options.length,2);assert.ok([0,1].includes(q.correct));assert.notEqual(q.options[0],q.options[1]);}
    else if(q.type==="text")assert.ok(q.sample);
    else assert.fail("bad question type "+q.type);
   }
  }
 }
}
assert.equal(all.size,60);
assert.equal(total,480);
const html=read("kids/akademie/index.html");
const imports=Array.from({length:10},(_,i)=>i+38).map(n=>html.indexOf("curriculum-v"+n+".js?v="));
assert.ok(imports.every((x,i)=>x>=0&&(i===0||x>imports[i-1])),"V38–V47 import order");
console.log("PASS: V42–V47, 60 lessons, 180 age quiz blocks, 480 new questions; 111 V38 lessons retained, Fiqh unchanged; release/audio flags false.");
