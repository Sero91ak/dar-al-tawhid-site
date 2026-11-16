#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("desktop-preview/index.html");
const renderer = read("desktop-preview/assets/frauen/frauen-fiqh.js");
const gate = read("cloudflare/preview-gate.js");
const wrangler = read("wrangler.toml");

assert.doesNotMatch(html, /(?:src|href)=["']\/test\//i, "desktop HTML must not load a /test/ resource");
assert.match(html, /\/desktop-preview\/assets\/frauen\/frauen-fiqh\.js\?v=desktop-20261116-1/);
assert.match(html, /\/assets\/frauen\/frauen-fiqh\.css/);
assert.match(html, /\/assets\/frauen\/frauen-authority-v1292\.css/);
assert.doesNotMatch(renderer, /\/test\//, "desktop Frauen renderer must not reference internal test routes");

const dataFiles = [...new Set([...renderer.matchAll(/\/desktop-preview\/data\/([^"'\s)]+\.json)/g)].map((match) => match[1]))];
assert.equal(dataFiles.length, 49, "expected the complete set of source JSON datasets used by the renderer");
for (const file of dataFiles) {
  const copied = fs.readFileSync(path.join(root, "desktop-preview/data", file));
  const source = fs.readFileSync(path.join(root, "test/data", file));
  assert.deepEqual(copied, source, `${file} must be an unchanged copy of the currently delivered dataset`);
}

assert.doesNotMatch(gate, /DEFAULT_(?:USER|PASS)/);
assert.match(gate, /if \(!expectedUser \|\| !expectedPass\) return false/);
assert.doesNotMatch(wrangler, /^\[vars\]/m);
assert.doesNotMatch(wrangler, /PREVIEW_GATE_(?:USER|PASS)\s*=/);

console.log(`DESKTOP_AUDIT_CHECK OK: desktop assets isolated; ${dataFiles.length} datasets byte-identical; gate fails closed.`);
