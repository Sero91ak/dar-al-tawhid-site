#!/usr/bin/env node
"use strict";
/* Zero-credit: assert every owner-approved reference is real metadata, and
 * that Qurʾān has a confirmed reference BEFORE generation. Does not cut MP3s. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const library=read("kids/data/academy-fusha-library-first-v1.json");
const policy=read("kids/data/academy-voice-policy-v10.json");
const voice=read("data/pronunciation/voice-production-profile.json");
assert.equal(library.ownerMasterVoiceId,policy.voiceIdentity.voiceId);
assert.equal(library.targetModelId,"eleven_v4");
assert.equal(library.targetProfile,"kids_story");
assert.equal(library.quranRecitation.startsWith("Never synthesize"),true);
assert.equal(library.productionGuard.appOrAudioPublished,false);
assert.equal(library.productionGuard.newCreditsOnThisIndex,0);
assert.equal(library.wordClipExtraction.mayClaimIsolatedWordReady,false);
assert.equal(library.localCoreWavRemoteAvailability,"NOT_CHECKED_NOT_ASSUMED");
assert.equal(voice.corePronunciationLocks.keys.quran.display,"Qurʾān");
assert.equal(voice.corePronunciationLocks.keys.quran.ttsText,library.canonicalQuranNativeFushaText);
assert.equal(library.approvedStoryReferences.length,3);
let quran=[],iman=[];
for(const s of library.approvedStoryReferences){
 const source=read(s.sourceFile);
 assert.equal(source.status,"owner-approved-reference");
 assert.equal(source.sourceAudio.sha256,s.sourceAudioSha256);
 assert.equal(source.sourceAudio.durationSec,s.sourceAudioDurationSec);
 assert.equal(source.sourceAudio.ownerConfirmedPair,true);
 assert.equal(source.sourceAudio.repositoryBinaryPublished,true);
 assert.equal(source.sourceAudio.repositoryTarget,s.originalMp3);
 assert.equal(s.recordingType,"full-story-reference-not-isolated-term");
 assert.equal(s.audioCanBeSplicedAsTermWithoutAlignment,false);
 assert.equal(s.existingIsolatedTermClipVerified,false);
 assert.deepEqual(s.recognizedOwnerApprovedPronunciationTerms,source.pronunciationProfile.trustedTerms);
 for(const term of s.exactTermsPresentInReferenceText){
  assert(source.pronunciationProfile.trustedTerms.includes(term));
  assert(source.sourceText.includes(term));
 }
 if(s.exactTermsPresentInReferenceText.includes("Qurʾān"))quran.push(s);
 if(s.exactTermsPresentInReferenceText.includes("Īmān"))iman.push(s);
}
assert.deepEqual(quran.map(s=>s.id),["muhammad"]);
assert.deepEqual(iman.map(s=>s.id),["adam","idris"]);

assert.equal(library.originalExistingAudioFilesMustNotBeReencodedOrRegenerated,true);
const inventories=library.otherExistingAudioInventories;
assert.equal(inventories.length,7);
let knownClips=0;
for(const inventory of inventories){
 const full=path.join(root,inventory.path);
 assert(fs.existsSync(full),"Existing audio library missing "+inventory.path);
 if(inventory.discoveredClipFiles===null){
  assert.equal(inventory.requiresStructuralScan,true);
  continue;
 }
 const data=read(inventory.path);
 let count=0,approved=0;
 if(inventory.id==="quiz-v4-public-library"){
  assert.equal(Object.keys(data.questions||{}).length,450);
  for(const quiz of Object.values(data.questions||{}))
   for(const clip of Object.values(quiz.clips||{})){
    if(clip?.url&&clip.sha256)count++;
    if(clip?.humanListeningApproved===true&&clip?.approvedForPlayback===true)approved++;
   }
  assert.equal(approved,inventory.humanApprovedClips);
 }else{
  count=Object.values(data.entries||{}).filter(x=>x?.url&&x?.sha256).length;
 }
 assert.equal(count,inventory.discoveredClipFiles,"Audio library inventory drift "+inventory.path);
 knownClips+=count;
}
assert.equal(knownClips,2198);

console.log("PASS: Library-first corpus: three original owner-confirmed MP3 story references.");
console.log("PASS: Qurʾān → Muḥammad original; Īmān → Ādam/Idrīs originals.");
console.log("PASS: 2198 existing audio clips indexed across quiz/dua/terms, plus 2 large owner-voice/quiz manifests reserved for scanning.");
console.log("REVIEW LOCK: Full recordings are NOT isolated word clips; no AI Quran, no new credits.");
