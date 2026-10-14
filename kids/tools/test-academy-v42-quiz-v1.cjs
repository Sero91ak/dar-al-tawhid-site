#!/usr/bin/env node
"use strict";
/* Draft-only V42 quiz regression. No external calls, audio generation or deploy. */
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
assert.ok(start>=0&&end>start,"V38 lesson additions must parse");
const originals=JSON.parse(src.slice(start,end));
assert.equal(Object.keys(originals).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...originals}),DARKidsAcademyCurriculumV38:{count:111}}};
for(const v of [39,40,41,42]){
 const filename="kids/akademie/curriculum-v"+v+".js";
 vm.runInNewContext(read(filename),ctx,{timeout:3000,filename});
}
const expectedSlots=[135,136,137,138,139,140,141,143,144,145,146];
const status=ctx.window.DARKidsAcademyCurriculumV42;
assert.deepEqual(Array.from(status.revisedSlots),expectedSlots);
assert.equal(status.ids.length,11);
assert.equal(status.questionCount,88);
assert.equal(status.religiousSourcesVerified,false);
assert.equal(status.voiceRecordingsApproved,false);
assert.equal(status.approvedAgeVersions,0);
const now=ctx.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(now).length,111);
assert.strictEqual(now["fiqh-namen-der-fuenf-gebete"],originals["fiqh-namen-der-fuenf-gebete"],"source-reviewed Fiqh 142 unchanged");
let total=0,choices=0,texts=0,positions=[0,0];
const ban=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|diese stunde bleibt ein entwurf|https?:\/\//i;
for(const id of status.ids){
 const current=now[id],old=originals[id];
 assert.ok(current&&old,"known V38 lesson: "+id);
 assert.strictEqual(current.quran,old.quran,"no Qurʾān changes: "+id);
 assert.strictEqual(current.sourceAudit,old.sourceAudit,"no source status changes: "+id);
 assert.strictEqual(current.ageText,old.ageText,"no spoken lesson edits: "+id);
 assert.strictEqual(current.audioScript,old.audioScript,"no audio plan edits: "+id);
 for(const age of ["4-5","6-8","9-10"]){
  const qs=current.questions[age],wanted=age==="4-5"?2:3;
  assert.equal(qs.length,wanted,id+"/"+age);
  for(const q of qs){
   total++;
   assert.ok(q.prompt&&q.hint&&q.explain,id+"/"+age);
   assert.equal(ban.test(JSON.stringify(q)),false,"internal reviewer copy: "+id+"/"+age);
   if(q.type==="choice"){
    choices++;assert.equal(q.options.length,2);
    assert.ok([0,1].includes(q.correct));
    assert.notEqual(q.options[0],q.options[1]);
    positions[q.correct]++;
   }else if(q.type==="text"){
    texts++;assert.ok(q.sample);
   }else assert.fail("Unsupported question format");
  }
 }
}
assert.equal(total,88);
assert.equal(choices,55);
assert.equal(texts,33);
assert.ok(positions[0]>0&&positions[1]>0,"vary correct answer order");
const html=read("kids/akademie/index.html");
const order=[38,39,40,41,42].map(n=>html.indexOf("curriculum-v"+n+".js?v="));
assert.ok(order.every(x=>x>=0)&&order.every((x,i)=>i===0||x>order[i-1]),"ordered imports");
console.log("PASS: V42 revisions: 11 lessons / 33 age blocks / "+total+" questions. No source, history, progress, audio or release status changed.");
