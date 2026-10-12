#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
const player=fs.readFileSync(path.join(root,"kids/akademie/pilot-audio-v13.js"),"utf8");
const audio=fs.readFileSync(path.join(root,"kids/akademie/stimmen-test-v14.html"),"utf8");
assert.ok(html.includes('data-preview-release="V17.0-voice-sandbox-20261011"'));
assert.ok(!html.includes('id="academyCreatorVoiceBanner"'),"Visitor must not contain creator QA banner");
assert.ok(html.includes("creatorVoiceSandbox"),"No isolated creator QA profile");
assert.ok(!html.includes('p.creatorVoiceSandbox'),"Visitor must not render creator QA banner");
assert.ok(audio.includes("&amp;creatorSandbox=1&amp;"),"Standalone audio tester must return to isolated creator identity");
assert.ok(player.includes('document.body?.dataset?.academyChildMode==="demo"'),"Pilot player must continue protecting real child lessons");
assert.ok(player.includes("matchesExactSidqText"),"Never play Ṣidq clip over unrelated subject");
const start=html.indexOf("function getProfile(){"),end=html.indexOf("function stopMicTracks()",start);
assert.ok(start>=0&&end>start&&end-start<2500);
const getProfileFactory=new Function("localStorage","window","ageKey",html.slice(start,end)+"\nreturn getProfile();");
const makeProfile=(search)=>{
 const writes=[];
 const data={
  "kids.profiles.v1":JSON.stringify([{id:"real-child-73",name:"Gespeichertes Kind",gender:"boy",age:"9-10"}]),
  "kids.activeProfile":"real-child-73","kids.guest.gender.v1":"boy","kids.age":"9-10"
 };
 const store={getItem:key=>data[key]||null,setItem:(...args)=>writes.push(args),removeItem:key=>writes.push(key)};
 const profile=getProfileFactory(store,{location:{search}},x=>["4-5","6-8","9-10"].includes(x)?x:null);
 assert.equal(writes.length,0,"Creator preview must never rewrite real child account");
 return profile;
};
const normal=makeProfile("?previewProfil=maedchen&previewAlter=4-5&voicePilot=1");
assert.equal(normal.id,"real-child-73","Saved real profile wins without explicit sandbox flag");
assert.equal(normal.g,"boy");
assert.equal(normal.age,"9-10");
assert.equal(normal.demo,false);
const creator=makeProfile("?previewProfil=maedchen&previewAlter=4-5&voicePilot=1&creatorSandbox=1");
assert.equal(creator.id,"owner-voice-test-v17-girl-4-5");
assert.equal(creator.g,"girl");
assert.equal(creator.age,"4-5");
assert.equal(creator.child,null);
assert.equal(creator.demo,true);
assert.equal(creator.creatorVoiceSandbox,true);
assert.notEqual(creator.id,normal.id,"QA learning history must be isolated from real child's history");
for(const search of [
 "?previewProfil=maedchen&previewAlter=4-5&creatorSandbox=1",
 "?previewProfil=maedchen&voicePilot=1&creatorSandbox=1",
 "?previewAlter=4-5&voicePilot=1&creatorSandbox=1",
 "?previewProfil=junge&previewAlter=4-5&voicePilot=1&creatorSandbox=1"
]){
 const p=makeProfile(search);
 assert.equal(p.id,"real-child-73","Incomplete or mismatched creator URL must not override real child");
}
console.log("KIDS V17 OWNER VOICE SANDBOX PASS: explicit URL only; 4–5 girl demo active, real child and progress untouched, standalone player reachable.");
