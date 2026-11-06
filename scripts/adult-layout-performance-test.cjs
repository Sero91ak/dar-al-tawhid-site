/* Lightweight DOM regression for adaptive layout: no unchanged ResizeObserver
 * repaint storm, no redundant geometry reads, force remains possible. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../assets/adaptive-layout.js"),"utf8");
const fold=fs.readFileSync(path.join(__dirname,"../assets/fold-split.js"),"utf8");
assert.match(source,/lastAppliedViewportKey/);
assert.match(source,/pendingForcedLayout/);
assert.match(fold,/Only inspect additions that contain a/);
assert.doesNotMatch(fold,/new MutationObserver\(function \(\) \{ restoreFoldScrollAfterRender\(\); \}\)/);
const handles={};
const raf=[];
let rootWrites=0,navGeometryReads=0,navWrites=0;
const attributes={};
const styleVars={};
const root={
  clientWidth:390,clientHeight:844,
  classList:{contains(){return false},add(){},remove(){},toggle(){}},
  style:{setProperty(name,value){rootWrites++;styleVars[name]=String(value)}},
  getAttribute(name){return attributes[name]||null},
  setAttribute(name,value){attributes[name]=String(value)}
};
const nav={
  classList:{contains(){return false},add(){},remove(){},toggle(){}},
  style:{setProperty(){navWrites++}},
  getBoundingClientRect(){navGeometryReads++;return {width:340}}
};
const doc={
  readyState:"loading",
  documentElement:root,
  body:{classList:{contains(){return false}}},
  getElementById(name){return name==="bottomNav"?nav:null},
  addEventListener(type,fn){handles["doc:"+type]=fn},
  querySelectorAll(){return []}
};
let roController;
class ResizeObserver {
  constructor(cb){this.cb=cb}
  observe(el){if(el===root)roController=this}
}
const win={
  innerWidth:390,innerHeight:844,
  visualViewport:{width:390,height:844,offsetTop:0,
    addEventListener(type,fn){handles["visual:"+type]=fn}},
  localStorage:{getItem(){return "bottom"}},
  requestAnimationFrame(fn){raf.push(fn);return raf.length},
  addEventListener(type,fn){handles["window:"+type]=fn},
  dispatchEvent(){},
  DarFold:{sync(){}}
};
vm.runInNewContext(source,{
  window:win,document:doc,ResizeObserver,
  CustomEvent:class { constructor(type,opts){this.type=type;this.detail=opts.detail}},
  setTimeout(){return 1},clearTimeout(){}
},{filename:"adaptive-layout.js"});
function flushFrames(){
  const callbacks=raf.splice(0);
  for(const fn of callbacks)fn();
}
win.DarAdaptiveLayout.start();
assert.ok(roController,"root ResizeObserver is attached");
const initialWrites=rootWrites;
assert.equal(navGeometryReads,0,"First layout should not force nav geometry");
roController.cb();roController.cb();roController.cb();
flushFrames();
assert.equal(rootWrites,initialWrites,"Identical viewport must not rewrite layout CSS");
assert.equal(navGeometryReads,0,"Identical viewport must not measure navigation layout");
roController.cb();
win.DarAdaptiveLayout.start(); // Already started: force update cannot get lost in pending frame.
flushFrames();
assert.ok(rootWrites>initialWrites,"Forced layout must still run");
const afterForce=rootWrites;
root.clientWidth=932;root.clientHeight=640;win.innerWidth=932;win.innerHeight=640;
roController.cb();
flushFrames();
assert.ok(rootWrites>afterForce,"Viewport orientation change must recompute layout");
assert.ok(navGeometryReads<=1,"Orientation reads nav geometry at most once per update");

/* Real user recording: iOS browser visual viewport changes as the toolbar
 * collapses/reappears during scrolling. The document layout viewport has
 * not rotated or resized; the fixed header/content/tab geometry MUST remain
 * identical, with no root CSS mutation or new layoutchange event. */
win.visualViewport.width=932;
win.visualViewport.height=640;
const afterOrientation=rootWrites;
for(const visualH of [590,525,610,640,490,630]){
  win.visualViewport.height=visualH;
  win.visualViewport.offsetTop=visualH===525?24:0;
  handles["visual:resize"]();
  roController.cb();
  flushFrames();
  assert.equal(rootWrites,afterOrientation,
    "Collapsing Safari toolbar at "+visualH+"px must not mutate page layout");
}
assert.equal(styleVars["--layout-vh"],"640px",
  "Stable document height must own layout-vh despite Safari toolbar changes");
assert.equal(styleVars["--layout-vv-height"],"640px",
  "Visual viewport shrinkage without keyboard must not resize app content");

/* True on-screen keyboard: focused editable element plus >120px visual
 * shrink remains supported; opening and closing restore the correct CSS. */
doc.activeElement={matches(selector){return selector.includes("input")},isContentEditable:false};
win.visualViewport.height=340;
handles["doc:focusin"]();
flushFrames();
assert.equal(styleVars["--layout-vv-height"],"340px",
  "Focused software keyboard may use visual viewport height");
assert.ok(rootWrites>afterOrientation,"Focused keyboard must reflow");
doc.activeElement=null;
handles["doc:focusout"]();
flushFrames();
assert.equal(styleVars["--layout-vv-height"],"640px",
  "Closing keyboard restores stable page height");


// Five-tab navigation V1: prevent route-triggered outer bar geometry writes.
const visitorNavCSS=fs.readFileSync(path.join(__dirname,"../assets/bottom-nav-global-v1075.css"),"utf8");
assert.match(visitorNavCSS,/DAR_NAV_OUTER_STATIC_ICON_ONLY_V1_20261030/);
assert.match(visitorNavCSS,/\.nav-icon img\.dar3d-icon/);
assert.match(visitorNavCSS,/transform:scale\(1\.10\)!important/);
assert.match(source,/DAR_NAV_GEOMETRY_SINGLE_OWNER_V1_20261030/);
assert.doesNotMatch(source,/nav\.style\.setProperty\("(?:left|width|height|transform|transition)"/);
assert.equal(navWrites,0,"Adult route/layout controller never repositions the original bottom bar");
// The TEST lane shares the stable JS controller and owns its own bottom CSS.
const testNavCSS=fs.readFileSync(path.join(__dirname,"../test/assets/bottom-nav-global-v1120.css"),"utf8");
assert.match(testNavCSS,/DAR_TEST_NAV_STATIC_ICON_ONLY_V1_20261030/);
assert.match(testNavCSS,/width:31px!important;height:31px!important/);
assert.match(testNavCSS,/transform:scale\(1\.10\)!important/);
assert.match(testNavCSS,/transition:none!important/);
const boot=fs.readFileSync(path.join(__dirname,"../assets/app-soft-boot.js"),"utf8");
assert.match(boot,/function stopBootObserver\(\)/,"Boot observer must have a cleanup function");
assert.match(boot,/function releaseChrome\(\) \{[\s\S]*?clearRamp\(\);\s*stopBootObserver\(\);/,"Emergency release must cancel interval and observer");
assert.match(boot,/function finish\(\) \{[\s\S]*?clearRamp\(\);\s*stopBootObserver\(\);/,"Normal finish must disconnect observer");
assert.match(boot,/if \(finished \|\| !bootObserver\) return;/,"Late DOMContentLoaded must not reattach a boot observer");
console.log("OK: responsive layout, fold mutation filtering, boot timer/observer lifecycle");
