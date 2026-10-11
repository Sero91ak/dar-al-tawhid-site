#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const base=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(base,p),"utf8");
const html=read("test/kids/akademie/audio-audit-v18.html");
const creator=read("test/kids/akademie/index.html");
const old=JSON.parse(read("kids/data/academy-voice-plan-v9.json"));
const sidq=JSON.parse(read("kids/data/academy-sidq-voice-plan-v18.json"));
const pilot=JSON.parse(read("kids/data/academy-audio-staging-v9.json"));
assert.equal(old.phraseCount,454);assert.equal(sidq.phraseCount,57);
assert.equal(new Set([...old.phrases,...sidq.phrases].map(x=>x.text)).size,511);
assert.ok(creator.includes('/test/kids/akademie/audio-audit-v18.html'));
assert.ok(html.includes('name="robots" content="noindex,nofollow,noarchive"'));
for(const term of ["/kids/data/academy-voice-plan-v9.json","/kids/data/academy-sidq-voice-plan-v18.json","/kids/data/academy-audio-staging-v9.json","/kids/data/academy-audio-staging-sidq-v18.json"]){
 assert.ok(html.includes(term),"Missing QA data source "+term);
}
for(const selector of ['id="search"','id="subject"','id="age"','id="status"','id="existing"','id="missing"']){
 assert.ok(html.includes(selector),"Missing QA control "+selector);
}
assert.ok(html.includes("player.playbackRate")===false);
assert.ok(!html.includes("speechSynthesis"));
assert.ok(!html.includes("localStorage")&&!html.includes("indexedDB")&&!html.includes("serviceWorker.register"));
assert.ok(html.includes("safeAudio.test(entry.url)"));
const src=html.split("<script>").slice(-1)[0].split("</script>")[0];
new vm.Script(src,{filename:"audio-audit-v18-inline.js"});
assert.equal(Object.keys(pilot.entries).length,4);
assert.ok(Object.values(pilot.entries).every(x=>x.approvedForPlayback===false));
console.log("DAR TEST KIDS V18 AUDIO QA PASS: 511 unique mapped phrases, 4 QA-only originals, protected/no profile writes, syntax valid.");
