#!/usr/bin/env node
"use strict";
/* KIDS first voice probes: only technical preflight; no paid calls or approvals. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const policy=read("kids/data/academy-voice-policy-v10.json");
const probes=read("kids/review-only/academy-v4-first-two-hearing-probes-20261104.json");
const plan=read("kids/data/academy-voice-plan-v27.json");
assert.equal(probes.voiceId,policy.voiceIdentity.voiceId);
assert.equal(probes.modelId,"eleven_v4");
assert.equal(policy.production.profile,"kids_story");
assert.equal(probes.samples.length,2);
assert.equal(probes.publicPlaybackApproved,false);
assert.equal(probes.productionAuthorized,false);
assert.equal(probes.eligibleForAppImport,false);
assert.equal(probes.humanListeningApproved,false);
assert.equal(probes.directElevenLabsCreatorToolCannotClaimProductionSettings,true);
assert.equal(probes.profileSettingsVerifiedInCreator,false);
assert.equal(probes.languageCodeVerifiedInCreator,false);
assert.equal(probes.pronunciationDictionaryVerifiedInCreator,false);
assert.equal(policy.costControls.maxClipsPerInvocation>=probes.samples.length,true);
let plannedCredit=0;const texts=new Set();
for(const sample of probes.samples){
 assert.equal(sample.source,"kids/data/academy-voice-plan-v27.json");
 assert(plan.phrases.some(p=>p.text===sample.text),"Never synthesize text not in original voice plan");
 assert.equal(sample.languagePolicy,"de");
 assert.equal(sample.humanListeningApproved,false);
 assert.equal(sample.contentImportedToGitHub,false);
 assert(["REQUESTED_REVIEW_ONLY","COMPLETED_CREATOR_PREVIEW_NOT_APPROVED"].includes(sample.status));
 if(sample.status==="COMPLETED_CREATOR_PREVIEW_NOT_APPROVED"){
  assert(sample.generationId&&sample.actualCredits>0,"Completed preview must have a real generation and charge");
  assert.equal(probes.creatorPreviewsAreNotProductionProfileCertified,true);
  assert.equal(probes.creatorPreviewCreditsWereSpentBeforeThisReview,true);
  assert.equal(sample.humanListeningApproved,false);
 }
 assert(!/[\u0600-\u06ff]/.test(sample.text),"Mixed Arabic script not allowed");
 assert(!texts.has(sample.text),"Duplicate paid request");texts.add(sample.text);
 assert(sample.generationFlowId&&sample.generationNodeId&&sample.sessionId);
 assert(sample.estimatedCredits>0);plannedCredit+=sample.estimatedCredits;
}
assert(Math.abs(plannedCredit-probes.creditForecast)<1e-5);
assert.equal(probes.noSyntheticQuran,true);
console.log("PASS: two distinct, source-listed ElevenLabs V4 creator previews recorded (request or actual completion).");
console.log("NO RELEASE: creator does not expose canonical profile, dictionary or language settings.");
console.log("No synthetic Quran, no approved audio; existing paid previews preserved without regeneration.");
