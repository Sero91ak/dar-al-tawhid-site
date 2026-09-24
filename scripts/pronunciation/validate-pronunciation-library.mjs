#!/usr/bin/env node
import fs from "node:fs";
import { loadPronunciationLibrary, prepareNarrationText } from "./pronunciation-library.mjs";

const library = loadPronunciationLibrary();
const rules = library.rules || [];
const required = ["DĀR AL TAWḤĪD","Tawḥīd","ʿAqīdah","Qurʾān","Mūsā","Hārūn","Firʿawn","Muḥammad"];
const missing = required.filter((x) => !rules.some((r) => r.string_to_replace === x));
const blank = rules.filter((r) => !r.string_to_replace || !r.alias || !r.ipa);
const seen = new Map();
const conflicts = [];
for (const r of rules) {
  const key = r.string_to_replace;
  const sig = r.alias + "\u0000" + r.ipa;
  if (seen.has(key) && seen.get(key) !== sig) conflicts.push(key);
  else seen.set(key, sig);
}

if (rules.length !== 3727) throw new Error(`expected 3727 rules, got ${rules.length}`);
if (missing.length) throw new Error(`missing core rules: ${missing.join(", ")}`);
if (blank.length) throw new Error(`blank pronunciation fields: ${blank.length}`);
if (conflicts.length) throw new Error(`conflicting duplicate rules: ${[...new Set(conflicts)].slice(0,20).join(", ")}`);

const sample = "Mūsā ʿalayhi s-salām sprach über Tawḥīd.";
const prepared = prepareNarrationText(sample, library);
if (prepared === sample) throw new Error("sample was not transformed");

console.log(JSON.stringify({
  ok: true,
  canonicalTerms: library.counts?.canonicalTerms,
  rules: rules.length,
  sample,
  prepared
}, null, 2));
