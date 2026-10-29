#!/usr/bin/env node
"use strict";
/* KIDS Academy FULL SALAM 2026-10-29: source-only, no paid TTS and no profile mutation. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const get=file=>fs.readFileSync(file,"utf8");
const full="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
const html=get("kids/akademie/index.html");
const pilot=get("kids/akademie/pilot-audio-v13.js");
const curr=get("kids/akademie/curriculum-v1.js");
const terms=get("kids/akademie/term-coach-v24.js");
const standard=get("kids/MASTER-TEXT-STANDARD-V2.md");
const voiceExport=get("kids/tools/export-academy-sidq-voice-v18.js");
const p9=JSON.parse(get("kids/data/academy-voice-plan-v9.json"));
const p18=JSON.parse(get("kids/data/academy-sidq-voice-plan-v18.json"));
const p19=JSON.parse(get("kids/data/academy-full-salam-voice-plan-v19.json"));
const old=/As-salāmu ʿalaykum(?:, (?:liebe Schwester|lieber Bruder)|!| ist|[.,])/;
for(const [id,klass] of [["overviewSalam","greeting-salam"],["welcomeSalam","stage-greeting-salam"]]){
 assert(html.includes('<span id="'+id+'" class="'+klass+'">'+full+'</span>'),"Missing exact complete initial HTML greeting for "+id);
 assert(html.includes('$("#'+id+'").textContent=ACADEMY_FULL_SALAM;'),"Profile binding must never shorten greeting");
}
assert(html.includes('const ACADEMY_FULL_SALAM="'+full+'";'));
assert(!old.test(html),"Academy runtime must have no shortened greeting");
for(const id of ["overviewAddress","welcomeAddress"]){
 assert(html.includes('id="'+id+'"'),"Dedicated profile salutation missing "+id);
 assert(html.includes('$("#'+id+'").textContent=greetingAddress();'),"Gender binding missing "+id);
}
assert(html.includes("const spokenSalam=ACADEMY_FULL_SALAM;"),"Voice narration must use full greeting");
assert(html.includes('index===0?[spokenSalam,$("#welcomeAddress").textContent,$("#welcomeFollowup").textContent,'),"Spoken full greeting must precede profile salutation");
assert(html.includes(".lesson-stage .stage-greeting-salam{")&&html.includes("white-space:normal!important"),"Full greeting should wrap, not truncate");
const sample=html.match(/^const ACADEMY_FULL_SALAM=.*$/m)?.[0]||"";
const address=html.match(/^const address=.*$/m)?.[0]||"";
const greetingAddress=html.match(/^const greetingAddress=.*$/m)?.[0]||"";
assert(sample&&address&&greetingAddress,"Could not find production greeting functions");
for(const [gender,profileName,expected] of [["girl","","Liebe Schwester."],["boy","","Lieber Bruder."],["girl","Maryam","Liebe Schwester Maryam."],["boy","Ibrahim","Lieber Bruder Ibrahim."]]){
 const script='const gender='+JSON.stringify(gender)+';const profileName='+JSON.stringify(profileName)+';\n'+[sample,address,greetingAddress].join("\n")+'\nglobalThis.result={full:ACADEMY_FULL_SALAM,role:greetingAddress()};';
 const ctx={};vm.runInNewContext(script,ctx,{timeout:500});
 assert.equal(ctx.result.full,full);assert.equal(ctx.result.role,expected);
}
assert((curr.match(/As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh/g)||[]).length>=4,"Four original lesson questions/lines must use full form");
assert(!curr.includes("As-salāmu ʿalaykum"),"Academy questions must not shorten greeting");
assert(terms.includes("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh"),"Term explanation must use full greeting");
assert(voiceExport.includes('girl:"'+full+'"')&&voiceExport.includes('boy:"'+full+'"'),"Future voice generator must use same full Salam");
assert(voiceExport.includes('add("Liebe Schwester.","address","all","girl")')&&voiceExport.includes('add("Lieber Bruder.","address","all","boy")'),"Future voice plan must isolate gender address");
for(const [label,p] of [["V9",p9],["V18",p18]]){
 assert.equal(p.phraseCount,p.phrases.length,label+" archived phraseCount mismatch");
 assert(p.phrases.every(x=>x.reviewStatus==="not-generated"),"Preserve historical pending drafts unmodified");
}
assert.equal(new Set([...p9.phrases,...p18.phrases].map(x=>x.text)).size,511,"Historical voice plan of 511 exact phrases must stay immutable");
assert.equal(p19.phraseCount,3,"Only three new phrases: shared full Salam plus two profile addresses");
assert.equal(p19.voicePolicy.canonicalFullSalam,full);
assert.equal(p19.voicePolicy.allowPaidGeneration,false,"No automatic cost or generation");
assert.equal(p19.voicePolicy.noExistingAudioSubstitution,true,"Never substitute a short recording");
assert(p19.phrases.every(x=>x.reviewStatus==="not-generated"&&!x.url&&x.approvedForPlayback===false));
assert(p19.phrases.every(x=>!old.test(x.text)),"New plan may not contain short greeting");
assert.equal(p19.phrases.filter(x=>x.text===full).length,1,"Never pay twice for full greeting");
assert(p19.phrases.some(x=>x.text==="Liebe Schwester.")&&p19.phrases.some(x=>x.text==="Lieber Bruder."),"Both profile addresses planned");
assert(pilot.includes('if(k===0){event.preventDefault()')&&!pilot.includes("start([0,1,2])"),"Old shortened audio must not intercept full greeting");
assert(standard.includes("vollständiger Salām in allen aktiven Kinderprofilen"));
console.log("PASS: complete Islamic Salam in Kids Academy, gender/name checks, teaching texts, pending voice plans; archived short V4 blocked");
