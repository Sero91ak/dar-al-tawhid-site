#!/usr/bin/env node
"use strict";
/* DĀR TEST dual workspace: keep five existing bottom tabs, independent
   selection/reading surfaces and strictly zero changes to visitor/KIDS. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("test/assets/dar-duo-responsive-v1.js");
const css=read("test/assets/dar-duo-responsive-v1.css");
const worker=read("cloudflare/test-app-worker.js");
const html=read("test/index.html");
const liveJS=read("assets/adaptive-layout.js");
const liveCSS=read("assets/adaptive-layout.css");
const thumb=read("test/assets/fold-thumb-nav.js");

new vm.Script(js,{filename:"test/assets/dar-duo-responsive-v1.js"});
new vm.Script(liveJS);
assert.match(js,/__DAR_TEST_DUO_WORKSPACE_V4/);
assert.match(js,/testOnly:true/);
assert.match(js,/location\.hash/);
assert.match(js,/make\("nav","dar-test-duo-workspace-nav"\)/);
assert.match(js,/darAdultPreferredLocaleV1/);
assert.match(js,/is-feed-fullscreen/);
assert.match(js,/is-ilm-chat-route/);
assert.doesNotMatch(js,/(?:createElement\(["\x27]iframe|location\.replace|innerHTML\s*=)/i,
  "Do not load a second app or replace SPA content");
assert.match(css,/\.dar-test-duo-active/);
assert.match(css,/#darTestDuoWorkspaceNav/);
assert.match(css,/position:fixed!important/);
assert.match(css,/overflow-y:auto!important/);
assert.match(css,/body[^\n]*#appView/);
assert.doesNotMatch(css,/#bottomNav\.bottom-nav\s*\{/,
  "Do not replace or reposition existing five-tab glass nav");
assert.match(worker,/DAR_TEST_DUO_WORKSPACE_V2_20261101/);
assert.match(worker,/20261101-true-half-half-v4/);
assert.match(worker,/finalizeDarTestHomeV1193/);
assert.match(html,/id="bottomNav"/);
assert.match(html,/darTestDuoResponsiveCSSV1/);
assert.match(html,/darTestDuoResponsiveJSV1/);
assert.match(thumb,/return "bottom";/);
assert.doesNotMatch(liveJS,/DAR_ADULT_FOLD_WIDE_LIVE_V1_20261028/);
assert.doesNotMatch(liveCSS,/DAR_ADULT_FOLD_SIDE_LIVE_V1_20261028/);

function getApi(pathname){
  const listeners={};
  const document={
    readyState:"loading",
    documentElement:{clientWidth:1024,clientHeight:768,classList:{contains:()=>false}},
    addEventListener:(k,fn)=>{listeners[k]=fn}
  };
  const window={document,location:{pathname,hash:"#home",search:""},innerWidth:1024,innerHeight:768};
  vm.runInNewContext(js,{window,document,console});
  return window.DARTestDuoAdaptive;
}
assert.equal(getApi("/"),undefined,"Never run on live visitor path");
assert.equal(getApi("/kids/"),undefined,"Never run on KIDS");
const api=getApi("/test/");
assert.ok(api,"Test API must exist");
const cases=[
  [390,844,false],[512,870,false],  // Fold closed / phone
  [844,390,false],                   // Short mobile landscape
  [726,512,true],                    // Actual Galaxy Fold screen recording
  [680,850,true],                    // Fold open portrait
  [820,1180,true],                   // Tablet portrait
  [1024,768,true],                   // Tablet landscape
  [1194,834,true],                   // Wide window
  [600,900,false],                   // Narrow split-view
  [900,500,true]                     // Actual workspace if short edge >=480
];
for(const [w,h,expected] of cases){
  const c=api.capacity(w,h);
  assert.equal(c.dual,expected,w+"x"+h+" incorrect");
  if(c.dual){
    assert.equal(c.rail,w/2,w+"x"+h+" selection not exactly half");
    assert.equal(c.reader,w/2,w+"x"+h+" reader not exactly half");
    assert.ok(c.reader>=320,w+"x"+h+" reader too narrow");
  }
}
for(const locale of ["de","ar","en","tr","ku","ckb","bs","fr","es"]){
  assert.match(js,new RegExp("^\\s*"+locale+":\\s*\\{","m"),"missing "+locale);
}
console.log("PASS: DĀR Test-only adaptive dual workspace; viewport tests, locale coverage, original navigation preserved.");
