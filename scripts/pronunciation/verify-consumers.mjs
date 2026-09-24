#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const files = [
  "data/pronunciation/pronunciation-rules.json",
  "test/kids/data/pronunciation-rules.json",
  "kids-app/DarAlTawhidKids/Resources/pronunciation-rules.json"
].map((p) => path.join(root,p));

const hashes = files.map((p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"));
if (new Set(hashes).size !== 1) {
  throw new Error("pronunciation consumer copies are out of sync");
}

const data = JSON.parse(fs.readFileSync(files[0],"utf8"));
if (data?.counts?.rules !== 3719) throw new Error("expected 3719 pronunciation rules");
if (data?.counts?.canonicalTerms !== 901) throw new Error("expected 901 canonical terms");

console.log(JSON.stringify({ok:true,hash:hashes[0],rules:data.counts.rules,canonicalTerms:data.counts.canonicalTerms},null,2));
