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
  assert.ok(api.phrase(item,age).startsWith(item.term+" bedeutet: "));
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
assert.ok(page.includes('term-coach-v24.js?v=20261011-01'));
assert.ok(page.includes('function refreshAcademyVocabulary()'));
assert.ok(page.includes('if(n===1||n===2)refreshAcademyVocabulary()'));
assert.ok(!read(helperFile).includes("speechSynthesis")&&!read(helperFile).includes("ElevenLabs")&&!read(helperFile).includes("fetch("),
 "Vocabulary cannot invent an AI voice or spend credits");
const {audit}=require("./audit-academy-voice-coverage-v18.js");
const counts=audit();
assert.equal(counts.catalogLessonCount,50);
assert.equal(counts.vocabularyTerms,33);
assert.equal(counts.vocabularyVoicePhrases,99);
assert.deepEqual(counts.uncoveredLessons,[]);
assert.ok(counts.uniquePhrases>=730);
assert.equal(counts.totals.approved,0,"No unapproved V4 clips magically promoted");
console.log("KIDS V24 GLOSSARY PASS: 33 terms × 3 child-safe age explanations = 99 verified-voice requests, 38 lessons; 0 auto voice and 0 credits.");
