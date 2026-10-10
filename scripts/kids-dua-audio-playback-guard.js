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

/* KIDS_DUA_LOAD_RATE_REGRESSION
 * Simulate a WebKit/HTMLMediaElement which resets playbackRate at load
 * and once more at 'playing'. Normal, slow and isolated word must remain
 * at their requested speeds using EXISTING recordings only.
 */
const extracted=js.match(/  function playUrl\(url,whichMode,label,playRate\)\{([\s\S]*?)\n  \}\n  \/\/ Each native/);
assert(extracted,"Cannot isolate real whole-phrase player");
const speedHarness=`(function(){
  var playToken=0,playing=false,mode="",root=null;
  var observations=[];
  var audio={
    playbackRate:1,defaultPlaybackRate:1,preservesPitch:true,
    pause:function(){},
    load:function(){this.playbackRate=1;},
    play:function(){
      var record={src:this.src,rate:this.playbackRate,defaultRate:this.defaultPlaybackRate,pitch:this.preservesPitch};
      this.playbackRate=1;
      if(this.onplaying)this.onplaying();
      record.afterPlaying=this.playbackRate;
      observations.push(record);
      return Promise.resolve();
    }
  };
  function stopAudio(){playToken++;playing=false;mode="";audio.pause();audio.defaultPlaybackRate=1;audio.playbackRate=1;audio.onplaying=null;}
  function ensureAudioAttached(){}
  function paintControls(){}
  function setStatus(){}
  ${"function playUrl(url,whichMode,label,playRate){"+extracted[1]+"\n}"}
  playUrl("/existing-master.m4a","full","",1);
  playUrl("/existing-master.m4a","slow","",.77);
  playUrl("/existing-word.m4a","word","");
  return observations;
})()`;
const rates=vm.runInNewContext(speedHarness,{Promise},{timeout:4000});
assert.equal(rates.length,3);
assert.equal(rates[0].rate,1,"Normal mode must remain original tempo");
assert.equal(rates[1].rate,.77,"Slow mode must NOT reset to 1x on media load");
assert.equal(rates[1].defaultRate,.77,"Slow mode must set the native default rate");
assert.equal(rates[1].afterPlaying,.77,"iOS rate reset during play must be corrected");
assert.equal(rates[2].rate,1,"Slow rate leaked into word mode");
assert(rates.every(x=>x.pitch===true),"Time stretch must preserve the Arabic pitch");
assert.equal(rates[0].src,rates[1].src,"Slow mode must reuse the existing Fuṣḥā master, with zero TTS synthesis");

for(const key of [
  'var CLEAN_GAP=0.19;',
  'var CLEAN_SLOW_RATE=0.77;',
  'var rate=slow?CLEAN_SLOW_RATE:1;',
  'var direct=requestedDua.audioArabicUrl;',
  'var approvedSlow=mode==="slow"?approvedNativeSlowUrl(currentDua):"";',
  'var nativeSlow=!!approvedSlow&&String(url)===approvedSlow;',
  'attachPhraseFollow(currentDua,nativeSlow,token)',
  'function playCleanSequence',
  'function playWordSequence',
  'function approvedNativeSlowUrl',
  'row.audioListeningApproved===true',
  'var latestPhraseRequest=0;',
  'var requestedDua=currentDua,requestId=++latestPhraseRequest;',
  'if(requestId!==latestPhraseRequest||currentDua!==requestedDua)return false;',
  'if(requestId!==latestPhraseRequest||currentDua!==dua)return false;',
  'row.qaApproval==="human-reviewed-natural-fusha"',
  'var direct=dua.audioArabicUrl,playRate=slow?CLEAN_SLOW_RATE:1;',
  'function cleanWordWindow',
  'function keepFocusedWordVisible',
  'data-dsl="full"',
  'data-dsl="slow"',
  'data-dsl="follow"'
])assert(js.includes(key),"Missing playback invariant: "+key);
assert(!js.includes("speechSynthesis"),"Unexpected system TTS in Duʿāʾ player");
assert(js.includes("audio.playbackRate=requestedRate"),"iOS post-load slow-speed correction missing");
assert(js.includes("audio.onratechange=ensureRequestedRate;"),"iOS ratechange reset protection missing");
assert(js.includes("audio.onloadedmetadata=ensureRequestedRate;"),"iOS metadata reset protection missing");
assert(js.includes("Langsam · 0,77×"),"Slow mode must be visibly distinguishable");

assert(js.includes("if(playCleanSequence([e.url],[seg],"),"Word fallback must use WebAudio cleaning");
assert(js.includes("var BATCH_SIZE=5;"),"Long Duʿāʾ word sequences must use bounded requests");
assert(js.includes("var latestWordRequest=0;"),"Word audio promises must be invalidated on mode change");
assert(js.includes("if(requestId!==latestWordRequest||currentDua!==requestedDua)return false;"),"Stale word audio must not restart when a newer word is selected");
assert(js.includes("latestWordRequest++;"),"Stopping audio must invalidate late word requests");
assert(/function playWhole\(slow\)\{\s*if\(!currentDua\)return false;\s*stopAudio\(\);/.test(js),"Whole-phrase pending downloads must cancel existing audio immediately");
assert(js.includes("urls.slice(offset,offset+BATCH_SIZE).map(cleanDecode)"),"Word batches must prefetch only five neighbouring clips");
assert(!js.includes("Promise.all(urls.map(cleanDecode))"),"Unbounded word-audio fetch would overload iPhone");
assert(js.includes("if(noWordsStarted&&typeof onFailure==="),"Fallback must not repeat a partially heard Duʿāʾ");
assert(/function stopAudio\(\)\{[\s\S]*?playToken\+\+;\s*latestPhraseRequest\+\+;/.test(js),"Audio stops must invalidate pending asynchronous phrase requests");
assert(/return loadPacks\(\)\.then\(run\)/.test(js),"No asynchronous manifest load path to protect");
assert(!js.includes('attachPhraseFollow(currentDua,mode==="slow",token)'),"Wrong timestamps: slowed normal master is not a distinct native slow source");
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
const breathTail=trim(signal(2.65,[[.30,.40,.012],[.40,1.12,.18],[1.12,1.20,.018],[1.75,2.03,.045]]));
assert(breathTail.end>=1.20&&breathTail.end<1.50,
  "A separate lower-level exhale must be excluded, without clipping the final Arabic consonant");
const joinedFinal=trim(signal(2.0,[[.25,1.00,.18],[1.08,1.46,.08]]));
assert(joinedFinal.end>=1.46,
  "A weak but connected final consonant must remain in the V4 word");
const softExhale=trim(signal(2.4,[[.25,1.07,.18],[1.18,1.46,.016]]));
assert(softExhale.end>=1.07&&softExhale.end<1.16,
  "A clearly separated very soft exhale must not remain audible after the Fuṣḥā word");



const generator=read(".github/workflows/build-kids-quiz-owner-voice.yml");
assert(!generator.includes('value="[slowly] "+value'),"Slow spoken directive is still in generator");
assert(!generator.includes('value="[slowly] "+value.rstrip(".")+"."'),"Synthetic word-ending breath cue remains");
assert(generator.includes('"speed":0.88')&&generator.includes('"speed":0.92'),"Arabic native speed profiles missing");
assert(generator.includes("|| 'pause' }}"),"Non-voice code push can accidentally synthesize whole libraries");
assert(generator.includes("fetch-depth: 2"),"Voice scope change detection cannot resolve merge parent");
assert(generator.includes("model_id==\"eleven_v4\""),"Expected V4-only voice setting filter");
assert(generator.includes("models_by_text=word_models"),"Approved per-word V3 model routing missing");
assert(generator.includes("allow_reviewed_legacy=True"),"Existing word audio must be preserved");
assert(generator.includes("if len(missing)>limit:"),"Small batch spending cap missing");
assert(generator.includes("final word recording not human-audio-approved"),"Unreviewed V3 output could be published");
assert(generator.includes("real_hash!=str(a.get(\"sha256\") or \"\")"),"Approved V3 asset lacks SHA-256 match");
const modelPolicy=JSON.parse(read("kids/data/dua-audio-model-policy.json"));
assert.equal(modelPolicy.voiceProfileId,"serhat-owner-voice-2026");
assert.equal(modelPolicy.defaultWordModel,"eleven_v4");
assert.equal(modelPolicy.comparisonWordModel,"eleven_v3");
assert.equal(modelPolicy.allowAutomaticV3Promotion,false);
assert(Array.isArray(modelPolicy.approvedV3Words),"V3 approval list malformed");
assert(modelPolicy.approvedV3Words.length<=8,"Too many V3 approvals per batch");
for(const item of modelPolicy.approvedV3Words){
  assert.equal(item.model,"eleven_v3");
  assert.equal(item.status,"human-audio-approved");
  assert(typeof item.arabic==="string"&&item.arabic.trim(),"V3 approval lacks Arabic text");
  assert(typeof item.approvedBy==="string"&&item.approvedBy.trim(),"V3 approval lacks responsible reviewer");
  assert(/^[0-9a-f]{64}$/.test(item.sha256||""),"V3 approval requires SHA-256 of final clip");
}
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
  assert(read(page).includes("/kids/dua-smart-learn.js?v=1310"),page+" stale script");
assert(read("kids/sw.js").includes('"/kids/dua-smart-learn.js?v=1310"'),"SW precache mismatch");
console.log("KIDS DUA AUDIO PASS: full phrase unchanged, slow focus, soft word-boundary QA, 120/120/696 registered, PWA aligned");
console.log("Not certified: real audible breaths, native Arabic pronunciation and device QA.");
