#!/usr/bin/env node
"use strict";
// User screenshot regression 2026-10-30: the golden Qibla popup used to render
// in only the upper half of the iPhone, with the lower half blank white.
// Check the actual Visitor and DAR TEST HTML (not a test-only duplicate).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

for(const name of ["index.html","test/index.html"]){
  const s=read(name);
  const style=s.match(/<style id="dar-qibla-pop-v3">([\s\S]*?)<\/style>/);
  assert.ok(style,name+" must keep the golden Qibla stylesheet");
  const css=style[1];
  const openIndex=s.indexOf("function openQiblaQuickSheet(){");
  const closeIndex=s.indexOf("function openQiblaFromFloat()",openIndex);
  assert.ok(openIndex>0&&closeIndex>openIndex,name+" must keep the native quick-sheet functions");
  const open=s.slice(openIndex,closeIndex);
  assert.match(css,/html\.dar-qibla-pop-open\s*>\s*#darQiblaPop\s*\{/,
    name+" must make the popup a root-level viewport overlay");
  assert.match(css,/height:100dvh!important/,
    name+" must use dynamic viewport units rather than parent 100%");
  assert.match(css,/min-height:100dvh!important/,
    name+" must fill the viewport even with body clipping");
  assert.match(css,/width:100dvw!important/,
    name+" must fill unfolded and portrait widths");
  assert.match(css,/overflow-y:auto!important/,
    name+" must allow compact phone/landscape Qibla scroll");
  assert.match(css,/safe-area-inset-top/,
    name+" must respect the status bar and dynamic island");
  assert.match(css,/safe-area-inset-bottom/,
    name+" must respect the home indicator");
  assert.match(css,/#darQiblaPop \.dq-svg/,
    name+" must preserve the original gold compass");
  assert.match(open,/document\.documentElement\.appendChild\(root\)/,
    name+" must mount popup outside fixed scrolled body");
  assert.doesNotMatch(open,/document\.body\.appendChild\(root\)/,
    name+" must not mount popup inside a clipping body");
  assert.match(open,/data-qibla-live-close/,
    name+" must keep the X close button");
  assert.match(open,/darQiblaLiveBoot\(orientP\)/,
    name+" must still start live heading and GPS");
  assert.match(open,/darQiblaExitQuick\(\)/,
    name+" must still close through the normal exit flow");
  assert.match(open,/t\.closest\("#darQiblaPop"\)/,
    name+" must permit scroll inside the modal");
  assert.match(s,/function closeQiblaQuickSheet\(\)/,
    name+" must preserve the original close implementation");
  assert.match(s,/function darQiblaLiveBoot\(orientPromise\)/,
    name+" must preserve live sensor handling");
  console.log(name+": fullscreen portal, dynamic viewport, safe areas, sensors and X verified");
}
console.log("Qibla full-device viewport regression passed (Visitor and DAR TEST).");
