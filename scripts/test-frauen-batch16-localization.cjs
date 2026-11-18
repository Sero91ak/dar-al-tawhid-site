#!/usr/bin/env node
"use strict";
/* Pure in-memory widget test; nothing published or sent.
 * Run browser-language overlay against real canonical 16 x 9 data:
 * detail statement, card title, preview, source, sharh, navigation and RTL.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const index=read("assets/frauen/frauen-entry-locales-v1.json");
const batch=read("content/admin/frauen-batch-16-2026-11-18.json");
const code=fs.readFileSync(path.join(root,"assets/frauen/frauen-entry-locale-v1.js"),"utf8");
const events={};
const makeElement=()=>({
 textContent:"",attrs:{},
 setAttribute(k,v){this.attrs[k]=String(v)},
 getAttribute(k){return this.attrs[k]||null},
 querySelector(){return makeElement()}
});
const sourceLink=makeElement();
const elements=new Map();
const get=sel=>{
 if(!elements.has(sel))elements.set(sel,makeElement());
 return elements.get(sel);
};
const explanation={querySelector:get};
const mainArea={querySelector:sel=>sel==="[data-dar-frauen-local-sharh]"?explanation:get(sel)};
const article={
 lang:"",dir:"",attrs:{},
 setAttribute(k,v){this.attrs[k]=String(v)},
 querySelector(sel){
  if(sel===".post-reader-main")return mainArea;
  if(sel==="a.frauen-direktnachweis[href]")return sourceLink;
  return get(sel);
 }
};
const card={
 lang:"",dir:"",attrs:{},
 setAttribute(k,v){this.attrs[k]=String(v)},
 getAttribute(k){return this.attrs[k]||null},
 querySelector:get
};
const rootElement={
 querySelector(sel){if(sel==="article.post-reader")return article;return null},
 querySelectorAll(sel){return sel.includes(".frauen-post-row")?[card]:[]}
};
const document={
 readyState:"complete",
 querySelector(sel){return sel===".dar-frauen-production-root"?rootElement:null},
 getElementById(id){return id==="appView"?rootElement:null},
 addEventListener(name,cb){(events["doc:"+name]??=[]).push(cb)}
};
const storage={value:"de",getItem(){return this.value},setItem(k,v){this.value=v}};
const location={href:"https://dar-al-tawhid.de/#frauen",hash:"#frauen",origin:"https://dar-al-tawhid.de",pathname:"/"};
const window={
 document,location,localStorage:storage,
 fetch:async()=>({ok:true,json:async()=>index}),
 requestAnimationFrame:fn=>fn(),
 addEventListener(name,cb){(events["win:"+name]??=[]).push(cb)},
 navigator:{},console
};
const context={window,document,URL,Promise,console,MutationObserver:class {observe(){}},CustomEvent:class {constructor(type){this.type=type}}};
vm.runInNewContext(code,context,{filename:"frauen-entry-locale-v1.js",timeout:10000});
const emit=(name)=>{for(const f of events["win:"+name]||[])f({key:"darAdultPreferredLocaleV1"})};
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,0)); // fetch and initial catalog activation
 let checked=0;
 for(const record of batch.records){
  const entry=index.entries[record.id];
  assert.equal(entry.area,record.area,"Route mismatch "+record.id);
  card.attrs["data-value"]=record.area+"/"+record.id;
  location.hash="#frauen/"+record.area+"/"+record.id;
  location.href="https://dar-al-tawhid.de/"+location.hash;
  sourceLink.attrs.href=record.sourceUrl;
  for(const code of batch.requiredLocales){
   const desired=entry.locales[code];
   storage.value=code;
   emit("hashchange");
   const fail=(field,value,expected)=>assert.equal(value,expected,record.id+" "+code+" "+field);
   fail("article.lang",article.lang,code);
   fail("card.lang",card.lang,code);
   fail("article.dir",article.dir,desired.dir);
   fail("card.dir",card.dir,desired.dir);
   fail("title",get(".post-reader-title h2").textContent,desired.title);
   fail("card title",get(".post-row__body h3").textContent,desired.title);
   fail("statement",get(".post-aussage-text").textContent,desired.statement);
   fail("preview",get(".frauen-row__aussage").textContent,desired.preview);
   fail("lesson",get(".post-key-message[data-post-fazit] .post-fazit-body").textContent,desired.lesson);
   fail("sharh",get(".post-fazit-body").textContent,desired.sharh);
   fail("source",get(".post-source-module [data-post-after-source]").textContent,desired.source);
   fail("source link",sourceLink.getAttribute("href"),record.sourceUrl);
   fail("canonical ID",article.attrs["data-dar-frauen-content-id"],record.id);
   fail("card canonical ID",card.attrs["data-dar-frauen-content-id"],record.id);
   checked++;
  }
 }
 console.log("PASS Frauen overlay: "+checked+" localized card/detail renders, preview, statement, sharh, lesson, sources, canonical IDs, reader direction and all 16 source links.");
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
