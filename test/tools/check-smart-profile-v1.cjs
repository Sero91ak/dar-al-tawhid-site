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
assert.match(css,/dsp-recommend-row/,"Daily recommendations require native capsules");
assert.doesNotMatch(script,/dsp-home-hero/,"Home must not contain a duplicate gender profile hero");
assert.match(script,/data-dsp-switch-profile/,"Account needs one explicit profile-change action");
assert.doesNotMatch(script,/Profil wählen<\/h3>/,"Account must not duplicate the entire gender picker");
assert.match(script,/function toggleSection/,"Interest and saved panels must be interactive");
assert.match(css,/--dhp-capsule-fill/,"Daily cards must inherit existing DĀR capsule palette");
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
assert.match(header,/DAR_TEST_PROFILE_CHOOSER/,"Account profile switch must open existing header chooser");
const headerCSS=read("test/assets/dar-test-premium-header-v2.css");
assert.match(headerCSS,/border:1px solid var\(--dtbh-line\)!important;background:var\(--dtbh-btn\)!important/,"Middle profile icon needs native theme capsule");

assert.match(script,/approved-woman-v1\.webp/,"Chosen woman's actual image must be used in account and header");
assert.match(script,/approved-man-v1\.webp/,"Chosen man's actual image must be used in account and header");
assert.match(header,/approved-woman-v1\.webp/,"Header chooser must display woman's approved avatar");
assert.match(header,/approved-man-v1\.webp/,"Header chooser must display man's approved avatar");
const hashes={
 "approved-man-v1.webp":"21178597cdd5cd12b7c7ddb88f071d914d6c09d3935b6328510cae7363d45de2",
 "approved-woman-v1.webp":"3279f2fdde0559a08eb936d66de08a3088c2079f41994b40f95ece8241db2a63"
};
for(const [filename,digest] of Object.entries(hashes)){
 const original=fs.readFileSync(path.join(root,"test/assets/smart-profile",filename));
 assert.equal(original.toString("ascii",0,4),"RIFF","Approved avatar must be a real WebP file");
 assert.equal(original.toString("ascii",8,12),"WEBP","Approved avatar must be decodable as WebP");
 assert.equal(original[20]&0x10,0x10,"Approved avatar must preserve its transparent alpha channel");
 assert.equal(require("node:crypto").createHash("sha256").update(original).digest("hex"),digest,"Do not replace selected user's original illustration");
}

for(const file of ["avatar-neutral.svg","avatar-woman.svg","avatar-man.svg"]){
 const source=read("test/assets/smart-profile/"+file);
 assert.match(source,/<svg/);assert.match(source,/<\/svg>/);
 assert.doesNotMatch(source,/<circle|<rect|<ellipse/i,"Avatar must not contain a medallion/background");
}
const memory=new Map(),listeners={},win={},loc={pathname:"/test/"};
let user=null;
const overlay={hidden:true,innerHTML:"",querySelector:()=>({focus(){}})};
const panels={"dspExpand-interests":{hidden:true},"dspExpand-saved":{hidden:true}};
const controls={
 '[data-dsp-toggle="interests"]':{setAttribute(name,value){this[name]=value}},
 '[data-dsp-toggle="saved"]':{setAttribute(name,value){this[name]=value}}
};
const doc={
 readyState:"loading",body:{appendChild(){},classList:{add(){},remove(){}}},createElement:()=>overlay,
 addEventListener:(type,fn)=>{listeners[type]=fn},
 querySelector:selector=>controls[selector]||null,
 getElementById:id=>id==="dspNoteText"?{value:"Notiz zum Quellenstudium"}:id==="dspNotesOverlay"?overlay:panels[id]||null
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
assert.equal(api.image("woman"),"/test/assets/smart-profile/approved-woman-v1.webp");
assert.equal(api.get().palette,"keep","Selecting a profile must not override the user’s appearance");
assert.ok(api.recommendations().some(x=>x.tags.includes("women")),"Women's home must highlight women's knowledge");
click("data-dsp-add-note","");
assert.equal(api.get().notes.length,1);
user={id:"separate-account-1",username:"User1"};
assert.equal(api.get().gender,"neutral");
assert.equal(api.get().notes.length,0,"Another account must not read guest notes");
click("data-dsp-gender","man");
assert.equal(api.get().gender,"man");
assert.equal(api.image("man"),"/test/assets/smart-profile/approved-man-v1.webp");
assert.ok(api.recommendations().every(x=>!x.tags.includes("women")),"Men's home excludes women-specific recommendations");
const r1=api.recommendations().map(x=>x.id).join(",");
const r2=api.recommendations().map(x=>x.id).join(",");
assert.equal(r1,r2,"Daily ranking must remain stable within one day");
user=null;
assert.equal(api.get().gender,"woman");
assert.equal(api.get().notes[0].text,"Notiz zum Quellenstudium");
click("data-dsp-toggle","interests");
assert.equal(panels["dspExpand-interests"].hidden,false,"Interest options must visually expand");
click("data-dsp-toggle","interests");
assert.equal(panels["dspExpand-interests"].hidden,true,"Interest options must visually collapse");
click("data-dsp-open-saved","");
assert.equal(panels["dspExpand-saved"].hidden,false,"Saved shortcut must expand bookmark list");
let chooserCalls=0;
win.DAR_TEST_PROFILE_CHOOSER={open(){chooserCalls++}};
click("data-dsp-switch-profile","");
assert.equal(chooserCalls,1,"Account profile change must invoke the existing header selector");
click("data-dsp-interest","adab");
assert.ok(api.get().interests.includes("adab"),"Interest toggle persists");
click("data-dsp-interest","adab");
assert.ok(!api.get().interests.includes("adab"),"Interest toggle removes interest");
click("data-dsp-save","q1");
assert.ok(api.get().saved.includes("q1"),"Save to smart reading list");
click("data-dsp-save","q1");
assert.ok(!api.get().saved.includes("q1"),"Remove from smart reading list");
console.log("PASS DĀR TEST smart profile V3: native capsules, no duplicate profile, theme, interests, list, account isolation.");
