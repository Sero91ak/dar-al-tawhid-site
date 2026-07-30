#!/usr/bin/env node
/**
 * Erzwingt Wrangler-Upload der Test-App-Hülle (test/index.html, test/version.json).
 * Cloudflare Workers Static Assets überspringen Dateien mit gleichem Hash –
 * ein Deploy-Stamp stellt sicher, dass neue Test-Builds wirklich hochgeladen werden.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TEST_INDEX = path.join(ROOT, "test", "index.html");
const TEST_VERSION = path.join(ROOT, "test", "version.json");
const SERVICE_WORKER = path.join(ROOT, "service-worker.js");

function sha256(file) {
  const data = fs.readFileSync(file);
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 12);
}

function bumpTestIndexStamp() {
  let html = fs.readFileSync(TEST_INDEX, "utf8");
  const stamp = `<!-- workers-deploy-stamp:${Date.now()} -->`;
  if (html.includes("<!-- workers-deploy-stamp:")) {
    html = html.replace(/<!-- workers-deploy-stamp:\d+ -->/, stamp);
  } else if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n${stamp}`);
  } else {
    html = `${stamp}\n${html}`;
  }
  fs.writeFileSync(TEST_INDEX, html);
}

function bumpTestVersionTimestamp() {
  const data = JSON.parse(fs.readFileSync(TEST_VERSION, "utf8"));
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(TEST_VERSION, `${JSON.stringify(data, null, 2)}\n`);
}

function touchServiceWorkerComment() {
  if (!fs.existsSync(SERVICE_WORKER)) return;
  let sw = fs.readFileSync(SERVICE_WORKER, "utf8");
  const line = `// workers-deploy-stamp:${Date.now()}`;
  if (/^\/\/ workers-deploy-stamp:\d+/m.test(sw)) {
    sw = sw.replace(/^\/\/ workers-deploy-stamp:\d+/m, line);
  } else {
    sw = `${line}\n${sw}`;
  }
  fs.writeFileSync(SERVICE_WORKER, sw);
}

bumpTestIndexStamp();
bumpTestVersionTimestamp();
touchServiceWorkerComment();

console.log(
  "force-workers-test-upload:",
  `test/index.html sha=${sha256(TEST_INDEX)} bytes=${fs.statSync(TEST_INDEX).size}`,
  `test/version.json sha=${sha256(TEST_VERSION)}`,
  `service-worker.js sha=${fs.existsSync(SERVICE_WORKER) ? sha256(SERVICE_WORKER) : "n/a"}`
);
