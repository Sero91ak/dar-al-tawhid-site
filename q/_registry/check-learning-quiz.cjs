#!/usr/bin/env node
/* LEARNING_QUIZ_VIEWPORT_AND_THEME_GUARD_V1
 * Non-browser structural regression checks; final native-device review remains required. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"lernen/wissen-adab/index.html"),"utf8");
const q=fs.readFileSync(path.join(root,"q/46/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/q-source-dar-al-layl.css"),"utf8");
const assertHas=(v,re,label)=>assert.match(v,re,label);
assertHas(html,/<body[^>]*class="heritage-learning wqa-page"/,"shared learning theme class missing");
assertHas(html,/href="\/q\/46\/"/,"quiz link back to evidence Q46 missing");
assertHas(q,/class="qsource-learning" href="\/lernen\/wissen-adab\/"/,"Q46 link to quiz missing");
assertHas(html,/height:100dvh[^;]*;min-height:0/,"page must fit a single viewport");
assertHas(html,/overflow:hidden;height:100dvh/,"scrolling multi-section article must not return");
assertHas(html,/\.wqa-options[^}]*grid-template-rows:repeat\(3,minmax\(0,1fr\)\)/,"three answers must fit quiz panel");
assertHas(html,/@media\(max-height:650px\)/,"small smartphone height adaptation missing");
assertHas(html,/@media\(max-height:480px\)/,"text zoom/short viewport accessible escape hatch missing");
assertHas(html,/data-q-theme="dark"/,"quiz dark appearance missing");
assertHas(html,/data-q-theme="light"/,"quiz light appearance missing");
assertHas(html,/localStorage\.getItem\("dar-quellen-royal-theme"\)/,"same appearance state as Q source missing");
assertHas(css,/QSOURCE_LEARNING_CONTRAST_V2/,"Q source learning link contrast fix missing");
assertHas(css,/:root\[data-q-theme="dark"\] \.qsource-learning strong/,"dark learning link contrast missing");
assertHas(css,/:root\[data-q-theme="light"\] \.qsource-learning span/,"light learning link contrast missing");
assertHas(q,/q-source-dar-al-layl\.css\?v=20261019contrast2/,"Q46 must invalidate stale cached CSS");
assertHas(html,/id="question"/,"question region absent");
assertHas(html,/id="choices"/,"answer region absent");
assertHas(html,/id="nextButton" disabled/,"next must be disabled until answer");
assertHas(html,/id="resultPanel" hidden/,"separate result stage missing");
assertHas(html,/id="restartButton"/,"restart action missing");
assertHas(html,/addEventListener\("click",\(\)=>choose\(i,button\)\)/,"answers are not clickable");
assertHas(html,/function choose\(i,button\)/,"answer evaluation not implemented");
assertHas(html,/next\.addEventListener\("click"/,"next question logic missing");
assertHas(html,/aria-live="polite"/,"feedback accessible live text missing");
assert.ok(!/id="quiz-panel"/.test(html),"legacy tall article-style quiz still present");
assert.ok(!/class="card quiz-panel"/.test(html),"legacy long-scrolling section still present");
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(m=>! /\bsrc\s*=/.test(m[0].split(">")[0]));
assert.equal(scripts.length,2,"expected inline theme init and quiz logic scripts");
for(const script of scripts)new vm.Script(script[1],{filename:"lernen/wissen-adab/index.html"});
const quiz=scripts[1][1];
assert.equal((quiz.match(/\{q:"/g)||[]).length,4,"expected four factual questions");
assert.equal((quiz.match(/choices:\[/g)||[]).length,4,"expected four answer groups");
const answerKeys=[...quiz.matchAll(/correct:(\d),why:/g)].map(x=>Number(x[1]));
assert.equal(answerKeys.length,4,"all four quiz answers need explicit answer keys");
assert.ok(new Set(answerKeys).size >= 3,"correct answers must not always sit on the same option");
assertHas(html,/Vier Fragen · eine Frage pro Ansicht/,"single-question quiz footer label must be accurate");
const stems=[...quiz.matchAll(/\{q:"([^"]+)"/g)].map(x=>x[1]);
assert.equal(stems.length,4,"four independently checkable question stems required");
assert.equal(new Set(stems).size,4,"no duplicate quiz questions");
for (const stem of stems) {
  assert.ok(!/\bQ\s?4[56]\b|deutsche Aussage|gekennzeichnet|Quellenkarte|Quelle(?:n)?nummer|ChatGPT|Layout|veröffentlicht|Überlieferungsstatus/i.test(stem),
    "quiz must examine Ibn Sīrīn's actual subject, not editorial metadata: " + stem);
}
assert.ok(stems.some(x=>/beiden Bereiche|Wissen|Gegenstand des Lernens/i.test(x)),"question about knowledge and conduct missing");
assert.ok(stems.some(x=>/al-hady/i.test(x)),"question about source term al-hady missing");
assert.ok(stems.some(x=>/al-Qāsim/i.test(x)),"question about learning from a lived model missing");
assert.ok(stems.some(x=>/Vorgehen|Grundgedanken/i.test(x)),"practical application missing");
const sage=fs.readFileSync(path.join(root,"assets/theme-salbei-elfenbein.css"),"utf8");
assertHas(sage,/SALBEI_ELFENBEIN_QUIZ_READABILITY_V2/,"sage ivory quiz contrast repair missing");
assertHas(sage,/\.quiz-explanation[^}]*\.quiz-source/s,"explanation and source must have themed contrast selectors");
assertHas(sage,/-webkit-text-fill-color:#253C2E!important/,"dark text must remain readable in iOS webview");
assertHas(sage,/SALBEI_QUIZ_ROUTE_INDEPENDENT_CONTRAST_V3/,"Salbei light quiz readability must work without body route class");
assertHas(sage,/\.quiz-shell\.quiz-shell-pro :is\(/,"Salbei color scope must attach directly to quiz shell");
assertHas(sage,/\[class\*="quiz-explanation"\]/,"Salbei needs fallbacks for dynamically named explanation panels");
assertHas(sage,/\[class\*="quiz-source"\]/,"Salbei needs fallbacks for dynamically named source panels");
assertHas(sage,/background:#F8FAF6!important/,"Salbei answer/source surfaces must not remain dark");
function colorContrast(hexA,hexB){
  const channel=(hex)=>{
    const n=parseInt(hex,16)/255;
    return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;
  };
  const luminance=(hex)=>{
    const n=hex.replace(/^#/,"");
    return [0.2126,0.7152,0.0722].reduce((sum,weight,i)=>
      sum+weight*channel(n.slice(i*2,i*2+2)),0);
  };
  const a=luminance(hexA),b=luminance(hexB);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
assert.ok(colorContrast("#253C2E","#F8FAF6")>=7,"Salbei explanation contrast must meet WCAG AAA normal text");
assert.ok(colorContrast("#245B35","#E8F3E8")>=4.5,"positive feedback must meet WCAG AA normal text");
assert.ok(colorContrast("#873B37","#F9ECE8")>=4.5,"negative feedback must meet WCAG AA normal text");


console.log("OK: Q46 four-question single-screen quiz, source-grounded content, Salbei quiz feedback contrast, scripts.");
