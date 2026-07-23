#!/usr/bin/env node
/**
 * REPO INTEGRITY GUARD FINAL
 * Blockiert Deploy/Merge bei Massen-Löschung oder fehlenden Kern-Dateien.
 * Verhindert Wiederholung des 07a66819-Vorfalls (~2700 gelöschte Dateien).
 *
 * Usage: node scripts/repo-integrity-guard.js
 * Optional env:
 *   INTEGRITY_BASE_REF – Git-Basis für Diff (z. B. github.event.before)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const GUARD_MARKER = "REPO INTEGRITY GUARD FINAL";

const MIN_TRACKED_FILES = 2000;
const MAX_DELETIONS_IN_DIFF = 80;

const CRITICAL_FILES = [
  { rel: "index.html", minBytes: 400_000 },
  { rel: "test/index.html", minBytes: 400_000 },
  { rel: "admin/index.html", minBytes: 80_000 },
  { rel: "assets/live-boot.js", minBytes: 500 },
  { rel: "content/posts/posts-index.json", minBytes: 200 },
  { rel: "content/updates/daily.json", minBytes: 50 },
  { rel: "manifest.json", minBytes: 50 },
  { rel: "test/manifest.json", minBytes: 50 },
  { rel: "service-worker.js", minBytes: 1_000 },
  { rel: "admin/sw.js", minBytes: 200 },
  { rel: "cloudflare/worker.js", minBytes: 20_000 },
  { rel: "wrangler.toml", minBytes: 50 },
  { rel: "scripts/app-health-check.js", minBytes: 500 },
  { rel: "push/onesignal/OneSignalSDKWorker.js", minBytes: 50 },
];

const CRITICAL_DIRS = [
  { rel: "assets", minFiles: 1000 },
  { rel: "content/posts", minFiles: 300 },
  { rel: "content/duas", minFiles: 1 },
  { rel: "content/quran", minFiles: 1 },
  { rel: "admin", minFiles: 8 },
  { rel: "cloudflare", minFiles: 20 },
  { rel: "scripts", minFiles: 35 },
  { rel: "data", minFiles: 3 },
  { rel: ".github/workflows", minFiles: 10 },
];

const NEVER_DELETE_PREFIXES = [
  "admin/",
  "assets/live-boot.js",
  "assets/premium-feed-app.js",
  "content/posts/",
  "cloudflare/worker.js",
  "scripts/app-health-check.js",
  "scripts/push-system-guard.js",
  "scripts/prayer-push-loop-guard.js",
  "content/admin/prayer-push-scheduler-lock.json",
  "content/admin/header-prayer-display-lock.json",
  "scripts/header-prayer-display-guard.js",
  "scripts/version-update-guard.js",
  "manifest.json",
  "wrangler.toml",
];

function fail(msg) {
  console.error("REPO-INTEGRITY-GUARD FAIL:", msg);
  return 1;
}

function ok(msg) {
  console.log("REPO-INTEGRITY-GUARD OK:", msg);
}

function abs(rel) {
  return path.join(ROOT, rel);
}

function gitLines(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch (e) {
    return null;
  }
}

function countTrackedFiles() {
  const lines = gitLines("git ls-files");
  return lines ? lines.length : 0;
}

function countTrackedInDir(relDir) {
  const prefix = relDir.replace(/\/$/, "") + "/";
  const lines = gitLines("git ls-files");
  if (!lines) return 0;
  return lines.filter((line) => line === relDir || line.startsWith(prefix)).length;
}

function resolveBaseRef() {
  const fromEnv = String(process.env.INTEGRITY_BASE_REF || process.env.GITHUB_EVENT_BEFORE || "").trim();
  if (fromEnv && fromEnv !== "0000000000000000000000000000000000000000") {
    try {
      execSync(`git rev-parse --verify ${fromEnv}^{commit}`, { cwd: ROOT, stdio: "pipe" });
      return fromEnv;
    } catch (e) {}
  }
  const parent = gitLines("git rev-parse HEAD~1");
  return parent && parent[0] ? parent[0] : null;
}

function collectDiffDeletions(baseRef) {
  if (!baseRef) return { deletions: [], deletionCount: 0 };
  const lines = gitLines(`git diff --name-status ${baseRef} HEAD`);
  if (!lines) return { deletions: [], deletionCount: 0 };
  const deletions = [];
  lines.forEach((line) => {
    const parts = line.split("\t");
    const status = parts[0] || "";
    if (!status.startsWith("D")) return;
    const file = parts[parts.length - 1];
    if (file) deletions.push(file);
  });
  return { deletions, deletionCount: deletions.length };
}

function runRepoIntegrityGuard() {
  let failed = 0;
  const bump = (n) => {
    failed += n;
  };

  if (!fs.readFileSync(__filename, "utf8").includes(GUARD_MARKER)) {
    bump(fail("Guard-Datei ohne Pflicht-Marker – nicht vereinfachen."));
  } else {
    ok("Guard-Marker vorhanden");
  }

  for (const item of CRITICAL_FILES) {
    const filePath = abs(item.rel);
    if (!fs.existsSync(filePath)) {
      bump(fail(`Kern-Datei fehlt: ${item.rel}`));
      continue;
    }
    const size = fs.statSync(filePath).size;
    if (size < item.minBytes) {
      bump(fail(`${item.rel} zu klein (${size} B, min ${item.minBytes} B)`));
    } else {
      ok(`${item.rel} vorhanden (${size} B)`);
    }
  }

  for (const dir of CRITICAL_DIRS) {
    const dirPath = abs(dir.rel);
    if (!fs.existsSync(dirPath)) {
      bump(fail(`Kern-Ordner fehlt: ${dir.rel}/`));
      continue;
    }
    const count = countTrackedInDir(dir.rel);
    if (count < dir.minFiles) {
      bump(fail(`${dir.rel}/ hat nur ${count} getrackte Dateien (min ${dir.minFiles})`));
    } else {
      ok(`${dir.rel}/: ${count} Dateien`);
    }
  }

  const tracked = countTrackedFiles();
  if (tracked < MIN_TRACKED_FILES) {
    bump(fail(`Nur ${tracked} getrackte Dateien im Repo (min ${MIN_TRACKED_FILES})`));
  } else {
    ok(`Getrackte Dateien gesamt: ${tracked}`);
  }

  const baseRef = resolveBaseRef();
  if (baseRef) {
    const { deletions, deletionCount } = collectDiffDeletions(baseRef);
    if (deletionCount > MAX_DELETIONS_IN_DIFF) {
      bump(
        fail(
          `${deletionCount} gelöschte Dateien seit ${baseRef.slice(0, 7)} (max ${MAX_DELETIONS_IN_DIFF}). Massen-Löschung blockiert.`
        )
      );
    } else if (deletionCount > 0) {
      ok(`Diff-Löschungen: ${deletionCount} (unter Limit ${MAX_DELETIONS_IN_DIFF})`);
    } else {
      ok(`Keine Datei-Löschungen im Diff (${baseRef.slice(0, 7)}…HEAD)`);
    }

    const blocked = deletions.filter((file) =>
      NEVER_DELETE_PREFIXES.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix))
    );
    if (blocked.length) {
      bump(
        fail(
          `Geschützte Pfade würden gelöscht: ${blocked.slice(0, 12).join(", ")}${blocked.length > 12 ? " …" : ""}`
        )
      );
    } else if (deletionCount > 0) {
      ok("Keine geschützten Kern-Pfade im Diff gelöscht");
    }
  } else {
    ok("Diff-Prüfung übersprungen (keine Basis-Revision)");
  }

  return failed;
}

if (require.main === module) {
  const failed = runRepoIntegrityGuard();
  if (failed) {
    console.error(`\n${failed} Repo-Integritäts-Prüfung(en) fehlgeschlagen – Deploy/Merge blockiert.`);
    console.error("Siehe scripts/repo-integrity-guard.js und STABILITY.md (Massen-Lösch-Schutz).");
    process.exit(1);
  }
  console.log("\nRepo-Integrität: alle Prüfungen bestanden.");
}

module.exports = { runRepoIntegrityGuard, GUARD_MARKER };
