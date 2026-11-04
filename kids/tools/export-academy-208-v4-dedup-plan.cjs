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
 settings:policy.production.voiceSettings,languageCode:"de",
 pronunciationDictionaryLocators:[] /* German and Arabic remain isolated. */}));
const normalize=s=>String(s||"").normalize("NFC").replace(/\s+/g," ").trim();
const phrases=new Map(),mixedArabicBlocked=[];
const arabic=/[\\u0600-\\u06ff\\u0750-\\u077f\\u08a0-\\u08ff\\ufb50-\\ufdff\\ufe70-\\ufeff]/;
const loanTerms=/(?:Qurʾān|Fuṣḥā|Tawḥīd|Īmān|Iḥsān|Ḥadīṯ|Ṣalāh|Ṣadaqah|Ramaḍān|Duʿāʾ|Wuḍūʾ|Zakāh|Ṣaḥābah|Sūrah|Sūrat|Allāhumma|Allāh|ʿUṯmān|ʿĀʾišah|Abū|Allah)/giu;
const germanNur=/(?:^|[^\\p{L}])nur(?=$|[^\\p{L}])/iu;
function add(text,lessonId,age,kind,draft){
 const value=normalize(text);if(!value)return;
 // Never synthesize Arabic Quran. Only human Qari recitation may supply that asset.
 if(arabic.test(value)){
  mixedArabicBlocked.push({lessonId,age,kind,isDraft:draft,text:value,
   reason:"mixed-Arabic-needs-Fusha-language-isolation-and-human-review"});
  return;
 }
 const id=hash(fingerprint+"|"+value);
 if(!phrases.has(id))phrases.set(id,{id,text:value,voiceId:voice,modelId:model,profile,
  pronunciationDictionaryLocators:[],globalArabicDictionaryApplied:false,
  languageCode:"de",settingsFingerprint:fingerprint,sourceApproved:false,speechApproved:false,
  pronunciationReviewFlags:[...new Set([...value.matchAll(loanTerms)].map(m=>m[0]))],
  germanNurCollisionWatch:germanNur.test(value),
  audioGenerationAllowed:false,contexts:[]});
 const record=phrases.get(id);
 record.contexts.push({lessonId,age,kind,isDraft:draft});
}
function selectable(q,lesson,age){
 if(q.type==="choice")return q;
 const correct=String(q.sample||q.explain||lesson?.sample||lesson?.goal||"").trim();
 const pool=[age,"4-5","6-8","9-10"].flatMap(a=>
  (lesson?.questions?.[a]||[]).filter(item=>item.type==="choice"&&Array.isArray(item.options))
   .flatMap(item=>item.options.filter((_,i)=>i!==item.correct)));
 const wrong=pool.map(String).find(t=>t.trim()&&t.trim()!==correct)||
  "Es ist richtig, absichtlich das Gegenteil des Gelernten zu tun.";
 const older=/^Erkläre\b/i.test(q.prompt);
 let prompt=older?"Wähle die passende Erklärung: "+String(q.prompt)
  .replace(/^Erkläre(?:\s+(?:mit|in)\s+(?:deinen|eigenen)\s+Worten)?\s*[:,]?\s*/i,""):q.prompt;
 let optionCorrect=correct,optionWrong=wrong;
 if(correct.length>180&&lesson?.quran?.meaning){
  const verse=String(lesson.quran.meaning).trim();
  if(verse&&verse.length<=180){
   const hadith=String(lesson.hadith?.text||"").trim();
   optionCorrect=verse;
   optionWrong=(hadith&&hadith!==verse&&hadith.length<=180)?hadith:
     "Das Alltagsbeispiel ist selbst der genaue Wortlaut des Qurʾān-Verses.";
   prompt="Welche Aussage gibt die Bedeutung von Qurʾān "+lesson.quran.surah+
     ":"+lesson.quran.ayah+" wieder?";
  }
 }
 return {...q,type:"choice",prompt,options:[optionCorrect,optionWrong],correct:0,
  explain:q.explain||correct,adaptedFromText:true};
}
function display(q,index,scope){
 const options=q.options||[],n=options.length,items=options.map((text,i)=>({text,originalIndex:i}));
 if(n<2)return items;
 const seed=String(scope)+":"+String(q.prompt||"");
 let h=2166136261;
 for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}
 const start=((h>>>0)+index)%n;
 return items.slice(start).concat(items.slice(0,start));
}
const ageList=["4-5","6-8","9-10"];
const existing=Object.values(context.window.DARKidsAcademyCurriculum);
const editorial=Object.values(context.window.DARKidsAcademyEditorialV31);
assert.equal(existing.length,65);assert.equal(editorial.length,142);
let legacyOpen=0,convertedDraft=0,questionsPrepared=0;
for(const [lessons,isDraft] of [[existing,false],[editorial,true]])for(const lesson of lessons){
 add(lesson.lead,lesson.id,"all","lead",isDraft);
 add(lesson.goal,lesson.id,"all","goal",isDraft);
 add(lesson.hadith?.text,lesson.id,"all","hadith-paraphrase",isDraft);
 for(const age of ageList){
  const ageText=lesson.ageText?.[age];
  if(ageText){add(ageText.intro,lesson.id,age,"intro",isDraft);
   for(const line of ageText.lines||[])add(line,lesson.id,age,"lesson",isDraft);
   add(ageText.evidence,lesson.id,age,"source-explanation",isDraft);}
  for(const [questionIndex,q] of (lesson.questions?.[age]||[]).entries()){
   if(q.type==="text")legacyOpen++;
   if(q.editorialReviewStatus==="pending-human-review")convertedDraft++;
   const ready=selectable(q,lesson,age);questionsPrepared++;
   add(ready.prompt,lesson.id,age,"question",isDraft);
   for(const [idx,option] of display(ready,questionIndex,lesson.id+":"+age).entries())
    add("Antwort "+(idx+1)+": "+option.text,lesson.id,age,"answer-option",isDraft);
   add(ready.explain,lesson.id,age,"feedback",isDraft);
  }
 }
}
/* 8 inline Sidq questions: the first of 208 lessons, unchanged in the public app. */
const page=read("kids/akademie/index.html"),begin=page.indexOf("const exercises={");
const finish=page.indexOf("\nlet id=",begin);
assert(begin>0&&finish>begin,"Cannot parse Sidq question block");
vm.runInContext(page.slice(begin,finish)+"\nglobalThis.sidq=exercises;",context,{timeout:3500});
for(const age of ageList){
 for(const [i,q] of context.sidq[age].entries()){
  questionsPrepared++;const ready=selectable(q,null,age);
  add(ready.prompt,"sidq",age,"question",false);
  for(const [j,option] of display(ready,i,"sidq:"+age).entries())
   add("Antwort "+(j+1)+": "+option.text,"sidq",age,"answer-option",false);
  add(ready.explain,"sidq",age,"feedback",false);
 }
}
assert.equal(questionsPrepared,1664);
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
 totalLessonsInCurriculum:207,plusInlineSidq:1,questionsPrepared,
 draftChoicesPendingHumanReview:convertedDraft,
 existingOpenQuestionsStillAdaptedInUI:legacyOpen,
 candidateUniqueSpeechTexts:result.length,
 voiceId:voice,modelId:model,profile,settingsFingerprint:fingerprint,
 totalVerifiedPublicV4Entries:validApproved,totalTechnicalStagingMatches:validStaged,
 generatedAudioFiles:0,spentCredits:0,
 mixedArabicSegmentsBlocked:mixedArabicBlocked.length,mixedArabicReview:mixedArabicBlocked,
 germanNurWatchPhrases:result.filter(p=>p.germanNurCollisionWatch).length,
 fushaRomanizedReviewPhrases:result.filter(p=>p.pronunciationReviewFlags.length>0).length,
 forcedGermanLanguageCode:"de",effectiveDictionaryLocators:[],
 priorArabicDictionaryPolicyReferenceOnly:policy.production.pronunciationDictionaryId,
 crossLanguageDictionaryApplied:false,
 quranRecitationPolicy:"HUMAN_QARI_ONLY",allowMassGeneration:false,
 phrases:result};
if(process.argv[2]){
 const dest=path.resolve(process.argv[2]);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("PREPARED: "+result.length+" deduplicated V4 phrases for all "+questionsPrepared+" questions in 208 lessons.");
console.log("REUSE: "+validApproved+" verified public V4, "+validStaged+" matching technical staging assets.");
console.log("GATED: 426 editorial button choices; 195 legacy UI conversions still require human content review.");
console.log("Language safety: "+mixedArabicBlocked.length+" mixed-script phrases blocked from the voice queue.");
console.log("Fuṣḥā listening review: "+report.fushaRomanizedReviewPhrases+" romanized-loan phrases; German nur QA: "+report.germanNurWatchPhrases+".");
console.log("Synthesis policy: language_code=de, empty dictionary locators; no cross-language Arabic PLS.");
console.log("0 audio calls / 0 credits / no synthesized Quran.");
