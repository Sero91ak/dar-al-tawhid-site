#!/usr/bin/env node
"use strict";
/* DĀR TEST temporary Fold/Duo experiment retired on owner's request.
   Guard ensures the old normal tablet CSS and five original 3D tabs remain. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("test/assets/dar-duo-responsive-v1.js");
const css=read("test/assets/dar-duo-responsive-v1.css");
const thumb=read("test/assets/fold-thumb-nav.js");
const liveJS=read("assets/adaptive-layout.js");
const liveCSS=read("assets/adaptive-layout.css");
const splitCSS=read("assets/fold-split.css");
const html=read("test/index.html");
new vm.Script(js);
new vm.Script(thumb);
new vm.Script(liveJS);
assert.match(js,/retired:true/);
assert.match(js,/syncNavigation:function\(\)\{return false;\}/);
assert.doesNotMatch(css,/(?:@media|grid-template-columns|position:fixed!important|data-dar-duo-axis)/);
assert.doesNotMatch(liveJS,/DAR_ADULT_FOLD_WIDE_LIVE_V1_20261028/);
assert.doesNotMatch(liveJS,/DAR_ADULT_WORKSPACE_V2_20261028/);
assert.doesNotMatch(liveCSS,/DAR_ADULT_FOLD_SIDE_LIVE_V1_20261028/);
assert.doesNotMatch(splitCSS,/DAR_ADULT_FOLD_DUAL_LIVE_V1_20261028/);
assert.match(thumb,/return "bottom";/);
assert.match(html,/id="bottomNav"/);
assert.match(html,/darTestDuoResponsiveCSSV1/);
assert.match(html,/darTestDuoResponsiveJSV1/);
const attrs={
 "data-dar-duo-axis":"landscape",
 "data-dar-duo-size":"wide",
 "data-dar-duo-layout":"dual"
};
const classSet=new Set(["dar-duo-side-active"]);
const rootEl={
 clientWidth:1024,clientHeight:768,
 removeAttribute(name){delete attrs[name]},
 style:{removeProperty(name){}}
};
const doc={
 documentElement:rootEl,
 readyState:"loading",
 body:{classList:{remove(name){classSet.delete(name)}}},
 addEventListener(){}
};
const win={document:doc,innerWidth:1024,innerHeight:768};
vm.runInNewContext(js,{window:win,document:doc});
assert.equal(win.DARTestDuoAdaptive.retired,true);
assert.equal(win.DARTestDuoAdaptive.syncNavigation(),false);
win.DARTestDuoAdaptive.apply();
assert.deepEqual(attrs,{},"Disable all temporary fold root override attributes");
assert.equal(classSet.size,0,"Disable old left-side experimental dock");
assert.equal(win.DARTestDuoAdaptive.audit().foldOverridesActive,false);
console.log("DĀR TEST: Fold experiment disabled, normal tablet navigation retained PASS");

// Run the new isolated V2 contract from the existing, protected CI entrypoint.
require("./dar-fold-workspace-v2-guard.cjs");
