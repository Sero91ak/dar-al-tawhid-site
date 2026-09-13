#!/usr/bin/env node
/**
 * PUSH_LANES_GUARD
 * Globale OneSignal-/Push-Sperre mit getrennten Push-Spuren.
 * Jede Änderung braucht eine globale und eine spurbezogene Nutzer-Freigabe.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const LOCK_PATH = "content/admin/push-lanes-lock.json";
const MARKER = "PUSH_LANES_GUARD";

let failures = 0;

function fail(msg) {
  failures += 1;
  console.error(`${MARKER} FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function gitLines(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

function normalizePath(file) {
  return String(file || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function matchesPath(file, pattern) {
  const normalized = normalizePath(file);
  const rule = normalizePath(pattern);
  if (!rule) return false;
  if (rule.endsWith("/")) return normalized === rule.slice(0, -1) || normalized.startsWith(rule);
  if (rule.includes("*")) {
    const re = new RegExp("^" + rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    return re.test(normalized);
  }
  return normalized === rule || normalized.startsWith(`${rule}/`);
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
  return parent[0] || "HEAD";
}

function changedFiles(baseRef) {
  const files = new Set();
  const add = (list) => list.map(normalizePath).filter(Boolean).forEach((file) => files.add(file));
  if (baseRef) add(gitLines(`git diff --name-only ${baseRef} HEAD`));
  add(gitLines("git diff --name-only HEAD"));
  add(gitLines("git diff --name-only --cached HEAD"));
  return Array.from(files);
}

function fileDiff(baseRef, file) {
  const chunks = [];
  if (baseRef) chunks.push(gitLines(`git diff ${baseRef} HEAD -- ${file}`).join("\n"));
  chunks.push(gitLines(`git diff HEAD -- ${file}`).join("\n"));
  chunks.push(gitLines(`git diff --cached HEAD -- ${file}`).join("\n"));
  return chunks.filter(Boolean).join("\n");
}

function rawCommitMessage() {
  let msg = String(process.env.GITHUB_COMMIT_MESSAGE || process.env.COMMIT_MESSAGE || "");
  if (!msg) {
    try {
      msg = execSync("git log -1 --pretty=%B", { cwd: ROOT, encoding: "utf8" });
    } catch (e) {
      msg = "";
    }
  }
  return msg;
}

function commitMessage() {
  return rawCommitMessage().toLowerCase();
}

function laneUnlocked(lane, message) {
  const phrases = Array.isArray(lane.unlockPhrases) ? lane.unlockPhrases : [];
  return phrases.some((p) => message.includes(String(p).toLowerCase()));
}

function globalUnlocked(lock, message) {
  const phrases = Array.isArray(lock.globalUnlockPhrases) ? lock.globalUnlockPhrases : [];
  return phrases.some((p) => message.includes(String(p).toLowerCase()));
}

function extractUnlockPassword(message) {
  const match = String(message || "").match(/push-password:([^\s]+)/i);
  if (match && match[1]) return match[1];
  return String(process.env.DAR_PUSH_UNLOCK_PASSWORD || "").trim();
}

function passwordUnlocked(lock, message) {
  if (lock.passwordRequired !== true) return true;
  const expected = String(lock.unlockPasswordSha256 || "").trim().toLowerCase();
  if (!expected || expected.length < 64) return false;
  const raw = extractUnlockPassword(message);
  if (!raw) return false;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return hash === expected;
}

function pathInLane(file, lane) {
  const paths = Array.isArray(lane.paths) ? lane.paths : [];
  return paths.some((pattern) => matchesPath(file, pattern));
}

function changedHunkText(diffText) {
  return String(diffText || "")
    .split("\n")
    .filter((line) => (line.startsWith("+") || line.startsWith("-")) && !line.startsWith("+++") && !line.startsWith("---"))
    .join("\n");
}

function diffHitsLane(file, lane, diffText) {
  const markers = lane.diffMarkers && lane.diffMarkers[file];
  if (!markers || !diffText) return false;
  const changed = changedHunkText(diffText);
  return markers.some((needle) => changed.includes(needle));
}

function runPushLanesGuard() {
  const full = path.join(ROOT, LOCK_PATH);
  if (!fs.existsSync(full)) {
    fail(`${LOCK_PATH} fehlt`);
    return failures;
  }

  let lock;
  try {
    lock = JSON.parse(read(LOCK_PATH));
  } catch (e) {
    fail(`${LOCK_PATH} ungültig: ${e.message || e}`);
    return failures;
  }

  if (lock.locked !== true) {
    fail("Globale Push-Sperre darf nicht deaktiviert werden");
    return failures;
  }

  const requiredApp = lock.requiredAppMarkers || {};
  for (const [file, needles] of Object.entries(requiredApp)) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      fail(`Datei fehlt: ${file}`);
      continue;
    }
    const content = read(file);
    for (const needle of needles) {
      if (!content.includes(needle)) fail(`${file}: Pflicht-Marker fehlt: ${needle}`);
    }
    ok(`${file}: Spur-Marker vorhanden`);
  }

  const lanes = lock.lanes || {};
  const baseRef = resolveBaseRef();
  const files = changedFiles(baseRef);
  const rawMessage = rawCommitMessage();
  const message = rawMessage.toLowerCase();
  const touched = [];

  for (const [id, lane] of Object.entries(lanes)) {
    let hit = false;
    for (const file of files) {
      if (pathInLane(file, lane)) {
        hit = true;
        break;
      }
      const diff = fileDiff(baseRef, file);
      if (diffHitsLane(file, lane, diff)) {
        hit = true;
        break;
      }
    }
    if (hit) touched.push(id);
  }

  if (!touched.length) {
    ok("Keine Push-Spur im Diff");
    return failures;
  }

  ok(`Berührte Spuren: ${touched.join(", ")}`);

  if (lock.passwordRequired === true && !passwordUnlocked(lock, rawMessage)) {
    fail(
      "Push-Kennwort fehlt oder ist falsch. Ohne Kennwort und ohne ausdrückliche Nutzer-Anfrage darf kein OneSignal-/Push-Code geändert werden. "
      + "Commit muss enthalten: push-password:<Kennwort>"
    );
  } else if (lock.passwordRequired === true) {
    ok("Push-Kennwort bestätigt");
  }

  if (lock.globalApprovalRequired === true && !globalUnlocked(lock, message)) {
    fail(
      "Globale Push-Sperre: Push-Code wurde geändert, aber die ausdrückliche globale Nutzer-Freigabe fehlt. "
      + `Commit muss enthalten: ${(lock.globalUnlockPhrases || []).join(" / ")}`
    );
  } else if (lock.globalApprovalRequired === true) {
    ok("Globale Push-Freigabe vorhanden");
  }

  for (const id of touched) {
    const lane = lanes[id];
    if (!laneUnlocked(lane, message)) {
      fail(
        `Spur „${lane.label || id}“ wurde geändert ohne Nutzer-Befehl. `
        + `Commit muss enthalten: ${(lane.unlockPhrases || []).join(" / ")}`
      );
    } else {
      ok(`Spur „${lane.label || id}“ mit Freigabe`);
    }
  }

  if (touched.length > 1) {
    const onlyMetaPlusOne = touched.length === 2 && touched.includes("lock-meta");
    if (!onlyMetaPlusOne && !message.includes("push-lanes-multi-freigabe")) {
      fail(
        `Mehrere Push-Spuren in einem Commit (${touched.join(", ")}). `
        + "Getrennt halten oder ausdrücklich „push-lanes-multi-freigabe“ setzen."
      );
    }
  }

  return failures;
}

if (require.main === module) {
  const failed = runPushLanesGuard();
  if (failed) {
    console.error(`\n${failed} Push-Spuren-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nPush-Spuren-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runPushLanesGuard, MARKER };
