#!/usr/bin/env node
"use strict";
/* Non-billable KIDS creator editorial QA. Reads only files and never touches child profiles.
 * Deliberately does NOT deploy, generate paid voice, or publish drafts.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const p=[
 "kids/akademie/curriculum-v1.js",
 "kids/akademie/curriculum-v2.js",
 "kids/akademie/curriculum-v22.js",
 "kids/creator-test/lessons-039-044.js",
 "kids/creator-test/lessons-045-052.js",
 "kids/creator-test/lessons-053-056.js",
 "kids/creator-test/term-glossary-v1.js",
 "kids/creator-test/academy-narration-script-v1.js"
];
const rootWindow={},context=vm.createContext({window:rootWindow});
for(const file of p)new vm.Script(read(file),{filename:file}).runInContext(context);
const catalog=rootWindow.DARKidsAcademyCurriculum,gloss=rootWindow.DARKidsAcademyTermsV1,voice=rootWindow.DARKidsAcademyNarrationV1;
assert.ok(catalog&&gloss&&voice);
assert.equal(Object.keys(catalog).length,55,"55 curriculum files + separate ṣidq foundation = 56 editorial entries");
const ids=[...rootWindow.DARKidsAcademyCreatorDraftsV23.ids,...rootWindow.DARKidsAcademyCreatorDraftsV24.ids,...rootWindow.DARKidsAcademyCreatorDraftsV25.ids];
assert.equal(ids.length,18);
assert.equal(new Set(ids).size,18);
assert.equal(Object.keys(gloss.terms).length,36);
const roadmap=JSON.parse(read("kids/creator-test/yearly-curriculum-roadmap-v1.json"));
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
assert.equal(year.weeks.length,52);assert.equal(roadmap.plannedSlots.length,170);
assert.equal(year.goals.currentlyInCatalog,38);assert.equal(year.goals.testDraftsNotApproved,18);
let questionCount=0;
for(let slot=39;slot<=56;slot++){
 const item=roadmap.plannedSlots.find(x=>x.slot===slot);
 assert.ok(item&&item.draftLessonId&&item.status==="SOURCE_CHECKED_DRAFT_NOT_APPROVED",String(slot));
 assert.equal(item.completedLesson,false);assert.equal(item.visitorReleased,false);
 assert.equal(item.masterVoiceApproved,false);assert.equal(item.previewPassed,false);
 const lesson=catalog[item.draftLessonId];assert.ok(lesson,String(slot));
 assert.equal(lesson.editorialSlot,slot);
 assert.equal(lesson.audioApproved,false);assert.equal(lesson.visitorReleased,false);
 assert.equal(lesson.quran.excerpt,true);
 assert.match(lesson.sourceAudit.quranUrl,/^https:\/\/quran\.com\/\d+\/\d+$/);
 assert.match(lesson.sourceAudit.hadithUrl,/^https:\/\/dorar\.net\/(?:hadith\/sharh\/\d+|h\/[A-Za-z0-9]+)$/);
 assert.ok(lesson.hadith.source.includes("Nr."),"source must name book and number");
 for(const age of ["4-5","6-8","9-10"]){
  const tx=lesson.ageText[age],quiz=lesson.questions[age];
  assert.equal(tx.lines.length,4,slot+":"+age);
  assert.ok(tx.intro&&tx.activity&&tx.evidence);
  assert.ok(quiz.length>=2,slot+":"+age);
  if(age==="4-5"){
   assert.ok(tx.lines.every(line=>line.length<=90),"Too long child sentence: "+slot);
   assert.ok(quiz.every(q=>q.type==="choice"),"No free text for preschool");
  }
  for(const q of quiz){
   assert.ok(q.prompt?.length>=12,"Missing question "+slot);
   if(q.type==="choice"){
    assert.ok(Array.isArray(q.options)&&q.options.length===2,"Must have 2 options");
    assert.equal(q.correct,0,"Stable answer metadata; UI may shuffle only if adapted");
   }else assert.ok(q.type==="text"&&q.sample,"Text answer needs reference explanation");
   questionCount++;
  }
  const spoken=voice.build(lesson,age);
  assert.ok(spoken.text.includes(tx.intro),"Master narration must contain age-specific intro");
  assert.ok(spoken.text.includes(tx.lines[0]),"Master narration must contain age-specific lesson lines");
  assert.equal(spoken.audioApproved,false);assert.equal(spoken.readyForVoiceGeneration,false);
  assert.ok(spoken.explainedTerms.length<=6);
  assert.ok(spoken.text.length>=100);
 }
}
assert.equal(questionCount,144);
for(let slot=57;slot<=208;slot++){
 const item=roadmap.plannedSlots.find(x=>x.slot===slot);
 assert.ok(item&&item.status==="THEMATIC_PLAN_ONLY");
 assert.equal(item.completedLesson,false);
}
const html=read("test/kids/akademie/index.html");
assert.ok(html.includes("NUR ERSTELLERPRÜFUNG"));
for(const asset of p.slice(3))assert.ok(html.includes("/"+asset),"creator asset missing: "+asset);
assert.ok(!html.includes("localStorage")&&!html.includes("indexedDB"));
const inline=html.split("<script>").at(-1).split("</script>")[0];
new vm.Script(inline,{filename:"creator-test-html-inline"});
const worker=read("kids/creator-test/worker.js");
assert.ok(worker.includes('creator-test|tools'),"no direct public editorial asset access");
console.log(JSON.stringify({passed:true,existingHistorical:38,newDrafts:18,ageVersions:54,quizQuestions:144,glossaryTerms:36,annualSlots:208,remainingUnwritten:152,masterAudioGenerated:0,visitorPublished:0,delivery:"git-staging-editorial-only; worker restricted"},null,2));
