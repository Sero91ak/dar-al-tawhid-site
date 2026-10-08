#!/usr/bin/env node
"use strict";

// Executable regression tests against the actual Majlis ranking and fallback
// implementations. Test route only; no network, external API or build secrets.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const code = fs.readFileSync(path.join(__dirname, "../test/assets/ilm-research-chat.js"), "utf8");
function section(from, until) {
  const a = code.indexOf(from);
  const b = code.indexOf(until, a + from.length);
  assert.ok(a >= 0 && b > a, "Majlis implementation not found: " + from);
  return code.slice(a, b);
}

const { rankKnowledgeSources } = Function(
  section("function ilmNormalize(text) {", "function ilmScriptureLinks(extended)") +
  ";return {rankKnowledgeSources};"
)();

const question = "gebet hände hoch heben oder unten lassen nach ruku";
const unrelated = [
  { id: "quran-26-49", kind: "quran", title: "Aš-Šuʿarāʾ 26:49",
    excerpt: "Warum habt ihr geglaubt, bevor ich es euch erlaubte?" },
  { id: "quran-20-71", kind: "quran", title: "Ṭā-Hā 20:71",
    excerpt: "Ich werde eure Hände und Füße abschneiden." },
  { id: "generic-hands", kind: "quran", title: "Hände oben halten",
    excerpt: "Eine Hand erhob sich hoch beim Gebet; die konkrete Gebetshaltung wird nicht genannt." }
];
assert.equal(rankKnowledgeSources(question, unrelated).length, 0,
  "Unrelated Qurʾān verses must not be presented as ritual proofs");

const matching = [{
  id: "bukhari-ruku", kind: "sunnah",
  title: "Händeheben im Gebet beim Rukūʿ",
  excerpt: "Er hob die Hände beim Rukūʿ und auch nachdem er sich aus dem Rukūʿ aufrichtete."
}];
assert.equal(rankKnowledgeSources(question, matching).length, 1,
  "Relevant prayer hadith must be retained");

const topicSwitch = "Was ist Īmān?";
const faith = [{ id: "quran-iman", kind: "quran", title: "Īmān",
  excerpt: "Der Glaube an Allah, die Bücher, die Engel und die Gesandten." }];
assert.equal(rankKnowledgeSources(topicSwitch, faith).length, 1,
  "Other legitimate knowledge topics must remain searchable");

const shortScientificAnswer = Function(
  "clip", "sourceTitle",
  section("function shortScientificAnswer(reply) {", "function sourceDisclosure(reply, openProof)") +
  ";return shortScientificAnswer;"
)(
  (value, max) => String(value).slice(0, max),
  ev => [ev.work, ev.reference].filter(Boolean).join(" · ")
);
const cited = shortScientificAnswer({
  _ilmComposing: true,
  evidences: [{
    work: "Ṣaḥīḥ al-Buḫārī", reference: "Bericht 703",
    statement: "Der Prophet ﷺ hob die Hände beim Rukūʿ und beim Aufrichten.",
    deep_link: "https://islamweb.net/ar/library/content/0/704/",
    verification_status: "verified"
  }]
});
assert.match(cited, /Buḫārī/);
assert.match(cited, /Rukūʿ/);
assert.doesNotMatch(cited, /Ich ordne die gefundenen Aussagen/);

const noProof = shortScientificAnswer({
  _ilmNoRelevantEvidence: true, evidences: []
});
assert.match(noProof, /keine hinreichend passenden/);
assert.doesNotMatch(noProof, /Die geprüfte Fundstelle berichtet/);

console.log("PASS: Majlis topic gate, off-topic exclusion, valid proof, topic switch and immediate verified-evidence answer");
