#!/usr/bin/env node
"use strict";
/**
 * Draft voice TEXT synchronization only; never calls ElevenLabs or creates audio.
 *
 * node kids/tools/sync-academy-voice-plan-v38.cjs --check
 * node kids/tools/sync-academy-voice-plan-v38.cjs --write
 *
 * Checks every summary, introduction, explanation line and age-specific voice
 * text against the CURRENT V38 curriculum; deduplicates identical phrases
 * while preserving ALL references/contexts. All output stays not-generated.
 */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const curriculumPath = path.join(root, "kids/akademie/curriculum-v38.js");
const planPath = path.join(root, "kids/data/academy-voice-plan-v38.json");
const raw = fs.readFileSync(curriculumPath, "utf8");
const prefix = "const additions=";
const pos = raw.indexOf(prefix);
if (pos < 0) throw Error("V38 additions not found");
const beginning = raw.indexOf("{", pos + prefix.length);
const ending = raw.indexOf("\n};\nfor(const [id,l]", beginning);
if (beginning < 0 || ending < 0) throw Error("V38 additions boundary not found");
const lessons = JSON.parse(raw.slice(beginning, ending + 2));
const voice = JSON.parse(fs.readFileSync(planPath, "utf8"));
if (voice.policy?.generateCreditsUsed !== 0) throw Error("Cannot edit a plan after generation credits have been used");
if (Object.keys(lessons).length !== 111) throw Error("Unexpected V38 lesson count");
if (voice.lessonCount !== 111) throw Error("Voice plan lesson count mismatch");

const phraseMap = new Map();
const seenContexts = new Set();
let changed = 0;
let contexts = 0;
const ageGroups = ["4-5","6-8","9-10"];
function desiredText(ctx) {
  const lesson = lessons[ctx.lessonId];
  if (!lesson) throw Error("Unknown lesson " + ctx.lessonId);
  if (ctx.kind === "summary") {
    if (ctx.age !== "all") throw Error("Summary must be common to all ages");
    return lesson.audioScript;
  }
  if (!ageGroups.includes(ctx.age)) throw Error("Unexpected age " + ctx.age);
  const age = lesson.ageText?.[ctx.age];
  if (!age) throw Error("Missing age lesson " + ctx.lessonId + "/" + ctx.age);
  switch (ctx.kind) {
    case "audio": return age.audioScript;
    case "intro": return age.intro;
    case "line": return age.lines?.[ctx.index];
    default: throw Error("Unknown voice context " + ctx.kind);
  }
}
for (const phrase of voice.phrases || []) {
  if (phrase.reviewStatus !== "not-generated") throw Error("Cannot rewrite reviewed/generated audio phrases");
  for (const ctx of phrase.contexts || []) {
    const key = [ctx.lessonId,ctx.kind,ctx.age,ctx.index ?? ""].join("|");
    if (seenContexts.has(key)) throw Error("Duplicate voice context: " + key);
    seenContexts.add(key);
    const next = desiredText(ctx);
    if (typeof next !== "string" || !next.trim()) throw Error("Empty expected voice text: " + key);
    if (phrase.text !== next) changed++;
    let updated = phraseMap.get(next);
    if (!updated) {
      updated = {...phrase, text: next, contexts: []};
      phraseMap.set(next, updated);
    }
    updated.priority = Math.min(updated.priority, phrase.priority);
    updated.contexts.push(ctx);
    contexts++;
  }
}
const requiredContexts = Object.keys(lessons).length * (1 + ageGroups.length * 6);
if (contexts !== requiredContexts) throw Error("Expected " + requiredContexts + " contexts, found " + contexts);
for (const [id, lesson] of Object.entries(lessons)) {
  const required = [{lessonId:id,kind:"summary",age:"all"}];
  for (const age of ageGroups) {
    required.push({lessonId:id,kind:"audio",age}, {lessonId:id,kind:"intro",age});
    for (let index=0; index<4; index++) required.push({lessonId:id,kind:"line",age,index});
  }
  for (const ctx of required) {
    const key = [ctx.lessonId,ctx.kind,ctx.age,ctx.index ?? ""].join("|");
    if (!seenContexts.has(key)) throw Error("Missing voice context: " + key);
    if (!desiredText(ctx)?.trim()) throw Error("Missing curriculum text " + key);
  }
}
const updatedPlan = {...voice, phraseCount: phraseMap.size, phrases: [...phraseMap.values()]};
if (updatedPlan.policy.generateCreditsUsed !== 0) throw Error("Audio credits status changed");
console.log("V38:", Object.keys(lessons).length, "lessons,", contexts, "text contexts,", phraseMap.size, "unique ungenerated phrases");
console.log("Stale contexts detected:", changed);
const needsWrite = changed > 0 || voice.phraseCount !== phraseMap.size || voice.phrases.length !== phraseMap.size;
if (process.argv.includes("--write")) {
  if (needsWrite) fs.writeFileSync(planPath, JSON.stringify(updatedPlan,null,2)+"\n", "utf8");
  console.log(needsWrite ? "Saved synchronized text plan." : "Already synchronized.");
} else if (needsWrite) {
  console.error("Run with --write to synchronize the draft plan; no audio is generated.");
  process.exitCode = 1;
}
