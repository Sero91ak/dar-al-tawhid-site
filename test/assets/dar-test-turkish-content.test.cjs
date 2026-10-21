#!/usr/bin/env node
"use strict";
/* Zero-cost regression checks for the TEST-only Turkish content loader. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const src=fs.readFileSync(path.join(__dirname,"dar-test-turkish-content.js"),"utf8");
const slug="hasan-al-basri-selbstpruefung-20261021-481",id="post:"+slug;
const text='---\nid: "'+slug+'"\ntitle: "📖 Die Seele zur Rechenschaft ziehen"\ndate: "2026-10-21T10:00:00.000Z"\nscholar: "al-Ḥasan al-Baṣrī"\nbook: "az-Zuhd"\nsource: "Quelle Q48"\nstatus: "published"\n---\n\nDeutscher Originaltext.';
const fields={title:"📖 Die Seele zur Rechenschaft ziehen",body:"Deutscher Originaltext."};
const sourceHash=crypto.createHash("sha256").update(JSON.stringify({fields,immutable:{
 source:"Quelle Q48",book:"az-Zuhd",scholar:"al-Ḥasan al-Baṣrī",date:"2026-10-21T10:00:00.000Z",
 originalFile:slug+".md",sourceReviewBlocked:false}})).digest("hex");
const translationPath="/desktop-preview/i18n-core-v1/translations/tr/post/"+slug+"-074b61b8f8.json";
function makeManifest(approved){
 return {contentId:id,postId:slug,canonicalLocale:"de",canonicalPath:"/content/posts/"+slug+".md",
 kidsExcluded:true,sourceHash,languages:{tr:{status:approved?"approved":"draft",
 publicDisplayAllowed:approved,path:translationPath}}};
}
function setup(approved,alterTranslation){
 const calls=[];
 const translation={id,locale:"tr",sourceHash,status:"approved",reviewedAt:"2026-10-21",
 reviewer:{linguistic:"Editor",religious:"Reviewer",arabicOriginalChecked:true,sourcesChecked:true},
 fields:{title:"📖 Nefsini hesaba çekmek",body:"Onaylı Türkçe metin."}};
 if(alterTranslation)alterTranslation(translation);
 const fixtures={
  ["/content/posts/"+slug+".md"]:text,
  "/content/posts/posts-index.json":{files:[{name:slug+".md"}]},
  ["/content/i18n/adult-posts/"+slug+".json"]:makeManifest(approved),
  [translationPath]:translation
 };
 const browser={TextEncoder,crypto:crypto.webcrypto,localStorage:{getItem:()=>"tr",setItem:()=>{}},
  fetch:async url=>{calls.push(url);if(!(url in fixtures))return {ok:false,status:404};return {ok:true,
   text:async()=>fixtures[url],json:async()=>fixtures[url]};}};
 vm.runInNewContext(src,{window:browser,TextEncoder,Uint8Array,Array,String,RegExp,Error,JSON,Promise});
 return {reader:browser.DarTestTurkishContent.create(),calls};
}
(async()=>{
 let {reader,calls}=setup(false);
 let result=await reader.getPost(slug,"tr");
 assert.equal(result.displayLocale,"de");
 assert.equal(result.status,"awaiting-review");
 assert(!calls.some(x=>x.includes("/translations/tr/")),"Never download a draft");
 const original=await reader.getPost(slug,"de");
 assert.equal(original.fields.body,fields.body);
 ({reader}=setup(true));
 result=await reader.getPost(slug,"tr");
 assert.equal(result.displayLocale,"tr");assert.equal(result.status,"approved");
 assert.equal(result.fields.body,"Onaylı Türkçe metin.");
 ({reader}=setup(true,t=>{t.reviewer.sourcesChecked=false}));
 result=await reader.getPost(slug,"tr");assert.equal(result.status,"unverified-translation");
 ({reader}=setup(true,t=>{t.sourceHash="stale"}));
 result=await reader.getPost(slug,"tr");assert.equal(result.status,"unverified-translation");
 ({reader}=setup(true));
 await assert.rejects(reader.getPost("../secret","tr"),/Invalid canonical/);
 console.log("PASS: German source, Turkish review gate, SHA check, safe paths, no draft leakage, no API calls");
})().catch(e=>{console.error(e);process.exitCode=1});