#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const crypto=require("node:crypto");
const source=fs.readFileSync("kids/quiz-v4-test-preview.js","utf8");
assert.ok(source.includes("KIDS_V4_AGE_PART_AUDITION_V1463"),"Direct 3-age × 4-part V4 hearing test must ship");
for(const part of ["question","correct","retry","explanation"])assert.ok(source.includes('data-quiz-v4-part"'),"V4 hearing buttons must be real controls");
assert.ok(source.includes("kidsV4AgePartBand")&&source.includes("kidsV4AgePartStatus"),"Age-band selector and honest playback status must exist");

const manifest=JSON.parse(fs.readFileSync("kids/data/quiz-v4-full-rebuild-review.json","utf8"));
const age={"4-6":0,"7-8":0,"9-10":0};
const paths=new Map();
assert.equal(manifest.releaseEnabled,false,"never pretend public release");
assert.equal(manifest.humanListeningApproved,false,"never fake human hearing");
assert.equal(Object.keys(manifest.questions).length,450);
for(const [id,q] of Object.entries(manifest.questions)){
  assert.match(id,/^kids-quiz-\d{3}$/);age[q.ageBand]++;
  assert.deepEqual(Object.keys(q.clips).sort(),["question","correct","retry","explanation"].sort());
  for(const [part,clip] of Object.entries(q.clips)){
    assert.equal(clip.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
    assert.equal(clip.modelId,"eleven_v4");
    assert.equal(clip.humanListeningApproved,false);
    assert.equal(clip.approvedForPlayback,false);
    assert.match(clip.sha256,/^[a-f0-9]{64}$/);
    assert.ok(clip.url.startsWith("/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/"+q.ageBand+"/"));
    if(paths.has(clip.url))assert.equal(paths.get(clip.url),clip.sha256,"duplicate URL integrity");
    paths.set(clip.url,clip.sha256);
  }
}
assert.deepEqual(age,{"4-6":150,"7-8":150,"9-10":150});
assert.equal(paths.size,1217);
for(const [uri,hash] of paths){
  const path=uri.slice(1);
  const raw=fs.readFileSync(path);
  assert.ok(raw.length>1700,"audio too short "+uri);
  assert.equal(crypto.createHash("sha256").update(raw).digest("hex"),hash,"byte checksum mismatch "+uri);
}
const blocked={DARKidsQuizV4Approved:{version:"strict-release-only"},location:{hostname:"dar-al-tawhid.de"}};
vm.runInNewContext(source,{window:blocked,Promise,Error,Number,Object,Array,String,RegExp});
assert.equal(blocked.DARKidsQuizV4Approved.version,"strict-release-only","public visitor must never enable test preview");
const children=[];
class Audio{
 constructor(){this.src="";this.playbackRate=1}
 pause(){}
 removeAttribute(){this.src=""}
 load(){}
 play(){children.push(this.src);return Promise.resolve()}
}
const test={
 location:{hostname:"dar-al-tawhid-test.sero91ak.workers.dev"},
 Audio,document:{getElementById(){return null},addEventListener(){}},
 fetch:async()=>({ok:true,json:async()=>manifest}),
 CustomEvent:function(name,options){this.name=name;this.detail=options.detail},
 dispatchEvent(){}
};
vm.runInNewContext(source,{window:test,Promise,Error,Number,Object,Array,String,RegExp});
assert.equal(test.DARKidsQuizV4Approved.isTestPreview,true);
(async()=>{
 assert.equal(await test.DARKidsQuizV4Approved.load(),true);
 assert.equal(test.DARKidsQuizV4Approved.isReady(),true);
 const qid="kids-quiz-001";const q={id:qid,ageBand:manifest.questions[qid].ageBand,source:manifest.questions[qid].source};
 for(const part of ["question","correct","retry","explanation"]){
   assert.equal(test.DARKidsQuizV4Approved.has(q,part),true);
   assert.equal(test.DARKidsQuizV4Approved.play(q,part),true);
 }
 assert.equal(children.length,4);
 assert.equal(test.DARKidsQuizV4Approved.has({...q,ageBand:"9-10"},"question"),false);
 assert.equal(test.DARKidsQuizV4Approved.has({...q,source:"Qurʾān 999"},"question"),false);
 console.log("PASS: exact 450×4, 1217 SHA-256 MP3 originals, stage-only playable, visitor not enabled, source and age ID gates");
})().catch(e=>{console.error(e);process.exitCode=1});
