#!/usr/bin/env node
"use strict";

// DAR_IOS_NATIVE_ENTRY_FALLBACK_GUARD_V1
// Read-only regression: simulate Cloudflare's actual fetch handler (not a copy
// of its route condition) and verify native/public/Kids/Q/test separation.
// Run: node ios/DarAlTawhid/tools/check-native-entry-contract.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const shell = read("ios/DarAlTawhid/DarAlTawhid/DarAppShell.swift");
const webView = read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");
const app = read("ios/DarAlTawhid/DarAlTawhid/DarAlTawhidApp.swift");
const project = read("ios/DarAlTawhid/DarAlTawhid.xcodeproj/project.pbxproj");
const router = read("cloudflare/site-router.js");

assert.match(shell, /static let usesStagingWeb = false/);
assert.match(shell, /static let liveURL = URL\(string: "https:\/\/dar-al-tawhid\.de\/\?native_ios=1#home"\)!/);
assert.match(shell, /items\.append\(URLQueryItem\(name: "native_ios", value: "1"\)\)/);
assert.match(shell, /components\.path == "\/" \|\| components\.path == "\/index\.html"/);
assert.match(shell, /if !usesStagingWeb &&/);
assert.match(shell, /else if path\.hasPrefix\("\/test\/"\)/);
assert.match(shell, /components\.queryItems = items/);
assert.match(webView, /webView\.load\(URLRequest\(url: Self\.launchURL/);
assert.match(webView, /webView\.allowsBackForwardNavigationGestures = true/);
assert.match(webView, /private static let launchURL = DarAppShell\.launchURL/);
assert.match(app, /WebAppView\(destination: router\.destination/);
assert.match(project, /WebAppView\.swift in Sources/);
assert.doesNotMatch(project, /FreshWebAppView\.swift in Sources/);
assert.match(router, /DAR_IOS_NATIVE_ENTRY_FALLBACK_GUARD_V1/);
assert.match(router, /const nativeIosEntry = isRoot && url\.searchParams\.get\("native_ios"\) === "1"/);

const compiled = router
  .replace(/^import\s+[^\n]+;\s*$/gm, "")
  .replace("export default {", "globalThis.__darRouter = {");
assert(!compiled.includes("export default {"), "Worker export could not be transformed");
const sandbox = {
  URL, URLSearchParams, Request, Response, Headers, console,
  gateHiddenSurfaces: () => null,
  academyOwnerAccess: async () => null,
  academyOwnerAssetPath: (p) => p,
  editorialOwnerAccess: async () => null
};
vm.runInNewContext(compiled, sandbox, {
  filename: "cloudflare/site-router.js",
  timeout: 5000
});
assert.equal(typeof sandbox.__darRouter?.fetch, "function");

const testHTML = (name) => `<!doctype html><html><head></head><body><main id="surface">${name}</main></body></html>`;
const assets = {
  async fetch(request) {
    const p = new URL(request.url).pathname;
    const name = p === "/desktop-preview/" ? "PUBLIC-DESKTOP"
      : p === "/" || p === "/index.html" ? "NATIVE-VISITOR"
      : p === "/test/" || p === "/test/index.html" ? "ISOLATED-TEST"
      : p === "/kids/" ? "KIDS" : p.startsWith("/q/") ? "Q-SOURCE" : "OTHER";
    return new Response(testHTML(name), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
const env = { ASSETS: assets };
const browser = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
const official = "DarAlTawhid-iOS/1.0 WKWebView";

async function visit(url, ua = browser, method = "GET") {
  const response = await sandbox.__darRouter.fetch(
    new Request(url, { method, headers: { "User-Agent": ua } }), env
  );
  return {
    status: response.status,
    surface: response.headers.get("X-Dar-Surface"),
    test: response.headers.get("X-DAR-Test-App"),
    q: response.headers.get("X-DAR-Q-Route"),
    cache: response.headers.get("Cache-Control"),
    html: method === "HEAD" ? "" : await response.text()
  };
}

(async () => {
  const url = "https://dar-al-tawhid.de/";
  let r = await visit(url + "?native_ios=1#home");
  assert.equal(r.status, 200);
  assert.equal(r.surface, "ios-native", "An iOS boot must survive a missing native User-Agent");
  assert.match(r.html, /NATIVE-VISITOR/);
  assert.doesNotMatch(r.html, /PUBLIC-DESKTOP/);
  assert.match(r.cache, /no-store/);

  r = await visit(url + "#home", browser);
  assert.equal(r.surface, "public-website", "Normal iOS Safari must remain on the public website");
  assert.match(r.html, /PUBLIC-DESKTOP/);

  r = await visit(url, official);
  assert.equal(r.surface, "ios-native", "Legacy native builds must keep working");

  r = await visit(url + "?native_ios=0", browser);
  assert.equal(r.surface, "public-website", "Only exact native_ios=1 may select the visitor app");

  r = await visit(url + "?native_ios=1", browser, "HEAD");
  assert.equal(r.surface, "ios-native", "HEAD must agree with GET");

  r = await visit(url + "test/?native_ios=1", browser);
  assert.equal(r.surface, null, "The explicit iOS root selector cannot affect DAR Test");
  assert.equal(r.test, "isolated");

  r = await visit(url + "q/51/?native_ios=1", browser);
  assert.notEqual(r.surface, "ios-native", "Canonical Q pages must not become an app shell");
  assert.equal(r.q, "direct-static-asset-v2");

  r = await visit(url + "kids/?native_ios=1", browser);
  assert.notEqual(r.surface, "ios-native", "Kids must remain independent");

  console.log("PASS: iOS native entry, browser separation, legacy builds, HEAD, DAR Test, Kids and Q source routes");
})().catch((error) => {
  console.error("FAIL: iOS entry route regression:", error);
  process.exitCode = 1;
});
