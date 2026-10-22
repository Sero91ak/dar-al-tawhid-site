#!/usr/bin/env node
"use strict";
/* Static audit of captured German UI strings in 15 adult test routes.
   An uncovered label is not automatically a translation request for source quotations. */
const fs=require("fs"),path=require("path");
const base=__dirname;
const inv=JSON.parse(fs.readFileSync(path.join(base,"qa/ui-candidates.json"),"utf8"));
const pack=JSON.parse(fs.readFileSync(path.join(base,"adult-ui-locales-seven.json"),"utf8"));
const locales=["tr","en","ar","ku","ckb","bs"];
const translated=s=>locales.every(locale=>!!pack.translations[locale]?.[s]);
const excluded=s=>(
  s.length>92 ||
  /^([\d\s:.,/-]+|DĀR AL TAWḤĪD|Qurʾān|Instagram|Telegram)$/i.test(s) ||
  /^(https?:|www\.|📖|🖋|📝|#[A-Za-z]|quran\.com|\d{4}-\d{2})/.test(s) ||
  /(?:ﷺ|رضي الله|عليه السلام)/.test(s)||
  /^[A-Z][a-z]+(?: [A-Z][a-z]+){2,}$/.test(s) ||
  /[:;]{3}/.test(s)
);
const missing=inv.candidates.filter(x=>!translated(x.de)&&!excluded(x.de));
console.log("STATIC UI COVERAGE",JSON.stringify({routes:inv.routes.length,allCandidates:inv.candidates.length,unmappedShortCandidates:missing.length,sourceTextExcluded:"unverified candidates require review",errors:inv.errors}));
for(const [route,items] of inv.routes.map(route=>[route,missing.filter(x=>x.routes.includes(route))])){
 console.log("ROUTE",route,"unmapped",items.length);
}
const sorted=missing.sort((a,b)=>b.routes.length-a.routes.length||b.count-a.count);
sorted.slice(0,100).forEach(x=>console.log("MISSING_UI",JSON.stringify({de:x.de,routes:x.routes,observed:x.count})));

const priority=["home","prayer","quran","propheten","quiz","duas","settings","more","scholars","qibla","hadith","frauen"];
for(const route of priority){
 const rows=missing.filter(x=>x.routes.includes(route));
 console.log("PRIORITY_UI",route,JSON.stringify(rows.slice(0,120).map(x=>x.de)));
}
