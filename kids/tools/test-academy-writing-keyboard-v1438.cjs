#!/usr/bin/env node
"use strict";
/* KIDS_ACADEMY_WRITING_KEYBOARD_V1438: no child text, audio, or progress writes. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("kids/akademie/index.html"),portal=read("kids/kids-academy-portal-v1421.js");
const script=page.match(/<script id="kids-academy-writing-keyboard-v1438">([\s\S]*?)<\/script>/);
assert.ok(script,"Keyboard-focus guard missing");
new vm.Script(script[1],{filename:"kids-academy-writing-keyboard-v1438.js"});
new vm.Script(portal,{filename:"kids-academy-portal-v1421.js"});
assert.ok(page.includes('KIDS_ACADEMY_WRITING_KEYBOARD_V1438'),"Typing-only CSS missing");
assert.ok(page.includes('textarea,input,[contenteditable=true]'),"Text caret touch gestures must remain native");
assert.ok(page.includes('document.activeElement===answer'),"Keyboard resize must never jump a non-editing lesson");
assert.ok(page.includes('mode("text")'),"Keep existing text-answer mode");
assert.ok(page.includes('mode("voice")'),"Keep existing microphone mode");
assert.ok(page.includes('var pane=$("#stageSurface"),field=$("#answer")'),"Reveal original answer field, do not duplicate it");
assert.ok(!page.includes('lessonScrollport.appendChild(lessonActions)'),"Reverted lesson-navigation reparenting must stay absent");
assert.ok(page.includes('padding-bottom:calc(var(--kids-academy-dock-clearance) + 10px)!important'),"Old lesson dock reserve must remain");
assert.ok(portal.includes('DAR_KIDS_ACADEMY_INPUT_V1438'),"Keyboard focus message missing");
assert.ok(portal.includes('academyTextInputFocused&&visibleHeight<viewportHeight-110'),"Only adjust layout when explicitly typing");
assert.ok(portal.includes('edgeScroll=1426'),"Approved older lesson portal mode must remain");
console.log("PASS Kids V1438: original lesson layout, writing caret, explicit keyboard resize and focus-safe answer area.");
