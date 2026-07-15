#!/usr/bin/env node
/**
 * Kurzlink-Manager Tests (Pflicht)
 * Usage: node scripts/kurzlink-manager-test.js
 */
const { loadSandboxModule, createAssert } = require("./lib/module-sandbox.cjs");

const K = loadSandboxModule("admin/kurzlink-manager.js", "DARKurzlink", { URL });

const asserter = createAssert();
const { assert } = asserter;

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

const parsed = K.parseChatGptImport(
  'QUELLEN_IMPORT\n```json\n{"links":[{"targetUrl":"https://www.islamweb.net/x#:~:text=A,B"}]}\n```'
);
assert(parsed.links.length === 1 && parsed.links[0].targetUrl.includes("islamweb"), "Test 10: ChatGPT JSON import parse");

const parsedUrls = K.parseChatGptImport("Siehe https://www.shamela.ws/book/1#:~:text=Start,Ende");
assert(parsedUrls.links.length === 1, "Test 11: URL extraction from text");

const redirectEntry = {
  code: "a2",
  targetUrl: "https://www.shamela.ws/book/1#:~:text=Start,Ende",
  platform: "Shamela",
  textHighlight: "yes",
  status: "verified"
};
const rv = K.validateRedirectSave(redirectEntry, registry, { existingCode: "a2", forVerified: true });
assert(rv.ok, "Test 12: redirect-only verified entry passes");

const createOk = K.validateCreateInput(
  {
    targetUrl: "https://www.islamweb.net/x#:~:text=Start,Ende",
    adminNote: "Band 1, S. 176",
    quote: "Testaussage"
  },
  registry
);
assert(createOk.ok, "Test 13: create input with text fragment passes");

const createBad = K.validateCreateInput(
  { targetUrl: "https://evil.example.com/x", adminNote: "x", quote: "y" },
  registry
);
assert(!createBad.ok && createBad.errors.some((e) => /Domain nicht erlaubt/i.test(e)), "Test 14: create blocks bad domain");

const createNoFrag = K.validateCreateInput(
  { targetUrl: "https://www.islamweb.net/x", adminNote: "Band 1", quote: "Test" },
  registry
);
assert(!createNoFrag.ok && createNoFrag.errors.some((e) => /Textmarkierung fehlt/i.test(e)), "Test 15: create blocks missing text fragment");

const channelText = K.buildChannelShareText({
  title: "Titel",
  hashtags: "Tag1 Tag2",
  statement: "Beitragstext",
  sourceCitation: "al-Lālakāʾī, Band 1",
  code: "a17",
  fazit: "Kurzer Fazit-Satz."
});
assert(channelText.includes("📖 Titel") && channelText.includes("#Tag1") && channelText.includes("🔗 https://dar-al-tawhid.de/a17") && channelText.includes("🌙 **Fazit:**"), "Test 16: Instagram channel share text format");

const htmlActive = K.buildRedirectHtml({ code: "a3", status: "active", targetUrl: "https://www.islamweb.net/x" });
assert(/location\.replace/i.test(htmlActive), "Test 17: active status redirects");

assert(typeof K.GPT_ACTION_INSTRUCTIONS === "string" && K.GPT_ACTION_INSTRUCTIONS.includes("createInstagramChannelPost"), "Test 18: GPT Action instructions present");
assert(String(K.GPT_ACTION_OPENAPI_URL || "").includes("gpt-instagram-channel-openapi"), "Test 19: GPT OpenAPI URL");

const imageText = K.buildImageShareText({
  scholar: "Ibn 'Abd al-Barr",
  quote: "Der Weg der Gelehrten von Ahlus-Sunnah ist, an solche Texte zu glauben – ohne Wie-Beschreibung.",
  sourceCitation: "al-Istidhkār, Bd. 8, S. 152",
  code: "a5"
});
assert(imageText.includes("Ibn 'Abd al-Barr sagte:") && !imageText.includes("Fazit") && imageText.includes("🔗 https://dar-al-tawhid.de/a5"), "Test 20: image post = only quote + source + link");

if (asserter.failed) {
  console.error(`\n${asserter.failed} Kurzlink-Test(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nAlle Kurzlink-Manager-Tests bestanden.");
