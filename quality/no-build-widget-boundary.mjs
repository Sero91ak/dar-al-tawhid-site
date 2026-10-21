#!/usr/bin/env node
/**
 * DAR AL TAWḤĪD — No-Build Native/Widget Boundary Guard.
 *
 * Read-only inspection of the proposed Git diff. Never builds, deploys,
 * publishes, changes build numbers or edits source files.
 *
 * Usage: node quality/no-build-widget-boundary.mjs origin/main
 */
import { execFileSync } from "node:child_process";

const base = process.argv[2] || process.env.NO_BUILD_BASE_REF || "origin/main";
const marker = "DAR_NO_BUILD_WIDGET_BOUNDARY";
const protectedPaths = [
  /^ios\//i,
  /^android\//i,
  /^apple-tv\//i,
  /^tv\//i,
  /^widgets\//i,
  /^cloudflare\//i,
  /^\.github\/workflows\//i,
  /^(?:index\.html|version\.json|service-worker\.js|manifest(?:-staging)?\.json|wrangler(?:\.test)?\.toml|package(?:-lock)?\.json)$/i,
  /^content\/admin\//i,
  /^assets\/(?:dar-widget|dar-setup-hub|qibla-quick-view|dar-quran-player)/i,
  /^test\/assets\/(?:dar-widget|dar-setup-hub|qibla-quick-view)/i,
  /^test\/(?:service-worker\.js|manifest\.json|version\.json)$/i,
];
const normalize = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");

let changes;
try {
  changes = execFileSync("git", [
    "diff", "--name-only", "--diff-filter=ACMRD", base + "...HEAD"
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    .split(/\r?\n/).map(normalize).filter(Boolean);
} catch (error) {
  console.error(marker + " ERROR: Diff konnte nicht sicher geprüft werden.");
  console.error(String(error.stderr || error.message || error).trim());
  process.exit(2);
}

const protectedChanges = changes.filter((path) =>
  protectedPaths.some((pattern) => pattern.test(path))
);
if (protectedChanges.length) {
  console.error(marker + " BLOCKED: 'No-Build' darf keine nativen, Widget-, Push- oder Release-Pfade ändern:");
  for (const path of protectedChanges) console.error(" - " + path);
  console.error("Änderungen separat prüfen; kein automatischer Merge/Deploy.");
  process.exit(1);
}

console.log(marker + " PASS: " + changes.length + " geänderte Datei(en); keine geschützten Pfade betroffen.");
