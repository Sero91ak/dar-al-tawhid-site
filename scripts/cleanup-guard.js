#!/usr/bin/env node
/**
 * CLEANUP GUARD: verhindert Rückkehr entfernter Duplikate/Alt-Dateien.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function fail(msg) {
  console.error("CLEANUP-GUARD FAIL:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("CLEANUP-GUARD OK:", msg);
}

const forbidden = [
  "posts.json",
  "assets/auto-refresh.js",
  "assets/prayer-push-tags.js",
  ".github/workflows/install-prayer-push-tags.yml",
  ".github/workflows/sync-taxipro-dispatch.yml"
];

for (const rel of forbidden) {
  if (fs.existsSync(path.join(ROOT, rel))) {
    fail(`Verbotene Alt-Datei wieder vorhanden: ${rel}`);
  }
}

const contentRootMd = fs.readdirSync(path.join(ROOT, "content")).filter((f) => f.endsWith(".md"));
if (contentRootMd.length) {
  fail(`content/*.md Duplikate wieder da (${contentRootMd.length}): ${contentRootMd.slice(0, 3).join(", ")}…`);
}
ok("Keine verbotenen Alt-Dateien");

const duasDir = path.join(ROOT, "content/duas");
const duaMd = fs.readdirSync(duasDir).filter((f) => f.endsWith(".md"));
if (duaMd.length) {
  fail(`content/duas/*.md blockiert duas.json (${duaMd.length} Dateien)`);
}
ok("content/duas nur JSON (duas.json + daily-dua-pool.json)");

if (!fs.existsSync(path.join(ROOT, "content/posts/posts-index.json"))) {
  fail("content/posts/posts-index.json fehlt");
}
ok("Produktive Beiträge unangetastet");

console.log("\nCleanup-Schutz: alle Prüfungen bestanden.");
