#!/usr/bin/env node
/**
 * Hält APP_BUILD_ID und __DAR_EXPECTED_BUILD automatisch mit version.json synchron.
 * version.json / test/version.json sind die einzige Quelle der Wahrheit.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readBuildId(versionFile) {
  const full = path.join(ROOT, versionFile);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!data.buildId || !/^app-shell-v\d+$/.test(data.buildId)) {
    throw new Error(`${versionFile}: gültige buildId fehlt`);
  }
  return data.buildId;
}

function syncHtml(htmlFile, buildId) {
  const full = path.join(ROOT, htmlFile);
  let html = fs.readFileSync(full, "utf8");
  const before = html;

  html = html.replace(/const APP_BUILD_ID="app-shell-v\d+"/, `const APP_BUILD_ID="${buildId}"`);
  html = html.replace(
    /window\.__DAR_EXPECTED_BUILD="app-shell-v\d+"/,
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
}

const visitorBuild = readBuildId("version.json");
const testBuild = readBuildId("test/version.json");
syncHtml("index.html", visitorBuild);
syncHtml("test/index.html", testBuild);
console.log("sync-app-build-ids: fertig");
