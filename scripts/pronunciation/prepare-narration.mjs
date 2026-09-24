#!/usr/bin/env node
import fs from "node:fs";
import { loadPronunciationLibrary, prepareNarrationText } from "./pronunciation-library.mjs";

const args = process.argv.slice(2);
const input = args[0];
const output = args[1];
const mode = args.includes("--ipa") ? "ipa" : "alias";

if (!input) {
  console.error("Usage: node scripts/pronunciation/prepare-narration.mjs <input.txt> [output.txt] [--ipa]");
  process.exit(2);
}

const library = loadPronunciationLibrary();
const source = fs.readFileSync(input, "utf8");
const prepared = prepareNarrationText(source, library, mode);

if (output) fs.writeFileSync(output, prepared);
else process.stdout.write(prepared);
