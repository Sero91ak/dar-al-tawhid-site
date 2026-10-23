#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const code=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const expected=["de","tr","en","ar","ku","ckb","bs"];
const nine=[...expected,"fr","es"];
const ninePack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-nine-v8.json"),"utf8"));
assert.deepEqual(ninePack.availableLocales,nine);
assert.equal(ninePack.scope,"adult-interface-only");
assert.deepEqual(locales.availableLocales,expected);
assert.equal(locales.noPaidProvider,true);
assert.deepEqual(Object.keys(locales.translations).sort(),expected.filter(x=>x!=="de").sort());
const countByLocale={};
for(const locale of expected.slice(1)){
 const dict=locales.translations[locale];
 const values=Object.keys(dict);
 assert(values.length>=160,locale+" lacks basic UI vocabulary");
 assert(values.every(x=>x.trim()&&typeof dict[x]==="string"&&dict[x].trim()));
 for(const label of ["Startseite","Mehr","Gebetszeiten","Einstellungen","Suche","Konto","Suchen","Heute","Qurʾān","Duʿāʾ"]){
  assert(dict[label],locale+" missing "+label);
 }
 countByLocale[locale]=values.length;
}
const events={},storage={locale:"de"};
const nodes=[
 {nodeType:3,nodeValue:"Startseite",parentElement:{closest:()=>null}},
 {nodeType:3,nodeValue:"Gebetszeiten",parentElement:{closest:()=>null}},
 {nodeType:3,nodeValue:"Originalquellen bleiben unverändert",parentElement:{closest:()=>({immutable:true})}},
 {nodeType:3,nodeValue:"الْقُرْآنُ",parentElement:{closest:()=>null}}
];
const doc={
 documentElement:{lang:"de",dir:"ltr"},body:{nodeType:1,closest:()=>null,getAttribute:()=>null},
 createTreeWalker(){let i=-1;return{nextNode:()=>nodes[++i]||null}},
 readyState:"loading",addEventListener:(name,fn)=>events[name]=fn
};
const w={document:doc,location:{pathname:"/test/"},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem:()=>storage.locale},addEventListener:(name,fn)=>events[name]=fn};
vm.runInNewContext(code,{window:w,Map,Set,WeakMap,Promise,Uint8Array});
assert.deepEqual(Array.from(w.DarTestTurkishUI.supportedLocales),nine);
assert.equal(w.DarTestTurkishUI.registerLocaleData(ninePack),true);
for(const locale of expected){
 storage.locale=locale;w.DarTestTurkishUI.apply();
 const homepage=locale==="de"?"Startseite":locale==="tr"?"Ana Sayfa":locales.translations[locale].Startseite;
 const prayer=locale==="de"?"Gebetszeiten":locale==="tr"?"Namaz Vakitleri":locales.translations[locale].Gebetszeiten;
 assert.equal(nodes[0].nodeValue,homepage,locale+" homepage");
 assert.equal(nodes[1].nodeValue,prayer,locale+" prayer");
 assert.equal(nodes[2].nodeValue,"Originalquellen bleiben unverändert","canonical content MUST remain unchanged");
 assert.equal(nodes[3].nodeValue,"الْقُرْآنُ","Arabic original must remain unchanged");
 assert.equal(doc.documentElement.lang,locale);
 assert.equal(doc.documentElement.dir,["ar","ckb"].includes(locale)?"rtl":"ltr");
}
storage.locale="de";w.DarTestTurkishUI.apply();
assert.equal(nodes[0].nodeValue,"Startseite","German return must be lossless");
const here=fs.readFileSync(path.join(__dirname,"../assets/dar-test-seven-languages-loader.js"),"utf8");
assert(!here.includes("api.openai.com"),"Client must never use paid translation API");
assert(here.includes("/test/i18n/adult-ui-locales-nine-v8.json"),"Require fixed static same-origin nine-locale pack");
console.log("PASS: original 7 locales regression with 9-locale runtime, "+JSON.stringify(countByLocale)+", DE restoration, source protection and RTL");
