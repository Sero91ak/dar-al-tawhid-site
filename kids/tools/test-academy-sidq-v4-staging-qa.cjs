#!/usr/bin/env node
"use strict";
/* Read-only zero-credit QA for first canonical owner V4 batch. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const file="kids/data/academy-audio-staging-sidq-v4-20261111.json";
const stage=read(file);
const batch=read("kids/data/academy-sidq-v4-batch-20261111.json");
const publicAudio=read("kids/data/academy-audio.json");
const fullSalam="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
assert.equal(stage.id,"KIDS_ACADEMY_SIDQ_V4_20261111_STAGING");
assert.equal(stage.stagingOnly,true);
assert.equal(stage.reviewRequiredBeforePublicPlayback,true);
assert.equal(stage.modelId,"eleven_v4");
assert.equal(stage.voiceSettingsProfile,"kids_story");
const expected=batch.exactPhrases;
assert.deepEqual(Object.keys(stage.entries).sort(),[...expected].sort());
assert.equal(expected.length,4);
assert.ok(expected.includes(fullSalam));
assert.ok(expected.includes("Liebe Schwester."));
assert.ok(expected.includes("Lieber Bruder."));
let seconds=0,bytes=0;
for(const text of expected){
 const e=stage.entries[text];
 assert.equal(e.voiceId,"DkU7j9uO4ZEtLD2iRZSH",text);
 assert.equal(e.modelId,"eleven_v4",text);
 assert.equal(e.voiceSettingsProfile,"kids_story",text);
 assert.equal(e.approvedForPlayback,false,text);
 assert.equal(e.qaStatus,"technical-passed-awaiting-human-fusha-review",text);
 assert.equal(e.pronunciationDictionaryAppliedByBackend,false,text);
 assert.match(e.url,/^\/kids\/assets\/kids-academy-audio\/[a-f0-9]{20}\.m4a$/);
 const f=path.join(ROOT,e.url.slice(1));
 assert.ok(fs.existsSync(f),"Missing binary: "+f);
 const buffer=fs.readFileSync(f);
 assert.ok(buffer.byteLength>=1800,"Truncated binary: "+e.url);
 assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"),e.sha256,"Corrupt audio: "+text);
 assert.ok(e.durationSeconds>=0.8&&e.durationSeconds<=65,"Invalid audio duration");
 assert.ok(!Object.prototype.hasOwnProperty.call(publicAudio.entries||{},text),
   "Staged unapproved phrase must not appear in public owner-audio manifest");
 seconds+=e.durationSeconds;bytes+=buffer.length;
}
const html=fs.readFileSync(path.join(ROOT,"kids/akademie/index.html"),"utf8");
assert.ok(!html.includes("academy-audio-staging-sidq-v4-20261111"),"QA-only staging must not be directly linked by child player");
assert.ok(!html.includes("/kids/assets/kids-academy-audio/38fcc85d9dcbc1b47a3a.m4a"),"No hardcoded staging URLs");
console.log(JSON.stringify({pass:true,clips:expected.length,durationSeconds:Math.round(seconds*100)/100,bytes,model:"eleven_v4",publicApproved:0,reviewRequired:true,ownerVoice:"Serhat Abu Malik – Master"},null,2));
