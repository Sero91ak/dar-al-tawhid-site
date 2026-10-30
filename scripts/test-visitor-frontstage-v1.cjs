#!/usr/bin/env node
/* Adult visitor closed-fold/front-display parity regression.
 * Static + VM browser-coordinate tests; no user accounts or data mutation.
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const code=read("assets/dar-visitor-frontstage-v1.js");
const css=read("assets/dar-visitor-frontstage-v1.css");
const router=read("cloudflare/site-router.js");
new vm.Script(code,{filename:"dar-visitor-frontstage-v1.js"});
assert.match(router,/function activateAdultCompactHero\(html\)/);
assert.match(router,/darVisitorFrontstageCssV1/,"Visitor frontstage stylesheet must be injected");
assert.match(router,/darVisitorFrontstageJsV1/,"Visitor frontstage classifier must be injected");
assert.match(router,/assets\/dar-visitor-frontstage-v1\.css\?v=/);
assert.match(router,/assets\/dar-visitor-frontstage-v1\.js\?v=/);
assert.match(css,/\.dhp-content/,"Real visitor home content wrapper must be full width");
assert.match(css,/\.datp-grid/,"Prayer time columns must survive narrow screens");
assert.match(css,/\.datp-number/,"Both time labels must remain legible");
assert.match(css,/\.datp-foot/,"Calendar & local clock must reflow");
assert.match(css,/#bottomNav/,"Native five-tab capsule stays within viewport");
assert.match(css,/\.dar-fold/,"Unfolded fallback must avoid narrow dual panes");
assert.doesNotMatch(code,/(?:localStorage|sessionStorage)\.(?:clear|removeItem)|caches\.delete|location\.reload/);
assert.doesNotMatch(css,/display\s*:\s*none\s*!important[^}]*\.dat-smart-prayer/);
function make(width,height,stage,pathName="/"){
 const attr={};let applied=0;const listeners={};
 const rootEl={
  clientWidth:width,
  getAttribute:(k)=>attr[k]??null,
  setAttribute:(k,v)=>{attr[k]=String(v);applied++},
  classList:{contains(){return false}}
 };
 let stageWidth=stage;
 const app={getBoundingClientRect:()=>({width:stageWidth})};
 const document={
  readyState:"complete",
  documentElement:rootEl,
  querySelector:(q)=>q==="body > .app"?app:null,
  addEventListener(){}
 };
 const window={
  location:{pathname:pathName},
  innerWidth:width,innerHeight:height,
  requestAnimationFrame:fn=>{fn();return 1},
  addEventListener:(n,fn)=>{listeners[n]=fn},
  visualViewport:{width,height,scale:1,addEventListener(){}},
  ResizeObserver:class{observe(){}}
 };
 const sandbox={window,document,ResizeObserver:window.ResizeObserver,console};
 vm.runInNewContext(code,sandbox);
 return {window,rootEl,attr,listeners,app,setWidth:(w)=>{rootEl.clientWidth=w;window.innerWidth=w;window.visualViewport.width=w;stageWidth=w},getApplies:()=>applied}
}
let small=make(352,812,352);
assert.equal(small.attr["data-dar-visitor-frontstage"],"1","closed fold/phone must be narrow");
small.window.DAR_VISITOR_FRONTSTAGE_V1.refresh();
assert.equal(small.attr["data-dar-visitor-frontstage"],"1");
small.setWidth(1080);small.window.DAR_VISITOR_FRONTSTAGE_V1.refresh();
assert.equal(small.attr["data-dar-visitor-frontstage"],"0","unfold should restore wide layout");
let medium=make(580,730,580,"/pwa/");
assert.equal(medium.attr["data-dar-visitor-frontstage"],"1","Android PWA portrait narrow");
let tablet=make(834,1112,834);
assert.equal(tablet.attr["data-dar-visitor-frontstage"],"0","iPad should not be forced narrow");
let inset=make(980,860,645);
assert.equal(inset.attr["data-dar-visitor-frontstage"],"1","narrow real app stage should be repaired");
// A CSS correction changing .app stage width alone must not oscillate.
inset.app.getBoundingClientRect=()=>({width:980});
inset.window.DAR_VISITOR_FRONTSTAGE_V1.refresh();
assert.equal(inset.attr["data-dar-visitor-frontstage"],"1","do not oscillate due to own CSS");
inset.setWidth(1100);inset.window.DAR_VISITOR_FRONTSTAGE_V1.refresh();
assert.equal(inset.attr["data-dar-visitor-frontstage"],"0","real viewport resize should recover");
let kids=make(352,812,352,"/kids/");
assert.equal(kids.window.DAR_VISITOR_FRONTSTAGE_V1,undefined,"Kids must be isolated");
let test=make(352,812,352,"/test/");
assert.equal(test.window.DAR_VISITOR_FRONTSTAGE_V1,undefined,"DĀR TEST must be isolated");
console.log("PASS visitor frontstage widths: closed fold, Android PWA, iPad, inset stage, resize, Kids isolation");
