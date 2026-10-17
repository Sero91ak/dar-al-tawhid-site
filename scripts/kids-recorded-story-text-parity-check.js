#!/usr/bin/env node
"use strict";
// Regression: approved recorded stories are rendered verbatim, never with a generated greeting/outro.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ROOT = path.join(__dirname, "..");
const pairs = [
  ["kids/prophet-stories.js", "kids/data/prophet-stories.json", 25],
  ["kids/mubashshirun-stories.js", "kids/data/mubashshirun-stories.json", 10],
  ["kids/sahabiyyat-stories.js", "kids/data/sahabiyyat-stories.json", 14],
];
const SALAM = "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh";
let checked = 0;
for (const [runtimePath, dataPath, count] of pairs) {
  const runtime = fs.readFileSync(path.join(ROOT, runtimePath), "utf8");
  assert(!runtime.includes("KIDS_STORY_OUTRO"), runtimePath + ": must not append a generated ending");
  assert(!runtime.includes("KIDS_STORY_INTRO"), runtimePath + ": must not prepend a generated greeting");
  const fn = runtime.match(/function normalizeKidsStoryText\(value\)\s*\{([\s\S]*?)\n\}/);
  assert(fn, runtimePath + ": normalizer is missing");
  const display = new Function("value", fn[1]);
  const items = JSON.parse(fs.readFileSync(path.join(ROOT, dataPath), "utf8")).items;
  assert.equal(items.length, count, dataPath + ": unexpected item count");
  for (const item of items) {
    const original = String(item.masterStoryText || item.scripts?.["6-8"] || item.voiceScript || "").trim();
    assert(original, dataPath + ":" + item.id + ": missing original master text");
    assert.equal(display(original), original, dataPath + ":" + item.id + ": original text was changed by player");
    assert(original.startsWith(SALAM), dataPath + ":" + item.id + ": original greeting missing");
    assert(original.endsWith(SALAM + "."), dataPath + ":" + item.id + ": original farewell missing");
    assert.equal(original.split(SALAM).length - 1, 2, dataPath + ":" + item.id + ": duplicated greeting or farewell in source");
    for (const age of ["4-5", "6-8", "9-10"]) {
      assert.equal(String(item.scripts?.[age] || "").trim(), original, dataPath + ":" + item.id + ": age text differs");
    }
    checked++;
  }
}
assert.equal(checked, 49);
console.log("PASS: " + checked + " approved master texts are unchanged in all three Kids player displays. Audio/data files untouched.");
