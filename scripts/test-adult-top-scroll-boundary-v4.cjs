#!/usr/bin/env node
"use strict";
/* Deterministic event-level V4 test; avoids guessing from screenshot layout.
   This cannot replace physical Safari/WKWebView bounce acceptance tests. */
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const visitor=fs.readFileSync("assets/dar-adult-top-scroll-boundary-v1.js","utf8");
const test=fs.readFileSync("test/assets/dar-adult-top-scroll-boundary-v1.js","utf8");
assert.equal(visitor,test,"Test and visitor must share byte-identical touch clamp");
function simulate(code,route="/"){
 const handlers={};
 const html={nodeType:1,scrollTop:0,scrollHeight:1800,clientHeight:600,overflowY:"visible"};
 const body={nodeType:1,scrollTop:0,scrollHeight:1800,clientHeight:600,overflowY:"visible",parentElement:html};
 const doc={
   documentElement:html,body,scrollingElement:html,
   getElementById(id){return id==="appView"?{}:null},
   addEventListener(type,fn){handlers[type]=fn}
 };
 const win={innerHeight:600,scrollY:0,getComputedStyle:el=>({overflowY:el.overflowY||"visible"})};
 const target=(parent=body,gesture=false)=>({
   nodeType:1,parentElement:parent,
   closest(selector){return gesture&&selector.includes("leaflet-container")?{}:null}
 });
 const ctx={window:win,document:doc,location:{pathname:route},console};
 vm.runInNewContext(code,ctx,{timeout:1000});
 function event(type,x,y,origin=target(),opts={}){
  const e={target:origin,touches:opts.multitouch?[{clientX:x,clientY:y},{clientX:x,clientY:y}]:[{clientX:x,clientY:y}],
   cancelable:opts.cancelable!==false,defaultPrevented:false,
   preventDefault(){this.defaultPrevented=true}
  };
  if(handlers[type])handlers[type](e);
  return e.defaultPrevented;
 }
 return {handlers,html,body,win,target,event};
}
const kit=simulate(visitor);
assert.ok(kit.handlers.touchstart&&kit.handlers.touchmove,"Touch capture must be installed");
function gesture({scrollY=0,x=100,y=100,dx=0,dy=0,parent,gesture=false,cancelable=true}){
 const t=kit.target(parent||kit.body,gesture);
 kit.win.scrollY=scrollY;
 kit.html.scrollTop=scrollY;
 kit.event("touchstart",x,y,t);
 const canceled=kit.event("touchmove",x+dx,y+dy,t,{cancelable});
 kit.event("touchend",x+dx,y+dy,t);
 return canceled;
}
assert.equal(gesture({dy:.5}),true,"First subpixel downward tug MUST NOT expose blank Hero gap");
assert.equal(gesture({dy:12}),true,"At top, finger-down bounce must be blocked");
assert.equal(gesture({dy:-28}),false,"At top, finger-up should scroll normally into page");
assert.equal(gesture({scrollY:120,dy:15}),false,"Returning toward top must remain scrollable");
assert.equal(gesture({scrollY:1200,dy:-10}),true,"At bottom, another upward tug must not rubber-band");
assert.equal(gesture({dx:32,dy:1}),false,"Horizontal navigation / gesture must remain available");
assert.equal(gesture({dy:12,gesture:true}),false,"Map/gesture region must be excluded");
const pane={nodeType:1,overflowY:"auto",scrollTop:40,scrollHeight:900,clientHeight:200,parentElement:kit.body};
assert.equal(gesture({dy:12,parent:pane}),false,"Scrollable reader must retain inward movement");
pane.scrollTop=0;
assert.equal(gesture({dy:12,parent:pane}),true,"Nested pane at top must not pass bounce to page");
assert.equal(gesture({dy:10,cancelable:false}),false,"Never call preventDefault on noncancelable event");
assert.equal(Object.keys(simulate(visitor,"/test/kids/").handlers).length,0,"Kids must be untouched");
assert.equal(Object.keys(simulate(visitor,"/kids/").handlers).length,0,"Kids must be untouched");
for(const source of [visitor,test]){
 assert.match(source,/DAR_ADULT_TOP_SCROLL_BOUNDARY_V4/);
 assert.doesNotMatch(source,/(?:\.style\.height\s*=|\.style\.minHeight\s*=|\.style\.backgroundImage\s*=|appendChild\(|insertBefore\(|scrollTo\()/,
  "Edge clamp must not change hero image geometry or DOM layout");
}
console.log("PASS: V4 first touch blocks top/bottom rubber-band and preserves scroll, side swipes, readers, Kids isolation.");
