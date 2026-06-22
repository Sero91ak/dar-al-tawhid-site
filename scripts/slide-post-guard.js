#!/usr/bin/env node
/**
 * SLIDE POST GUARD: Slide-Beiträge müssen alle Slides parsen (2- und 4-space YAML).
 *
 * Usage: node scripts/slide-post-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FIXTURE = path.join(
  ROOT,
  "content/posts/makan-allah-github-posts-final-423-makan-und-nuzul-bei-den-fruhen-imam.md"
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
  let failed = 0;
  const fail = (msg) => {
    console.error("SLIDE-POST-GUARD FAIL:", msg);
    failed += 1;
  };
  const ok = (msg) => console.log("SLIDE-POST-GUARD OK:", msg);

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
  if (indexHtml.includes("POST_PARSE_VERSION=4")) {
    fail("POST_PARSE_VERSION nicht erhöht");
  }

  const testHtml = fs.readFileSync(path.join(ROOT, "test/index.html"), "utf8");
  if (!testHtml.includes("function parseSlidesFromYaml(yaml)")) {
    fail("test/index.html ohne parseSlidesFromYaml");
  }

  if (failed) {
    process.exit(1);
  }
  ok("Alle Slide-Post-Checks bestanden");
}

runSlidePostGuard();
