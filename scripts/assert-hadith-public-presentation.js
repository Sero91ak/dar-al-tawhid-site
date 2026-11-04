#!/usr/bin/env node
"use strict";

// DĀR AL TAWḤĪD – public presentation policy:
// HAD-#### is an INTERNAL canonical key, never a visible citation or sequence number.
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const internalId = /\bHAD-\d{4,6}\b/i;
function check(condition, detail) {
  if (!condition) throw new Error("PUBLIC_HADITH_ID_BLOCKED: " + detail);
}
const builder = read("scripts/build-test-hadith-library.js");
check(builder.includes("hadithNumber: publicSourceNumber(rec.sourceHadithNumber)"),
  "Builder must never fall back from missing external citation to rec.id");
check(!builder.includes("rec.sourceHadithNumber || rec.id"),
  "Internal record ID used as a public Ḥadīṯ number");

for (const file of [
  "assets/hadith-visitor-parity-v1397.js",
  "test/assets/hadith-library-reframe-v1299.js"
]) {
  const source = read(file);
  check(source.includes("function publicHadithNumber(") && source.includes("publicHadithText(hadithShareText(h))"),
    "Public reader lacks the internal-ID filter: " + file);
  check(source.includes('location.origin+location.pathname+"#/hadith"'),
    "Share link may expose an internal ID: " + file);
}
const desktop = read("desktop-preview/assets/dar-v8-route-platform.js");
check(!desktop.includes("source.textContent=h.id"), "Desktop preview reveals HAD ID");
check(desktop.includes("publicSourceNumber(h.hadithNumber)"), "Desktop preview source number is unsanitized");

const indexFile = path.join(root, "test/data/hadith/search-index.json");
check(fs.existsSync(indexFile), "Generated test search index missing");
const records = JSON.parse(fs.readFileSync(indexFile, "utf8"));
check(Array.isArray(records) && records.length > 0, "Generated Ḥadīṯ index empty");
for (const row of records) {
  if (internalId.test(String(row.hadithNumber || ""))) {
    throw new Error("PUBLIC_HADITH_ID_BLOCKED: leaked index number in " + row.id);
  }
}
const collDir = path.join(root, "test/data/hadith/collections");
check(fs.existsSync(collDir), "Generated test collections missing");
for (const name of fs.readdirSync(collDir).filter(n => n.endsWith(".json"))) {
  const book = JSON.parse(fs.readFileSync(path.join(collDir, name), "utf8"));
  for (const chapter of book.chapters || []) {
    for (const entry of chapter.hadiths || []) {
      if (internalId.test(String(entry.hadithNumber || ""))) {
        throw new Error("PUBLIC_HADITH_ID_BLOCKED: leaked card number in " + name + "/" + entry.id);
      }
    }
  }
}
console.log("Public Ḥadīṯ/Āṯār identifiers: PASS – internal IDs stay out of public numbering.");
