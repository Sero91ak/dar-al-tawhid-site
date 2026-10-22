#!/usr/bin/env node
"use strict";
/* Offline regression: web UI language selections notify native WKWebView,
 * but native-origin sync does not bounce back. No paid providers or network. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const KEY="darAdultPreferredLocaleV1";
function makeRuntime(pathname="/test/",withBridge=true){
 const listeners=new Map(),storage=new Map(),posted=[];
 const document={readyState:"loading",addEventListener(){},body:null};
 const window={location:{pathname},document,
  localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)}},
  addEventListener(name,fn){const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a)}
 };
 if(withBridge)window.webkit={messageHandlers:{darLanguageChanged:{
  postMessage(data){posted.push(data)}
 }}};
 vm.runInNewContext(src,{window,Promise,Intl});
 return {window,posted,storage,dispatch(locale,source){
  storage.set(KEY,locale);
  for(const fn of listeners.get("dar-adult-locale-changed")||[])fn({detail:{locale,source}});
 }};
}
const x=makeRuntime();
assert(x.window.DarTestTurkishUI,"DAR TEST runtime missing");
for(const locale of ["tr","en","ar","ckb","bs","fr","es","ku","de"]){
 x.dispatch(locale);
 assert.equal(x.posted.at(-1).locale,locale,"Native bridge lost "+locale);
 assert.equal(x.window.DarTestTurkishUI.locale(),locale);
}
let before=x.posted.length;
x.dispatch("ar","native");
assert.equal(x.posted.length,before,"Native echo loop");
x.dispatch("xx");
assert.equal(x.posted.length,before,"Unknown language sent to native");
x.storage.set(KEY,"de");
x.dispatch("tr","native");
assert.equal(x.posted.length,before,"Native update caused second echo");
const browser=makeRuntime("/test/",false);
browser.dispatch("fr");
assert.equal(browser.window.DarTestTurkishUI.locale(),"fr");
assert.equal(browser.posted.length,0);
assert.equal(makeRuntime("/test/kids/").window.DarTestTurkishUI,undefined);
assert.equal(makeRuntime("/").window.DarTestTurkishUI,undefined);
console.log("PASS: web-to-native nine-language bridge, stored preference, native echo suppression, offline/browser and Kids/visitor isolation");
