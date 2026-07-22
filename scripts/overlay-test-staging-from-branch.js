#!/usr/bin/env node
/**
 * Legt Test-App-Staging-Dateien aus test-library-canonical über main-Deploy.
 * Verhindert, dass häufige main-Deploys die Test-App wieder entfernen.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BRANCH = process.env.TEST_STAGING_BRANCH || "test-library-canonical";
const REMOTE_REF = `origin/${BRANCH}`;

const OVERLAY_FILES = [
  "test/index.html",
  "test/version.json",
  "test/assets/library/canonical-source-library.js",
  "test/assets/library/canonical-library-addon.js",
  "data/books-library.json",
  "data/scholars-library.json",
  "data/library-authority.json",
  "data/canonical-books-index.json",
  "data/library-metadata-report.json",
  "data/library-authority-sync-report.json",
  "scripts/build-canonical-books-index.js",
  "scripts/sync-library-authority-from-posts.js",
  "scripts/cf-pages-build.js",
  "scripts/generate-qsrc-covers.js",
  "scripts/patch-test-canonical-library.js"
];

const OVERLAY_DIRS = [
  "test/assets/library/covers/qsrc",
  "assets/library/covers/qsrc"
];

function runGit(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function fileExistsOnRef(ref, file) {
  try {
    runGit(["cat-file", "-e", `${ref}:${file}`]);
    return true;
  } catch {
    return false;
  }
}

function listFilesOnRef(ref, dir) {
  try {
    const out = runGit(["ls-tree", "-r", "--name-only", ref, "--", dir]);
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function main() {
  try {
    runGit(["rev-parse", "--verify", REMOTE_REF]);
  } catch {
    throw new Error(
      `Test-Staging-Branch ${REMOTE_REF} nicht gefunden. ` +
        `Bitte git fetch origin ${BRANCH} ausführen.`
    );
  }

  const present = OVERLAY_FILES.filter((file) => fileExistsOnRef(REMOTE_REF, file));
  const missing = OVERLAY_FILES.filter((file) => !present.includes(file));
  const coverFiles = OVERLAY_DIRS.flatMap((dir) => listFilesOnRef(REMOTE_REF, dir));
  const checkoutFiles = [...new Set([...present, ...coverFiles])];
  if (!present.length) {
    throw new Error(`Keine Test-Staging-Dateien auf ${REMOTE_REF} gefunden.`);
  }

  runGit(["checkout", REMOTE_REF, "--", ...checkoutFiles]);
  console.log(
    `overlay-test-staging: ${present.length} Datei(en) + ${coverFiles.length} Cover von ${REMOTE_REF} übernommen`
  );
  if (missing.length) {
    console.log(`overlay-test-staging: optional fehlend (${missing.length}): ${missing.join(", ")}`);
  }

  const required = [
    "test/index.html",
    "test/assets/library/canonical-source-library.js",
    "data/books-library.json"
  ];
  for (const file of required) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      throw new Error(`overlay-test-staging: Pflichtdatei fehlt nach Overlay: ${file}`);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { OVERLAY_FILES, OVERLAY_DIRS, main };
