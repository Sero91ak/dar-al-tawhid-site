#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../../..");
const css=fs.readFileSync(path.join(root,"assets/fold-hinge-layout.css"),"utf8");
const js=fs.readFileSync(path.join(root,"assets/fold-hinge-layout.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const old=fs.readFileSync(path.join(root,"assets/fold-split.css"),"utf8");
for(const name of ["fold-hinge-layout.css","fold-hinge-layout.js"]){
 assert.equal(html.split("/assets/"+name).length,2,name+" must load once");
}
assert.ok(html.indexOf("/assets/fold-hinge-layout.css")>
  html.indexOf("/assets/adult-responsive-viewport-v1381.css"),
  "Hinge geometry must win over old 34/66 stylesheet");
assert.match(css,/grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\) !important/,
  "Both halves are equal before the native region is known");
assert.match(css,/--dar-hinge-left-pane/);
assert.match(css,/--dar-hinge-right-pane/);
assert.match(css,/--dar-hinge-local-gap/);
assert.match(css,/data-dar-hinge-axis="horizontal"/);
assert.match(css,/data-dar-hinge-source="native"/);
assert.match(css,/data-fold-dual="1"/);
assert.match(css,/max-width:\s*899\.98px/);
assert.match(js,/dar:native-fold-region/);
assert.match(js,/visualViewport/);
assert.match(js,/getBoundingClientRect/);
assert.match(js,/lastNative/);
assert.match(old,/grid-template-columns:var\(--fold-rail-current/,"Legacy 34/66 owner must be overridden, not silently deleted");
assert.doesNotMatch(css,/overflow-x:\s*(?:hidden|clip)\s*!important/,"Never hide clipped fold content");
assert.doesNotMatch(css,/display:\s*none\s*!important/,"Fold CSS must not delete a display half");
const appMode=html.includes('data-fold-dual="1"') || js.includes('data-fold-dual');
assert.ok(appMode,"Fold capacity model must remain present");
let depth=0;
for(const ch of css){if(ch==="{")depth++;if(ch==="}")depth--;assert.ok(depth>=0)}
assert.equal(depth,0,"Balanced CSS braces");
console.log("PASS: actual two-half fold grid overrides 34/66, center gap, native region and compact fallback");
