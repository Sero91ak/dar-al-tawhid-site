#!/usr/bin/env node
"use strict";

/* Regression tests for GitHub release switches used on /links and /download/.
 * Offline mock: no real public release, downloads or credentials required.
 */
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = fs.readFileSync(require("node:path").join(__dirname, "official-release-links.js"), "utf8");

const repo = "Sero91ak/dar-al-tawhid-site";
function release(n, { draft = false, invalidTv = false, published = "2026-10-08T19:00:00Z" } = {}) {
  const tag = "android-website-v1." + n;
  const url = "https://github.com/" + repo + "/releases/download/" + tag + "/";
  return {
    tag_name: tag, draft, prerelease: false, published_at: published,
    body: ["ANDROID_VERSION=1.0." + n, "TV_VERSION=0.1." + n, "BUILD_CREATED_AT=2026-10-07T19:00:00Z"].join(String.fromCharCode(10)),
    assets: ["dar-al-tawhid-android.apk", "dar-al-tawhid-tv.apk"].map((name) => ({
      name, state: "uploaded", size: 20480,
      digest: invalidTv && name.includes("-tv") ? null : "sha256:" + "a".repeat(64),
      browser_download_url: url + name, created_at: "2026-10-07T19:00:00Z"
    }))
  };
}
function element() {
  return {
    href: "/download/", textContent: "", hidden: true, attributes: {},
    classList: { add() {} }, label: { textContent: "" },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector() { return this.label; }
  };
}
async function load(releases) {
  const nodes = new Map();
  const document = {
    readyState: "complete",
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id);
    }
  };
  const fetch = async () => ({ ok: true, json: async () => releases });
  vm.runInNewContext(source, {
    document, fetch, Date, Intl, AbortController, Number, Array,
    setTimeout, clearTimeout, console
  }, { timeout: 1500 });
  await new Promise((resolve) => setTimeout(resolve, 15));
  return { get: (id) => document.getElementById(id) };
}
(async () => {
  let test = await load([release(2, { draft: true })]);
  assert.equal(test.get("direct-android-apk").href, "/download/");
  assert.equal(test.get("apk-adult").hidden, true);
  test = await load([release(9), release(10)]);
  assert.ok(test.get("direct-android-apk").href.includes("v1.10"));
  assert.ok(test.get("direct-android-tv-apk").href.includes("dar-al-tawhid-tv.apk"));
  assert.ok(test.get("dar-public-android-apk").href.includes("v1.10"));
  assert.ok(test.get("dar-public-tv-apk").href.includes("dar-al-tawhid-tv.apk"));
  assert.ok(test.get("dar-public-tv-meta").textContent.includes("08.10.2026"));
  assert.ok(test.get("dar-public-tv-meta").textContent.includes("v0.1.10"));
  assert.ok(test.get("release-version-adult").textContent.includes("1.0.10"));
  assert.ok(test.get("direct-android-meta").textContent.includes("v1.0.10"));
  assert.ok(test.get("direct-android-meta").textContent.includes("08.10.2026"));
  assert.ok(test.get("release-dates-tv").textContent.includes("07.10.2026"));
  assert.equal(test.get("release-sha-adult").textContent, "a".repeat(64));
  assert.equal(test.get("apk-tv").hidden, false);
  test = await load([release(10, { invalidTv: true }), release(9)]);
  assert.equal(test.get("direct-android-tv-apk").href, "/download/", "Never show stale release when newer release is incomplete");
  assert.equal(test.get("apk-tv").hidden, true);
  console.log("ANDROID_RELEASE_SWITCHBOARD_TEST OK | latest=10 | dates=valid | SHA256=valid | drafts=invisible | Kids=absent");
})().catch((e) => { console.error(e); process.exit(1); });
