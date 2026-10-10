#!/usr/bin/env node
/**
 * PUBLIC_WEBSITE_ISOLATION_GUARD
 * Blockiert Deploys, bei denen Website, native App und PWA wieder denselben
 * Navigation-Fallback teilen oder die öffentliche Website-Shell beschädigt ist.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "PUBLIC_WEBSITE_ISOLATION_GUARD";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function check(ok, message) {
  if (ok) {
    console.log(`${MARKER} OK: ${message}`);
    return;
  }
  console.error(`${MARKER} FAIL: ${message}`);
  process.exitCode = 1;
}

const sw = read("service-worker.js");
const router = read("cloudflare/site-router.js");
const desktop = read("desktop-preview/index.html");
const desktopJs = read("desktop-preview/desktop-overhaul.js");

check(sw.includes("PUBLIC_WEBSITE_NETWORK_ONLY_V1"), "Website hat eigenen Network-only Navigationsweg");
check(sw.includes("!fromPwa && !explicitPwa && !nativeDar"), "Website/PWA/native Navigation sind getrennt");
check(router.includes('headers.set("X-Dar-Surface", "public-website")'), "öffentliche Website besitzt eindeutige Surface-Kennung");
check(router.includes('const target = new URL("/desktop-preview/", url.origin);'), "Browser-Root zeigt auf die öffentliche Website");
check(router.includes("isRoot && wantsPublicWebsite(request)"), "öffentliche Root-Route ist aktiv");

check(desktop.length > 200000, "Website-Hauptdatei ist vollständig");
check(desktop.includes("DĀR AL TAWḤĪD"), "Website-Branding vorhanden");
check(desktop.includes("desktop-overhaul.js"), "Website-Interaktionsskript eingebunden");

const openScripts = (desktop.match(/<script\b/gi) || []).length;
const closeScripts = (desktop.match(/<\/script>/gi) || []).length;
check(openScripts === closeScripts, "Script-Tags der Website sind ausgeglichen");

const inlineScripts = [...desktop.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((m) => !/\bsrc\s*=/.test(m[1] || ""))
  .map((m) => m[2])
  .filter((code) => code.trim());

for (let i = 0; i < inlineScripts.length; i += 1) {
  try {
    new Function(inlineScripts[i]);
  } catch (error) {
    console.error(`${MARKER} FAIL: Inline-Script ${i + 1}: ${error.message}`);
    process.exitCode = 1;
  }
}

try {
  new Function(desktopJs);
  console.log(`${MARKER} OK: desktop-overhaul.js Syntax`);
} catch (error) {
  console.error(`${MARKER} FAIL: desktop-overhaul.js: ${error.message}`);
  process.exitCode = 1;
}

if (!process.exitCode) console.log(`${MARKER}: Website-Sperre aktiv`);
