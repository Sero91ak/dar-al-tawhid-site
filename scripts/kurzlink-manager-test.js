#!/usr/bin/env node
/**
 * Kurzlink-Manager Tests (Pflicht)
 * Usage: node scripts/kurzlink-manager-test.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sandbox = { window: {}, URL };
sandbox.globalThis = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "admin/kurzlink-manager.js"), "utf8"), sandbox);
const K = sandbox.window.DARKurzlink;

let failed = 0;
function ok(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function assert(cond, msg) {
  if (cond) ok(msg);
  else fail(msg);
}

const registry = K.normalizeRegistry({ version: 1, nextSerial: 1, entries: {} });

assert(K.getNextCode(registry) === "a1", "Test 1: next code is a1");
assert(K.isAllowedTargetUrl("https://www.islamweb.net/ar/library/1"), "Test 2: islamweb allowed");
assert(!K.isAllowedTargetUrl("https://evil.example.com/page"), "Test 2: foreign domain blocked");
assert(K.isAllowedTargetUrl("/assets/sources/ibn/test.pdf#page=1"), "Test 2: local PDF allowed");

const entry = {
  code: "a1",
  targetUrl: "https://www.islamweb.net/x#:~:text=Start,Ende",
  platform: "Islamweb",
  work: "Al-Istidhkār",
  citation: "Band 3, S. 152",
  quote: "Testaussage des Gelehrten",
  textHighlight: "yes",
  status: "verified",
  verifiedAt: new Date().toISOString(),
  postFilename: "test.md"
};
const v = K.validateEntry(entry, registry, { forPublish: true });
assert(v.ok, "Test 3: verified entry passes publish validation");

const bad = K.validateEntry({ ...entry, status: "unverified" }, registry, { forPublish: true });
assert(!bad.ok, "Test 4: unverified blocks publish");

const md = K.injectShortlinkIntoMarkdown(
  `---\ntitle: "Test"\nsource: "Alt"\n---\n\nBody`,
  "a1"
);
assert(md.includes('source_shortlink: "a1"'), "Test 5: source_shortlink injected");
assert(md.includes("dar-al-tawhid.de/a1"), "Test 5: normal short URL in source");
assert(md.includes("https://dar-al-tawhid.de/a1"), "Test 5: https link in links block");

const reg2 = K.normalizeRegistry({
  nextSerial: 2,
  entries: { a1: { ...entry, code: "a1", targetUrl: "https://www.islamweb.net/same", quote: "Testaussage" } }
});
const dup = K.validateEntry({ ...entry, code: "a2", targetUrl: "https://www.islamweb.net/same" }, reg2, { existingCode: "a2" });
assert((dup.warnings || []).some((w) => /möglicherweise bereits verwendet/i.test(w)), "Test 6: duplicate warning");

const html = K.buildRedirectHtml({ code: "a1", status: "disabled" });
assert(/deaktiviert/i.test(html), "Test 7: disabled page text");

const htmlOk = K.buildRedirectHtml({ code: "a1", status: "verified", targetUrl: "https://www.islamweb.net/x" });
assert(/location\.replace/i.test(htmlOk), "Test 8: verified redirect html");

assert(K.formatInstagramLine("a1") === "🔗 https://dar-al-tawhid.de/a1", "Test 9: Instagram line format");

const redirectEntry = {
  code: "a2",
  targetUrl: "https://www.shamela.ws/book/1#:~:text=Start,Ende",
  platform: "Shamela",
  textHighlight: "yes",
  status: "verified"
};
const rv = K.validateRedirectSave(redirectEntry, registry, { existingCode: "a2", forVerified: true });
assert(rv.ok, "Test 10: redirect-only verified entry passes");

if (failed) {
  console.error(`\n${failed} Kurzlink-Test(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nAlle Kurzlink-Manager-Tests bestanden.");
