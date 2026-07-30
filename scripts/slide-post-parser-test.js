#!/usr/bin/env node
/**
 * Unit-Tests für assets/slide-post-parser.js (DARSlidePostParser).
 * Deckt die exportierten Hilfsfunktionen direkt ab (Frontmatter, Marker, Slides).
 *
 * Usage: node scripts/slide-post-parser-test.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sandbox = { window: {} };
sandbox.globalThis = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/slide-post-parser.js"), "utf8"), sandbox);
const P = sandbox.window.DARSlidePostParser;

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log("OK:", msg);
  else {
    console.error("FAIL:", msg);
    failed += 1;
  }
}

assert(P && typeof P.parseSlidesFromBody === "function", "DARSlidePostParser exportiert");

// --- parseValue ---
assert(P.parseValue('"Hallo"') === "Hallo", "parseValue entfernt doppelte Quotes");
assert(P.parseValue("'Welt'") === "Welt", "parseValue entfernt einfache Quotes");
assert(P.parseValue("  roh  ") === "roh", "parseValue trimmt ohne Quotes");
assert(P.parseValue(null) === "", "parseValue(null) leer");

// --- normalizeSlideEntry ---
const norm = P.normalizeSlideEntry({
  title: "  Titel  ",
  quote: "Zitat",
  links: [{ url: "https://x/a", label: "Link A" }, { url: "" }]
});
assert(norm.title === "Titel", "normalizeSlideEntry trimmt Titel");
assert(norm.text === "Zitat", "normalizeSlideEntry text fällt auf quote zurück");
assert(norm.links.length === 1 && norm.links[0].label === "Link A", "normalizeSlideEntry filtert leere Links");
const normDefaultLabel = P.normalizeSlideEntry({ links: [{ url: "https://x/b" }] });
assert(normDefaultLabel.links[0].label === "Quelle", "normalizeSlideEntry Default-Label Quelle");
assert(P.normalizeSlideEntry(null).title === "", "normalizeSlideEntry(null) robust");

// --- sanitizeSlideMarkdownBody ---
assert(P.sanitizeSlideMarkdownBody("```markdown\nInhalt\n```") === "Inhalt", "sanitizeSlideMarkdownBody entfernt Codeblock");
assert(P.sanitizeSlideMarkdownBody("\uFEFF  Text  ") === "Text", "sanitizeSlideMarkdownBody entfernt BOM + trimmt");

// --- bodyHasSlideMarkers ---
assert(P.bodyHasSlideMarkers("Intro <!-- slide: 2 --> Rest") === true, "bodyHasSlideMarkers erkennt Marker");
assert(P.bodyHasSlideMarkers("kein Marker") === false, "bodyHasSlideMarkers ohne Marker false");

// --- isSlidePostMode ---
assert(P.isSlidePostMode("slides", "", "") === true, "isSlidePostMode layout=slides");
assert(P.isSlidePostMode("", "slide", "") === true, "isSlidePostMode type=slide");
assert(P.isSlidePostMode("", "", "<!-- slide: 1 -->") === true, "isSlidePostMode Body-Marker");
assert(P.isSlidePostMode("article", "post", "reiner Text") === false, "isSlidePostMode normaler Beitrag false");

// --- isSlidePostRecord ---
assert(P.isSlidePostRecord({ slides: [{ title: "A" }] }) === true, "isSlidePostRecord mit slides-Array");
assert(P.isSlidePostRecord({ type: "slide" }) === true, "isSlidePostRecord mit type slide");
assert(P.isSlidePostRecord({ statement: "<!-- slide: 1 -->" }) === true, "isSlidePostRecord mit Body-Marker");
assert(P.isSlidePostRecord({ type: "post" }) === false, "isSlidePostRecord normaler Beitrag false");
assert(P.isSlidePostRecord(null) === false, "isSlidePostRecord(null) false");

// --- parseSlidesFromBody ---
const body = ["<!-- slide: 1 -->", "# Eins", "Text eins", "<!-- slide: 2 -->", "# Zwei", "Text zwei"].join("\n");
const bodySlides = P.parseSlidesFromBody(body);
assert(bodySlides.length === 2, "parseSlidesFromBody liefert 2 Slides");
assert(bodySlides[0].title === "Eins" && bodySlides[0].text === "Text eins", "parseSlidesFromBody Slide 1 Titel + Text");
assert(!bodySlides[0].text.includes("<!-- slide"), "parseSlidesFromBody entfernt Marker aus Text");
assert(P.parseSlidesFromBody("kein Marker").length === 0, "parseSlidesFromBody ohne Marker leer");

// --- analyzeSlideMarkdown ---
const slideMd = ['---', 'type: "slide"', '---', '', body].join("\n");
const audit = P.analyzeSlideMarkdown(slideMd);
assert(audit.isSlide === true && audit.slideCount === 2, "analyzeSlideMarkdown erkennt 2 Slides");
assert(audit.hasTypeSlide === true && audit.errors.length === 0, "analyzeSlideMarkdown gültiger Slide ohne Fehler");

const brokenMd = ['---', 'type: "slide"', '---', '', 'Kein Slide-Marker hier'].join("\n");
const brokenAudit = P.analyzeSlideMarkdown(brokenMd);
assert(brokenAudit.errors.length > 0, "analyzeSlideMarkdown meldet Fehler bei type slide ohne Slides");

const markerNoType = ['---', 'title: "x"', '---', '', '<!-- slide: 1 -->', '# A', 'Text'].join("\n");
const warnAudit = P.analyzeSlideMarkdown(markerNoType);
assert(warnAudit.warnings.length > 0 && warnAudit.errors.length === 0, "analyzeSlideMarkdown warnt bei Marker ohne type");

// --- validateSlideMarkdown ---
assert(P.validateSlideMarkdown(slideMd).ok === true, "validateSlideMarkdown gültiger Slide ok");
const invalid = P.validateSlideMarkdown(brokenMd);
assert(invalid.ok === false && invalid.errors.length > 0, "validateSlideMarkdown ungültiger Slide nicht ok");

if (failed) {
  console.error(`\n${failed} Slide-Post-Parser-Test(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nAlle Slide-Post-Parser-Tests bestanden.");
