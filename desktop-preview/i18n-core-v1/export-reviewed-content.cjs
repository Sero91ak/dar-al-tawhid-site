#!/usr/bin/env node
/* One canonical approved translation → one reusable record for Adult Web, PWA and iOS WKWebView.
 * No API calls. Draft/unreviewed/stale content NEVER exported. Default is dry run.
 */
"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),cp=require("node:child_process"),crypto=require("node:crypto");
const args=process.argv.slice(2),opt=(name,defaultValue)=>{const i=args.indexOf(name);return i<0?defaultValue:args[i+1]};
const ROOT=path.resolve(__dirname,"../.."),write=args.includes("--write"),locale=opt("--locale","tr");
const OUT=path.resolve(opt("--out",path.join(ROOT,"content/i18n/published")));
const INV=path.resolve(opt("--inventory",path.join(__dirname,"translation-worklist.json")));
const LANGS=new Set(["tr","en","ar","ku","ckb","bs"]);
if(!LANGS.has(locale))throw Error("Unsupported locale "+locale);
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"dar-approved-pack-"));
function assertGood(r){
 if(!r||r.locale!==locale||r.translationStatus!=="approved"||!r.id?.startsWith(r.kind+":")||
    !/^[a-f0-9]{64}$/.test(r.sourceHash||"")||!r.fields||typeof r.fields!=="object"||
    r.immutable?.sourceReviewBlocked)throw Error("Invalid approved record");
 if(!["post","qsource","hadith","dua","quiz","learning"].includes(r.kind))throw Error("Unsupported kind");
 if(Object.keys(r.fields).length===0)throw Error("Empty fields");
 for(const v of Object.values(r.fields)){
  if(typeof v==="string"&&!v.trim())throw Error("Empty translated field");
  if(Array.isArray(v)&&v.some(x=>typeof x!=="string"||!x.trim()))throw Error("Untranslated answer");
  if(typeof v!=="string"&&!Array.isArray(v))throw Error("Unexpected translated field shape");
 }
}
function fileName(id,kind){
 const slug=id.slice(kind.length+1).replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,110);
 const sha=crypto.createHash("sha256").update(id).digest("hex").slice(0,10);
 return slug+"-"+sha+".json";
}
try{
 if(!fs.existsSync(INV)){
  cp.execFileSync(process.execPath,[path.join(__dirname,"translation-worklist.cjs"),"--out",INV],{cwd:ROOT,stdio:"pipe"});
 }
 cp.execFileSync(process.execPath,[path.join(__dirname,"build-language-packs.cjs"),"--inventory",INV,"--output",temporary],{cwd:ROOT,stdio:"pipe"});
 const doc=JSON.parse(fs.readFileSync(path.join(temporary,locale+".json"),"utf8"));
 if(doc.locale!==locale||doc.originalLocale!=="de"||!Array.isArray(doc.records))throw Error("Invalid reviewed locale pack");
 const index={schemaVersion:1,locale,originalLocale:"de",scope:"adult-only",onlyApproved:true,
   publishedCount:doc.records.length,byKind:{},records:{}};
 const writes=[],names=new Set();
 for(const record of doc.records){
  assertGood(record);
  const name=fileName(record.id,record.kind);
  const relative=locale+"/"+record.kind+"/"+name;
  if(names.has(relative)||index.records[record.id])throw Error("Duplicate localized record");
  names.add(relative);
  const value={schemaVersion:1,id:record.id,kind:record.kind,locale,
    sourceHash:record.sourceHash,status:"approved",fields:record.fields,immutable:record.immutable};
  writes.push([relative,JSON.stringify(value,null,2)+"\n"]);
  index.records[record.id]={path:relative,kind:record.kind,sourceHash:record.sourceHash};
  index.byKind[record.kind]=(index.byKind[record.kind]||0)+1;
 }
 writes.push([locale+"/manifest.json",JSON.stringify(index,null,2)+"\n"]);
 if(write){
  for(const [rel,data] of writes){
   const dest=path.join(OUT,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.writeFileSync(dest,data);
  }
 }
 console.log(JSON.stringify({mode:write?"write":"dry-run",locale,publishedCount:index.publishedCount,
  byKind:index.byKind,output:write?OUT:null,hasGermanOriginals:false,noDrafts:true},null,2));
}finally{fs.rmSync(temporary,{recursive:true,force:true})}
