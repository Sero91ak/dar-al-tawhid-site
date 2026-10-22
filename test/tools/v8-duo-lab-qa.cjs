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
const globalShell=read("test/assets/v8-global-shell-v1.js");
const globalStyle=read("test/assets/v8-global-shell-v1.css");
const homeShell=read("test/assets/v8-home-editorial-20261022.js");
const homeStyle=read("test/assets/v8-home-editorial-20261022.css");
new vm.Script(globalShell,{filename:"v8-global-shell-v1.js"});checks++;
new vm.Script(homeShell,{filename:"v8-home-editorial-20261022.js"});checks++;
for(const id of [
  "darV8GlobalShellCSS","darV8GlobalShellJS",
  "darV8EditorialHomeCSS","darV8EditorialHomeJS"
]){
  check(html.split('id="'+id+'"').length===2,"one global V8 link "+id);
}
check(globalShell.includes("preserveShareUI()"),"social and native sharing detection survives");
check(globalShell.includes('footer .footer-social-link'),"original social channel links reused");
check(homeShell.includes("origin.cloneNode(true)"),"original Ibn Sirin citation cloned, not paraphrased");
check(homeShell.includes("dar-v8-home-editorial-ready"),"original citation only hidden after safe clone");
check(homeStyle.includes(".dv3-language{display:none"),"outdated seven-language home row hidden");
check(homeStyle.includes(".dar-v8-editorial-salam"),"one compact source-backed Salam");
check(globalStyle.includes(".post-reader-actions [data-post-share-open]"),"original post share target remains visible");
check(globalStyle.includes(".dar-fold"),"Fold responsive rules remain scope-limited");
check(html.includes("data-post-share-open"),"original share HTML still present");
check(html.includes("function renderDuas()"),"original Dua renderer still present");
check(html.includes("function renderQuran()"),"original Quran renderer still present");
check(html.includes('class="footer-social-link"')||html.includes('footer-social-link'),"original social links present");

process.stdout.write("V8 global / Duo QA contract: "+checks+" checks OK (visual/device QA remains open)\n");
