#!/usr/bin/env node
"use strict";
/* 48-hour women-focus runtime test. No live file is altered or made visible.
 * Simulates the actual visitor V3 root and public-source read gate, without
 * adding a new hero or touching the existing adult home renderer. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const launch=read("assets/frauen/frauen-neufokus-v1.json");
const draft=read("content/focus-feed/feed-index.json");
const sourceFiles=launch.sourceFiles;
const localeCatalog=read("assets/frauen/frauen-entry-locales-v1.json");
const lessonHtml=fs.readFileSync(path.join(root,"lernen/frauen-wissen/index.html"),"utf8");
assert.equal(launch.items.length,16);
assert.equal(launch.expectedCount,16);
assert.equal(sourceFiles.length,3);
const source={};
for(const p of sourceFiles)source["/"+p]=read(p);
const script=fs.readFileSync(path.join(root,"assets/frauen/frauen-neufokus-v1.js"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/frauen/frauen-neufokus-v1.css"),"utf8");
const router=fs.readFileSync(path.join(root,"cloudflare/site-router.js"),"utf8");
assert.match(router,/darFrauenNeufokusV1/,"Neufokus is not mounted in actual app router");
assert.match(css,/#dv3Home \.dar-frauen-neufokus/,"Styles must be scoped to real V3 home");
const id="neufokus-frauenwissen-16-20261118";
const now=Date.now(),start=new Date(now-20*60*1000).toISOString(),end=new Date(now-20*60*1000+48*3600000).toISOString();
let feed=JSON.parse(JSON.stringify(draft));
let card=feed.items.find(x=>x.id===id);assert.ok(card);
let serverEntries=JSON.parse(JSON.stringify(source)),lang="tr",navigated=[];
let deployedLanguages=JSON.parse(JSON.stringify(localeCatalog)),learningAvailable=true;
const expiryTimers=new Map();let timerSerial=0;
const registry=new Map(),listeners={},anchor={insertAdjacentElement(pos,el){assert.equal(pos,"afterend");registry.set(el.id,el)}};
function node(tag){
 const element={tagName:tag.toUpperCase(),children:[],attrs:{},textContent:"",lang:"",dir:"",
  setAttribute(n,v){this.attrs[n]=String(v)},
  addEventListener(n,cb){this["on"+n]=cb},
  appendChild(child){this.children.push(child)},
  append(...children){this.children.push(...children)},
  replaceChildren(...children){this.children=children},
  remove(){registry.delete(this.id)},
  querySelector(){return null}
 };
 return element;
}
const home={querySelector(sel){return sel===".dv3-tawhid"?anchor:null},appendChild(el){registry.set(el.id,el)}};
const doc={readyState:"loading",hidden:false,head:{appendChild(el){registry.set(el.id,el)}},
 getElementById(id){if(id==="dv3Home")return home;return registry.get(id)||null},
 createElement:node,addEventListener(ev,cb){(listeners[ev]??=[]).push(cb)}
};
const win={document:doc,location:{href:"https://dar-al-tawhid.de/",pathname:"/",hash:"#home"},console,
 requestAnimationFrame(cb){cb()},
 localStorage:{getItem(){return lang}},
 setInterval(){},setTimeout(cb,delay){const id=++timerSerial;expiryTimers.set(id,{cb,delay});return id},
 clearTimeout(id){expiryTimers.delete(id)},addEventListener(){},navigate(view){navigated.push(view)},
 fetch:async url=>{
   const pathname=url.split("?")[0];
   let result;
   if(pathname==="/content/focus-feed/feed-index.json")result=feed;
   else if(pathname==="/assets/frauen/frauen-neufokus-v1.json")result=launch;
   else if(pathname==="/assets/frauen/frauen-entry-locales-v1.json")result=deployedLanguages;
   else if(pathname==="/lernen/frauen-wissen/")return learningAvailable?{ok:true,text:async()=>lessonHtml}:{ok:false,status:404};
   else result=serverEntries[pathname];
   return result?{ok:true,json:async()=>result}:{ok:false,status:404};
 }
};
vm.runInNewContext(script,{window:win,document:doc,console,Promise,URL,MutationObserver:class{observe(){}},Date}, {filename:"frauen-neufokus-v1.js",timeout:15000});
async function refresh(){await win.DARFrauenNeufokusV1.refresh();await Promise.resolve();await Promise.resolve()}
function getCard(){return registry.get("darFrauenNeufokus48h")||null}
(async()=>{
 for(const cb of listeners.DOMContentLoaded||[])cb();
 await refresh();assert.equal(getCard(),null,"Draft focus must stay hidden");
 card.status="live";card.startsAt=start;card.expiresAt=end;
 await refresh();assert.equal(getCard(),null,"Hidden source must block focus even with live feed");
 for(const row of launch.items){
   const e=serverEntries["/"+row.sourceFile].eintraege.find(x=>x.kennung===row.id);
   assert.ok(e);e.quellenstatus="geprueft";e.freigabeDurchSerhat=true;
 }
 // One unapproved out of 16 must fail closed.
 let last=launch.items[15],lastRecord=serverEntries["/"+last.sourceFile].eintraege.find(x=>x.kennung===last.id);
 lastRecord.quellenstatus="nicht-anzeigen";
 await refresh();assert.equal(getCard(),null,"15/16 source records must not launch focus");
 lastRecord.quellenstatus="geprueft";
 // 16 German articles alone must never expose a card with stale languages.
 const broken=deployedLanguages.entries[launch.items[2].id].locales.ar;
 delete deployedLanguages.entries[launch.items[2].id].locales.ar;
 await refresh();assert.equal(getCard(),null,"Missing Arabic translation must block focus");
 deployedLanguages.entries[launch.items[2].id].locales.ar=broken;
 learningAvailable=false;
 await refresh();assert.equal(getCard(),null,"Missing learning page must block focus");
 learningAvailable=true;
 await refresh();const active=getCard();
 assert.ok(active,"16/16 source records should unlock within valid 48h feed window");
 assert.equal(expiryTimers.size,1,"Precisely one expiry timer required for the visible focus");
 assert.equal(active.dir,"ltr");assert.equal(active.lang,"tr");
 assert.ok(active.children.some(x=>/16 yeni/.test(x.textContent)),"Turkish focus label missing");
 active.onclick();assert.deepEqual(navigated,["frauen"],"Focus must open actual in-app women hub");
 lang="ar";
 await refresh();assert.equal(getCard().dir,"rtl");assert.equal(getCard().lang,"ar");
 assert.ok(getCard().children.some(x=>/١٦/.test(x.textContent)),"Arabic title missing");
 card.expiresAt=new Date(Date.parse(end)+3600000).toISOString();
 await refresh();assert.equal(getCard(),null,"49-hour focus window must be rejected");
 card.expiresAt=end;
 card.startsAt=new Date(now-49*3600000).toISOString();
 card.expiresAt=new Date(now-3600000).toISOString();
 await refresh();assert.equal(getCard(),null,"Expired 48-hour window must hide");
 assert.equal(draft.items.find(x=>x.id===id).status,"draft","Never alter actual staging/live feed file");
 for(const row of launch.items){
   const original=source["/"+row.sourceFile].eintraege.find(x=>x.kennung===row.id);
   assert.equal(original.quellenstatus,"nicht-anzeigen","Original source state changed: "+row.id);
 }
 console.log("PASS 48h Frauen Neufokus: draft hidden, hidden-source gate, 15/16 fail-close, 16/16 live, Turkish/Arabic RTL, in-app click, exact duration, expiry. No publish or push.");
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
