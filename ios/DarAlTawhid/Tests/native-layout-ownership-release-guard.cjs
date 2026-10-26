#!/usr/bin/env node
"use strict";
/* DĀR adult official iOS viewer. This is a release gate, not a Swift patch.
   The iOS Swift native push lane requires its separate authorization. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../../..");
const swift = fs.readFileSync(path.join(root,"ios/DarAlTawhid/DarAlTawhid/WebAppView.swift"),"utf8");
const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const adaptive = fs.readFileSync(path.join(root,"assets/adaptive-layout.js"),"utf8");
const forbidden = /setAttribute\(\s*["']data-layout["']\s*,\s*["']compact["']\s*\)/;
const failures = [];
if(forbidden.test(swift)) failures.push("Native Swift WebAppView.swift forcibly resets medium/expanded layout to compact");
if(forbidden.test(html)) failures.push("Visitor index.html forcibly resets measured layout to compact");
if(!/function resolveLayoutMode\(width, height\)/.test(adaptive)) failures.push("Missing shared capacity-based layout authority");
if(!/layoutAttributeObserver/.test(adaptive)) failures.push("Missing native attribute override recovery");
if(failures.length){
  for(const issue of failures) console.error("BLOCKING NATIVE LAYOUT: "+issue);
  console.error("Do not mark full Fold/iPad iOS parity as complete. Native file is in a separate protected release lane.");
  process.exitCode=1;
}else{
  assert.match(swift,/WKWebView/, "Native shell must retain WKWebView");
  console.log("PASS: Native visitor shell preserves capacity-based layout modes");
}
