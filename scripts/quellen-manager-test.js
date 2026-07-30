#!/usr/bin/env node
/**
 * Pflicht-Tests für Quellen-Manager (Markdown/YAML)
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sampleSlide = fs.readFileSync(
  path.join(ROOT, "content/posts/aqidah-426-ibn-abd-al-barr-ahlus-sunnah-bejahen-die-sifat-ohne-kayf.md"),
  "utf8"
);

const sandbox = { window: {} };
sandbox.globalThis = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "admin/quellen-manager.js"), "utf8"), sandbox);
const Q = sandbox.window.DARQuellen;

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

// Test 1: Normal post link append
const normalMd = `---\nid: "test-137"\ntitle: "Test"\ncategory: "Aqidah"\nsource: "Testquelle"\n---\n\nBody`;
let t1 = Q.appendLinkToMarkdownTarget(normalMd, "→ PDF/Scan", "/assets/sources/test/test.pdf#page=152", "post");
assert(t1.includes('label: "→ PDF/Scan"'), "Test 1: label in markdown");
assert(t1.includes("/assets/sources/test/test.pdf#page=152"), "Test 1: PDF URL with page");

// Test 2: Bild-Scan
let t2 = Q.appendLinkToMarkdownTarget(normalMd, "→ Bild-Scan", "/assets/sources/test/scan.png", "post");
assert(t2.includes("→ Bild-Scan") && t2.includes("scan.png"), "Test 2: Bild-Scan link");

// Test 3: Slide-only link (slide 2 = index 1)
let t3 = Q.appendLinkToMarkdownTarget(sampleSlide, "→ Bild-Scan", "/assets/sources/test/slide2.png", { scope: "slide", indices: [1] });
const info3 = Q.analyzePostSources(t3);
assert(info3.slides[1].links.some((l) => l.url.includes("slide2.png")), "Test 3: Slide 2 has link");
assert(!info3.slides[0].links.some((l) => l.url.includes("slide2.png")), "Test 3: Slide 1 does not have link");

// Test 4: PDF page
assert(t1.includes("#page=152"), "Test 4: PDF page fragment");

// Test 5: Remove link
const infoBefore = Q.analyzePostSources(t3);
const linkIdx = infoBefore.slides[1].links.findIndex((l) => l.url.includes("slide2.png"));
let t5 = Q.removeLinkFromMarkdownTarget(t3, { scope: "slide", indices: [1] }, linkIdx);
const info5 = Q.analyzePostSources(t5);
assert(!info5.slides[1].links.some((l) => l.url.includes("slide2.png")), "Test 5: Link removed, post intact");
assert(info5.slides.length >= 4, "Test 5: Slides still valid");

// Test 6: Replace path concept (update link URL)
let t6 = Q.appendLinkToMarkdownTarget(normalMd, "→ Scan", "/assets/sources/old.png", "post");
t6 = Q.updateLinkInMarkdownTarget(t6, "post", 0, "→ Scan", "/assets/sources/new.png");
assert(t6.includes("/assets/sources/new.png"), "Test 6: Link URL updated");
assert(!t6.includes("/assets/sources/old.png"), "Test 6: Old URL not in markdown (file may remain in repo)");

// Slide image field
let t7 = Q.setSlideMediaField(sampleSlide, 1, "image", "/assets/sources/hammad-scan.png");
const info7 = Q.analyzePostSources(t7);
assert(info7.slides[1].image.includes("hammad-scan.png"), "Test 7: slide.image set on slide 2");

// Validation
const val = Q.validateSourceSave(t1, [{ path: "assets/sources/test/test.pdf" }]);
assert(val.ok, "Validation passes for valid post");

if (failed) {
  console.error(`\n${failed} Test(s) fehlgeschlagen`);
  process.exit(1);
}
console.log("\nAlle Quellen-Manager-Tests bestanden.");
