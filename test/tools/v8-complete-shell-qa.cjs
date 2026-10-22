#!/usr/bin/env node
/* DAR TEST V8 app-shell QA: regression guard, read-only and no network.
   Run from repo root: node test/tools/v8-complete-shell-qa.cjs */
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/index.html");
const js=read("test/assets/v8-complete-app-shell-v1.js");
const css=read("test/assets/v8-complete-app-shell-v1.css");
const fold=read("test/assets/v8-duo-lab-v1.js");
const picker=read("assets/i18n/adult-language-picker-v1.js");
const originalHTML=["id=\"bottomNav\"","id=\"appView\"","data-post-share-open",
 "renderThemeSwitchPanel()","renderAppIconPanel()","renderFontSettingsPanel()",
 "renderNotificationCenter(","function renderDuas()","function renderHome()",
 "function renderQuran","function renderSettings()","function navigate(view"];
let count=0;
function test(p,m){assert.ok(p,m);count++;process.stdout.write("PASS "+m+"\n")}
new vm.Script(js,{filename:"v8-complete-app-shell-v1.js"});
new vm.Script(fold,{filename:"v8-duo-lab-v1.js"});
test(true,"both new JS modules parse");
test(js.includes("if(!/^\\/test")&&fold.includes("if (!/^\\/test"),"strict DAR TEST-only path checks");
test(!js.includes("fetch(")&&!js.includes("XMLHttpRequest"),"no app-engine/API requests added");
test(!js.includes("localStorage.setItem"),"does not change existing user settings");
test(js.includes("w.navigate(view)")&&fold.includes("w.navigate(route,value)"),"uses original router");
test(js.includes("dar-v8-rail-expanded-title")&&js.includes("dar-v8-global-secondary"),"unified wide-screen sidebar");
test(js.includes("data-v8-section-nav"),"secondary navigation forwards to original sections");
test(js.includes("v8OriginalReader"),"original reader preservation markers");
test(js.includes("DARAdultLanguagePickerV1")===false,"global shell leaves language availability to existing picker");
test(fold.includes("DARAdultLanguagePickerV1"),"Duo shell delegates language choice to existing nine-language picker");
test(js.includes("DarV8CompleteShell"),"shell public diagnostic hook present");
test(css.includes("html.dar-v8-shell"),"global styles scoped to V8 test root");
test(css.includes("body.is-home-route")&&css.includes("body.is-settings-route"),"home and settings restyled");
test(css.includes("body.is-home-route #appView #dv3Home>.dv3-language"),"old seven-language home selector hidden");
test(css.includes("data-post-share-open"),"share buttons remain visible");
test(css.includes(".quran-ayah-list")&&css.includes(".dua-detail-box")&&css.includes(".post-reader"),"reader max-width limited, text untouched");
for(const k of originalHTML)test(html.includes(k),"existing source retained: "+k);
for(const lang of ["de","ar","en","tr","ku","ckb","bs","fr","es"])
 test(picker.includes('code:"'+lang+'"'),"language in original picker: "+lang);
test(picker.includes("function available(code)"),"incomplete language packs still gated");
test(html.includes("https://t.me/dar_al_tauhid"),"Telegram link kept");
test(html.includes("whatsapp.com/channel/"),"WhatsApp link kept");
test(html.includes("instagram.com/dar_at_tawhid"),"Instagram link kept");
for(const id of ["darV8DuoLabV1CSS","darV8DuoLabV1JS","darV8CompleteAppShellCSS","darV8CompleteAppShellJS"])
 test(html.split('id="'+id+'"').length===2,"single module tag: "+id);
test(read("test/V8_DUO_LAB_ROLLBACK.md").includes("18e42c4c21f48f3d16da2759c868c33c03659629"),"one-word rollback anchored");
process.stdout.write("Passed "+count+" structural checks. Real Safari/Android/Fold E2E still required.\n");
