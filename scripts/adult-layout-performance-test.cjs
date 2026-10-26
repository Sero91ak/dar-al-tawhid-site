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
const root={
  clientWidth:390,clientHeight:844,
  classList:{contains(){return false},add(){},remove(){},toggle(){}},
  style:{setProperty(){rootWrites++}},
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
const boot=fs.readFileSync(path.join(__dirname,"../assets/app-soft-boot.js"),"utf8");
assert.match(boot,/function stopBootObserver\(\)/,"Boot observer must have a cleanup function");
assert.match(boot,/function releaseChrome\(\) \{[\s\S]*?clearRamp\(\);\s*stopBootObserver\(\);/,"Emergency release must cancel interval and observer");
assert.match(boot,/function finish\(\) \{[\s\S]*?clearRamp\(\);\s*stopBootObserver\(\);/,"Normal finish must disconnect observer");
assert.match(boot,/if \(finished \|\| !bootObserver\) return;/,"Late DOMContentLoaded must not reattach a boot observer");
console.log("OK: responsive layout, fold mutation filtering, boot timer/observer lifecycle");

// All adult visitor surfaces share this viewport contract. Run both guards
// in the existing PR check so a Fold/iPad route regression fails CI.
require("../ios/DarAlTawhid/Tests/native-ios-adaptive-layout-guard.cjs");
require("../ios/DarAlTawhid/Tests/adult-all-routes-geometry-guard.cjs");
require("../ios/DarAlTawhid/Tests/fold-hinge-geometry-guard.cjs");
