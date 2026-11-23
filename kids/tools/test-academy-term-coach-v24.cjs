#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sandbox=vm.createContext({window:{}});
const helperFile="kids/akademie/term-coach-v24.js";
new vm.Script(read(helperFile),{filename:helperFile}).runInContext(sandbox);
const api=sandbox.window.DARKidsAcademyTermCoach;
const ages=["4-5","6-8","9-10"];
assert.equal(api.version,"v24");assert.equal(api.entries.length,33);
assert.equal(new Set(api.entries.map(x=>x.id)).size,33);
for(const item of api.entries){
 assert.match(item.contentType,/pädagogische Paraphrase/);
 assert.ok(item.source?.reference,"All Arabic concepts must have traceable religious source or marked editorial term origin");
 assert.ok(item.reviewStatus.includes("review"));
 for(const age of ages){
  assert.ok(item.age[age]?.length>=(age==="4-5"?8:12),age+" "+item.id);
  const spoken=api.phrase(item,age);
  assert.ok(spoken&&spoken.length>10,"Every age needs a natural explanation for "+item.id);
  assert.ok(!spoken.includes(item.term+" bedeutet: "+item.term),"Never repeat the same Islamic term within a spoken definition: "+item.id+" "+age);
  assert.ok(spoken.startsWith(item.term)||item.id==="tazkiyah"&&spoken.startsWith("Tazkiyat an-Nafs")||
   item.id==="salam"&&spoken.startsWith("As-salāmu"),"Speak the term naturally: "+item.id+" "+age);
 }
 assert.notEqual(item.age["4-5"],item.age["6-8"]);
 assert.notEqual(item.age["6-8"],item.age["9-10"]);
}
for(const [word,id] of [["Tawḥīd","tawhid"],["Īmān","iman"],["Ikhlāṣ","ikhlas"],["Ṣabr","sabr"],["ʿAqīdah","aqidah"],["Salām","salam"],["Wuḍūʾ","wudu"],["Duʿāʾ","dua"],["Tazkiyah","tazkiyah"],["Aḏkār","dhikr"]]){
 const found=api.termsFor({title:word}, "4-5");
 assert.ok(found.some(e=>e.id===id),"Arabic transliteration must work: "+word);
}
for(const src of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js"]){
 new vm.Script(read(src),{filename:src}).runInContext(sandbox);
}
const lessons=sandbox.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(lessons).length,44);
for(const l of Object.values(lessons))for(const age of ages){
 const found=api.termsFor(l,age);
 assert.ok(found.length>=2&&found.length<=7,"Glossary must be available in every lesson and age: "+l.id+" "+age);
}
const manifest=JSON.parse(read("kids/data/academy-vocabulary-voice-plan-v24.json"));
assert.equal(manifest.termCount,33);assert.equal(manifest.phraseCount,99);
assert.equal(manifest.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
assert.equal(manifest.modelId,"eleven_v4");
assert.equal(manifest.voiceSettingsProfile,"kids_story");
assert.equal(manifest.policy.autoPublishUnreviewed,false);
assert.equal(manifest.phrases.length,99);
assert.equal(new Set(manifest.phrases.map(x=>x.text)).size,99);
assert.ok(manifest.phrases.every(p=>p.reviewStatus==="not-generated"&&!p.url&&p.contexts.length===1));
for(const item of api.entries)for(const age of ages){
 const text=api.phrase(item,age);
 assert.ok(manifest.phrases.some(p=>p.text===text&&p.contexts[0].age===age));
}
const fake={voiceId:manifest.voiceId,voiceProfileId:manifest.voiceProfileId,modelId:manifest.modelId,
 voiceSettingsProfile:manifest.voiceSettingsProfile,sourceVoice:"authorized-owner-voice",sourceSpeaker:"Serhat Abu Malik",
 approvedForPlayback:true,url:"/kids/assets/kids-academy-audio/safe-approved.m4a"};
const tw=api.entries.find(x=>x.id==="tawhid");
assert.equal(api.approvedVoiceFor(tw,"4-5",{masterEntry:()=>({...fake,approvedForPlayback:false})}),false,
 "Unreviewed staging may never narrate a term");
assert.equal(api.approvedVoiceFor(tw,"4-5",{masterEntry:()=>({...fake,modelId:"eleven_flash_v2_5"})}),false);
assert.equal(api.approvedVoiceFor(tw,"4-5",{masterEntry:()=>fake}),true);
let plays=[];
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.listeners={};this.hidden=false;this.textContent="";}
 append(...xs){this.children.push(...xs);for(const x of xs)x.parentNode=this;}
 replaceChildren(...xs){this.children=[];this.append(...xs);}
 setAttribute(k,v){this.attributes[k]=v;}
 getAttribute(k){return this.attributes[k];}
 addEventListener(k,cb){this.listeners[k]=cb;}
 click(){this.listeners.click?.();}
 get firstChild(){return this.children[0]||null;}
}
sandbox.document={createElement:t=>new Element(t)};
const missing=new Element("div"),approved=new Element("div");
sandbox.window.DARKidsOwnerVoice=null;
api.mount(missing,{title:"Tawḥīd lernen"},"4-5",{stopAudio:()=>{}});
assert.ok(missing.children.length>=4&&!missing.hidden);
const missingTerm=missing.children[2].children.find(x=>x.textContent==="Tawḥīd");
assert.ok(missingTerm);missingTerm.click();
const info=missing.children[3];
assert.ok(info.children[1].textContent.includes("Allah allein"));
assert.match(info.children[3].textContent,/noch|fehlt/);
assert.equal(plays.length,0,"No unapproved or synthetic fallback voice");
// Regressions: a lesson without Quran/Sunnah content must never receive
// those generic words as unrelated vocabulary.
const neutralTerms=api.termsFor({title:"Tarbiyah lernen"},"6-8").map(x=>x.id);
assert.ok(neutralTerms.includes("tarbiyah"));
assert.ok(!neutralTerms.includes("quran")&&!neutralTerms.includes("sunnah"),
 "Do not inject Quran/Sunnah when absent from the actual lesson");
// Editorial notes remain in the evidence metadata, never in child-visible labels.
const editorial=new Element("div");
api.mount(editorial,{title:"Tarbiyah lernen"},"6-8",{stopAudio:()=>{}});
editorial.children[2].children.find(x=>x.textContent==="Tarbiyah").click();
assert.equal(editorial.children[3].children[2].hidden,true,
 "Editorial provenance is not a religious source label for children");
assert.equal(editorial.children[3].children[2].textContent,"");
const documented=new Element("div");
api.mount(documented,{title:"Sunnah lernen"},"6-8",{stopAudio:()=>{}});
documented.children[2].children.find(x=>x.textContent==="Sunnah").click();
assert.match(documented.children[3].children[2].textContent,/^Quelle: Qurʾān 59:7;/,
 "An actual Quran/Sahih source must remain visible");
sandbox.window.DARKidsOwnerVoice={masterEntry:()=>fake,play:(t,opts)=>{plays.push({t,opts});return true}};
api.mount(approved,{title:"Tawḥīd lernen"},"9-10",{stopAudio:()=>{}});
approved.children[2].children.find(x=>x.textContent==="Tawḥīd").click();
assert.equal(plays.length,1,"Approved voice should play on the same real tap");
assert.equal(plays[0].t,api.phrase(tw,"9-10"));
assert.equal(plays[0].opts.rate,1);
assert.equal(plays[0].opts.source,"kids-academy-term-v24");
const page=read("kids/akademie/index.html");
assert.ok(page.includes('id="academyTermCoach"'));
assert.ok(page.includes('id="academyTermCoachSources"'));
assert.ok(page.includes('term-coach-v24.js?v=academy-sidq-sources-v2-20261120'));
assert.ok(page.includes('function refreshAcademyVocabulary()'));
assert.ok(page.includes('if(n===1||n===2)refreshAcademyVocabulary()'));
assert.ok(!read(helperFile).includes("speechSynthesis")&&!read(helperFile).includes("ElevenLabs")&&!read(helperFile).includes("fetch("),
 "Vocabulary cannot invent an AI voice or spend credits");
const {audit}=require("./audit-academy-voice-coverage-v18.js");
const counts=audit();
assert.equal(counts.catalogLessonCount,66,"Voice audit must cover all 66 actual school lessons, including V28 and V29");
assert.equal(counts.vocabularyTerms,33);
assert.equal(counts.vocabularyVoicePhrases,99);
assert.deepEqual(counts.uncoveredLessons,[]);
assert.ok(counts.uniquePhrases>=730);
assert.ok(counts.totals.approved>=58&&counts.totals.approved<=72,
 "All canonical 58 are preserved; other V4 assets count only if referenced by the editorial voice plans");
// The dynamic child-choice projection includes 5 new exact click texts
// which were absent from the older editorial source voice-plan. Validate
// ALL public manifest entries, including those projection-only strings.
const sidqPublic=JSON.parse(read("kids/data/academy-audio.json"));
const sidqRows=Object.entries(sidqPublic.entries).filter(([,x])=>x.sourceLessonId==="sidq");
assert.ok([58,72].includes(sidqRows.length),
 "Only an atomic 14-recording Ṣidq release can augment the original 58");
for(const [display,entry] of sidqRows){
 assert.equal(entry.approvedForPlayback,true,"Unapproved child click audio: "+display);
 const location=path.join(root,entry.url.replace(/^\/+/, ""));
 assert.ok(fs.existsSync(location),"Missing real audio file: "+display);
 const sha=require("node:crypto").createHash("sha256").update(fs.readFileSync(location)).digest("hex");
 assert.equal(sha,entry.sha256,"Corrupted owner V4 binary: "+display);
}
// Regression: cross-check every visible Ṣidq answer, source label and glossary
// tap against original source/voice text, not just static audit plans.
require("node:child_process").execFileSync(process.execPath,[
 "kids/tools/test-academy-sidq-audio-clicks-v1.cjs"
],{cwd:root,stdio:"inherit"});
// The post-release 14 Ṣidq click gaps must have exact already-paid V4
// receipts and an offline, zero-credit importer. Test --dry-run in CI so
// a broken audio importer is detected before any real media upload.
const importer=read("kids/tools/import-academy-sidq-click-gaps-v1.py");
assert.ok(!/elevenlabs\.com\/v1|requests\.post\(|creative_generate_speech/.test(importer),
 "Offline importer may not call ElevenLabs or spend credits");
const dry=JSON.parse(require("node:child_process").execFileSync("python3",[
 "kids/tools/import-academy-sidq-click-gaps-v1.py","--dry-run"
],{cwd:root,encoding:"utf8"}));
if(dry.alreadyImported===true){
 assert.equal(dry.newSynthesis,0,"Already imported 14 original V4 clicks must never be generated again");
 assert.equal(sidqRows.length,72,"All 14 clickable files are already present");
}else{
 assert.equal(dry.childRecordings,14);
 assert.equal(dry.newOriginalGenerations,20);
 assert.equal(dry.arabicGermanAssemblies,9);
}
assert.equal(dry.newSynthesis,0);
require("node:child_process").execFileSync(process.execPath,[
 "kids/tools/test-academy-sabr-choice-v1.cjs"
],{cwd:root,stdio:"inherit"});
console.log("KIDS V24 GLOSSARY PASS: 33 terms × 3 child-safe age explanations = 99 verified-voice requests, "+counts.catalogLessonCount+" audited lessons; 0 auto voice and 0 credits.");
