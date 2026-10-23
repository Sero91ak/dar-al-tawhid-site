#!/usr/bin/env node
"use strict";
/* Isolated static sanity checks: node design-studio/smoke-test.cjs */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const dir = __dirname;

const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(dir, "studio.css"), "utf8");
const js = fs.readFileSync(path.join(dir, "studio.js"), "utf8");

new vm.Script(js, {filename: "studio.js"});

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate HTML IDs");
const used = [...js.matchAll(/\$\("([^"]+)"\)/g)].map(m => m[1]);
const missing = [...new Set(used)].filter(id => !ids.includes(id));
assert.equal(missing.length, 0, "Unknown DOM element IDs: " + missing.join(", "));
assert.ok(html.includes("./studio.css") && html.includes("./studio.js"), "Studio assets missing");
assert.ok(css.includes(".studio-node") && css.includes(".inspector"), "Editor CSS missing");
assert.ok(js.includes("function onNodePointerDown"), "Pointer editing unavailable");
assert.ok(js.includes("function exportProject"), "Project export unavailable");
assert.ok(js.includes("function applyLivePatches"), "Live preview inspector unavailable");
assert.ok(js.includes("localStorage.setItem(STORE"), "Local project persistence unavailable");
assert.ok(js.includes('new URL("../test/"'), "Test preview route missing");
assert.ok(js.includes('setAttribute("aria-label"'), "Accessible controls missing");

const count = [...js.matchAll(/type:"(?:phone|tablet|desktop)"/g)].length;
assert.ok(count >= 13, "Fewer than 13 device presets");

for (const forbidden of ["cloudflare/worker.js", "push-system-guard.js", "git push origin main"]) {
  assert.ok(!js.includes(forbidden), "Forbidden integration: " + forbidden);
}
console.log("DAR Visual Design Studio · static checks passed");
console.log("Devices:", count, "DOM refs:", new Set(used).size, "HTML IDs:", ids.length);
console.log("Note: This is not a browser, accessibility or device runtime test.");
