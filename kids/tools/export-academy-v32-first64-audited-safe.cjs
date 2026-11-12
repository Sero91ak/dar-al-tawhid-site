#!/usr/bin/env node
"use strict";
/* Zero-credit source-audit-gated V4 batch plan for the next 64 lesson lines.
   No private child data, no Qurʾān synthesis, no production or publication. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const catalog=read("kids/data/academy-65-lessons-v32-voice-catalog.json");
const v31=read("kids/data/academy-sidq-v4-coverage-v31.json");
const voice=read("kids/data/academy-voice-policy-v10.json");
assert.equal(catalog.lessonCount,65);
assert.equal(catalog.ageVersions,195);
assert.equal(catalog.questionCount,520);
assert.equal(catalog.counts.uniqueExactPhrases,2346);
assert.equal(catalog.counts.sourceAuditMissingLessons,33);
assert.equal(v31.totals.staged,80);
const prior=new Set(v31.entries.map(x=>x.text));
const missing=new Set(catalog.audit.lessonsMissingSourceAudit);
const conservativeRisk=/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFFṢṣḤḥḌḍṬṭḎḏṮṯẒẓĀāŪūĪīʿʾǦǧŠšḪḫ]/u;
const unresolvedOpenPrompt=/^(?:Erkläre|Beschreibe|Schreibe|Sprich|Formuliere|Sage|Nenne|Erzähl|Berichte|Begründe)\b|in eigenen Worten/iu;
const focus=["aqidah-tawhid-recht-allahs","aqidah-iman-sechs-grundlagen","aqidah-ikhlas-warum-gutes-tun"];
const kindOrder=["welcome","narration","recap","evidence","hadith-de","question","answer","hint","explanation"];
const approved=catalog.phrases.filter(x=>!prior.has(x.text)&&
 x.contexts.length>0&&x.contexts.every(c=>!missing.has(c.lessonId))&&
 x.pronunciationReviewRequired===false&&!conservativeRisk.test(x.text)&&
 !(x.contexts.some(c=>c.kind==="question")&&unresolvedOpenPrompt.test(x.text)));
const priority=x=>{
 const locations=x.contexts.map(c=>focus.indexOf(c.lessonId)).filter(i=>i>=0);
 return locations.length?Math.min(...locations):999;
};
const order=x=>{
 const kinds=x.contexts.map(c=>kindOrder.indexOf(c.kind)).filter(i=>i>=0);
 return kinds.length?Math.min(...kinds):999;
};
approved.sort((a,b)=>priority(a)-priority(b)||order(a)-order(b)||a.text.localeCompare(b.text,"de"));
const selected=approved.slice(0,64);
assert.equal(selected.length,64);
assert.ok(selected.every(x=>x.contexts.every(c=>!missing.has(c.lessonId))),"Never include speech from source-unverified lessons");
assert.ok(selected.every(x=>!prior.has(x.text)));
const batches=[];
for(let i=0;i<selected.length;i+=4){
 const group=selected.slice(i,i+4);
 const characters=group.reduce((a,b)=>a+b.text.length,0);
 assert.ok(characters<=1200);
 batches.push({batchIndex:batches.length,maxClips:4,maxPreparedCharacters:1200,
   totalSourceCharacters:characters,items:group.map(x=>({text:x.text,
     contexts:x.contexts,sha256:x.sha256,sourceAuditProven:true,
     modelId:"eleven_v4",voiceId:"DkU7j9uO4ZEtLD2iRZSH",
     humanListeningRequired:true,approvedForPlayback:false}))});
}
assert.equal(batches.length,16);
const out={schemaVersion:1,id:"KIDS_V32_SOURCE_AUDITED_GERMAN_SAFE_64_20261111",
 project:"TAWḤĪD KIDS",modelId:"eleven_v4",voiceId:"DkU7j9uO4ZEtLD2iRZSH",
 voiceSettingsProfile:"kids_story",sourceCatalog:"kids/data/academy-65-lessons-v32-voice-catalog.json",
 first80Excluded:true,sourceAuditGate:true,nativeArabicTermHold:true,syntheticQuranRecitation:false,
 publication:"NEVER_APPROVE_WITHOUT_OWNER_LISTENING",
 totalClips:64,totalBatches:16,perBatchMaxClips:4,perBatchMaxCharacters:1200,
 totalSourceCharacters:selected.reduce((a,x)=>a+x.text.length,0),
 prioritySourceLessons:focus,
 sourceLessons:[...new Set(selected.flatMap(x=>x.contexts.map(c=>c.lessonId)))],batches};
assert.equal(voice.production.profile,"kids_story");
const dest=path.join(ROOT,"kids/data/academy-v32-first64-source-audited-safe.json");
const bytes=JSON.stringify(out,null,2)+"\n";
if(process.argv.includes("--write"))fs.writeFileSync(dest,bytes);
else if(process.argv.includes("--check"))assert.equal(fs.readFileSync(dest,"utf8"),bytes,"First-64 plan stale against canonical source");
else console.log(JSON.stringify({lessonIds:focus,selected:64,batches:16,
 sourceAuditVerified:64,priorClipsExcluded:80,chars:out.totalSourceCharacters,
 firstTexts:selected.slice(0,5).map(x=>x.text)},null,2));
console.log("PASS: first 64 exact recorded-intent utterances from source-audited KIDS topics, zero credits");
