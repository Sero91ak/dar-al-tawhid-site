#!/usr/bin/env node
/**
 * LIBRARY_DEPLOY_REPAIR
 * Autonome Reparatur nach Test-Staging-Overlay:
 * - test/index.html / test/version.json wiederherstellen wenn Guard-Marker fehlen
 * - Overlay-Verbotsliste erzwingen
 */
const fs = require("fs");
const path = require("path");
const { loadLock } = require("./library-deploy-guard.js");

const ROOT = path.join(__dirname, "..");
const MARKER = "LIBRARY_DEPLOY_REPAIR";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content);
}

function repairGuardFilesFromSnapshots(snapshots, lock) {
  const required = Array.isArray(lock?.requiredMarkers) ? lock.requiredMarkers : [];
  const guardFiles = Array.isArray(lock?.guardFiles) ? lock.guardFiles : [];
  let repaired = 0;

  for (const file of guardFiles) {
    const snapshot = snapshots[file];
    if (!snapshot) continue;
    const full = path.join(ROOT, file);
    const current = fs.existsSync(full) ? read(file) : "";
    const missing = required.some((needle) => !current.includes(needle));
    if (missing) {
      write(file, snapshot);
      console.log(`${MARKER}: ${file} aus Snapshot wiederhergestellt`);
      repaired += 1;
    }
  }
  return repaired;
}

function repairGuardFilesFromGit(lock) {
  const { execFileSync } = require("child_process");
  const required = Array.isArray(lock?.requiredMarkers) ? lock.requiredMarkers : [];
  const guardFiles = Array.isArray(lock?.guardFiles) ? lock.guardFiles : [];
  let repaired = 0;

  for (const file of guardFiles) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const current = read(file);
    const missing = required.some((needle) => !current.includes(needle));
    if (!missing) continue;

    try {
      const restored = execFileSync("git", ["show", `HEAD:${file}`], { cwd: ROOT, encoding: "utf8" });
      const stillMissing = required.some((needle) => !restored.includes(needle));
      if (stillMissing) {
        console.warn(`${MARKER}: HEAD:${file} hat ebenfalls fehlende Marker – übersprungen`);
        continue;
      }
      write(file, restored);
      console.log(`${MARKER}: ${file} aus git HEAD wiederhergestellt`);
      repaired += 1;
    } catch (e) {
      console.warn(`${MARKER}: git restore für ${file} fehlgeschlagen: ${e.message}`);
    }
  }
  return repaired;
}

function runLibraryDeployRepair(snapshots) {
  let lock;
  try {
    lock = loadLock();
  } catch (e) {
    console.warn(`${MARKER}: Lock nicht geladen (${e.message}) – Reparatur übersprungen`);
    return 0;
  }
  if (!lock.locked) return 0;

  let repaired = 0;
  if (snapshots && typeof snapshots === "object") {
    repaired += repairGuardFilesFromSnapshots(snapshots, lock);
  }
  repaired += repairGuardFilesFromGit(lock);

  if (repaired) {
    console.log(`${MARKER}: ${repaired} Datei(en) repariert`);
  } else {
    console.log(`${MARKER}: keine Reparatur nötig`);
  }
  return repaired;
}

if (require.main === module) {
  runLibraryDeployRepair();
}

module.exports = { MARKER, runLibraryDeployRepair };
