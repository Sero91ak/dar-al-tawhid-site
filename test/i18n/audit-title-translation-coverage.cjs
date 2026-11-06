#!/usr/bin/env node
"use strict";
/* Cost-free canonical source inventory for all adult titles.
 * One original ID is reused on Web/desktop/iOS. Drafts do not imply review.
 * Run after every new or modified post — without calling a translation API.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../..");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-visible-title-drafts-seven.json"),"utf8"));
const canonical=new Map();
for(const filename of fs.readdirSync(path.join(root,"content/posts")).filter(p=>p.endsWith(".md"))){
 const raw=fs.readFileSync(path.join(root,"content/posts",filename),"utf8");
 if(!raw.startsWith("---\n"))continue;
 const head=raw.split(/\n---\r?\n/,1)[0];
 const id=head.match(/^id:\s*"([^"]+)"/m)?.[1],title=head.match(/^title:\s*"([^"]+)"/m)?.[1];
 if(!id||!title)continue;
 if(canonical.has(id)&&canonical.get(id).title!==title)throw Error("Duplicate canonical post id "+id);
 canonical.set(id,{kind:"post",id,title,sourcePath:"content/posts/"+filename,
  titleSha256:crypto.createHash("sha256").update(title,"utf8").digest("hex")});
}
for(const item of JSON.parse(fs.readFileSync(path.join(root,"content/duas/duas.json"),"utf8"))){
 const key="dua:"+item.id;
 if(canonical.has(key))throw Error("Duplicate canonical id "+key);
 canonical.set(key,{kind:"dua",id:item.id,title:item.title,sourcePath:"content/duas/duas.json",
  titleSha256:crypto.createHash("sha256").update(item.title,"utf8").digest("hex")});
}
const complete=[],pending=[],stale=[];
for(const entry of canonical.values()){
 const record=pack.records[entry.kind+":"+entry.id];
 if(!record){pending.push(entry);continue}
 if(record.sourceTitle!==entry.title){stale.push(entry);continue}
 if(["tr","en","ar","ku","ckb","bs"].some(x=>!record.translations?.[x]?.trim())){pending.push(entry);continue}
 complete.push(entry);
}
for(const key of Object.keys(pack.records)){
 if(!canonical.has(key)&&!canonical.has(key.replace(/^post:/,"")))throw Error("Orphan title draft "+key);
}
const report={schemaVersion:1,scope:"adult-title-source-coverage",cost:"zero-api",
  disclaimer:"Draft translations are not approved religious scholarship; German source always available.",
  totalSources:canonical.size,completeDrafts:complete.length,pendingDrafts:pending.length,
  staleDrafts:stale.length,
  pending,stale};
const out=path.join(__dirname,"qa/title-translation-coverage.json");
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
assert(report.completeDrafts>=131,"Current localized title draft coverage regressed");
assert.equal(stale.length,0,"One or more titles are out of date");
console.log(JSON.stringify({totalSources:report.totalSources,drafted:report.completeDrafts,
 pending:report.pendingDrafts,stale:report.staleDrafts,cost:"no model/API call"},null,2));
