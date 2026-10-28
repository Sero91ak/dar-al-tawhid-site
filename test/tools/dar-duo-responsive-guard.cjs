#!/usr/bin/env node
/* DAR TEST iPhone Duo adaptive layout: static + simulated resize regressions.
   Node-only, no external services or network. */
"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert/strict");
const path=require("path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/index.html");
const css=read("test/assets/dar-duo-responsive-v1.css");
const js=read("test/assets/dar-duo-responsive-v1.js");
new vm.Script(js,{filename:"dar-duo-responsive-v1.js"});
assert(html.includes("viewport-fit=cover"),"Keep viewport-fit=cover");
assert(html.includes("darTestDuoResponsiveCSSV1"),"Duo stylesheet must load");
assert(html.includes("darTestDuoResponsiveJSV1"),"Duo logic must load");
assert(html.includes("DARTestDuoAdaptive?.syncNavigation?.(nav)"),"Nav restore hook");
assert(html.includes('id="bottomNav"'),"Keep existing original 3D navigation");
assert(css.includes('minmax(min(100%,var(--duo-card-min)),1fr)'),"No ultra-narrow card columns");
assert(css.includes('DAR_TEST_FOLD_WORKSPACE_V2_20261028'),"Require test-only master/detail authority");
assert(css.includes('data-dar-duo-layout="dual"'),"Dual view grid must be scoped");
assert(css.includes('overflow-y:auto!important'),"Separate pane scrolling required");
assert(css.includes('horizontal-viewport-segments:2'),"Optional hinge-aware fallback required");
assert(css.includes('max(12px,env(safe-area-inset-left,0px))'),"Safe area left");
assert(css.includes('env(safe-area-inset-right,0px)'),"Safe area right");
assert(css.includes('env(safe-area-inset-bottom,0px)'),"Safe area bottom");
assert(!/new\s+MutationObserver\s*\(/.test(js),"No mutation observer/polling loops for layout");
assert(!js.includes("navigator.userAgent"),"Do not size by user agent");
function classes(){const s=new Set();return{contains:v=>s.has(v),add:v=>s.add(v),remove:v=>s.delete(v)}}
function styles(){const d=new Map();return{
  setProperty:(a,b,p)=>d.set(a,[b,p]),
  getPropertyValue:a=>d.get(a)?.[0]||"",
  getPropertyPriority:a=>d.get(a)?.[1]||"",
  removeProperty:a=>d.delete(a)
}}
const el={clientWidth:0,clientHeight:0,attrs:{},setAttribute(k,v){this.attrs[k]=v},style:styles(),classList:classes()};
const nav={style:styles()};
const body={classList:classes()};
const doc={documentElement:el,body,getElementById:(x)=>x==="bottomNav"?nav:null,addEventListener:()=>{},querySelectorAll:()=>[]};
const win={innerWidth:0,innerHeight:0,requestAnimationFrame:()=>1,addEventListener:()=>{},visualViewport:{height:0,addEventListener:()=>{}}};
vm.runInNewContext(js,{window:win,document:doc,console});
const snapshots=[
 [466,678,"portrait",false],
 [626,890,"portrait",false],
 [678,466,"landscape",false],
 [839,626,"landscape",false],
 [840,626,"landscape",true],
 [890,626,"landscape",true],
 [1060,720,"landscape",true],
 [1060,420,"landscape",false],
 [375,812,"portrait",false]
];
for(const [w,h,axis,dual] of snapshots){
 win.innerWidth=el.clientWidth=w;win.innerHeight=el.clientHeight=h;
 win.visualViewport.height=h;
 win.DARTestDuoAdaptive.apply();
 assert.equal(el.attrs["data-dar-duo-axis"],axis,w+"x"+h+" orientation");
 assert.equal(el.attrs["data-dar-duo-layout"],dual?"dual":"single",w+"x"+h+" layout");
 assert.equal(body.classList.contains("dar-duo-side-active"),false,"DUO must never independently claim tab geometry");
}
// Keyboard/resize must disable side nav without stale layout.
win.innerWidth=el.clientWidth=890;win.innerHeight=el.clientHeight=626;
win.visualViewport.height=320;win.DARTestDuoAdaptive.apply();
assert.equal(el.attrs["data-dar-duo-layout"],"single","keyboard must collapse independent panes");
assert(!body.classList.contains("dar-duo-side-active"),"keyboard must not claim navigation");
const navJS=read("test/assets/fold-thumb-nav.js");
new vm.Script(navJS,{filename:"fold-thumb-nav.js"});
assert(navJS.includes("var SIDE_MIN_WIDTH = 1060"),"Automatic side primary nav only for sufficiently wide screens");
assert(navJS.includes("var SIDE_MIN_HEIGHT = 560"),"Short landscape must keep bottom primary tabs");
assert(js.includes("global.DarAdaptiveNavPlacement"),"One navigation geometry owner");
assert(!js.includes('style(nav,"position","fixed")'),"DUO duplicate inline nav writer removed");
// Real #bottomNav node must be portalled to the viewport at wide size and
// restored to the original parent when folding back. Never duplicate tabs.
const origin={isConnected:true,appendChild(n){n.parentNode=this},insertBefore(n){n.parentNode=this}};
const hostRoot={
 clientWidth:1060,clientHeight:720,attrs:{},classList:classes(),style:styles(),
 setAttribute(k,v){this.attrs[k]=v},appendChild(n){n.parentNode=this}
};
const genuineNav={parentNode:origin,nextSibling:null,classList:classes(),style:styles()};
const navDoc={
 documentElement:hostRoot,body:{classList:classes()},readyState:"loading",activeElement:null,
 addEventListener:()=>{},querySelector:()=>null,
 getElementById:id=>id==="bottomNav"?genuineNav:null
};
const navWin={
 location:{pathname:"/test/"},innerWidth:1060,innerHeight:720,
 visualViewport:{height:720,addEventListener:()=>{}},
 requestAnimationFrame:()=>1,addEventListener:()=>{},
 setTimeout:()=>1,clearTimeout:()=>{}
};
vm.runInNewContext(navJS,{window:navWin,document:navDoc,console});
assert.equal(navWin.DarAdaptiveNavPlacement.getPreference(),"left");
assert.equal(navWin.DarAdaptiveNavPlacement.apply(),true);
assert.equal(genuineNav.parentNode,hostRoot,"wide nav must be portal-fixed to viewport");
assert.equal(hostRoot.attrs["data-dar-nav-position"],"left","wide icon rail");
hostRoot.clientWidth=navWin.innerWidth=890;
hostRoot.clientHeight=navWin.innerHeight=626;
navWin.visualViewport.height=626;
assert.equal(navWin.DarAdaptiveNavPlacement.apply(),true);
assert.equal(genuineNav.parentNode,origin,"close fold must restore same nav DOM node");
assert.equal(hostRoot.attrs["data-dar-nav-position"],"bottom","medium bottom tabs");
assert(css.includes("display:block!important; /* Override legacy"),"Medium dual must reveal both independent panes");
console.log("DAR TEST Fold adaptive regression: 9 viewports + keyboard + nav dock roundtrip PASS");
