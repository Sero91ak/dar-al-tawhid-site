#!/usr/bin/env node
"use strict";
/* Zero-credit regression: displayed names remain personal; reusable owner
 * recordings are chosen by the child's profile, not by a name guess. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync("kids/akademie/index.html", "utf8");
const start = html.indexOf("const ACADEMY_FULL_SALAM=");
const end = html.indexOf("const storageKey=", start);
assert.ok(start >= 0 && end > start, "Greeting implementation missing");
const greetingSource = html.slice(start, end);
const plan = JSON.parse(fs.readFileSync("kids/data/academy-full-salam-voice-plan-v19.json", "utf8"));
const available = new Set(plan.phrases.map(row => row.text));
for (const t of [
  "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.",
  "Liebe Schwester.",
  "Lieber Bruder."
]) assert.ok(available.has(t), "Canonical owner voice phrase missing: " + t);
const profiles = [
  {gender:"boy", profileName:"Malik", visible:"Lieber Bruder Malik.", recorded:"Lieber Bruder."},
  {gender:"girl", profileName:"Test12", visible:"Liebe Schwester Test12.", recorded:"Liebe Schwester."},
  {gender:"girl", profileName:"Amina Fatima", visible:"Liebe Schwester Amina.", recorded:"Liebe Schwester."},
  {gender:"boy", profileName:"", visible:"Lieber Bruder.", recorded:"Lieber Bruder."}
];
for (const p of profiles) {
  const sandbox = {gender:p.gender, profileName:p.profileName};
  vm.runInNewContext(
    greetingSource + "\nthis._greeting = { visible: greetingAddress(), recorded: recordedGreetingAddress(), salam: ACADEMY_FULL_SALAM };",
    sandbox,
    {timeout:1000}
  );
  assert.equal(sandbox._greeting.visible,p.visible);
  assert.equal(sandbox._greeting.recorded,p.recorded);
  assert.equal(sandbox._greeting.salam,plan.voicePolicy.canonicalFullSalam);
  assert.ok(available.has(sandbox._greeting.recorded));
}
assert.ok(html.includes('$("#overviewAddress").textContent=greetingAddress()'));
assert.ok(html.includes('$("#welcomeAddress").textContent=greetingAddress()'));
assert.ok(html.includes('index===0?[spokenSalam,recordedGreetingAddress(),$("#welcomeFollowup").textContent,'),
  "Welcome audio must use reusable gender-specific master recording, not an unrecorded child's name");
assert.ok(!html.includes('index===0?[spokenSalam,$("#welcomeAddress").textContent,'),
  "Do not request a nonexistent exact-match owner recording for each personalized child name");
console.log("PASS: 4 greetings, boy/girl profile, visible first name, reusable voice IDs; no synthesis or billing");
