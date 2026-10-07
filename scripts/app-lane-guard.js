#!/usr/bin/env node
/**
 * APP_LANE_GUARD
 * Eine Nutzer-Vorgabe für mehrere Apps wird in getrennten Commits gebaut.
 * Ein Commit darf nur eine App-Spur ändern, damit Kids, Web, Test und Apple TV
 * nicht denselben Push-/Deploy-Weg blockieren.
 *
 * Ausnahme im Commit: lanes-multi-freigabe
 */
"use strict";

const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const MARKER = "APP_LANE_GUARD";

const LANES = {
  kids: {
    label: "Kids-App",
    patterns: [
      /^kids\//,
      /^ios\/DarAlTawhidKids\//,
      /^scripts\/kids-/,
      /^KIDS\.md$/
    ]
  },
  visitor: {
    label: "Besucher-Web-App",
    patterns: [
      /^index\.html$/,
      /^version\.json$/,
      /^service-worker\.js$/,
      /^manifest\.json$/,
      /^assets\//,
      /^desktop-preview\//,
      /^content\/posts\//,
      /^content\/updates\//,
      /^ios\/DarAlTawhid\//
    ]
  },
  test: {
    label: "Dar Test",
    patterns: [/^test\//]
  },
  appletv: {
    label: "Apple TV",
    patterns: [/^apple-tv\//]
  },
  admin: {
    label: "Admin / Voice Studio",
    patterns: [/^admin\//, /^voice-studio\//]
  }
};

const SHARED = [
  /^scripts\/app-lane-guard\.js$/,
  /^content\/admin\/change-scope-lock\.json$/,
  /^AGENTS\.md$/,
  /^\.github\/workflows\//,
  /^wrangler\.toml$/,
  /^cloudflare\/site-router\.js$/,
  /^cloudflare\/preview-gate\.js$/,
  /^cloudflare\/test-app-worker\.js$/,
  /^_headers$/,
  /^_redirects$/,
  /^package\.json$/,
  /^package-lock\.json$/
];

function fail(msg) {
  console.error(MARKER + " FAIL: " + msg);
  process.exit(1);
}

function ok(msg) {
  console.log(MARKER + " OK: " + msg);
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

function resolveBaseRef() {
  const fromEnv = String(process.env.INTEGRITY_BASE_REF || process.env.GITHUB_EVENT_BEFORE || "").trim();
  if (fromEnv && fromEnv !== "0000000000000000000000000000000000000000") {
    try {
      execSync("git rev-parse --verify " + fromEnv + "^{commit}", { cwd: ROOT, stdio: "pipe" });
      return fromEnv;
    } catch (e) {}
  }
  const parent = gitLines("git rev-parse HEAD~1");
  return parent[0] || null;
}

function changedFiles(baseRef) {
  const files = new Set();
  const add = (list) => list.map(normalizePath).filter(Boolean).forEach((file) => files.add(file));
  if (baseRef) add(gitLines("git diff --name-only " + baseRef + " HEAD"));
  add(gitLines("git diff --name-only HEAD"));
  add(gitLines("git diff --name-only --cached HEAD"));
  return Array.from(files);
}

function isShared(file) {
  return SHARED.some((re) => re.test(file));
}

function lanesFor(file) {
  const hit = [];
  for (const [id, lane] of Object.entries(LANES)) {
    if (lane.patterns.some((re) => re.test(file))) hit.push(id);
  }
  return hit;
}

function commitMessage() {
  const envMsg = String(process.env.GITHUB_COMMIT_MESSAGE || "").trim();
  if (envMsg) return envMsg;
  const log = gitLines("git log -1 --pretty=%B");
  return log.join("\n");
}

function allowsMulti(message) {
  return /lanes-multi-freigabe/i.test(message);
}

const baseRef = resolveBaseRef();
const files = changedFiles(baseRef);
if (!files.length) {
  ok("keine Dateiänderung");
  process.exit(0);
}

const byLane = {};
const sharedFiles = [];
const unknown = [];
for (const file of files) {
  if (isShared(file)) {
    sharedFiles.push(file);
    continue;
  }
  const lanes = lanesFor(file);
  if (!lanes.length) {
    unknown.push(file);
    continue;
  }
  for (const id of lanes) {
    byLane[id] = byLane[id] || [];
    byLane[id].push(file);
  }
}

const used = Object.keys(byLane);
if (used.length <= 1) {
  const name = used[0] ? LANES[used[0]].label : "nur gemeinsame Infrastruktur";
  ok("eine Spur: " + name + " (" + files.length + " Datei(en))");
  process.exit(0);
}

if (allowsMulti(commitMessage())) {
  ok("mehrere Spuren mit lanes-multi-freigabe: " + used.map((id) => LANES[id].label).join(", "));
  process.exit(0);
}

const detail = used.map(function (id) {
  return LANES[id].label + ": " + byLane[id].slice(0, 8).join(", ");
}).join(" | ");
fail(
  "Dieser Commit mischt " + used.length + " Apps (" +
  used.map((id) => LANES[id].label).join(" + ") +
  "). Jede App braucht einen eigenen Commit und eigenen Deploy-Weg. " +
  "Bei einer Vorgabe für mehrere Apps: zuerst Kids, dann Web, dann Test, dann Apple TV. " +
  "Nur mit ausdrücklichem Marker lanes-multi-freigabe in einer Datei. " +
  detail
);
