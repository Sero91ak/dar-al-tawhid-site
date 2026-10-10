#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ctx=vm.createContext({window:{}});
for(const script of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js"]){
 new vm.Script(read(script),{filename:script}).runInContext(ctx);
}
const curr=ctx.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(curr).length,33);
assert.equal(ctx.window.DARKidsAcademyCurriculumV2.count,22);
let questionCount=0;
for(const [id,l] of Object.entries(curr)){
 assert.equal(id,l.id);
 assert.match(l.subject,/^(akhlaq|adab|fiqh|aqidah)$/);
 assert.ok(l.lead&&l.goal&&l.quran&&l.hadith);
 assert.equal(l.lines.length,4);
 assert.match(l.hadith.source,/Ṣaḥīḥ/);
 for(const age of ["4-5","6-8","9-10"]){
  const qs=l.questions[age];
  assert.ok(Array.isArray(qs)&&qs.length>=2,id+age);
  for(const q of qs){
   questionCount++;
   assert.ok(q.prompt&&q.hint,id+age);
   if(q.type==="choice"){
    assert.ok(q.options?.length>=2,id+age);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   }else assert.equal(q.type,"text");
  }
 }
 if(l.sourceLesson){
  const basis=curr[l.sourceLesson];
  assert.ok(basis,id+" base missing");
  assert.deepEqual(JSON.parse(JSON.stringify(l.quran)),JSON.parse(JSON.stringify(basis.quran)));
  assert.deepEqual(JSON.parse(JSON.stringify(l.hadith)),JSON.parse(JSON.stringify(basis.hadith)));
 }
}
assert.equal(questionCount,264);
const plan=JSON.parse(read("kids/data/academy-voice-plan-v9.json"));
assert.equal(plan.lessonCount,34);
assert.equal(plan.phraseCount,plan.phrases.length);
assert.ok(plan.phraseCount>=400);
assert.equal(new Set(plan.phrases.map(x=>x.text)).size,plan.phraseCount);
assert.equal(plan.policy.reviewRequiredBeforePublicPlayback,true);
assert.ok(plan.phrases.every(x=>x.reviewStatus==="not-generated"&&!x.url));

const htmls=["kids/akademie/index.html","desktop-preview/kids-akademie-unterricht.html"].map(read);
for(const html of htmls){
 assert.ok(html.includes('curriculum-v2.js?v=20261010-09'));
 assert.ok(html.includes('data-preview-release="V9.0-20261010"'));
 assert.ok(html.includes('id="subjectReviewGrid"'));
 assert.ok(html.includes('function dailyLesson()'));
 assert.ok(html.includes('persist("help",true)'));
 assert.ok(!html.includes("Bald verfügbar"));
 const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
 for(const match of html.matchAll(re)){
  if(/\bsrc=/.test(match[1]))continue;
  new vm.Script(match[2]);
 }
}
const main=htmls[0];
const fragment=main.slice(main.indexOf("const TOPIC_IDS="),main.indexOf("function applySelectedLesson(){"));
assert.ok(fragment.length>3000&&fragment.length<11000);
const store=new Map();
const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
let simulated=Date.now();
class FakeDate extends Date{
 constructor(...args){super(...(args.length?args:[simulated]))}
 static now(){return simulated}
}
const instantiate=(childId)=>new Function("CURRICULUM","VERSION","id","age","localStorage","Date",fragment+
"\nreturn {dailyLesson,lessonIds,availableTopics,recordFor};")(curr,"academy-v4",childId,"6-8",localStorage,FakeDate);
const boy=instantiate("kid-boy"),girl=instantiate("kid-girl");
assert.equal(boy.lessonIds().length,34);
assert.deepEqual(["akhlaq","adab","fiqh","aqidah"].map(k=>boy.availableTopics(k).length),[7,9,9,9]);
const first=boy.dailyLesson();
assert.equal(boy.dailyLesson().id,first.id);
const key=["kids","academy-v4","kid-boy","6-8",first.id].join(".");
localStorage.setItem(key,JSON.stringify({lessonId:first.id,id:"kid-boy",age:"6-8",completedAt:simulated,nextDue:simulated+86400000*3,intervalIndex:0}));
assert.equal(boy.dailyLesson().id,first.id,"daily card should not jump after saving progress");
assert.equal(girl.recordFor(first.id),null,"profile progress must remain independent");
simulated+=86400000;
const second=boy.dailyLesson();
assert.notEqual(second.id,first.id,"new day must offer an unfinished lesson");
console.log("KIDS ACADEMY V9 VERIFIED: 34 courses, 264 age-graded questions, "+plan.phraseCount+" planned voice lines, profile-safe daily lessons, free review.");
