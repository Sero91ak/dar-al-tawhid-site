#!/usr/bin/env node
/* Read-only V8 Duo lab contract test; run: node test/tools/v8-duo-lab-qa.cjs */
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/index.html");
const js=read("test/assets/v8-duo-lab-v1.js");
const css=read("test/assets/v8-duo-lab-v1.css");
const picker=read("assets/i18n/adult-language-picker-v1.js");
const adaptive=read("assets/adaptive-layout.js");
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;process.stdout.write("PASS "+message+"\n");}
new vm.Script(js,{filename:"v8-duo-lab-v1.js"});checks++;
check(html.split('id="darV8DuoLabV1JS"').length===2,"one isolated JavaScript entry");
check(html.split('id="darV8DuoLabV1CSS"').length===2,"one isolated CSS entry");
check(html.includes("/test/assets/v8-duo-lab-v1.js")&&html.includes("/test/assets/v8-duo-lab-v1.css"),"test-scoped assets");
check(js.includes('if (!/^\\/test(?:\\/|$)/.test('),"module refuses visitor and Kids URLs");
check(js.includes('src.click()'),"new navigation forwards to original bottom buttons");
check(js.includes('w.navigate(route,value)'),"quick account/appearance use original router");
check(js.includes('DARAdultLanguagePickerV1'),"existing language selector reused");
check(js.includes('data-dar-language-entry'),"settings language card exists");
for(const code of ["de","ar","en","tr","ku","ckb","bs","fr","es"]){
  check(picker.includes('code:"'+code+'"'),"registered language "+code);
}
check(picker.includes("function available(code)"),"unfinished languages still require availability checks");
check(picker.includes('dir:"rtl"'),"RTL metadata available");
check(html.includes('id="bottomNav"'),"original bottom navigation remains");
check(html.includes("renderThemeSwitchPanel()"),"original theme selector remains");
check(html.includes("renderAppIconPanel()"),"original app icon selector remains");
check(html.includes("renderFontSettingsPanel()"),"original font controls remain");
check(html.includes("renderNotificationCenter("),"location/notifications source remains");
check(adaptive.includes("DarAdaptiveLayout = api"),"existing responsive engine unchanged");
check(css.includes("dar-v8-duo-open")&&css.includes(".dar-fold"),"expanded layout scoped to test flag");
check(read("test/V8_DUO_LAB_ROLLBACK.md").includes("18e42c4c21f48f3d16da2759c868c33c03659629"),"documented rollback baseline");
process.stdout.write("V8 Duo QA contract: "+checks+" checks OK (visual/device QA remains open)\n");
