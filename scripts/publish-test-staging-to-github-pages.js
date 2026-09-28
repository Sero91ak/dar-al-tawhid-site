#!/usr/bin/env node
/**
 * Veröffentlicht die Test-App auf dar-al-tawhid.de/test/ via GitHub Pages (main).
 * GitHub Pages liest main – test-library-canonical allein reicht nicht.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MAIN_BRANCH = process.env.TEST_PAGES_MAIN_BRANCH || "main";
const COMMIT_MSG =
  process.env.TEST_PAGES_COMMIT_MSG ||
  "chore(test): sync test staging from test-library-canonical for GitHub Pages";

// TEST_UI_ISOLATION_GUARD:
// Dieser Branch publiziert ausschließlich Quellen-/Bibliotheksdaten nach main.
// Test-UI, Test-Version, Manifest und Service Worker bleiben auf main autoritativ,
// damit Bibliotheks-Syncs weder die Test-App zurücksetzen noch Live-Shell-Dateien berühren.
const SYNC_FILES = [
  "test/assets/library/canonical-source-library.js",
  "data/books-library.json",
  "data/scholars-library.json",
  "data/library-authority.json",
  "data/canonical-books-index.json",
  "data/library-metadata-report.json",
  "data/library-authority-sync-report.json"
];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.silent ? "pipe" : "inherit",
    ...opts
  });
}

function runOut(cmd, args) {
  return run(cmd, args, { silent: true }).trim();
}

function ensureOnStagingBranch() {
  const branch = runOut("git", ["branch", "--show-current"]);
  if (branch !== "test-library-canonical") {
    throw new Error(
      `publish-test-staging: erwartet Branch test-library-canonical, aktuell: ${branch || "?"}`
    );
  }
}

function readBuildId() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "test/version.json"), "utf8"));
  return String(data.buildId || "");
}

function ensureGitIdentity() {
  const name = process.env.GIT_AUTHOR_NAME || "DAR AL TAWHID Deploy";
  const email = process.env.GIT_AUTHOR_EMAIL || "deploy@dar-al-tawhid.de";
  try {
    if (!runOut("git", ["config", "user.name"])) {
      run("git", ["config", "user.name", name], { silent: true });
    }
    if (!runOut("git", ["config", "user.email"])) {
      run("git", ["config", "user.email", email], { silent: true });
    }
  } catch {
    run("git", ["config", "user.name", name], { silent: true });
    run("git", ["config", "user.email", email], { silent: true });
  }
}

function main() {
  ensureOnStagingBranch();
  ensureGitIdentity();
  const buildId = readBuildId();
  if (!buildId) throw new Error("test/version.json: buildId fehlt");

  const missing = SYNC_FILES.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
  if (missing.length) {
    throw new Error(`publish-test-staging: fehlende Dateien: ${missing.join(", ")}`);
  }

  const stamp = Date.now();
  const stashName = `test-pages-sync-${stamp}`;
  const dirty = runOut("git", ["status", "--porcelain"]);
  if (dirty) {
    run("git", ["stash", "push", "-u", "-m", stashName]);
  }

  try {
    run("git", ["fetch", "origin", MAIN_BRANCH]);
    run("git", ["checkout", MAIN_BRANCH]);
    run("git", ["pull", "--ff-only", "origin", MAIN_BRANCH]);
    run("git", ["checkout", "test-library-canonical", "--", ...SYNC_FILES]);
    run("git", ["add", ...SYNC_FILES]);

    const status = runOut("git", ["status", "--porcelain"]);
    if (!status) {
      console.log(`publish-test-staging: main bereits aktuell (${buildId})`);
      return;
    }

    run("git", [
      "commit",
      "-m",
      `${COMMIT_MSG} (${buildId})`
    ]);
    run("git", ["push", "origin", MAIN_BRANCH]);
    console.log(`publish-test-staging: main gepusht – GitHub Pages sollte ${buildId} ausliefern`);
  } finally {
    run("git", ["checkout", "test-library-canonical"]);
    try {
      const stashList = runOut("git", ["stash", "list"]);
      if (stashList.includes(stashName)) run("git", ["stash", "pop"]);
    } catch {
      // Stash evtl. leer oder Konflikt – Staging-Branch unverändert lassen
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { SYNC_FILES, main };
