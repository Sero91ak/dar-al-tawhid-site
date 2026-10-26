#!/usr/bin/env node
"use strict";
/* DAR TEST KIDS QUIZ preview contractual guard: no production-origin fallback. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ROOT = path.resolve(__dirname, "../..");
const read = (p) => fs.readFileSync(path.join(ROOT,p),"utf8");
const worker = read("cloudflare/test-app-worker.js");
const wrangler = read("wrangler.test.toml");
const manifest = JSON.parse(read("test/kids-quiz-preview-version.json"));
const source = JSON.parse(read("kids/data/quiz-kids-public-450.json"));
const player = read("kids/quiz-v4-approved-player.js");
const css = read("kids/quiz-premium-v1.css");
for (const p of ["kids/index.html","kids/start.html","kids/shell.html"]) {
 const html = read(p);
 assert.ok(html.includes("/kids/quiz-premium-v1.css"),p+": premium dashboard asset");
 assert.ok(html.includes("/kids/quiz-v4-approved-player.js"),p+": fail-closed V4 player");
 assert.ok(html.includes('id="openQuizButton"')&&html.includes('id="quizModal"'),p+": quiz entry");
}
assert.equal(manifest.mode,"DAR_TEST_KIDS_QUIZ_ISOLATED");
assert.equal(manifest.publicVisitorRouteChanged,false);
assert.equal(manifest.reviewAudioAllowedForPublicPlayback,false);
assert.ok(worker.includes("DAR_TEST_KIDS_QUIZ_ISOLATED_V1"));
assert.ok(worker.includes('const previewOrigin = "https://dar-al-tawhid-test.sero91ak.workers.dev";'));
assert.ok(!worker.includes('new URL("https://dar-al-tawhid.de" + url.pathname.replace(/^\\/test\\/kids/'));
assert.ok(wrangler.includes('"/test/kids"') && wrangler.includes('"/test/kids/*"'));
assert.ok(wrangler.includes('workers_dev = true') && wrangler.includes('routes = []'));
assert.equal(source.counts.total,450);
for (const band of ["4-6","7-8","9-10"]) assert.equal(source.items.filter(q=>q.ageBand===band).length,150);
assert.equal(new Set(source.items.map(q=>q.id)).size,450);
assert.ok(player.includes("releaseEnabled!==true")&&player.includes("humanListeningApproved!==true"));
assert.ok(css.includes("prefers-reduced-motion")&&css.includes("safe-area-inset"));
assert.ok(css.includes('data-quiz-persona="girl"')&&css.includes('data-quiz-persona="boy"'));
console.log("PASS: separate DAR TEST Kids preview origin, 450 canonical questions, responsive profiles and V4 human-approval lock");
