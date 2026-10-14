#!/usr/bin/env node
"use strict";
/**
 * DĀR AL TAWḤĪD KIDS AKADEMI: end-to-end regression for 155–208.
 * Runs editorial overlays against an isolated 208-slot contract fixture.
 * Does NOT replace a real browser test, scholarly source review or live QA.
 * No network, no audio, no account access, no file writes.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const blocks=["155-158","159-162","163-166","167-170","171-174","175-178","179-182","183-186","187-190","191-194","195-198","199-202","203-205","206-208"];
const years=JSON.parse(read("kids-akademie/LESSON_STATUS.json")).lessons;
assert.equal(years.length,208,"year plan must retain 208 slots");
const catalog=new Map(years.map(l=>[l.lessonId,l]));
assert.equal(catalog.size,208,"every lesson ID must be unique");
const ageNames=["4-5","6-8","9-10"];
const fullIndex=read("kids/akademie/index.html");
const fakeCurriculum={};
for(const l of years){
 fakeCurriculum[l.lessonId]={
  id:l.lessonId,topic:l.topic,ageText:Object.fromEntries(ageNames.map(age=>[age,{preserved:"original"}])),
  sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:false},
  quran:{surah:0,ayah:0,label:"legacy"},
  questions:Object.fromEntries(ageNames.map(age=>[age,[{preserved:true}]])),
  progressKey:"unchanged-"+l.lessonId
 };
}
const snapshot=new Map(Object.entries(fakeCurriculum).map(([id,l])=>[id,{questions:l.questions,progressKey:l.progressKey}]));
const window={DARKidsAcademyCurriculum:fakeCurriculum,DARKidsAcademyCurriculumEditorial154:{scientificApproval:false}};
const context=vm.createContext({window});
const covered=new Set(),failures=[];
let ageDrafts=0,voiceTexts=0;
function check(cond,message){if(!cond)failures.push(message)}
for(const b of blocks){
 const file="curriculum-editorial-"+b+"-v1.js",filename="kids/akademie/"+file;
 const slot=fullIndex.indexOf(file);
 check(slot>=0,"Loader missing "+b);
 check(fullIndex.indexOf(file,slot+1)===-1,"Loader duplicated "+b);
 const voice=JSON.parse(read("kids/data/academy-voice-editorial-"+b+"-delta-v1.json"));
 const ids=voice.supersedesContextForLessonIds;
 check(Array.isArray(ids)&&ids.length>0,"IDs missing "+b);
 check(voice.status==="text-only-not-generated-not-approved","Voice generated status "+b);
 check(voice.generateCreditsUsed===0,"Unexpected voice credits "+b);
 check(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration===true,"Canonical voice merge flag "+b);
 check(voice.contexts.length===ids.length*19,"Voice count differs "+b);
 const before=window.DARKidsAcademyCurriculum;
 vm.runInContext(read(filename),context,{filename});
 const after=window.DARKidsAcademyCurriculum;
 check(after!==before,"Overlay not replacing immutable mapping "+b);
 const meta=window["DARKidsAcademyCurriculumEditorial"+b.replace("-","")];
 check(meta?.scientificApproval===false&&meta?.audioGenerated===false&&meta?.liveApproved===false,"Approval/audio flags changed "+b);
 check(meta?.ageVersionCount===ids.length*3,"Age count mismatched "+b);
 check(meta?.ids?.join("|")===ids.join("|"),"IDs/order mismatched "+b);
 for(const id of ids){
  check(catalog.has(id),"Unexpected lesson "+id);
  check(!covered.has(id),"Duplicate lesson overlay "+id);
  covered.add(id);
  const l=after[id],original=snapshot.get(id),seen=new Set();
  check(l?.sourceAudit?.scientificApproval===false,"Approved draft "+id);
  check(l?.questions===original?.questions,"Quiz changed "+id);
  check(l?.progressKey===original?.progressKey,"Progress key changed "+id);
  for(const age of ageNames){
   ageDrafts++;
   const d=l?.ageText?.[age];if(!d){failures.push("Missing age "+id+"/"+age);continue}
   check(d.lines?.length===4,"Wrong number of teaching paragraphs "+id+"/"+age);
   check(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary,"Incomplete teaching "+id+"/"+age);
   const intro=d.lines.join(" ");
   check(d.intro===intro,"Intro mismatch "+id+"/"+age);
   check(d.audioScript===l.topic+". "+intro,"Narration mismatch "+id+"/"+age);
   check(!seen.has(intro),"Age versions identical "+id+"/"+age);seen.add(intro);
   check(!/scientificApproval|fiqhHumanReviewNeeded|Keine Freigabe für Besucher|Masterstimme|QA-Hinweis|Audiotest|Staging|Debug/i.test([d.intro,d.goal,d.evidence,d.practice,d.situation,d.summary].join(" ")),"Internal developer text leaked "+id+"/"+age);
   const c=voice.contexts.filter(x=>x.lessonId===id&&x.age===age);
   check(c.length===6,"Wrong context count "+id+"/"+age);
   check(c.find(x=>x.kind==="intro")?.text===intro,"Voice intro differs "+id+"/"+age);
   check(c.find(x=>x.kind==="audio")?.text===d.audioScript,"Voice audio script differs "+id+"/"+age);
   d.lines.forEach((line,i)=>check(c.some(x=>x.kind==="line"&&x.index===i&&x.text===line),"Voice line differs "+id+"/"+age+"/"+i));
  }
  const c=voice.contexts.filter(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary");
  check(c.length===1&&c[0].text===l.ageText["4-5"].audioScript,"Voice summary differs "+id);
 }
 voiceTexts+=voice.contexts.length;
}
check(covered.size===54,"Expected 54 individual new lessons but got "+covered.size);
check(ageDrafts===162,"Expected 162 individual new ages but got "+ageDrafts);
check(voiceTexts===1026,"Expected 1,026 ungenerated contexts but got "+voiceTexts);
const fiqh=["fiqh-zum-gebet-stehen","fiqh-takbirat-al-ihram","fiqh-quran-rezitation-im-gebet","fiqh-ruku-kennenlernen","fiqh-aus-dem-ruku-aufrichten","fiqh-sujud","fiqh-zwischen-niederwerfungen-sitzen","fiqh-tashahhud","fiqh-taslim","fiqh-fehler-beim-ueben","fiqh-ramadan-fasten","fiqh-zakah-und-hajj"];
fiqh.forEach(id=>check(window.DARKidsAcademyCurriculum[id]?.sourceAudit?.fiqhHumanReviewNeeded===true,"Fiqh human review missing "+id));
check(window.DARKidsAcademyCurriculum["iman-sechs-glaubenssaeulen"].quran.label==="Qurʾān 2:285","Corrected verse label 2:285");
check(window.DARKidsAcademyCurriculum["adab-aeltere-respektvoll"].quran.label==="Qurʾān 17:23–24","Corrected verse label 17:23-24");
check(window.DARKidsAcademyCurriculum["nafs-istighfar"].quran.label==="Qurʾān 71:10","Corrected verse label 71:10");
if(failures.length){console.error("FAIL "+failures.length+" conditions\n"+failures.join("\n"));process.exitCode=1}
else console.log("PASS: 14 modules / 54 lessons / 162 age drafts / 1026 ungenerated voice texts / 12 Fiqh review guards / unchanged quizzes and progress / zero approvals.");
