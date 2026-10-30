#!/usr/bin/env node
/* Regression: isolated DĀR TEST smart profile V1 (no external services). */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=(name)=>fs.readFileSync(path.join(root,name),"utf8");
const script=read("test/assets/dar-smart-profile-v1.js");
const css=read("test/assets/dar-smart-profile-v1.css");
const home=read("test/assets/dar-home-html-parity-v1.js");
new vm.Script(script,{filename:"dar-smart-profile-v1.js"});
assert.match(script,/!\/\^\\\/test/,"Only /test should initialize");
assert.match(script,/\/test\\\/kids/,"Kids must stay excluded");
assert.match(home,/dar-smart-profile-v1\.js\?v=/,"Active Test Home must load Smart Profile script");
assert.match(home,/dar-smart-profile-v1\.css\?v=/,"Active Test Home must load Smart Profile styles");
assert.match(css,/prefers-reduced-motion/,"Reduced motion safety required");
assert.match(css,/dsp-home-hero/,"Home hero required");
assert.match(css,/dsp-account-heading/,"Single open account heading required");
assert.doesNotMatch(script,/dsp-account-hero/,"Nested account hero must not return");
assert.match(script,/dsp-notes-dialog/,"Notes need an independent modal view");
assert.match(script,/function syncHeaderAvatar/,"Header profile avatar must follow selection");
assert.match(home,/dhp-quick-qibla/,"Qibla needs a styled quick-search entry");
assert.match(home,/dar-qibla-quick-v2\.css/,"Test Qibla quick view theme CSS must load on tap");
const qiblaQuickTheme=read("test/assets/dar-qibla-quick-v2.css");
assert.match(qiblaQuickTheme,/qibla-qv__panel/,"Quick Qibla theme must style the opened sheet");
assert.match(qiblaQuickTheme,/var\(--card/,"Qibla quick view must respect the selected appearance");
assert.doesNotMatch(qiblaQuickTheme,/\/kids\//,"Adult Qibla quick view cannot touch Kids");

const header=read("test/assets/dar-test-premium-header-v2.js");
new vm.Script(header,{filename:"dar-test-premium-header-v2.js"});
assert.match(header,/setupChooser\(h,account\)/,"Middle header icon must open profile choice");
for(const file of ["avatar-neutral.svg","avatar-woman.svg","avatar-man.svg"]){
 const source=read("test/assets/smart-profile/"+file);
 assert.match(source,/<svg/);assert.match(source,/<\/svg>/);
 assert.doesNotMatch(source,/<circle|<rect|<ellipse/i,"Avatar must not contain a medallion/background");
}
const memory=new Map(),listeners={},win={},loc={pathname:"/test/"};
let user=null;
const overlay={hidden:true,innerHTML:"",querySelector:()=>({focus(){}})};
const doc={
 readyState:"loading",body:{appendChild(){},classList:{add(){},remove(){}}},createElement:()=>overlay,
 addEventListener:(type,fn)=>{listeners[type]=fn},
 querySelector:()=>null,
 getElementById:(id)=>id==="dspNoteText"?{value:"Notiz zum Quellenstudium"}:id==="dspNotesOverlay"?overlay:null
};
const records=[
 {id:"w1",title:"Frauenwissen: Stellung der Frau",category:"Fiqh"},
 {id:"w2",title:"Die Rechte der Ehefrau",category:"Familie"},
 {id:"t1",title:"Tawḥīd – Allah allein anbeten",category:"ʿAqīdah"},
 {id:"t2",title:"Grundlagen des Tawḥīd",category:"Glaubenslehre"},
 {id:"q1",title:"Qurʾān im Alltag",category:"Qurʾān"},
 {id:"s1",title:"Die Sunnah im Alltag",category:"Ḥadīṯ"},
 {id:"a1",title:"Adab und Akhlāq",category:"Wissen"},
 {id:"d1",title:"Duʿāʾ im Tagesablauf",category:"Duʿāʾ"},
 {id:"f1",title:"Fiqh im Gebet",category:"Fiqh"},
 {id:"h1",title:"Geschichte der Ṣaḥābah",category:"Geschichte"}
];
const ctx=vm.createContext({
 window:win,document:doc,location:loc,posts:records,accountSession:()=>user,
 localStorage:{getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},
 navigator:{onLine:true},console,requestAnimationFrame:()=>{}
});
vm.runInContext(script,ctx);
const api=win.DAR_TEST_SMART_PROFILE_V1;
assert.ok(api,"Runtime exposed to Test QA");
assert.equal(api.get().gender,"neutral");
function click(name,value){
 const target={hasAttribute:(n)=>n===name,getAttribute:(n)=>n===name?value:null};
 listeners.click({target:{closest:(selector)=>selector.includes("["+name+"]")?target:null},preventDefault(){},stopPropagation(){}});
}
click("data-dsp-gender","woman");
assert.equal(api.get().gender,"woman");
assert.equal(api.get().palette,"keep","Selecting a profile must not override the user’s appearance");
assert.ok(api.recommendations().some(x=>x.tags.includes("women")),"Women's home must highlight women's knowledge");
click("data-dsp-add-note","");
assert.equal(api.get().notes.length,1);
user={id:"separate-account-1",username:"User1"};
assert.equal(api.get().gender,"neutral");
assert.equal(api.get().notes.length,0,"Another account must not read guest notes");
click("data-dsp-gender","man");
assert.equal(api.get().gender,"man");
assert.ok(api.recommendations().every(x=>!x.tags.includes("women")),"Men's home excludes women-specific recommendations");
const r1=api.recommendations().map(x=>x.id).join(",");
const r2=api.recommendations().map(x=>x.id).join(",");
assert.equal(r1,r2,"Daily ranking must remain stable within one day");
user=null;
assert.equal(api.get().gender,"woman");
assert.equal(api.get().notes[0].text,"Notiz zum Quellenstudium");
console.log("PASS DĀR TEST smart profile V2: routes, free-form avatars, gender, independent themes, quick Qibla, notes overlay, account isolation.");
