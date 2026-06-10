#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const POSTS_DIR = path.join(__dirname, "..", "content", "posts");
const OUT = path.join(POSTS_DIR, "posts-index.json");

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort((a, b) => a.localeCompare(b, "de"));

const entries = files.map((name) => {
  const sha = execSync(`git hash-object "${path.join(POSTS_DIR, name)}"`, { encoding: "utf8" }).trim();
  return { name, sha };
});

const payload = {
  version: 1,
  generated: new Date().toISOString(),
  count: entries.length,
  files: entries,
};

fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`posts-index.json: ${entries.length} files`);
