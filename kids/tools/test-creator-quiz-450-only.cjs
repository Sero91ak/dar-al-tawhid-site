#!/usr/bin/env node
"use strict";
// KIDS TEST only: never expose the 900-item editorial source or unapproved V4 audio.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const original=JSON.parse(read("kids/data/quiz-kids.json")).items;
const publicPack=JSON.parse(read("kids/data/quiz-kids-public-450.json"));
const questions=publicPack.items;
assert.equal(original.length,900);
assert.equal(questions.length,450);
assert.equal(new Set(questions.map(q=>q.id)).size,450);
const originalById=new Map(original.map(q=>[q.id,q]));
for(const q of questions){
  assert.deepEqual(q,originalById.get(q.id),"Edited original question "+q.id);
}
const selected=new Set(questions.map(q=>q.id));
const reserve=original.filter(q=>!selected.has(q.id));
assert.equal(reserve.length,450);
for(const age of ["4-6","7-8","9-10"]){
  assert.equal(questions.filter(q=>q.ageBand===age).length,150);
  assert.equal(reserve.filter(q=>q.ageBand===age).length,150);
}
const shells=["index","start","shell"].map(x=>read("kids/"+x+".html"));
assert.ok(shells.every(x=>x===shells[0]),"Entry shells must be byte-identical");
const html=shells[0];
for(const token of ['id="openQuizButton"','id="quizModal"','id="quizGlobalBack"',
  "window.fetchKidsQuiz=fetchKidsQuiz","KIDS_QUIZ_EMBEDDED_450_V1",
  "/kids/quiz-library.js?v=1460","/kids/quiz-library.css?v=1454",
  "/kids/quiz-test-premium-v1460.css?v=1460",
  "/kids/sw.js?v=1460"]){
  assert.ok(html.includes(token),"Missing test quiz marker: "+token);
}
assert.ok(!html.includes('fetch("/kids/data/quiz-kids.json'),"Legacy 900-item loader exposed");
const lib=read("kids/quiz-library.js");
new vm.Script(lib,{filename:"quiz-library.js"});
assert.ok(lib.includes("KIDS_VISITOR_450_STANDALONE_V1455"));
assert.ok(lib.includes("window.DARKidsQuizPack450"));
const key="var QUIZ_PACK_450=",a=lib.indexOf(key);
assert.ok(a>=0);
const end=lib.indexOf(";\n",a);
assert.ok(end>a);
const embedded=JSON.parse(lib.slice(a+key.length,end));
assert.deepEqual(embedded.items,questions,"Embedded 450 pack differs from canonical selection");
assert.match(html,/KIDS_TEST_QUIZ_NEXT_V1460/,"Quiz answers must progress");
assert.match(html,/kidsQuizProfileScope/,"Profile progress scope required");
assert.match(html,/quizHistorySave/,"Per-profile history required");
assert.match(html,/data-quiz-gender/,"Per-profile palette required");
assert.match(html,/next.disabled=false/,"Next must unlock regardless of correctness");
assert.ok(!html.includes('localStorage.getItem("kids.quiz.correct"'),"Global quiz count forbidden");
const premium=read("kids/quiz-test-premium-v1460.css");
assert.ok(premium.includes("@media(min-width:900px)"),"Wide-screen grid required");
assert.ok(premium.includes("safe-area-inset-bottom"),"Safe-area inset required");
assert.ok(premium.includes('data-quiz-gender="girl"'),"Girls theme required");
assert.ok(premium.includes("--kq-panel:#102b3d"),"Boys theme required");
assert.ok(read("kids/quiz-library.js").includes("quiz-history-bars"),"Learning history required");
const version=JSON.parse(read("kids/version.json"));
assert.equal(version.visualSystem.kidsQuizQuestionCount,450);
assert.equal(version.visualSystem.serviceWorkerCache,"v1460");
const sw=read("kids/sw.js");
assert.ok(sw.includes("dar-al-tawhid-kids-v1460"));
assert.ok(sw.includes("/kids/data/quiz-kids-public-450.json"));
assert.ok(!sw.includes('"/kids/data/quiz-kids.json"'));
const worker=read("kids/creator-test/worker.js");
const program=worker.replace("export default {","const worker = {")+"\n;worker";
const handler=new vm.Script(program).runInNewContext({URL,Headers,Response});
let called=0;
const env={ASSETS:{fetch:async()=>{called++;return new Response("OK")}}};
async function request(p){return handler.fetch(new Request("https://kids-preview.example"+p),env)}
(async()=>{
  for(const p of ["/kids/data/quiz-kids.json",
    "/kids/data/quiz-kids-expansion-reserve-450.json",
    "/kids/data/quiz-v4-curated-450-production-review.json",
    "/kids/review-only/quiz-v4-450-actual-mp3-import.json",
    "/kids/assets/kids-quiz-audio/v4-final13-review/clip.mp3"]){
    const n=called;
    assert.equal((await request(p)).status,404,p);
    assert.equal(called,n,"Blocked request reached ASSETS: "+p);
  }
  assert.equal((await request("/kids/data/quiz-kids-public-450.json")).status,200);
  console.log("PASS KIDS TEST: 150/150/150 + 450 draft reserve, UI/offline/worker isolation");
})().catch(e=>{console.error(e);process.exitCode=1});
