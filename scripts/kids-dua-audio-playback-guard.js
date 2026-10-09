#!/usr/bin/env node
"use strict";
/* KIDS_DUA_AUDIO_PLAYBACK_GUARD_V1
 * Targeted technical QA only. Native Fuṣḥā pronunciation and audible-breath
 * acceptance still require a human listening test.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("kids/dua-smart-learn.js");
new vm.Script(js,{filename:"kids/dua-smart-learn.js"});
for(const key of [
  'var CLEAN_GAP=0.19;',
  'var CLEAN_SLOW_RATE=0.86;',
  'var rate=slow?CLEAN_SLOW_RATE:1;',
  'var direct=currentDua.audioArabicUrl;',
  'attachPhraseFollow(currentDua,mode==="slow",token)',
  'function playCleanSequence',
  'function playWordSequence',
  'function approvedNativeSlowUrl',
  'row.audioListeningApproved===true',
  'row.qaApproval==="human-reviewed-natural-fusha"',
  'var direct=dua.audioArabicUrl,playRate=slow?CLEAN_SLOW_RATE:1;',
  'function cleanWordWindow',
  'function keepFocusedWordVisible',
  'data-dsl="full"',
  'data-dsl="slow"',
  'data-dsl="follow"'
])assert(js.includes(key),"Missing playback invariant: "+key);
assert(!js.includes("speechSynthesis"),"Unexpected system TTS in Duʿāʾ player");
const m=js.match(/function cleanWordWindow\(buffer\)\{([\s\S]*?)\n  \}\n  function cleanDecode/);
assert(m,"Cannot isolate real word-boundary trimmer");
const trim=vm.runInNewContext("(function cleanWordWindow(buffer){"+m[1]+"\n})",{},{timeout:4000});
function signal(duration,parts){
  const sampleRate=48000,data=new Float32Array(Math.round(sampleRate*duration));
  for(const p of parts){
    const lo=Math.round(p[0]*sampleRate),hi=Math.min(data.length,Math.round(p[1]*sampleRate));
    for(let i=lo;i<hi;i++)data[i]=p[2]*Math.sin(i*.045);
  }
  return {sampleRate,duration,getChannelData:()=>data};
}
const word=trim(signal(2.4,[[.30,.40,.012],[.40,1.10,.18],[1.10,1.18,.018]]));
assert(word.start>.1&&word.start<=.31,"Failed to trim padding or clipped quiet initial");
assert(word.end>=1.18&&word.end<1.6,"Failed to trim tail or clipped final sound");
assert(word.end>word.start,"Invalid selection length");
const rapid=trim(signal(.7,[[.03,.15,.04],[.15,.63,.12]]));
assert(rapid.start<=.03,"Clipped an immediate word start");
const quiet=trim(signal(1.5,[[.4,.7,.0005]]));
assert(quiet.start===0&&quiet.end===1.5,"Very soft words must not be cut");
const short=trim(signal(.17,[[0,.16,.2]]));
assert(short.start===0&&short.end===.17,"Short words must not be cut");

const generator=read(".github/workflows/build-kids-quiz-owner-voice.yml");
assert(!generator.includes('value="[slowly] "+value'),"Slow spoken directive is still in generator");
assert(!generator.includes('value="[slowly] "+value.rstrip(".")+"."'),"Synthetic word-ending breath cue remains");
assert(generator.includes('"speed":0.88')&&generator.includes('"speed":0.92'),"Arabic native speed profiles missing");
assert(generator.includes("|| 'pause' }}"),"Non-voice code push can accidentally synthesize whole libraries");
assert(generator.includes("fetch-depth: 2"),"Voice scope change detection cannot resolve merge parent");
assert(generator.includes("dua-arabic-native-fusha-word-v5-natural-20261009"),"Word render revision missing");
assert(generator.includes("dua-arabic-native-fusha-slow-v4-natural-20261009"),"Slow render revision missing");

for(const [file,count] of [
  ["kids/data/dua-arabic-audio.json",120],
  ["kids/data/dua-arabic-slow-audio.json",120],
  ["kids/data/dua-word-audio.json",696]
]){
  const pack=JSON.parse(read(file)),entries=Object.values(pack.entries||{});
  assert.equal(pack.modelId,"eleven_v4",file+" model");
  assert.equal(entries.length,count,file+" clip count");
  assert(entries.every(e=>Boolean(e.url)&&Number(e.durationSeconds)>.1),file+" clip metadata");
}
for(const page of ["kids/index.html","kids/start.html","kids/shell.html"])
  assert(read(page).includes("/kids/dua-smart-learn.js?v=1294"),page+" stale script");
assert(read("kids/sw.js").includes('"/kids/dua-smart-learn.js?v=1294"'),"SW precache mismatch");
console.log("KIDS DUA AUDIO PASS: full phrase unchanged, slow focus, soft word-boundary QA, 120/120/696 registered, PWA aligned");
console.log("Not certified: real audible breaths, native Arabic pronunciation and device QA.");
