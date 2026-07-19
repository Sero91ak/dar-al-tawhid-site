#!/usr/bin/env node
/** DAR AL TAWḤĪD – Tagesinhalte ohne Wiederholung. */

const fs = require("node:fs");
const path = require("node:path");
const { buildDuaIndex } = require("./build-dua-index");

const ROOT = path.resolve(__dirname, "..");
const TZ = "Europe/Berlin";
const POSTS_DIR = path.join(ROOT, "content/posts");
const POSTS_INDEX = path.join(POSTS_DIR, "posts-index.json");
const DAILY_FILE = path.join(ROOT, "content/updates/daily.json");
const STATE_FILE = path.join(ROOT, "content/admin/daily-content-rotation.json");

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function dayKey(date = new Date(), timeZone = TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function unique(items, keyFn) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = String(keyFn(item) || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function frontmatter(markdown) {
  const block = (String(markdown).match(/^---\s*\n([\s\S]*?)\n---/) || [])[1] || "";
  const out = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*["']?([\s\S]*?)["']?\s*$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

function clean(text, max = 300) {
  return String(text || "")
    .replace(/^>\s*/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function loadDuaPool() {
  const { items } = buildDuaIndex();
  const enriched = items.map((item) => ({
    ...item,
    snippet: String(item.de || "").slice(0, 300)
  }));
  return {
    items: enriched,
    markdown: enriched.length,
    total: enriched.length,
    poolSize: enriched.length,
    canonicalSource: "content/duas/dua-*.md"
  };
}

function loadPostFiles() {
  const index = readJson(POSTS_INDEX, {});
  return unique(
    (Array.isArray(index.files) ? index.files : [])
      .map((entry) => typeof entry === "string" ? entry : entry?.name)
      .filter((name) => name && name.endsWith(".md") && fs.existsSync(path.join(POSTS_DIR, name))),
    (name) => name
  );
}

function parsePost(file) {
  const markdown = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const meta = frontmatter(markdown);
  const body = markdown.replace(/^---[\s\S]*?---/, "").trim();
  const first = body.split(/\n\s*\n/).find((part) => part.trim()) || "";
  return {
    id: meta.id || file.replace(/\.md$/i, ""),
    title: String(meta.title || meta.id || file).replace(/^📖\s*/, ""),
    file,
    category: meta.category || "",
    scholar: meta.scholar || "",
    snippet: clean(first, 220)
  };
}

function hashIndex(seed, size) {
  if (size <= 1) return 0;
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % size;
}

function normalizeState(items, keyFn, state = {}, fallbackLast = "") {
  const pool = unique(items, keyFn);
  const valid = new Set(pool.map((item) => String(keyFn(item))));
  let lastKey = String(state.lastKey || fallbackLast || "");
  if (!valid.has(lastKey)) lastKey = "";
  const usedKeys = unique(
    (Array.isArray(state.usedKeys) ? state.usedKeys : []).map((key) => ({ key: String(key) })),
    (item) => item.key
  ).map((item) => item.key).filter((key) => valid.has(key));
  if (lastKey && !usedKeys.includes(lastKey)) usedKeys.push(lastKey);
  return {
    cycle: Number.isInteger(state.cycle) && state.cycle >= 0 ? state.cycle : 0,
    usedKeys,
    lastKey,
    poolSize: pool.length,
    remaining: Math.max(0, pool.length - usedKeys.length),
    updatedAt: new Date().toISOString()
  };
}

function pickWithoutRepeat(items, keyFn, state = {}, fallbackLast = "", seed = "") {
  const pool = unique(items, keyFn);
  if (!pool.length) return { item: null, state: null };
  const normalized = normalizeState(pool, keyFn, state, fallbackLast);
  let { cycle, usedKeys, lastKey } = normalized;
  let available = pool.filter((item) => !usedKeys.includes(String(keyFn(item))));
  if (!available.length) {
    cycle += 1;
    usedKeys = [];
    available = pool.length > 1 ? pool.filter((item) => String(keyFn(item)) !== lastKey) : pool;
  }
  const item = available[hashIndex(`${seed}|${cycle}|${available.length}`, available.length)];
  const selected = String(keyFn(item));
  usedKeys.push(selected);
  return {
    item,
    state: {
      cycle,
      usedKeys,
      lastKey: selected,
      poolSize: pool.length,
      remaining: pool.length - usedKeys.length,
      updatedAt: new Date().toISOString()
    }
  };
}

function run() {
  const now = new Date();
  const date = dayKey(now);
  const previous = readJson(DAILY_FILE, {});
  const state = readJson(STATE_FILE, { version: 3, recommendation: {}, dua: {} });
  const posts = loadPostFiles();
  const duaSources = loadDuaPool();
  const sourceStats = {
    markdown: duaSources.markdown,
    total: duaSources.total,
    poolSize: duaSources.poolSize,
    canonicalSource: duaSources.canonicalSource
  };

  if (previous.date === date && previous.source === "dar-daily-no-repeat-rotation" && previous.recommendation?.id && previous.dua?.id) {
    const recommendation = normalizeState(posts, (file) => file, state.recommendation, previous.recommendation.file);
    const dua = normalizeState(duaSources.items, (item) => item.id, state.dua, previous.dua.id);
    writeJson(STATE_FILE, {
      ...state,
      version: 3,
      updatedAt: now.toISOString(),
      date,
      recommendation,
      dua,
      duaSources: sourceStats
    });
    writeJson(DAILY_FILE, {
      ...previous,
      rotation: {
        recommendation: { cycle: recommendation.cycle, poolSize: recommendation.poolSize, remaining: recommendation.remaining },
        dua: { cycle: dua.cycle, poolSize: dua.poolSize, remaining: dua.remaining, sources: sourceStats }
      }
    });
    console.log(`Tagesauswahl bleibt bestehen · kanonischer Duʿāʾ-Pool: ${duaSources.total}.`);
    return;
  }

  const postPick = pickWithoutRepeat(posts, (file) => file, state.recommendation, previous.recommendation?.file, `${date}|post`);
  const duaPick = pickWithoutRepeat(duaSources.items, (item) => item.id, state.dua, previous.dua?.id, `${date}|dua`);
  const recommendation = postPick.item ? parsePost(postPick.item) : null;
  const selected = duaPick.item;
  const dua = selected ? {
    id: selected.id,
    title: selected.title,
    snippet: selected.snippet || selected.de || "",
    category: selected.cat || ""
  } : null;
  if (!recommendation && !dua) throw new Error("Keine Tagesinhalte gefunden.");

  writeJson(STATE_FILE, {
    version: 3,
    updatedAt: now.toISOString(),
    date,
    recommendation: postPick.state || state.recommendation || {},
    dua: duaPick.state || state.dua || {},
    duaSources: sourceStats
  });
  writeJson(DAILY_FILE, {
    date,
    timezone: TZ,
    generated: now.toISOString(),
    source: "dar-daily-no-repeat-rotation",
    recommendation,
    dua,
    rotation: {
      recommendation: postPick.state ? { cycle: postPick.state.cycle, poolSize: postPick.state.poolSize, remaining: postPick.state.remaining } : null,
      dua: duaPick.state ? { cycle: duaPick.state.cycle, poolSize: duaPick.state.poolSize, remaining: duaPick.state.remaining, sources: sourceStats } : null
    }
  });
  console.log(`Tagesrotation ${date}: ${dua?.id || "keine Duʿāʾ"} · ${duaPick.state?.remaining ?? 0} von ${duaSources.total} verbleibend.`);
}

if (require.main === module) {
  try { run(); } catch (error) { console.error(error.stack || error); process.exit(1); }
}

module.exports = { dayKey, pickWithoutRepeat, loadDuaPool, run };
