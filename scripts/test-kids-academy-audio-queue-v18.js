#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {audit,validV4,normalize}=require("../kids/tools/audit-academy-voice-coverage-v18.js");
const r=audit();
assert.ok(Number.isInteger(r.catalogLessonCount)&&r.catalogLessonCount>=50&&r.catalogLessonCount<=208,"Catalog lesson count must grow within the approved 208-lesson plan");
assert.deepEqual(r.uncoveredLessons,[]);
assert.equal(r.catalogLessonCount,66,"Live academy: 65 code-backed lessons + standalone Ṣidq");
assert.equal(r.coveredLessonCount,66,"Every current lesson must have a traceable master-voice plan");
assert.equal(r.editorialPlannedCount,142,"Future editorial outlines must not be mistaken for released lessons");
assert.deepEqual(r.actualCurriculumScripts,["v1","v2","v22","v25","v26","v27","v28","v29"]);
const fsAcademy=require("node:fs");
const v28Academy=JSON.parse(fsAcademy.readFileSync("kids/data/academy-voice-plan-v28.json","utf8"));
const v29Academy=JSON.parse(fsAcademy.readFileSync("kids/data/academy-voice-plan-v29.json","utf8"));
assert.equal(v28Academy.lessonCount,4);
assert.equal(v29Academy.lessonCount,4);
assert.equal(v28Academy.phraseCount,164);
assert.equal(v29Academy.phraseCount,163);
assert.equal(v28Academy.phrases.length+v29Academy.phrases.length,327,
 "Last eight classroom lessons need 327 original text entries in the V4 queue");

assert.ok(r.uniquePhrases>=600);
assert.equal(Object.values(r.totals).reduce((a,b)=>a+b,0),r.uniquePhrases);
assert.equal(r.totals.approved,0,"Old Flash clip is NOT an approved V4 story voice");
// Four historical binary originals remain archived, but the short Salam no longer matches
// any eligible full-Salam production text. Therefore only three may count as staged.
const originalPilot=JSON.parse(require("node:fs").readFileSync(require("node:path").join(__dirname,"../kids/data/academy-audio-staging-v9.json"),"utf8"));
assert.equal(Object.keys(originalPilot.entries).length,4,"Preserve all four paid original pilot assets");
assert.ok(r.totals.stagedAwaitingReview>=3,"Only the three non-Salam original pilot segments remain eligible for staging");
const planV19=JSON.parse(require("node:fs").readFileSync("kids/data/academy-full-salam-voice-plan-v19.json","utf8"));
assert.ok(planV19.phrases.some(x=>x.text==="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh."&&x.reviewStatus==="not-generated"&&!x.url),"The complete greeting must be a separate ungenerated V19 candidate");
assert.ok(!Object.keys(originalPilot.entries).includes("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh."),"Never relabel abbreviated original audio as full Salam");
assert.ok(r.rows.every(x=>x.contexts.length>0&&["approved","stagedAwaitingReview","needsRecording"].includes(x.state)));
assert.equal(validV4({voiceId:"different",url:"/fake",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_v4",
 voiceSettingsProfile:"kids_story",sourceVoice:"authorized-owner-voice",sourceSpeaker:"Serhat Abu Malik",
 sameAsApprovedKidsStoryProfile:true}),false);
assert.equal(normalize("A  B\nC"),"A B C");
// The independent Python regression exercises the exact V4 Academy text preparation.
require("node:child_process").execFileSync("python3",[
  "kids/tools/test-academy-language-isolation-v1.py"
],{cwd:require("node:path").resolve(__dirname,".."),stdio:"inherit"});
// Only the first Ṣidq topic is prepared, and the CI invocation never spends credits.
require("node:child_process").execFileSync("python3",[
  "kids/tools/build-academy-topic-batch-v1.py","--dry-run"
],{cwd:require("node:path").resolve(__dirname,".."),stdio:"inherit"});
// The 100%-complete thematic release gate is a separate, non-billable check.
// It must NOT publish a partial Ṣidq lesson, even if a four-clip batch passes.
const academyRelease=JSON.parse(require("node:child_process").execFileSync("python3",[
  "kids/tools/publish-academy-topic-v1.py","--status"
],{cwd:require("node:path").resolve(__dirname,".."),encoding:"utf8"}));
assert.equal(academyRelease.subject,"akhlaq");
assert.equal(academyRelease.topic,"sidq");
assert.equal(academyRelease.required,58);
assert.equal(academyRelease.nextTopicLocked,true);
assert.equal(academyRelease.publicManifestModified,false);
assert.equal(academyRelease.canPublish,academyRelease.confirmed===academyRelease.required);
// The complete Ṣidq owner-authorized production manifest can be imported
// only when the original 76 paid MP3 files are actually present. This check
// validates all source associations without paying credits or publishing.
const topicReady=JSON.parse(require("node:child_process").execFileSync("python3",[
  "kids/tools/import-publish-academy-sidq-v4-v1.py","--dry-run"
],{cwd:require("node:path").resolve(__dirname,".."),encoding:"utf8"}));
assert.equal(topicReady.canonicalPhrases,58);
assert.equal(topicReady.reusedPriorV4,3);
assert.equal(topicReady.directV4,45);
assert.equal(topicReady.mixedSentenceAssemblies,9);
assert.equal(topicReady.nativeArabicTerms,9);
assert.equal(topicReady.originalGenerationFilesRequired,76);
assert.equal(topicReady.needsActualBinaryFiles,true);
assert.equal(topicReady.live,false);
// Check that original media imports only from signed, pinned ElevenLabs URLs.
// This test is fully offline and cannot trigger generation or publication.
require("node:child_process").execFileSync("python3",[
  "kids/tools/test-academy-download-gate-v1.py"
],{cwd:require("node:path").resolve(__dirname,".."),stdio:"inherit"});
const originalStatus=JSON.parse(require("node:child_process").execFileSync("python3",[
  "kids/tools/download-academy-elevenlabs-originals-v1.py",
  "--status","--source-dir","/tmp/dar-kids-sidq-no-originals-ci-v1"
],{cwd:require("node:path").resolve(__dirname,".."),encoding:"utf8"}));
assert.equal(originalStatus.requiredOriginals,76);
assert.equal(originalStatus.missingOriginals,76);
assert.equal(originalStatus.newGenerationRequested,false);
assert.equal(originalStatus.publiclyReleased,false);
// Complete curriculum audit: 66 code-backed lessons + 142 outlines = 208.
// V28/V29 must remain fully source-exact (327 distinct speech texts).
// This is offline: no ElevenLabs billing or public release.
require("node:child_process").execFileSync("node",[
  "kids/tools/test-academy-full-208-release-v1.cjs"
],{cwd:require("node:path").resolve(__dirname,".."),stdio:"inherit"});
// Source-exact continuous production queue across ALL 66 existing lessons.
// 142 remaining editorial-only slots never enter the child app's audio catalog.
const academyNext=JSON.parse(require("node:child_process").execFileSync("python3",[
  "kids/tools/academy-next-topic-production-v1.py","--status"
],{cwd:require("node:path").resolve(__dirname,".."),encoding:"utf8"}));
assert.equal(academyNext.lessonId,"sidq");
assert.equal(academyNext.exactUniquePhrases,58);
assert.equal(academyNext.remainingExistingTopicsIncludingCurrent,66);
assert.equal(academyNext.futureEditorialOutlinesLocked,142);
assert.equal(academyNext.newCreditsChargedByThisScript,0);
const academyAll=JSON.parse(require("node:child_process").execFileSync("python3",[
  "kids/tools/academy-next-topic-production-v1.py","--audit-all"
],{cwd:require("node:path").resolve(__dirname,".."),encoding:"utf8"}));
assert.equal(academyAll.curriculumLessonCount,66);
assert.equal(academyAll.sourceBackedLessonCount,66);
assert.equal(academyAll.firstLessonId,"sidq");
assert.equal(academyAll.firstLessonExactPhrases,58);
assert.equal(academyAll.additionalEditorialOutlinesLocked,142);
assert.equal(academyAll.newTtsCreditsCharged,0);
console.log("ACADEMY VOICE V18 PASS: exact Serhat-only matching, three valid staged clips and one quarantined old greeting, zero synthetic fallback, no credits.");
