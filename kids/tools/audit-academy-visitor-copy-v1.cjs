#!/usr/bin/env node
"use strict";
/**
 * Read-only audit of draft V38 child-facing curriculum and ungenerated speech.
 * Run: node kids/tools/audit-academy-visitor-copy-v1.cjs --strict
 * Excludes internal sourceAudit and ageText.sources: those belong in the editorial source ledger.
 */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const raw = fs.readFileSync(path.join(root, "kids/akademie/curriculum-v38.js"), "utf8");
const beginning = raw.indexOf("{", raw.indexOf("const additions="));
const ending = raw.indexOf("\n};\nfor(const [id,l]", beginning);
if (beginning < 0 || ending < 0) throw Error("V38 additions boundary not found");
const lessons = JSON.parse(raw.slice(beginning, ending + 2));
const voice = JSON.parse(fs.readFileSync(path.join(root, "kids/data/academy-voice-plan-v38.json"), "utf8"));
const academyHtml = fs.readFileSync(path.join(root, "kids/akademie/index.html"), "utf8");
const ages = ["4-5", "6-8", "9-10"];
const banned = [
  /keine freigabe für besucher/i,
  /keine synthetische rezitation/i,
  /wissenschaftliche freigabe/i,
  /diese stunde bleibt ein entwurf/i,
  /technische vollständigkeit ersetzt/i,
  /nicht belegt und deshalb nicht behauptet/i,
  /(?:https?:\/\/|www\.)\S+/i,
  /am 13\. Oktober 2026/i
];
const violations = [];
const issue = (where, what) => violations.push(where + ": " + what);
const check = (where, value) => {
  if (typeof value === "string") {
    for (const pattern of banned) if (pattern.test(value)) issue(where, "internal wording: " + pattern);
  } else if (Array.isArray(value)) value.forEach((part, i) => check(where + "[" + i + "]", part));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => check(where + "." + key, item));
};
const ids = Object.keys(lessons);
if (ids.length !== 111) issue("curriculum", "expected 111 V38 lessons, found " + ids.length);
for (const [id, lesson] of Object.entries(lessons)) {
  if (lesson.sourceAudit?.scientificApproval !== false) issue(id, "draft unexpectedly missing scientificApproval:false");
  for (const age of ages) {
    const level = lesson.ageText?.[age], quiz = lesson.questions?.[age];
    if (!level) { issue(id, "missing age " + age); continue; }
    const spoken = {
      goal: level.goal, intro: level.intro, lines: level.lines, evidence: level.evidence,
      situation: level.situation, practice: level.practice, summary: level.summary,
      audioScript: level.audioScript
    };
    check(id + "/" + age, spoken);
    if (!level.intro?.trim() || !Array.isArray(level.lines) || level.lines.length !== 4 || level.lines.some(x => !x?.trim()))
      issue(id + "/" + age, "incomplete introduction or four spoken lines");
    if (!level.audioScript?.trim()) issue(id + "/" + age, "missing spoken script");
    const expected = age === "4-5" ? 2 : 3;
    if (!Array.isArray(quiz) || quiz.length !== expected) { issue(id + "/" + age, "wrong quiz count"); continue; }
    quiz.forEach((q, i) => {
      check(id + "/" + age + "/question-" + i, q);
      if (q.type === "choice" && (!Array.isArray(q.options) || q.options.length !== 2 || q.options[0] === q.options[1] || ![0,1].includes(q.correct)))
        issue(id + "/" + age + "/question-" + i, "invalid choice");
      if (q.type === "text" && (!q.prompt || !q.sample)) issue(id + "/" + age + "/question-" + i, "missing prompt/sample");
    });
  }
}
if (voice.lessonCount !== 111 || voice.phraseCount !== voice.phrases?.length) issue("voice", "invalid lesson/phrase counts");
let contextCount = 0;
for (const [i, phrase] of (voice.phrases || []).entries()) {
  check("voice[" + i + "]", phrase.text);
  if (phrase.reviewStatus !== "not-generated") issue("voice[" + i + "]", "unexpected audio-generation status");
  for (const ctx of phrase.contexts || []) {
    contextCount++;
    const lesson = lessons[ctx.lessonId];
    if (!lesson) { issue("voice[" + i + "]", "unknown lesson"); continue; }
    const ageText = lesson.ageText?.[ctx.age];
    const expected = ctx.kind === "intro" ? ageText?.intro
      : ctx.kind === "audio" ? ageText?.audioScript
      : ctx.kind === "line" ? ageText?.lines?.[ctx.index] : null;
    if (expected !== null && expected !== phrase.text)
      issue("voice[" + i + "]", "stale text at " + ctx.lessonId + "/" + ctx.age + "/" + ctx.kind);
  }
}
if (voice.policy?.generateCreditsUsed !== 0) issue("voice", "nonzero generation credits");
if (!academyHtml.includes("const hasLessonHadith=") || !academyHtml.includes("hadithBlock.hidden=!hasLessonHadith"))
  issue("academy UI", "no sourced-Hadith visibility safeguard");
console.log("V38: " + ids.length + " lessons, " + ids.length * 3 + " age drafts, " + voice.phrases.length + " ungenerated phrases, " + contextCount + " contexts");
console.log("Visitor-copy / voice-plan problems: " + violations.length);
for (const finding of violations.slice(0, 80)) console.log(" - " + finding);
if (violations.length > 80) console.log("... " + (violations.length - 80) + " more");
if (process.argv.includes("--strict") && violations.length) process.exitCode = 1;
