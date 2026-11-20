#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "../..");
const manifestPath = path.join(root, "kids/data/academy-audio.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const entries = Object.entries(manifest.entries || {});
if (!entries.length) throw new Error("Academy audio manifest is empty");

let checked = 0;
for (const [text, entry] of entries) {
  if (!entry || typeof entry.url !== "string" || typeof entry.sha256 !== "string") {
    throw new Error(`Audio manifest entry is missing URL or SHA-256: ${text}`);
  }
  const [assetUrl, query = ""] = entry.url.split("?");
  if (entry.url.includes("#") || !/^\/[A-Za-z0-9_./-]+\.m4a$/.test(assetUrl)
      || (query && !/^v=[A-Za-z0-9._-]+$/.test(query)) || assetUrl.includes("..")) {
    throw new Error(`Audio manifest path is not a local M4A asset: ${text}`);
  }
  const file = path.resolve(root, `.${assetUrl}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`Audio file is missing or outside repository: ${assetUrl}`);
  }
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (actual !== entry.sha256) throw new Error(`Audio SHA-256 mismatch: ${assetUrl}`);
  checked += 1;
}
console.log(`Academy audio hash guard passed: ${checked} manifest entries match their M4A bytes.`);
