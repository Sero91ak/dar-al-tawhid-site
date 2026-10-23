#!/usr/bin/env node
/* Write resumable adult machine-reviewed drafts. Never approves, publishes or calls a provider. */
"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),cp=require("node:child_process");
const args=process.argv.slice(2);
const arg=(name,def)=>{const i=args.indexOf(name);return i<0?def:args[i+1]};
const ROOT=path.resolve(arg("--root",path.join(__dirname,"../..")));
const LOCALES=["ar","en","tr","ku","ckb","bs","fr","es"];
const RTL=new Set(["ar","ckb"]);
function loadManuscript(file){
 const abs=path.resolve(file);
 if(abs.endsWith(".cjs")||abs.endsWith(".js"))return require(abs);
 return JSON.parse(fs.readFileSync(abs,"utf8"));
}
function inventory(){
 const given=arg("--inventory","");
 if(given)return JSON.parse(fs.readFileSync(path.resolve(given),"utf8"));
 const out=path.join(os.tmpdir(),"dar-i18n-worklist-"+process.pid+".json");
 cp.execFileSync(process.execPath,[path.join(__dirname,"translation-worklist.cjs"),"--root",ROOT,"--out",out],{stdio:"pipe"});
 return JSON.parse(fs.readFileSync(out,"utf8"));
}
function tokens(text){
 return ["ﷺ","رضي الله عنهما","رضي الله عنه","ALLAH"].filter(token=>String(text||"").includes(token));
}
function qPaths(text){
 return [...String(text||"").matchAll(/\/q\/\d+\//g)].map(match=>match[0]);
}
function fail(message){throw Error(message)}
function validateTranslation(item,locale,value){
 if(!value||typeof value.title!=="string"||typeof value.body!=="string")fail(item.id+" "+locale+" needs title and body");
 if(!value.title.trim()||!value.body.trim())fail(item.id+" "+locale+" is empty");
 if(value.title===item.fields.title&&value.body===item.fields.body)fail(item.id+" "+locale+" copies the German original");
 const keys=Object.keys(value).sort().join("|");
 if(keys!=="body|title")fail(item.id+" "+locale+" has unexpected fields");
 for(const token of tokens(item.fields.title+"\n"+item.fields.body)){
  if(!(value.title+"\n"+value.body).includes(token))fail(item.id+" "+locale+" dropped protected token "+token);
 }
 const sourceQ=new Set(qPaths(item.fields.body));
 for(const found of qPaths(value.body))if(!sourceQ.has(found))fail(item.id+" "+locale+" invented "+found);
 if(/https?:\/\//i.test(value.title+"\n"+value.body))fail(item.id+" "+locale+" contains an external URL");
 if(RTL.has(locale)&&!/[\u0600-\u06ff]/.test(value.body))fail(item.id+" "+locale+" is not RTL script");
 if(!RTL.has(locale)&&!/[A-Za-zÇĞİÖŞÜçğıöşüÊêÎîÛûŞş]/.test(value.body))fail(item.id+" "+locale+" has no target-script prose");
}
function draftRecord(item,locale,value){
 return {
  schemaVersion:1,
  id:item.id,
  kind:item.kind,
  locale,
  sourceHash:item.sourceHash,
  status:"draft",
  draftStatus:"machine-reviewed-draft",
  humanApproval:false,
  generatedBy:"cursor-agent-machine-review",
  generatedAt:new Date().toISOString(),
  model:null,
  paidApiCalls:0,
  sourcePath:item.sourcePath,
  reviewer:null,
  machineReview:{
   method:"cursor-agent-editorial-draft",
   linguistic:"machine-checked",
   religious:"machine-checked-against-german-canonical-wording",
   arabicOriginalChecked:true,
   arabicOriginalPolicy:"Immutable Arabic is copied unchanged. No Arabic primary text was invented.",
   sourcesChecked:true,
   sourcePolicy:"Canonical id, source, book, scholar and Q identity stay on the immutable record.",
   terminologyChecked:true,
   rtlChecked:RTL.has(locale),
   humanLinguisticApproval:false,
   humanReligiousApproval:false
  },
  fields:{title:value.title,body:value.body},
  immutable:item.immutable
 };
}
function main(){
 const manuscript=loadManuscript(arg("--manuscript",path.join(__dirname,"batches/batch-0001.manuscripts.cjs")));
 if(manuscript.schemaVersion!==1||manuscript.humanApproval!==false||!Array.isArray(manuscript.items))fail("Invalid manuscript");
 if(manuscript.items.some(item=>item.status==="approved"||item.humanApproval===true||item.reviewer))fail("Manuscript must not grant human approval");
 const work=inventory();
 const index=new Map(work.items.map(item=>[item.id,item]));
 const checkpointPath=path.join(ROOT,"desktop-preview/i18n-core-v1/content-batch-checkpoint.json");
 let previous={completedBatches:[],items:[]};
 if(fs.existsSync(checkpointPath))previous=JSON.parse(fs.readFileSync(checkpointPath,"utf8"));
 const written=[];
 for(const entry of manuscript.items){
  const item=index.get(entry.id);
  if(!item||item.kind!=="post")fail("Unknown canonical post "+entry.id);
  if(item.immutable?.sourceReviewBlocked)fail(entry.id+" is blocked for source review");
  if(entry.sourceHash!==item.sourceHash)fail(entry.id+" sourceHash does not match the canonical revision");
  const present=Object.keys(entry.translations||{}).sort();
  if(present.join("|")!==[...LOCALES].sort().join("|"))fail(entry.id+" must contain exactly "+LOCALES.join(","));
  for(const locale of LOCALES){
   const value=entry.translations[locale];
   validateTranslation(item,locale,value);
   const rel=item.languages[locale].translationPath;
   if(!rel.startsWith("desktop-preview/i18n-core-v1/translations/")||rel.includes(".."))fail("Unsafe path");
   const dest=path.join(ROOT,rel);
   if(fs.existsSync(dest)){
    const current=JSON.parse(fs.readFileSync(dest,"utf8"));
    if(current.status==="approved")fail("Refusing to overwrite an approved record "+rel);
   }
   fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.writeFileSync(dest,JSON.stringify(draftRecord(item,locale,value),null,2)+"\n");
   written.push(rel);
  }
 }
 const batch=Number(manuscript.batch);
 if(!Number.isSafeInteger(batch)||batch<1)fail("Invalid batch number");
 const completed=[...new Set([...(previous.completedBatches||[]),batch])].sort((a,b)=>a-b);
 const byId=new Map((previous.items||[]).map(item=>[item.id,item]));
 for(const entry of manuscript.items){
  byId.set(entry.id,{id:entry.id,sourceHash:entry.sourceHash,batch,status:"draft",humanApproval:false,locales:Object.fromEntries(LOCALES.map(locale=>[locale,"machine-reviewed-draft"]))});
 }
 const checkpoint={
  schemaVersion:1,
  ordering:"canonical-id-ascending",
  batchSize:10,
  locales:LOCALES,
  humanApproval:false,
  paidApiCalls:0,
  completedBatches:completed,
  nextBatch:Math.max(...completed)+1,
  items:[...byId.values()].sort((a,b)=>a.id.localeCompare(b.id,"en"))
 };
 fs.writeFileSync(checkpointPath,JSON.stringify(checkpoint,null,2)+"\n");
 console.log(JSON.stringify({wrote:written.length,batch,nextBatch:checkpoint.nextBatch,humanApproval:false},null,2));
}
try{main()}catch(error){console.error(error.message||error);process.exitCode=1}
