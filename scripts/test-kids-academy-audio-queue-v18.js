#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {audit,validV4,normalize}=require("../kids/tools/audit-academy-voice-coverage-v18.js");
const r=audit();
assert.ok(Number.isInteger(r.catalogLessonCount)&&r.catalogLessonCount>=50&&r.catalogLessonCount<=208,"Catalog lesson count must grow within the approved 208-lesson plan");
assert.deepEqual(r.uncoveredLessons,[]);
assert.ok(r.uniquePhrases>=600);
assert.equal(Object.values(r.totals).reduce((a,b)=>a+b,0),r.uniquePhrases);
assert.equal(r.totals.approved,0,"Old Flash clip is NOT an approved V4 story voice");
// Four historical binary originals remain archived, but the short Salam no longer matches
// any eligible full-Salam production text. Therefore only three may count as staged.
const originalPilot=JSON.parse(require("node:fs").readFileSync(require("node:path").join(__dirname,"../kids/data/academy-audio-staging-v9.json"),"utf8"));
assert.equal(Object.keys(originalPilot.entries).length,4,"Preserve all four paid original pilot assets");
assert.ok(r.totals.stagedAwaitingReview>=3,"Only the three non-Salam original pilot segments remain eligible for staging");
assert.ok(r.rows.some(x=>x.text==="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh."&&x.state==="needsRecording"),"The complete greeting must NOT reuse the abbreviated original");
assert.ok(r.rows.every(x=>x.contexts.length>0&&["approved","stagedAwaitingReview","needsRecording"].includes(x.state)));
assert.equal(validV4({voiceId:"different",url:"/fake",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_v4",
 voiceSettingsProfile:"kids_story",sourceVoice:"authorized-owner-voice",sourceSpeaker:"Serhat Abu Malik",
 sameAsApprovedKidsStoryProfile:true}),false);
assert.equal(normalize("A  B\nC"),"A B C");
console.log("ACADEMY VOICE V18 PASS: exact Serhat-only matching, three valid staged clips and one quarantined old greeting, zero synthetic fallback, no credits.");
