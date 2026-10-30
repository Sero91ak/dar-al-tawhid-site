#!/usr/bin/env node
"use strict";
/* Adult visitor personal chooser + login-locked profile regression.
 * No network, no credentials, no private account mutation. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("assets/dar-visitor-smart-profile-v1.js"),picker=read("assets/dar-visitor-profile-picker-v1.js");
const onboarding=read("assets/dar-visitor-onboarding-v1.js");
const pickerCSS=read("assets/dar-visitor-profile-picker-v1.css");
const smartCSS=read("assets/dar-visitor-smart-profile-v1.css");
for(const [file,content] of [["smart-profile",js],["picker",picker],["onboarding",onboarding]])new vm.Script(content,{filename:file+".js"});
assert.match(picker,/dvp-composite/,"Two-column personal chooser must exist");
assert.match(picker,/dvp-column-rule/,"Divider between profile and quick area is required");
assert.match(picker,/data-dvp-quick="hub"/,"The right half must be one real Mein DĀR entry");
assert.equal((picker.match(/data-dvp-quick="/g)||[]).length,1,"No four redundant direct buttons in profile capsule");
assert.match(picker,/if\(type==="hub"\|\|type==="account"\)nav\("account"\)/,"One button must open the existing full account hub");
assert.match(picker,/\["woman","Frau"/);
assert.match(picker,/\["man","Mann"/);
assert.match(picker,/\["neutral","Neutral"/);
assert.match(picker,/data-dvp-confirm/,"Account confirmation must be a real submit button");
assert.match(picker,/changeGenderWithLogin\(g,pin\)/,"PIN must be checked before account profile change");
assert.match(js,/isProfileLocked\(\)&&permit!==PROFILE_REAUTH_TOKEN/,"No silent changes to selected signed-in profiles");
assert.match(js,/await accountFindProfile\(username\)/,"Reuse existing account's live login lookup");
assert.match(js,/await accountPinHash\(username,String\(pin\),live\.pin_salt\)/,"Reuse existing account PIN verifier");
assert.match(js,/String\(account\(\)\.id\)!==String\(session\.id\)/,"Reject session switch while verifying PIN");
assert.match(js,/openNotes:openNotes,openSaved:openSaved/,"Notes and Saved must remain directly accessible");
assert.match(js,/dspSavedOverlay/,"Saved sheet must remain available without navigating out of the screen");
assert.match(smartCSS,/DĀR SAVED QUICK SHEET V2/);
assert.match(pickerCSS,/DVP SPLIT DASHBOARD V2/);
assert.match(pickerCSS,/DĀR COMPACT PROFILE V3/,"Use compact original-size 50/50 chooser");
assert.match(pickerCSS,/540px/,"Keep original compact popup width");
assert.match(pickerCSS,/@media\(max-width:450px\)/,"Compact iPhone/PWA responsive layout absent");
assert.match(onboarding,/profileApi\(\)\?\.isLocked\?\.\(\)/,"First-run choices must respect signed-in profile lock");

/* Mein DĀR must remain a first-class dashboard instead of an account-only form. */
const accountUI=read("assets/dar-account-visibility.js");
assert.match(accountUI,/setPageHeader\("Mein DĀR"/,"The route must be labelled Mein DĀR");
assert.match(js,/function accountPanel\(p\)/,"Dashboard rendering missing");
for(const feature of ["Deine Schnellzugriffe","Heute für dich ausgewählt","Zuletzt gelesen","Deine Wissensgebiete","Konto & Sync","Meine Notizen","Meine Merkliste"]){
 assert.ok(js.includes(feature),"Mein DĀR feature missing: "+feature);
}
for(const route of ["quran","recent","quiz"])assert.ok(js.includes('data-dsp-open-route="'+route+'"'),"Missing actual navigation: "+route);
assert.match(js,/dsp-account-mount/,"The existing account surface must contain the personal dashboard");
assert.match(js,/panel\.querySelector\(":scope > \.dsp-account-mount"\)/,"Idempotent mount is required");
assert.doesNotMatch(js,/panel\.querySelector\("#darTestSmartAccount"\)/,"Never nest duplicate dashboard sections");
assert.match(js,/Kontofavoriten, Qurʾān-Lesestand und Quiz-Synchronisierung/,"Local profile data and sync must not be conflated");
assert.match(js,/var area=g==="woman"/,"Gender-adapted content missing");
assert.match(js,/g==="man"\?"Dein Männer-Wissensbereich"/,"Men's dashboard missing");
assert.match(smartCSS,/MEIN DAR PERSONAL DASHBOARD V1/);
assert.match(smartCSS,/@media\(min-width:760px\)/,"Tablet and unfolded Fold layout missing");
assert.match(smartCSS,/@media\(max-width:380px\)/,"Narrow front-display layout missing");

let user={id:"acct-22",username:"testaccount"};
const local=new Map(),listeners={},events=[],win={},document={
 readyState:"loading",body:{classList:{contains:()=>false}},addEventListener:(key,cb)=>{listeners[key]=cb},
 dispatchEvent:e=>events.push(e.type),querySelectorAll:()=>[],querySelector:()=>null,getElementById:()=>null
};
const ctx=vm.createContext({
 location:{pathname:"/",hash:""},window:win,document,
 localStorage:{getItem:key=>local.get(key)||null,setItem:(key,val)=>local.set(key,val)},
 accountSession:()=>user,
 accountFindProfile:async name=>name==="testaccount"?{id:"acct-22",username:"testaccount",pin_salt:"salt",pin_hash:"hash-2468"}:null,
 accountPinHash:async(_name,pin,_salt)=>"hash-"+pin,
 requestAnimationFrame:()=>{},setTimeout:()=>{},console,MutationObserver:function(){this.observe=()=>{}},
 CustomEvent:function(type,info){this.type=type;this.detail=info.detail},
 Date,Math,Number,Array,Object,JSON,String
});
vm.runInContext(js,ctx);
const p=win.DAR_VISITOR_SMART_PROFILE_V1;
assert.ok(p,"Smart profile API missing");
assert.equal(p.isLocked(),false,"Unchosen logged-in profile must allow initial setup");
assert.equal(p.setGender("woman"),true,"First account profile choice should be saved");
assert.equal(p.isLocked(),true,"Saved signed-in profile must lock");
assert.equal(p.setGender("man"),false,"Signed-in account must reject ungated man switch");
assert.equal(p.get().gender,"woman","Rejected switch must not change stored gender");
assert.equal(p.get().chosen,true);
(async()=>{
 await assert.rejects(p.changeGenderWithLogin("man","0000"),/PIN stimmt nicht/,"Wrong account PIN must be rejected");
 assert.equal(p.get().gender,"woman");
 assert.equal(await p.changeGenderWithLogin("man","2468"),true,"Correct existing account PIN should authorize change");
 assert.equal(p.get().gender,"man");
 user=null;
 assert.equal(p.isLocked(),false,"Guest must not be locked");
 assert.equal(p.setGender("neutral"),true);
 assert.equal(p.setGender("woman"),true);
 assert.equal(p.get().gender,"woman");
 const guestKey="darVisitorSmartProfileV1:guest";
 const guestProfile=JSON.parse(local.get(guestKey));
 guestProfile.notes=[{text:"Notiz aus Gastmodus",date:"30.10.2026"}];
 local.set(guestKey,JSON.stringify(guestProfile));
 user={id:"acct-22",username:"testaccount"};
 assert.equal(p.get().gender,"man","Guest selection must not overwrite existing account choice");
 assert.equal(p.guestNotesCount(),1,"Former guest note must be detectable");
 assert.equal(p.importGuestNotes(),1,"Explicit guest note import must preserve a former note");
 assert.equal(p.importGuestNotes(),0,"Import must not duplicate a previously merged guest note");
 assert.equal(p.get().notes[0].text,"Notiz aus Gastmodus");
 assert.equal(JSON.parse(local.get(guestKey)).notes.length,1,"Original guest note must never be deleted");
 user={id:"acct-55",username:"otheraccount"};
 assert.equal(p.get().gender,"neutral","A second account must not see another user's selection");
 const kids=vm.createContext({window:{},location:{pathname:"/test/kids/"}});
 vm.runInContext(js,kids);
 assert.equal(kids.window.DAR_VISITOR_SMART_PROFILE_V1,undefined,"Kids app must remain isolated");
 console.log("PASS: compact 50/50 profile with single Mein DĀR portal, account PIN re-login, notes preserved, guest isolation, Kids excluded");
})().catch(e=>{console.error(e);process.exitCode=1});
