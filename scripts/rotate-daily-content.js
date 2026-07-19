#!/usr/bin/env node
/**
 * DAR AL TAWḤĪD – tägliche Inhalte ohne Wiederholung.
 * Jeder Duʿāʾ- und Beitrags-Pool wird vollständig durchlaufen,
 * bevor ein bereits verwendeter Inhalt erneut ausgewählt werden darf.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const TIME_ZONE = "Europe/Berlin";
const POSTS_INDEX_PATH = path.join(ROOT, "content/posts/posts-index.json");
const POSTS_DIR = path.join(ROOT, "content/posts");
const DUA_DIR = path.join(ROOT, "content/duas");
const DUA_POOL_PATH = path.join(DUA_DIR, "daily-dua-pool.json");
const DUA_COMBINED_POOL_PATH = path.join(DUA_DIR, "daily-dua-combined-pool.json");
const DAILY_PATH = path.join(ROOT, "content/updates/daily.json");
const ROTATION_PATH = path.join(ROOT, "content/admin/daily-content-rotation.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function dayKey(date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function uniqueByKey(items, getKey) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = String(getKey(item) || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function stableIndex(seed, size) {
  if (size <= 1) return 0;
  let hash = 2166136261;
  for (const char of String(seed || "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % size;
}

function normalizeRotationState(items, getKey, rawState, fallbackLastKey) {
  const pool = uniqueByKey(items, getKey);
  const validKeys = new Set(pool.map((item) => String(getKey(item))));
  const previous = rawState && typeof rawState === "object" ? rawState : {};
  const cycle = Number.isInteger(previous.cycle) && previous.cycle >= 0 ? previous.cycle : 0;
  let lastKey = String(previous.lastKey || fallbackLastKey || "").trim();
  if (!validKeys.has(lastKey)) lastKey = "";

  const usedKeys = uniqueByKey(
    (Array.isArray(previous.usedKeys) ? previous.usedKeys : []).map((key) => ({ key: String(key) })),
    (item) => item.key
  )
    .map((item) => item.key)
    .filter((key) => validKeys.has(key));

  if (lastKey && !usedKeys.includes(lastKey)) usedKeys.push(lastKey);

  return {
    cycle,
    usedKeys,
    lastKey,
    poolSize: pool.length,
    remaining: Math.max(0, pool.length - usedKeys.length),
    updatedAt: new Date().toISOString()
  };
}

function pickWithoutRepeat(items, getKey, rawState, fallbackLastKey, seed) {
  const pool = uniqueByKey(items, getKey);
  if (!pool.length) return { item: null, state: null };

  const normalized = normalizeRotationState(pool, getKey, rawState, fallbackLastKey);
  let { cycle, usedKeys, lastKey } = normalized;

  let available = pool.filter((item) => !usedKeys.includes(String(getKey(item))));
  if (!available.length) {
    cycle += 1;
    usedKeys = [];
    available = pool.length > 1
      ? pool.filter((item) => String(getKey(item)) !== lastKey)
      : pool.slice();
  }

  const index = stableIndex(`${seed}|${cycle}|${available.length}`, available.length);
  const item = available[index];
  const selectedKey = String(getKey(item));
  if (!usedKeys.includes(selectedKey)) usedKeys.push(selectedKey);

  return {
    item,
    state: {
      cycle,
      usedKeys,
      lastKey: selectedKey,
      poolSize: pool.length,
      remaining: Math.max(0, pool.length - usedKeys.length),
      updatedAt: new Date().toISOString()
    }
  };
}

function parseFrontMatterValue(markdown, key) {
  const text = String(markdown || "");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return "";
  const line = match[1].match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"));
  return line ? line[1].trim() : "";
}

function cleanSnippet(text, maxLength = 220) {
  return String(text || "")
    .replace(/^>\s*/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parsePost(file) {
  const fullPath = path.join(POSTS_DIR, file);
  const markdown = fs.readFileSync(fullPath, "utf8");
  const body = markdown.replace(/^---[\s\S]*?---/, "").trim();
  const firstParagraph = body.split(/\n\s*\n/).find((part) => part.trim()) || "";
  const snippet = cleanSnippet(firstParagraph);

  const id = parseFrontMatterValue(markdown, "id") || file.replace(/\.md$/i, "");
  const title = parseFrontMatterValue(markdown, "title").replace(/^📖\s*/, "") || id;
  return {
    id,
    title,
    file,
    category: parseFrontMatterValue(markdown, "category"),
    scholar: parseFrontMatterValue(markdown, "scholar"),
    snippet
  };
}

function parseDuaMarkdown(file) {
  const fullPath = path.join(DUA_DIR, file);
  const markdown = fs.readFileSync(fullPath, "utf8");
  const id = parseFrontMatterValue(markdown, "id") || file.replace(/\.md$/i, "");
  const title = parseFrontMatterValue(markdown, "title") || id;
  const cat = parseFrontMatterValue(markdown, "cat") || parseFrontMatterValue(markdown, "category");
  const germanSection = (markdown.match(/###\s*Deutsch\s*\n+([\s\S]*?)(?=\n###\s|$)/i) || [])[1] || "";
  const body = markdown.replace(/^---[\s\S]*?---/, "").trim();
  const fallbackParagraph = body.split(/\n\s*\n/).find((part) => {
    const value = part.trim();
    return value && !/^#{1,3}\s/.test(value) && !/^\*\*Anlass:/i.test(value);
  }) || "";

  return {
    id,
    title,
    snippet: cleanSnippet(germanSection || fallbackParagraph),
    cat,
    source: "dua-markdown",
    file
  };
}

function loadPostFiles() {
  const index = readJson(POSTS_INDEX_PATH, {});
  return uniqueByKey(
    (Array.isArray(index.files) ? index.files : [])
      .map((entry) => (typeof entry === "string" ? entry : entry?.name))
      .filter((name) => name && String(name).endsWith(".md"))
      .filter((name) => fs.existsSync(path.join(POSTS_DIR, name))),
    (name) => name
  );
}

function loadDuaPool() {
  const markdownFiles = fs.existsSync(DUA_DIR)
    ? fs.readdirSync(DUA_DIR)
        .filter((name) => /^dua-\d+.*\.md$/i.test(name))
        .sort((a, b) => a.localeCompare(b, "de"))
    : [];
  const markdownItems = markdownFiles.map(parseDuaMarkdown);
  const rawCompactItems = readJson(DUA_POOL_PATH, []);
  const compactItems = (Array.isArray(rawCompactItems) ? rawCompactItems : []).map((item) => ({
    ...item,
    snippet: item?.snippet || item?.de || "",
    cat: item?.cat || item?.category || "",
    source: item?.source || "daily-dua-pool"
  }));
  const items = uniqueByKey([...markdownItems, ...compactItems], (item) => item?.id);

  writeJson(DUA_COMBINED_POOL_PATH, items);

  return {
    items,
    markdownCount: markdownItems.length,
    compactCount: compactItems.length,
    totalCount: items.length
  };
}

function run() {
  const now = new Date();
  const date = dayKey(now);
  const previousDaily = readJson(DAILY_PATH, {});
  const rotation = readJson(ROTATION_PATH, {
    version: 2,
    recommendation: {},
    dua: {}
  });

  const postFiles = loadPostFiles();
  const duaSources = loadDuaPool();
  const duaPool = duaSources.items;

  if (
    previousDaily?.date === date &&
    previousDaily?.source === "dar-daily-no-repeat-rotation" &&
    previousDaily?.recommendation?.id &&
    previousDaily?.dua?.id
  ) {
    const recommendationState = normalizeRotationState(
      postFiles,
      (file) => file,
      rotation.recommendation,
      previousDaily?.recommendation?.file
    );
    const duaState = normalizeRotationState(
      duaPool,
      (item) => item?.id,
      rotation.dua,
      previousDaily?.dua?.id
    );

    const nextRotation = {
      ...rotation,
      version: 2,
      updatedAt: now.toISOString(),
      date,
      recommendation: recommendationState,
      dua: duaState,
      duaSources: {
        markdown: duaSources.markdownCount,
        compactPool: duaSources.compactCount,
        total: duaSources.totalCount
      }
    };
    const daily = {
      ...previousDaily,
      rotation: {
        ...(previousDaily.rotation || {}),
        recommendation: {
          cycle: recommendationState.cycle,
          poolSize: recommendationState.poolSize,
          remaining: recommendationState.remaining
        },
        dua: {
          cycle: duaState.cycle,
          poolSize: duaState.poolSize,
          remaining: duaState.remaining,
          sources: nextRotation.duaSources
        }
      }
    };

    writeJson(ROTATION_PATH, nextRotation);
    writeJson(DAILY_PATH, daily);
    console.log(`Tagesrotation ${date} bleibt bestehen · Duʿāʾ-Pool ${duaSources.totalCount}.`);
    return;
  }

  const recommendationPick = pickWithoutRepeat(
    postFiles,
    (file) => file,
    rotation.recommendation,
    previousDaily?.recommendation?.file,
    `${date}|recommendation`
  );

  const duaPick = pickWithoutRepeat(
    duaPool,
    (item) => item?.id,
    rotation.dua,
    previousDaily?.dua?.id,
    `${date}|dua`
  );

  const recommendation = recommendationPick.item ? parsePost(recommendationPick.item) : null;
  const selectedDua = duaPick.item;
  const dua = selectedDua
    ? {
        id: selectedDua.id,
        title: selectedDua.title,
        snippet: selectedDua.snippet || "",
        category: selectedDua.cat || selectedDua.category || ""
      }
    : null;

  if (!recommendation && !dua) {
    throw new Error("Weder Beiträge noch Duʿāʾ für die Tagesrotation gefunden.");
  }

  const duaSourceStats = {
    markdown: duaSources.markdownCount,
    compactPool: duaSources.compactCount,
    total: duaSources.totalCount
  };
  const nextRotation = {
    version: 2,
    updatedAt: now.toISOString(),
    date,
    recommendation: recommendationPick.state || rotation.recommendation || {},
    dua: duaPick.state || rotation.dua || {},
    duaSources: duaSourceStats
  };

  const daily = {
    date,
    timezone: TIME_ZONE,
    generated: now.toISOString(),
    source: "dar-daily-no-repeat-rotation",
    recommendation,
    dua,
    rotation: {
      recommendation: recommendationPick.state
        ? {
            cycle: recommendationPick.state.cycle,
            poolSize: recommendationPick.state.poolSize,
            remaining: recommendationPick.state.remaining
          }
        : null,
      dua: duaPick.state
        ? {
            cycle: duaPick.state.cycle,
            poolSize: duaPick.state.poolSize,
            remaining: duaPick.state.remaining,
            sources: duaSourceStats
          }
        : null
    }
  };

  writeJson(ROTATION_PATH, nextRotation);
  writeJson(DAILY_PATH, daily);

  console.log(
    `Tagesrotation ${date}: Empfehlung ${recommendation?.id || "–"} ` +
    `(${recommendationPick.state?.remaining ?? "–"} verbleibend) · ` +
    `Duʿāʾ ${dua?.id || "–"} (${duaPick.state?.remaining ?? "–"} von ${duaSources.totalCount} verbleibend)`
  );
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

module.exports = {
  dayKey,
  pickWithoutRepeat,
  loadDuaPool,
  run
};
