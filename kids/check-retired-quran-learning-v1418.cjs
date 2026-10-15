#!/usr/bin/env node
"use strict";
/* TAWḤĪD KIDS — Quran/Alif-Ba learning retirement regression checks V1418.
   Keep Quran references inside Du'a, Academy, Quiz and story sources untouched.
   Archived child progress remains untouched, while no Quran practice launches. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("kids/index.html"),sw=read("kids/sw.js"),manifest=JSON.parse(read("kids/version.json"));
for(const page of ["kids/shell.html","kids/start.html"])assert.equal(html,read(page),"Three official KIDS shells must remain identical");
const forbidden=[
  /<button[^>]*data-go="quran"/,/<button[^>]*data-target="quran"/,
  /<section[^>]*id="view-quran"/,/<div[^>]*id="quranModal"/,
  /<div[^>]*id="fullQuranModal"/,/<audio[^>]*id="quranAudio"/,
  /<audio[^>]*id="recitationPlaybackAudio"/,/<button[^>]*id="quickLearn112"/,
  /<button[^>]*id="resumeQuran"/,/<div[^>]*id="parentQuranResume"/
];
for(const pattern of forbidden)assert.ok(!pattern.test(html),"Retired lesson UI resurrected: "+pattern);
assert.ok(html.includes("const KIDS_QURAN_LEARNING_REMOVED=true"),"No authoritative retired feature guard");
assert.ok(html.includes('if(name==="quran"||name==="alphabet")name="today"'),"Legacy links must route safely to Home");
assert.ok(html.includes('if(step==="quran"){showTab("today");return}'),"Legacy daily lesson must not reopen");
assert.ok(html.includes("if(KIDS_QURAN_LEARNING_REMOVED)return;"),"Old Quran lesson entry points must be blocked");
assert.ok(html.includes('var q=null; // Archived Qur'),"Home resume must not reopen removed lessons");
assert.ok(!html.includes('fetchKidsQuiz();fetchCatalog();'),"Removed Quran catalog must not fetch on launch");
assert.ok(html.includes('data-target="stories"')&&html.includes('data-go="salaf"')&&
  html.includes('data-target="parents"')&&html.includes('data-target="dua"')&&
  html.includes('data-academy-open="1"')&&
  html.includes('id="openQuizButton"')&&html.includes('id="openDuaButton"'),
  "Other child areas (Salaf, Du'a, Academy, Quiz and Parents) must remain accessible");
assert.equal(manifest.quranLearningEnabled,false);
assert.equal(manifest.quranLearningRuntimeRemoved,true);
assert.equal(manifest.alifBaRuntimeRemoved,true);
assert.equal(manifest.quranLearningArchivedUserProgressRetained,true);
assert.equal(manifest.visualSystem.alphabetEnabled,false);
const expectedCache="dar-al-tawhid-kids-"+String(manifest.visualSystem.serviceWorkerCache||"");
assert.equal(sw.includes(expectedCache),true,"KIDS SW cache must match the published release version without resetting profile data");
assert.ok(!sw.includes('/kids/assets/kids-art/quran-surahs-v1053.jpg'),"Do not precache retired art");
let inline=0;
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
 if(!m[1].trim())continue;
 new vm.Script(m[1],{filename:"kids/index.html:inline-script-"+(++inline)});
}
assert.ok(inline>0,"Expected to parse inline Kids runtime");
// The Duʿāʾ hub owns the Home boy/girl avatar, account avatars and its own tab.
// It must NEVER wait for the removed Qurʾān section to initialize.
const duaHub=read("kids/dua-hub-v1219.js");
assert.ok(!/q\(["\x27]#view-quran["\x27]\)/.test(duaHub),"Duʿāʾ/avatar startup still depends on retired Qurʾān view");
assert.ok(duaHub.includes('const parents = q("#view-parents");') &&
  duaHub.includes("parents.parentNode.insertBefore(view, parents);"),"Duʿāʾ tab not anchored before Eltern");
assert.ok(duaHub.includes("enhanceHeaderProfile();") && duaHub.includes("enhanceProfileCard();") &&
  duaHub.includes("enhanceJoinChoices();"),"Boy/girl profile UI must remain initialized");
assert.ok(duaHub.includes("boy-kufi-v1235.svg") && duaHub.includes("girl-hijab-pink-v1235.svg"),"Profile avatar sources must be preserved");
assert.ok(html.includes('class="profile-dot"') && html.includes('id="profileList"'),"Home/parent profile mount points missing");
assert.ok(html.includes('/kids/dua-hub-v1219.js?v=1421'),"New profile runtime must bust installed PWA cache");
assert.ok(sw.includes('"/kids/dua-hub-v1219.js?v=1421"') &&
  sw.includes('url.pathname==="/kids/dua-hub-v1219.js"'),"New avatar runtime must work online/offline");
require("./check-ui-contract-v1420.cjs");
console.log("PASS KIDS V1418: Quran/Alif-Ba learning UI retired, legacy routes blocked, other modules preserved; parsed "+inline+" inline scripts");
