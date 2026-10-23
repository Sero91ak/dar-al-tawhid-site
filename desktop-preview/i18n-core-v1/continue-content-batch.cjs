#!/usr/bin/env node
/* Resume the adult post draft queue. Writes only when a manuscript for the next batch exists. */
"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),cp=require("node:child_process");
const dir=__dirname;
const checkpointPath=path.join(dir,"content-batch-checkpoint.json");
const checkpoint=fs.existsSync(checkpointPath)?JSON.parse(fs.readFileSync(checkpointPath,"utf8")):{nextBatch:1,completedBatches:[]};
const next=Number(checkpoint.nextBatch||1);
const stem=path.join(dir,"batches","batch-"+String(next).padStart(4,"0"));
const manuscript=[stem+".manuscripts.cjs",stem+".manuscripts.json"].find(file=>fs.existsSync(file));
if(manuscript&&process.argv.includes("--write")){
 cp.execFileSync(process.execPath,[path.join(dir,"write-machine-drafts.cjs"),"--manuscript",manuscript],{stdio:"inherit"});
 process.exit(0);
}
if(manuscript){
 console.log(JSON.stringify({nextBatch:next,manuscript:path.relative(dir,manuscript),action:"manuscript-ready"},null,2));
 process.exit(0);
}
const out=path.join(os.tmpdir(),"dar-i18n-worklist-resume.json");
cp.execFileSync(process.execPath,[path.join(dir,"translation-worklist.cjs"),"--out",out],{stdio:"pipe"});
const selected=JSON.parse(cp.execFileSync(process.execPath,[path.join(dir,"select-post-batch.cjs"),"--inventory",out,"--batch",String(next)],{encoding:"utf8"}));
const work=JSON.parse(fs.readFileSync(out,"utf8"));
const index=new Map(work.items.map(item=>[item.id,item]));
const open={
 schemaVersion:1,
 batch:next,
 humanApproval:false,
 note:"German source only. Fill translations for ar,en,tr,ku,ckb,bs,fr,es, then save as the manuscript and rerun with --write.",
 items:selected.items.map(item=>{
  const source=index.get(item.id);
  return {id:item.id,sourceHash:item.sourceHash,sourcePath:item.sourcePath,immutable:source.immutable,fields:source.fields,openLocales:item.openLocales};
 })
};
fs.mkdirSync(path.join(dir,"batches"),{recursive:true});
const target=stem+".open.json";
fs.writeFileSync(target,JSON.stringify(open,null,2)+"\n");
console.log(JSON.stringify({nextBatch:next,open:path.relative(dir,target),posts:open.items.length,humanApproval:false},null,2));
process.exitCode=3;
