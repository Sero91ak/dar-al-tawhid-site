#!/usr/bin/env node
"use strict";
/* Regression test: numeric labels are app UI, not user or religious content.
 * No browser, no API keys, no paid provider. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=(p)=>fs.readFileSync(path.join(__dirname,p),"utf8");
const source=read("../assets/dar-test-turkish-ui.js");
const catalog=JSON.parse(read("adult-ui-locales-seven.json"));
const doc={body:{nodeType:1,closest:()=>null,getAttribute:()=>null},
 documentElement:{lang:"de",dir:"ltr"},readyState:"loading",
 createTreeWalker(){return{nextNode:()=>null}},querySelectorAll(){return[]},addEventListener(){}};
const w={document:doc,location:{pathname:"/test/"},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem:()=>"de"},addEventListener(){}};
vm.runInNewContext(source,{window:w});
const runtime=w.DarTestTurkishUI;
assert(runtime?.registerLocaleData(catalog),"Static nine-language UI pack rejected");
const t=(input,locale)=>runtime.translateValue(input,locale);
assert.equal(t("1 Ergebnisse","en"),"1 result");
assert.equal(t("2 Ergebnisse","en"),"2 results");
assert.equal(t("1 Ergebnisse","fr"),"1 résultat");
assert.equal(t("2 Ergebnisse","fr"),"2 résultats");
assert.equal(t("1 Ergebnisse","es"),"1 resultado");
assert.equal(t("2 Ergebnisse","es"),"2 resultados");
assert.equal(t("1 Ergebnisse","ar"),"١ نتيجة");
assert.equal(t("2 Ergebnisse","ar"),"٢ نتيجتان");
assert.equal(t("5 Ergebnisse","ar"),"٥ نتائج");
assert.equal(t("1 Funktionen","bs"),"1 funkcija");
assert.equal(t("2 Funktionen","bs"),"2 funkcije");
assert.equal(t("5 Funktionen","bs"),"5 funkcija");
assert.equal(t("0 Funktionen","bs"),"0 funkcija");
for(const code of ["tr","en","ar","ku","ckb","bs","fr","es"]){
 for(const value of ["0 Ergebnisse","1 Funktionen","12 Veröffentlichungen",
  "3 Beiträge","5 Seiten","2 Themenbereiche","6 Aussagen","4 gemerkt"]){
  const got=t(value,code);
  assert(typeof got==="string"&&got.trim(),code+" missing dynamic form for "+value);
  assert(!got.includes(value.replace(/^[0-9]+ /,"")),code+" still shows German UI unit in "+value);
 }
 const accuracy=t("87,5% Trefferquote",code);
 assert(accuracy&&accuracy!== "87,5% Trefferquote","Accuracy unlocalized "+code);
 const chosen=t("3/5 gewählt",code);
 assert(chosen&&!chosen.includes("gewählt"),"Selection unlocalized "+code);
 assert.equal(t("„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“",code),null,
  "Never translate an attributed scholarly quote in general UI runtime");
}
const metaExamples={
 tr:["109 âyet · Mekkî","114 sûre · 6236 âyet"],
 en:["109 verses · Meccan","114 surahs · 6236 verses"],
 ar:["١٠٩ آية · مكية","١١٤ سورة · ٦٢٣٦ آية"],
 ku:["109 ayet · Mekkî","114 sûre · 6236 ayet"],
 ckb:["109 ئایەت · مەککی","114 سوورەت · 6236 ئایەت"],
 bs:["109 ajeta · mekanska","114 sura · 6236 ajeta"],
 fr:["109 versets · mecquois","114 sourates · 6236 versets"],
 es:["109 aleyas · mequí","114 suras · 6236 aleyas"]
};
for(const [locale,expected] of Object.entries(metaExamples)){
 assert.equal(t("109 Āyāt · Mekkanisch",locale),expected[0],"Surah period display "+locale);
 assert.equal(t("114 Sūren · 6236 Āyāt",locale),expected[1],"Surah collection display "+locale);
 assert.equal(t("Al-Baqarah",locale),null,"Surah name must remain untouched");
 assert.equal(t("قُلْ هُوَ اللَّهُ أَحَدٌ",locale),null,"Arabic verse must remain untouched");
}
assert.equal(t("1 Ergebnisse","de"),null);
assert.equal(t("123 unknown count","es"),null);
assert.equal(t("Al-Muwatta öffnen","fr"),null,"Book title should not be generically translated");
console.log("PASS: eight-language counters, Arabic/French/Bosnian plurals, RTL numeric glyphs, percentages, selected items, German fallback and scholarly-source guard");
