#!/usr/bin/env node
"use strict";
/* Rebuild runs as a strictly read-only compatibility check. The V9 archive must
 * NOT be overwritten: two current teaching phrases are assigned to new plans. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const source=fs.readFileSync(process.argv[2]||"/tmp/kids-academy-v9-original.json","utf8");
const present=fs.readFileSync("kids/data/academy-voice-plan-v9.json","utf8");
assert.equal(present,source,"The original historical V9 archive must stay byte-for-byte immutable");
const archive=JSON.parse(present);
const short="As-salāmu ʿalaykum",full="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh";
assert.equal(archive.phraseCount,454);
assert.equal(archive.phrases.filter(p=>p.text.includes(short)).length,2,"Two historic old Salam texts remain archived, never approved for new synthesis");
const current=fs.readFileSync("kids/akademie/curriculum-v1.js","utf8");
for(const replacement of [
 full+" ist ein islamischer Friedensgruß.",
 "Jemand sagt zu dir "+full+". Was tust du?"
])assert(current.includes(replacement),"The current Academy teaching content must use full greeting: "+replacement);
const future=JSON.parse(fs.readFileSync("kids/data/academy-full-salam-voice-plan-v19.json","utf8"));
assert(future.phrases.some(p=>p.text===full+"."&&p.reviewStatus==="not-generated"&&p.approvedForPlayback===false),"New canonical greeting is a pending V19 recording, never borrowed from V9");
assert(future.voicePolicy.allowPaidGeneration===false,"Never charge ElevenLabs on a CI audit");
const exporter=fs.readFileSync("kids/tools/export-academy-voice-plan.js","utf8");
assert(exporter.includes("Unexpected changes to immutable V9 archive"),"The V9 generator must refuse all unapproved future drift");
console.log("PASS: original 454 V9 phrases are byte-identical; two full-Salam teaching updates are source-only; new V19 greeting remains ungenerated.");
