#!/usr/bin/env node
"use strict";
/* TAWḤĪD KIDS: content-only V30 invariant checks. No network, TTS, UI or credentials. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const academy=path.resolve(__dirname,"../akademie");
const files=["v1","v2","v22","v25","v26","v27","v28","v29"];
const src=files.map(v=>fs.readFileSync(path.join(academy,"curriculum-"+v+".js"),"utf8"));
const oldLast=src[7].replace(/\/\* TAWḤĪD KIDS · Curriculum Content V30:[\s\S]*?window\.DARKidsAcademyCurriculum=Object\.freeze\(\{\.\.\.prior,\.\.\.additions,\.\.\.editorialAdditionsV30\}\);/, "window.DARKidsAcademyCurriculum=Object.freeze({...prior,...additions});");
assert.notEqual(oldLast,src[7],"V30 content patch not loaded");
function boot(filesToLoad){
 const context={window:{}};
 for(const s of filesToLoad)vm.runInNewContext(s,context,{timeout:12000});
 return context.window.DARKidsAcademyCurriculum;
}
const original=boot([...src.slice(0,7),oldLast]);
const changed=boot(src);
const ages=["4-5","6-8","9-10"],totals={"4-5":0,"6-8":0,"9-10":0};
assert.deepEqual(Object.keys(changed).sort(),Object.keys(original).sort(),"Lesson IDs changed");
let newAgeText=0,modified=0,questionCount=0,duplicates=0;
for(const [id,l] of Object.entries(changed)){
 const prev=original[id];
 assert.equal(l.id,id);
 assert.equal(l.subject,prev.subject);
 assert.equal(l.topic,prev.topic);
 assert.equal(l.title,prev.title);
 assert.equal(l.lead,prev.lead);
 assert.equal(l.goal,prev.goal);
 assert.equal(l.sourceLesson,prev.sourceLesson);
 assert.equal(JSON.stringify(l.quran),JSON.stringify(prev.quran),"Qurʾān drift: "+id);
 assert.equal(JSON.stringify(l.hadith),JSON.stringify(prev.hadith),"Hadith drift: "+id);
 assert.equal(JSON.stringify(l.sourceAudit),JSON.stringify(prev.sourceAudit),"sourceAudit drift: "+id);
 assert.equal(JSON.stringify(l.lines),JSON.stringify(prev.lines),"original lesson lines altered: "+id);
 assert.equal(JSON.stringify(l.voiceApproved),JSON.stringify(prev.voiceApproved),"audio approval drift: "+id);
 if(!prev.ageText&&l.ageText)newAgeText++;
 for(const age of ages){
  assert.equal(l.questions[age].length,age==="4-5"?2:3,"Question slot count drift "+id+" "+age);
  assert.equal(l.ageText[age].lines.length,4,"Age-specific lesson lines missing: "+id+" "+age);
  assert.ok(l.ageText[age].intro.length>10&&l.ageText[age].evidence.length>20);
  const prompts=[];
  for(let i=0;i<l.questions[age].length;i++){
    const q=l.questions[age][i],old=prev.questions[age][i];
    totals[age]++;questionCount++;
    assert.ok(q.prompt.trim().length>8,"Missing question text: "+id+" "+age+" #"+i);
    assert.ok(q.hint?.trim().length>5,"Missing help hint: "+id+" "+age+" #"+i);
    assert.equal(q.type,old.type,"Question type drift: "+id+" "+age+" #"+i);
    assert.ok(["choice","text"].includes(q.type),"Unknown type: "+id+" "+age);
    if(q.type==="choice"){
      assert.ok(Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=3);
      assert.ok(q.options.every(x=>typeof x==="string"&&x.trim().length>1));
      assert.equal(new Set(q.options).size,q.options.length,"Duplicate answers: "+id);
      assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
      assert.ok(q.explain?.trim().length>5);
    } else assert.ok(q.sample?.trim().length>7,"Missing teacher sample: "+id);
    prompts.push(q.prompt);
    if(JSON.stringify(q)!==JSON.stringify(old))modified++;
  }
  duplicates+=prompts.length-new Set(prompts).size;
 }
}
assert.equal(Object.keys(changed).length,65);
assert.equal(questionCount,520);
assert.deepEqual(totals,{"4-5":130,"6-8":195,"9-10":195});
assert.equal(newAgeText,33);
assert.equal(modified,295);
assert.equal(duplicates,0,"Repeated question within same lesson and age");
for(const [id,lesson] of Object.entries(changed)){
 for(const q of lesson.questions["4-5"]){
  const corpus=[q.prompt,...(q.options||[])].join(" ");
  assert.ok(!/Ich (darf|muss) andere absichtlich verletzen|Ein Spielzeugauto|Ein Getränk/.test(corpus),"Unsuitable preschool distractor "+id);
 }
 for(const age of ages)for(const q of lesson.questions[age]){
  assert.ok(!q.sample?.includes(".."),"Doubled punctuation in sample "+id+" "+age);
 }
}
assert.equal(changed["aqidah-iman-die-engel"].questions["6-8"][1].type,"text");
assert.ok(changed["aqidah-iman-die-engel"].questions["6-8"][1].prompt.includes("obwohl wir sie nicht sehen"));

const html=fs.readFileSync(path.join(academy,"index.html"),"utf8");
for(const v of files)assert.ok(html.includes("/kids/akademie/curriculum-"+v+".js"),"Loader missing "+v);
assert.ok(html.includes("const exercises="),"Original separate Ṣidq classroom entry missing");
assert.ok(!src[7].includes("ElevenLabs")&&!src[7].includes("generateAudio("),"Audio generation not permitted");
console.log("PASS · 65 existing curriculum lessons + independent Ṣidq = 66");
console.log("PASS · 520 curriculum questions + 8 Ṣidq = 528; 295 changed question slots; 33 new age-text sets");
console.log("PASS · all original IDs, ordering, Qurʾān, Hadith, lesson sources and audio-approval values invariant");
console.log("PASS · no new app loader, layout, storage model, API, TTS or navigation changes");
console.log("SOURCE REVIEW STILL REQUIRED: this structural test does not authenticate Qurʾān/Hadith text.");
