#!/usr/bin/env node
"use strict";
/* 1664 question end-to-end parity between live choice display and no-cost V4
 * speech planning. Never generates files, reads child storage or spends credits. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("kids/akademie/index.html");
assert(!html.includes('id="answer"')&&!html.includes("getUserMedia")&&!html.includes("MediaRecorder"));
const a=html.indexOf("function academySelectableQuestion("),ae=html.indexOf("\nconst questions=()=>",a);
const b=html.indexOf("function academyDisplayChoices("),be=html.indexOf("\nfunction showQuestion()",b);
assert(a>0&&ae>a&&b>0&&be>b,"Live choice helpers missing");
const client=vm.createContext({});
vm.runInContext(html.slice(a,ae)+"\n"+html.slice(b,be)+
 "\nglobalThis.convert=academySelectableQuestion;globalThis.order=academyDisplayChoices;",client);
const plan=read("kids/tools/export-academy-208-v4-dedup-plan.cjs");
const p=plan.indexOf("function selectable("),pe=plan.indexOf("const ageList=",p);
assert(p>0&&pe>p,"Voice plan helper missing");
const generator=vm.createContext({});
vm.runInContext(plan.slice(p,pe)+"\nglobalThis.convert=selectable;globalThis.order=display;",generator);
const cur=vm.createContext({window:{}});
for(const v of ["v1","v2","v22","v25","v26","v27","v28","v29"])
 vm.runInContext(read("kids/akademie/curriculum-"+v+".js"),cur,{timeout:10000});
for(const c of ["67-90","91-114","115-138","139-162","163-186","187-208"])
 vm.runInContext(read("kids/akademie/editorial-v31/curriculum-v31-"+c+".js"),cur,{timeout:10000});
const lessons=[...Object.values(cur.window.DARKidsAcademyCurriculum),
 ...Object.values(cur.window.DARKidsAcademyEditorialV31)];
assert.equal(lessons.length,207);
let matched=0,legacy=0,inlineSidqText=0,newReview=0;
const compare=(q,lesson,age,i,id)=>{
 const app=client.convert(q,lesson,age);
 const audio=generator.convert(q,lesson,age);
 const json=x=>JSON.stringify(x);
 assert.equal(json(audio.options),json(app.options),id+" "+age+": audio buttons differ from UI");
 assert.equal(audio.prompt,app.prompt,id+" "+age+": question voice differs from UI");
 assert.equal(audio.correct,app.correct,id+" "+age+": answer grading differs");
 const scope=id+":"+age;
 const spoken=generator.order(audio,i,scope).map(x=>x.text);
 const visible=client.order(app,i,scope).map(x=>x.text);
 assert.equal(json(spoken),json(visible),id+" "+age+": answer voice order differs");
 if(q.type==="text"){legacy++;if(id==="sidq")inlineSidqText++;}
 if(q.editorialReviewStatus==="pending-human-review")newReview++;
 matched++;
};
for(const l of lessons)for(const age of ["4-5","6-8","9-10"])
 for(const [i,q] of l.questions[age].entries())compare(q,l,age,i,l.id);
const start=html.indexOf("const exercises={"),end=html.indexOf("\nlet id=",start);
assert(start>0&&end>start);
vm.runInContext(html.slice(start,end)+"\nglobalThis.sidq=exercises;",cur,{timeout:2500});
for(const age of ["4-5","6-8","9-10"])
 for(const [i,q] of cur.sidq[age].entries())compare(q,null,age,i,"sidq");
assert.equal(matched,1664);assert.equal(legacy,198);assert.equal(inlineSidqText,3);assert.equal(legacy-inlineSidqText,195);assert.equal(newReview,426);
console.log("PASS: all 1664 question scripts and deterministic displayed answer orders match V4 plan.");
console.log("PASS: no child microphone/keyboard, 198 legacy (195 modular + 3 Sidq) and 426 editorial review choices retained.");
