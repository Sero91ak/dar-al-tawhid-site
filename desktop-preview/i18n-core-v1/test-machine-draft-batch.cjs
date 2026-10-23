#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),cp=require("node:child_process");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"dar-draft-batch-"));
const writer=path.join(__dirname,"write-machine-drafts.cjs");
const worklist=path.join(__dirname,"translation-worklist.cjs");
function write(name,value){
 const target=path.join(root,name);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,typeof value==="string"?value:JSON.stringify(value));
}
const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
write("desktop-preview/i18n-core-v1/locales.json",{defaultLocale:"de",locales:Object.fromEntries(codes.map(code=>[code,{name:code,dir:["ar","ckb"].includes(code)?"rtl":"ltr",messages:{}}]))});
write("content/posts/posts-index.json",{files:["one.md"]});
write("content/posts/one.md",'---\nid: "one"\ntitle: "Tawḥīd"\nsource: "Qurʾān 51:56"\nscholar: "Test"\nbook: "Test"\n---\n\nDer Prophet ﷺ sagte die Aussage.');
write("q/_registry/shortlinks.json",{links:[]});
write("apple-tv/hadith/catalog.json",{series:[]});
write("content/duas/duas.json",[]);
write("data/quiz-questions.json",[]);
const inventory=path.join(root,"worklist.json");
cp.execFileSync(process.execPath,[worklist,"--root",root,"--out",inventory],{stdio:"pipe"});
const work=JSON.parse(fs.readFileSync(inventory,"utf8"));
const item=work.items.find(entry=>entry.id==="post:one");
const locales=["ar","en","tr","ku","ckb","bs","fr","es"];
const translations=Object.fromEntries(locales.map(locale=>[locale,{
 title:locale==="ar"?"التوحيد":locale==="ckb"?"تەوحید":"Tawhid "+locale,
 body:(locale==="ar"?"قال النبي ﷺ هذه العبارة.":locale==="ckb"?"پێغەمبەر ﷺ ئەم قسەیەی فەرموو.":"The Prophet ﷺ stated the report. "+locale)
}]));
const manuscript={schemaVersion:1,batch:1,humanApproval:false,items:[{id:item.id,sourceHash:item.sourceHash,translations}]};
const manuscriptFile=path.join(root,"manuscript.json");
fs.writeFileSync(manuscriptFile,JSON.stringify(manuscript));
cp.execFileSync(process.execPath,[writer,"--root",root,"--inventory",inventory,"--manuscript",manuscriptFile],{stdio:"pipe"});
const stored=JSON.parse(fs.readFileSync(path.join(root,item.languages.ar.translationPath),"utf8"));
assert.equal(stored.status,"draft");
assert.equal(stored.draftStatus,"machine-reviewed-draft");
assert.equal(stored.humanApproval,false);
assert.equal(stored.reviewer,null);
assert.equal(stored.machineReview.humanLinguisticApproval,false);
assert.equal(stored.machineReview.humanReligiousApproval,false);
assert.equal(stored.immutable.source,"Qurʾān 51:56");
assert.equal(stored.fields.body.includes("ﷺ"),true);
assert.match(stored.fields.body,/[\u0600-\u06ff]/);
const checkpoint=JSON.parse(fs.readFileSync(path.join(root,"desktop-preview/i18n-core-v1/content-batch-checkpoint.json"),"utf8"));
assert.deepEqual(checkpoint.completedBatches,[1]);
assert.equal(checkpoint.nextBatch,2);
assert.equal(checkpoint.humanApproval,false);
manuscript.items[0].status="approved";
fs.writeFileSync(manuscriptFile,JSON.stringify(manuscript));
let rejected=false;
try{cp.execFileSync(process.execPath,[writer,"--root",root,"--inventory",inventory,"--manuscript",manuscriptFile],{stdio:"pipe"})}
catch(_){rejected=true}
assert.equal(rejected,true,"approved manuscripts must be rejected");
const after=JSON.parse(fs.readFileSync(path.join(root,item.languages.fr.translationPath),"utf8"));
assert.equal(after.status,"draft");
console.log("PASS: machine drafts stay unapproved, preserve source hash tokens and resume at the next batch");
