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
const canonical = JSON.parse(fs.readFileSync("q/_registry/shortlinks.json", "utf8")).links.filter(item=>item.status!=="inactive");
assert.equal(registry.links.length, canonical.length, "The full dynamically sized canonical registry must be rendered");
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
assert.equal(offline.getNode("resultCount").textContent, canonical.length + " Quellen");
assert.equal((offline.getNode("sourceList").innerHTML.match(/class="ql-card"/g) || []).length, canonical.length);
assert.match(offline.getNode("sourceList").innerHTML, /href="\/q\/40\/"/);
offline.handlers["search:input"]({ target: { value: "q37" } });
assert.equal(offline.getNode("resultCount").textContent, "1 Quelle");
assert.match(offline.getNode("sourceList").innerHTML, /href="\/q\/37\/"/);

(async () => {
  const stale = runLibrary(async () => ({ ok: true, json: async () => ({ links: registry.links.slice(0, Math.max(1,registry.links.length-3)) }) }));
  for (let i = 0; i < 8; i++) await Promise.resolve();
  assert.equal(stale.getNode("resultCount").textContent, canonical.length+" Quellen", "Stale network must never remove newer Q pages");
  const royalCss=fs.readFileSync("assets/q-royal-manuscript-v42.css", "utf8");
  const libraryCss=fs.readFileSync("assets/quellen-library.css", "utf8");
  const royalJs=fs.readFileSync("assets/q-royal-manuscript-v42.js", "utf8");
  new vm.Script(royalJs, { filename: "assets/q-royal-manuscript-v42.js" });
  assert.match(royalCss, /#fcfdfc/, "Near-white approved background missing");
  assert.match(royalCss, /qsource-arabic/, "Arabic text formatting must be retained");
  assert.match(royalCss, /Snell Roundhand/, "Signature font must be retained");
  assert.match(libraryCss, /--page:#fcfdfc/, "Library must use approved near-white style");
  assert.match(libraryCss, /--ql-safe-header-offset/, "Library must reserve top iPhone safe area");
  assert.match(libraryCss, /safe-area-inset-top/, "iOS notch/safe-area accommodation is missing");
  assert.match(libraryCss, /position:sticky/, "Header must remain reachable while scrolling");
  assert.match(libraryCss, /z-index:40/, "Header must remain above scrolling Q cards");
  // Library screenshot is the reference height for all detail pages.
  assert.match(libraryCss, /--ql-safe-header-offset:max\(58px,env\(safe-area-inset-top,0px\)\)/, "Library must keep the approved iOS header clearance");
  assert.match(libraryCss, /\.mast\{top:var\(--ql-safe-header-offset\)\}/, "Library sticky header must stay below the status bar");
  assert.match(royalCss, /--ql-safe-header-offset:max\(58px,env\(safe-area-inset-top,0px\)\)/, "All Q detail pages must match the library iPhone header height");
  assert.match(royalCss, /body\.qsource-body \.qsource-page\{[\s\S]*?padding-top:var\(--ql-safe-header-offset\)/, "Q page must begin below iPhone status bar");
  assert.match(royalCss, /body\.qsource-body \.qsource-header\{[\s\S]*?position:sticky;[\s\S]*?top:var\(--ql-safe-header-offset\)/, "Q logo and theme control must remain at the same height when scrolling");
  assert.match(royalCss, /overflow-x:clip!important/, "iOS overflow must not break sticky positioning");
  assert.match(html, /qapp-toolbar-20261013-2/, "Keep the current verified mobile stylesheet cache version");
  assert.match(html, /q-source-app-view\.js/, "App-frame source navigation must load in owner library");
  assert.match(royalJs, /Einzelner Quellenbeleg/, "Individual Q must remain standalone");
  assert.doesNotMatch(royalJs, /renderNeighbors|back\.href\s*=\s*"\/quellen\//, "No previous/next Q or owner-index link for public readers");

  assert.match(html, /watermark-my-logo-full\.png/, "Original official logo required");
  assert.match(html, /PRIMARY_CATEGORIES/, "Editorial categories must be explicitly curated");
  assert.match(html, /s\.work/, "Source-work search must be supported");
  const filtered=runLibrary(async () => {throw Error("Offline test");});
  filtered.handlers["search:input"]({target:{value:"Q1"}});
  assert.equal(filtered.getNode("resultCount").textContent,"1 Quelle","Q1 must not match Q10-Q19");
  const byWork=runLibrary(async () => {throw Error("Offline test");});
  byWork.handlers["search:input"]({target:{value:"Maʿānī al-Qurʾān"}});
  assert.equal(byWork.getNode("resultCount").textContent,"1 Quelle","Source-work search should find Q40");
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
  // Imports are stripped for the local sandbox — stub gate helpers so public
  // Q/Quellen routing can still be exercised without Cloudflare module loading.
  vm.runInContext(
    [
      "async function editorialOwnerAccess(){ return null; }",
      "function gateHiddenSurfaces(){ return null; }",
      "async function academyOwnerAccess(){ return null; }",
      "function academyOwnerAssetPath(p){ return p; }",
      router.replace(/^import .*$/gm, "").replace(/export default\s*\{/, "const darRouter = {") +
        "\nthis.darRouter = darRouter;"
    ].join("\n"),
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
    return new Response(fs.readFileSync(file), { status: 200, headers:{
      "Content-Type":file.endsWith(".html")?"text/html":"application/json"
    }});
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
  assert.equal((await json.json()).links.length, canonical.length);
  const lastSource = await checkRoute("/q/40/");
  assert.equal(lastSource.status, 200);
  const lastHtml=await lastSource.text();
  assert.match(lastHtml, /DAR AL TAWḤĪD/);
  assert.match(lastHtml, /q-royal-manuscript-v42\.css/, "Every Q page must receive Royal CSS");
  assert.match(lastHtml, /q-royal-manuscript-v42\.js/, "Every Q page must receive theme and navigation");
  assert.equal(lastSource.headers.get("X-DAR-Q-Layout"),"royal-manuscript-v42");
  const sourceHead = await checkRoute("/q/37/", "HEAD");
  assert.equal(sourceHead.status, 200);
  assert.equal(await sourceHead.text(), "");
  for (const [path, target] of [
    ["/quellen", "/quellen/"],
    ["/quellen/index.html", "/quellen/"],
    ["/q/40", "/q/40/"],
    ["/q/40/index.html", "/q/40/"]
  ]) {
    const response = await checkRoute(path);
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("Location"), target, path);
  }
  assert.equal((await checkRoute("/q")).status,404,"Bare Q route must not expose the private index");
  assert.equal((await checkRoute("/q/")).status,404,"Bare Q route must not expose the private index");
  assert.deepEqual(requested, ["/quellen/", "/quellen/shortlinks.json", "/q/40/", "/q/37/"]);
  const sw = fs.readFileSync("service-worker.js", "utf8");
  new vm.Script(sw, { filename: "service-worker.js" });
  assert.match(sw, /url\.pathname\.startsWith\('\/quellen\/'\)/, "SW must isolate /quellen/");
  assert.match(sw, /url\.pathname\.startsWith\('\/q\/'\)/, "SW must isolate numbered Q pages");
  console.log("Q Royal V4.2: "+canonical.length+" links, near-white library, exact Q lookup, work search, shared CSS/JS and future Q routing verified.");
})().catch(error => { console.error(error); process.exitCode = 1; });
