#!/usr/bin/env node
"use strict";
/**
 * Non-mutating, advisory audit for visitor-facing KIDS lesson text.
 * Usage: node kids/tools/audit-academy-visitor-copy-v1.cjs
 * Exit code 0: report only (deliberate until the existing draft has been cleaned).
 * For CI gating after remediation: --strict exits 1 on any finding.
 */
const fs = require("node:fs");
const path = require("node:path");
const input = path.resolve(__dirname, "../akademie/curriculum-v38.js");
const src = fs.readFileSync(input, "utf8");
const tag = "const additions=";
const head = src.indexOf(tag);
if (head === -1) { console.error("Missing V38 additions object"); process.exit(2); }
const start = src.indexOf("{", head + tag.length);
let depth = 0, inString = false, escaped = false, end = -1;
for (let i = start; i < src.length; i++) {
  const ch = src[i];
  if (inString) {
    if (escaped) escaped = false;
    else if (ch === "\\") escaped = true;
    else if (ch === '"') inString = false;
  } else if (ch === '"') inString = true;
  else if (ch === "{") depth++;
  else if (ch === "}" && --depth === 0) { end = i + 1; break; }
}
if (end < 0) { console.error("Unclosed additions object"); process.exit(2); }
let lessons;
try { lessons = JSON.parse(src.slice(start, end)); }
catch (err) { console.error("Invalid V38 lesson JSON:", err.message); process.exit(2); }

const patterns = [
  /keine freigabe für besucher/i,
  /keine synthetische rezitation/i,
  /wissenschaftliche freigabe/i,
  /diese stunde bleibt ein entwurf/i,
  /(?:dorar|shamela|islamweb) (?:wurde|wurden) nicht (?:erneut )?(?:gelesen|geöffnet)/i,
  /al-mughnī wurde nicht gelesen/i,
  /(?:https?:\/\/|www\.)\S+/i,
  /(?:\bHTTP\s*403\b|\b(?:sourceAudit|verifiedDate|fiqhHumanReviewNeeded)\b)/i
];
const issues = [];
function visit(value, route, id) {
  if (typeof value === "string") {
    for (const pattern of patterns) if (pattern.test(value))
      issues.push({ id, path: route, pattern: pattern.source, excerpt: value.slice(0, 145) });
  } else if (Array.isArray(value)) value.forEach((part, i) => visit(part, route + "[" + i + "]", id));
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([key, part]) => visit(part, route + "." + key, id));
}
for (const [id, lesson] of Object.entries(lessons)) {
  // Check learner copy and potential spoken outputs; leave sourceAudit and editorial metadata alone.
  for (const field of ["lead", "hint", "sample", "ageText", "questions", "practice", "summary", "audioScript"])
    if (lesson[field] !== undefined) visit(lesson[field], field, id);
}
console.log("V38 lessons scanned: " + Object.keys(lessons).length);
console.log("Potential visitor-copy editorial leaks: " + issues.length);
for (const item of issues) console.log(item.id + " | " + item.path + " | " + item.pattern + " | " + JSON.stringify(item.excerpt));
console.log("Note: possible matches require editorial review; an automated deletion may harm meaning.");
if (process.argv.includes("--strict") && issues.length) process.exitCode = 1;
