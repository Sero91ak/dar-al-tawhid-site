#!/usr/bin/env node
"use strict";
/* Standalone regression: the real V3 source is executed against a deterministic DOM.
 * Never touches credentials, real content, cloud services or user accounts. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const script=fs.readFileSync(path.join(ROOT,"admin/intelligence-v3.js"),"utf8");
const css=fs.readFileSync(path.join(ROOT,"admin/intelligence-v3.css"),"utf8");
const app=fs.readFileSync(path.join(ROOT,"admin/index.html"),"utf8");
const nav=fs.readFileSync(path.join(ROOT,"admin/command-center-v2.js"),"utf8");
const requiredLocales=["de","en","tr","ar","ku","ckb","bs","fr","es"];
class Element {
 constructor(tag){this.tagName=tag;this.id="";this.className="";this.textContent="";this.dataset={};this.children=[];this.parentNode=null;this.attributes={};this.listeners={};this.disabled=false;this.style={}}
 append(...xs){for(const x of xs){this.children.push(x);x.parentNode=this}}
 prepend(...xs){for(const x of xs.reverse()){this.children.unshift(x);x.parentNode=this}}
 replaceChildren(...xs){for(const x of this.children)x.parentNode=null;this.children=[];this.append(...xs)}
 insertAdjacentElement(side,x){
  assert.equal(side,"afterend");
  const a=this.parentNode.children,i=a.indexOf(this);
  assert.ok(i>=0);a.splice(i+1,0,x);x.parentNode=this.parentNode;
 }
 remove(){if(!this.parentNode)return;const a=this.parentNode.children;const i=a.indexOf(this);if(i>=0)a.splice(i,1);this.parentNode=null}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(k,fn){this.listeners[k]=fn}
 click(){this.listeners.click?.({target:this})}
 get classList(){return {contains:c=>this.className.split(/\s+/).includes(c),toggle:(c,on)=>{const a=new Set(this.className.split(/\s+/).filter(Boolean));if(on===false)a.delete(c);else if(on===true)a.add(c);else if(a.has(c))a.delete(c);else a.add(c);this.className=[...a].join(" ")}}}
 querySelectorAll(q){
  const matches=e=>q.startsWith("#")?e.id===q.slice(1):q.startsWith(".")?e.className.split(/\s+/).includes(q.slice(1)):e.tagName===q;
  let out=[];const walk=e=>{for(const child of e.children){if(matches(child))out.push(child);walk(child)}};walk(this);return out;
 }
 querySelector(q){return this.querySelectorAll(q)[0]||null}
}
function environment(pathname="/admin/"){
 const docRoot=new Element("document"),body=new Element("body"),panel=new Element("div"),cover=new Element("section"),summary=new Element("summary"),legacy=new Element("details"),picker=new Element("select");
 docRoot.append(body);body.className="dar-v2-active";body.append(panel);panel.id="panel";cover.className="admin-cover";panel.append(cover);
 summary.id="darV3ClassicSummary";legacy.append(summary);panel.append(legacy);
 picker.id="adminTabSelect";picker.value="start";picker.options=["start","quellen","social","actions","wissensbereich","tech"].map(value=>({value}));panel.append(picker);
 let login=false,locale="de",changes=0;
 const document={body,documentElement:new Element("html"),createElement:tag=>new Element(tag),querySelector:q=>{
  if(q==="#adminTabSelect")return picker;
  if(q==="#panel .login")return login?new Element("div"):null;
  if(q==="#panel .admin-cover")return cover.parentNode?cover:null;
  return docRoot.querySelector(q);
 }};
 const localStorage={getItem:k=>k==="darAdultPreferredLocaleV1"?locale:null};
 const window={};
 class Event{constructor(type,options){this.type=type;this.bubbles=!!options?.bubbles}}
 picker.dispatchEvent=e=>{assert.equal(e.type,"change");changes++};
 vm.runInNewContext(script,{window,document,location:{pathname},localStorage,Event,Intl,Date,Number,JSON,Array,Object,Set,console},{filename:"admin/intelligence-v3.js",timeout:2500});
 return{window,document,body,picker,summary,setLogin:b=>login=b,setLocale:s=>locale=s,changes:()=>changes};
}
const data={online:9,views:12345,shares:21,saves:34,rows:[{views:12345}],updated:"2026-11-06T05:40:00Z"};
(function basicMount(){
 const a=environment();assert.equal(typeof a.window.DARAdminIntelligenceV3?.sync,"function");
 a.window.DARAdminIntelligenceV3.sync(data);
 let section=a.document.querySelector("#darV3Dashboard");
 assert.ok(section,"Dashboard mounts in authenticated start route");
 assert.equal(a.document.querySelectorAll?.("#darV3Dashboard")?.length||a.body.querySelectorAll("#darV3Dashboard").length,1);
 assert.equal(section.querySelectorAll(".dar-v3-metric").length,4);
 assert.match(section.querySelector(".dar-v3-metric-value").textContent,/9/);
 assert.ok(a.summary.textContent.includes("Module"));
 assert.equal(section.querySelectorAll(".dar-v3-task").length,5);
 a.window.DARAdminIntelligenceV3.sync(data);
 assert.equal(a.body.querySelectorAll("#darV3Dashboard").length,1,"No duplicate component on refresh");
 const task=section.querySelectorAll(".dar-v3-task").find(x=>x.dataset.v3Task==="languages");
 assert.ok(task);task.click();
 assert.match(section.querySelector("#darV3Detail").textContent||section.querySelector("#darV3Detail").querySelector("h3").textContent,/Sprachfassungen/);
 const open=section.querySelector(".dar-v3-action");open.click();
 assert.equal(a.picker.value,"social","Navigation delegates to existing select");
 assert.equal(a.changes(),1,"Exactly one existing-route change event");
})();
(function filtersAndMissingData(){
 const a=environment();
 a.window.DARAdminIntelligenceV3.sync(null);
 const section=a.document.querySelector("#darV3Dashboard");
 const values=section.querySelectorAll(".dar-v3-metric-value").map(x=>x.textContent);
 assert.deepEqual(values,["—","—","—","—"],"Never invent zero or online data");
 assert.match(section.querySelector(".dar-v3-date").textContent,/Keine geprüften Daten/);
 const technical=section.querySelectorAll(".dar-v3-filter").find(x=>x.dataset.v3Filter==="system");technical.click();
 assert.equal(section.querySelectorAll(".dar-v3-task").length,1,"System filter shows only technical route");
 assert.equal(section.querySelector(".dar-v3-task").dataset.v3Task,"technical");
})();
(function localeAndGates(){
 const a=environment();a.window.DARAdminIntelligenceV3.sync(data);
 a.setLocale("tr");a.window.DARAdminIntelligenceV3.sync(data);
 assert.match(a.document.querySelector("#darV3Dashboard").querySelector("h2").textContent,/Çalışma/);
 assert.match(a.summary.textContent,/modül/);
 a.picker.value="quellen";a.window.DARAdminIntelligenceV3.sync(data);
 assert.equal(a.body.querySelectorAll("#darV3Dashboard").length,1,"Existing content stays under the original panel; navigation belongs to V2");
 const guest=environment();guest.setLogin(true);guest.window.DARAdminIntelligenceV3.sync(data);
 assert.equal(guest.body.querySelectorAll("#darV3Dashboard").length,0,"No dashboard for login screen");
 const publicPage=environment("/");assert.equal(publicPage.window.DARAdminIntelligenceV3,undefined,"Not active outside admin");
})();
(function staticContracts(){
 for(const locale of requiredLocales)assert.ok(script.includes(locale+":["),"Missing locale "+locale);
 for(const file of ["intelligence-v3.js","intelligence-v3.css"])assert.ok(app.includes("/admin/"+file));
 assert.match(nav,/DARAdminIntelligenceV3\.sync\(getStats\(\)\)/);
 assert.match(nav,/updated:value\.updated\|\|null/);
 assert.match(app,/class="dar-v3-legacy-tools"/);
 assert.match(app,/id="darV3ClassicSummary"/);
 assert.match(css,/max-width:719px/);
 assert.match(css,/max-width:1080px/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(!/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket)\s*\(/.test(script),"Read-only V3 must not perform requests");
 assert.ok(!script.includes("innerHTML"),"Use safe textContent DOM construction");
})();
console.log("DĀR Admin Intelligence V3: PASS — real script, authenticated route, stats, filters, 9 locales, navigation and read-only contract");
