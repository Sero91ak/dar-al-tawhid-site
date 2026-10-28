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
  assert.equal(a.url,e._root+e.audioFile,"Immutable original URL mismatch");
  assert.equal(a.sha256,e.audioSha256);
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
  assert.equal(a.timingStatus,"character-alignment-exact");
  assert.deepEqual(a.timings,e.timings);
  assert.equal(a.timings.length,story.masterStoryText.split(/\n{2,}/).length);
  assert.match(a.url,/^https:\/\/raw\.githubusercontent\.com\/Sero91ak\/dar-al-tawhid-site\/[a-f0-9]{40}\/kids\/review-only\/salaf-v4-(?:20261027|complete-20261028\/salaf-v4-pending-0[1-8])\/[a-z0-9-]+\.m4a$/);
}
assert.equal(seen.size,33);
const js=read("kids/salaf-library-v1.js");
assert(js.includes("owner-direct-preview-pending-human-qa"));
assert(js.includes("HÖRPROBE")&&js.includes("Vorhörfassung"));
assert(js.includes("audioPreview")&&js.includes("raw.githubusercontent.com"));
assert(js.includes('if(url&&!i.audioPreview)window.DARKidsItemDownloads?.storyDetail'),"Uncached cross-origin previews must not falsely claim offline support");
console.log("PASS: 33/33 owner-authorized previews with immutable URL+sha+timings; 34th story blocked; human QA remains false");
