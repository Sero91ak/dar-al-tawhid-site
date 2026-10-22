#!/usr/bin/env node
"use strict";
/*
 * DAR TEST V8 DUO contract guard.
 * This runs WITHOUT network, browsers, API keys or build version changes.
 * Browser / Device Hub tests remain a separate release gate.
 */
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const assert=require("assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const html=read("test/index.html");
const css=read("test/assets/dar-test-duo-v8.css");
const js=read("test/assets/dar-test-duo-v8.js");
const nav=read("test/assets/fold-thumb-nav.js");
function check(label,passed){
  assert.ok(passed,label);
  process.stdout.write("PASS "+label+"\n");
}
new vm.Script(js,{filename:"dar-test-duo-v8.js"});
new vm.Script(nav,{filename:"fold-thumb-nav.js"});
check("JS syntax",true);
check("Only one V8 CSS entry",html.split('id="darTestDuoV8Style"').length===2);
check("Only one V8 script entry",html.split('id="darTestDuoV8Script"').length===2);
check("V8 bundle restricted to /test/",js.includes('path!=="/test"&&path.indexOf("/test/")!==0'));
check("Opt-out switch can be set with Zurück",js.includes('w.localStorage.setItem(KEY,"0")') && js.includes("Zurück"));
check("Opt-out CSS scoped to class",css.includes("html.dar-test-duo-v8"));
check("Legacy navigation when V8 off",nav.includes('if (root.classList.contains("dar-test-duo-v8"))') && nav.includes('return "bottom";'));
check("Existing one #bottomNav reused",html.split('id="bottomNav"').length===2 && !js.includes("cloneNode("));
check("Existing picker reused",js.includes("DARAdultLanguagePickerV1.open"));
check("No new paid API calls",!/(?:openai|elevenlabs|onesignal).*(?:fetch|api)/i.test(js));
for(const code of ["de","ar","en","tr","ku","ckb","bs","fr","es"]){
  check("Language catalog "+code,js.includes('"'+code+'"'));
}
const sizes=[
  {w:393,h:852,expect:"compact"},
  {w:430,h:932,expect:"compact"},
  {w:700,h:950,expect:"medium"},
  {w:820,h:960,expect:"open"},
  {w:1180,h:820,expect:"open"},
  {w:852,h:393,expect:"medium"}
];
function mode(w,h,keyboard){return w>=760&&h>=560&&!keyboard?"open":w>=600?"medium":"compact";}
for(const t of sizes)check("Viewport "+t.w+"x"+t.h,mode(t.w,t.h,false)===t.expect);
check("Keyboard forces non-open viewport",mode(820,960,true)==="medium");
process.stdout.write("Static V8 Duo contract: OK. Device Hub/browser QA still required.\n");
