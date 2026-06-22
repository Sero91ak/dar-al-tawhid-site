#!/usr/bin/env node
/**
 * POSTS LOAD GUARD: App darf beim Öffnen nicht alle Beiträge blockierend neu laden.
 * Der Datei-Map-Cache darf kein volles post-Objekt mehr verlangen (nur sha + parseVersion + posts cache).
 *
 * Usage: node scripts/posts-load-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function runPostsLoadGuard() {
  let failed = 0;
  const fail = (msg) => {
    console.error("POSTS-LOAD-GUARD FAIL:", msg);
    failed += 1;
  };
  const ok = (msg) => console.log("POSTS-LOAD-GUARD OK:", msg);

  for (const rel of ["index.html", "test/index.html"]) {
    const html = read(rel);
    if (!html.includes("function postFileIsFresh(")) {
      fail(`${rel}: postFileIsFresh fehlt`);
    }
    if (!html.includes("postsSyncSilent")) {
      fail(`${rel}: postsSyncSilent fehlt (Hintergrund-Sync)`);
    }
    if (/postMapFresh=f=>[\s\S]*?e\.post\)/.test(html)) {
      fail(`${rel}: postMapFresh verlangt noch e.post im fileMap`);
    }
    if (!html.includes("postFromCachedFile(cached,file.name)")) {
      fail(`${rel}: Cache-Lookup pro Datei fehlt`);
    }
  }

  if (failed) process.exit(1);
  ok("Sofort-Anzeige aus Cache + stilles Nachladen gesichert");
}

runPostsLoadGuard();
