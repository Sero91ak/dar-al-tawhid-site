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
for(const token of ['id="openQuizButton"','id="quizModal"','/kids/quiz-library.js?v=1450','/kids/quiz-library.css?v=1450','/kids/sw.js?v=1450']){
  assert.ok(entry.includes(token),"Missing Kids shell token: "+token);
}
const sw=read("kids/sw.js");
const version=JSON.parse(read("kids/version.json"));
assert.ok(sw.includes('dar-al-tawhid-kids-v1450'));
assert.equal(version.visualSystem.serviceWorkerCache,"v1450");
assert.ok(sw.includes('/kids/quiz-library.js?v=1450'));
assert.ok(sw.includes('url.pathname==="/kids/quiz-library.js"'));
const questions=JSON.parse(read("kids/data/quiz-kids.json")).items;
assert.equal(questions.length,900);
assert.equal(questions.filter(q=>q.ageBand==="4-6").length,300);
assert.equal(questions.filter(q=>q.ageBand==="7-8").length,300);
assert.equal(questions.filter(q=>q.ageBand==="9-10").length,300);
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
console.log("PASS: Kids 3 shells equal, SW v1450, all 900 quiz questions preserved, home tile opens modal on captured tap");
