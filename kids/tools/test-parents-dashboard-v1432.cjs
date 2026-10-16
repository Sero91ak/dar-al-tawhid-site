#!/usr/bin/env node
"use strict";
/* KIDS_PARENTS_DASHBOARD_V1432 — no destructive data/layout regressions. */
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const html=read("kids/index.html");
assert.equal(html,read("kids/start.html"),"3 entrypoints: start");
assert.equal(html,read("kids/shell.html"),"3 entrypoints: shell");
const js=read("kids/parents-dashboard-v1432.js");
const css=read("kids/parents-dashboard-v1432.css");
const sw=read("kids/sw.js");
const offline=read("kids/offline-library-v1.js");
const birth=read("kids/kids-birth-month-v1431.js");
assert.doesNotThrow(()=>new Function(js),"parent JS syntax");
assert.doesNotThrow(()=>new Function(sw),"SW syntax");
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"parent CSS valid brace structure");
for(const asset of ["parents-dashboard-v1432.js?v=1440","parents-dashboard-v1432.css?v=1435"])
  assert(html.includes(asset)&&sw.includes(asset),"parent dashboard assets published and precached: "+asset);
const releaseCache=String(JSON.parse(read("kids/version.json")).visualSystem.serviceWorkerCache||"").replace(/^v/,"");
assert(html.includes('navigator.serviceWorker.register("/kids/sw.js?v='+releaseCache+'"'),"main app must register newest offline cache");
assert(sw.includes("dar-al-tawhid-kids-v"+releaseCache),"SW cache version");
assert(html.lastIndexOf("parents-dashboard-v1432.css")>html.lastIndexOf("kids-girl-palette-authority-v1427.css"),"dashboard style must be last");
for(const id of ["parentBirthSave","parentBirthPanel","minuteSlider","parentStoriesDone",
 "parentDuasDone","parentQuizCorrect","parentTodayDone","profileList","profileAdd","profileBring","profileAsk"]){
 assert(html.includes('id="'+id+'"'),"existing parent element removed: "+id);
}
for(const marker of ["kids-parent-overview","kidsParentName","kidsParentManage","kidsParentAccounts",
 "kidsParentOffline","kidsParentBirthFold","kidsParentCurrentAge"]){
 assert(js.includes(marker),"parent dashboard lacks "+marker);
}
assert(js.includes("accountDetails.scrollIntoView"),"Manage account button must navigate to controls");
assert(js.includes("arrangeOffline"),"offline library must be after age settings");
assert(js.includes("new MutationObserver"),"late-loaded offline library must be handled");
assert(js.includes("birthFold.open=false"),"birth detail must collapse after validated save");
assert(js.includes("birthSave.disabled"),"birth save validation missing");
for(const marker of ["#parentBirthSave",".app[data-gender=\"girl\"]","#kidsParentIdentityMeta",
 ".age-tabs[hidden]","#kidsParentStorySettings"]){
 assert(css.includes(marker),"scoped parent styling missing "+marker);
}
assert(css.includes("-webkit-text-fill-color:#432d48!important"),
 "girl save button may have unreadable pale text in iOS");
assert(css.includes("-webkit-text-fill-color:#243744!important"),
 "boy save button may have unreadable pale text in iOS");
assert(js.includes("textContent=display"),"child profile name must be escaped, not HTML inserted");
assert(!js.includes("localStorage.setItem("),"parent dashboard must not rewrite profiles, ages or learning states");
assert(!js.includes("kids_login")&&!js.includes("kids_register")&&!js.includes("kids_save"),
 "parent dashboard must not change account RPC flow");
assert(offline.includes('id="kidsOfflineLibrary"')||offline.includes('panel.id="kidsOfflineLibrary"'),
 "offline downloader still available");
assert(offline.includes('KIDS_OFFLINE_START'),"offline download flow unchanged");
assert(birth.includes('dar.kids.birthMonth.v1.'),"local-only birth month source preserved");
/* V1435: the reference mock's visual design is NEVER imported into the visitor app.
   All real interactions delegate to the existing parents/auth/story controls. */
for(const marker of ["KIDS_FAMILY_STRUCTURE_V1435","kidsParentFamilyGrid","kidsParentFamilyCount",
  "kidsParentResume","kidsParentResumeOpen","profilesOnDevice()",
  "renderFamily()","renderLastStory()","target.click()","data-target=\"stories\""]){
 assert(js.includes(marker),"family structure missing "+marker);
}
assert(js.includes('$("#profileAdd")?.click()'),"add-child entry must reuse existing flow");
assert(js.includes('$("#kidsParentManage")?.click()'),"all-children action must open existing controls");
assert(js.includes('item.completed===true?"↺ Erneut hören":"▶ Weiterhören"'),
 "completed recordings are explicitly labeled for replay, not continue");
assert(js.includes("window.DARKidsStoryHub.openResume(item.category,item.id,"),
 "recent story must reuse real Story Hub resume API, not only open Hörbereich");
assert(js.includes("window.addEventListener(\"dar-kids-story-resume\",renderLastStory)"),
 "parent recent playback must update while the app is open");
assert(js.includes("progressPanel.after(resume)")&&js.includes("resume.after(timePanel)"),
 "app activity must be its own card, separate from family administration");
for(const id of ["kidsParentResumeArt","kidsParentResumePosition","kidsParentResumeProgress",
 "kidsParentResumeProgressBar","kids-parent-activity-eyebrow"]){
 assert(js.includes(id),"missing real listening activity component "+id);
}
assert(!js.includes("familienkonto-vorschau"),"mockup must never load inside production");
assert(!js.includes("resetPasswordForEmail"),"password reset must not be displayed before an authenticated backend exists");
for(const token of ["KIDS_FAMILY_STRUCTURE_V1435","var(--kp-card)","var(--kp-raised)",
  "var(--kp-accent)","#view-parents .kids-parent-family-grid",
  "#view-parents .kids-parent-resume[hidden]"]){
 assert(css.includes(token),"existing theme family CSS missing "+token);
}
assert(miniStyle.includes("KIDS_PARENT_APP_ACTIVITY_V1440")&&
 miniStyle.includes("#view-parents #kidsParentResume.kids-parent-resume"),
 "prominent app activity styling must inherit boy/girl parent palette");
assert(!css.includes("TAWHID-KIDS-Elternkonto-Vorschau"),
 "standalone preview style must not enter main app");

/* V1440: inline timer belongs to existing Learn tab (no floating overlay) and only parents
 * can Start, Pause, Stop or Reset. Foreground time never leaks into background. */
const miniTimer=read("kids/parents-compact-timer-v1436.js");
const miniStyle=read("kids/parents-compact-timer-v1436.css");
assert.doesNotThrow(()=>new Function(miniTimer),"Mini timer JavaScript syntax");
assert.ok(html.includes("/kids/parents-compact-timer-v1436.js?v=1440")&&
  html.includes("/kids/parents-compact-timer-v1436.css?v=1440"),"Mini timer scripts published");
assert.ok(sw.includes("/kids/parents-compact-timer-v1436.js?v=1440")&&
  sw.includes("/kids/parents-compact-timer-v1436.css?v=1440"),"Mini timer offline cache");
for(const marker of ['.kids-academy-tab','learnTab.append(pill)','lessonTab.classList.toggle("kids-timer-inline-tab",show)',
 'document.hidden','window.addEventListener("pagehide",pauseActive',
 'window.addEventListener("blur",pauseActive',
 'function stopTimer()','function resetTimer()','function playPause()',
 'slider.addEventListener("input"','minuteValue.textContent=state.duration+" Min."',
 'if(old.running)save()']){
 assert.ok(miniTimer.includes(marker),"Mini timer contract missing "+marker);
}
assert.ok(!miniTimer.includes('id="kidsTimerToggle1436"'),"Inline timer must not contain Pause/Stop controls");
assert.ok(!miniTimer.includes("kids-timer-dome-active")&&!miniStyle.includes("KIDS_UNIFIED_TIMER_DOME_V1439"),
 "old half-dome must be completely absent from the visitor app");
assert.ok(miniTimer.includes('pill.setAttribute("role","status")')&&
 miniStyle.includes('.kids-academy-tab.kids-timer-inline-tab'),
 "only a non-interactive status in the real Lernen tab, no overlay");
assert.ok(miniStyle.includes("KIDS_INLINE_LEARN_STATUS_V1440")&&
 miniStyle.includes("#view-parents .kids-parent-time-card #minuteValue")&&
 miniStyle.includes('html body .app[data-gender="girl"] > .bottom-nav .kids-academy-tab > #kidsLearningTimer1436'),
 "Mini timer profile styling or parent slider presentation missing");

console.log("KIDS_PARENTS_DASHBOARD_V1432_OK: 3 shells, color contrast, folds, profiles, existing actions, offline");
