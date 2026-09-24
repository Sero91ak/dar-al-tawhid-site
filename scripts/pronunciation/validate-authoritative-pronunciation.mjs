#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const runtime = readJson("data/pronunciation/pronunciation-rules.json");
const sources = readJson("data/pronunciation/authoritative-sources.json");
const phonemes = readJson("data/pronunciation/arabic-phoneme-reference.json");
const brand = readJson("data/pronunciation/brand-pronunciation-overrides.json");

const errors = [];
const warnings = [];

if ((runtime.rules || []).length !== 3719) errors.push(`expected 3719 runtime rules, got ${(runtime.rules || []).length}`);

const sourceIds = new Set((sources.sources || []).map((s) => s.id));
for (const id of ["ipa-official","jipa-arabic-1990","quranic-arabic-corpus-phonetic","ala-lc-arabic-2012"]) {
  if (!sourceIds.has(id)) errors.push(`missing authority source: ${id}`);
}

const coreIpa = new Set((phonemes.consonants || []).map((x) => x.ipa));
for (const ipa of ["ħ","ʕ","q","x","ɣ","sˤ","dˤ","tˤ","ðˤ"]) {
  if (!coreIpa.has(ipa)) errors.push(`missing Arabic IPA phoneme: ${ipa}`);
}

for (const item of brand.overrides || []) {
  for (const form of item.forms || []) {
    const rule = (runtime.rules || []).find((r) => r.string_to_replace === form);
    if (!rule) {
      errors.push(`missing brand runtime form: ${form}`);
      continue;
    }
    if (rule.alias !== item.alias) errors.push(`brand alias mismatch for ${form}: ${rule.alias}`);
    if (rule.ipa !== item.ipa) errors.push(`brand IPA mismatch for ${form}: ${rule.ipa}`);
  }
}

// Audit ordinary al- forms before sun letters. l is excluded here because al+l
// is naturally represented with a geminated /l/ and requires a separate lexical check.
const sun = new Set(["t","ṯ","d","ḏ","r","z","s","š","ṣ","ḍ","ṭ","ẓ","n"]);
for (const r of runtime.rules || []) {
  const canonical = String(r.canonical || "");
  const m = canonical.match(/\bal[-\s]+([A-Za-zĀĪŪāīūḤḥṢṣḌḍṬṭẒẓṮṯḎḏŠš])/);
  if (!m) continue;
  const first = m[1].toLowerCase();
  if (sun.has(first) && /\bal[- ]/i.test(String(r.alias || ""))) {
    errors.push(`unassimilated sun-letter alias: ${canonical} -> ${r.alias}`);
  }
}

const ipaFields = (runtime.rules || []).filter((r) => !String(r.ipa || "").startsWith("/") || !String(r.ipa || "").endsWith("/"));
if (ipaFields.length) errors.push(`IPA fields without /.../ delimiters: ${ipaFields.length}`);

if (sources.policy?.universal100PercentClaim === true) {
  warnings.push("source policy must not claim universal 100% pronunciation");
}

const report = {
  ok: errors.length === 0,
  rules: (runtime.rules || []).length,
  authoritySources: (sources.sources || []).length,
  phonemeEntries: (phonemes.consonants || []).length,
  brandOverrides: (brand.overrides || []).length,
  errors,
  warnings
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
