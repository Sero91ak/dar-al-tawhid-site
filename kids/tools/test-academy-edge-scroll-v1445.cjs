#!/usr/bin/env node
"use strict";
/* KIDS_LESSON_CAPSULE_RESTORE_V1446 — preserve framed lesson cards and
   the approved V1445 behind-dock scroll plus original input controls. */
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("kids/akademie/index.html");
const match=page.match(/<style id="kids-academy-edge-scroll-v1445">([\s\S]*?)<\/style>/);
assert.ok(match,"capsule and behind-dock scroll contract missing");
const css=match[1];
for(const rule of [
  'KIDS_LESSON_CAPSULE_RESTORE_V1446',
  'body[data-kids-portal="true"][data-academy-view="lesson"] > main.wrap > #lessonMain',
  'padding-bottom:0!important',
  'body[data-kids-portal="true"][data-academy-view="lesson"] #lessonMain #stageSurface',
  'overflow-y:auto!important;overflow-x:hidden!important',
  'padding:2px 2px calc(var(--kids-academy-dock-clearance) + 20px)!important',
  'scroll-padding-block-end:calc(var(--kids-academy-dock-clearance) + 20px)!important',
  'data-academy-step="0"',
  'bottom:calc(var(--kids-academy-dock-clearance) + 8px)!important',
  'data-academy-typing="true"',
  'padding-bottom:24px!important;scroll-padding-block-end:24px!important'
])assert.ok(css.includes(rule),"regressed scroll contract: "+rule);
assert.ok(!css.includes('border-radius:0!important')&&!css.includes('border-inline-width:0!important')&&!css.includes('padding-inline:0!important')&&!css.includes('max-width:none!important'),"original lesson framing must not be flattened");
assert.ok(!css.includes('pointer-events:none')&&!css.includes('touch-action:none'),"reading gestures blocked");
assert.ok(page.includes('id="kids-academy-writing-keyboard-v1438"'),"old keyboard input fix removed");
assert.ok(page.includes('DAR_KIDS_ACADEMY_INPUT_V1438'),"old keyboard focus ping removed");
assert.ok(page.includes('var pane=$("#stageSurface"),field=$("#answer")'),"original handwriting scroll target removed");
assert.ok(!page.includes('lessonScrollport.appendChild(lessonActions)'),"lesson buttons were reparented");
const shells=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert.equal(shells[0],shells[1],"KIDS entrypoints differ");
assert.equal(shells[0],shells[2],"KIDS entrypoints differ");
const sw=read("kids/sw.js"),version=JSON.parse(read("kids/version.json"));
const cache=String(version.visualSystem.serviceWorkerCache||"");
assert.equal(cache,"v1446","version registry must be current");
assert.ok(sw.includes('const CACHE_NAME="dar-al-tawhid-kids-v1446"'),"SW update missing");
assert.ok(shells[0].includes('navigator.serviceWorker.register("/kids/sw.js?v=1446"'),"shell registers stale SW");
assert.ok(page.includes('id="lessonNavigation"')&&page.includes('id="stageSurface"'),
 "original lesson nodes removed");
console.log("PASS Kids V1446: original framed lesson cards restored, scrolling behind dock and typing preserved.");
