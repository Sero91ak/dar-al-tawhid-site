#!/usr/bin/env node
"use strict";
/* Regression: real canonical 9-locale renderer in a tiny deterministic DOM,
 * exercised at representative available pane widths (not device model names).
 * Layout/browser CI and device acceptance remain separate checks. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const source=read("assets/i18n/adult-home-welcome-v1.js");
new vm.Script(source,{filename:"adult-home-welcome-v1.js"});
const tStart=source.indexOf("var texts={");
const tEnd=source.indexOf("\n};",tStart);
assert(tStart>0&&tEnd>tStart,"Canonical welcome translations missing");
const texts=vm.runInNewContext("("+source.slice(tStart+"var texts=".length,tEnd+2)+")");
assert.deepEqual(Object.keys(texts),["de","ar","en","tr","ku","ckb","bs","fr","es"]);
assert.equal(texts.de[0],"As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh");
assert.equal(texts.de[1],"Willkommen bei DĀR AL TAWḤĪD");
function widthOf(s,font=15){
 let total=0;
 for(const ch of String(s)){
  total+=ch===" "?.31*font:/[.,:;’'-]/.test(ch)?.26*font:
   /[ilIjrt]/.test(ch)?.28*font:/[MWQØ]/.test(ch)?.79*font:
   /\p{Script=Arabic}/u.test(ch)?.55*font:.52*font;
 }
 return total;
}
function node(tag,available=400){
 const o={tag,available,children:[],attributes:{},_text:"",style:{
  values:{},setProperty(k,v){this.values[k]=v},removeProperty(k){delete this.values[k]}
 }};
 Object.defineProperties(o,{
  textContent:{get(){return this.children.length?this.children.map(c=>c.textContent).join(""):this._text},set(v){this.children=[];this._text=String(v)}},
  scrollWidth:{get(){return widthOf(this.textContent,15)}},
  clientWidth:{get(){return this.available}}
 });
 o.appendChild=n=>{o.children.push(n);return n};
 o.replaceChildren=(...kids)=>{o._text="";o.children=kids.flatMap(x=>x.tag==="fragment"?x.children:[x])};
 o.setAttribute=(k,v)=>{o.attributes[k]=String(v)};
 o.getAttribute=k=>o.attributes[k]||null;
 o.hasAttribute=k=>Object.prototype.hasOwnProperty.call(o.attributes,k);
 o.removeAttribute=k=>{delete o.attributes[k]};
 o.getBoundingClientRect=()=>({width:o.available});
 o.querySelector=selector=>o.children.find(c=>selector==="."+c.className)||null;
 return o;
}
let selected="de",mounted=null;
const ctx={font:"400 15px system-ui",measureText(s){
 const match=String(this.font).match(/(\d+(?:\.\d+)?)px/);
 return {width:widthOf(s,match?Number(match[1]):15)};
}};
const doc={
 readyState:"loading",addEventListener(){},querySelector(selector){
  return selector==="#darAdultHomeWelcomeV5"?mounted:null
 },
 createTextNode(s){const n=node("#text");n.textContent=s;return n},
 createDocumentFragment(){return node("fragment")},
 createElement(tag){return tag==="canvas"?{getContext:()=>ctx}:node(tag)}
};
const win={
 localStorage:{getItem:()=>selected},addEventListener(){},
 requestAnimationFrame(fn){fn()},
 getComputedStyle(n){const font=n.tag==="h2"?24:n.tag==="h3"?23:15;
  return{fontStyle:"normal",fontWeight:"400",fontSize:font+"px",fontFamily:"Georgia",letterSpacing:"0px"};
 }
};
vm.runInNewContext(source,{window:win,document:doc});
const api=win.DARAdultHomeWelcomeV1;
assert(api&&typeof api.apply==="function","Single canonical locale owner not available");
let checked=0,visiblePyramids=0;
for(const locale of Object.keys(texts)){
 for(const available of [280,320,360,390,430,600,768,1024]){
  selected=locale;
  const salam=node("h2",available),title=node("h3",available),description=node("p",available);
  mounted={attributes:{},setAttribute(k,v){this.attributes[k]=v},querySelector(sel){
   return{".dar-adult-home-salam-v5":salam,".dar-adult-home-title-v7":title,".dar-adult-home-desc-v7":description}[sel]||null;
  }};
  api.apply();
  assert.equal(mounted.attributes.dir,["ar","ckb"].includes(locale)?"rtl":"ltr");
  assert.equal(salam.children.length,2,locale+" Salam must keep exactly two rows at "+available);
  assert.equal(salam.attributes["aria-label"],texts[locale][0]);
  assert.equal(title.attributes["aria-label"],texts[locale][1]);
  assert(title.children.some(n=>n.className==="dar-welcome-kicker"),locale+" missing intro kicker");
  assert(title.children.some(n=>n.className==="dar-welcome-brand"),locale+" missing brand");
  assert.equal(description.textContent.trim(),texts[locale][2],locale+" text altered at "+available);
  assert.equal(description.attributes["aria-label"]||texts[locale][2],texts[locale][2]);
  const lines=description.children.filter(n=>n.className==="dar-welcome-pyramid-line");
  if(lines.length){
   visiblePyramids++;
   assert(lines.every(n=>n.scrollWidth<=available+2),locale+" overflow at "+available);
   assert(lines[0].textContent.trim().length>8,locale+" orphan opening line");
  }
  if(locale==="de"){
   const highlights=description.children.flatMap(n=>[n].concat(n.children||[])).filter(n=>n.tag==="strong");
   assert(highlights.length>0,"German source highlighting lost at "+available);
  }
  checked++;
 }
}
assert(visiblePyramids>35,"Responsive pyramid absent on most layouts");
const router=read("cloudflare/site-router.js");
const testRouter=read("cloudflare/test-app-worker.js");
const desktop=read("desktop-preview/index.html");
for(const f of [router,testRouter,desktop])
 assert(f.includes("adult-home-welcome-v1.js?v=20261107-welcome-editorial-v3"),"Stale localized welcome file version");
assert(read("pwa/service-worker.js").includes("'/assets/i18n/adult-home-welcome-v1.js'"),
 "Installed Android PWA must fetch current locale layout online-first");
console.log("PASS – "+checked+" locale/pane combinations, "+visiblePyramids+" pyramids, semantic titles, two-row Salam, intact text, cache versions.");
