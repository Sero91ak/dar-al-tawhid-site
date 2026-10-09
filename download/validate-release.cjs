#!/usr/bin/env node
"use strict";

/**
 * DAR Android Website Distribution Guard.
 * This script must pass before any public APK is linked from /download/.
 *
 * Static release manifests are blocked from advertising debug packages,
 * missing binaries, third-party URLs, or Kids testing builds.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const file = fs.readFileSync(path.join(__dirname, "releases.json"), "utf8");
const manifest = JSON.parse(file);
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const links = fs.readFileSync(path.join(root, "links/index.html"), "utf8");
const pwaManifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

assert.equal(manifest.schemaVersion, 1);
assert.ok(manifest.apps && typeof manifest.apps === "object");
assert.ok(html.includes('id="apk-adult"') && html.includes('id="apk-tv"'));
assert.ok(html.includes('id="release-info-adult"') && html.includes('id="release-info-tv"'), "Release versions and dates must exist");
assert.ok(html.includes('id="release-sha-adult"') && html.includes('id="release-sha-tv"'), "SHA256 links must be visible");
assert.ok(html.includes('id="installation"') && html.includes('id="sicherheit"'), "Safe install and security help missing");
assert.ok(html.includes('/download/official-release-links.js'), "Official release switchboard missing");
assert.ok(links.includes('id="native-downloads-title"') && links.includes('id="direct-android-meta"') && links.includes('id="direct-android-tv-meta"'), "Apple-adjacent Android version and release date cards missing");

const publicRouterPath = path.join(root, "cloudflare/site-router.js");
let router = "";
if (fs.existsSync(publicRouterPath)) {
  router = fs.readFileSync(publicRouterPath, "utf8");
  assert.ok(router.includes('id="darIosAppStorePromo"'), "Existing iOS promotion must remain");
  assert.ok(router.includes("window.darInstallAndroidPwa=async function"), "Main website Android PWA installer missing");
  assert.ok(router.includes("__darEarlyInstallPrompt"), "Early Android beforeinstallprompt capture missing");
  assert.ok(router.includes("var installEvent=window.__darEarlyInstallPrompt||deferredInstall;"), "Android install prompt must use the earliest captured native prompt directly inside the user gesture");
  assert.ok(router.includes('navigator.serviceWorker.register("/service-worker.js",{scope:"/"})'), "Android PWA service worker registration missing");
  assert.ok(router.includes("return !isNativeAppRequest(ua);"), "Android browsers must receive the public website");
  assert.ok(!router.includes("isRoot && (nativeApp || androidBrowser)"), "Android browsers must not be intercepted by the native root shell");
  assert.ok(router.includes("isRoot && nativeApp"), "Only native app user agents may receive the native root shell");
  assert.ok(!router.includes('id="darAndroidDownloadPromo"'), "Obsolete APK promo must not cover the public website");
  assert.ok(router.includes("DAR_PWA_ICON_CATALOG"), "Android PWA icon catalog missing");
  assert.ok(router.includes("normalizePwaIconId"), "Android PWA selected-icon manifest support missing");
  assert.ok(router.includes("No async work may happen before prompt()"), "Android install prompt must stay inside the original tap");
  assert.ok(router.includes('X-Dar-Surface", "android-pwa-app"'), "Installed Android PWA must have a dedicated app-shell surface");
  assert.ok(router.includes('target.pathname = "/pwa/"'), "Legacy PWA start must redirect into the dedicated /pwa/ shell");
  assert.ok(router.includes('purpose: "maskable"'), "Android launcher must receive maskable artwork");
  assert.ok(router.includes('display: "standalone"'), "Android PWA manifest must be standalone");
  assert.ok(router.includes('id: "/pwa/"'), "Android PWA manifest must have the dedicated stable app id /pwa/");
  assert.ok(router.includes('start_url: "/pwa/?pwa=1"'), "Dynamic Android PWA manifest must launch the dedicated visitor app shell");
}
assert.equal(pwaManifest.display, "standalone", "Public manifest must be installable as standalone PWA");
assert.equal(pwaManifest.start_url, "/pwa/?pwa=1", "Installed Android PWA must launch the dedicated visitor app shell");
assert.equal(pwaManifest.background_color, "#050706", "PWA system splash background must match the standard boot surface");
assert.equal(pwaManifest.scope, "/", "PWA scope must cover the public website");
assert.equal(pwaManifest.id, "/pwa/", "PWA id must be dedicated to the installed visitor app and query-free");
assert.ok(pwaManifest.icons.some((icon) => icon.sizes === "192x192" && /assets\/app-icons\/type-creme-ar\/icon-192\.png/.test(icon.src)), "Native iOS-equivalent 192px PWA icon missing");
assert.ok(pwaManifest.icons.some((icon) => icon.sizes === "512x512" && /assets\/app-icons\/type-creme-ar\/icon-512\.png/.test(icon.src)), "Native iOS-equivalent 512px PWA icon missing");
assert.ok(pwaManifest.icons.some((icon) => String(icon.purpose || "").includes("maskable")), "Maskable Android launcher icon missing");

assert.ok(links.includes('href="/download/"'), "Website links page must offer official Android downloads");
assert.ok(!html.includes("apk-kids"), "Kids must not have a public download button");
assert.ok(!html.includes("de.daraltawhid.kids"), "Kids app must not be advertised publicly here");
assert.equal(manifest.apps.kids.public, false, "Kids is private-testing only");
assert.ok(links.includes('src="/download/icons/android-tv-icon.jpg"'), "Website must show official TV icon");
assert.ok(links.includes('src="/download/icons/android-phone-default.jpg"'), "Website must use provided Android phone icon");
assert.ok(html.includes('src="/download/icons/android-phone-default.jpg"'), "Download page must use provided Android phone icon");
assert.ok(html.includes('src="/download/icons/android-tv-official.jpg"'), "TV download card must show supplied official banner");
for (const art of ["download/icons/android-phone-default.jpg", "download/icons/android-tv-official.jpg", "download/icons/android-tv-icon.jpg"]) {
  const data = fs.readFileSync(path.join(root, art));
  assert.ok(data.length > 10_000 && data[0] === 0xff && data[1] === 0xd8, "Official TV artwork missing: " + art);
}
assert.equal(manifest.apps.kids.status, "private-testing");

let published = 0;
for (const [id, name, pkg, suffix] of [
  ["adult", "DAR AL TAWḤĪD", "de.daraltawhid.app", "android"],
  ["tv", "DAR AL TAWḤĪD", "de.daraltawhid.tv", "tv"]
]) {
  const app = manifest.apps[id];
  assert.equal(app.name, name);
  assert.equal(app.packageName, pkg);
  if (app.public !== true) {
    assert.equal(app.status, "preparing", "Unpublished binaries must be pending");
    assert.equal(app.downloadPath, null);
    continue;
  }
  published++;
  assert.equal(app.status, "published");
  assert.ok(Number.isInteger(app.versionCode) && app.versionCode > 0);
  assert.ok(/^\d+\.\d+(?:\.\d+)?(?:[-.][0-9A-Za-z]+)*$/.test(app.versionName));
  assert.ok(typeof app.sha256 === "string" && /^[A-Fa-f0-9]{64}$/.test(app.sha256));
  assert.ok(typeof app.signingCertificateSha256 === "string" &&
    /^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(app.signingCertificateSha256),
    "A verified 32-byte signing certificate fingerprint must be published");
  const expected = new RegExp(
    "^/download/files/dar-al-tawhid-" + suffix + "-v[0-9][0-9a-z.-]*\\.apk$"
  );
  assert.ok(expected.test(app.downloadPath), "APK must be a versioned same-origin file");
  const full = path.resolve(root, "." + app.downloadPath);
  assert.ok(full.startsWith(path.join(root, "download", "files") + path.sep));
  assert.ok(fs.existsSync(full), "APK must exist before publication: " + app.downloadPath);
  const size = fs.statSync(full).size;
  assert.ok(size > 10_000, "APK cannot be empty or a placeholder");
  const sha = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
  assert.equal(sha.toLowerCase(), app.sha256.toLowerCase(), "APK fingerprint mismatch");
}
if (published > 0) assert.ok(typeof manifest.publishedAt === "string" && !Number.isNaN(Date.parse(manifest.publishedAt)));
console.log("ANDROID_SITE_RELEASE_GUARD OK | public=" + published + " | Kids=private-testing");

// Direct install UI contract
assert.ok(router.includes("syncRouterInstallButtons"), "Direct Android PWA install readiness gate missing");
assert.ok(router.includes("beforeinstallprompt"), "beforeinstallprompt capture missing");
assert.ok(router.includes("btn.disabled=installed;"), "Android install button must stay clickable until the app is actually installed");
assert.ok(router.includes('btn.setAttribute("aria-disabled",installed?"true":"false")'), "Android install button accessibility state must only lock after installation");
assert.ok(router.includes("DAR_ANDROID_PWA_INSTALL_READY_GATE_V6_20261009"), "Android install readiness gate marker missing");
assert.ok(router.includes("darPublicTouchRectangleHardStopV6"), "Mobile tap rectangle hard-stop missing");
