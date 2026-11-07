#!/usr/bin/env node
"use strict";
/*
 * DAR TEST only — Edge-to-edge / Safe-Area diagnostic contract.
 * Read-only: the protected iOS WebView, prayer, GPS, push and live app are not modified.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const native=read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const testHeader=read("test/assets/dar-test-premium-header-v2.js");
const testCSS=read("test/assets/dar-test-premium-header-v2.css");
const liveHeader=read("assets/dar-adult-brand-header-v2.js");
new vm.Script(testHeader,{filename:"dar-test-premium-header-v2.js"});
new vm.Script(liveHeader,{filename:"dar-adult-brand-header-v2.js"});
assert.match(testHeader,/DARTestEdgeAuditV1/,"DAR TEST needs an inspectable geometry report");
assert.match(testHeader,/safe-area-inset-top/,"CSS Safe Area needs to be measured, not guessed");
assert.match(testHeader,/dar-native-safe-top/,"Native Safe Area needs to be measured separately");
assert.match(testHeader,/darTestBrandHeaderSpacerV1/,"Exactly the mounted TEST brand spacer is inspected");
assert.match(testHeader,/visualViewport/,"Read the visible viewport after rotation");
assert.match(testCSS,/TEST_DUO_FOLD_COMPACT_RAIL_V1/,"Original 3D-header and fold layout preserved");
assert.match(native,/resolvedSafeAreaInsets\(for: webView\)/,"Do not remove native safe-area resolver");
assert.match(native,/viewportInsets = resolvedInsets/,"Native inset source preserved");
assert.match(liveHeader,/darAdultBrandHeaderSpacerV2/,"Live fixed-header spacer preserved");
assert.doesNotMatch(testHeader,/MutationObserver\(.*DARTestEdgeAuditV1/,"No diagnostic mutation loop");
const topFloor=/let\s+topInset\s*=\s*max\(resolvedInsets\.top\s*,\s*59\s*\)/.test(native);
if(topFloor){
 console.warn("DIAGNOSTIC ONLY: Native iOS bridge currently forces >=59pt top inset, even in landscape. Protected Swift must be reviewed before changing.");
}
if(process.env.DAR_EDGE_REQUIRE_NATIVE_FIX==="1"){
 assert.equal(topFloor,false,"Native 59pt minimum must be removed by explicitly authorized Swift change");
}
console.log("PASS DAR TEST Edge geometry audit: read-only diagnostics, platform contract and protected source retained");
