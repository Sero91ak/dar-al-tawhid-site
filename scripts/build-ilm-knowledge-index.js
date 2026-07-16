#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const POSTS_INDEX_PATH = path.join(POSTS_DIR, "posts-index.json");
const DUAS_PATH = path.join(ROOT, "content", "duas", "duas.json");
const QURAN_INDEX_PATH = path.join(ROOT, "data", "quran-search-index.json");
const HADITH_INDEX_PATH = path.join(ROOT, "data", "hadith", "search-index.json");
const QUIZ_PATH = path.join(ROOT, "data", "quiz-questions.json");
const OUTPUT_PATH = path.join(ROOT, "data", "ilm-knowledge-index.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readOptionalJson(file, fallback) {
  try {
    return readJson(file);
  } catch (error) {
    if (error && (error.code === "ENOENT" || error instanceof SyntaxError)) return fallback;
    throw error;
  }
}

function parseValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  if (text === "true") return true;
  if (text === "false") return false;
  return text;
}

function parseFrontMatter(markdown, filename) {
  const src = String(markdown || "").replace(/^\uFEFF/, "");
  const match = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const body = match ? match[2] || "" : src;
  const yaml = match ? match[1] || "" : "";
  const frontmatter = {};
  const lines = yaml.split(/\r?\n/);
  let current = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      current = keyMatch[1];
      const raw = keyMatch[2].trim();
      if (raw === "|" || raw === ">") {
        const block = [];
        for (i += 1; i < lines.length; i += 1) {
          if (/^[A-Za-z0-9_-]+:\s*/.test(lines[i])) {
            i -= 1;
            break;
          }
          block.push(lines[i].replace(/^\s{2}/, ""));
        }
        frontmatter[current] = raw === ">" ? block.join(" ").replace(/\s+/g, " ").trim() : block.join("\n").trim();
        continue;
      }
      frontmatter[current] = raw === "" ? [] : parseValue(raw);
      continue;
    }
    const listMatch = line.match(/^\s*-\s*(.*)$/);
    if (listMatch && current && current !== "links") {
      if (!Array.isArray(frontmatter[current])) frontmatter[current] = [];
      frontmatter[current].push(parseValue(listMatch[1]));
    }
  }
  const linksMatch = yaml.match(/links:\s*\n([\s\S]*?)(?:\n[A-Za-z0-9_-]+:|$)/);
  if (linksMatch) {
    const links = [];
    let item = null;
    linksMatch[1].split(/\r?\n/).forEach((line) => {
      const labelMatch = line.match(/^\s*-\s*label:\s*(.*)$/);
      if (labelMatch) {
        item = { label: parseValue(labelMatch[1]), url: "" };
        links.push(item);
        return;
      }
      const urlMatch = line.match(/^\s*url:\s*(.*)$/);
      if (urlMatch && item) item.url = parseValue(urlMatch[1]);
    });
    if (links.length) frontmatter.links = links;
  }
  return {
    id: frontmatter.id || filename.replace(/\.md$/i, ""),
    title: frontmatter.title || filename.replace(/\.md$/i, ""),
    category: frontmatter.category || "",
    topic: frontmatter.topic || frontmatter.category || "",
    scholar: frontmatter.scholar || "",
    book: frontmatter.book || "",
    author: frontmatter.author || "",
    source: frontmatter.source || "",
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    links: Array.isArray(frontmatter.links) ? frontmatter.links : [],
    statement: cleanMarkdown(body),
  };
}

function cleanMarkdown(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/^[>#*-]\s*/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceType(post) {
  const haystack = [post.category, post.topic, post.book, post.source, post.statement, (post.tags || []).join(" ")].join(" ").toLowerCase();
  if (haystack.includes("qurʾān") || haystack.includes("quran") || haystack.includes("tafsīr")) return "quran";
  if (haystack.includes("hadith") || haystack.includes("ḥadīth") || haystack.includes("sunnah") || haystack.includes("bukh") || haystack.includes("muslim")) return "sunnah";
  if (haystack.includes("athar") || haystack.includes("āthār") || haystack.includes("ṣaḥāb") || haystack.includes("tabi") || haystack.includes("tābi") || haystack.includes("muṣannaf")) return "athar";
  return "posts";
}

function normalizePostKind(post) {
  const inferred = sourceType(post);
  if (inferred !== "posts") return inferred;
  const haystack = [post.category, post.topic, post.book, post.source, (post.tags || []).join(" "), post.title].join(" ").toLowerCase();
  if (/sahab|salaf|athar|tabi/.test(haystack)) return "athar";
  if (/sunnah|hadith|bukhari|muslim/.test(haystack)) return "sunnah";
  if (/quran|tafsir/.test(haystack)) return "quran";
  return "posts";
}

function buildPostEntries() {
  const index = readJson(POSTS_INDEX_PATH);
  const files = Array.isArray(index?.files) ? index.files : [];
  return files.map((entry) => {
    const name = String(entry?.name || "");
    const fullPath = path.join(POSTS_DIR, name);
    const post = parseFrontMatter(fs.readFileSync(fullPath, "utf8"), name);
    const links = (Array.isArray(post.links) ? post.links : [])
      .map((item, idx) => ({
        id: `link-${post.id}-${idx}`,
        label: String(item.label || "Link"),
        url: String(item.url || ""),
        external: /^https?:/i.test(String(item.url || "")),
      }))
      .filter((item) => item.url);
    const excerpt = post.statement.slice(0, 320);
    return {
      id: `post-${post.id}`,
      documentId: String(post.id),
      kind: normalizePostKind(post),
      title: post.title,
      speaker: post.scholar || post.author || "",
      work: post.book || "",
      reference: post.source || "",
      excerpt,
      body: post.statement,
      route: { view: "post", value: String(post.id) },
      postId: String(post.id),
      links,
      sourceTag: "Beitrag auf DAR AL TAWḤID",
      contextHints: [post.title, post.category, post.topic, post.scholar, post.book].filter(Boolean),
      searchText: [post.title, post.category, post.topic, post.scholar, post.book, post.source, post.statement, (post.tags || []).join(" ")].join(" "),
      sourceQuality: 1.4 + (post.source ? 1.2 : 0) + (links.length ? 0.8 : 0) + (post.book ? 0.6 : 0),
    };
  });
}

function buildDuaEntries() {
  const rows = readOptionalJson(DUAS_PATH, []);
  return (Array.isArray(rows) ? rows : []).map((dua) => ({
    id: `dua-${dua.id}`,
    documentId: String(dua.id),
    kind: String(dua.type || "").toLowerCase().includes("qur") ? "quran" : "dua",
    title: dua.title || "Duʿāʾ",
    speaker: "",
    work: dua.type || "Duʿāʾ",
    reference: dua.src || "",
    excerpt: dua.de || dua.occasion || "",
    body: [dua.ar, dua.tr, dua.de, dua.src].filter(Boolean).join("\n"),
    route: { view: "dua", value: String(dua.id) },
    links: [],
    sourceTag: "Duʿāʾ auf DAR AL TAWḤID",
    contextHints: [dua.title, dua.cat, dua.occasion, dua.type].filter(Boolean),
    searchText: [dua.title, dua.cat, dua.occasion, dua.de, dua.src, dua.type].join(" "),
    sourceQuality: 1.2 + (dua.src ? 1.1 : 0),
  }));
}

function buildQuranEntries() {
  const rows = readOptionalJson(QURAN_INDEX_PATH, []);
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: `quran-${row.surahId}-${row.ayah}`,
    documentId: `quran-${row.surahId}`,
    kind: "quran",
    title: `${row.surahName || "Qurʾān"} ${row.ayah}`,
    speaker: "Qurʾān",
    work: row.surahName || "Qurʾān",
    reference: `${row.surahName || "Qurʾān"} ${row.surahId || ""}:${row.ayah || ""}`.trim(),
    excerpt: row.de || row.tr || "",
    body: [row.ar, row.tr, row.de].filter(Boolean).join("\n"),
    route: { view: "quran-surah", value: `${row.surahId}/${row.ayah}` },
    links: [],
    sourceTag: "Qurʾān-Fundstelle hinterlegt",
    contextHints: [row.surahName, row.de, row.tr, row.tagText].filter(Boolean),
    searchText: [row.surahName, row.surahArabic, row.ar, row.tr, row.de, row.tagText].join(" "),
    sourceQuality: 3.8,
  }));
}

function buildHadithEntries() {
  const rows = readOptionalJson(HADITH_INDEX_PATH, []);
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: `hadith-${row.bookId || row.bookTitle || "book"}-${row.hadithNumber || row.id || "x"}`,
    documentId: String(row.id || `${row.bookId || row.bookTitle}-${row.hadithNumber || ""}`),
    kind: "sunnah",
    title: `${row.bookTitle || "Ḥadīṯ"}${row.hadithNumber ? ` · Nr. ${row.hadithNumber}` : ""}`,
    speaker: "Sunnah / Ḥadīṯ",
    work: row.bookTitle || "",
    reference: [row.chapterTitle, row.sectionTitle, row.source].filter(Boolean).join(" · "),
    excerpt: row.german || "",
    body: [row.german, row.arabic, row.chapterTitle, row.sectionTitle, (row.tags || []).join(", ")].filter(Boolean).join("\n"),
    route: { view: "more", value: "" },
    links: [],
    sourceTag: "Ḥadīṯ-Fundstelle auf DAR AL TAWḤID",
    contextHints: [row.bookTitle, row.chapterTitle, row.sectionTitle, row.german, (row.tags || []).join(" ")].filter(Boolean),
    searchText: [row.bookTitle, row.chapterTitle, row.sectionTitle, row.german, row.searchText, (row.tags || []).join(" ")].join(" "),
    sourceQuality: 2.6 + (row.source ? 0.8 : 0),
  }));
}

function buildQuizEntries() {
  const rows = readOptionalJson(QUIZ_PATH, []);
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && row.status === "published")
    .map((row) => ({
      id: `quiz-${row.id}`,
      documentId: String(row.id),
      kind: "quiz",
      title: row.topic || row.category || "Quiz",
      speaker: "",
      work: "Din-Quiz",
      reference: row.source || "",
      excerpt: row.question || "",
      body: [row.question, Array.isArray(row.answers) ? row.answers.join(" · ") : "", row.explanation, row.source].filter(Boolean).join("\n"),
      route: { view: "more", value: "" },
      links: [],
      sourceTag: "Quiz-Inhalt auf DAR AL TAWḤID",
      contextHints: [row.question, row.topic, row.category, row.level, row.explanation].filter(Boolean),
      searchText: [row.question, Array.isArray(row.answers) ? row.answers.join(" ") : "", row.explanation, row.source, row.category, row.topic, row.level].join(" "),
      sourceQuality: 0.7 + (row.source ? 0.5 : 0),
    }));
}

function main() {
  const entries = []
    .concat(buildPostEntries())
    .concat(buildDuaEntries())
    .concat(buildQuranEntries())
    .concat(buildHadithEntries())
    .concat(buildQuizEntries());

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${entries.length} entries to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
