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
for(const locale of ["tr","en","ar","ku","ckb","bs","fr","es"]){
 const city="Bonn";
 const result=t("Standort gespeichert: "+city,locale);
 assert(result&&result.endsWith(" "+city)&&!result.startsWith("Standort gespeichert:"),
  "Saved-location status must translate its prefix but keep the city: "+locale);
 const nonLatin=t("Standort gespeichert: القاهرة",locale);
 assert(nonLatin?.endsWith(" القاهرة"),"Non-Latin city names must remain intact: "+locale);
 assert.equal(t("Standort gespeichert: <script>",locale),null,
  "HTML should never be interpreted as a dynamic location caption");
 assert.equal(t("Standort gespeichert: Bad\\nInput",locale),null,
  "Multiline input must not become a dynamic location caption");
}
const metaExamples={
 tr:["109 âyet · Mekkî","114 sûre · 6236 âyet"],
 en:["109 verses · Meccan","114 surahs · 6236 verses"],
 ar:["١٠٩ آية · مكية","١١٤ سورة · ٦٢٣٦ آية"],
 ku:["109 ayet · Mekkî","114 sûre · 6236 ayet"],
 ckb:[
  new Intl.NumberFormat("ckb-IQ-u-ca-gregory",{useGrouping:false}).format(109)+" ئایەت · مەککی",
  new Intl.NumberFormat("ckb-IQ-u-ca-gregory",{useGrouping:false}).format(114)+" سوورەت · "+
   new Intl.NumberFormat("ckb-IQ-u-ca-gregory",{useGrouping:false}).format(6236)+" ئایەت"
 ],
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
// Only six allowlisted taxonomy names may precede an interface publication count.
for(const locale of ["tr","en","ar","ku","ckb","bs","fr","es"]){
 const shortDate=t("Do., 22.10.26",locale);
 const expectedShortDate=new Intl.DateTimeFormat({
  tr:"tr-TR",en:"en-GB",ar:"ar-EG-u-ca-gregory",ku:"ku-TR",
  ckb:"ckb-IQ-u-ca-gregory",bs:"bs-BA",fr:"fr-FR",es:"es-ES"
 }[locale],{weekday:"short",day:"2-digit",month:"2-digit",year:"2-digit",timeZone:"UTC"})
  .format(new Date(Date.UTC(2026,9,22)));
 assert.equal(shortDate,expectedShortDate,"Gregorian status date "+locale);
 assert.equal(t("Mo., 22.10.26",locale),null,"Reject mismatched Gregorian weekday "+locale);
 assert.equal(t("Do., 32.10.26",locale),null,"Reject impossible Gregorian date "+locale);
 const time=t("Duʿāʾ 09:00 · Empfehlung 12:00",locale);
 assert(time&&time.includes("09:00")&&time.includes("12:00")&&!time.includes("Empfehlung"),
  "Timed UI status must translate its labels and preserve scheduled times: "+locale);
 assert.equal(t("Duʿāʾ 25:00 · Empfehlung 12:00",locale),null,
  "Invalid time must not be reinterpreted as interface metadata");
 const publication=t("Qurʾān, 1 Veröffentlichungen",locale);
 assert(publication?.startsWith("Qurʾān, "),"Must preserve original Qurʾān taxonomy: "+locale);
 assert(!publication.includes("Veröffentlichungen"),"Count suffix is not localized: "+locale);
 const family=t("Familie, 5 Veröffentlichungen",locale);
 assert(family&&!family.includes("Veröffentlichungen"),"Family count not localized: "+locale);
 const range=t("Sūrenbereich wechseln, aktuell 01–20",locale);
 assert(range&&!range.includes("wechseln")&&!range.includes("aktuell"),"Surah-range ARIA label missing: "+locale);
 const loc=({tr:"tr-TR",en:"en-GB",ar:"ar-EG-u-ca-gregory",ku:"ku-TR",ckb:"ckb-IQ-u-ca-gregory",bs:"bs-BA",fr:"fr-FR",es:"es-ES"})[locale];
 const fmt=n=>new Intl.NumberFormat(loc,{useGrouping:false,minimumIntegerDigits:2}).format(n);
 assert(range.includes(fmt(1)+"–"+fmt(20)),"Range must retain leading zero and native digits: "+locale);
 const bibliographic=t("al-Adab al-Mufrad, 3 Veröffentlichungen",locale);
 if(locale==="tr"){
  assert.equal(bibliographic,"al-Adab al-Mufrad, 3 yayın",
   "Existing Turkish bibliography suffix may localize, but title remains canonical");
 }else{
  assert.equal(bibliographic,null,
   "Do not extend translation of bibliographic titles to other locales: "+locale);
 }
}
assert.equal(t("1 Ergebnisse","de"),null);
assert.equal(t("123 unknown count","es"),null);
assert.equal(t("Al-Muwatta öffnen","fr"),null,"Book title should not be generically translated");
console.log("PASS: eight-language counters, Arabic/French/Bosnian plurals, RTL numeric glyphs, percentages, selected items, German fallback and scholarly-source guard");
