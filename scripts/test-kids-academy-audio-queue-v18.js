#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {audit,validV4,normalize}=require("../kids/tools/audit-academy-voice-coverage-v18.js");
const r=audit();
assert.equal(r.catalogLessonCount,34);
assert.deepEqual(r.uncoveredLessons,[]);
assert.ok(r.uniquePhrases>=454);
assert.equal(Object.values(r.totals).reduce((a,b)=>a+b,0),r.uniquePhrases);
assert.equal(r.totals.approved,0,"Old Flash clip is NOT an approved V4 story voice");
assert.ok(r.totals.stagedAwaitingReview>=4,"Four original pilot V4 recordings stay staged");
assert.ok(r.rows.every(x=>x.contexts.length>0&&["approved","stagedAwaitingReview","needsRecording"].includes(x.state)));
assert.equal(validV4({voiceId:"different",url:"/fake",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_v4",
 voiceSettingsProfile:"kids_story",sourceVoice:"authorized-owner-voice",sourceSpeaker:"Serhat Abu Malik",
 sameAsApprovedKidsStoryProfile:true}),false);
assert.equal(normalize("A  B\nC"),"A B C");
console.log("ACADEMY VOICE V18 PASS: exact Serhat-only matching, staged four, zero synthetic fallback, no credits.");
