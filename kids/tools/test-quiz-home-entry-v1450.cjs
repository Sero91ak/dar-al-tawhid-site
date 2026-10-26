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
for(const token of ['id="openQuizButton"','id="quizModal"','/kids/quiz-library.js?v=20261026-premium1','/kids/quiz-library.css?v=20261026-premium1','/kids/sw.js?v=1457']){
  assert.ok(entry.includes(token),"Missing Kids shell token: "+token);
}
const premiumCss=read("kids/quiz-premium-v1.css");
const approvedPlayer=read("kids/quiz-v4-approved-player.js");
assert.ok(entry.includes("/kids/quiz-premium-v1.css?v=20261026-premium1"),"Premium UI style must load in each Kids shell");
assert.ok(entry.includes("/kids/quiz-v4-approved-player.js?v=20261026-v1"),"Exact V4 player must load into Kids");
assert.ok(entry.includes('quizPart:"question"')&&entry.includes('quizPart:"correct"')&&entry.includes('quizPart:"retry"')&&entry.includes('quizPart:"explanation"'),"Exact four V4 audio segments required");
assert.ok(premiumCss.includes('[data-quiz-persona="girl"]')&&premiumCss.includes('[data-quiz-persona="boy"]'),"Boys/girls palette must both exist");
assert.ok(premiumCss.includes("prefers-reduced-motion"),"Respect reduced motion");
assert.ok(premiumCss.includes("env(safe-area-inset-bottom"),"Native notch/hinge safe area required");
assert.ok(premiumCss.includes("minmax(0,1fr)"),"Responsive grid should not overflow narrow screens");
assert.ok(approvedPlayer.includes("humanListeningApproved!==true")&&approvedPlayer.includes("releaseEnabled!==true"),"Unheard V4 audio must fail closed");
assert.ok(!read("kids/quiz-library.js").includes("var QUIZ_PACK_900="),"The 450 unpublished reserve is not visible");
assert.ok(entry.includes("Quiz-Lernwelt")&&entry.includes("450 Fragen · neue Lernwelt"),"Visitor home must visibly expose new 450-question quiz entry");
const sw=read("kids/sw.js");
const version=JSON.parse(read("kids/version.json"));
assert.ok(sw.includes('dar-al-tawhid-kids-v1457'));
assert.equal(version.visualSystem.serviceWorkerCache,"v1457");
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
console.log("PASS: Kids 3 shells equal, SW v1457, 450 question bundle, click and iOS pointerup Back");

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

