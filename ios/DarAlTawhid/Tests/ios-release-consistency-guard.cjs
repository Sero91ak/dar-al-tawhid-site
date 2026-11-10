#!/usr/bin/env node
/* iOS release consistency guard.
   Catches the errors that otherwise only appear minutes before an upload:
   - one target left on an old CURRENT_PROJECT_VERSION / MARKETING_VERSION
   - build number not raised above the last documented TestFlight/Store upload
   - bundle identifiers, deployment targets or required plist entries drifted
   - the shared native copy module silently dropped from the compile sources

   Usage:
     node ios/DarAlTawhid/Tests/ios-release-consistency-guard.cjs
     node ios/DarAlTawhid/Tests/ios-release-consistency-guard.cjs --strict

   `--strict` (or IOS_RELEASE_STRICT=1) turns the release-number finding into a
   hard failure, for the moment right before Product > Archive.
   This script never writes to the project. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../../..");
const IOS = path.join(ROOT, "ios/DarAlTawhid");
const PBX = path.join(IOS, "DarAlTawhid.xcodeproj/project.pbxproj");
const PLIST = path.join(IOS, "DarAlTawhid/Info.plist");
const ENTITLEMENTS = path.join(IOS, "DarAlTawhid/DarAlTawhid.entitlements");
const STATE = path.join(IOS, "release-state.json");
const COPY = path.join(IOS, "Shared/DarNativeCopy.swift");

const strict =
  process.argv.includes("--strict") || String(process.env.IOS_RELEASE_STRICT || "").trim() === "1";

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
  console.error(`IOS_RELEASE_GUARD FAIL: ${message}`);
}

function ok(message) {
  console.log(`IOS_RELEASE_GUARD OK: ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`IOS_RELEASE_GUARD WARN: ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Datei fehlt: ${path.relative(ROOT, file)}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

/* ---- project.pbxproj ----------------------------------------------------- */
const pbx = read(PBX);

function valuesOf(pattern) {
  return Array.from(pbx.matchAll(pattern)).map((match) => match[1]);
}

const builds = valuesOf(/CURRENT_PROJECT_VERSION = ([0-9]+);/g);
const versions = valuesOf(/MARKETING_VERSION = ([0-9.]+);/g);

if (!builds.length) fail("Keine CURRENT_PROJECT_VERSION im Projekt gefunden");
else {
  const unique = Array.from(new Set(builds));
  if (unique.length !== 1) {
    fail(`Build-Nummern laufen auseinander: ${unique.join(", ")} (${builds.length} Vorkommen)`);
  } else {
    ok(`Build-Nummer für alle Targets gleich: ${unique[0]}`);
  }
}

if (!versions.length) fail("Keine MARKETING_VERSION im Projekt gefunden");
else {
  const unique = Array.from(new Set(versions));
  if (unique.length !== 1) fail(`Versionsnummern laufen auseinander: ${unique.join(", ")}`);
  else if (!/^\d+\.\d+(\.\d+)?$/.test(unique[0])) fail(`MARKETING_VERSION ist keine gültige Version: ${unique[0]}`);
  else ok(`Marketing-Version für alle Targets gleich: ${unique[0]}`);
}

/* ---- bundle identifiers and deployment targets --------------------------- */
const requiredBundleIds = [
  "de.daraltawhid.app",
  "de.daraltawhid.app.widgets",
  "de.daraltawhid.app.OneSignalNotificationServiceExtension"
];
for (const id of requiredBundleIds) {
  if (pbx.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${id};`)) ok(`Bundle-ID vorhanden: ${id}`);
  else fail(`Bundle-ID fehlt im Projekt: ${id}`);
}
if (pbx.includes("de.daraltawhid.kids")) {
  fail("Kids-Bundle steckt im Erwachsenen-Projekt – Kids bleibt ein eigenes Xcode-Projekt");
}

const appTarget = valuesOf(/IPHONEOS_DEPLOYMENT_TARGET = ([0-9.]+);/g);
if (!appTarget.length) fail("Kein IPHONEOS_DEPLOYMENT_TARGET gefunden");
else {
  const unique = Array.from(new Set(appTarget)).sort();
  ok(`Deployment-Targets im Projekt: ${unique.join(", ")}`);
  if (!unique.every((value) => /^\d+\.\d+$/.test(value))) {
    fail(`Ungültiges Deployment-Target: ${unique.join(", ")}`);
  }
}

/* ---- shared native copy module must actually compile --------------------- */
if (!fs.existsSync(COPY)) fail("ios/DarAlTawhid/Shared/DarNativeCopy.swift fehlt");
else {
  const registrations = (pbx.match(/DarNativeCopy\.swift in Sources/g) || []).length;
  if (registrations < 2) {
    fail(
      `DarNativeCopy.swift ist nur in ${registrations} Sources-Phase(n) registriert – `
      + "App- und Widget-Target müssen die Datei kompilieren"
    );
  } else {
    ok(`DarNativeCopy.swift in ${registrations} Sources-Phase(n) registriert`);
  }
  if (!pbx.includes("DarNativeCopy.swift */")) fail("DarNativeCopy.swift hat keine PBXFileReference");
}

/* ---- Info.plist contract ------------------------------------------------- */
const plist = read(PLIST);
const plistChecks = [
  ["NSSupportsLiveActivities", "Live Activities sind deklariert"],
  ["NSLocationAlwaysAndWhenInUseUsageDescription", "Hintergrund-Standorttext vorhanden"],
  ["NSLocationWhenInUseUsageDescription", "Standorttext vorhanden"],
  ["NSMotionUsageDescription", "Bewegungstext für Qibla vorhanden"],
  ["daraltawhid", "Deep-Link-Schema daraltawhid vorhanden"],
  ["UIApplicationShortcutItems", "Quick Actions vorhanden"]
];
for (const [needle, label] of plistChecks) {
  if (plist.includes(needle)) ok(label);
  else fail(`Info.plist: ${needle} fehlt`);
}

for (const mode of ["remote-notification", "location", "audio"]) {
  if (plist.includes(`<string>${mode}</string>`)) ok(`UIBackgroundMode ${mode} vorhanden`);
  else fail(`Info.plist: UIBackgroundMode ${mode} fehlt`);
}

if (/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(plist)) {
  ok("Keine nicht ausgenommene Verschlüsselung deklariert");
} else {
  warn("ITSAppUsesNonExemptEncryption ist nicht als false deklariert – Export-Compliance prüfen");
}

if (/<key>CFBundleDisplayName<\/key>\s*<string>DĀR AL TAWḤĪD<\/string>/.test(plist)) {
  ok("Anzeigename DĀR AL TAWḤĪD korrekt");
} else {
  warn("CFBundleDisplayName entspricht nicht exakt „DĀR AL TAWḤĪD“");
}

/* ---- entitlements -------------------------------------------------------- */
const entitlements = read(ENTITLEMENTS);
if (entitlements.includes("group.de.daraltawhid.app")) ok("App-Group der Widgets vorhanden");
else fail("Entitlements: App-Group group.de.daraltawhid.app fehlt");
if (entitlements.includes("aps-environment")) ok("Push-Entitlement vorhanden");
else fail("Entitlements: aps-environment fehlt");

/* ---- release number vs. documented last upload --------------------------- */
let state = null;
if (!fs.existsSync(STATE)) {
  warn("ios/DarAlTawhid/release-state.json fehlt – Upload-Historie nicht prüfbar");
} else {
  try {
    state = JSON.parse(fs.readFileSync(STATE, "utf8"));
  } catch (error) {
    fail(`release-state.json ist ungültig: ${error.message || error}`);
  }
}

if (state && builds.length) {
  const build = Number(builds[0]);
  const last = Number(state.lastUploadedBuild);
  if (!Number.isFinite(last)) {
    warn("release-state.json enthält keine gültige lastUploadedBuild");
  } else if (Number.isFinite(build) && build <= last) {
    const message =
      `Build-Nummer ${build} ist nicht über dem letzten dokumentierten Upload (${last}). `
      + `Vor Product > Archive auf mindestens ${last + 1} setzen und release-state.json erst `
      + "nach dem erfolgreichen Upload aktualisieren.";
    if (strict) fail(message);
    else warn(`${message} (--strict macht daraus einen Fehler)`);
  } else {
    ok(`Build-Nummer ${build} liegt über dem letzten dokumentierten Upload (${last})`);
  }
}

/* ---- result -------------------------------------------------------------- */
if (failures.length) {
  console.error(`\n${failures.length} iOS-Release-Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}
console.log(
  `\niOS-Release-Konsistenz: bestanden${warnings.length ? ` (${warnings.length} Hinweis(e))` : ""} – kein Xcode-Build, nur Projektkonsistenz`
);
