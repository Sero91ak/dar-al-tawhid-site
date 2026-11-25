#!/usr/bin/env node
"use strict";
// Read-only test: no synthesis and no publication.
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),path=require("node:path"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const s=vm.createContext({window:{}});
for(const f of ["curriculum-v1.js","answer-choice-only-v1.js","term-coach-v24.js"])
 new vm.Script(read("kids/akademie/"+f),{filename:f}).runInContext(s);
const l=s.window.DARKidsAcademyCurriculum["adab-worte"];
const plan=JSON.parse(read("kids/data/academy-topic-batches/adab-worte-editorial-preflight-v1.json"));
const manifest=JSON.parse(read("kids/data/academy-audio.json")).entries;
assert.equal(l.quran.surah,17);assert.equal(l.quran.ayah,53);assert.match(l.hadith.source,/6018/);
const texts=new Set();
const add=t=>texts.add(t.trim());
for(const age of plan.ageBands){
 const original=l.questions[age], before=JSON.stringify(original);
 const qs=s.window.DARKidsAcademyChoiceOnlyV1.project(l,age,original);
 assert.equal(qs.length,original.length);
 for(let i=0;i<qs.length;i++){
  const q=qs[i];assert.equal(q.type,"choice");assert.equal(q.options.length,2);
  assert.ok(q.correct>=0&&q.correct<q.options.length);
  const override=plan.candidateChoiceOverrides.find(x=>x.age===age&&x.index===i);
  if(override){assert.equal(q.prompt,override.prompt);assert.equal(JSON.stringify(q.options),JSON.stringify(override.options));assert.equal(q.approvedForAudio,false);}
  add(q.prompt);q.options.forEach((v,j)=>add("Antwort "+(j+1)+": "+v));
 }
 assert.equal(JSON.stringify(original),before);
 const a=l.ageText?.[age];
 add(l.lead);add(a?.intro||l.lead+" "+l.goal);
 (a?.lines||l.lines).forEach(add);
 add(a?.evidence||"Qurʾān: "+l.quran.meaning+" Sunnah: "+l.hadith.text);
 [l.goal,l.quran.meaning+" "+l.hadith.text,l.sample].forEach(add);
 const g=s.window.DARKidsAcademyTermCoach;
 for(const section of ["lesson","sources"])for(const term of g.termsFor(l,age,7,section))add(g.phrase(term,age));
}
assert.deepEqual([...texts].sort(),plan.entries.map(e=>e.visibleText).sort(),"Static phrase inventory drift");
for(const t of ["As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.","Lieber Bruder.","Liebe Schwester.","Schön, dass du da bist!","Schön, dass du heute mitlernst!","Schön, dass du dein Wissen heute erweiterst!"]){
 const e=manifest[t];assert.ok(e?.approvedForPlayback&&e.modelId==="eleven_v4"&&e.voiceId==="DkU7j9uO4ZEtLD2iRZSH");
 assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.resolve(ROOT,e.url.replace(/^\/+/, "")))).digest("hex"),e.sha256);
}
let verified=0,missing=[];
for(const t of texts){
 const e=manifest[t];
 if(!e||!e.approvedForPlayback||e.modelId!=="eleven_v4"||e.voiceId!=="DkU7j9uO4ZEtLD2iRZSH"||!e.url||!e.sha256){missing.push(t);continue;}
 const f=path.resolve(ROOT,e.url.replace(/^\/+/, ""));
 assert.ok(f.startsWith(ROOT+path.sep),"Unsafe media path");
 assert.equal(crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"),e.sha256,"Existing V4 clip SHA mismatch: "+t);
 verified++;
}
console.log(JSON.stringify({topic:"adab-worte",staticPhrases:texts.size,existingMediaShaVerified:verified,missing,syntheticQuran:false,newPaidRequests:0,browserPlaybackVerified:false},null,2));
if(process.argv.includes("--require-complete"))assert.equal(missing.length,0,"Incomplete audio release: do not publish");
