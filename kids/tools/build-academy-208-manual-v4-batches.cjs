#!/usr/bin/env node
"use strict";
/* ZERO-CREDIT gate: build small MANUAL V4 generation requests only from
 * exact phrase-level reviewer approvals. NEVER calls ElevenLabs or publishes. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.resolve(root,p),"utf8"));
const hash=s=>crypto.createHash("sha256").update(s,"utf8").digest("hex");
const queuePath=process.argv[2]||"artifacts/academy-208-v4-dedup-queue.json";
const outPath=process.argv[3]||"artifacts/academy-208-v4-approved-manual-batches.json";
const queue=read(queuePath),approval=read("kids/review-only/academy-208-v4-approved-batch.json");
const policy=read("kids/data/academy-voice-policy-v10.json");
assert.equal(queue.kind,"KIDS_ACADEMY_208_V4_DEDUP_REVIEW_QUEUE");
assert.equal(queue.status,"NEVER_GENERATE_UNAPPROVED");
assert.equal(queue.modelId,"eleven_v4");
assert.equal(queue.profile,"kids_story");
assert.equal(queue.voiceId,policy.voiceIdentity.voiceId);
assert.equal(approval.voiceId,policy.voiceIdentity.voiceId);
assert.equal(approval.modelId,policy.production.modelId);
assert.equal(approval.voiceSettingsProfile,policy.production.profile);
assert.equal(approval.manualSourceAndTextApprovalsRequired,true);
assert.equal(approval.publicReleaseAllowed,false);
assert.equal(policy.costControls.autoPublishWithoutOwnerReview,false);
const maxClips=Math.min(policy.costControls.maxClipsPerInvocation,approval.maxClipsPerBatch,4);
const maxCharacters=Math.min(policy.costControls.maxPreparedCharactersPerInvocation,approval.maxPreparedCharactersPerBatch,1200);
assert(maxClips>0&&maxCharacters>0);
const phrases=new Map(queue.phrases.map(p=>[p.id,p])),seen=new Set();
const candidates=[],blocked=[];
for(const item of approval.items||[]){
 const phrase=phrases.get(item.phraseId);
 const fail=(reason)=>blocked.push({phraseId:item.phraseId||null,reason});
 if(!phrase){fail("not-found-in-current-dedup-queue");continue}
 if(seen.has(item.phraseId)){fail("duplicate-approval-request");continue}
 seen.add(item.phraseId);
 if(typeof item.text!=="string"||item.text!==phrase.text||
    item.textSha256!==hash(phrase.text)){fail("content-hash-or-text-mismatch");continue}
 if(item.voiceId!==phrase.voiceId||item.modelId!==phrase.modelId||
    item.voiceSettingsProfile!==phrase.profile||item.settingsFingerprint!==phrase.settingsFingerprint||
    item.languageCode!=="de"){fail("voice-model-profile-or-settings-mismatch");continue}
 if(item.islamicSourceAndParaphraseApproved!==true||
    item.childPedagogyAndButtonsApproved!==true||
    item.fushaPronunciationApproved!==true||
    !item.reviewerName||!item.reviewerApprovedAt){fail("missing-explicit-human-content-or-pronunciation-approval");continue}
 const expectedContexts=phrase.contexts.map(c=>JSON.stringify(c)).sort();
 const suppliedContexts=Array.isArray(item.contextsApproved)?item.contextsApproved.map(c=>JSON.stringify(c)).sort():[];
 if(JSON.stringify(expectedContexts)!==JSON.stringify(suppliedContexts)){
  fail("not-all-reused-lesson-contexts-reviewed");continue;
 }
 if(phrase.germanNurCollisionWatch&&item.germanNurCollisionReviewed!==true){
  fail("german-nur-arabic-nur-not-reviewed");continue;
 }
 if(phrase.pronunciationReviewFlags.length>0&&item.fushaTermsCheckedAgainstLibrary!==true){
  fail("fusha-dictionary-review-required");continue;
 }
 if(phrase.text.length>maxCharacters){fail("single-phrase-exceeds-batch-character-cap");continue}
 if(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/.test(phrase.text)){
  fail("mixed-script-or-quran-never-synthesize");continue;
 }
 if(phrase.alreadyAvailable==="verified-public-v4"){fail("existing-certified-asset-must-be-reused");continue}
 candidates.push({phraseId:phrase.id,text:phrase.text,voiceId:phrase.voiceId,modelId:phrase.modelId,
  profile:phrase.profile,languageCode:"de",settingsFingerprint:phrase.settingsFingerprint,
  contexts:phrase.contexts});
}
const batches=[];let current=[],chars=0;
function flush(){if(current.length)batches.push({number:batches.length+1,items:current,totalCharacters:chars,
 generationAllowedAutomatically:false,requiresOwnerConfirmationBeforeSubmitting:true});current=[];chars=0}
for(const p of candidates){
 if(current.length>=maxClips||chars+p.text.length>maxCharacters)flush();
 current.push(p);chars+=p.text.length;
}flush();
const report={schemaVersion:1,status:candidates.length?"REVIEWED_MANUAL_REQUESTS_NOT_EXECUTED":"NO_APPROVED_TEXT_YET",
 voiceId:queue.voiceId,modelId:queue.modelId,profile:queue.profile,
 sourceQueuePhraseCount:queue.candidateUniqueSpeechTexts,
 sourceQueueMixedArabicBlocked:queue.mixedArabicSegmentsBlocked,
 sourceQueueFuṣḥāReviewPhrases:queue.fushaRomanizedReviewPhrases,
 approvedRequests:candidates.length,rejectedRequests:blocked.length,
 maxClipsPerBatch:maxClips,maxCharactersPerBatch:maxCharacters,
 batchCount:batches.length,batches,blocked,
 generationPerformed:false,creditsSpentByThisScript:0,appImported:false,
 noQuranSynthesis:true,noPublicPublishing:true};
fs.mkdirSync(path.dirname(path.resolve(root,outPath)),{recursive:true});
fs.writeFileSync(path.resolve(root,outPath),JSON.stringify(report,null,2)+"\n","utf8");
assert.equal(report.generationPerformed,false);
if((approval.items||[]).length===0)assert.equal(report.batchCount,0);
console.log("MANUAL V4 BATCH GATE: "+report.status+"; "+report.approvedRequests+" approved requests, "+report.batchCount+" small batches.");
console.log("SPEECH PLAN: "+report.sourceQueuePhraseCount+" dedup phrases; "+report.sourceQueueMixedArabicBlocked+" mixed Arabic blocked.");
console.log("ZERO ElevenLabs calls / ZERO new credits; no production or app release.");
