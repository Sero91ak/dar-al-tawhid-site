#!/usr/bin/env node
"use strict";
/* Independent live verification, after a separately authorized real deployment.
 * This program NEVER publishes or sends any notification. Returns nonzero when
 * one of the sixteen records, nine locales or reader scripts is absent/stale. */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const manifest=read("content/admin/frauen-batch-16-2026-11-18.json");
const baseline=read("assets/frauen/frauen-entry-locales-v1.json");
const BASE="https://dar-al-tawhid.de";
const errors=[],checked=[];
async function get(url){
 const target=BASE+url+(url.includes("?")?"&":"?")+"audit="+encodeURIComponent(manifest.id);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
   const r=await fetch(target,{signal:controller.signal,redirect:"error",headers:{"Cache-Control":"no-cache","Accept":"application/json,text/javascript"}});
   if(!r.ok)throw Error("HTTP "+r.status+" for "+url);
   return r;
 }finally{clearTimeout(timer)}
}
async function getJson(path){const r=await get("/"+path);return r.json()}
(async()=>{
 if(manifest.records.length!==16||manifest.expectedReleaseCount!==16)throw Error("Manifest must contain 16");
 const files=[...new Set(manifest.records.map(r=>r.sourceFile))];
 const remote={};
 for(const p of files)remote[p]=await getJson(p);
 const l=await getJson("assets/frauen/frauen-entry-locales-v1.json");
 const ids=new Set(l.entryIds||[]);
 for(const row of manifest.records){
   const live=(remote[row.sourceFile].eintraege||[]).filter(e=>e.kennung===row.id);
   const original=baseline.entries[row.id],actual=l.entries?.[row.id],blockers=[];
   if(live.length!==1)blockers.push("missing-or-duplicate-live-article");
   const e=live[0]||{};
   if(e.quellenstatus!=="geprueft")blockers.push("not-approved-live-status");
   if(e.freigabeDurchSerhat!==true)blockers.push("author-release-missing");
   if(e.contentId!==row.id||e.localeCatalogId!==row.id)blockers.push("canonical-identity");
   if(e.quellePrimaerId!==row.sourceId||e.direktnachweisUrl!==row.sourceUrl)blockers.push("source-reference-drift");
   if(!ids.has(row.id)||!actual)blockers.push("locale-catalog-not-deployed");
   if(actual&&original){
     if(actual.id!==row.id||actual.area!==row.area||actual.sourceUrl!==row.sourceUrl)blockers.push("live-reader-route-or-source-drift");
     for(const code of manifest.requiredLocales){
       const pack=actual.locales?.[code],expected=original.locales?.[code];
       if(!pack||!expected){blockers.push(code+"-missing");continue}
       for(const field of ["title","statement","preview","lesson","sharh","source"]){
         if(pack[field]!==expected[field])blockers.push(code+"-"+field+"-stale");
       }
       if(pack.dir!==(code==="ar"||code==="ckb"?"rtl":"ltr"))blockers.push(code+"-bidi");
     }
   }
   if(blockers.length)errors.push({id:row.id,blockers});
   checked.push({id:row.id,liveStatus:e.quellenstatus||"absent",locales:actual?Object.keys(actual.locales||{}).length:0});
 }
 const adapter=await (await get("/assets/frauen/frauen-entry-locale-v1.js")).text();
 if(!adapter.includes("function localImageExport("))errors.push({type:"locale-image-export-script-missing"});
 if(!adapter.includes("darAdultPreferredLocaleV1"))errors.push({type:"adult-language-preference-not-loaded"});
 const result={batch:manifest.id,base:BASE,publiclyLive:errors.length===0,checked:checked.length,checks:checked,errors,
  notificationEligible:false,
  note:"Actual source, nine locales and reader adapter must be live; this read-only audit is not a push authorization."};
 console.log(JSON.stringify(result,null,2));
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error("FRAUEN 16 LIVE VERIFICATION FAILED:",String(e));process.exitCode=1});
