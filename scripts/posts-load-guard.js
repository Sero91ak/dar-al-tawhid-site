#!/usr/bin/env node
/**
 * POSTS LOAD GUARD: App darf beim Öffnen nicht alle Beiträge blockierend neu laden.
 * Der Datei-Map-Cache darf kein volles post-Objekt mehr verlangen (nur sha + parseVersion + posts cache).
 *
 * Usage: node scripts/posts-load-guard.js
 */
const { read, createReporter } = require("./lib/guard-report.cjs");

function runPostsLoadGuard() {
  const report = createReporter("POSTS-LOAD-GUARD");
  const { fail, ok } = report;

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

  if (report.failed) process.exit(1);
  ok("Sofort-Anzeige aus Cache + stilles Nachladen gesichert");
}

runPostsLoadGuard();
