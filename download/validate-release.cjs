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

assert.equal(manifest.schemaVersion, 1);
assert.ok(manifest.apps && typeof manifest.apps === "object");
assert.ok(html.includes('id="apk-adult"') && html.includes('id="apk-tv"'));
assert.ok(html.includes('id="release-info-adult"') && html.includes('id="release-info-tv"'), "Release versions and dates must exist");
assert.ok(html.includes('id="release-sha-adult"') && html.includes('id="release-sha-tv"'), "SHA256 links must be visible");
assert.ok(html.includes('id="installation"') && html.includes('id="sicherheit"'), "Safe install and security help missing");
assert.ok(html.includes('/download/official-release-links.js'), "Official release switchboard missing");
assert.ok(links.includes('id="native-downloads-title"') && links.includes('id="direct-android-meta"') && links.includes('id="direct-android-tv-meta"'), "Apple-adjacent Android version and release date cards missing");

const publicRouterPath = path.join(root, "cloudflare/site-router.js");
if (fs.existsSync(publicRouterPath)) {
  const router = fs.readFileSync(publicRouterPath, "utf8");
  assert.ok(router.includes('id="darIosAppStorePromo"'), "Existing iOS promotion must remain");
  for (const id of ["darAndroidDownloadPromo", "dar-public-android-apk", "dar-public-tv-apk", "dar-public-android-meta", "dar-public-tv-meta"]) {
    assert.ok(router.includes('id="' + id + '"'), "Main website Android promotion missing: " + id);
  }
  assert.ok(router.includes('/download/official-release-links.js'), "Main website must use shared official release switchboard");
  assert.ok(router.includes('/download/icons/android-phone-default.jpg'), 'Main website must use supplied phone icon');
}

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
