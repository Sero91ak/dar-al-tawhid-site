"use strict";
// No third-party modules, no API keys, no paid TTS. Strict public audio gate.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const code=fs.readFileSync("kids/quiz-v4-approved-player.js","utf8");
let stopped=0,plays=[],ended=0,errors=0;
class FakeAudio {
  constructor(){this.src="";this.onended=null;this.onerror=null}
  setAttribute(){}
  pause(){}
  removeAttribute(){this.src=""}
  load(){}
  play(){plays.push(this.src);return Promise.resolve()}
}
const bands=["4-6","7-8","9-10"];
const data={
 id:"TAWHID_KIDS_450_V4_NEW_REBUILD_PUBLIC",modelId:"eleven_v4",
 voiceId:"DkU7j9uO4ZEtLD2iRZSH",releaseEnabled:true,humanListeningApproved:true,questions:{}
};
for(let i=0;i<450;i++){
 const band=bands[Math.floor(i/150)],id="kids-quiz-"+String(i+1).padStart(3,"0");
 const clips={};
 for(const part of ["question","correct","retry","explanation"]){
  clips[part]={modelId:"eleven_v4",voiceId:data.voiceId,sha256:"a".repeat(64),
    durationSeconds:4.5,humanListeningApproved:true,approvedForPlayback:true,
    url:"/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/"+band+"/"+("a".repeat(28))+".mp3"};
 }
 data.questions[id]={ageBand:band,source:"Qurʾān 1:5",clips};
}
let returned=data;
const root={
  Audio:FakeAudio,
  DARKidsOwnerVoice:{stop(){stopped++}},
  fetch:async()=>({ok:true,json:async()=>returned})
};
const sandbox={window:root,Promise,Number,Object,Array,Error,String};
vm.runInNewContext(code,sandbox,{filename:"quiz-v4-approved-player.js"});
const p=root.DARKidsQuizV4Approved;
assert.ok(p);
const q={id:"kids-quiz-001",ageBand:"4-6",source:"Qurʾān 1:5"};
(async()=>{
 // Never play before fetching/approval.
 assert.equal(p.play(q,"question"),false);
 assert.equal(await p.load(),true);
 assert.equal(p.state(),"ready");
 assert.equal(p.has(q,"question"),true);
 assert.equal(p.has({...q,ageBand:"7-8"},"question"),false);
 assert.equal(p.has({...q,source:"Qurʾān 2:5"},"question"),false);
 assert.equal(p.play(q,"question",{onended(){ended++},onerror(){errors++}}),true);
 assert.equal(plays.length,1);
 assert.equal(stopped,1);
 p.stop();
 assert.equal(p.play(q,"nonexistent"),false);
 // Negative gates: each fresh context must reject altered public metadata.
 async function rejects(mutate){
  let copy=JSON.parse(JSON.stringify(data));mutate(copy);
  let view={Audio:FakeAudio,fetch:async()=>({ok:true,json:async()=>copy})};
  vm.runInNewContext(code,{window:view,Promise,Number,Object,Array,Error,String});
  assert.equal(await view.DARKidsQuizV4Approved.load(),false);
  assert.equal(view.DARKidsQuizV4Approved.play(q,"question"),false);
 }
 await rejects(x=>x.releaseEnabled=false);
 await rejects(x=>x.humanListeningApproved=false);
 await rejects(x=>x.questions["kids-quiz-001"].clips.question.humanListeningApproved=false);
 await rejects(x=>x.questions["kids-quiz-001"].clips.question.modelId="eleven_v3");
 await rejects(x=>x.questions["kids-quiz-001"].clips.question.url="/kids/other.mp3");
 await rejects(x=>delete x.questions["kids-quiz-450"]);
 await rejects(x=>x.questions["kids-quiz-001"].ageBand="9-10");
 assert.equal(errors,0);
 console.log("PASS: 450 x 4 ID-gated V4 clips; 7 negative approval/security cases; no external API/voice credits");
})().catch(e=>{console.error(e);process.exitCode=1});
