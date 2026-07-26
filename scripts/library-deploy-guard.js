#!/usr/bin/env node
/**
 * LIBRARY_DEPLOY_GUARD
 * Blockiert Deploy wenn Bibliothek-PDFs nicht live gebracht werden können:
 * - Overlay überschreibt test/index.html (Deploy-Blocker)
 * - Recovery-Guard fehlt nach Overlay
 * - Live-Katalog-Einträge ohne PDF/Cover-Dateien im Repo
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "LIBRARY_DEPLOY_GUARD";
const LOCK_FILE = "content/admin/library-deploy-lock.json";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  return 1;
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
  return 0;
}

function loadLock() {
  const lockPath = path.join(ROOT, LOCK_FILE);
  if (!fs.existsSync(lockPath)) {
    throw new Error(`${LOCK_FILE} fehlt`);
  }
  return JSON.parse(read(LOCK_FILE));
}

function runOverlayGuard(lock) {
  let failed = 0;
  const forbidden = Array.isArray(lock.forbiddenOverlayFiles) ? lock.forbiddenOverlayFiles : [];
  let overlay;
  try {
    overlay = require("./overlay-test-staging-from-branch.js");
  } catch (e) {
    failed += fail(`overlay-test-staging-from-branch.js: ${e.message}`);
    return failed;
  }

  const overlayFiles = Array.isArray(overlay.OVERLAY_FILES) ? overlay.OVERLAY_FILES : [];
  for (const file of forbidden) {
    if (overlayFiles.includes(file)) {
      failed += fail(`Overlay darf ${file} nicht überschreiben (Bibliothek-Deploy-Sperre)`);
    } else {
      ok(`Overlay blockiert ${file}`);
    }
  }

  const forbiddenExport = Array.isArray(overlay.FORBIDDEN_OVERLAY_FILES) ? overlay.FORBIDDEN_OVERLAY_FILES : [];
  for (const file of forbidden) {
    if (!forbiddenExport.includes(file)) {
      failed += fail(`FORBIDDEN_OVERLAY_FILES fehlt: ${file}`);
    }
  }
  if (!failed) ok(`FORBIDDEN_OVERLAY_FILES (${forbidden.length})`);
  return failed;
}

function runMarkerGuard(lock) {
  let failed = 0;
  const required = Array.isArray(lock.requiredMarkers) ? lock.requiredMarkers : [];
  const guardFiles = Array.isArray(lock.guardFiles) ? lock.guardFiles : ["test/index.html"];

  for (const file of guardFiles) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) {
      failed += fail(`${file} fehlt`);
      continue;
    }
    const content = read(file);
    let fileFailed = false;
    for (const needle of required) {
      if (!content.includes(needle)) {
        failed += fail(`${file}: Pflicht-Marker fehlt: ${needle}`);
        fileFailed = true;
      }
    }
    if (!fileFailed) ok(`${file}: alle Pflicht-Marker (${required.length})`);
  }
  return failed;
}

function runDeployWorkflowGuard(lock) {
  let failed = 0;
  const workflow = read(".github/workflows/cloudflare-pages-deploy.yml");
  const markers = Array.isArray(lock.deployWorkflowMarkers) ? lock.deployWorkflowMarkers : [];
  for (const needle of markers) {
    if (!workflow.includes(needle)) {
      failed += fail(`cloudflare-pages-deploy.yml: fehlt „${needle}“`);
    }
  }
  if (!failed) ok(`Deploy-Workflow: alle Pflicht-Schritte (${markers.length})`);
  return failed;
}

function repoAssetPath(urlPath) {
  const p = String(urlPath || "").trim().replace(/^\//, "");
  if (!p) return "";
  if (p.startsWith("test/")) return p;
  return p;
}

function runCatalogAssetGuard(lock) {
  let failed = 0;
  const catalogPath = path.join(ROOT, "data/library-publications.json");
  if (!fs.existsSync(catalogPath)) {
    return fail("data/library-publications.json fehlt");
  }

  const catalog = JSON.parse(read("data/library-publications.json"));
  const online = new Set(Array.isArray(lock.onlineStatuses) ? lock.onlineStatuses : ["published", "updated"]);
  const publications = Array.isArray(catalog.publications) ? catalog.publications : [];

  for (const pub of publications) {
    const status = String(pub?.status || "").trim();
    if (!online.has(status)) continue;
    const id = String(pub?.id || "").trim();
    if (!id) continue;

    const pdfPath = repoAssetPath(pub.pdfUrl);
    if (!pdfPath || !fs.existsSync(path.join(ROOT, pdfPath))) {
      failed += fail(`${id}: PDF fehlt im Repo (${pdfPath || "—"})`);
      continue;
    }

    const coverPath = repoAssetPath(pub.coverUrl || pub.coverUrls?.medium);
    if (!coverPath || !fs.existsSync(path.join(ROOT, coverPath))) {
      failed += fail(`${id}: Cover fehlt im Repo (${coverPath || "—"})`);
      continue;
    }
  }

  if (!failed) ok(`Live-Katalog: ${publications.length} Einträge, Online-Assets geprüft`);
  return failed;
}

function runLibraryDeployGuard() {
  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) {
    console.log(`${MARKER} OK: Lock-Datei fehlt – Guard übersprungen`);
    return 0;
  }

  const lock = loadLock();
  if (!lock.locked) {
    ok("Lock-Datei: nicht gesperrt");
    return 0;
  }

  let failed = 0;
  failed += runOverlayGuard(lock);
  failed += runMarkerGuard(lock);
  failed += runDeployWorkflowGuard(lock);
  failed += runCatalogAssetGuard(lock);

  if (failed) return failed;
  ok("Bibliothek-Deploy-Schutz aktiv");
  return 0;
}

if (require.main === module) {
  process.exit(runLibraryDeployGuard());
}

module.exports = { MARKER, LOCK_FILE, runLibraryDeployGuard, loadLock };
