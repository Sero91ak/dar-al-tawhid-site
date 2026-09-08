#!/usr/bin/env node
/**
 * Hält APP_BUILD_ID, __DAR_EXPECTED_BUILD und Service-Worker CACHE_VERSION
 * mit version.json synchron. Visitor-IDs sind nur kanonisch: app-shell-vN
 * (keine Suffixe). Ungültige IDs werden autonom auf die Zahl zurückgeschrieben.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(data, null, 2)}\n`);
}

function extractShellNum(value) {
  const match = String(value || "").match(/app-shell-v(\d+)/);
  return match ? match[1] : "";
}

function canonicalizeVersionFile(versionFile, { visitor } = {}) {
  const data = readJson(versionFile);
  const raw = String(data.buildId || data.appBuildId || "").trim();
  const num = extractShellNum(raw);
  if (!num) {
    throw new Error(`${versionFile}: gültige buildId fehlt (${raw || "leer"})`);
  }
  const canonical = visitor ? `app-shell-v${num}` : /^app-shell-v\d+-test$/.test(raw)
    ? `app-shell-v${num}-test`
    : `app-shell-v${num}`;
  if (data.buildId !== canonical || data.appBuildId !== canonical) {
    data.buildId = canonical;
    data.appBuildId = canonical;
    writeJson(versionFile, data);
    console.log(`sync-app-build-ids: ${versionFile} kanonisiert → ${canonical}`);
  }
  return canonical;
}

function syncHtml(htmlFile, buildId) {
  const full = path.join(ROOT, htmlFile);
  let html = fs.readFileSync(full, "utf8");
  const before = html;
  const pattern = /app-shell-v\d+(?:-[A-Za-z0-9._-]+)?/g;

  html = html.replace(/const APP_BUILD_ID="app-shell-v[^"]+"/, `const APP_BUILD_ID="${buildId}"`);
  html = html.replace(
    /window\.__DAR_EXPECTED_BUILD="app-shell-v[^"]+"/,
    `window.__DAR_EXPECTED_BUILD="${buildId}"`
  );

  if (!html.includes(`APP_BUILD_ID="${buildId}"`)) {
    throw new Error(`${htmlFile}: APP_BUILD_ID konnte nicht auf ${buildId} gesetzt werden`);
  }
  if (!html.includes(`__DAR_EXPECTED_BUILD="${buildId}"`)) {
    throw new Error(`${htmlFile}: __DAR_EXPECTED_BUILD konnte nicht auf ${buildId} gesetzt werden`);
  }

  if (html !== before) {
    fs.writeFileSync(full, html);
    console.log(`sync-app-build-ids: ${htmlFile} → ${buildId}`);
  } else {
    console.log(`sync-app-build-ids: ${htmlFile} bereits ${buildId}`);
  }
  void pattern;
}

function syncServiceWorker(swFile, buildId) {
  const num = extractShellNum(buildId);
  if (!num) throw new Error(`${swFile}: keine Shell-Nummer in ${buildId}`);
  const full = path.join(ROOT, swFile);
  let sw = fs.readFileSync(full, "utf8");
  const next = `const CACHE_VERSION = 'dar-al-tawhid-offline-light-v${num}';`;
  const pattern = /const CACHE_VERSION = ['"]dar-al-tawhid-offline-light-[^'"]+['"];?/;
  if (!pattern.test(sw)) {
    throw new Error(`${swFile}: CACHE_VERSION fehlt`);
  }
  const updated = sw.replace(pattern, next);
  const cacheLine = updated.match(/const CACHE_VERSION = ['"][^'"]+['"]/);
  const expected = `dar-al-tawhid-offline-light-v${num}`;
  if (!cacheLine || !cacheLine[0].includes(expected) || /offline-light-v\d+-/.test(cacheLine[0])) {
    throw new Error(`${swFile}: CACHE_VERSION muss ${expected} sein`);
  }
  if (updated !== sw) {
    fs.writeFileSync(full, updated);
    console.log(`sync-app-build-ids: ${swFile} → v${num}`);
  } else {
    console.log(`sync-app-build-ids: ${swFile} bereits v${num}`);
  }
}

const visitorBuild = canonicalizeVersionFile("version.json", { visitor: true });
const testBuild = canonicalizeVersionFile("test/version.json", { visitor: false });
syncHtml("index.html", visitorBuild);
syncHtml("test/index.html", testBuild);
syncServiceWorker("service-worker.js", visitorBuild);
syncServiceWorker("test/service-worker.js", testBuild);
console.log("sync-app-build-ids: fertig");
