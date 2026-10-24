#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const locales=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const inventory=require(path.join(__dirname,"adult-ui-web-inventory.cjs"));
const code=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const expected=["de","tr","en","ar","ku","ckb","bs","fr","es"];
const translated=["tr","en","ar","ku","ckb","bs","fr","es"];
const baselineUiTextCount=421+inventory.expandedWebKeys.length+inventory.readerChromeKeys.length;
const referenceUiKeys=Object.keys(locales.translations.en);
const expectedUiTextCount=referenceUiKeys.length;
assert.deepEqual(locales.availableLocales,expected);
assert.deepEqual(locales.translatedLocales,["de",...translated]);
assert.deepEqual(locales.pendingLocales,[]);
assert.equal(locales.noPaidProvider,true);
assert.deepEqual(Object.keys(locales.translations).sort(),expected.filter(x=>x!=="de").sort());
const countByLocale={};
for(const locale of translated){
 const dict=locales.translations[locale];
 const values=Object.keys(dict);
 assert(referenceUiKeys.length>=baselineUiTextCount,"UI catalog shrank below the reviewed baseline");
 assert.equal(values.length,expectedUiTextCount,locale+" UI inventory count");
 assert.deepEqual(values.slice().sort(),referenceUiKeys.slice().sort(),locale+" UI keys diverged");
 assert(values.every(x=>x.trim()&&typeof dict[x]==="string"&&dict[x].trim()));
 for(const key of inventory.expandedWebKeys)assert(dict[key]?.trim(),locale+" missing expanded web UI key "+key);
 for(const key of inventory.readerChromeKeys)assert(dict[key]?.trim(),locale+" missing reader chrome key "+key);
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
 {nodeType:3,nodeValue:"الْقُرْآنُ",parentElement:{closest:()=>null}},
 {nodeType:3,nodeValue:"← Zurück",parentElement:{closest:()=>null}}
];
const doc={
 documentElement:{lang:"de",dir:"ltr"},body:{nodeType:1,closest:()=>null,getAttribute:()=>null},
 createTreeWalker(){let i=-1;return{nextNode:()=>nodes[++i]||null}},
 readyState:"loading",addEventListener:(name,fn)=>events[name]=fn
};
const w={document:doc,location:{pathname:"/test/"},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem:()=>storage.locale},addEventListener:(name,fn)=>events[name]=fn};
vm.runInNewContext(code,{window:w,Map,Set,WeakMap,Promise,Uint8Array});
assert.deepEqual(Array.from(w.DarTestTurkishUI.supportedLocales),expected);
assert.equal(w.DarTestTurkishUI.registerLocaleData(locales),true);
for(const locale of expected){
 storage.locale=locale;w.DarTestTurkishUI.apply();
 const homepage=locale==="de"?"Startseite":locale==="tr"?"Ana Sayfa":locales.translations[locale]?.Startseite||"Startseite";
 const prayer=locale==="de"?"Gebetszeiten":locale==="tr"?"Namaz Vakitleri":locales.translations[locale]?.Gebetszeiten||"Gebetszeiten";
 assert.equal(nodes[0].nodeValue,homepage,locale+" homepage");
 assert.equal(nodes[1].nodeValue,prayer,locale+" prayer");
 assert.equal(nodes[2].nodeValue,"Originalquellen bleiben unverändert","canonical content MUST remain unchanged");
 assert.equal(nodes[3].nodeValue,"الْقُرْآنُ","Arabic original must remain unchanged");
 const back=locale==="de"?"Zurück":locale==="tr"?"Geri":locales.translations[locale].Zurück;
 assert.equal(nodes[4].nodeValue,"← "+back,locale+" composed back label");
 assert.equal(doc.documentElement.lang,locale);
 assert.equal(doc.documentElement.dir,["ar","ckb"].includes(locale)?"rtl":"ltr");
}
assert.equal(w.DarTestTurkishUI.translatedFor("fr"),expectedUiTextCount);
assert.equal(w.DarTestTurkishUI.translatedFor("es"),expectedUiTextCount);
assert.equal(w.DarTestTurkishUI.translateValue("3 Treffer","ku"),"3 "+locales.translations.ku.Treffer);
assert.equal(w.DarTestTurkishUI.translateValue("Wetter für Berlin wird geladen …","ku"),locales.translations.ku["Wetter für"]+" Berlin "+locales.translations.ku["wird geladen"]+" …");
assert.equal(w.DarTestTurkishUI.translateValue("Wetter · Berlin: derzeit nicht verfügbar","es"),locales.translations.es.Wetter+" · Berlin: "+locales.translations.es["derzeit nicht verfügbar"]);
assert.equal(w.DarTestTurkishUI.translateValue("Wetter · Köln: 12 °C · Klar","ku"),locales.translations.ku.Wetter+" · Köln: 12 °C · "+locales.translations.ku.Klar);
assert.equal(locales.translations.es["Inhalt wird vorbereitet…"],"Preparando el contenido…");
assert.equal(locales.translations.ku["Wissen durchsuchen"],"Li zanînê bigere");
const coverage=JSON.parse(fs.readFileSync(path.join(__dirname,"locale-coverage-report.json"),"utf8"));
assert.equal(coverage.ui.keys,expectedUiTextCount);
assert.equal(coverage.acceptance.contentComplete,false);
assert.equal(coverage.content.quranMeanings.reviewedEightLanguagePack,false);
assert.equal(coverage.push.liveSend,false);
storage.locale="de";w.DarTestTurkishUI.apply();
assert.equal(nodes[0].nodeValue,"Startseite","German return must be lossless");
const here=fs.readFileSync(path.join(__dirname,"../assets/dar-test-seven-languages-loader.js"),"utf8");
assert(!here.includes("api.openai.com"),"Client must never use paid translation API");
assert(here.includes("/test/i18n/adult-ui-locales-seven.json"),"Require fixed static same-origin locale pack");
for(const file of inventory.sourceFiles){
 const source=fs.readFileSync(path.join(__dirname,"..","..",file),"utf8");
 for(const key of inventory.expandedWebKeys){
  const marker=inventory.sourceMarkers[key]||key;
  assert(inventory.sourceFiles.some(candidate=>fs.readFileSync(path.join(__dirname,"..","..",candidate),"utf8").includes(marker)),"Expanded UI key is not present in approved source files: "+key);
 }
}
console.log("PASS: 9 registered locales (9 translated) in 3 language selectors, "+JSON.stringify(countByLocale)+", DE restoration, source protection and RTL");
