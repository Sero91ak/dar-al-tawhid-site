#!/usr/bin/env node
"use strict";
/* The Lernen tab opens the academy in a same-origin iframe. The creator
 * worker must not send X-Frame-Options: DENY for that document, or the
 * tab stays blank (as it did after staging inherited the live portal). */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const portal=read("kids/kids-academy-portal-v1421.js");
const worker=read("kids/creator-test/worker.js");
assert.match(portal,/frame\.src="\/kids\/akademie\/index\.html\?kidsPortal=1/);
assert.match(portal,/className="kids-academy-portal"/);
assert.match(worker,/allowSameOriginFrame/);
assert.match(worker,/allowSameOriginFrame \? "SAMEORIGIN" : "DENY"/);
assert.match(worker,/path === "\/kids\/akademie\/index\.html"/);
assert.doesNotMatch(worker,/headers\.set\("X-Frame-Options", "DENY"\)/,
  "Creator worker must not unconditionally DENY framing of academy documents");
console.log("PASS Kids Academy portal frame: Lernen iframe target is index.html and the creator worker allows same-origin embedding.");
