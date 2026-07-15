#!/usr/bin/env node
/**
 * PUBLISH ISOLATION GUARD: blockiert Deploy wenn Admin-Publish die Besucher-App
 * wieder überlasten kann (Deploy-Sturm, sync Live-Checks, sequentieller Bulk-Upload).
 *
 * Usage: node scripts/publish-isolation-guard.js
 */
const { read, exists, createReporter } = require("./lib/guard-report.cjs");

const VISITOR_FILES = ["index.html", "test/index.html"];

function extractFunction(source, name) {
  const re = new RegExp(`async function ${name}[\\s\\S]*?(?=\\nasync function |\\nfunction [a-zA-Z_$])`);
  const match = source.match(re);
  return match ? match[0] : "";
}

function runPublishIsolationGuard() {
  const report = createReporter("PUBLISH-ISOLATION-GUARD");
  const { fail, ok, mustInclude, mustNotInclude } = report;

  const worker = read("cloudflare/worker.js");
  const admin = read("admin/index.html");

  mustInclude("worker.js", worker, [
    "PUBLISH ISOLATION GUARD FINAL",
    "async function publishBulkPostsFromMarkdown",
    "async function githubCommitBatch",
    "/api/admin/publish/bulk",
    "bulkPublishPaths",
    "deferred: true",
    "ctx.waitUntil(processPendingPushUntilLive"
  ]);

  const publishSingle = extractFunction(worker, "publishPostFromMarkdown");
  if (!publishSingle) {
    fail("worker.js: publishPostFromMarkdown nicht gefunden");
  } else {
    mustInclude("publishPostFromMarkdown", publishSingle, ["githubCommitBatch("]);
    mustNotInclude("publishPostFromMarkdown", publishSingle, [
      "await verifyPostLiveAvailability(",
      "Live blockiert – Besucher-App nicht startklar"
    ]);
    if (/await githubPut\([\s\S]*Add post/.test(publishSingle) && !publishSingle.includes("githubCommitBatch(")) {
      fail("publishPostFromMarkdown: alter Doppel-Commit (githubPut) statt githubCommitBatch");
    }
  }

  const renameFn = extractFunction(worker, "renameCategoryLabel");
  if (!renameFn) {
    fail("worker.js: renameCategoryLabel nicht gefunden");
  } else if (!renameFn.includes("githubCommitBatch(")) {
    fail("renameCategoryLabel: muss githubCommitBatch nutzen (kein Commit pro Beitrag)");
  } else if (!renameFn.includes("RENAME_CATEGORY_BATCH")) {
    fail("renameCategoryLabel: Batch-Limit fehlt (Cloudflare Subrequest-Schutz)");
  } else if (/for\s*\(\s*const\s+file\s+of\s+files\s*\)/.test(renameFn)) {
    fail("renameCategoryLabel: darf nicht alle Beiträge in einem Worker-Aufruf laden");
  } else {
    ok("renameCategoryLabel: Batch-Commit mit Subrequest-Limit");
  }

  const bulkWorker = extractFunction(worker, "publishBulkPostsFromMarkdown");
  if (!bulkWorker) {
    fail("worker.js: publishBulkPostsFromMarkdown nicht gefunden");
  } else {
    mustInclude("publishBulkPostsFromMarkdown", bulkWorker, [
      "Bulk publish",
      "githubCommitBatch("
    ]);
  }

  mustInclude("admin/index.html", admin, [
    "PUBLISH ISOLATION GUARD FINAL",
    "async function publishBulkViaWorkerRequest",
    "publish/bulk",
    "publishBulkViaWorkerRequest(prepared)"
  ]);

  const bulkAdmin = extractFunction(admin, "uploadBulkPackViaWorker");
  if (!bulkAdmin) {
    fail("admin/index.html: uploadBulkPackViaWorker nicht gefunden");
  } else {
    mustNotInclude("uploadBulkPackViaWorker", bulkAdmin, [
      "publishPostViaWorkerRequest(",
      "nacheinander online gestellt"
    ]);
    if (!bulkAdmin.includes("1 Deploy") && !bulkAdmin.includes("einem Schritt")) {
      fail("uploadBulkPackViaWorker: UI muss 1-Deploy-Sammelveröffentlichung kommunizieren");
    } else {
      ok("uploadBulkPackViaWorker: kein sequentieller Einzel-Publish");
    }
  }

  const visitorNeedles = [
    "PUBLISH ISOLATION GUARD FINAL",
    "POSTS_INDEX_STALE_KEY",
    "POSTS_FETCH_TIMEOUT_MS",
    "async function fetchWithTimeout",
    "postsSyncBusy",
    "POSTS_FETCH_BATCH",
    "FILTER_RENDER_LIMIT",
    "refreshContentPromise",
    "scheduleRefreshContent",
    "renderPostsSyncBanner"
  ];

  for (const file of VISITOR_FILES) {
    const html = read(file);
    mustInclude(file, html, visitorNeedles);
    mustNotInclude(file, html, [
      "refreshContent({forceRender:true})).catch(e=>console.warn(\"Inhalte aktualisieren:\""
    ]);
  }

  if (!exists("scripts/publish-isolation-guard.js")) {
    fail("scripts/publish-isolation-guard.js fehlt");
  } else {
    ok("Guard-Skript vorhanden");
  }

  return report.failed;
}

if (require.main === module) {
  const failed = runPublishIsolationGuard();
  if (failed) {
    console.error(`\n${failed} Publish-Isolation-Guard-Prüfung(en) fehlgeschlagen – Deploy blockiert.`);
    process.exit(1);
  }
  console.log("\nPublish-Isolation-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runPublishIsolationGuard };
