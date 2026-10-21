#!/usr/bin/env node
"use strict";
/* Zero-cost multilingual approved-source integration test.
 * Test data is synthetic; no Qurʾān wording is synthesized or overwritten. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assert=require("node:assert/strict"),crypto=require("node:crypto");
const source=fs.readFileSync(path.join(__dirname,"../assets/dar-adult-central-content.js"),"utf8");
const locales=["tr","en","ar","ku","ckb","bs"];
const sha=v=>crypto.createHash("sha256").update(typeof v==="string"?v:JSON.stringify(v)).digest("hex");
const id="qsource:2:255",kind="qsource";
const original={fields:{meaning:"German source wording maintained"},immutable:{
 arabicOriginal:"نص عربي تجريبي",source:"/q/255",surah:2,ayah:255}};
const sourceHash=sha(original);
const name="2-255-"+sha(id).slice(0,10)+".json";
async function getResult(code,tamper){
 const prefix="/content/i18n/published/";
 const rel=code+"/qsource/"+name;
 const manifest={schemaVersion:1,locale:code,originalLocale:"de",scope:"adult-only",
  onlyApproved:true,records:{[id]:{kind,path:rel,sourceHash}}};
 const translated={schemaVersion:1,id,kind,locale:code,sourceHash,status:"approved",
  fields:{meaning:"Verified target-language placeholder"},immutable:original.immutable};
 const files={[prefix+code+"/manifest.json"]:manifest,[prefix+rel]:translated};
 if(tamper)tamper(files,manifest,translated);
 const requested=[];
 const win={localStorage:{getItem:()=>code},crypto:crypto.webcrypto,TextEncoder,
  fetch:async url=>{requested.push(url);return{ok:Object.hasOwn(files,url),
   status:Object.hasOwn(files,url)?200:404,json:async()=>files[url]}}};
 vm.runInNewContext(source,{window:win,TextEncoder,Uint8Array,Map,Set,Promise,Error,JSON});
 const store=win.DarAdultCentralContent.create();
 const item=await store.resolve(kind,id,original,code);
 return {item,requested,store};
}
(async()=>{
 for(const code of locales){
  const good=await getResult(code);
  assert.equal(good.item.status,"approved",code);
  assert.equal(good.item.displayLocale,code);
  assert.equal(good.item.immutable.arabicOriginal,original.immutable.arabicOriginal);
  assert.equal(good.item.immutable.source,"/q/255");
  assert.equal(good.requested.length,2,"one manifest and one revision-checked approved record");
  const changed=await getResult(code,(_f,_m,doc)=>{doc.immutable.source="/q/999"});
  assert.equal(changed.item.status,"invalid-translation");
  assert.equal(changed.item.displayLocale,"de");
  assert.equal(changed.item.fields.meaning,original.fields.meaning);
  assert.equal(changed.item.pending,true);
  const draft=await getResult(code,(_f,_m,doc)=>{doc.status="draft"});
  assert.equal(draft.item.status,"invalid-translation");
  const stale=await getResult(code,(_f,m)=>{m.records[id].sourceHash="0".repeat(64)});
  assert.equal(stale.item.status,"stale-source");
  const noManifest=await getResult(code,(f)=>{delete f["/content/i18n/published/"+code+"/manifest.json"]});
  assert.equal(noManifest.item.status,"awaiting-review");
 }
 const german=await getResult("de");
 assert.equal(german.item.displayLocale,"de");
 assert.equal(german.requested.length,0);
 console.log("PASS: 7-language reviewed canonical Qurʾān-reference reader; zero external requests; unapproved/stale content returns German");
})().catch(e=>{console.error(e);process.exitCode=1});
