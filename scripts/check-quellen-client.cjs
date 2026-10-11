#!/usr/bin/env node
"use strict";
// Browser-level regression check for the standalone numbered Q source library.
// No network, browser installation or external packages are required.
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const html = fs.readFileSync("quellen/index.html", "utf8");
const source = html.match(/<script id="qlSourceSnapshot" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(source, "Embedded Q registry is missing");
const registry = JSON.parse(source[1]);
assert.equal(registry.links.length, 40, "Expected all 40 currently registered Q pages");
const start = html.lastIndexOf("\n<script>"), end = html.lastIndexOf("\n</script>");
assert.ok(start >= 0 && end > start, "Standalone page JS is missing");
const script = html.slice(start + "\n<script>".length, end);
new vm.Script(script, { filename: "quellen/index.html" });

function runLibrary(fetchImpl) {
  const nodes = new Map();
  const handlers = {};
  function getNode(id) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        innerHTML: "", textContent: "", style: {}, value: "",
        options: [], dataset: {},
        addEventListener(type, handler) { handlers[id + ":" + type] = handler; },
        querySelectorAll() { return []; },
        appendChild() {},
      });
    }
    return nodes.get(id);
  }
  getNode("qlSourceSnapshot").textContent = source[1];
  const document = {
    getElementById: getNode,
    addEventListener(type, handler) { handlers["document:" + type] = handler; },
    createElement() { return getNode("__created_" + nodes.size); },
  };
  const context = {
    document, fetch: fetchImpl, Date, URL, location: { origin: "https://dar-al-tawhid.de" },
    navigator: { clipboard: { writeText: async () => {} } }, setTimeout() {}
  };
  vm.runInNewContext(script, context, { timeout: 3000 });
  return { getNode, handlers };
}

const offline = runLibrary(async () => { throw new Error("Simulated offline"); });
assert.equal(offline.getNode("resultCount").textContent, "40 Quellen");
assert.equal((offline.getNode("sourceList").innerHTML.match(/class="ql-card"/g) || []).length, 40);
assert.match(offline.getNode("sourceList").innerHTML, /href="\/q\/40\/"/);
offline.handlers["search:input"]({ target: { value: "q37" } });
assert.equal(offline.getNode("resultCount").textContent, "1 Quelle");
assert.match(offline.getNode("sourceList").innerHTML, /href="\/q\/37\/"/);

(async () => {
  const stale = runLibrary(async () => ({ ok: true, json: async () => ({ links: registry.links.slice(0, 37) }) }));
  for (let i = 0; i < 8; i++) await Promise.resolve();
  assert.equal(stale.getNode("resultCount").textContent, "40 Quellen", "Stale network must not remove Q38–Q40");
  const router=fs.readFileSync("cloudflare/site-router.js", "utf8");
  new vm.Script(router.replace(/^import .*$/gm, "").replace(/export default\s*\{/, "const darRouter = {"), { filename: "cloudflare/site-router.js" });
  assert.match(router, /Q_SOURCE_LIBRARY_DIRECT_ROUTING_V2/, "Direct Q router missing");
  assert.match(router, /X-DAR-Q-Route/, "Missing routing diagnostic header");
  const redirects=fs.readFileSync("_redirects", "utf8");
  assert.doesNotMatch(redirects, /^\/quellen\/\s+\/quellen\/index\.html\s+200/m, "Recursive source rewrite forbidden");
  assert.doesNotMatch(redirects, /^\/q\/\s+\/quellen\/index\.html\s+200/m, "Recursive archive rewrite forbidden");
  // Exercise the real Cloudflare Worker routing function using a local asset mock.
  const sandbox = { URL, Request, Response, Headers };
  vm.createContext(sandbox);
  vm.runInContext(
    router.replace(/^import .*$/gm, "").replace(/export default\s*\{/, "const darRouter = {") +
      "\nthis.darRouter = darRouter;",
    sandbox, { timeout: 3000 }
  );
  const requested = [];
  const assets = { fetch: async req => {
    const pathname = new URL(req.url).pathname;
    requested.push(pathname);
    const file = pathname === "/quellen/" ? "quellen/index.html" :
      pathname === "/quellen/shortlinks.json" ? "quellen/shortlinks.json" :
      /^\/q\/[1-9][0-9]*\/$/.test(pathname) ? pathname.slice(1) + "index.html" : null;
    if (!file || !fs.existsSync(file)) return new Response("missing", { status: 404 });
    return new Response(fs.readFileSync(file), { status: 200 });
  }};
  async function checkRoute(route, method="GET") {
    return sandbox.darRouter.fetch(new Request("https://dar-al-tawhid.de" + route, { method }), { ASSETS: assets });
  }
  const library = await checkRoute("/quellen/");
  assert.equal(library.status, 200);
  assert.match(await library.text(), /id="qlSourceSnapshot"/);
  assert.equal(library.headers.get("X-DAR-Q-Route"), "direct-static-asset-v2");
  const json = await checkRoute("/quellen/shortlinks.json");
  assert.equal(json.status, 200);
  assert.equal((await json.json()).links.length, 40);
  const lastSource = await checkRoute("/q/40/");
  assert.equal(lastSource.status, 200);
  assert.match(await lastSource.text(), /DAR AL TAWḤĪD/);
  const sourceHead = await checkRoute("/q/37/", "HEAD");
  assert.equal(sourceHead.status, 200);
  assert.equal(await sourceHead.text(), "");
  for (const [path, target] of [
    ["/quellen", "/quellen/"],
    ["/quellen/index.html", "/quellen/"],
    ["/q", "/quellen/"],
    ["/q/", "/quellen/"],
    ["/q/40", "/q/40/"],
    ["/q/40/index.html", "/q/40/"]
  ]) {
    const response = await checkRoute(path);
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("Location"), target, path);
  }
  assert.deepEqual(requested, ["/quellen/", "/quellen/shortlinks.json", "/q/40/", "/q/37/"]);
  const sw = fs.readFileSync("service-worker.js", "utf8");
  new vm.Script(sw, { filename: "service-worker.js" });
  assert.match(sw, /url\.pathname\.startsWith\('\/quellen\/'\)/, "SW must isolate /quellen/");
  assert.match(sw, /url\.pathname\.startsWith\('\/q\/'\)/, "SW must isolate numbered Q pages");
  console.log("Q library: 40 links visible immediately, search works offline, stale JSON cannot overwrite, app-shell bypass present.");
})().catch(error => { console.error(error); process.exitCode = 1; });
