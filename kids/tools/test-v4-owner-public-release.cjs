#!/usr/bin/env node
"use strict";
/* TAWḤĪD KIDS: release QA for owner-authorized V4, not a Fuṣḥā hearing certificate.
 * Compare all 1,800 original clip records and 1,217 audio bytes against
 * unaltered review evidence before permitting deployment. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");
const read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const review=read("kids/data/quiz-v4-full-rebuild-review.json");
const published=read("kids/data/quiz-v4-full-rebuild-public.json");
const bank=read("kids/data/quiz-kids-public-450.json").items;
const qMap=new Map(bank.map(q=>[q.id,q]));
const age={"4-6":0,"7-8":0,"9-10":0};
const parts=["question","correct","retry","explanation"];
const mp3=new Map();
assert.equal(bank.length,450);
assert.equal(qMap.size,450);
assert.equal(published.id,"TAWHID_KIDS_450_V4_NEW_REBUILD_PUBLIC");
assert.equal(published.releaseEnabled,true);
assert.equal(published.ownerReleaseAuthorized,true);
assert.equal(published.ownerAuthorizationDate,"2026-10-27");
assert.equal(published.humanListeningApproved,false,"NEVER fabricate listening approval");
assert.equal(published.originReviewManifestSha,"05c9557c2f0d564a06c9b5769740c94ebd195526");
assert.equal(published.qaStatus,"OWNER_AUTHORIZED_V4_TECHNICALLY_VERIFIED_FUSHA_LISTENING_UNVERIFIED");
assert.equal(published.modelId,"eleven_v4");
assert.equal(published.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
assert.equal(review.releaseEnabled,false);
assert.equal(review.humanListeningApproved,false);
assert.equal(Object.keys(published.questions).length,450);
for(const [id,q] of Object.entries(published.questions)){
  const old=review.questions[id],entry=qMap.get(id);
  assert.ok(old&&entry,"Question ID mismatch: "+id);
  assert.equal(q.ageBand,entry.ageBand);
  assert.equal(q.source,entry.source);
  assert.deepEqual(q,old,"Published clip metadata must be byte-identical to original review: "+id);
  age[q.ageBand]++;
  assert.deepEqual(Object.keys(q.clips).sort(),parts.slice().sort());
  for(const part of parts){
    const c=q.clips[part];
    assert.equal(c.modelId,"eleven_v4");
    assert.equal(c.voiceId,published.voiceId);
    assert.equal(c.humanListeningApproved,false);
    assert.equal(c.approvedForPlayback,false);
    assert.ok(c.text&&c.text.trim(),"Missing speech: "+id+":"+part);
    assert.match(c.sha256,/^[a-f0-9]{64}$/);
    assert.ok(c.url.startsWith("/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/"+q.ageBand+"/"));
    if(mp3.has(c.url))assert.equal(mp3.get(c.url),c.sha256);
    mp3.set(c.url,c.sha256);
  }
}
assert.deepEqual(age,{"4-6":150,"7-8":150,"9-10":150});
assert.equal(mp3.size,1217);
for(const [url,sha] of mp3){
  const filepath=url.replace(/^\//,"");
  assert.ok(fs.existsSync(filepath),"Missing original V4 MP3: "+url);
  const bytes=fs.readFileSync(filepath);
  assert.ok(bytes.length>1700,"Truncated V4 MP3: "+url);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),sha,"Corrupted V4 MP3: "+url);
}
const player=fs.readFileSync("kids/quiz-v4-approved-player.js","utf8");
assert.ok(player.includes("ownerReleaseAuthorized===true"));
assert.ok(player.includes('data.humanListeningApproved!==true&&!ownerRoute'));
assert.ok(player.includes('clip.modelId!=="eleven_v4"'));
assert.ok(player.includes('data.releaseEnabled!==true'));
assert.ok(!player.includes("speechSynthesis."),"No browser voice fallback for KIDS");
console.log("PASS: OWNER-AUTHORIZED public Eleven V4 · 450/450 questions · 150/150/150 · 1,800 exact clips · 1,217 authentic SHA-256 MP3s · human Fuṣḥā hearing NOT certified");
