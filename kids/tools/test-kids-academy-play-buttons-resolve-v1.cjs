#!/usr/bin/env node
"use strict";
/* Visible academy play buttons must resolve to a real on-disk master clip
 * (or a real Qurʾān recitation track). The intro control stays hidden when
 * no clip exists. A missing helper must never abort playback. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("kids/akademie/index.html");
assert.ok(!page.includes("pauseVoiceClip("),
  "Intro playback must not call the undefined pauseVoiceClip helper");
assert.ok(page.includes('id="academySerhatLead"')&&page.includes("▶ Anhören"));
assert.ok(page.includes("function playSerhatLessonClip()"));
assert.match(page,/speak\(step,\[t\]\)|owner\.play\(t,/);

const sandbox=vm.createContext({window:{},console});
const scripts=[
  "kids/akademie/curriculum-v1.js",
  "kids/akademie/curriculum-v2.js",
  "kids/akademie/curriculum-v22.js",
  "kids/akademie/curriculum-v25.js",
  "kids/akademie/curriculum-v26.js",
  "kids/akademie/curriculum-v27.js",
  "kids/akademie/curriculum-v28.js",
  "kids/akademie/curriculum-v29.js",
  "kids/akademie/answer-choice-only-v1.js"
];
for(const rel of scripts){
  vm.runInContext(read(rel),sandbox,{filename:rel});
}
const curriculum=sandbox.window.DARKidsAcademyCurriculum||{};
const pub=JSON.parse(read("kids/data/academy-audio.json"));
const entries=pub.entries||{};
function playable(text){
  const key=String(text||"").normalize("NFC").replace(/\s+/g," ").trim();
  if(!key)return null;
  const rec=entries[key]||entries[text];
  if(!rec||!rec.url)return null;
  if(rec.voiceId!=="DkU7j9uO4ZEtLD2iRZSH"||rec.modelId!=="eleven_v4")return null;
  if(rec.approvedForPlayback!==true)return null;
  const file=path.join(root,String(rec.url).split("?")[0].replace(/^\//,""));
  if(!fs.existsSync(file)||fs.statSync(file).size<800)return null;
  return {key,url:rec.url,file};
}

const ages=["4-5","6-8","9-10"];
const visibleBroken=[];
const hiddenOk=[];
let shownIntro=0;
for(const [id,lesson] of Object.entries(curriculum)){
  const lead=String(lesson.lead||"").trim();
  if(!lead)continue;
  const rec=playable(lead);
  if(rec){
    shownIntro++;
  }else{
    hiddenOk.push({id,lead});
  }
}
const morgen=curriculum["adab-morgen-dhikr"];
assert.ok(morgen,"Morgen-Dhikr lesson missing from curriculum");
assert.equal(morgen.lead,"Am Morgen erinnern wir uns an Allah.");
assert.ok(playable(morgen.lead),"Morgen-Dhikr intro clip must exist on disk and be approved for playback");

// Age-specific explain lines / evidence (curriculum ageText or top-level)
function agePack(lesson,age){
  return (lesson.ageText&&lesson.ageText[age])||(lesson.ages&&lesson.ages[age])||lesson;
}
for(const [id,lesson] of Object.entries(curriculum)){
  for(const age of ages){
    const pack=agePack(lesson,age);
    const lines=[].concat(pack.lines||pack.explain||[]);
    const evidence=pack.evidence||"";
    const recap=[].concat(pack.recap||[]);
    // "Erklärung anhören" plays explain lines. If the button is visible (always
    // on step 2), at least one line must resolve when lines exist.
    const resolved=lines.map(playable).filter(Boolean);
    if(lines.length&&resolved.length===0){
      visibleBroken.push({id,age,kind:"explain-all-missing",sample:lines[0]});
    }
  }
}
assert.equal(visibleBroken.length,0,
  "Visible explanation play buttons have no audio:\n"+visibleBroken.slice(0,8).map(x=>JSON.stringify(x)).join("\n"));
assert.ok(shownIntro>=1,"Expected at least one lesson intro clip, including Morgen-Dhikr");
console.log(JSON.stringify({
  status:"PASS",
  shownIntroButtonsWithAudio:shownIntro,
  introHiddenBecauseNoClip:hiddenOk.length,
  morgenDhikrLeadResolved:true
}));
