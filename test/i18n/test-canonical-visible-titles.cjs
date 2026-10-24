#!/usr/bin/env node
"use strict";
/* Validate that localized visible labels match current canonical source metadata.
   No paid translation calls. Text bodies and Arabic original material are untouched. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-visible-title-drafts-seven.json"),"utf8"));
const posts=fs.readdirSync(path.join(root,"content/posts")).filter(p=>p.endsWith(".md"));
const index=new Map();
for(const name of posts){
 const raw=fs.readFileSync(path.join(root,"content/posts",name),"utf8");
 const head=raw.startsWith("---\n")?raw.split(/\n---(?:\r)?\n/,1)[0]:null;
 if(!head)continue;
 const id=head.match(/^id:\s*"([^"]+)"/m)?.[1];
 const title=head.match(/^title:\s*"([^"]+)"/m)?.[1];
 if(id&&title)index.set(id,title);
}
const duas=JSON.parse(fs.readFileSync(path.join(root,"content/duas/duas.json"),"utf8"));
const duaIndex=new Map(duas.map(d=>[d.id,d.title]));
for(const [key,value] of Object.entries(pack.records)){
 assert.equal(key,value.kind+":"+value.id);
 const actual=value.kind==="post"?index.get(value.id):duaIndex.get(value.id);
 assert(actual,"Missing canonical title ID: "+key);
 assert.equal(value.sourceTitle,actual,"Outdated canonical German heading for "+key);
 for(const locale of ["tr","en","ar","ku","ckb","bs","fr","es"]){
  assert(value.translations[locale]?.trim(),"No draft in "+locale+" for "+key);
 }
}
assert.equal(pack.paidApiCalls,0);
assert.equal(pack.bodyTranslation,false);
console.log("PASS: "+Object.keys(pack.records).length+" post/dua headings match canonical source IDs/titles; source texts untouched");
