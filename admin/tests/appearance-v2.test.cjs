#!/usr/bin/env node
"use strict";
/* Regression test for DĀR Admin V2: authentic script against a small DOM harness.
 * Runs with Node only; no network, credentials, publishing or visitor mutations. */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"admin/appearance-v2.js"),"utf8");
const admin=fs.readFileSync(path.join(root,"admin/index.html"),"utf8");
const shell=fs.readFileSync(path.join(root,"admin/command-center-v2.css"),"utf8");
const css=fs.readFileSync(path.join(root,"admin/appearance-v2.css"),"utf8");
const studio=fs.readFileSync(path.join(root,"admin/redaktion/index.html"),"utf8");
const studioCss=fs.readFileSync(path.join(root,"admin/redaktion/appearance.css"),"utf8");
class Element {
 constructor(tag){
  this.tagName=tag;this.className="";this.id="";this.children=[];this.parentNode=null;
  this.dataset={};this.attributes={};this.events={};this.style={};this.textContent="";
 }
 append(...children){children.forEach(child=>{child.parentNode=this;this.children.push(child)})}
 prepend(child){child.parentNode=this;this.children.unshift(child)}
 replaceChildren(...children){this.children=[];this.append(...children)}
 insertAdjacentElement(where,child){
  assert.equal(where,"afterend");
  const list=this.parentNode.children,index=list.indexOf(this);
  assert.ok(index>=0);
  list.splice(index+1,0,child);child.parentNode=this.parentNode;
 }
 setAttribute(k,v){this.attributes[k]=String(v)}
 getAttribute(k){return this.attributes[k]??null}
 addEventListener(type,fn){this.events[type]=fn}
 click(){this.events.click?.({target:this})}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 querySelectorAll(selector){
  const found=[];
  function matches(node){
   if(selector.startsWith("."))return node.className.split(/\s+/).includes(selector.slice(1));
   if(selector.startsWith("#"))return node.id===selector.slice(1);
   if(selector==="[data-dar-admin-switch]")return node.dataset.darAdminSwitch!==undefined;
   if(selector==="[data-dar-admin-choice]")return node.dataset.darAdminChoice!==undefined;
   return false;
  }
  function walk(parent){for(const child of parent.children){if(matches(child))found.push(child);walk(child)}}
  walk(this);return found;
 }
}
function harness(saved="salbei",pathname="/admin/"){
 const tree=new Element("document"),rootEl=new Element("html");
 rootEl.dataset.darAdminTheme=saved;
 const panel=new Element("main");panel.id="panel";
 const topbar=new Element("header"),toolbar=new Element("div");toolbar.className="toolbar";
 topbar.append(toolbar);tree.append(topbar,panel);
 const login=new Element("section"),loginBtn=new Element("button");
 login.className="login";loginBtn.id="loginBtn";login.append(loginBtn);panel.append(login);
 let mode="login",settingsPanel=null,mutationCallback=null;
 const select={value:"start"};
 const themeMeta=new Element("meta");
 const storage={darAdminAppearanceV2:saved};
 const messages=[];
 const document={
  documentElement:rootEl,readyState:"complete",
  createElement:tag=>new Element(tag),
  querySelector(selector){
   if(selector==="#panel")return panel;
   if(selector==="#topbar .toolbar")return toolbar;
   if(selector==="#panel .login")return mode==="login"?login:null;
   if(selector==="#panel .split>.panel")return mode==="settings"?settingsPanel:null;
   if(selector==="#adminTabSelect")return select;
   if(selector==='meta[name="theme-color"]')return themeMeta;
   return null;
  },
  querySelectorAll:selector=>tree.querySelectorAll(selector),
  dispatchEvent:event=>messages.push(event.type)
 };
 const localStorage={getItem:key=>storage[key]??null,setItem:(key,value)=>{storage[key]=String(value)}};
 class Observer{constructor(cb){mutationCallback=cb}observe(){}}
 class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail}}
 const context={document,location:{pathname},localStorage,MutationObserver:Observer,CustomEvent,queueMicrotask:fn=>fn()};
 vm.runInNewContext(source,context,{filename:"admin/appearance-v2.js",timeout:3000});
 function toSettings(){
  mode="settings";select.value="settings";
  const split=new Element("section");split.className="split";
  settingsPanel=new Element("div");settingsPanel.className="panel";
  const heading=new Element("div");heading.className="section-head";settingsPanel.append(heading);
  split.append(settingsPanel);panel.replaceChildren(split);
  mutationCallback?.();
 }
 function toLogin(){mode="login";select.value="start";panel.replaceChildren(login);mutationCallback?.()}
 return {rootEl,panel,document,storage,messages,themeMeta,toSettings,toLogin,
  switches:()=>tree.querySelectorAll("[data-dar-admin-switch]"),
  choices:()=>tree.querySelectorAll("[data-dar-admin-choice]"),
  settingsCards:()=>tree.querySelectorAll(".dar-admin-appearance-settings")};
}
function testSavedLightAndSwitch(){
 const h=harness("salbei");
 assert.equal(h.rootEl.dataset.darAdminTheme,"salbei");
 assert.equal(h.themeMeta.getAttribute("content"),"#f4f6f0");
 assert.equal(h.switches().length,2,"Header and login switches must be available");
 h.switches()[1].click();
 assert.equal(h.storage.darAdminAppearanceV2,"layl");
 assert.equal(h.rootEl.dataset.darAdminTheme,"layl");
 assert.equal(h.themeMeta.getAttribute("content"),"#0c0e0d");
 h.toSettings();
 assert.equal(h.settingsCards().length,1);
 assert.equal(h.choices().length,2);
 h.toSettings();
 assert.equal(h.settingsCards().length,1,"Rerender must not duplicate settings");
 const light=h.choices().find(c=>c.dataset.darAdminChoice==="salbei");
 light.click();
 assert.equal(h.rootEl.dataset.darAdminTheme,"salbei");
 assert.equal(h.storage.darAdminAppearanceV2,"salbei");
 assert.equal(light.getAttribute("aria-pressed"),"true");
 h.toLogin();
 assert.equal(h.switches().length,2,"Rerender must retain login switch exactly once");
 assert.ok(h.messages.includes("dar-admin-appearance-change"));
}
function testDarkAndIsolation(){
 const dark=harness("layl");
 assert.equal(dark.rootEl.dataset.darAdminTheme,"layl");
 assert.equal(dark.switches().length,2);
 const publicVisit=harness("layl","/");
 assert.equal(publicVisit.switches().length,0,"Theme JS must not affect public visitor surface");
}
function testFiles(){
 assert.match(admin,/darAdminAppearanceV2/,"Persisted choice must be set before first paint");
 assert.ok(admin.indexOf("darAdminAppearanceV2")<admin.indexOf("<style>"));
 for(const name of ["appearance-v2.css","appearance-v2.js","command-center-v2.css","command-center-v2.js"]){
  assert.ok(admin.includes("/admin/"+name),"Admin entrypoint missing "+name);
 }
 for(const theme of ["layl","salbei"]){
  assert.ok(css.includes('html[data-dar-admin-theme="'+theme+'"]'));
  assert.ok(studioCss.includes('html[data-dar-admin-theme="'+theme+'"]'));
 }
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(shell,/max-width:719px/);
 assert.match(shell,/max-width:1199px/);
 assert.ok(studio.includes("/admin/redaktion/appearance.css"));
 assert.ok(studio.includes("darAdminAppearanceV2"));
 const braces=file=>[...file].reduce((acc,c)=>acc+(c==="{"?1:c==="}"?-1:0),0);
 assert.equal(braces(css),0,"Unbalanced appearance CSS blocks");
 assert.equal(braces(shell),0,"Unbalanced V2 CSS blocks");
}
testSavedLightAndSwitch();
testDarkAndIsolation();
testFiles();
console.log("DĀR Admin V2 appearance regression: PASS (persist, login, settings, rerender, separation, theme assets)");
