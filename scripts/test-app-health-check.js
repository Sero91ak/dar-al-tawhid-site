#!/usr/bin/env node
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
  let match;
  while ((match = re.exec(html)) !== null) {
    if (match[1].includes("const REPO_OWNER")) return match[1];
  }
  return "";
}

function checkJsSyntax(label, code) {
  if (!code) {
    fail(`${label}: Hauptscript nicht gefunden`);
    return;
  }
  try {
    new Function(code);
    ok(`${label}: JavaScript syntax`);
  } catch (error) {
    fail(`${label}: JavaScript syntax – ${error.message}`);
  }
}

function checkJson(file) {
  try {
    const data = JSON.parse(read(file));
    ok(`${file}: gültiges JSON`);
    return data;
  } catch (error) {
    fail(`${file}: ${error.message}`);
    return null;
  }
}

const testHtml = read("test/index.html");
checkJsSyntax("test/index.html", extractMainScript(testHtml));

const testVersion = checkJson("test/version.json");
const testBuildMatch = testHtml.match(/const APP_BUILD_ID="(app-shell-v\d+)"/);
if (!testBuildMatch) {
  fail("test/index.html: APP_BUILD_ID fehlt");
} else if (!testVersion || testBuildMatch[1] !== testVersion.buildId) {
  fail(
    `test/index.html APP_BUILD_ID (${testBuildMatch ? testBuildMatch[1] : "?"}) stimmt nicht mit test/version.json (${testVersion?.buildId || "unbekannt"}) überein`
  );
} else {
  ok(`test/index.html Build-ID synchron: ${testVersion.buildId}`);
}

if (!testHtml.includes("renderStagingBanner")) fail("test/index.html: renderStagingBanner fehlt");
if (!testHtml.includes("window.__DAR_STAGING_APP")) fail("test/index.html: Staging-Markierung fehlt");

const sw = read("service-worker.js");
if (!/dar-al-tawhid-offline-light-v\d+/.test(sw)) fail("service-worker.js: CACHE_VERSION fehlt");
else ok("service-worker.js: CACHE_VERSION vorhanden");

const worker = read("cloudflare/test-app-worker.js");
if (!worker.includes("Response.redirect")) fail("test-app-worker.js: Root-Redirect fehlt");
else ok("test-app-worker.js: Root-Redirect vorhanden");

if (failed) {
  console.error(`\n${failed} Test-App-Check(s) fehlgeschlagen – Deploy stoppen.`);
  process.exit(1);
}

console.log("\nTest-App-Checks bestanden.");
