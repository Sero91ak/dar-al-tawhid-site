#!/usr/bin/env node
"use strict";
/* DAR Test Fold V2 architecture guard. Never validates the live visitor App. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("test/assets/dar-fold-workspace-v2.js");
const css=read("test/assets/dar-fold-workspace-v2.css");
const worker=read("cloudflare/test-app-worker.js");
new vm.Script(js,{filename:"dar-fold-workspace-v2.js"});
assert.match(js,/darFoldPane/);
assert.match(js,/dar-fold-v2-route/);
assert.match(js,/scrollByCategory/);
assert.match(js,/Bereich wechseln/);
assert.match(js,/optionCache/);
assert.match(js,/aria-expanded/);
assert.match(css,/dar-fold-v2-menu-row/);
assert.match(css,/dar-fold-v2-context/);
assert.match(css,/dar-fold-v2-options/);
assert.match(js,/darFoldV2/);
assert.match(css,/\.dar-fold-v2-active/);
assert.match(css,/\.dar-fold-v2-reader/);
assert.match(css,/overflow-y:auto!important/);
assert.match(css,/width:calc\(100% - var\(--dar-fold-v2-rail\)\)/);
assert.match(worker,/DAR_TEST_FOLD_WORKSPACE_V2_20261101/);
assert.match(worker,/dar-fold-workspace-v2\.js\?v=20261101-vision-rail-v3/);
assert.match(worker,/dar-fold-workspace-v2\.css\?v=20261101-vision-rail-v3/);
assert.doesNotMatch(worker,/\/\/ DAR_ADAPTIVE_FOLD_V1326/);
assert.doesNotMatch(worker,/const adaptiveFoldScripts/);
assert.doesNotMatch(worker,/const foldLink = '<link rel="stylesheet" id="darAdultGlobalFoldAxisV1"/);
const attrs={};
const rootNode={clientWidth:726,clientHeight:512,classList:{add(){},remove(){}},style:{setProperty(){}}};
const doc={documentElement:rootNode,readyState:"loading",addEventListener(){}};
const win={document:doc,location:{search:"",pathname:"/test/",hash:"#quran"},innerWidth:726,innerHeight:512,URLSearchParams};
vm.runInNewContext(js,{window:win,document:doc,URLSearchParams});
const capacity=win.DARTestFoldV2.capacity;
for(const [w,h,expected] of [
  [320,700,false],[390,844,false],[600,960,false],[640,480,true],
  [726,512,true],[800,700,true],[900,550,true],[915,412,false],
  [1024,768,true],[1280,850,true]]) {
  const c=capacity(w,h);
  assert.equal(c.dual,expected,w+"x"+h+" dual mode mismatch");
  assert.ok(c.rail>=184&&c.rail<=288,"rail bounds");
  assert.equal(c.rail+c.pane,w,"no lost reader pixels");
  if(c.dual)assert.ok(c.pane>c.rail,"reader must be dominant");
}
console.log("PASS DAR Test Fold V2: syntax, sole authority, responsive capacity, isolated reader, route/scroll contract");
