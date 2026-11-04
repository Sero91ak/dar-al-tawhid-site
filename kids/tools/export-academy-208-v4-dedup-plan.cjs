#!/usr/bin/env node
"use strict";
/* 208 Academy V4 voice queue, ZERO CREDIT, REVIEW ONLY.
 * It never calls ElevenLabs or changes public audio manifests.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8"),json=p=>JSON.parse(read(p));
const context=vm.createContext({window:{}});
for(const v of ["v1","v2","v22","v25","v26","v27","v28","v29"])
 vm.runInContext(read("kids/akademie/curriculum-"+v+".js"),context,{timeout:12000});
for(const c of ["67-90","91-114","115-138","139-162","163-186","187-208"])
 vm.runInContext(read("kids/akademie/editorial-v31/curriculum-v31-"+c+".js"),context,{timeout:12000});
const policy=json("kids/data/academy-voice-policy-v10.json");
assert.equal(policy.voiceIdentity.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
assert.equal(policy.production.modelId,"eleven_v4");
assert.equal(policy.production.profile,"kids_story");
assert.equal(policy.costControls.autoPublishWithoutOwnerReview,false);
const voice=policy.voiceIdentity.voiceId,model=policy.production.modelId,profile=policy.production.profile;
const hash=s=>crypto.createHash("sha256").update(s,"utf8").digest("hex");
const fingerprint=hash(JSON.stringify({voice,model,profile,
 settings:policy.production.voiceSettings,dictionary:policy.production.pronunciationDictionaryId,
 dictionaryVersion:policy.production.pronunciationDictionaryVersionId}));
const normalize=s=>String(s||"").normalize("NFC").replace(/\s+/g," ").trim();
const phrases=new Map();
function add(text,lessonId,age,kind,draft){
 const value=normalize(text);if(!value)return;
 // Never synthesize Arabic Quran. Only human Qari recitation may supply that asset.
 if(/[\u0600-\u06ff]/.test(value))throw Error("Arabic script in synthetic queue: "+lessonId);
 const id=hash(fingerprint+"|"+value);
 if(!phrases.has(id))phrases.set(id,{id,text:value,voiceId:voice,modelId:model,profile,
  pronunciationDictionaryId:policy.production.pronunciationDictionaryId,
  pronunciationDictionaryVersionId:policy.production.pronunciationDictionaryVersionId,
  settingsFingerprint:fingerprint,sourceApproved:false,speechApproved:false,
  audioGenerationAllowed:false,contexts:[]});
 const record=phrases.get(id);
 record.contexts.push({lessonId,age,kind,isDraft:draft});
}
const ageList=["4-5","6-8","9-10"];
const existing=Object.values(context.window.DARKidsAcademyCurriculum);
const editorial=Object.values(context.window.DARKidsAcademyEditorialV31);
assert.equal(existing.length,65);assert.equal(editorial.length,142);
let legacyOpen=0,convertedDraft=0;
for(const [lessons,isDraft] of [[existing,false],[editorial,true]])for(const lesson of lessons){
 add(lesson.lead,lesson.id,"all","lead",isDraft);
 add(lesson.goal,lesson.id,"all","goal",isDraft);
 add(lesson.hadith?.text,lesson.id,"all","hadith-paraphrase",isDraft);
 for(const age of ageList){
  const ageText=lesson.ageText?.[age];
  if(ageText){add(ageText.intro,lesson.id,age,"intro",isDraft);
   for(const line of ageText.lines||[])add(line,lesson.id,age,"lesson",isDraft);
   add(ageText.evidence,lesson.id,age,"source-explanation",isDraft);}
  for(const q of lesson.questions?.[age]||[]){
   if(q.type==="text"){legacyOpen++;continue;}
   if(q.editorialReviewStatus==="pending-human-review")convertedDraft++;
   add(q.prompt,lesson.id,age,"question",isDraft);
   for(const option of q.options||[])add(option,lesson.id,age,"answer-option",isDraft);
   add(q.explain,lesson.id,age,"feedback",isDraft);
  }
 }
}
assert.equal(legacyOpen,195);
assert.equal(convertedDraft,426);
function existsCertifiedV4(entry){
 if(!entry||entry.modelId!==model||entry.voiceId!==voice||
    entry.voiceProfileId!==policy.voiceIdentity.voiceProfileId||
    entry.voiceSettingsProfile!==profile||!entry.url||
    !/^[a-f0-9]{64}$/.test(entry.sha256||""))return false;
 const pathName=String(entry.url).split("?")[0].replace(/^\/+/, "");
 if(!pathName.startsWith("kids/assets/kids-academy-audio/")||pathName.includes(".."))return false;
 const full=path.join(root,pathName);if(!fs.existsSync(full))return false;
 return crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex")===entry.sha256;
}
const manifestPaths=["kids/data/academy-audio.json",
 "kids/data/academy-audio-staging-v9.json",
 "kids/data/academy-audio-staging-v9-expansion.json",
 "kids/data/academy-audio-staging-sidq-v18.json"];
const manifests=manifestPaths.filter(p=>fs.existsSync(path.join(root,p))).map(p=>({path:p,data:json(p)}));
let validStaged=0,validApproved=0;
const result=[...phrases.values()];
for(const row of result){
 for(const manifest of manifests){
  const entry=manifest.data.entries?.[row.text];
  if(!existsCertifiedV4(entry))continue;
  if(entry.approvedForPlayback===true&&!manifest.data.stagingOnly){
   row.alreadyAvailable="verified-public-v4";validApproved++;break;
  }
  row.existingTechnicalAsset=entry.url;validStaged++;
 }
}
const report={schemaVersion:1,kind:"KIDS_ACADEMY_208_V4_DEDUP_REVIEW_QUEUE",
 status:"NEVER_GENERATE_UNAPPROVED",existingLessons:65,newDraftLessons:142,
 totalLessonsInCurriculum:207,plusInlineSidq:1,
 draftChoicesPendingHumanReview:convertedDraft,
 existingOpenQuestionsStillAdaptedInUI:legacyOpen,
 candidateUniqueSpeechTexts:result.length,
 voiceId:voice,modelId:model,profile,settingsFingerprint:fingerprint,
 totalVerifiedPublicV4Entries:validApproved,totalTechnicalStagingMatches:validStaged,
 generatedAudioFiles:0,spentCredits:0,
 quranRecitationPolicy:"HUMAN_QARI_ONLY",allowMassGeneration:false,
 phrases:result};
if(process.argv[2]){
 const dest=path.resolve(process.argv[2]);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("PREPARED: "+result.length+" deduplicated V4 phrases for 207 modular + 1 inline Sidq lesson.");
console.log("REUSE: "+validApproved+" verified public V4, "+validStaged+" matching technical staging assets.");
console.log("GATED: 426 editorial button choices; 195 legacy UI conversions still require human content review.");
console.log("0 audio calls / 0 credits / no synthesized Quran.");
