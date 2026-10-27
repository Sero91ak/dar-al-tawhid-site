#!/usr/bin/env node
"use strict";
/* KIDS Quiz V1450: check home tile entry, PWA parity and age-separated catalog */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root=process.cwd();
const read=p=>fs.readFileSync(root+"/"+p,"utf8");
const entry=read("kids/index.html");
assert.equal(entry,read("kids/start.html"),"Kids start shell mismatch");
assert.equal(entry,read("kids/shell.html"),"Kids shell mismatch");
for(const token of ['id="openQuizButton"','id="quizModal"','/kids/quiz-library.js?v=20261026-premium1','/kids/quiz-library.css?v=20261026-premium1','/kids/sw.js?v=1466']){
  assert.ok(entry.includes(token),"Missing Kids shell token: "+token);
}
// Kids must display the age-appropriate new praise/encouragement even if
// public audio is correctly blocked pending the actual Fuṣḥā listening QA.
assert.ok(entry.includes('quizV4SpokenText(q,"correct",quizAcademyPraiseText(q))'),
  "Correct answer must never prefer old generic praise over age-specific speech text");
assert.ok(entry.includes('quizV4SpokenText(q,"retry",quizAcademyRetryText(q))'),
  "Wrong answer must display age-specific encouragement rather than old generic copy");
assert.ok(!entry.includes('quizV4SpokenText(q,"correct",q.success||'),
  "The obsolete praise fallback must be absent");
const previewPlayerSource=read("kids/quiz-v4-test-preview.js");
assert.ok(previewPlayerSource.includes("kidsV4FourParts"),"The real V4 test player needs touch-triggered audio for all four parts");
assert.ok(previewPlayerSource.includes("kidsV4AgeSelect"),"The 450 V4 clips must be auditionable in all age groups");
assert.ok(previewPlayerSource.includes("activeClip="),"Real V4 audio playback state must be visible to children and testers");
assert.ok(entry.includes("playback=20261027-v4"),"PWA must request the new spoken V4 playback script");
const premiumCss=read("kids/quiz-premium-v1.css");
const approvedPlayer=read("kids/quiz-v4-approved-player.js");
assert.ok(entry.includes("/kids/quiz-premium-v1.css?v=20261026-premium1"),"Premium UI style must load in each Kids shell");
assert.ok(entry.includes("/kids/quiz-v4-approved-player.js?v=20261026-v1"),"Exact V4 player must load into Kids");
assert.ok(entry.includes('quizPart:"question"')&&entry.includes('quizPart:"correct"')&&entry.includes('quizPart:"retry"')&&entry.includes('quizPart:"explanation"'),"Exact four V4 audio segments required");
assert.ok(premiumCss.includes('[data-quiz-persona="girl"]')&&premiumCss.includes('[data-quiz-persona="boy"]'),"Boys/girls palette must both exist");
assert.ok(premiumCss.includes("KIDS_QUIZ_RESPONSIVE_SEGMENTS_V2_20261027"),"Responsive V2 quiz release must be present");
assert.ok(premiumCss.includes("KIDS_QUIZ_LESSON_PRESENTATION_V1"),"Labeled explanation lesson must be visible on all device sizes");
assert.ok(entry.includes('class="quiz-explanation quiz-lesson-card"'),"Full explanation card must exist in each Kids shell");
assert.ok(entry.includes("quizExplanationAudioStatus"),"Text explanation and audio QA status must be separated");
assert.ok(entry.includes("refreshQuizPraiseAudioState"),"The V4 praise replay control must update after late audio readiness");
assert.ok(entry.includes("quiz-praise-replay"),"The child needs a user-initiated V4 praise replay button");
assert.ok(entry.includes("refreshQuizRetryAudioState"),"Wrong answers must expose V4 retry replay for iOS user gesture");
assert.ok(entry.includes("quiz-retry-replay"),"V4 encouragement replay control must exist in main quiz");
assert.ok(read("kids/quiz-library.js").includes("quiz-local-audio-replay"),"Fallback Quiz must offer V4 touch replays");
assert.ok(premiumCss.includes("KIDS_QUIZ_V4_AUDIO_REPLAY_V1462"),"Kids audio replay responsive touch styling must be loaded");
assert.ok(read("kids/quiz-library.js").includes("quiz-v4-release-status"),"User must see the correct V4 voice status");
assert.ok(premiumCss.includes("horizontal-viewport-segments:2"),"Fold viewport segment gutter required");
assert.ok(premiumCss.includes("quiz-dashboard-mode .quiz-learning-dashboard.show"),"iPad dashboard master-detail required");
assert.ok(premiumCss.includes("max-width:759px"),"Compact cover-screen layout required");
assert.ok(premiumCss.includes("env(safe-area-inset-left"),"Notch padding required");
assert.ok(premiumCss.includes("prefers-reduced-motion"),"Respect reduced motion");
assert.ok(premiumCss.includes("env(safe-area-inset-bottom"),"Native notch/hinge safe area required");
assert.ok(premiumCss.includes("minmax(0,1fr)"),"Responsive grid should not overflow narrow screens");
assert.ok(approvedPlayer.includes("humanListeningApproved!==true")&&approvedPlayer.includes("releaseEnabled!==true"),"Unheard V4 audio must fail closed");
assert.ok(!read("kids/quiz-library.js").includes("var QUIZ_PACK_900="),"The 450 unpublished reserve is not visible");
assert.ok(entry.includes("Quiz-Lernwelt")&&entry.includes("450 Fragen · neue Lernwelt"),"Visitor home must visibly expose new 450-question quiz entry");
assert.ok(entry.includes("/kids/quiz-v4-test-preview.js?v=20261026-audition1&recovery=20261027-v1"),"Kids visitor code must include host-isolated Test MP3 preview");
const sw=read("kids/sw.js");
const version=JSON.parse(read("kids/version.json"));
assert.ok(sw.includes('dar-al-tawhid-kids-v1466'));
assert.equal(version.visualSystem.serviceWorkerCache,"v1466");
assert.ok(sw.includes('/kids/quiz-library.js?v=20261026-premium1'));
assert.ok(sw.includes('url.pathname==="/kids/quiz-library.js"'));
const originalQuestions=JSON.parse(read("kids/data/quiz-kids.json")).items;
assert.equal(originalQuestions.length,900,"900 canonical question IDs must stay available for editorial work");
const publicData=JSON.parse(read("kids/data/quiz-kids-public-450.json"));
assert.equal(publicData.counts.total,450);
const questions=publicData.items;
const librarySource=read("kids/quiz-library.js");
const bundleMarker="var QUIZ_PACK_450=";
const bundleStart=librarySource.indexOf(bundleMarker);
assert.ok(bundleStart>=0,"Quiz bundle must be independent of the home page inline script");
const jsonStart=bundleStart+bundleMarker.length;
const jsonEnd=librarySource.indexOf(";\n  var storedQuizPool",jsonStart);
assert.ok(jsonEnd>jsonStart,"Bundled Quiz data must be complete");
const embeddedData=JSON.parse(librarySource.slice(jsonStart,jsonEnd));
assert.equal(embeddedData.namespace,"dar-kids-quiz");
assert.equal(embeddedData.items.length,450);
assert.deepEqual(embeddedData.items,questions,"Visitor Quiz bundle must exactly match the curated 450 source");
assert.ok(!entry.includes("const KIDS_QUIZ_PUBLIC_450="),"Never inject 315KB Quiz pack into monolithic visitor inline script");
assert.ok(entry.includes("window.installKidsQuizPack=function(pack)"),"Native quiz rounds must accept external bundle");
assert.ok(entry.includes("var base=window.DARKidsQuizPack450"),"Main shell must consume independent quiz bundle");

assert.equal(new Set(questions.map(q=>q.id)).size,450);
const originalById=new Map(originalQuestions.map(q=>[q.id,q]));
for(const q of questions)assert.deepEqual(q,originalById.get(q.id),"Original question texts and IDs must be preserved");
const publishedIds=new Set(questions.map(q=>q.id));
const reserve=originalQuestions.filter(q=>!publishedIds.has(q.id));
assert.equal(reserve.length,450,"450 reserved IDs must remain out of the Quiz UI");
for(const band of ["4-6","7-8","9-10"])assert.equal(reserve.filter(q=>q.ageBand===band).length,150);
assert.ok(entry.includes("/kids/data/quiz-kids-public-450.json?v=20261026-visitor-recovery"),"Fallback may only fetch the selected 450-question asset");
assert.ok(entry.includes("kidsQuizPool=baseItems;"),"Content Studio must not add quiz questions");
assert.ok(!sw.includes('"/kids/data/quiz-kids.json"'),"900 source must not be in the PWA offline seeds");

assert.equal(questions.length,450);
assert.equal(questions.filter(q=>q.ageBand==="4-6").length,150);
assert.equal(questions.filter(q=>q.ageBand==="7-8").length,150);
assert.equal(questions.filter(q=>q.ageBand==="9-10").length,150);
const listeners={};
const modal={
  open:false,
  classList:{
    contains:token=>token==="open"&&modal.open,
    add:(...tokens)=>{if(tokens.includes("open"))modal.open=true},
    remove:(...tokens)=>{if(tokens.includes("open"))modal.open=false}
  },
  setAttribute:()=>{},
  removeAttribute:()=>{}
};
const document={
  readyState:"loading",
  getElementById:id=>id==="quizModal"?modal:null,
  addEventListener:(type,cb,capture)=>{(listeners[type]??=[]).push({cb,capture})}
};
const window={kidsQuizPool:[],addEventListener:()=>{}};
vm.runInNewContext(read("kids/quiz-library.js"),{window,document,console,Promise,setTimeout,clearTimeout,Date},{
  filename:"kids/quiz-library.js"
});
assert.ok(entry.includes("window.fetchKidsQuiz=fetchKidsQuiz"),"Quiz fetch bridge missing");
assert.ok(entry.includes("window.openKidsQuizQuestion=function(q)"),"Question routing missing");
assert.ok(entry.includes("window.quizPrompt=quizPrompt"),"Speech bridge missing");
assert.ok(entry.includes("(window.renderQuizFinish||renderQuizFinish)()"),"End-of-round routing missing");
assert.ok(sw.includes('new URL(request.url).pathname==="/kids/data/quiz-kids-public-450.json"'),"Offline recovery missing");
assert.equal(typeof window.openKidsQuizHub,"function");
assert.equal(listeners.click?.length,2);
const target={closest:sel=>sel==="#openQuizButton"?{}:null};
const ev={
  target,
  prevented:false,
  stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}
};
listeners.click[0].cb(ev);
assert.equal(modal.open,true,"Quiz modal must open immediately before any data fetch");
assert.equal(ev.prevented,true,"Home tile must handle tap independently");
assert.equal(ev.stopped,true,"Legacy duplicate handler must be suppressed");
assert.ok(entry.includes('id="quizGlobalBack"'),"Quiz must expose a visible persistent header back control");
assert.ok(entry.includes('data-close="quiz" aria-label="Quiz schließen"'),"Quiz must expose an accessible Close control");
assert.ok(sw.includes("/kids/quiz-library.js?v=20261026-premium1"),"PWA must use fresh navigation code");
const backEvent={
  target:{closest:selector=>selector==="#quizGlobalBack"?{}:null},
  prevented:false,stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}
};
assert.equal(modal.open,true,"Home click opened quiz before testing header back");
listeners.click[1].cb(backEvent);
assert.equal(modal.open,false,"Back in dashboard must return child to home");
assert.equal(backEvent.prevented,true);
assert.equal(backEvent.stopped,true);
modal.classList.add("open");
const closeEvent={
  target:{closest:selector=>selector==='#quizModal [data-close="quiz"]'?{}:null},
  prevented:false,stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}
};
listeners.click[1].cb(closeEvent);
assert.equal(modal.open,false,"Quiz close must work independently of legacy inline click listeners");
assert.equal(closeEvent.prevented,true);
assert.equal(closeEvent.stopped,true);


assert.equal(window.kidsQuizPool.length,450,"Bundled Quiz must be published independently of main script");
assert.equal(window.kidsQuizPool.filter(q=>q.ageBand==="7-8").length,150);
assert.equal(listeners.pointerup?.length,1,"iOS pointerup navigation must be independently registered");
modal.classList.add("open");
const touchBackEvent={
  type:"pointerup",
  target:{closest:selector=>selector==="#quizGlobalBack"?{}:null},
  prevented:false,stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}
};
listeners.pointerup[0].cb(touchBackEvent);
assert.equal(modal.open,false,"iOS pointerup Back must close the quiz dashboard");
assert.equal(touchBackEvent.prevented,true);
console.log("PASS: Kids 3 shells equal, SW v1462, 450 question bundle, click and iOS pointerup Back");

// Simulate the real production quiz loader with all network requests blocked.
// The embedded pack alone must populate all 450 selectable child questions.
async function validateOfflineQuizLoader(){
  const start=entry.indexOf("var kidsQuizFetchPending=null;");
  const end=entry.indexOf("// All functions below live in this IIFE",start);
  assert.ok(start>=0&&end>start,"Real quiz loading function must exist");
  let networkCalls=0;
  const win={dispatchEvent(){},DARKidsQuizPack450:embeddedData};
  const dom={getElementById(){return null}};
  const vmContext={
    window:win,document:dom,Promise,JSON,console,
    CustomEvent:function(name,params){this.type=name;this.detail=params&&params.detail},
    fetch(){networkCalls++;throw new Error("No network available in quiz player smoke test")}
  };
  vm.runInNewContext(
    "var kidsQuizPool=[]; var kidsQuizLoaded=false; var kidsQuizArtwork={}; var kidsQuizTopicArtwork={};\n"+
    entry.slice(start,end),vmContext,{filename:"inline-quiz-player.js"});
  const loaded=await vmContext.fetchKidsQuiz(false);
  assert.equal(networkCalls,0,"Quiz must not request an external data URL to show questions");
  assert.equal(loaded.length,450,"Real Quiz player must load all 450 questions from shell");
  assert.equal(win.kidsQuizPool.length,450,"Dashboard must receive the loaded pool");
  for(const band of ["4-6","7-8","9-10"])
    assert.equal(loaded.filter(q=>q.ageBand===band).length,150);
  console.log("PASS: actual Kids Quiz loader shows 150/150/150 questions with network disabled");
}
validateOfflineQuizLoader().catch(err=>{console.error(err);process.exitCode=1});


// Audition stage must be verified from the actual original 1217 MP3 bytes.
require("node:child_process").execFileSync(process.execPath,["kids/tools/test-v4-test-preview.cjs"],{stdio:"inherit"});


// KIDS_QUIZ_MASTERY_GATE_TEST_V1460: exercise real answer handler with mock DOM.
// Wrong answers must NOT reveal the solution, unlock Next or advance the round.
assert.ok(entry.includes('id="quizNext" class="quiz-next" type="button" disabled aria-disabled="true"'),
  "Quiz Next must start semantically disabled");
assert.ok(entry.includes('if(!quizLocked||currentQuiz[currentQuizIndex]!==q||this.disabled)return;'),
  "Quiz Next click must reject wrong, unanswered or stale questions");
assert.ok(entry.includes('nextQuizButton.disabled=false;nextQuizButton.setAttribute("aria-disabled","false")'),
  "Quiz Next must unlock only after a right answer");
assert.ok(read("kids/quiz-library.js").includes('if(!localAnswered||this.disabled||localRound[localIndex]!==q)return;'),
  "Fallback Quiz must enforce the same gate");
assert.ok(entry.includes('V4_ONLY_20261027') && !entry.includes('quizVoice.preload(quizPrompt(q))'),
  "Legacy Quiz speech preload is not allowed");
assert.ok(premiumCss.includes('KIDS_QUIZ_SMART_FEEDBACK_V1460') &&
  premiumCss.includes('.quiz-answer.correct') &&
  premiumCss.includes('prefers-reduced-motion:reduce'),
  "Profile-aware subtle success glow must remain accessible");

const beginChoice=entry.indexOf("function chooseQuizAnswer(index,button){");
const endChoice=entry.indexOf("function renderQuizFinish(){",beginChoice);
assert.ok(beginChoice>0&&endChoice>beginChoice,"Real quiz response handler is required");
const choiceCode=entry.slice(beginChoice,endChoice);
function testClass(){
  const set=new Set();
  return {add(...keys){keys.forEach(k=>set.add(k))},remove(...keys){keys.forEach(k=>set.delete(k))},
    contains(key){return set.has(key)}};
}
const wrongButton={classList:testClass(),isConnected:true,disabled:false};
const rightButton={classList:testClass(),isConnected:true,disabled:false};
const nextBtn={disabled:true,classList:testClass(),aria:{},setAttribute(k,v){this.aria[k]=v}};
const fb={className:"",textContent:"",replaceChildren(...children){this.children=children}};
const explain={classList:testClass()};
const explanationCopy={textContent:""};
const entries={quizFeedback:fb,quizExplanation:explain,quizExplanationText:explanationCopy,
  quizNext:nextBtn,quizTermLearning:null,quizSource:null,quizExplanationAudioStatus:null};
const simpleQuestion={id:"kids-quiz-001",ageBand:"4-6",source:"Qurʾān 1:5",
  question:"Wen beten wir an?",explanation:"Wir dienen Allah allein.",
  success:"Richtig. Sehr gut!",retry:"Versuche es noch einmal.",
  answers:[{label:"Allah allein",correct:true},{label:"Menschen",correct:false}]};
let recordedMistakes=0,recordedSuccess=0;
const ctx={
  currentQuiz:[simpleQuestion],currentQuizIndex:0,
  quizLocked:false,quizCorrectCount:0,quizQuestionHadError:false,
  document:{
    querySelectorAll(sel){assert.equal(sel,"#quizAnswers .quiz-answer");return [rightButton,wrongButton]},
    getElementById(id){return entries[id]||null},
    createElement(){return {className:"",textContent:""}}
  },
  window:{DARKidsQuizV4Approved:{has(){return false}}},
  quizRewardBurst(){},quizAcademyPraiseText(){return "Richtig!"},
  quizAcademyRetryText(){return "Versuch es noch einmal."},
  quizV4SpokenText(q,p,fallback){return fallback},
  quizV4Text(q,p,fallback){return fallback},
  refreshQuizPraiseAudioState(){},
  refreshQuizRetryAudioState(){},
  refreshQuizExplanationAudioState(){},
  recordQuizMistake(){recordedMistakes++},
  recordQuizAttempt(){recordedSuccess++},
  quizSpeak(){return false},
  setTimeout(){},
  console
};
vm.runInNewContext(choiceCode+";this.chooseQuizAnswer=chooseQuizAnswer;",ctx);
ctx.chooseQuizAnswer(1,wrongButton);
assert.equal(ctx.quizLocked,false,"Wrong answer must not complete the question");
assert.equal(nextBtn.disabled,true,"Wrong answer must not unlock Next");
assert.equal(recordedMistakes,1);
assert.equal(recordedSuccess,0);
assert.equal(ctx.quizCorrectCount,0);
assert.equal(rightButton.classList.contains("correct"),false,"Never reveal answer on mistake");
ctx.chooseQuizAnswer(0,rightButton);
assert.equal(ctx.quizLocked,true,"Right answer must lock the completed question");
assert.equal(rightButton.disabled,true,"Successful answer must freeze the selection");
assert.equal(wrongButton.disabled,true,"Unselected answers must be frozen after success");
assert.equal(nextBtn.disabled,false,"Only the right answer unlocks Next");
assert.equal(nextBtn.aria["aria-disabled"],"false");
assert.equal(ctx.quizCorrectCount,1);
assert.equal(recordedSuccess,1);
assert.equal(explanationCopy.textContent,simpleQuestion.explanation);
assert.equal(explain.classList.contains("show"),true,"Explanation must be visible after success");
console.log("PASS: wrong answer retries, correct answer unlocks Next, explanation is readable, V4-only speech");
