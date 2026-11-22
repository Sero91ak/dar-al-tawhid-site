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
async function get(url,type){
 const target=BASE+url+(url.includes("?")?"&":"?")+"audit="+encodeURIComponent(manifest.id);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
   const r=await fetch(target,{signal:controller.signal,redirect:"error",headers:{"Cache-Control":"no-cache","Accept":"*/*"}});
   if(!r.ok)throw Error("HTTP "+r.status+" for "+url);
   // Deadline covers the full body read, not just response headers.
   return type==="json"?await r.json():await r.text();
 }finally{clearTimeout(timer)}
}
async function getJson(path){return get("/"+path,"json")}
async function getText(path){return get(path,"text")}
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
       const requiredLabels=expected.labels||{};
       if(!pack.labels||Object.entries(requiredLabels).some(([key,value])=>pack.labels[key]!==value)){
         blockers.push(code+"-labels-stale");
       }
       if(pack.dir!==(code==="ar"||code==="ckb"?"rtl":"ltr"))blockers.push(code+"-bidi");
     }
   }
   if(blockers.length)errors.push({id:row.id,blockers});
   checked.push({id:row.id,liveStatus:e.quellenstatus||"absent",locales:actual?Object.keys(actual.locales||{}).length:0});
 }
 const adapter=await getText("/assets/frauen/frauen-entry-locale-v1.js");
 const localAdapter=fs.readFileSync(path.join(root,"assets/frauen/frauen-entry-locale-v1.js"),"utf8");
 if(adapter!==localAdapter)errors.push({type:"text-reader-adapter-not-deployed-or-stale"});
 const lessonUrl="/lernen/frauen-wissen/?id="+encodeURIComponent(manifest.records[0].id)+"&lang=de";
 const lessonPage=await getText(lessonUrl);
 if(!/<main\b[^>]*id="quiz"/.test(lessonPage) ||
    !/\/assets\/frauen\/frauen-learning-v1\.js/.test(lessonPage))errors.push({type:"full-learning-page-not-live"});
 const lessons=await getText("/assets/frauen/frauen-learning-v1.js");
 const localLessons=fs.readFileSync(path.join(root,"assets/frauen/frauen-learning-v1.js"),"utf8");
 if(lessons!==localLessons)errors.push({type:"learning-engine-not-deployed-or-stale"});
 if(!lessons.includes("sourceFiles:FILES")||!lessons.includes('quellenstatus!=="geprueft"')){
   errors.push({type:"learning-source-approval-gate-missing"});
 }
 const studyCss=await getText("/assets/frauen/frauen-learning-v1.css");
 if(!studyCss.includes(".fw-answer")||!studyCss.includes('[dir="rtl"]'))
   errors.push({type:"learning-RTL-responsive-styles-not-live"});
 const focusManifest=await getJson("assets/frauen/frauen-neufokus-v1.json");
 if(focusManifest.items?.length!==16||focusManifest.focusId!=="neufokus-frauenwissen-16-20261118"||
    manifest.records.some(r=>!focusManifest.items.some(x=>x.id===r.id&&x.sourceUrl===r.sourceUrl)))
   errors.push({type:"48h-focus-source-manifest-not-deployed"});
 const focusJs=await getText("/assets/frauen/frauen-neufokus-v1.js");
 if(!focusJs.includes("verifyPublished()")||!focusJs.includes("48*60*60*1000"))
    errors.push({type:"48h-focus-runtime-not-deployed"});
 const focusCss=await getText("/assets/frauen/frauen-neufokus-v1.css");
 if(!focusCss.includes("#dv3Home .dar-frauen-neufokus"))
    errors.push({type:"48h-focus-home-styles-not-deployed"});
 if(!adapter.includes('attachLearningButton(article,item)')||
    !adapter.includes('/lernen/frauen-wissen/?id='))
    errors.push({type:"learning-action-missing-from-live-reader"});
 if(process.argv.includes("--expect-focus")){
    const feed=await getJson("content/focus-feed/feed-index.json");
    const focus=(feed.items||[]).filter(x=>x.id==="neufokus-frauenwissen-16-20261118");
    const start=Date.parse(focus[0]?.startsAt||""),end=Date.parse(focus[0]?.expiresAt||"");
    if(focus.length!==1||focus[0].status!=="live"||focus[0].visibility!=="48h"||
       !Number.isFinite(start)||end-start!==48*3600000||Date.now()<start||Date.now()>=end)
      errors.push({type:"48h-start-page-focus-not-live-exactly-once"});
 }

 if(!adapter.includes("darAdultPreferredLocaleV1"))errors.push({type:"adult-language-preference-not-loaded"});
 const learningReady=!errors.some(x=>
   (Array.isArray(x.blockers)&&x.blockers.length>0) ||
   /learning|reader-adapter|language-preference/.test(x.type||""));
 const result={batch:manifest.id,base:BASE,publiclyLive:errors.length===0,checked:checked.length,learningReady,focusExpected:process.argv.includes("--expect-focus"),checks:checked,errors,
  notificationEligible:false,
  note:"Actual source, nine locales and reader adapter must be live; this read-only audit is not a push authorization."};
 console.log(JSON.stringify(result,null,2));
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error("FRAUEN 16 LIVE VERIFICATION FAILED:",String(e));process.exitCode=1});
