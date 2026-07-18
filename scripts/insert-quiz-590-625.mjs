import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const batchPath = path.join(root, "data", "quiz-batch-590-625.json");
const targets = [
  path.join(root, "data", "quiz-questions.json"),
  path.join(root, "data", "quiz-questions-test.json")
];

const newQuestions = JSON.parse(fs.readFileSync(batchPath, "utf8"));
const numbers = new Set(newQuestions.map((q) => q.number));
const ids = new Set(newQuestions.map((q) => q.id));

if (newQuestions.length !== 36) {
  throw new Error(`Expected 36 questions, got ${newQuestions.length}`);
}

for (const target of targets) {
  const existing = JSON.parse(fs.readFileSync(target, "utf8"));
  const kept = existing.filter((q) => !numbers.has(q.number) && !ids.has(q.id));
  const merged = [...kept, ...newQuestions].sort((a, b) => a.number - b.number);
  fs.writeFileSync(target, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`${path.basename(target)}: ${existing.length} -> ${merged.length}`);
}
