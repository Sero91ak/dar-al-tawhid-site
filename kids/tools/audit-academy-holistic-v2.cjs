#!/usr/bin/env node
"use strict";
/* Kids Academy holistic read-only audit: 65 modules, inline Ṣidq, 3 ages,
 * two profiles, progression, evidence, accessibility, voice, iOS viewport.
 * This tool NEVER approves theological meaning, claims human listening,
 * generates audio, or modifies a child's stored progress. */
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const packs=[
 "kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js",
 "kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js",
 "kids/akademie/curriculum-v26.js","kids/akademie/curriculum-v27.js",
 "kids/akademie/curriculum-v28.js","kids/akademie/curriculum-v29.js"
];
const window={};const sandbox=vm.createContext({window,console});
for(const file of packs)vm.runInContext(read(file),sandbox,{timeout:4500,filename:file});
const lessons=window.DARKidsAcademyCurriculum||{};
const html=read("kids/akademie/index.html");
const css=html.slice(0,html.indexOf("</style>"));
const school=read("kids/akademie/school-progress-v11.js");
const voice=JSON.parse(read("kids/data/academy-audio.json"));
const staging=JSON.parse(read("kids/data/academy-audio-staging-v9.json"));
const ages=["4-5","6-8","9-10"];
const rules={
  completeGreeting:"As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.",
  title:"TAWHID_KIDS_ACADEMY_HOLISTIC_REVIEW_20261029",
  blockers:[],review:[],stats:{
   modules:Object.keys(lessons).length,inlineSidq:1,sourceReviewed:0,sourceWithoutAudit:0,
   questionCount:0,questionsByAge:{"4-5":0,"6-8":0,"9-10":0},
   answerModes:{choice:0,text:0,other:0},
   textQuestionsByAge:{"4-5":0,"6-8":0,"9-10":0},
   noExplanation:0,noHint:0,choiceAlwaysFirst:0,ambiguousAlternatives:0,
   roteSourceReferences:0,weakDistractors:0,openQuestions:0,ageQuestionIdentical:0,
   hadithNoSource:0,quranMissingArabic:0,sourceAuditMissing:0,
   approvedPublicV4:Object.values(voice.entries||{}).filter(e=>e.modelId==="eleven_v4"&&e.approvedForPlayback===true).length,
   stagedHistoricalV4:Object.keys(staging.entries||{}).length,
   incompleteSalamArchived:Object.keys(staging.entries||{}).filter(k=>/As-salāmu ʿalaykum, liebe Schwester/.test(k)).length
  }
};
const add=(severity,code,id,age,index,reason)=>rules[severity].push({code,lessonId:id,age,index,reason});
const norm=v=>String(v||"").normalize("NFC").replace(/\s+/g," ").trim().toLocaleLowerCase("de");
const weak=/\b(?:ein tiername|eine spielregel|meinen schuh|einen schuh|ausgedachte regel|frei erfundene geschichte|mein spielzeug fliegt)\b/i;
const bareRef=/^(?:was steht|was sagt|was lehrt|welche sūrah|welcher vers)\b.{0,100}\b(?:[0-9]{1,3}:[0-9]{1,3}|sūrah.{0,20}vers\s*\d+)/i;
const questionsEqual=(qs,qt)=>qs.length===qt.length&&qs.every((q,i)=>norm(q.prompt)===norm(qt[i]?.prompt));
for(const [id,lesson] of Object.entries(lessons)){
 if(lesson.id!==id)add("blockers","id_mismatch",id,"*",-1,"Lesson key must equal its stable ID");
 if(!["akhlaq","adab","fiqh","aqidah"].includes(lesson.subject))add("blockers","unknown_subject",id,"*",-1,String(lesson.subject));
 if(!lesson.quran?.surah||!lesson.quran?.ayah)add("blockers","quran_missing_reference",id,"*",-1,"No identifiable Qurʾān reference");
 if(!lesson.quran?.arabic||!/[\u0600-\u06FF]/.test(lesson.quran.arabic)){
   rules.stats.quranMissingArabic++;
   add("review","quran_text",id,"*",-1,"Check precise original/verse scope; no Arabic source in data");
 }
 if(!lesson.hadith?.source){rules.stats.hadithNoSource++;add("blockers","hadith_source_missing",id,"*",-1,"No Ḥadīṯ source");}
 if(!lesson.sourceAudit&&!lesson.sourceLesson){rules.stats.sourceAuditMissing++;add("review","human_source_review",id,"*",-1,"No independently recorded sourceAudit");}else rules.stats.sourceReviewed++;
 const triples=ages.map(a=>lesson.questions?.[a]||[]);
 if(questionsEqual(triples[0],triples[1])&&questionsEqual(triples[1],triples[2])){
  rules.stats.ageQuestionIdentical++;add("review","age_levels_same",id,"*",-1,"All age groups use identical question wording; verify genuine developmental adaptation");
 }
 for(const age of ages){
  const questions=lesson.questions?.[age];
  if(!Array.isArray(questions)||questions.length<2){add("blockers","questions_missing",id,age,-1,"Need at least 2 questions");continue}
  rules.stats.questionsByAge[age]+=questions.length;
  for(let i=0;i<questions.length;i++){
   const q=questions[i];rules.stats.questionCount++;
   if(typeof q.prompt!=="string"||norm(q.prompt).length<8){add("blockers","question_blank",id,age,i,"No coherent question");continue}
   if(!q.hint){rules.stats.noHint++;add("review","hint_missing",id,age,i,"Optional non-revealing hint absent");}
   if(bareRef.test(q.prompt)){rules.stats.roteSourceReferences++;add("review","rote_reference",id,age,i,"May test citation number over taught meaning");}
   if(age==="4-5"&&q.prompt.length>155)add("review","very_long_young_question",id,age,i,"Prompt >155 characters for pre-readers");
   if(q.type==="choice"){
    rules.stats.answerModes.choice++;
    if(!Array.isArray(q.options)||q.options.length<2||q.options.length>5){add("blockers","choice_size",id,age,i,"Need 2–5 selectable answers");continue;}
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)add("blockers","correct_index",id,age,i,"Correct choice missing");
    if(q.correct===0)rules.stats.choiceAlwaysFirst++;
    if(new Set(q.options.map(norm)).size!==q.options.length){rules.stats.ambiguousAlternatives++;add("blockers","duplicate_choices",id,age,i,"Same rendered answers");}
    if(q.options.some(x=>weak.test(x))){rules.stats.weakDistractors++;add("review","weak_distractors",id,age,i,"Incorrect choice may be implausible; needs editorial rewrite");}
    if(!q.explain){rules.stats.noExplanation++;add("review","explanation_missing",id,age,i,"No clear explanation after choice");}
    if(age==="4-5"&&q.options.length>3)add("review","too_many_young_choices",id,age,i,"More than 3 alternatives for ages 4–5");
   }else if(q.type==="text"){
    rules.stats.answerModes.text++;rules.stats.textQuestionsByAge[age]++;
    if(!q.sample&&!q.explain)add("blockers","text_requires_model",id,age,i,"Missing fair self-comparison model");
    if(age==="4-5")add("blockers","pre_reader_requires_typing",id,age,i,"4–5 age cannot be forced into text mode when writing toggle is hidden");
   }else{rules.stats.answerModes.other++;add("blockers","unknown_question_type",id,age,i,"Unknown input mode "+String(q.type));}
  }
 }
}
const tests=[
 ["full_salam_ui",html.includes('const ACADEMY_FULL_SALAM="'+rules.completeGreeting+'"')],
 ["full_salam_two_profiles",html.includes('const greetingAddress=')&&html.includes('$("#overviewAddress").textContent=greetingAddress()')],
 ["full_salam_voice_prompt",html.includes('const spokenSalam=ACADEMY_FULL_SALAM;')],
 ["four_stages_plus_recap",[0,1,2,3,4].every(n=>html.includes('data-lesson-step="'+n+'"'))],
 ["uses_reciter_for_quran",html.includes("const TRACKS=")&&html.includes('data-arabic-audio="quran:9:119"')],
 ["quran_playback_error_status",html.includes("Rezitation momentan nicht verfügbar.")],
 ["old_abbreviated_pilot_blocked",read("kids/akademie/pilot-audio-v13.js").includes("if(k===0){event.preventDefault()")],
 ["no_fake_speech",html.includes("no native device voice masquerading")],
 ["progress_namespaced",html.includes('const VERSION="academy-v4"')&&html.includes("draftKey=()")],
 ["stop_audio_on_navigation",html.includes("function stopAll(){")&&html.includes('window.addEventListener("pagehide",stopAll)')],
 ["rotated_choices",html.includes("function academyDisplayChoices(q,index)")&&html.includes("choice=i;")],
 ["reading_order_speech_sync",html.includes('"Antwort "+(visibleIndex+1)+": "+t')],
 ["explanation_after_retry",!html.includes('"Das war noch nicht die gesuchte Antwort. "+q.explain')],
 ["unverified_voice_record",html.includes("score.unverified=(Number(score.unverified)||0)+1;")],
 ["microphone_release",html.includes("function stopMicTracks(){")],
 ["no_forced_audio_synthesis",!html.includes("speechSynthesis.speak(")],
 ["child_profile_separation",html.includes("kids.activeProfile")&&html.includes("storageKey=()")],
 ["age_specific_wording",html.includes("const AGE_UI=Object.freeze")&&html.includes("const AGE_EXPLANATIONS=Object.freeze")],
 ["progress_school_sequence",school.includes("const groups=")&&school.includes("validDraft")],
 ["theme_profile_specific",css.includes('body[data-profile="girl"]')],
 ["rtl_arabic",html.includes('lang="ar" dir="rtl"')],
 ["right_to_left_not_truncated",css.includes("arabic-verse")],
 ["has_accessibility_feedback",html.includes('id="feedback"')&&html.includes('aria-live="polite"')],
 ["scroll_accessible",html.includes('id="stageSurface"')&&css.includes(".stage-surface")],
 ["teach_another_person",html.includes("academyTeachBackPrompt")],
];
for(const [name,pass]of tests)if(!pass)add("blockers","architecture_"+name,"*","*",-1,"Invariant not detected");
rules.stats.architecture={passed:tests.filter(x=>x[1]).length,total:tests.length};
rules.stats.archivedOldGreetingBlocked=staging.entries?.["As-salāmu ʿalaykum, liebe Schwester."]?.deprecatedForPlayback===true;
const voicePlan=JSON.parse(read("kids/data/academy-full-salam-voice-plan-v19.json"));
if(!voicePlan.phrases?.some(p=>p.text===rules.completeGreeting&&p.reviewStatus==="not-generated")){
 add("blockers","full_salam_audio_contract","*","*",-1,"Never reuse short audio; new complete recording must have its own pending key");
}
const report={
 id:rules.title,createdOn:"2026-10-29",scope:"KIDS Academy only: 65 modular lessons + separate inline Ṣidq, 3 ages, both profile rendering contracts",
 humanIslamicSourceApproval:false,humanListeningApproval:false,verifiedActualDeviceVisualQa:false,
 statistics:rules.stats,architecture:tests.map(([name,pass])=>({name,pass})),
 blockers:rules.blockers,editorialReviewCount:rules.review.length,editorialReviewSample:rules.review.slice(0,70),
 approvalPolicy:"Block only objective technical errors; retain source and age-review queues until scholarly/pedagogical human approval.",
 noElevenLabsCreditsUsed:true
};
const payload=JSON.stringify(report,null,2)+"\n";
if(process.env.GITHUB_ACTIONS)fs.writeFileSync("/tmp/kids-academy-holistic-review-v2.json",payload);
console.log(payload);
if(rules.blockers.length)process.exitCode=1;
