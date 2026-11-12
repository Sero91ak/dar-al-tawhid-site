#!/usr/bin/env node
"use strict";
/* Zero-credit exact-binary audit for the complete first Academy lesson.
   This is NOT a human pronunciation/religious-source approval. */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const plan=read("kids/data/academy-sidq-v4-voice-plan-v30.json");
const manifestFiles=[
 "kids/data/academy-audio-staging-sidq-v4-20261111.json",
 "kids/data/academy-audio-staging-sidq-v30-20261111.json",
 "kids/data/academy-audio-staging-sidq-fusha-v30-20261111.json"
];
const stages=manifestFiles.map(read);
const publicAudio=read("kids/data/academy-audio.json");
assert.deepEqual(stages.map(s=>Object.keys(s.entries||{}).length),[4,64,12],
 "Original four, German-safe sixty-four, Fuṣḥā-sensitive twelve must all be present");
assert.equal(plan.counts.ageVersions,3);
assert.equal(plan.counts.questions,8);
assert.equal(plan.counts.uniquePhrases,80);
const byText=new Map();
const lines=[];
for(let lane=0;lane<stages.length;lane++){
 const stage=stages[lane],source=manifestFiles[lane];
 assert.equal(stage.stagingOnly,true,"Stage is not public: "+source);
 if(lane===0||lane===1)assert.equal(stage.reviewRequiredBeforePublicPlayback,true,source);
 else assert.equal(stage.requiresOwnerListeningApproval,true,source);
 for(const [text,item] of Object.entries(stage.entries)){
  assert.ok(!byText.has(text),"Duplicate billed phrase across V4 lanes: "+text);
  assert.equal(item.modelId,"eleven_v4",text);
  assert.equal(item.voiceId,"DkU7j9uO4ZEtLD2iRZSH",text);
  assert.equal(item.voiceSettingsProfile,"kids_story",text);
  assert.equal(item.approvedForPlayback,false,text);
  assert.match(item.qaStatus,/technical-passed/,text);
  assert.equal(item.pronunciationDictionaryAppliedByBackend,false,text);
  assert.match(item.url,/^\/kids\/assets\/kids-academy-audio\/[a-f0-9]{20}\.m4a$/,"Exact canonical audio URL");
  const audio=path.join(ROOT,item.url.slice(1));
  assert.ok(fs.existsSync(audio),"Missing recorded audio: "+audio);
  const blob=fs.readFileSync(audio);
  assert.ok(blob.length>=1800,"Truncated owner voice audio: "+item.url);
  assert.equal(crypto.createHash("sha256").update(blob).digest("hex"),item.sha256,"Owner voice SHA mismatch: "+text);
  assert.ok(item.durationSeconds>=0.8&&item.durationSeconds<=65,"Duration out of contract");
  assert.ok(!Object.prototype.hasOwnProperty.call(publicAudio.entries||{},text),
    "Public player must NOT contain an unreviewed owner V4 phrase: "+text);
  const record={text,source:source,asset:item.url,sha256:item.sha256,
    durationSeconds:item.durationSeconds,modelId:item.modelId,
    voiceId:item.voiceId,approvedForPlayback:false,reviewRequired:true,
    languageSensitive:lane===2,ageContexts:[]};
  byText.set(text,record);
 }
}
assert.equal(byText.size,80);
for(const phrase of plan.phrases){
 const record=byText.get(phrase.text);
 assert.ok(record,"Missing exact canonical first-lesson voice clip: "+phrase.text);
 record.ageContexts=phrase.contexts.map(x=>({age:x.age,kind:x.kind,profile:x.profile}));
 lines.push(record);
}
assert.equal(lines.length,80);
assert.ok(["4-5","6-8","9-10"].every(age=>lines.some(x=>x.ageContexts.some(c=>c.age===age))));
assert.ok(lines.some(x=>x.text==="Liebe Schwester."&&x.ageContexts.some(c=>c.profile==="girl")));
assert.ok(lines.some(x=>x.text==="Lieber Bruder."&&x.ageContexts.some(c=>c.profile==="boy")));
assert.equal(lines.filter(x=>x.languageSensitive).length,12);
const duration=lines.reduce((n,x)=>n+x.durationSeconds,0);
const report={
 schemaVersion:1,id:"KIDS_ACADEMY_SIDQ_FIRST_LESSON_V31_BINARY_COVERAGE_20261111",
 lessonId:"sidq",source:"kids/data/academy-sidq-v4-voice-plan-v30.json",
 modelId:"eleven_v4",voiceId:"DkU7j9uO4ZEtLD2iRZSH",
 scope:"TAWḤĪD KIDS only",
 ageVersions:["4-5","6-8","9-10"],
 genderProfiles:["boy","girl"],
 totals:{exactRequired:80,staged:80,missing:0,publicApproved:0,
   genderGreetingClips:2,fushaSensitiveHumanReviewPending:12,
   allClipsRequireHumanListening:true,approxDurationSeconds:Math.round(duration*100)/100},
 policy:{stagingOnly:true,noAudioMadePublic:true,noSyntheticQuranRecitation:true,
   FuṣḥāExactPronunciationNotHumanVerified:true,
   releaseBlockedUntilOwnerListening:true},
 entries:lines
};
const file=path.join(ROOT,"kids/data/academy-sidq-v4-coverage-v31.json");
const content=JSON.stringify(report,null,2)+"\n";
if(process.argv.includes("--write"))fs.writeFileSync(file,content);
else if(process.argv.includes("--check"))assert.equal(fs.readFileSync(file,"utf8"),content,"V31 report differs from exact GitHub V4 audio files");
console.log(JSON.stringify({pass:true,lesson:"Ṣidq",required:80,staged:80,
  needsPronunciationReview:80,explicitFushaReview:12,publicApproved:0,
  recordedDurationSeconds:report.totals.approxDurationSeconds,
  reportFile:"kids/data/academy-sidq-v4-coverage-v31.json"},null,2));
