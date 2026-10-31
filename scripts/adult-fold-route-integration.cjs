#!/usr/bin/env node
"use strict";
/* Adult Cloudflare HTML layout-asset integration, isolated from Kids and
 * sensitive prayer/permission routing. No real credentials or network. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const router = fs.readFileSync(path.resolve(__dirname,"../cloudflare/site-router.js"),"utf8");
const start = router.indexOf("function activateAdultGlobalBrandV2(html) {");
const end = router.indexOf("\nfunction activateAdultCompactHero(",start);
assert.ok(start>=0 && end>start,"Adult Worker HTML adapter exists");
const source=router.slice(start,end);
assert.match(source,/DAR_ADULT_FOLD_CACHE_COHERENCE_V2/);
const context=Object.create(null);
vm.runInNewContext(source+"\nthis.transform=activateAdultGlobalBrandV2",context);
const fixture=`<!doctype html><html><head>
<script src="/assets/adaptive-layout.js?v=stale"></script>
<link rel="stylesheet" href="/assets/fold-split.css?v=2">
<script defer src="/assets/fold-split.js?v=4"></script>
<link rel="stylesheet" href="/assets/dar-visitor-frontstage-v1.css?v=old">
<link rel="stylesheet" href="/assets/dar-adult-brand-header-v2.css?v=old">
<script defer src="/test/assets/kids-no-change.js?v=1"></script>
</head><body><main id="appView"></main></body></html>`;
const output=context.transform(fixture);
for(const file of [
 "adaptive-layout.js","fold-split.js","fold-split.css","dar-visitor-frontstage-v1.css","dar-adult-brand-header-v2.css"
]){
 assert.ok(output.includes("/assets/"+file+"?v=20261031-fold-duo-v2"),
  "Adult "+file+" must get coherent cache revision");
}
assert.match(output,/darAdultGlobalFoldAxisV1/);
assert.match(output,/adult-fold-global-v1\.css\?v=20261031-fold-duo-v2/);
assert.match(output,/\/test\/assets\/kids-no-change\.js\?v=1/);
const second=context.transform(output);
assert.equal(second,output,"Worker injection must be idempotent");
assert.equal((output.match(/id="darAdultGlobalFoldAxisV1"/g)||[]).length,1,
  "Exactly one global Fold CSS authority should be attached");
const workerReferences = router.match(/activateAdultGlobalBrandV2\(html\)/g)||[];
assert.ok(workerReferences.length>=3,"Shared adapter called by Test/visitor HTML routes");
console.log("OK: adult Cloudflare router cache-coherence / visitor+test and idempotent fold asset linkage");
