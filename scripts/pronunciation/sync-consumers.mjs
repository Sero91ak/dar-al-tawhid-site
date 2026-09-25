#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const source = path.join(root, "data/pronunciation/pronunciation-rules.json");
const targets = [
  path.join(root, "test/kids/data/pronunciation-rules.json"),
  path.join(root, "kids-app/DarAlTawhidKids/Resources/pronunciation-rules.json")
];

const bytes = fs.readFileSync(source);
const hash = crypto.createHash("sha256").update(bytes).digest("hex");

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
  const targetHash = crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
  if (targetHash !== hash) throw new Error(`sync failed: ${target}`);
  console.log(`synced ${path.relative(root, target)} ${hash.slice(0,12)}`);
}
