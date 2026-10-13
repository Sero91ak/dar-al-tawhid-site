#!/usr/bin/env node
"use strict";
/* Android DAR TEST PWA: installation proof, strictly separate from Kids Live.
 * Run AFTER build-apple-icons.cjs in deploy-test-app.yml. */
const fs=require("node:fs");
const assert=require("node:assert/strict");
const manifest=JSON.parse(fs.readFileSync("test/manifest.json","utf8"));
const installer=fs.readFileSync("test/android/index.html","utf8");
const worker=fs.readFileSync("cloudflare/test-app-worker.js","utf8");
assert.equal(manifest.scope,"/test/","Wrong Android Test PWA scope");
assert.equal(manifest.id,"/test/?env=staging","Test PWA would collide with another install");
assert.ok(manifest.start_url.startsWith("/test/"),"Test install must launch Test, not Kids live");
assert.ok(manifest.start_url!=="/kids/start","Installer must not launch public Kids");
assert.equal(manifest.display,"standalone","Test app must launch standalone");
assert.ok(manifest.icons?.some(i=>i.sizes==="192x192"),"Missing 192px test icon");
assert.ok(manifest.icons?.some(i=>i.sizes==="512x512"),"Missing 512px test icon");
assert.ok(installer.includes('href="/test/manifest.json"'),"Installer manifest link missing");
assert.ok(installer.includes('href="/test/?env=staging'),"Installer must open isolated Dar Test");
assert.ok(installer.includes("beforeinstallprompt"),"Native Android install action missing");
assert.ok(!/href="\/kids\/start|location\.(?:href|replace)\s*=\s*["']\/kids\//.test(installer),
  "Installer must never redirect to live Kids");
assert.ok(!worker.includes('url.pathname.startsWith("/test/android/")') ||
  !worker.includes('"/test/android/" || url.pathname.startsWith("/test/kids/")'),
  "Installer must not be treated as legacy Kids redirect");
for(const icon of manifest.icons){
  assert.match(icon.src,/^\/test\/assets\/dar-test-apple-icon-(192|512)\.png\?/);
  const path=icon.src.split("?")[0].slice(1);
  const data=fs.readFileSync(path);
  const size=Number(icon.sizes.split("x")[0]);
  assert.equal(data.readUInt32BE(16),size);
  assert.equal(data.readUInt32BE(20),size);
}
console.log("DAR TEST Android PWA: scoped install, correct icons, isolated URL — PASS");
