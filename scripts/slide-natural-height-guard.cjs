#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const html=fs.readFileSync("index.html","utf8");
const css=fs.readFileSync("assets/adaptive-layout.css","utf8");
const js=fs.readFileSync("assets/adaptive-layout.js","utf8");
assert.match(html,/assets\/adaptive-layout\.css/, "Visitor app must load adaptive CSS");
assert.match(html,/assets\/adaptive-layout\.js/, "Visitor app must load adaptive JS");
assert.match(html,/class="post-slide-window"/, "Slide viewport must still exist");
assert.match(html,/class="post-slide-track"/, "Slide swipe track must still exist");
assert.match(html,/data-slide-carousel/, "Slide carousel must remain available");
assert.match(html,/data-slide-prev/, "Previous navigation must remain available");
assert.match(html,/data-slide-next/, "Next navigation must remain available");
assert.match(html,/dataset\.active=String\(index\)/,"Navigation must still set active index");
assert.match(css,/\.post-slides\s+\.post-slide-track\s*\{\s*align-items:flex-start\s*!important/, "Slides must stop cross-axis stretching");
assert.match(css,/\.post-slides\s+\.post-slide\s*\{[\s\S]*?align-content:start\s*!important/, "Slide grid rows must pack at start");
assert.match(css,/grid-auto-rows:max-content\s*!important/,"Grid rows must follow content height");
assert.match(js,/__DAR_SLIDE_CONTENT_HEIGHT_V1/,"Natural-height controller must be registered once");
assert.match(js,/parseInt\(carousel\.dataset\.active/,"Active slide must drive carousel height");
assert.match(js,/activeSlide\.scrollHeight, activeSlide\.offsetHeight/,"Viewport must measure active slide only");
assert.match(js,/attributeFilter:\s*\["data-active"\]/,"Swipe or button navigation must update height");
assert.match(js,/document\.fonts\.ready\.then\(scan\)/,"Late font loading must trigger re-measure");
assert.match(js,/ResizeObserver/,"Different slide text lengths must trigger re-measure");
const post=fs.readFileSync("content/posts/2026-10-08-isa-ibn-maryam-nuzul-frueher-ikhtilaf-slides.md","utf8");
const q35BodySlides=(post.match(/<!-- slide:\s*\d+ -->/g)||[]).length;
const q35YamlSlides=(post.match(/^  - title:/gm)||[]).length;
assert.ok(q35BodySlides>=2,"Q35 must retain multiple published slides");
assert.equal(q35BodySlides,q35YamlSlides,"Q35 YAML and Markdown slides must remain synchronized");

const vm=require("node:vm");
const jsStart=js.indexOf("/* v2026-10-08 · Match the carousel viewport");
assert.ok(jsStart>0,"Natural-height controller source must be available");
let onMutations;
const stage={
  style:{height:""},
  getBoundingClientRect(){return{height:parseFloat(this.style.height)||1000};}
};
const carousel={
  isConnected:true, dataset:{active:"0"},
  querySelector(sel){return sel===".post-slide-window"?stage:null;},
  querySelectorAll(sel){return sel===".post-slide"?slides:[];}
};
const slides=[140,900].map(height=>({
  scrollHeight:height,offsetHeight:height,
  closest(){return carousel;}
}));
const documentMock={
  body:{},readyState:"complete",
  querySelectorAll(sel){return sel==="[data-slide-carousel]"?[carousel]:[];}
};
const windowMock={
  requestAnimationFrame(fn){fn();},
  addEventListener(){}
};
class RO{observe(){}}
class MO{
  constructor(callback){onMutations=callback;}
  observe(){}
}
vm.runInNewContext(js.slice(jsStart),{
  window:windowMock, document:documentMock,ResizeObserver:RO,MutationObserver:MO
},{timeout:2000});
assert.equal(stage.style.height,"140px","Short active slide must not use tallest sibling height");
carousel.dataset.active="1";
onMutations([{type:"attributes",target:{matches(){return true;},...carousel}}]);
assert.equal(stage.style.height,"900px","Long slide must grow naturally without clipping");
carousel.dataset.active="0";
onMutations([{type:"attributes",target:{matches(){return true;},...carousel}}]);
assert.equal(stage.style.height,"140px","Back must shrink to short slide again");


// Editorial compact regression: heading/quote remain grouped with natural-height cards.
assert.match(css,/editorial compact v1/, "Visitor post editorial enhancement must load");
assert.match(css,/grid-template-rows:none\s*!important/, "Slide rows must not reserve unused vertical space");
assert.match(css,/post-slide-quote\s*\{[\s\S]*?border-left:2px solid/, "Slide quote gets an editorial accent without a box");
assert.match(css,/min-height:44px\s*!important/, "Slide navigation remains touch-friendly");

console.log("Slide natural-height regression PASS: 140→900→140px; compact layout, swipe prev/next, aligned published slides and source content intact.");
