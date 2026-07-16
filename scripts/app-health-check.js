#!/usr/bin/env node
/**
 * Pre-deploy health check – stoppt Deploy bei kaputtem Kern.
 * Usage: node scripts/app-health-check.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

function ok(msg) {
  console.log("OK:", msg);
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function extractMainScript(html) {
  const re = /<script>\s*\n([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes("const REPO_OWNER")) return m[1];
  }
  return "";
}

function extractAdminMainScript(html) {
  const m = html.match(/<script>\nwindow\.DAR_ANALYTICS_CONFIG[\s\S]*?<\/script>/);
  return m ? m[0].replace(/^<script>\n/, "").replace(/<\/script>$/, "") : "";
}

function checkJsSyntax(label, code) {
  if (!code) {
    fail(`${label}: Hauptscript nicht gefunden`);
    return;
  }
  try {
    new Function(code);
    ok(`${label}: JavaScript syntax`);
  } catch (e) {
    fail(`${label}: JavaScript syntax – ${e.message}`);
  }
}

function checkJson(label, file) {
  try {
    const data = JSON.parse(read(file));
    ok(`${label}: gültiges JSON`);
    return data;
  } catch (e) {
    fail(`${label}: ${e.message}`);
    return null;
  }
}

// Visitor app
const indexHtml = read("index.html");
if (!indexHtml.includes("function render(")) fail("index.html: render() fehlt");
if (indexHtml.includes('App wird geladen') && !indexHtml.includes("function render(")) {
  fail("index.html: Lade-Platzhalter ohne render()");
}
checkJsSyntax("index.html", extractMainScript(indexHtml));
if (/BYPASS_POST_CACHE"\)\}\}catch\(e\)\{\}/.test(extractMainScript(indexHtml)) &&
    !/BYPASS_POST_CACHE"\)\}\}\}\}catch\(e\)\{\}/.test(extractMainScript(indexHtml))) {
  fail("index.html: hardRefreshApp Klammerfehler");
}

// Admin app
checkJsSyntax("admin/index.html", extractAdminMainScript(read("admin/index.html")));
const adminHtml = read("admin/index.html");
if (!adminHtml.includes("adminSlugPart") && !adminHtml.includes("function slugify")) {
  fail("admin/index.html: slugify/adminSlugPart fehlt");
}
if (!adminHtml.includes("checkVisitorAppHealth")) {
  fail("admin/index.html: Besucher-App Schutz fehlt");
}

// Posts index
const postsIndex = checkJson("posts-index.json", "content/posts/posts-index.json");
if (postsIndex && (!Array.isArray(postsIndex.files) || postsIndex.files.length < 350)) {
  fail(`posts-index.json: zu wenige Einträge (${postsIndex.files?.length || 0})`);
}

// Daily content
const daily = checkJson("daily.json", "content/updates/daily.json");
if (daily && !daily.recommendation?.id && !daily.dua?.id) {
  fail("daily.json: recommendation und dua fehlen");
}

// Prayer status
checkJson("prayer-push-status.json", "content/admin/prayer-push-status.json");

// version.json
checkJson("version.json", "version.json");

// Service workers
const visitorSw = read("service-worker.js");
if (!visitorSw.match(/dar-al-tawhid-offline-light-v\d+/)) fail("service-worker.js: CACHE_VERSION fehlt");
if (/\/admin\/[^'"\s]/.test(visitorSw) && visitorSw.includes("APP_SHELL") && visitorSw.match(/['"]\/admin/)) {
  fail("service-worker.js: darf /admin/ nicht im APP_SHELL cachen");
}

const adminSw = read("admin/sw.js");
if (!adminSw.match(/dar-admin-stats-v\d+/)) fail("admin/sw.js: CACHE_VERSION fehlt");

// Worker
const worker = read("cloudflare/worker.js");
if (!worker.includes("/api/admin/next-number")) fail("worker.js: next-number fehlt");
if (!worker.includes("checkVisitorSiteHealth")) fail("worker.js: visitor-health fehlt");
if (!worker.includes("sendNewPostPush")) fail("worker.js: post push fehlt");

// Push-System (streng – blockiert Deploy bei fehlendem Scheduler)
const pushGuardFails = require("./push-system-guard.js").runPushSystemGuard();
if (pushGuardFails) failed += pushGuardFails;

// App-Update + Willkommens-Push-Schutz (Versions-Banner-Schleife)
const versionGuardFails = require("./version-update-guard.js").runVersionUpdateGuard();
if (versionGuardFails) failed += versionGuardFails;

// Push scripts
if (!fs.existsSync(path.join(ROOT, "scripts/send-prayer-push.js"))) fail("send-prayer-push.js fehlt");
if (!fs.existsSync(path.join(ROOT, "scripts/send-post-push.js"))) fail("send-post-push.js fehlt");

// Repo-Integrität (Massen-Lösch-Schutz)
const repoIntegrityFails = require("./repo-integrity-guard.js").runRepoIntegrityGuard();
if (repoIntegrityFails) failed += repoIntegrityFails;

if (failed) {
  console.error(`\n${failed} check(s) failed – Deploy stoppen.`);
  process.exit(1);
}
console.log("\nAll health checks passed.");
