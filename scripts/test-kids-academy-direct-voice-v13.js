#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const script=read("kids/akademie/pilot-audio-v13.js");
const html=read("kids/akademie/index.html");
const staging=JSON.parse(read("kids/data/academy-audio-staging-v9.json"));
const native=read("kids/akademie/stimmen-test-v14.html");
assert.ok(html.includes("/kids/akademie/stimmen-test-v14.html?v=serhat-native-v14-20261010"));
assert.ok(native.includes('<meta name="robots" content="noindex,nofollow">'));
assert.equal((native.match(/<audio controls preload="none" playsinline/g)||[]).length,4);
assert.equal((native.match(/type="audio\/mp4"/g)||[]).length,4);
assert.equal((native.match(/autoplay/g)||[]).length,0,"All voice tests must remain tap-to-play");
assert.equal(staging.modelId,"eleven_v4");
assert.equal(staging.voiceSettingsProfile,"kids_story");
assert.equal(staging.pilotFirstLesson,true);
assert.equal(staging.stagingOnly,true);
assert.ok(html.includes('data-preview-release="V16.0-voicepreview-20261010"'));
assert.ok(html.includes('pilot-audio-v13.js?v=20261010-voicefix-v16'));
const clipNames=["00ff589726b166dff6a9","f142bc78e8bcea3d8518","08d1f46461d954d5e471","1a6097339111c8ac475c"];
for(const key of clipNames){
 const keyUrl="/kids/assets/kids-academy-audio/"+key+".m4a";
 assert.ok(native.includes(keyUrl), "Native iPhone player missing original Serhat clip "+key);
 assert.ok(script.includes(keyUrl),"Missing direct asset "+key);
 assert.ok(Object.values(staging.entries).some(x=>x.url===keyUrl),"Direct asset not staged "+key);
}
assert.equal(Object.values(staging.entries).filter(e=>e.approvedForPlayback===false).length,4);
function harness(search,who="girl",welcome="Heute geht es darum, die Wahrheit zu sagen. Wir hören zu und überlegen zusammen. Du darfst eine Pause machen."){
 const listeners={},visible={};
 const playing=[];
 class FakeAudio{
  constructor(){this.volume=0;this.muted=true;this.src="";FakeAudio.latest=this}
  setAttribute(){} removeAttribute(name){if(name==="src")this.src=""}
  pause(){} load(){}
  play(){playing.push(this.src);return Promise.resolve()}
 }
 const body={dataset:{profile:who,kidsAge:"4-5"}};
 const document={
  body,readyState:"complete",hidden:false,
  addEventListener:(event,fn,capture)=>{listeners[event]=fn; if(event==="click")assert.equal(capture,true)},
  querySelector:(s)=>s==="#lessonMain"?{hidden:false}:
   s==="#welcomeFollowup"?{textContent:"Schön, dass du da bist!"}:
   s==="#lessonWelcomeBody"?{textContent:welcome}:
   s==="#academyPilotControls"?visible.panel||(visible.panel={hidden:true}):
   s==="#audioDiagnostics"?visible.diagnostics||(visible.diagnostics={textContent:""}):
   s==="#audioFeedback"?visible.feedback||(visible.feedback={textContent:""}):
   s==="#voiceStatus"?visible.voice||(visible.voice={textContent:""}):
   s==="#academyPilotStatus"?visible.status||(visible.status={textContent:""}):null,
  querySelectorAll:s=>s==="#explainWords [data-spoken]"?[{textContent:"Manchmal geht etwas aus Versehen kaputt."}]:[]
 };
 const window={
  addEventListener:(name,fn)=>listeners["window-"+name]=fn,
  DARKidsOwnerVoice:{stop:()=>{}},speechSynthesis:{cancel:()=>{}}
 };
 vm.runInNewContext(script,{window,document,location:{pathname:"/kids/akademie/index.html",search},
   URLSearchParams,Audio:FakeAudio,console},{timeout:2000});
 function tap(selector,index){
  let stopped=false,prevented=false;
  const elt=index===undefined?{}:{dataset:{academyPilot:String(index)}};
  const event={
   target:{closest(q){return q===selector?elt:null}},
   preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}
  };
  listeners.click?.(event);
  return {stopped,prevented}
 }
 return {listeners,visible,playing,FakeAudio,tap};
}
const p=harness("?previewProfil=maedchen&previewAlter=4-5&voicePilot=1");
assert.equal(p.visible.panel.hidden,false);
assert.ok(p.listeners.click);
assert.deepEqual(p.tap('[data-speak-stage="0"]'),{stopped:true,prevented:true});
assert.equal(p.playing.length,1,"First play() must happen before click handler returns");
assert.ok(p.playing[0].includes(clipNames[0]),"Greeting must be the exact owner's Salām");
p.FakeAudio.latest.onended();
assert.equal(p.playing.length,2,"Follow-up may continue with same gesture-authorized player");
assert.ok(p.playing[1].includes(clipNames[1]));
p.FakeAudio.latest.onended();
assert.equal(p.playing.length,3);
assert.ok(p.playing[2].includes(clipNames[2]));
const q=harness("?previewProfil=maedchen&previewAlter=4-5&voicePilot=1");
assert.deepEqual(q.tap("[data-academy-pilot]",3),{stopped:true,prevented:true});
assert.equal(q.playing.length,1);
assert.ok(q.playing[0].includes(clipNames[3]));
const preview=harness("?previewProfil=maedchen&previewAlter=4-5");
assert.equal(preview.visible.panel.hidden,true,"Adult QA controls require explicit pilot authorization");
assert.ok(preview.listeners.click,"Explicit girl preview should be testable without hidden voicePilot parameter");
assert.deepEqual(preview.tap('[data-speak-stage="0"]'),{stopped:true,prevented:true});
assert.equal(preview.playing.length,1,"Exact matched greeting must start on the first iPhone tap");
assert.ok(preview.playing[0].includes(clipNames[0]));
const wrongSubject=harness("?previewProfil=maedchen&previewAlter=4-5","girl","Heute lernen wir Wudūʾ.");
assert.deepEqual(wrongSubject.tap('[data-speak-stage="0"]'),{stopped:false,prevented:false});
assert.equal(wrongSubject.playing.length,0,"Never play Ṣidq greeting for an unrelated lesson");
const savedBoy=harness("?previewProfil=maedchen&previewAlter=4-5","boy");
assert.deepEqual(savedBoy.tap('[data-speak-stage="0"]'),{stopped:false,prevented:false});
assert.equal(savedBoy.playing.length,0,"Real boy profile overrides preview query");
const ordinary=harness("?cb=v16-regular");
assert.equal(ordinary.listeners.click,undefined,"No unapproved pilot override for normal signed-in pupils");
assert.equal(ordinary.playing.length,0);
console.log("KIDS ACADEMY V16 PASS: exact Serhat V4 first-tap greeting in explicit preview, subject match, real child profile protection, no regular lesson promotion.");
