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
for(const token of ['id="openQuizButton"','id="quizModal"','/kids/quiz-library.js?v=1451','/kids/quiz-library.css?v=1450','/kids/sw.js?v=1452']){
  assert.ok(entry.includes(token),"Missing Kids shell token: "+token);
}
const sw=read("kids/sw.js");
const version=JSON.parse(read("kids/version.json"));
assert.ok(sw.includes('dar-al-tawhid-kids-v1452'));
assert.equal(version.visualSystem.serviceWorkerCache,"v1452");
assert.ok(sw.includes('/kids/quiz-library.js?v=1451'));
assert.ok(sw.includes('url.pathname==="/kids/quiz-library.js"'));
const originalQuestions=JSON.parse(read("kids/data/quiz-kids.json")).items;
assert.equal(originalQuestions.length,900,"900 canonical question IDs must stay available for editorial work");
const publicData=JSON.parse(read("kids/data/quiz-kids-public-450.json"));
assert.equal(publicData.counts.total,450);
const questions=publicData.items;
assert.equal(new Set(questions.map(q=>q.id)).size,450);
const originalById=new Map(originalQuestions.map(q=>[q.id,q]));
for(const q of questions)assert.deepEqual(q,originalById.get(q.id),"Original question texts and IDs must be preserved");
const publishedIds=new Set(questions.map(q=>q.id));
const reserve=originalQuestions.filter(q=>!publishedIds.has(q.id));
assert.equal(reserve.length,450,"450 reserved IDs must remain out of the Quiz UI");
for(const band of ["4-6","7-8","9-10"])assert.equal(reserve.filter(q=>q.ageBand===band).length,150);
assert.ok(entry.includes("/kids/data/quiz-kids-public-450.json?v=20261026-450"),"Kids Quiz must fetch curated 450 only");
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
    remove:()=>{}
  },
  setAttribute:()=>{}
};
const document={
  readyState:"loading",
  getElementById:id=>id==="quizModal"?modal:null,
  addEventListener:(type,cb,capture)=>{(listeners[type]??=[]).push({cb,capture})}
};
const window={kidsQuizPool:[],addEventListener:()=>{}};
vm.runInNewContext(read("kids/quiz-library.js"),{window,document,console,Promise,setTimeout,clearTimeout},{
  filename:"kids/quiz-library.js"
});
assert.ok(entry.includes("window.fetchKidsQuiz=fetchKidsQuiz"),"Quiz fetch bridge missing");
assert.ok(entry.includes("window.openKidsQuizQuestion=function(q)"),"Question routing missing");
assert.ok(entry.includes("window.quizPrompt=quizPrompt"),"Speech bridge missing");
assert.ok(entry.includes("(window.renderQuizFinish||renderQuizFinish)()"),"End-of-round routing missing");
assert.ok(sw.includes('new URL(request.url).pathname==="/kids/data/quiz-kids-public-450.json"'),"Offline recovery missing");
assert.equal(typeof window.openKidsQuizHub,"function");
assert.equal(listeners.click?.length,1);
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
console.log("PASS: Kids 3 shells equal, SW v1452, 450 published Quiz questions and 450 draft reserve preserved, home tile opens modal on captured tap");
