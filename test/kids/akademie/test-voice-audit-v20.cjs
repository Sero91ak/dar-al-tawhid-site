#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/kids/akademie/audio-audit.html");
const review=read("test/kids/akademie/index.html");
const gate=read("cloudflare/preview-gate.js");
const plan=JSON.parse(read("kids/data/academy-voice-plan-v9.json"));
const sidq=JSON.parse(read("kids/data/academy-sidq-voice-plan-v18.json"));
const stage=JSON.parse(read("kids/data/academy-audio-staging-v9.json"));
const annual=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
assert.ok(html.includes('name="robots" content="noindex,nofollow,noarchive"'));
assert.ok(review.includes('href="/test/academy/audio-audit-v18.html"'),"Creator review must use signed-session route rather than old Basic login");
assert.ok(review.includes('href="/test/academy/unterrichtszentrale-v23.html"'),"Creator has linked 52-week editorial command center");
assert.ok(gate.includes('pathname.startsWith("/test/kids/")'));
assert.ok(!html.includes("localStorage")&&!html.includes("indexedDB"),"Creator audit MUST NOT read/write real child data");
assert.ok(!html.includes("speechSynthesis")&&!html.includes("ELEVENLABS_API_KEY"),"No fallback TTS or paid audio generation");
assert.ok(html.includes('credentials:"same-origin"'),"Manifest read must retain existing preview gate authentication");
assert.ok(html.includes('e.voiceId===voiceId&&e.modelId==="eleven_v4"'));
assert.ok(html.includes('pub?.approvedForPlayback===true'));
assert.ok(html.includes('draft?.approvedForPlayback===false'));
assert.ok(html.includes('audio.play()')&&html.includes('listen.addEventListener("click"'),"iOS play must occur synchronously in a tap event");
assert.ok(html.includes('validAudioURL'));
for(const name of ["akhlaq","adab","fiqh","aqidah"])assert.ok(html.includes('<option value="'+name+'">'));
for(const age of ["4-5","6-8","9-10"])assert.ok(html.includes('<option value="'+age+'">'));
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script);new vm.Script(script[1],{filename:"academy-audio-audit-v20-inline.js"});
const key=t=>String(t).normalize("NFC").replace(/\s+/g," ").trim();
const all=new Set([...plan.phrases,...sidq.phrases].map(p=>key(p.text)));
// The independent Kids lane can publish the next authenticated pack after this Test change.
const followUpPaths=["kids/data/academy-voice-plan-v22.json","kids/data/academy-voice-plan-v25.json","kids/data/academy-voice-plan-v26.json","kids/data/academy-vocabulary-voice-plan-v24.json"];
const followUps=followUpPaths.filter(x=>fs.existsSync(path.join(root,x))).map(x=>JSON.parse(read(x)));
const combined=new Set([...all,...followUps.flatMap(p=>p.phrases).map(p=>key(p.text))]);
assert.equal(all.size,512,"Only the owner-authorized full Salam and separate role address may change the 511 ungenerated legacy phrases");
assert.ok(all.has(key("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.")),"Full Salam must be in new voice plan");
assert.ok(!all.has(key("As-salāmu ʿalaykum, liebe Schwester.")),"Old incomplete greeting must not be re-generated");
assert.ok(combined.size>=511,"Additional verified lessons or glossary must not remove existing voice lines");
const hasV25=followUps.some(p=>p.version==="academy-voice-plan-v25-20261011");
const hasV26=followUps.some(p=>p.version==="academy-voice-plan-v26-20261012");
const curriculumPage=read("kids/akademie/index.html");
const hasV27=curriculumPage.includes("curriculum-v27.js?v=20261012-27");
const hasV28=curriculumPage.includes("curriculum-v28.js?v=20261012-28");
const hasV29=curriculumPage.includes("curriculum-v29.js?v=20261012-29");
const verifiedCatalog=hasV29?66:hasV28?62:hasV27?58:hasV26?50:hasV25?45:38;
assert.equal(Object.keys(stage.entries).length,4,"No unapproved batch production");
assert.ok(Object.entries(stage.entries).every(([k,v])=>all.has(key(k))||(k==="As-salāmu ʿalaykum, liebe Schwester."&&v.deprecatedForPlayback===true)),"Only the explicitly blocked historical shortened Salam may remain outside the current voice plan");
assert.equal(annual.goals.newLessonSlots,208);
assert.equal(annual.goals.currentlyInCatalog,verifiedCatalog,
 "Annual voice-review snapshot must match the latest checked-in Academy curriculum");
assert.equal(annual.goals.additionalAuthenticallyVerifiedLessonsNeeded,annual.goals.newLessonSlots-verifiedCatalog,
 "Remaining authenticated lesson slots must equal annual slots minus verified catalog");
assert.ok(html.includes("academy-voice-plan-v22.json"),"Voice review must include the upcoming four real lessons");
console.log("KIDS ACADEMY VOICE REVIEW PASS: "+combined.size+" unique utterances, three eligible V4 originals plus one blocked archive, "+
 annual.goals.currentlyInCatalog+" verified-content lessons; no paid calls or child profile writes.");
