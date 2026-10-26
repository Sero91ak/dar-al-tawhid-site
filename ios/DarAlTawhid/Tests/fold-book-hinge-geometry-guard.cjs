#!/usr/bin/env node
"use strict";
/* Segment and hinge regression. The browser preview APIs are optional:
   regular iPads must NEVER acquire a fictitious physical crease. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../../..");
const script=fs.readFileSync(path.join(root,"assets/adaptive-layout.js"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/fold-split.css"),"utf8");
const fold=fs.readFileSync(path.join(root,"assets/fold-split.js"),"utf8");
const win={innerWidth:669,innerHeight:867,viewport:{segments:[]},
  navigator:{devicePosture:{type:"continuous"}},
  localStorage:{getItem(){return"bottom"}},
  addEventListener(){},requestAnimationFrame(){return 1;}};
const document={readyState:"loading",documentElement:{clientWidth:669,clientHeight:867,
  classList:{contains(){return false}}},body:{classList:{contains(){return false}}},
  addEventListener(){},getElementById(){return null},querySelectorAll(){return []}};
vm.runInNewContext(script,{window:win,document,
  setTimeout(){return 1},clearTimeout(){},CustomEvent:class{}}, {filename:"adaptive-layout.js"});
const engine=win.DarAdaptiveLayout;
assert.ok(engine&&engine.getFoldGeometry,"Missing fold geometry feature detection");
assert.equal(engine.getFoldGeometry(669,867),null,"Do not invent seam on regular tablet or flat screen");
assert.equal(engine.resolveLayoutMode(669,867),"medium","Unsegmented narrow window stays one pane");
const physical=[
  {x:0,y:0,width:324,height:867},
  {x:345,y:0,width:324,height:867}
];
win.viewport.segments=physical;
const geometry=engine.getFoldGeometry(669,867);
assert.equal(geometry.source,"segments");
assert.equal(geometry.hinge,21,"Actual crease width must be respected");
assert.equal(engine.resolveLayoutMode(669,867),"expanded","Book pose opens left and right screen panes");
assert.ok(engine.getLayoutCapacity(669,867).dual,"Book mode bypasses generic 900px breakpoint");
win.viewport.segments=[
 {x:0,y:0,width:669,height:410},
 {x:0,y:437,width:669,height:430}
];
assert.equal(engine.getFoldGeometry(669,867),null,"Vertical laptop fold must not become left/right split");
win.viewport.segments=[];
win.navigator.devicePosture.type="folded";
assert.equal(engine.getFoldGeometry(669,867).source,"posture",
  "Known book posture uses explicitly approximate seam if segments hidden");
win.navigator.devicePosture.type="continuous";
assert.equal(engine.getFoldGeometry(669,867),null,
  "Closing or laying screen flat must clear the book-mode seam");
assert.equal(engine.resolveLayoutMode(951,620),"expanded","Wide unfolded window uses fluid two-pane fallback");
assert.equal(engine.getFoldGeometry(951,620),null,"Ordinary large display has no artificial hardware gap");
assert.match(css,/DAR_BOOK_HINGE_AWARE_V1/);
assert.match(css,/--dar-fold-left-track/);
assert.match(css,/--dar-fold-right-track/);
assert.match(css,/--dar-fold-seam-gap/);
assert.match(fold,/getFoldGeometry/);
assert.match(fold,/data-fold-book/);
assert.match(fold,/devicePosture\.addEventListener/);
console.log("PASS: real segment gap / optional book posture / no phantom iPad fold / landscape fallback");
