#!/usr/bin/env node
"use strict";
// TV-only download isolation tests. Offline mocks: no releases are published.
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = readFileSync(join(__dirname, "official-tv-release.js"), "utf8");
const repo = "Sero91ak/dar-al-tawhid-site";
function release(code, opts = {}) {
  const tag = opts.tvOnly ? "tv-website-v1." + code : "android-website-v1." + code;
  const url = "https://github.com/" + repo + "/releases/download/" + tag + "/dar-al-tawhid-tv.apk";
  return {
    tag_name: tag, draft: !!opts.draft, prerelease: !!opts.prerelease,
    published_at: "2026-10-15T11:00:00Z",
    body: "TV_VERSION=" + (opts.tvOnly ? "0.2." : "0.1.") + code +
      "\nBUILD_CREATED_AT=2026-10-15T10:00:00Z",
    assets: [{
      name: "dar-al-tawhid-tv.apk",
      state: "uploaded", size: 800000,
      digest: opts.badDigest ? null : "sha256:" + "a".repeat(64),
      browser_download_url: url
    }]
  };
}
function node() {
  return {
    href: "#", hidden: true, textContent: "", attributes: {},
    classList: { add(name) { this[name] = true; } },
    setAttribute(k,v) { this.attributes[k] = v; },
    querySelector() { return this.child || (this.child = { textContent: "" }); }
  };
}
async function render(releases, httpOK = true) {
  const elements = new Map();
  const ids = [];
  const document = {
    readyState: "complete",
    getElementById(id) {
      ids.push(id);
      if (!elements.has(id)) elements.set(id, node());
      return elements.get(id);
    }
  };
  const context = {
    document, Date, Intl, Number, Array, AbortController, setTimeout, clearTimeout,
    fetch: async () => ({ ok: httpOK, json: async () => releases })
  };
  vm.runInNewContext(source, context, { timeout: 1500 });
  await new Promise(resolve => setTimeout(resolve, 20));
  return { get(id) { return document.getElementById(id); }, ids };
}
(async () => {
  let result = await render([release(54)]);
  assert.equal(result.get("apk-tv").hidden, false);
  assert.ok(result.get("apk-tv").href.includes("android-website-v1.54"));
  assert.ok(result.get("release-version-tv").textContent.includes("0.1.54"));

  result = await render([release(54), release(155, { tvOnly: true })]);
  assert.ok(result.get("apk-tv").href.includes("tv-website-v1.155"));
  assert.equal(result.get("release-sha-tv").textContent, "a".repeat(64));
  assert.ok(result.get("release-version-tv").textContent.includes("0.2.155"));
  assert.ok(result.get("release-meta-tv").textContent.includes("Android-TV-APK"));
  assert.ok(!result.ids.some(id => id.includes("android") || id.includes("adult") || id.includes("kids")),
    "TV selector must not touch other app download IDs");

  result = await render([release(54), release(155, { tvOnly: true }), release(156, { tvOnly: true, draft: true })]);
  assert.ok(result.get("apk-tv").href.includes("tv-website-v1.155"), "Do not show draft release");

  result = await render([release(54), release(155, { tvOnly: true, badDigest: true })]);
  assert.equal(result.get("apk-tv").hidden, true, "Invalid newest TV release must fail closed");
  assert.ok(result.get("status-tv").child.textContent.includes("geprüft"));

  result = await render([release(54)], false);
  assert.equal(result.get("apk-tv").hidden, true, "Outage must not invent a release URL");

  result = await render([release(54), release(155, { tvOnly: true, prerelease: true })]);
  assert.ok(result.get("apk-tv").href.includes("android-website-v1.54"));

  console.log("TV_RELEASE_SELECTOR_TEST OK | legacy + TV-only + isolation + draft + digest + outage");
})().catch(err => { console.error(err); process.exit(1); });
