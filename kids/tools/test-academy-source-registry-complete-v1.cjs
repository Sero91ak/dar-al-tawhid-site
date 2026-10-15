#!/usr/bin/env node
"use strict";
/* Read-only regression for source assignment across ALL 208 KIDS AKADEMI lessons.
 * Scientific verification and pedagogical release are distinct from structural binding.
 * Usage: node kids/tools/test-academy-source-registry-complete-v1.cjs
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const ledger=read("kids-akademie/LESSON_STATUS.json");
const registry=read("kids-akademie/research/SOURCE_REGISTRY.json");
assert.equal(ledger.lessons.length,208,"must keep all 208 curriculum positions");
assert.equal(registry.sourceCount,registry.sources.length,"sourceCount must equal actual records");
const lessons=new Map(ledger.lessons.map(x=>[x.lessonId,x]));
assert.equal(lessons.size,208,"lesson IDs must be unique");
const sourceIds=new Set(),keys=new Set(),assigned=new Map();
for(const source of registry.sources){
 assert.ok(typeof source.sourceId==="string"&&source.sourceId,"missing sourceId");
 assert.ok(typeof source.key==="string"&&source.key,"source registry key must be set");
 assert.ok(!sourceIds.has(source.sourceId),"duplicate sourceId: "+source.sourceId);
 assert.ok(!keys.has(source.key),"duplicate source key: "+source.key);
 sourceIds.add(source.sourceId);keys.add(source.key);
 for(const id of source.lessonIds||[]){
  assert.ok(lessons.has(id),"orphan source binding: "+source.sourceId+" -> "+id);
  if(!assigned.has(id))assigned.set(id,[]);
  assigned.get(id).push(source);
 }
}
for(const lesson of ledger.lessons){
 const sources=assigned.get(lesson.lessonId)||[];
 assert.ok(sources.length>0,"lesson "+lesson.slot+" lacks a source registry link");
 assert.ok(sources.some(s=>/^https:\/\//.test(s.directLink||"")),"lesson "+lesson.slot+" lacks direct HTTPS source URL");
 assert.equal(lesson.releaseStatus,"not-approved-not-live","scientific release guard changed at slot "+lesson.slot);
 assert.equal(lesson.voiceApproved,false,"voice approval guard changed at slot "+lesson.slot);
}
const activeLegacy=registry.sources.filter(s=>s.verificationStatus==="legacy-lesson-documentation-not-independently-reverified-2026-10-15");
for(const s of activeLegacy){
 assert.ok(s.checkedOn===null,"legacy unverified source falsely dates itself as checked: "+s.sourceId);
 assert.match(s.authenticityNote||"",/not independently|not confirmed|not independently confirmed/i,"legacy source must disclose incomplete verification");
}
assert.ok(activeLegacy.length<=26,"Regression: already verified historical sources were downgraded to unverified");
const verified=["SRC-CORE57-LEGACY-HADITH-6116","SRC-CORE58-LEGACY-HADITH-164","SRC-CORE59-LEGACY-HADITH-4474","SRC-CORE60-LEGACY-HADITH-7410","SRC-CORE61-LEGACY-HADITH-2723","SRC-CORE62-LEGACY-HADITH-6026","SRC-CORE63-LEGACY-HADITH-2320","SRC-CORE64-LEGACY-HADITH-8"];
for(const sid of verified){
 const s=registry.sources.find(x=>x.sourceId===sid);
 assert.ok(s,"missing independently cross-checked source "+sid);
 assert.equal(s.checkedOn,"2026-10-15");
 assert.match(s.verificationStatus,/verified-dorar-2026-10-15/);
 assert.ok(s.directLink&&s.directLink.startsWith("https://dorar.net/"));
 assert.ok(s.arabic&&s.narrator&&s.authenticityNote);
}
process.stdout.write("PASS: 208/208 linked lessons; "+registry.sources.length+" unique sources/keys; "+activeLegacy.length+" inherited reports still openly unverified; 0 releases; verification != approval\n");
