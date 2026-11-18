#!/usr/bin/env node
"use strict";
/* Frauenwissen · pre-send static contract, no API credentials, no sends.
 * Run: node scripts/test-frauen-batch16-notification-draft.cjs
 * This is NOT a replacement for native-language/source QA, an installed
 * OneSignal opt-in audience, hardware QA, or the separate DAR Admin unlock.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const load=name=>JSON.parse(fs.readFileSync(path.join(root,name),"utf8"));
const manifest=load("content/admin/frauen-batch-16-2026-11-18.json");
const lock=load("content/admin/push-lanes-lock.json");
const required=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const n=manifest.notificationDraft||{};
const uuid4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const has=(a,b)=>Array.isArray(a)&&a.includes(b);
function validate(o){
  assert.equal(manifest.expectedReleaseCount,16,"wrong release size");
  assert.equal(manifest.records.length,16,"wrong canonical cohort");
  assert.deepEqual(manifest.requiredLocales,required,"wrong locale roster");
  assert.equal(o.type,"knowledge_woman","wrong scoped notification lane");
  assert.equal(o.audience,"verified woman AND adult-app AND knowledge-opt-in","audience weakened");
  assert.equal(o.destination,"https://dar-al-tawhid.de/#frauen","wrong original reader route");
  assert.equal(o.idempotencyKey,"frauen-batch16-20261118","editorial event key drift");
  assert.match(o.providerIdempotencyUuid||"",uuid4,"provider idempotency key must be UUIDv4");
  assert.equal(o.onceOnly,true,"single-send requirement absent");
  assert.equal(o.optInRequired,true,"explicit opt-in required");
  assert.equal(o.verifyTargetSegment,true,"provider segment verification required");
  assert.equal(o.requireReleaseSuccessBeforeSend,true,"post-live verification missing");
  assert.equal(o.requireSeparatePushLockPassword,true,"password requirement missing");
  assert.ok(has(o.requiredUnlocks,"push-global-freigabe"),"global lane unlock missing");
  assert.ok(has(o.requiredUnlocks,"post-push-freigabe"),"post lane unlock missing");
  assert.equal(o.sendVia,"existing DAR Admin contribution publisher; never generic OneSignal all/DAR_PUSH");
  assert.equal(lock.globalApprovalRequired,true,"global approval was weakened");
  assert.equal(lock.passwordRequired,true,"global password policy was weakened");
  assert.deepEqual(Object.keys(o.localizedMessages||{}).sort(),[...required].sort(),"one or more push languages missing");
  const german=o.localizedMessages.de;
  for(const code of required){
    const msg=o.localizedMessages[code];
    assert.equal(typeof msg.title,"string",code+" title missing");
    assert.equal(typeof msg.body,"string",code+" body missing");
    assert.ok(msg.title.trim().length>=10&&msg.body.trim().length>=25,code+" text too short");
    if(code!=="de"){
      assert.notEqual(msg.title,german.title,code+" copied German title");
      assert.notEqual(msg.body,german.body,code+" copied German body");
    }
  }
  assert.match(o.messageReview||"",/native-language validation required/,"editorial drafts must not be presented as language certified");
  const delivery=o.deliveryLanguageVerification||{};
  assert.deepEqual(delivery.appLanguages,required,"nine requested app languages not acknowledged");
  assert.deepEqual(delivery.existingWebSdkDirectLanguages,["de","en","tr","ar","bs","fr","es"],"web SDK capability assumption changed without verification");
  assert.deepEqual(delivery.perSubscriptionRoutingRequired,["ku","ckb"],"Kurdish deliveries must use verified per-installation routing");
  if(o.guardStatus!=="not-authorized-not-sent"){
    for(const key of ["iosNativeSdkLocaleBridgeVerified","androidNativeSdkLocaleBridgeVerified","kurdishPerSubscriptionRoutingVerified","targetSegmentOptInVerified","allNineInstallationLanguagesVerified"]){
      assert.equal(delivery[key],true,key+" must be verified before notification authorization");
    }
  }
}
validate(n);
// Negative controls prove a generic segment or missing authorization cannot
// silently pass this static plan check.
for(const [change,why] of [
 [{audience:"DAR_PUSH"},"generic fallback"],
 [{providerIdempotencyUuid:"frauen-batch16-20261118"},"non UUID provider key"],
 [{requireSeparatePushLockPassword:false},"password bypass"],
 [{verifyTargetSegment:false},"missing audience verification"],
 [{localizedMessages:{...n.localizedMessages,ar:undefined}},"missing language"]
]){
  assert.throws(()=>validate({...n,...change}),undefined,why+" unexpectedly accepted");
}
if(manifest.state==="content-preparation-only"){
  assert.equal(lock.locked,true,"prepared-only release unexpectedly has global push unlocked");
  assert.equal(n.guardStatus,"not-authorized-not-sent","draft notification flagged as approved");
  assert.equal(n.sendStatus,"blocked-until-deployed-and-authorized","draft unexpectedly send-ready");
}
console.log("PASS Frauen batch16: nine-language push draft, stable provider UUIDv4, strict scoped audience, dual-lane authorization and four fail-closed negative controls. NO MESSAGE SENT.");
