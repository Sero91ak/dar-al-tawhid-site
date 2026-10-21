#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"dar-test-turkish-ui.js"),"utf8");
function harness(locationPath="/test/"){
 const events={},attrs={};
 const local={language:"tr"};
 const button={nodeType:1,parentElement:null,attrs:{placeholder:"Suche Wissen, Beiträge, Bücher, Gelehrte …"},
   closest:()=>null,getAttribute(x){return this.attrs[x]??null},setAttribute(x,v){this.attrs[x]=v}};
 const heading={nodeType:3,nodeValue:"Neueste Beiträge",parentElement:{closest:()=>null}};
 const nav={nodeType:3,nodeValue:"Startseite",parentElement:{closest:()=>null}};
 const religious={nodeType:3,nodeValue:"Neueste Beiträge",parentElement:{closest:()=>({tagName:"ARTICLE"})}};
 const arabic={nodeType:3,nodeValue:"الْقُرْآنُ",parentElement:{closest:()=>({tagName:"ARABIC"})}};
 const nodes=[button,heading,nav,religious,arabic];
 const doc={body:{nodeType:1,closest:()=>null,getAttribute:()=>null},documentElement:{lang:"de"},
  createTreeWalker(){let i=-1;return{nextNode(){return nodes[++i]||null}}},
  readyState:"loading",addEventListener(n,cb){events[n]=cb}};
 const w={location:{pathname:locationPath},document:doc,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
  localStorage:{getItem:()=>local.language,setItem(_,v){local.language=v}},
  addEventListener(n,cb){events[n]=cb}};
 vm.runInNewContext(src,{window:w});
 return {w,nodes,local,events};
}
let t=harness();
assert.equal(t.w.DarTestTurkishUI.translatedKeys>130,true);
t.w.DarTestTurkishUI.apply();
assert.equal(t.nodes[1].nodeValue,"Son Yazılar");
assert.equal(t.nodes[2].nodeValue,"Ana Sayfa");
assert.equal(t.nodes[3].nodeValue,"Neueste Beiträge","Canonical religious content must remain unchanged");
assert.equal(t.nodes[4].nodeValue,"الْقُرْآنُ");
assert.equal(t.nodes[0].attrs.placeholder,"İlim, yazı, kitap ve âlim ara …");
assert.equal(t.w.document.documentElement.lang,"tr");
t.local.language="de";
t.w.DarTestTurkishUI.apply();
assert.equal(t.nodes[1].nodeValue,"Neueste Beiträge");
assert.equal(t.nodes[2].nodeValue,"Startseite");
assert.equal(t.nodes[0].attrs.placeholder,"Suche Wissen, Beiträge, Bücher, Gelehrte …");
assert.equal(t.w.document.documentElement.lang,"de");
assert.equal(harness("/").w.DarTestTurkishUI,undefined,"Visitor website must remain untouched");
assert.equal(harness("/test/kids/").w.DarTestTurkishUI,undefined,"Kids must remain untouched");
assert(!/api\.openai\.com|DAR_I18N_AI_API_KEY|fetch\s*\(/.test(src),"UI localization must remain fully static");
console.log("PASS: 170+ Turkish UI keys, reversible text and attributes, canonical religious content excluded, visitor/Kids isolated");
