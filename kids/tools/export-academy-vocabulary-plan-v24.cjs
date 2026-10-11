#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const policy=JSON.parse(fs.readFileSync(path.join(ROOT,"kids/data/academy-voice-policy-v10.json"),"utf8"));
if(policy.production.modelId!=="eleven_v4"||policy.production.profile!=="kids_story"||
 policy.voiceIdentity.voiceId!=="DkU7j9uO4ZEtLD2iRZSH")throw Error("Authorized owner voice policy changed");
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"kids/akademie/term-coach-v24.js"),"utf8"),sandbox,{filename:"term-coach-v24.js",timeout:2000});
const entries=sandbox.window.DARKidsAcademyTermCoach.entries;
const ages=["4-5","6-8","9-10"];
if(entries.length!==33||new Set(entries.map(x=>x.id)).size!==33)throw Error("Glossary coverage changed without review");
const phrases=[];
for(const e of entries)for(const age of ages){
 const text=sandbox.window.DARKidsAcademyTermCoach.phrase(e,age);
 if(!text||text.length>700)throw Error("Unsupported voice phrase for "+e.id+" "+age);
 phrases.push({text,lang:"de-DE",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_v4",priority:1,
  reviewStatus:"not-generated",contexts:[{lessonId:"vocabulary-"+e.id,kind:"term-explanation",age}]});
}
const manifest={schemaVersion:1,id:"academy-vocabulary-voice-plan-v24",version:"academy-vocabulary-v24-20261011",
 voiceProfileId:"serhat-owner-voice-2026",voiceId:"DkU7j9uO4ZEtLD2iRZSH",voiceSettingsProfile:"kids_story",
 voiceName:"Serhat Abu Malik – Master",modelId:"eleven_v4",
 purpose:"Age-specific spoken explanations for 33 reviewed pedagogical concepts. No audio is generated, no clips authorized.",
 policy:{arabicQuranRecitationIsSeparate:true,autoPublishUnreviewed:false,noSyntheticFallback:true,reviewRequiredBeforePublicPlayback:true},
 termCount:entries.length,phraseCount:phrases.length,phrases};
fs.writeFileSync(path.join(ROOT,"kids/data/academy-vocabulary-voice-plan-v24.json"),JSON.stringify(manifest,null,2)+"\n","utf8");
console.log("KIDS V24 TERM VOICE PLAN: "+entries.length+" terms / "+phrases.length+" age-specific exact phrases / 0 credits.");
