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
   if(selector===".post-reader-title h2, header h2")return heading;
   if(selector===".post-aussage-text, .statement")return statement;
   if(selector===".post-fazit-body")return null;
   return null;
  },
  replaceChildren(...children){this.children=children}
 };
 return node;
}
const article=el("article");
article.className="post-reader";
article.attrs["data-post-id"]="354-547";
article.setAttribute("aria-label","📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst öffnen");
const header=el("header");
header.className="post-reader-title";
const heading=el("h2");
heading.textContent="📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst";
header.children=[heading];
const statement=el("p");
statement.className="statement";
statement.textContent="Deutscher Originaltext bleibt stehen.";
article.children=[header,statement];
const homeTitle=el("h3");
homeTitle.className="home-v380-post-title";
homeTitle.textContent="📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst";
const homeExcerpt=el("p");
homeExcerpt.className="home-v380-post-excerpt";
homeExcerpt.textContent="Deutscher Auszug.";
const home=el("article");
home.className="home-v380-post-preview";
home.setAttribute("data-nav","post");
home.setAttribute("data-value","354-547");
home.children=[homeTitle,homeExcerpt];
home.querySelectorAll=function(selector){
 const found=[];
 if(selector.includes("home-v380-post-title"))found.push(homeTitle);
 if(selector.includes("home-v380-post-excerpt"))found.push(homeExcerpt);
 return found;
};
const storage={locale:"ar"};
const doc={
 head:{appendChild(){}},
 getElementById(){return null},
 createElement:el,
 querySelector(selector){return selector==="article.post-reader[data-post-id]"?article:null},
 querySelectorAll(selector){return selector.includes("data-nav")?[article,home]:[]},
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
assert.match(heading.textContent,/المزني/);
assert.match(statement.textContent,/المزني|الطاعة/);
assert.equal(heading.getAttribute("data-dar-source"),"📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst");
assert.equal(statement.getAttribute("data-dar-source"),"Deutscher Originaltext bleibt stehen.");
assert.equal(heading.getAttribute("dir"),"rtl");
assert.match(article.getAttribute("aria-label"),/المزني/);
assert.match(homeTitle.textContent,/المزني/);
assert.match(homeExcerpt.textContent,/الطاعة|«/);
assert.equal(homeTitle.getAttribute("dir"),"rtl");
assert.equal(homeExcerpt.getAttribute("data-dar-source"),"Deutscher Auszug.");
assert.match(panel.children[3].textContent,/Sharḥ as-Sunnah/);
assert.equal(pack.humanApproval,false);
storage.locale="de";
w.DarTestMachineDrafts.render();
assert.equal(panel.removed,true);
assert.equal(heading.textContent,"📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst");
assert.equal(statement.textContent,"Deutscher Originaltext bleibt stehen.");
assert.equal(article.getAttribute("aria-label"),"📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst öffnen");
assert.equal(homeTitle.textContent,"📖 Al-Muzanī: Keiner besitzt Gehorsam aus sich selbst");
assert.equal(homeExcerpt.textContent,"Deutscher Auszug.");
console.log("PASS: DAR TEST shows the selected language in title and statement, restores German, and grants no approval");
const surface=JSON.parse(fs.readFileSync(path.join(__dirname,"../i18n/adult-surface-drafts.json"),"utf8"));
assert.equal(surface.humanApproval,false);
assert.equal(surface.scope,"dar-test-surface-drafts-only");
const germanMeaning="Unser Herr, gib uns im Diesseits Gutes und im Jenseits Gutes und bewahre uns vor der Strafe des Feuers.";
const phrase={nodeValue:"  "+germanMeaning+"  ",parentElement:{closest(){return null}}};
const surfaceDoc={
 head:{appendChild(){}},getElementById(){return null},createElement:el,
 querySelector(){return null},querySelectorAll(){return []},
 createTreeWalker(){let seen=false;return {nextNode(){if(seen)return null;seen=true;return phrase}}},
 body:{}
};
const surfaceWindow={location:{pathname:"/test/"},document:surfaceDoc,localStorage:{getItem:()=>"en"},
 addEventListener(){},MutationObserver:function(){this.observe=()=>{}},
 fetch:async(url)=>({ok:!String(url).includes("adult-surface"),json:async()=>pack}),console};
vm.runInNewContext(source,{window:surfaceWindow});
surfaceWindow.DarTestMachineDrafts.bootSurface(surface);
assert.match(phrase.nodeValue,/Our Lord/);
assert.doesNotMatch(phrase.nodeValue,/Diesseits/);
surfaceWindow.localStorage.getItem=()=>"de";
surfaceWindow.DarTestMachineDrafts.render();
assert.match(phrase.nodeValue,/Diesseits/);
console.log("PASS: DAR TEST swaps an exact duʿāʾ meaning and restores the German sentence");
