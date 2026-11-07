#!/usr/bin/env node
"use strict";
/* DĀR Test Fold V2 archive regression, retired by user on 06.11.2026.
 * The prior two-pane/side-rail layout must NOT be injected into /test/.
 * Keep the historical files for rollback, not active execution. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const worker=fs.readFileSync(path.resolve(__dirname,"../../cloudflare/test-app-worker.js"),"utf8");
assert.match(worker,/DAR_TEST_FOLD_V2_RETIRED_20261106/);
assert.doesNotMatch(worker,/const foldJsV2\s*=/);
assert.doesNotMatch(worker,/const foldCssV2\s*=/);
assert.doesNotMatch(worker,/const foldBootstrap\s*=/);

require("./dar-test-immersive-art-v1-guard.cjs");
console.log("PASS DĀR Test: experimental Fold V2 retired; original adaptive nav remains");
