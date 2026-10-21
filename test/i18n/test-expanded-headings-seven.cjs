#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ui=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const titles=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-visible-title-drafts-seven.json"),"utf8"));
const EXPECTED=["de","tr","en","ar","ku","ckb","bs"];
for(const locale of EXPECTED.slice(1)){
 const v=pack.translations[locale];
 assert(Object.keys(v).length>=350,locale+" missing section labels");
 assert(Object.keys(v).length>=478,locale+" missing Quran/home/library expansion");
 for(const label of ["Qurʾān-Player","BEITRÄGE NACH QURʾĀN · SUNNAH · AṮĀR",
   "Die Qurʾān-Texte konnten nicht geladen werden. Bitte erneut versuchen.",
   "Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.",
   "Bibliothek des Wissens","Überlieferer, frühe Imāme und ihre Werke.",
   "Mikrofon konnte nicht geöffnet werden."]){
  assert(v[label]?.trim(),locale+" missing routed UI label "+label);
 }

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
const numericPosts=makeText("18 Beiträge"),numericSurahs=makeText("7 Sūren · 26 Āyāt"),
 dynamicAyahLink=makeText("Im Qurʾān öffnen · 2:45"),
 dynamicSurahButton=makeText("Sūrah Al-Baqarah öffnen"),
 dynamicSurahCount=makeText("114 Suren mit Arabisch und Lautschrift."),
 dynamicDuaCount=makeText("5 bekannte Duʿāʾ nach Themen.");
const nodes=[primary,prayer,weekday,original,excluded,dynamicQuran,dynamicStatements,preservedSource,
 numericPosts,numericSurahs,dynamicAyahLink,dynamicSurahButton,dynamicSurahCount,dynamicDuaCount];
const props={
 nodeType:1,children:[],textContent:"📖 Wer Gutes zeigt, bekommt Anteil am Lohn",
 closest:()=>({getAttribute:()=> "wer-gutes-zeigt-bekommt-anteil-am-lohn-198"}),
 getAttribute:()=>null
};
const repeatedA={
 nodeType:1,children:[],textContent:"📖 Der Qurʾān ist Allahs Wort",
 closest:()=>({getAttribute:()=> "ahmad-quran-kalam-allah-001"}),getAttribute:()=>null
};
const repeatedB={
 nodeType:1,children:[],textContent:"📖 Der Qurʾān ist Allahs Wort",
 closest:()=>({getAttribute:()=> "abu-hatim-quran-kalam-allah-001"}),getAttribute:()=>null
};
const doc={
 documentElement:{lang:"de",dir:"ltr"},body,readyState:"loading",
 createTreeWalker(){let i=-1;return{nextNode:()=>nodes[++i]||null}},
 querySelectorAll:()=>[props,repeatedA,repeatedB],addEventListener:()=>{}
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
 assert.equal(props.textContent,locale==="de"?titles.records["post:wer-gutes-zeigt-bekommt-anteil-am-lohn-198"].sourceTitle:
    titles.records["post:wer-gutes-zeigt-bekommt-anteil-am-lohn-198"].translations[locale],locale+" post title");
 const dynamicNames={tr:"Sûre Al-Kahf aç",en:"Open Sūrah Al-Kahf",
  ar:"افتح سورة Al-Kahf",ku:"Sûreya Al-Kahf veke",
  ckb:"سوورەتی Al-Kahf بکەرەوە",bs:"Otvori suru Al-Kahf"};
 const oneRoute=runtime.translateValue("Sūrah Al-Kahf öffnen",locale);
 assert.equal(oneRoute,locale==="de"?null:dynamicNames[locale],locale+" surah opening CTA");
 const summary=runtime.translateValue("114 Suren mit Arabisch und Lautschrift.",locale);
 assert(locale==="de"?summary===null:summary?.startsWith("114 "),locale+" compact Quran library summary");
 const idOne=titles.records["post:ahmad-quran-kalam-allah-001"];
 const idTwo=titles.records["post:abu-hatim-quran-kalam-allah-001"];
 assert.equal(repeatedA.textContent,locale==="de"?idOne.sourceTitle:idOne.translations[locale],locale+" repeated title A");
 assert.equal(repeatedB.textContent,locale==="de"?idTwo.sourceTitle:idTwo.translations[locale],locale+" repeated title B");
 assert.equal(original.nodeValue,"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً","Arabic source modified");
 assert.equal(excluded.nodeValue,"Nicht authentisch belegt","source text modified");
 assert.equal(doc.documentElement.dir,["ar","ckb"].includes(locale)?"rtl":"ltr");
 const corpus=pack.translations[locale]||{};
 const referenceUnits={tr:"atıf yeri",en:"references",ar:"مواضع",ku:"cihên çavkaniyê",ckb:"ئاماژە",bs:"referenci"};
 const expectedQuran=locale==="de"?"Qurʾān · 8 Fundstellen":
   (locale==="tr"?"Kur'an":corpus["Qurʾān"])+" · 8 "+referenceUnits[locale];
 assert.equal(dynamicQuran.nodeValue,expectedQuran,locale+" numeric Quran heading");
 const statement=locale==="de"?"Aussagen im Qurʾān · 3":
   (locale==="tr"?"Kur'ân'daki ifadeler":corpus["Aussagen im Qurʾān"])+" · 3";
 assert.equal(dynamicStatements.nodeValue,statement,locale+" numeric statement heading");
 assert.equal(preservedSource.nodeValue,"Qurʾān · 8 Fundstellen","A sourced verse note must not be translated");
 const numberTerms={
  tr:["yazı","sûre","âyet","Kur'ân'da aç"],
  en:["articles","surahs","verses","Open in the Qurʾān"],
  ar:["مقالات","سور","آيات","فتح في القرآن"],
  ku:["gotar","sûre","ayet","Di Qur'anê de vekin"],
  ckb:["وتار","سوورەت","ئایەت","لە قورئاندا بیکەرەوە"],
  bs:["članaka","sura","ajeta","Otvori u Kur'anu"]
 };
 if(locale==="de"){
  assert.equal(numericPosts.nodeValue,"18 Beiträge");
  assert.equal(numericSurahs.nodeValue,"7 Sūren · 26 Āyāt");
  assert.equal(dynamicAyahLink.nodeValue,"Im Qurʾān öffnen · 2:45");
 }else{
  const unit=numberTerms[locale];
  assert.equal(numericPosts.nodeValue,"18 "+unit[0],locale+" numeric articles");
  assert.equal(numericSurahs.nodeValue,"7 "+unit[1]+" · 26 "+unit[2],locale+" surah/ayah totals");
  assert.equal(dynamicAyahLink.nodeValue,
    (locale==="tr"?"Kur'ân'da aç":pack.translations[locale]["Im Qurʾān öffnen"])+" · 2:45",
    locale+" Quran reference control");
 }
 const messages={
  tr:["Sûre Al-Baqarah aç","114 sûre; Arapça ve okunuşlarıyla.","Konulara göre 5 bilinen dua."],
  en:["Open Sūrah Al-Baqarah","114 surahs with Arabic and transliteration.","5 known supplications by topic."],
  ar:["فتح سورة Al-Baqarah","114 سورة بالنص العربي واللفظ المنقول.","5 أدعية معروفة بحسب الموضوع."],
  ku:["Sûreya Al-Baqarah veke","114 sûre bi Erebî û vegotina dengî.","5 duayên naskirî li gor mijaran."],
  ckb:["سوورەتی Al-Baqarah بکەرەوە","114 سوورەت بە عەرەبی و خوێندنەوەی دەنگی.","5 دوعای ناسراو بەپێی بابەت."],
  bs:["Otvori suru Al-Baqarah","114 sura s arapskim tekstom i transkripcijom.","5 poznatih dova po temama."]
 };
 const expectedMessages=locale==="de"?["Sūrah Al-Baqarah öffnen","114 Suren mit Arabisch und Lautschrift.","5 bekannte Duʿāʾ nach Themen."]:messages[locale];
 assert.equal(dynamicSurahButton.nodeValue,expectedMessages[0],locale+" surah button");
 assert.equal(dynamicSurahCount.nodeValue,expectedMessages[1],locale+" full Quran count");
 assert.equal(dynamicDuaCount.nodeValue,expectedMessages[2],locale+" summary count");
 for(const term of ["Geprüfte Beziehungen","Umstrittene Angaben (bewusst öffnen)",
                   "nicht sicher überliefert","Keine Treffer."]){
  assert(locale==="de"||pack.translations[locale][term]?.trim(),locale+" missing "+term);
 }

 if(locale==="en") assert(/Wednesday|October/.test(weekday.nodeValue),"Calendar month/day not localized");
}
lng="de";runtime.apply();
assert.equal(weekday.nodeValue,"Mittwoch, 21. Oktober 2026","calendar failed to restore German");
assert.equal(runtime.formatCalendarDate("2026-10-21T12:00:00Z","en",{weekday:"long",timeZone:"UTC"}),"Wednesday");
assert(runtime.translatePrayerName("Maghrib","en")==="Maghrib");
assert(runtime.translatePrayerName("Maghrib","tr")==="Akşam");
console.log("PASS: seven languages, full welcome/prayer/calendar/prophet UI, 13 identity-checked headings, German rollback and source protection");
