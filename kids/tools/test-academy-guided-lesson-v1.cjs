#!/usr/bin/env node
"use strict";
/* Machine QA only. Human Islamic content, pronunciation and actual device QA remain pending. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const js=fs.readFileSync(path.join(ROOT,"kids/akademie/guided-lesson-v1.js"),"utf8");
const css=fs.readFileSync(path.join(ROOT,"kids/akademie/guided-lesson-v1.css"),"utf8");
const html=fs.readFileSync(path.join(ROOT,"kids/akademie/index.html"),"utf8");
class FakeElement{
 constructor(name){this.tagName=name;this.className="";this.textContent="";this.children=[];this.attributes={};this.events={};this.hidden=false}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=nodes}
 setAttribute(name,value){this.attributes[name]=value}
 getAttribute(name){return this.attributes[name]}
 addEventListener(name,handler){this.events[name]=handler}
 click(){this.events.click?.()}
}
const win={};
vm.runInNewContext(js,{window:win,document:{createElement:name=>new FakeElement(name)}},{filename:"guided-lesson-v1.js",timeout:2000});
const guide=win.DARKidsAcademyGuidedLesson;
assert.ok(guide&&guide.version.includes("review"));
const ages=["4-5","6-8","9-10"];
for(const age of ages){
 const m=guide.model({lessonId:"sidq",age});
 assert.equal(m.age,age);assert.ok(m.warmup.length>=35);
 assert.ok(m.think.length>=30);assert.ok(m.source.quranLabel.includes("9:119"));
 assert.ok(m.source.hadithSource.includes("2607a"));
 assert.equal(m.automaticTruthRating,false);assert.equal(m.approvedVoiceForNewText,false);
}
assert.equal(new Set(ages.map(age=>guide.model({lessonId:"sidq",age}).warmup)).size,3);
const sourceLesson={topic:"Ṣabr",goal:"Ich übe Geduld.",
 quran:{label:"Qurʾān 2:153",meaning:"Sucht Hilfe durch Geduld",excerpt:false},
 hadith:{source:"Ṣaḥīḥ al-Buḫārī 1469",text:"Geduld üben."}};
for(const age of ages){
 const m=guide.model({lessonId:"akhlaq-sabr",lesson:sourceLesson,age});
 assert.equal(m.greeting,sourceLesson.goal);
 assert.equal(m.source.quranLabel,sourceLesson.quran.label);
 assert.equal(m.source.hadithSource,sourceLesson.hadith.source);
}
let source=guide.model({lessonId:"fiqh-wudu",
 lesson:{topic:"Wuḍūʾ",quran:{label:"Qurʾān 5:6",excerpt:true}},age:"9-10"});
assert.equal(source.source.quranExcerpt,true);
const w=new FakeElement("section");guide.mountWelcome(w,{lessonId:"sidq",age:"4-5"});
assert.equal(w.children.length,5);const button=w.children[3],question=w.children[4];
assert.equal(question.hidden,true);button.click();assert.equal(question.hidden,false);
assert.equal(button.getAttribute("aria-expanded"),"true");
const t=new FakeElement("section");guide.mountThinking(t,{lessonId:"sidq",age:"6-8"});
assert.equal(t.children.length,6);t.children[4].click();assert.equal(t.children[5].hidden,false);
const e=new FakeElement("section");guide.mountSources(e,{lessonId:"sidq",age:"9-10"});
assert.ok(e.children[4].children.length>=4,"Qurʾān and Sunnah source labels");
for(const id of ["academyGuidedWelcome","academyGuidedUnderstanding","academyGuidedSources"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing mount "+id);
}
assert.ok(html.includes('guided-lesson-v1.js?v=20261031-01'));
assert.ok(html.includes('guided-lesson-v1.css?v=20261031-01'));
assert.ok(html.includes('if(n<=2)refreshGuidedLesson()'));
assert.ok(html.includes('sourceCoach.hidden=i!==2'));
assert.ok(html.includes('thinkCoach.hidden=i!==3'));
assert.ok(css.includes("min-height:52px")&&css.includes("var(--gold)"));
assert.ok(!/\bfetch\s*\(|\blocalStorage\b|\bspeechSynthesis\b|\bWebSocket\b|\bnavigator\.share\b|\bnew Audio\s*\(/.test(js));
console.log("PASS guided 5-stage lesson: 3 age groups, canonical sources, privacy, 3 card mounts, help toggle, CSS and regression anchors");
