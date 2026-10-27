#!/usr/bin/env node
"use strict";
/* V1468: real fallback functions are evaluated from the shipped 450 bundle.
 * No browser, external APIs, ElevenLabs credits or destructive writes.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("kids/quiz-library.js","utf8");
const bank=JSON.parse(fs.readFileSync("kids/data/quiz-kids-public-450.json","utf8"));
const css=fs.readFileSync("kids/quiz-premium-v1.css","utf8");
assert.ok(css.includes("KIDS_QUIZ_450_ARCHITECTURE_V1468"));
assert.ok(css.includes("horizontal-viewport-segments:2"));
assert.ok(css.includes("prefers-reduced-motion:reduce"));
assert.ok(css.includes("env(safe-area-inset-bottom"));
assert.ok(src.includes("if(!localAnswered||this.disabled||localRound[localIndex]!==q)return;"),"Continue must require correct answer");

const declaration="  var localRound=[],localIndex=0,localCorrectCount=0,localAnswered=false;";
const start=src.indexOf(declaration),finish=src.indexOf("  function localQuizApprovedAudioText()",start);
assert.ok(start>100000 && finish>start,"Real fallback progress function missing");
const progressSource=src.slice(start,finish);
const state={};
const q=bank.items.find(x=>x.ageBand==="7-8");
const dateMock={now:()=>1_900_000_000_000};
const sandbox={
  Date:dateMock,Number,Math,JSON,Object,String,
  localStorage:{setItem(key,value){state[key]=value}},
  progressFor(question){
    return JSON.parse(state["kids.quiz.progress.v2."+question.id]||"{}");
  }
};
vm.runInNewContext(progressSource+"\nthis.__save=saveFallbackProgress;this.__clear=function(){localHadError=false;};",sandbox);
sandbox.__save(q,false);
let record=JSON.parse(state["kids.quiz.progress.v2."+q.id]);
assert.equal(record.mistakeTaps,1,"Wrong choice must be recorded");
assert.equal(record.attempts,0,"A wrong choice cannot complete the question");
sandbox.__save(q,true);
record=JSON.parse(state["kids.quiz.progress.v2."+q.id]);
assert.equal(record.attempts,1,"Correct answer completes exactly one attempt");
assert.equal(record.wrong,1,"The corrected attempt must count as a learning lapse");
assert.equal(record.dueAt,dateMock.now()+300000,"Incorrect first attempt must be reviewed in 5 minutes");
sandbox.__clear();
sandbox.__save(q,true);
record=JSON.parse(state["kids.quiz.progress.v2."+q.id]);
assert.equal(record.attempts,2,"Subsequent correct round must increment attempts");
assert.equal(record.consecutiveFirstTry,1);

const from=src.indexOf("  function startLocalQuizRound(cat,roundMode){");
const to=src.indexOf("  function startRound(cat,roundMode){",from);
assert.ok(from>100000&&to>from,"Progress-aware fallback round selector missing");
const selector=src.slice(from,to);
for(const age of ["4-6","7-8","9-10"]){
  const pool=bank.items.filter(x=>x.ageBand===age);
  const count=age==="4-6"?3:age==="7-8"?4:5;
  const selection={
    Date:dateMock,Math,Number,Object,String,localFallbackOffsets:Object.create(null),
    localRound:[],localIndex:0,localCorrectCount:0,localHadError:false,
    bandId:()=>age,bandItems:()=>pool,progressFor:()=>({attempts:0}),
    renderLocalQuizQuestion(){}
  };
  vm.runInNewContext(selector+"\nthis.__start=startLocalQuizRound;",selection);
  const seen=new Set();
  for(let i=0;i<Math.ceil(pool.length/count);i++){
    selection.__start("all","normal");
    assert.equal(selection.localRound.length,count);
    for(const item of selection.localRound){
      assert.equal(item.ageBand,age);
      seen.add(item.id);
    }
  }
  assert.equal(seen.size,150,age+": fallback must reach EVERY one of 150 questions");
}
console.log("PASS: 150/150/150 fallback questions reachable, wrong -> retry, correct -> next, actual v2 progress persisted");
