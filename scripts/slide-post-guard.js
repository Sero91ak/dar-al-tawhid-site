#!/usr/bin/env node
/**
 * SLIDE POST GUARD: Slide-Beiträge müssen alle Slides parsen (2- und 4-space YAML).
 *
 * Usage: node scripts/slide-post-guard.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT, createReporter } = require("./lib/guard-report.cjs");

const FIXTURE = path.join(
  ROOT,
  "content/posts/makan-allah-github-posts-final-423-makan-und-nuzul-bei-den-fruhen-imam.md"
);
const FIXTURE_426 = path.join(
  ROOT,
  "content/posts/aqidah-426-ibn-abd-al-barr-ahlus-sunnah-bejahen-die-sifat-ohne-kayf.md"
);

function parseValue(v) {
  v = String(v || "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

function yamlTopLevelBlock(yaml, key) {
  const lines = String(yaml || "").split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_-]+:\s*/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out;
}

function readYamlScalar(lines, start, baseIndent, fold) {
  const block = [];
  let i = start + 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      block.push("");
      continue;
    }
    const indent = (line.match(/^ */) || [""])[0].length;
    if (indent <= baseIndent && /^\s*[A-Za-z0-9_-]+:\s*/.test(line)) break;
    if (indent <= baseIndent && /^\s*-\s*/.test(line)) break;
    block.push(line.slice(Math.min(line.length, baseIndent + 2)));
  }
  return {
    value: fold
      ? block.join(" ").replace(/\s+/g, " ").trim()
      : block.join("\n").trim(),
    next: i - 1,
  };
}

function parseYamlLinks(lines, start, baseIndent, listStopIndent) {
  const links = [];
  let item = null;
  let i = start + 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indent = (line.match(/^ */) || [""])[0].length;
    if (indent <= baseIndent && /^\s*[A-Za-z0-9_-]+:\s*/.test(line)) break;
    if (
      listStopIndent != null
        ? indent <= listStopIndent && /^\s*-\s*/.test(line)
        : indent <= baseIndent && /^\s*-\s*/.test(line)
    ) {
      break;
    }
    const label = line.match(/^\s*-\s*label:\s*(.*)$/);
    if (label) {
      item = { label: parseValue(label[1]), url: "" };
      links.push(item);
      continue;
    }
    const url = line.match(/^\s*url:\s*(.*)$/);
    if (url && item) item.url = parseValue(url[1]);
  }
  return { links: links.filter((x) => x.label || x.url), next: i - 1 };
}

function normalizeSlideEntry(slide) {
  const links = Array.isArray(slide?.links)
    ? slide.links
        .filter((x) => x && String(x.url || "").trim())
        .map((x) => ({
          label: String(x.label || "Quelle").trim() || "Quelle",
          url: String(x.url || "").trim(),
        }))
    : [];
  return {
    title: String(slide?.title || "").trim(),
    text: String(slide?.text || slide?.quote || slide?.statement || "").trim(),
    quote: String(slide?.quote || "").trim(),
    explanation: String(slide?.explanation || slide?.note || "").trim(),
    source: String(slide?.source || "").trim(),
    links,
  };
}

function parseSlidesFromYaml(yaml) {
  const lines = yamlTopLevelBlock(yaml, "slides");
  if (!lines.length) return [];
  let listIndent = null;
  lines.forEach((line) => {
    const m = line.match(/^(\s*)-\s/);
    if (m && m[1].length >= 1) {
      listIndent = listIndent === null ? m[1].length : Math.min(listIndent, m[1].length);
    }
  });
  if (listIndent === null) return [];
  const slideStartRe = new RegExp(`^\\s{${listIndent}}-\\s*(.*)$`);
  const slides = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const start = line.match(slideStartRe);
    if (start) {
      if (current) slides.push(current);
      current = {
        title: "",
        text: "",
        quote: "",
        explanation: "",
        source: "",
        links: [],
      };
      const inline = start[1].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (inline) current[inline[1]] = parseValue(inline[2]);
      continue;
    }
    if (!current) continue;
    const key = line.match(/^(\s+)([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!key) continue;
    const indent = key[1].length;
    const name = key[2];
    const raw = key[3].trim();
    if (name === "links") {
      const parsed = parseYamlLinks(lines, i, indent, listIndent);
      current.links = parsed.links;
      i = parsed.next;
      continue;
    }
    if (raw === "|" || raw === ">") {
      const scalar = readYamlScalar(lines, i, indent, raw === ">");
      current[name] = scalar.value;
      i = scalar.next;
      continue;
    }
    current[name] = parseValue(raw);
  }
  if (current) slides.push(current);
  return slides
    .map(normalizeSlideEntry)
    .filter(
      (slide) =>
        slide.title ||
        slide.text ||
        slide.quote ||
        slide.explanation ||
        slide.source ||
        slide.links.length
    );
}

function extractYaml(markdown) {
  const match = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
  return match ? match[1] : "";
}

function runSlidePostGuard() {
  const report = createReporter("SLIDE-POST-GUARD");
  const { fail, ok } = report;

  if (!fs.existsSync(FIXTURE)) {
    fail("Fixture fehlt: " + FIXTURE);
    process.exit(1);
  }

  const fixtureYaml = extractYaml(fs.readFileSync(FIXTURE, "utf8"));
  const fixtureSlides = parseSlidesFromYaml(fixtureYaml);
  if (fixtureSlides.length < 4) {
    fail(`Fixture erwartet >=4 Slides, bekam ${fixtureSlides.length}`);
  } else {
    ok(`Fixture parsed ${fixtureSlides.length} slides`);
  }
  if (!fixtureSlides[0]?.links?.length) fail("Slide 1 ohne Links");
  if (!fixtureSlides[1]?.source) fail("Slide 2 ohne Quelle");
  if (!fixtureSlides[2]?.explanation) fail("Slide 3 ohne Erklärung");

  if (!fs.existsSync(FIXTURE_426)) {
    fail("Fixture 426 fehlt: " + FIXTURE_426);
  } else {
    const slides426 = parseSlidesFromYaml(extractYaml(fs.readFileSync(FIXTURE_426, "utf8")));
    if (slides426.length !== 4) {
      fail(`Post 426 erwartet 4 Slides, bekam ${slides426.length}`);
    } else {
      ok(`Post 426 parsed ${slides426.length} slides`);
    }
  }

  const fourSpaceYaml = [
    "slides:",
    "    - title: A",
    "      text: eins",
    "      links:",
    "        - label: Link A",
    "          url: https://example.com/a",
    "    - title: B",
    "      text: zwei",
    "      source: Quelle B",
    "    - title: C",
    "      quote: Zitat",
    "      explanation: Erklärung",
    "    - title: D",
    "      text: fazit",
  ].join("\n");
  const fourSpaceSlides = parseSlidesFromYaml(fourSpaceYaml);
  if (fourSpaceSlides.length !== 4) {
    fail(`4-space YAML erwartet 4 Slides, bekam ${fourSpaceSlides.length}`);
  } else {
    ok("4-space YAML parsed 4 slides");
  }

  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (!indexHtml.includes("function parseSlidesFromYaml(yaml)")) {
    fail("index.html ohne parseSlidesFromYaml");
  }
  if (!indexHtml.includes("--slide-bg:")) {
    fail("index.html ohne Slide-Theme-Tokens");
  }
  if (!indexHtml.includes("updatePostAfterSlidePanel")) {
    fail("index.html ohne Slide-Quellen-Sync");
  }
  if (indexHtml.includes("POST_PARSE_VERSION=6")) {
    fail("POST_PARSE_VERSION nicht erhöht (erwartet 7)");
  }
  if (!indexHtml.includes("ensurePostSlidesHydrated")) {
    fail("index.html ohne ensurePostSlidesHydrated");
  }
  if (!indexHtml.includes("_rawBody:body")) {
    fail("index.html speichert _rawBody nicht in parseFrontMatter");
  }
  if (!indexHtml.includes("slide-post-parser.js")) {
    fail("index.html lädt slide-post-parser.js nicht");
  }

  const parserJs = fs.readFileSync(path.join(ROOT, "assets/slide-post-parser.js"), "utf8");
  const sandbox = { window: {}, global: {} };
  sandbox.global = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(parserJs, sandbox);
  const P = sandbox.window.DARSlidePostParser;

  const bodySlideMarkdown = [
    "---",
    'id: "guard-body-slide-fixture"',
    "type: slide",
    "---",
    "",
    "<!-- slide: 1 -->",
    "# Erster Slide",
    "Inhalt eins",
    "<!-- slide: 2 -->",
    "# Zweiter Slide",
    "Inhalt zwei",
  ].join("\n");
  const bodySlideAudit = P.analyzeSlideMarkdown(bodySlideMarkdown);
  if (!bodySlideAudit.isSlide) fail("Body-Slide-Marker nicht als Slide erkannt");
  else ok(`Body-Slide-Marker: ${bodySlideAudit.slideCount} Slides`);
  if (bodySlideAudit.slideCount !== 2) {
    fail(`Body-Slide-Marker erwartet 2 Slides, bekam ${bodySlideAudit.slideCount}`);
  }
  if (!bodySlideAudit.slides[0]?.title?.includes("Erster")) fail("Body-Slide Slide 1 Titel fehlt");
  if (String(bodySlideAudit.slides[0]?.text || "").includes("<!-- slide")) {
    fail("Slide-Marker sichtbar im geparsten Text");
  }

  const qiyasFixture = path.join(ROOT, "scripts/fixtures/qiyas-slide-post.md");
  if (!fs.existsSync(qiyasFixture)) {
    fail("Qiyās-Fixture fehlt: " + qiyasFixture);
  } else {
    const qiyasAudit = P.analyzeSlideMarkdown(fs.readFileSync(qiyasFixture, "utf8"));
    if (!qiyasAudit.isSlide) fail("Qiyās-Beitrag nicht als Slide erkannt");
    else ok(`Qiyās-Beitrag: ${qiyasAudit.slideCount} Slides`);
    if (qiyasAudit.slideCount !== 10) fail(`Qiyās erwartet 10 Slides, bekam ${qiyasAudit.slideCount}`);
    if (!qiyasAudit.slides[0]?.title?.includes("Qiy")) fail("Qiyās Slide 1 Titel fehlt");
    if (!qiyasAudit.slides[1]?.title?.includes("Laien")) fail("Qiyās Slide 2 Titel fehlt");
    if (String(qiyasAudit.slides[0]?.text || "").includes("<!-- slide")) {
      fail("Qiyās: Slide-Marker sichtbar im geparsten Text");
    }
  }

  const testHtml = fs.readFileSync(path.join(ROOT, "test/index.html"), "utf8");
  if (!testHtml.includes("function parseSlidesFromYaml(yaml)")) {
    fail("test/index.html ohne parseSlidesFromYaml");
  }

  if (report.failed) {
    process.exit(1);
  }
  ok("Alle Slide-Post-Checks bestanden");
}

runSlidePostGuard();
