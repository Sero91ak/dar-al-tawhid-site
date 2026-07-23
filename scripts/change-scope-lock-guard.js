#!/usr/bin/env node
/**
 * CHANGE_SCOPE_LOCK_GUARD
 * Blockiert Commits/Deploys außerhalb freigeschalteter Bereiche, solange globalLock aktiv ist.
 * Steuerung: content/admin/change-scope-lock.json
 *
 * Usage: node scripts/change-scope-lock-guard.js
 * Env: INTEGRITY_BASE_REF, GITHUB_EVENT_BEFORE
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const LOCK_PATH = "content/admin/change-scope-lock.json";
const MARKER = "CHANGE_SCOPE_LOCK_GUARD";

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
}

function readLock() {
  const full = path.join(ROOT, LOCK_PATH);
  if (!fs.existsSync(full)) {
    fail(`${LOCK_PATH} fehlt`);
  }
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (error) {
    fail(`${LOCK_PATH} ist ungültig: ${error.message || error}`);
  }
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

function resolveBaseRef() {
  const fromEnv = String(process.env.INTEGRITY_BASE_REF || process.env.GITHUB_EVENT_BEFORE || "").trim();
  if (fromEnv && fromEnv !== "0000000000000000000000000000000000000000") {
    try {
      execSync(`git rev-parse --verify ${fromEnv}^{commit}`, { cwd: ROOT, stdio: "pipe" });
      return fromEnv;
    } catch (e) {}
  }
  const parent = gitLines("git rev-parse HEAD~1");
  return parent[0] || null;
}

function changedFiles(baseRef) {
  const files = new Set();
  const add = (list) => list.map(normalizePath).filter(Boolean).forEach((file) => files.add(file));
  const inCi = Boolean(
    String(process.env.GITHUB_ACTIONS || "").trim() === "true"
    || String(process.env.INTEGRITY_BASE_REF || "").trim()
    || String(process.env.GITHUB_EVENT_BEFORE || "").trim()
  );
  if (inCi && baseRef) add(gitLines(`git diff --name-only ${baseRef} HEAD`));
  add(gitLines("git diff --name-only HEAD"));
  add(gitLines("git diff --name-only --cached HEAD"));
  return Array.from(files);
}

function normalizePath(file) {
  return String(file || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function matchesPath(file, pattern) {
  const normalized = normalizePath(file);
  const rule = normalizePath(pattern);
  if (!rule) return false;
  if (rule.endsWith("/")) return normalized === rule.slice(0, -1) || normalized.startsWith(rule);
  return normalized === rule || normalized.startsWith(`${rule}/`);
}

function isAllowed(file, lock) {
  const normalized = normalizePath(file);
  const alwaysAllowed = Array.isArray(lock.alwaysAllowed) ? lock.alwaysAllowed : [];
  if (alwaysAllowed.some((pattern) => matchesPath(normalized, pattern))) return true;

  const now = Date.now();
  const scopes = Array.isArray(lock.unlockedScopes) ? lock.unlockedScopes : [];
  for (const scope of scopes) {
    const expiresAt = Date.parse(String(scope.expiresAt || ""));
    if (Number.isFinite(expiresAt) && expiresAt < now) continue;
    const paths = Array.isArray(scope.paths) ? scope.paths : [];
    if (paths.some((pattern) => matchesPath(normalized, pattern))) return true;
  }
  return false;
}

function isProtected(file, lock) {
  const normalized = normalizePath(file);
  const prefixes = Array.isArray(lock.protectedPrefixes) ? lock.protectedPrefixes : [];
  return prefixes.some((pattern) => matchesPath(normalized, pattern));
}

function runChangeScopeLockGuard() {
  const lock = readLock();
  if (!lock.globalLock) {
    ok("globalLock ist deaktiviert – keine Bereichssperre aktiv");
    return;
  }

  const baseRef = resolveBaseRef();
  const files = changedFiles(baseRef).map(normalizePath).filter(Boolean);
  if (!files.length) {
    ok("Keine geänderten Dateien im Diff");
    return;
  }

  const blocked = [];
  for (const file of files) {
    if (!isProtected(file, lock)) continue;
    if (!isAllowed(file, lock)) blocked.push(file);
  }

  if (blocked.length) {
    fail(
      `Globale Änderungssperre aktiv (${LOCK_PATH}). Blockierte Dateien ohne Freigabe: ${blocked.join(", ")}. `
      + "Nur nach ausdrücklichem Nutzer-Auftrag einen Eintrag in unlockedScopes hinzufügen."
    );
  }

  ok(`globalLock aktiv – ${files.length} geänderte Datei(en) innerhalb erlaubter Bereiche`);
}

runChangeScopeLockGuard();
