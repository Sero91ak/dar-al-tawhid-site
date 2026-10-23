#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"../i18n/adult-content-machine-drafts.json"),"utf8"));
const source=fs.readFileSync(path.join(__dirname,"dar-test-machine-drafts.js"),"utf8");
const checkpoint=JSON.parse(fs.readFileSync(path.join(__dirname,"../../desktop-preview/i18n-core-v1/content-batch-checkpoint.json"),"utf8"));
assert.equal(pack.humanApproval,false);
assert.equal(pack.status,"draft");
assert.equal(Object.keys(pack.records).length,checkpoint.items.length);
assert.equal(checkpoint.humanApproval,false);
assert.equal(checkpoint.nextBatch,checkpoint.completedBatches.length+1);
for(const record of Object.values(pack.records)){
 assert.equal(record.humanApproval,false);
 assert.equal(record.status,"draft");
 assert.deepEqual(Object.keys(record.translations).sort(),["ar","bs","ckb","en","es","fr","ku","tr"]);
 assert.equal(record.immutable.sourceReviewBlocked,false);
 assert.match(record.immutable.source,/\S/);
}
const nodes=[];
function el(tag){
 const node={tag,attrs:{},children:[],textContent:"",
  setAttribute(name,value){this.attrs[name]=value},
  getAttribute(name){return this.attrs[name]||null},
  appendChild(child){this.children.push(child);return child},
  insertBefore(child){this.children.unshift(child);return child},
  remove(){this.removed=true},
  querySelector(selector){
   if(selector===":scope > .dar-machine-draft")return this.children.find(child=>child.className==="dar-machine-draft"&&!child.removed)||null;
   if(selector===".post-reader-title")return this.children.find(child=>child.className==="post-reader-title")||null;
   return null;
  },
  replaceChildren(...children){this.children=children}
 };
 return node;
}
const article=el("article");
article.className="post-reader";
article.attrs["data-post-id"]="354-547";
const header=el("header");
header.className="post-reader-title";
const heading=el("h2");
heading.textContent="📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst";
header.children=[heading];
const statement=el("p");
statement.className="statement";
statement.textContent="Deutscher Originaltext bleibt stehen.";
article.children=[header,statement];
const storage={locale:"ar"};
const doc={
 head:{appendChild(){}},
 getElementById(){return null},
 createElement:el,
 querySelector(selector){return selector==="article.post-reader[data-post-id]"?article:null},
 body:{}
};
const w={location:{pathname:"/test/"},document:doc,localStorage:{getItem:()=>storage.locale},
 addEventListener(){},MutationObserver:function(){this.observe=()=>{}},fetch:async()=>({ok:true,json:async()=>pack}),
 console};
vm.runInNewContext(source,{window:w});
w.DarTestMachineDrafts.boot(pack);
w.DarTestMachineDrafts.render();
const panel=article.querySelector(":scope > .dar-machine-draft");
assert(panel,"Arabic draft panel missing");
assert.equal(panel.attrs.dir,"rtl");
assert.equal(panel.attrs["data-dar-no-translate"],"machine-draft");
assert.match(panel.children[0].textContent,/الآلة/);
assert.match(panel.children[1].textContent,/المزني/);
assert.equal(heading.textContent,"📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst");
assert.equal(statement.textContent,"Deutscher Originaltext bleibt stehen.");
assert.match(panel.children[3].textContent,/Sharḥ as-Sunnah/);
storage.locale="de";
w.DarTestMachineDrafts.render();
assert.equal(panel.removed,true);
console.log("PASS: DAR TEST shows RTL machine drafts without replacing the German original or granting approval");
