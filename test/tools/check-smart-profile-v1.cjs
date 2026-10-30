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
assert.match(css,/dsp-account-hero/,"Account hero required");
for(const file of ["avatar-woman.svg","avatar-man.svg","hero-woman.svg","hero-man.svg"]){
 const source=read("test/assets/smart-profile/"+file);
 assert.match(source,/<svg/);assert.match(source,/<\/svg>/);
}
const memory=new Map(),listeners={},win={},loc={pathname:"/test/"};
let user=null;
const doc={
 readyState:"loading",
 addEventListener:(type,fn)=>{listeners[type]=fn},
 querySelector:()=>null,
 getElementById:(id)=>id==="dspNoteText"?{value:"Notiz zum Quellenstudium"}:null
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
assert.equal(api.get().palette,"salbei");
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
console.log("PASS DĀR TEST smart profile: routes, assets, gender, themes, daily recommendations, notes, account isolation.");
