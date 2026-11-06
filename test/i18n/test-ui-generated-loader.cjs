#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const local={locale:"tr"},events={},nodes=[];
const content={nodeType:3,nodeValue:"Sprache der Benutzeroberfläche",parentElement:{closest:()=>null}};
const immutable={nodeType:3,nodeValue:"Sprache der Benutzeroberfläche",parentElement:{closest:()=>({id:"post-body"})}};
nodes.push(content,immutable);
const doc={
 documentElement:{lang:"de"},body:{nodeType:1,closest:()=>null,getAttribute:()=>null},
 createTreeWalker(){let n=-1;return {nextNode:()=>nodes[++n]||null}},
 readyState:"loading",addEventListener:(n,cb)=>events[n]=cb
};
const window={location:{pathname:"/test/"},document:doc,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem:()=>local.locale},
 addEventListener:(n,cb)=>events[n]=cb};
vm.runInNewContext(code,{window});
(async()=>{
 const ui=window.DarTestTurkishUI;
 assert.equal(ui.hasTranslation("Sprache der Benutzeroberfläche"),false);
 await ui.loadCatalog(async (url,opts)=>{
  assert.equal(url,"/assets/i18n/adult-ui-de-tr.json");
  assert.equal(opts.credentials,"same-origin");
  return {ok:true,json:async()=>({schemaVersion:1,locale:"tr",sourceLocale:"de",
   scope:"adult-interface-only",entries:{
    "Sprache der Benutzeroberfläche":"Arayüz dili",
    "Neueste Beiträge":"Kötü öncelik", // manually curated string must win
    "الْقُرْآنُ":"Bu geçersiz"
   }})};
 });
 assert.equal(ui.catalogStatus,"loaded");
 assert.equal(ui.hasTranslation("Sprache der Benutzeroberfläche"),true);
 ui.apply();
 assert.equal(content.nodeValue,"Arayüz dili");
 assert.equal(immutable.nodeValue,"Sprache der Benutzeroberfläche","never translate source material");
 assert.equal(ui.hasTranslation("الْقُرْآنُ"),false,"Arabic UI source must not be translated");
 assert.equal(ui.translateValue("42 Veröffentlichungen"),"42 yayın");
 assert.equal(ui.translateValue("109 Āyāt · Mekkanisch"),"109 âyet · Mekkî");
 assert.equal(ui.translateValue("Sunan Abī Dāwūd öffnen"),"Sunan Abī Dāwūd aç");
 assert.equal(ui.translateValue("Al-Kahf öffnen"),"Al-Kahf aç");
 assert.equal(ui.translateValue("9/10 gewählt"),"9/10 seçildi");
 assert.equal(ui.translateValue("Sūrenbereich wechseln, aktuell 21–40"),"Sûre aralığını değiştir, şu an 21–40");
 assert(ui.translatedKeys>200,"Extend existing manually curated dictionary");
 local.locale="de";ui.apply();
 assert.equal(content.nodeValue,"Sprache der Benutzeroberfläche","German round trip");
 console.log("PASS: versioned Turkish static UI pack, cache, manual precedence, Arabic/source block protection and DE fallback");
})().catch(e=>{console.error(e);process.exitCode=1});
