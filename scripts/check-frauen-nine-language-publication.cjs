#!/usr/bin/env node
"use strict";
/* Permanent publication gate for women source cards Q52 and later.
 * Existing legacy women reports are not retroactively unpublished.
 * This gate proves complete localized assets/quiz fields, not native fluency.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const at=p=>path.join(root,p);
const json=p=>JSON.parse(fs.readFileSync(at(p),"utf8"));
const html=p=>fs.readFileSync(at(p),"utf8");
const languages=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const reg=json("q/_registry/shortlinks.json");
const names=fs.readdirSync(at("data")).filter(n=>/^frauen-.*\.json$/.test(n));
let checked=0;const seen=new Set(),errors=[];
function requireOk(ok,msg){if(!ok)errors.push(msg)}
for(const name of names){
 const data=json("data/"+name);
 for(const e of data.eintraege||[]){
  if(e.quellenstatus!=="geprueft"||!Number.isInteger(Number(e.qNumber))||Number(e.qNumber)<52)continue;
  const n=Number(e.qNumber),prefix="Q"+n+" "+String(e.kennung||"")+" ";
  checked++;
  requireOk(!seen.has(n),prefix+"duplicate Q assignment");seen.add(n);
  requireOk(e.kanonischerQuellenlink==="https://dar-al-tawhid.de/q/"+n+"/",prefix+"canonical Q link missing");
  const row=(reg.links||[]).find(x=>Number(x.number)===n);
  requireOk(row&&row.status==="active"&&row.postReference===e.kennung,prefix+"registry Q/post mismatch");
  const qfile="q/"+n+"/index.html", lfile="assets/q"+n+"-locales.json", script="assets/q"+n+"-localized.js";
  for(const f of [qfile,lfile,script])requireOk(fs.existsSync(at(f)),prefix+"missing "+f);
  if(![qfile,lfile,script].every(f=>fs.existsSync(at(f))))continue;
  const src=html(qfile),pack=json(lfile),js=html(script);
  requireOk(pack.qSourceId===n,prefix+"locale Q-ID mismatch");
  requireOk(pack.canonicalUrl==="https://dar-al-tawhid.de/q/"+n+"/",prefix+"locale canonical mismatch");
  requireOk(JSON.stringify(pack.supported)===JSON.stringify(languages),prefix+"not exactly nine locales");
  requireOk(src.includes('href="https://dar-al-tawhid.de/q/'+n+'/"'),prefix+"missing canonical URL");
  requireOk(src.includes('lang="ar" dir="rtl"'),prefix+"missing Arabic original");
  requireOk(src.includes("q"+n+"-localized.js"),prefix+"Q HTML does not load localized script");
  requireOk(js.includes("darAdultPreferredLocaleV1")&&!/navigator\.languages?\b/.test(js),prefix+"locale selection not manual");
  try{new vm.Script(js)}catch(err){errors.push(prefix+"JS syntax: "+err.message)}
  const learning=src.match(/class="qsource-learning" href="(\/lernen\/[a-z0-9-]+\/)"/);
  requireOk(!!learning,prefix+"learning link not found");
  if(learning){
   const file=learning[1].slice(1)+"index.html";
   requireOk(fs.existsSync(at(file)),prefix+"learning page missing "+file);
   if(fs.existsSync(at(file)))requireOk(html(file).includes("q"+n+"-localized.js"),prefix+"learning is not localized");
  }
  for(const lang of languages){
   const p=pack.locales&&pack.locales[lang];
   if(!p){errors.push(prefix+"missing locale "+lang);continue}
   for(const field of ["title","statement","sharh","reference","note","evidence1","evidence2"]){
    requireOk(typeof p[field]==="string"&&p[field].trim().length>=10,prefix+lang+" missing "+field);
   }
   requireOk(p.questions?.length===4,prefix+lang+" must have four translated questions");
   for(const q of p.questions||[])requireOk(q.a?.length===4&&q.a.every(Boolean)&&q.q&&q.why,prefix+lang+" incomplete question");
   if(lang!=="de")requireOk(p.statement!==pack.locales.de?.statement&&p.sharh!==pack.locales.de?.sharh,prefix+lang+" is a disguised German fallback");
  }
 }
}
for(const error of errors)console.error("FAIL Frauen-9-Locale: "+error);
if(errors.length)process.exitCode=1;
else console.log("PASS Frauen-9-Locale: "+checked+" released canonical Q cards (>=52) have nine complete readable locale packs, quiz and source links. Legacy untranslated reports not claimed.");
