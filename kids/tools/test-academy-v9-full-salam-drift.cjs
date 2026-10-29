#!/usr/bin/env node
"use strict";
/* KIDS Academy V9 frozen original versus current source: exactly the owner-
 * authorized complete-Salam substitutions are permitted. This is a read-only
 * comparison of the already produced /tmp export and original archived JSON. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const archive=JSON.parse(fs.readFileSync(process.argv[2]||"/tmp/kids-academy-v9-original.json","utf8"));
const rebuilt=JSON.parse(fs.readFileSync("kids/data/academy-voice-plan-v9.json","utf8"));
const short="As-salāmu ʿalaykum";
const full="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh";
assert.equal(archive.phraseCount,454,"Original V9 phrase count is frozen");
assert.equal(rebuilt.phraseCount,archive.phraseCount,"Only wording changes, no dropped lessons or audio requests");
const originalStrings=archive.phrases.filter(p=>p.text.includes(short));
assert.equal(originalStrings.length,2,"Exactly two historical Salām teaching utterances must be identified");
const projected=archive.phrases.map(p=>({...p,text:p.text.split(short).join(full)}));
const byText=(items)=>new Map(items.map(p=>[p.text,p]));
const expected=byText(projected),actual=byText(rebuilt.phrases);
assert.equal(expected.size,archive.phrases.length,"No duplicate phrases introduced");
assert.equal(actual.size,expected.size,"No phrases silently added or removed");
for(const [text,p] of expected){
 assert(actual.has(text),"Unexpected lost/mutated phrase: "+text.slice(0,70));
 assert.deepEqual(actual.get(text),p,"Speech context/voice profile/age altered for "+text.slice(0,70));
}
for(const field of Object.keys(archive).filter(x=>x!=="phrases")){
 assert.deepEqual(rebuilt[field],archive[field],"Voice plan metadata changed: "+field);
}
assert(rebuilt.phrases.every(x=>x.reviewStatus==="not-generated"&&!x.url),"Never claim recorded/approved audio from a textual replacement");
console.log("PASS: V9 historical 454-phrase inventory retained; only two owner-authorized full-Salam utterances differ in reproducible export. Archived plan stays unchanged.");
