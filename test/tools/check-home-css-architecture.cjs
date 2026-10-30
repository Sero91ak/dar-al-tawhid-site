"use strict";
/*
 * DAR TEST — CSS ownership regression gate.
 * Only the active #darHomeHtmlParityV1 start page is checked here.
 * The legacy V3 tree is still a data source for recent posts and prayer:
 * do not remove it before replacing those dependencies.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "../..");
const file = path.join(root, "test/assets/dar-home-html-parity-v1.js");
const source = fs.readFileSync(file, "utf8");
new vm.Script(source, { filename: file });

const start = source.indexOf("function stylesheet(){");
const end = source.indexOf("\nfunction create()", start);
assert(start >= 0 && end > start, "Active Home stylesheet not found");
const css = source.slice(start, end);
const other = source.slice(0, start) + source.slice(end);

assert(source.includes("window.__darHomeHtmlParityV1=true"), "Active test home ownership guard missing");
assert(source.includes("!/^\\/test(?:\\/|$)/.test(location.pathname)"), "Adult /test route isolation missing");
assert(source.includes('i?"dhp-article dhp-post-capsule"'), "Secondary publication is no longer a capsule");
assert(source.includes('"dhp-panel dhp-feature dhp-post-capsule"'), "Featured publication is no longer a capsule");
assert(css.includes("border:1px solid var(--dhp-capsule-rim)!important"), "Capsule perimeter missing");
assert(!css.includes(".dhp-article:last-child{"), "Legacy last-child rule erases the bottom capsule border");
assert(!css.includes(".dhp-article:not(.dhp-post-capsule):last-child{"), "Unused historical fallback reintroduced");

const removed = [
  "dhp-arrow", "dhp-brand", "dhp-brand-copy", "dhp-brand-rule",
  "dhp-footer", "dhp-link", "dhp-resume", "dhp-seal", "dhp-smallcard", "dhp-two"
];
for (const name of removed) {
  const pattern = new RegExp("\\." + name + "(?![\\w-])");
  assert(!pattern.test(css), "Obsolete Home CSS selector reintroduced: ." + name);
  // A new, genuinely rendered element must receive new, owned component CSS,
  // not revive the previous multi-generation cascade unnoticed.
  assert(!other.includes('class="' + name + '"'), "Old Home class reintroduced: " + name);
}
for (const id of ["dhpPosts", "dhpTodayArticle", "dhpLibrary", "dhpQResume"]) {
  assert(source.includes(id), "Required existing home function missing: " + id);
}
assert(!source.includes('document.querySelectorAll("#dv3Latest .dv3-post'),
  "Active Home must never scrape hidden V3 publication markup");
assert(source.includes('typeof posts!=="undefined"'),
  "Canonical posts data source must be used directly");

// Never add the same unconditional selector/property/value twice again.
// A redundant declaration is an obsolete style layer, not a fallback.
// Content pseudo-element compatibility is checked separately.
const actualCss = vm.runInNewContext(source.slice(start, end) + "\nstylesheet()");
const seenDeclarations = new Map();
for (const line of actualCss.split("\n")) {
  const match = line.match(/^(#darHomeHtmlParityV1[^{]*?)\{([^{}]*)\}$/);
  if (!match) continue; // Media queries have independent conditions.
  const declarations = seenDeclarations.get(match[1]) || new Map();
  for (const d of match[2].split(";").map(s => s.trim()).filter(Boolean)) {
    const sep = d.indexOf(":");
    if (sep < 0) continue;
    const property = d.slice(0, sep);
    const value = d.slice(sep + 1);
    if (property !== "content" && property !== "src") {
      assert.notEqual(declarations.get(property), value,
        "Duplicate CSS declaration in active Home: " + match[1] + " / " + property);
    }
    declarations.set(property, value);
  }
  seenDeclarations.set(match[1], declarations);
}

// A capsule must have its full perimeter BEFORE touch/focus.
// The retired 120deg fading pseudo-rim is not a legitimate capsule border.
assert(!actualCss.includes("linear-gradient(120deg,var(--dhp-rim)"),
  "Fading pseudo-border was reintroduced");
const capsuleRule = actualCss.split("\n").find(line => line.includes(".dhp-post-capsule{position:relative"));
const capsuleGroup = actualCss.split("\n").find(line => line.includes(".dhp-posts{display:grid"));
const uniformRim = actualCss.split("\n").find(line =>
  line.includes(":is(.dhp-prayer,.dhp-quick,.dhp-search-pill,.dhp-quran-capsule,.dhp-panel,.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-head button){"));
assert(capsuleRule && capsuleRule.includes("overflow:visible!important"), "Capsule content clipped in normal state");
assert(capsuleGroup && capsuleGroup.includes("overflow:visible!important"), "Capsule parent still clips the edge");
assert(uniformRim && uniformRim.includes("border:1px solid var(--dhp-capsule-rim)!important"),
  "Resting capsule border is not complete");
assert(uniformRim.includes("border-image:none!important"), "Gradient border image can hide capsule edges");

console.log("PASS — DĀR TEST active Home CSS: dead selectors absent, capsules intact, routes isolated.");
