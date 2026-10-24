#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ui=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const titles=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-visible-title-drafts-seven.json"),"utf8"));
const EXPECTED=["de","tr","en","ar","ku","ckb","bs","fr","es"];
assert.deepEqual(pack.availableLocales,EXPECTED);
assert.deepEqual(pack.pendingLocales,[]);
for(const locale of EXPECTED.slice(1)){
 const v=pack.translations[locale];
 assert(Object.keys(v).length>=350,locale+" missing section labels");
 for(const term of ["ÜBERLIEFERUNGSMAẞSTAB","Gebetskalender","Faǧr","Ẓuhr","ʿAṣr","Maghrib","ʿIshāʾ",
 "Übersicht","Lebensweg","Aussagen im Qurʾān","Aussagen in authentischer Sunnah",
 "Gebetszeiten & Kalender","Beitragstitel","Titel der Beiträge","Duʿāʾ öffnen","Willkommen bei DĀR AL TAWḤĪD"]){
  assert(v[term]?.trim(),locale+" missing "+term);
 }
}
assert.equal(titles.bodyTranslation,false);
assert.equal(titles.paidApiCalls,0);
assert(Object.keys(titles.records).length>=103);
const els=[],body={nodeType:1,closest:()=>null,getAttribute:()=>null};
const makeText=(value,excluded=false)=>({nodeType:3,nodeValue:value,parentElement:{closest:()=>excluded?({tagName:"CANONICAL"}):null}});
const primary=makeText("ÜBERLIEFERUNGSMAẞSTAB"),prayer=makeText("Faǧr"),weekday=makeText("Mittwoch, 21. Oktober 2026"),
 original=makeText("رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",true),
 excluded=makeText("Nicht authentisch belegt",true);
const dynamicQuran=makeText("Qurʾān · 8 Fundstellen"),
 dynamicStatements=makeText("Aussagen im Qurʾān · 3"),
 preservedSource=makeText("Qurʾān · 8 Fundstellen",true);
const nodes=[primary,prayer,weekday,original,excluded,dynamicQuran,dynamicStatements,preservedSource];
const props={
 nodeType:1,children:[],textContent:"📖 Wer Gutes zeigt, bekommt Anteil am Lohn",
 closest:()=>({getAttribute:()=> "wer-gutes-zeigt-bekommt-anteil-am-lohn-198"}),
 getAttribute:()=>null
};
const doc={
 documentElement:{lang:"de",dir:"ltr"},body,readyState:"loading",
 createTreeWalker(){let i=-1;return{nextNode:()=>nodes[++i]||null}},
 querySelectorAll:()=>[props],addEventListener:()=>{}
};
let lng="de";
const w={location:{pathname:"/test/"},document:doc,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem:()=>lng},addEventListener:()=>{}};
vm.runInNewContext(ui,{window:w});
const runtime=w.DarTestTurkishUI;
assert(runtime.registerLocaleData(pack));
assert(runtime.registerTitleData(titles));
assert.equal(runtime.localizedDraftTitleCount,Object.keys(titles.records).length);
for(const locale of EXPECTED){
 lng=locale;runtime.apply();
 const v=pack.translations[locale];
 assert.equal(primary.nodeValue,locale==="de"?"ÜBERLIEFERUNGSMAẞSTAB":v["ÜBERLIEFERUNGSMAẞSTAB"],locale+" motto");
 assert.equal(prayer.nodeValue,locale==="de"?"Faǧr":(locale==="tr"?"Sabah (Fecr)":v["Faǧr"]),locale+" prayer");
 const postRecord=titles.records["post:wer-gutes-zeigt-bekommt-anteil-am-lohn-198"];
 const expectedPostTitle=locale==="de"?postRecord.sourceTitle:postRecord.translations[locale];
 assert.equal(props.textContent,expectedPostTitle,locale+" post title");
 assert.equal(original.nodeValue,"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً","Arabic source modified");
 assert.equal(excluded.nodeValue,"Nicht authentisch belegt","source text modified");
 assert.equal(doc.documentElement.dir,["ar","ckb"].includes(locale)?"rtl":"ltr");
 const corpus=pack.translations[locale]||{};
 const expectedQuran=locale==="de"?"Qurʾān · 8 Fundstellen":
   (locale==="tr"?"Kur'an":corpus["Qurʾān"])+" · 8 "+corpus["Fundstellen"];
 assert.equal(dynamicQuran.nodeValue,expectedQuran,locale+" numeric Quran heading");
 const statement=locale==="de"?"Aussagen im Qurʾān · 3":
   (locale==="tr"?"Kur'ân'daki ifadeler":corpus["Aussagen im Qurʾān"])+" · 3";
 assert.equal(dynamicStatements.nodeValue,statement,locale+" numeric statement heading");
 assert.equal(preservedSource.nodeValue,"Qurʾān · 8 Fundstellen","A sourced verse note must not be translated");
 if(locale==="en") assert(/Wednesday|October/.test(weekday.nodeValue),"Calendar month/day not localized");
}
lng="de";runtime.apply();
assert.equal(weekday.nodeValue,"Mittwoch, 21. Oktober 2026","calendar failed to restore German");
assert.equal(runtime.formatCalendarDate("2026-10-21T12:00:00Z","en",{weekday:"long",timeZone:"UTC"}),"Wednesday");
assert.equal(runtime.formatCalendarDate("2026-10-21T12:00:00Z","fr",{weekday:"long",timeZone:"UTC"}),"mercredi","French date must not fall back to German");
assert.equal(runtime.formatCalendarDate("2026-10-21T12:00:00Z","es",{weekday:"long",timeZone:"UTC"}),"miércoles","Spanish date must not fall back to German");
assert(runtime.translatePrayerName("Maghrib","en")==="Maghrib");
assert(runtime.translatePrayerName("Maghrib","tr")==="Akşam");
console.log("PASS: nine translated UI locales, full welcome/prayer/calendar/prophet UI, post exclusion, German rollback and source protection");
