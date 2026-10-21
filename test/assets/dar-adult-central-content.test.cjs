#!/usr/bin/env node
"use strict";
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const source=fs.readFileSync(path.join(__dirname,"dar-adult-central-content.js"),"utf8");
const id="post:example",kind="post";
const original={fields:{title:"Die Seele",body:"Deutscher Originaltext."},
 immutable:{arabicOriginal:"نص",source:"/q/48/",sourceReviewBlocked:false}};
const hash=value=>crypto.createHash("sha256").update(typeof value==="string"?value:JSON.stringify(value)).digest("hex");
const sha=hash(original),filename="tr/post/example-"+hash(id).slice(0,10)+".json";
const BASE="/content/i18n/published/";
async function execute(tamper=null,selected="tr"){
 const manifest={schemaVersion:1,locale:"tr",originalLocale:"de",scope:"adult-only",
 onlyApproved:true,records:{[id]:{kind,path:filename,sourceHash:sha}}};
 const record={schemaVersion:1,id,kind,locale:"tr",sourceHash:sha,
  status:"approved",fields:{title:"Nefis",body:"Onaylı Türkçe metin."},immutable:{...original.immutable}};
 const files={[BASE+"tr/manifest.json"]:manifest,[BASE+filename]:record};
 if(tamper)tamper(files,manifest,record);
 const requested=[];
 const w={crypto:crypto.webcrypto,TextEncoder,localStorage:{getItem:()=>selected},
  fetch:async url=>{requested.push(url);return {ok:!!files[url],status:404,
   json:async()=>files[url]}}};
 vm.runInNewContext(source,{window:w,TextEncoder,Uint8Array,Map,Set,Promise,Error,JSON});
 const store=w.DarAdultCentralContent.create();
 const value=await store.resolve(kind,id,original,selected);
 return {value,requested};
}
(async()=>{
 let r=await execute();
 assert.equal(r.value.displayLocale,"tr");assert.equal(r.value.fields.title,"Nefis");
 assert.equal(r.requested.length,2);
 r=await execute(null,"de");assert.equal(r.value.displayLocale,"de");assert.equal(r.requested.length,0);
 r=await execute(files=>{delete files[BASE+"tr/manifest.json"]});
 assert.equal(r.value.displayLocale,"de");assert.equal(r.value.status,"awaiting-review");
 r=await execute((_files,manifest)=>{manifest.records[id].sourceHash="0".repeat(64)});
 assert.equal(r.value.status,"stale-source");
 r=await execute((_files,_manifest,record)=>{record.status="draft"});
 assert.equal(r.value.status,"invalid-translation");
 r=await execute((_files,_manifest,record)=>{record.immutable.source="/q/49/"});
 assert.equal(r.value.status,"invalid-translation");
 r=await execute((_files,_manifest,record)=>{record.fields={title:"Nefis"}});
 assert.equal(r.value.status,"invalid-translation");
 r=await execute((_files,manifest)=>{manifest.records[id].path="tr/post/../../../secret.json"});
 assert.equal(r.value.status,"invalid-path");
 console.log("PASS: one shared Turkish approved record, original German fallback, revision/folder/review/fields/source protections");
})().catch(e=>{console.error(e);process.exitCode=1});
