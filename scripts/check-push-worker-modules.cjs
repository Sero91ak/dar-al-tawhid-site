#!/usr/bin/env node
/* Parse every module of the admin publisher worker (push scheduler, Jumuʿah,
 * daily, post, library pushes) before merge. A syntax error here blocks the
 * whole worker deploy, so push language fixes silently never go live
 * (seen 26.11.2026: duplicate `const text` in jummah-push-admin.js).
 * Read-only: no build, no deploy, no send.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT = path.join(__dirname, "..");
const CF = path.join(ROOT, "cloudflare");
const entry = "worker.js";
const seen = new Set();
const queue = [entry];
let failed = 0;

while (queue.length) {
  const rel = queue.shift();
  if (seen.has(rel)) continue;
  seen.add(rel);
  const file = path.join(CF, rel);
  if (!fs.existsSync(file)) {
    console.error(`PUSH-WORKER FAIL: ${rel} fehlt`);
    failed += 1;
    continue;
  }
  const src = fs.readFileSync(file, "utf8");
  const res = cp.spawnSync(process.execPath, ["--input-type=module", "--check"], { input: src, encoding: "utf8" });
  if (res.status !== 0) {
    console.error(`PUSH-WORKER FAIL: ${rel}\n${String(res.stderr || "").split("\n").slice(0, 6).join("\n")}`);
    failed += 1;
  }
  const re = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*["'](\.\/[^"']+\.js)["']/g;
  let m;
  while ((m = re.exec(src))) {
    const next = path.normalize(path.join(path.dirname(rel), m[1])).replace(/\\/g, "/");
    if (!next.startsWith("..")) queue.push(next);
  }
}

if (failed) {
  console.error(`PUSH-WORKER: ${failed} Modul(e) mit Syntaxfehler – Admin-Worker würde nicht deployen.`);
  process.exit(1);
}
console.log(`PUSH-WORKER OK: ${seen.size} Module ab cloudflare/${entry} syntaktisch gültig`);
