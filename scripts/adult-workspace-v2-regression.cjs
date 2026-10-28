#!/usr/bin/env node
"use strict";
/* Adult visitor adaptive workspace V2: iPad/Fold viewport + navigation regressions */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const adaptive=read("assets/adaptive-layout.js");
const css=read("assets/adaptive-layout.css");
const native=read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const landscape=read("assets/dar-landscape-kids-shell.css");
const split=read("assets/fold-split.css");
assert.match(adaptive,/DAR_ADULT_WORKSPACE_V2_20261028/);
assert.doesNotMatch(adaptive,/DAR_ADULT_FOLD_WIDE_LIVE_V1_20261028/);
assert.match(adaptive,/var EXPANDED_MIN = 760;/);
assert.match(adaptive,/var READER_MIN = 440;/);
assert.match(adaptive,/DarAdultWorkspaceV2\.ownsNavigation\(\)/);
assert.doesNotMatch(native,/root\.setAttribute\("data-layout","compact"\)/);
assert.match(css,/DAR_ADULT_WORKSPACE_V2/);
assert.match(css,/overflow-y:auto!important/);
assert.match(css,/grid-template-columns:minmax\(0,var\(--dar-ws2-rail\)\) minmax\(0,1fr\)/);
assert.match(css,/horizontal-viewport-segments:2/);
assert.doesNotMatch(split,/DAR_ADULT_FOLD_DUAL_LIVE_V1_20261028/);
assert.match(landscape,/html:not\(\[data-dar-workspace="dual"\]\)/);
assert.match(css,/#bottomNav\.dar-ws2-original-tabs/);
const i=adaptive.indexOf("/* DAR_ADULT_WORKSPACE_V2_20261028");
assert(i>0);
const src=adaptive.slice(i);
new vm.Script(src);
function classList(){
 const s=new Set();return {add:v=>s.add(v),remove:v=>s.delete(v),contains:v=>s.has(v),toggle:(v,b)=>b?s.add(v):s.delete(v)};
}
function style(){
 const values=new Map();
 return {getPropertyValue:k=>values.get(k)?.[0]||"",getPropertyPriority:k=>values.get(k)?.[1]||"",
 setProperty:(k,v,p)=>values.set(k,[String(v),p||""]),removeProperty:k=>values.delete(k)};
}
const origin={isConnected:true,appendChild:n=>{n.parentNode=origin},insertBefore:n=>{n.parentNode=origin}};
const el={clientWidth:375,clientHeight:812,dir:"ltr",attrs:{},style:style(),classList:classList(),
 setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]||null},appendChild(n){n.parentNode=this}};
const nav={style:style(),classList:classList(),parentNode:origin,nextSibling:null};
nav.style.setProperty("left","50%","important");
const body={classList:classList()};
const doc={documentElement:el,body,activeElement:null,readyState:"loading",
 addEventListener:()=>{},getElementById:k=>k==="bottomNav"?nav:null};
let originalNavSync=0;
const win={document:doc,location:{pathname:"/index.html"},innerWidth:375,innerHeight:812,
 requestAnimationFrame:()=>1,addEventListener:()=>{},visualViewport:{height:812,addEventListener:()=>{}},
 DarFold:{sync:()=>{}},
 DarAdaptiveLayout:{getLayoutCapacity:(w,h)=>{
   const reserve=w>=980&&h>=560?106:0;
   const gutter=Math.max(24,Math.min(40,w*.035));
   const rail=Math.min(360,Math.max(240,(w-reserve-gutter)*.31));
   const reader=w-reserve-gutter-rail-18;
   return {dual:w>=760&&h>=540&&reader>=440,rail,reader};
 },syncNav:()=>{originalNavSync++}}};
vm.runInNewContext(src,{window:win,document:doc,console});
function inspect(w,h,mode,side,rtl=false){
 el.clientWidth=win.innerWidth=w;el.clientHeight=win.innerHeight=h;
 win.visualViewport.height=h;el.dir=rtl?"rtl":"ltr";
 win.DarAdultWorkspaceV2.sync();
 assert.equal(el.attrs["data-dar-workspace"],mode,w+"x"+h+" mode");
 assert.equal(win.DarAdultWorkspaceV2.ownsNavigation(),side,w+"x"+h+" tab ownership");
 assert.equal(nav.parentNode,side?el:origin,w+"x"+h+" original tab parent");
 if(side)assert.equal(nav.style.getPropertyValue("right"),rtl?
 "max(10px,env(safe-area-inset-right,0px))":"auto","RTL leading edge");
}
inspect(375,812,"single",false);
inspect(640,900,"single",false);
inspect(760,900,"dual",false);
inspect(834,1112,"dual",false);
inspect(900,650,"dual",false);
inspect(980,640,"wide",true);
inspect(1024,768,"wide",true);
inspect(1194,834,"wide",true);
inspect(1024,768,"wide",true,true);
inspect(1024,768,"wide",true,false);
inspect(980,520,"single",false);
inspect(375,812,"single",false);
assert.equal(nav.style.getPropertyValue("left"),"50%","restore original nav style");
assert(originalNavSync>=1,"restore original compact nav controller");
doc.activeElement={tagName:"INPUT",isContentEditable:false};
el.clientWidth=win.innerWidth=1024;el.clientHeight=win.innerHeight=768;
win.visualViewport.height=400;
win.DarAdultWorkspaceV2.sync();
assert.equal(el.attrs["data-dar-workspace"],"single","keyboard fallback");
assert.equal(nav.parentNode,origin,"keyboard restores original nav");
console.log("DAR WORKSPACE V2: 12 windows/orientations, RTL, keyboard, original tab identity PASS");
