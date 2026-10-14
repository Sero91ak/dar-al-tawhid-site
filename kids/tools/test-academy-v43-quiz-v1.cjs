#!/usr/bin/env node
"use strict";
/* Tests V42–V43 independent age-based quiz modules. Draft data only. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const src=read("kids/akademie/curriculum-v38.js");
const start=src.indexOf("{",src.indexOf("const additions="));
let end=-1,depth=0,quote=false,escape=false;
for(let i=start;i<src.length;i++){
 const ch=src[i];
 if(quote){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch==='"')quote=false;}
 else if(ch==='"')quote=true;else if(ch==="{")depth++;else if(ch==="}"&&--depth===0){end=i+1;break;}
}
assert.ok(end>start,"V38 additions parse");
const originals=JSON.parse(src.slice(start,end));
assert.equal(Object.keys(originals).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...originals}),DARKidsAcademyCurriculumV38:{count:111}}};
for(let v=39;v<=43;v++)vm.runInNewContext(read("kids/akademie/curriculum-v"+v+".js"),ctx,{timeout:3000,filename:"curriculum-v"+v+".js"});
const final=ctx.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(final).length,111);
assert.strictEqual(final["fiqh-absicht-zum-gebet"],originals["fiqh-absicht-zum-gebet"],"independently source-reviewed Fiqh slot 154 untouched");
assert.strictEqual(final["fiqh-namen-der-fuenf-gebete"],originals["fiqh-namen-der-fuenf-gebete"],"Fiqh slot 142 untouched");
const all=new Set(),ban=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|diese stunde bleibt ein entwurf|https?:\/\//i;
for(const [version,slots] of [[42,[135,136,137,138,139,140,141,143,144,145,146]],[43,[147,148,149,150,151,152,153,155,156,157,158]]]){
 const meta=ctx.window["DARKidsAcademyCurriculumV"+version];
 assert.deepEqual(Array.from(meta.revisedSlots),slots);
 assert.equal(meta.ids.length,11);
 assert.equal(meta.questionCount,88);
 assert.equal(meta.approvedAgeVersions,0);
 assert.equal(meta.religiousSourcesVerified,false);
 assert.equal(meta.voiceRecordingsApproved,false);
 let count=0;
 for(const id of meta.ids){
  assert.ok(!all.has(id),"no overlapping quiz overrides: "+id);
  all.add(id);
  const old=originals[id],current=final[id];
  assert.ok(old&&current,"known lesson "+id);
  for(const key of ["quran","sourceAudit","ageText","audioScript"])
   assert.strictEqual(current[key],old[key],key+" unchanged: "+id);
  for(const age of ["4-5","6-8","9-10"]){
   const questions=current.questions[age];
   assert.equal(questions.length,age==="4-5"?2:3,id+"/"+age);
   for(const q of questions){
    count++;assert.ok(q.prompt&&q.hint&&q.explain,id+"/"+age);
    assert.equal(ban.test(JSON.stringify(q)),false,"editorial metadata in quiz: "+id);
    if(q.type==="choice"){assert.equal(q.options.length,2);assert.ok([0,1].includes(q.correct));assert.notEqual(q.options[0],q.options[1]);}
    else if(q.type==="text")assert.ok(q.sample);
    else assert.fail("invalid quiz type: "+q.type);
   }
  }
 }
 assert.equal(count,88);
}
const html=read("kids/akademie/index.html");
const order=[38,39,40,41,42,43].map(n=>html.indexOf("curriculum-v"+n+".js?v="));
assert.ok(order.every((x,i)=>x>=0&&(i===0||x>order[i-1])),"ordered imports V38–V43");
console.log("PASS: V42+V43: 22 lessons / 66 age quiz blocks / 176 questions; Fiqh 142+154, sources, audio and release statuses untouched.");
