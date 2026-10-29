#!/usr/bin/env node
/* Kids Salaf: exclusive immutable preview links in the existing global Kids
   story categories, but never impersonate fully reviewed live masters. */
"use strict";
const fs=require("node:fs"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const root=process.cwd();
const read=p=>fs.readFileSync(p,"utf8");
const catalog=JSON.parse(read("kids/data/salaf-library-v1.json"));
const html=read("salaf-v4-33-hoeren-20261028.html");
const m=html.match(/const SNAPSHOT=(\{[^\n]+\});\nconst BATCHES=/);
assert(m,"Canonical pinned 33-record production snapshot absent");
const snapshot=JSON.parse(m[1]);
assert.equal(catalog.items.length,34);
const approved=catalog.items.filter(s=>s.verification==="approved"&&s.editorialRelease===true);
assert.equal(approved.length,33);
assert.equal(Object.keys(snapshot.entries).length,33);
const seen=new Set();
for(const story of catalog.items){
  if(story.editorialRelease!==true||story.verification!=="approved"){
    assert.equal(story.audioMaster,null);
    assert(!story.audioPreview,"Blocked 34th story must not be audible");
    continue;
  }
  assert(!seen.has(story.id),"Duplicate story");
  seen.add(story.id);
  const e=snapshot.entries[story.id],a=story.audioPreview;
  assert(e&&a,story.id+": missing original preview");
  assert.equal(story.audioMaster,null,"No claim of reviewed and published master");
  if(story.id==="abu-asim-die-zunge-bewahren"){
    const rejected="eaebc06624b95886afacdced30c1ab4cdbd04e629a20b2f0292169bb3d6deb14";
    const accepted="773b5764884c5edb56b439dd7d92ecbaf234f781d4c14a08102f295668fe4d2e";
    assert.equal(e.audioSha256,rejected,"Archived original must remain pinned for audit");
    assert.equal(a.sha256,accepted,"Only the corrected full-length V4 master is allowed");
    assert.notEqual(a.sha256,rejected,"Rejected original must remain blocked");
    assert.equal(a.url,"https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/619f60215146fdf687539a6ae140c0b917bd51a4/kids/review-only/salaf-v4-ghibah-repair-20261029/abu-asim-die-zunge-bewahren.m4a");
    assert.equal(a.durationSec,152.529);
    assert.equal(a.timingStatus,"estimated-awaiting-actual-alignment","Do not invent human-aligned cue points");
    assert.equal(a.timings[4].end,a.timings[5].start,"Corrected splice must not overlap the next paragraph");
    assert.equal(a.repairSourceSha256,rejected);
  }else{
    assert.equal(a.url,e._root+e.audioFile,"Immutable original URL mismatch");
    assert.equal(a.sha256,e.audioSha256);
    assert.equal(a.timingStatus,"character-alignment-exact");
    assert.deepEqual(a.timings,e.timings);
  }
  assert.equal(a.textSha256,e.textSha256);
  assert.equal(a.textSha256,crypto.createHash("sha256").update(story.masterStoryText,"utf8").digest("hex"));
  assert.equal(a.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
  assert.equal(a.modelId,"eleven_v4");
  assert.equal(a.languageCode,"de");
  assert.equal(a.globalArabicDictionaryApplied,false);
  assert.equal(a.ownerAuthorizedPublicPreview,true);
  assert.equal(a.previewStatus,"owner-direct-preview-pending-human-qa");
  assert.equal(a.humanListeningApproved,false);
  assert.equal(a.approvedForPlayback,false);
  assert.equal(a.releaseEnabled,false);
  assert.equal(a.timings.length,story.masterStoryText.split(/\n{2,}/).length);
  assert.match(a.url,/^https:\/\/raw\.githubusercontent\.com\/Sero91ak\/dar-al-tawhid-site\/[a-f0-9]{40}\/kids\/review-only\/salaf-v4-(?:20261027|complete-20261028\/salaf-v4-pending-0[1-8]|ghibah-repair-20261029)\/[a-z0-9-]+\.m4a$/);
}
assert.equal(seen.size,33);
const js=read("kids/salaf-library-v1.js");
assert(js.includes("owner-direct-preview-pending-human-qa"));
assert(js.includes("HÖRPROBE")&&js.includes("Vorhörfassung"));
assert(js.includes("audioPreview")&&js.includes("raw.githubusercontent.com"));
assert(js.includes('if(url&&!i.audioPreview)window.DARKidsItemDownloads?.storyDetail'),"Uncached cross-origin previews must not falsely claim offline support");
console.log("PASS: 32 unchanged Salaf previews + one SHA-pinned corrected Abū ʿĀṣim preview; rejected master blocked; no fake human QA");
