#!/usr/bin/env node
"use strict";
/* Exact dynamic voice catalog of the 65 existing non-Ṣidq Kids Academy lessons.
   Zero credits, no mutation of lesson source, no public release.
   Uses the same actual JS display-order shuffle as the Kids app.
*/
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const files=["curriculum-v1.js","curriculum-v2.js","curriculum-v22.js",
 "curriculum-v25.js","curriculum-v26.js","curriculum-v27.js","curriculum-v28.js","curriculum-v29.js"];
const world={window:{},console};
const ctx=vm.createContext(world);
for(const filename of files){
 vm.runInContext(read("kids/akademie/"+filename),ctx,{filename,timeout:5000});
}
vm.runInContext(read("kids/akademie/answer-choice-only-v1.js"),ctx,{filename:"answer-choice-only-v1.js",timeout:5000});
const html=read("kids/akademie/index.html");
const start=html.indexOf('function academyDisplayChoices(q,index,lessonScope=""){');
const end=html.indexOf("\nfunction showQuestion(){",start);
assert.ok(start>=0&&end>start,"Actual Academy visible-answer function not found");
const sandbox=vm.createContext({});
const display=vm.runInContext(html.slice(start,end)+"\nacademyDisplayChoices;",sandbox,{timeout:5000});
const lessons=world.window.DARKidsAcademyCurriculum||{};
const project=world.window.DARKidsAcademyChoiceOnlyV1?.project;
assert.equal(typeof project,"function");
assert.equal(Object.keys(lessons).length,65,"Expected 65 existing non-Ṣidq lessons");
const ages=["4-5","6-8","9-10"];
const risky=/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFFṢṣḤḥḌḍṬṭḎḏṮṯẒẓĀāŪūĪīʿʾ]/u;
const rows=new Map(),excludedArabic=[],sourceReviewNeeded=[],questionsByAge=Object.fromEntries(ages.map(a=>[a,0]));
const clean=s=>String(s||"").normalize("NFC").replace(/\s+/g," ").trim();
function add(raw,lessonId,kind,age="all",questionIndex=null){
 const text=clean(raw);
 if(!text)return;
 if(text.length>700)throw Error("Phrase >700 chars: "+lessonId+" "+kind);
 if(/[\u0600-\u06ff]/u.test(text)){
  excludedArabic.push({lessonId,kind,age,reason:"native_arabic_text_requires_human_quran_hadith_decision"});
  return;
 }
 const priority=kind==="welcome"||kind==="narration"||kind==="evidence"||kind==="recap"?1:kind==="question"?2:3;
 let row=rows.get(text);
 if(!row){
  row={text,sha256:crypto.createHash("sha256").update(text).digest("hex"),
    modelId:"eleven_v4",voiceId:"DkU7j9uO4ZEtLD2iRZSH",
    voiceSettingsProfile:"kids_story",priority,reviewStatus:"not-generated",
    pronunciationReviewRequired:risky.test(text),
    contexts:[]};
  rows.set(text,row);
 }
 row.priority=Math.min(row.priority,priority);
 const context={lessonId,kind,age};
 if(questionIndex!==null)context.questionIndex=questionIndex;
 if(!row.contexts.some(c=>JSON.stringify(c)===JSON.stringify(context)))row.contexts.push(context);
}
for(const [id,lesson] of Object.entries(lessons)){
 assert.equal(lesson.id,id);
 assert.ok(lesson.quran?.surah&&lesson.quran?.ayah&&lesson.quran?.meaning&&lesson.hadith?.text);
 const sourceApproved=Boolean(lesson.sourceAudit);
 if(!sourceApproved)sourceReviewNeeded.push(id);
 add(lesson.lead,id,"narration");
 add(lesson.goal,id,"recap");
 add(lesson.sample,id,"recap");
 add(lesson.quran.meaning+" "+lesson.hadith.text,id,"recap");
 add(lesson.hadith.text,id,"hadith-de");
 for(const age of ages){
  const a=lesson.ageText?.[age]||null;
  const intro=a?.intro||(lesson.lead+" "+lesson.goal);
  add(intro,id,"welcome",age);
  const lines=a?.lines||lesson.lines||[];
  if(lines.length!==4)throw Error("Missing four teaching lines "+id+" "+age);
  for(const line of lines)add(line,id,"narration",age);
  const evidence=a?.evidence||("Qurʾān: "+lesson.quran.meaning+" Sunnah: "+lesson.hadith.text);
  add(evidence,id,"evidence",age);
  const orig=lesson.questions?.[age]||[];
  const questions=project(lesson,age,orig);
  if(!questions.length)throw Error("No quiz: "+id+" "+age);
  for(const [index,q] of questions.entries()){
   if(q.type!=="choice"||q.needsHumanEditorialReview||q.approvedForAudio===false||
      !Number.isInteger(q.correct)||!Array.isArray(q.options)||q.correct<0||q.correct>=q.options.length)
     throw Error("Question requires editorial review before recording "+id+"/"+age+"/"+index);
   questionsByAge[age]++;
   add(q.prompt,id,"question",age,index);
   const visible=display(q,index,id+":"+age);
   if(visible.length!==q.options.length)throw Error("Visible answer count mismatch "+id);
   visible.forEach(({text,originalIndex},visibleIndex)=>{
    assert.equal(text,q.options[originalIndex],"Actual app answer shuffle mismatch");
    add("Antwort "+(visibleIndex+1)+": "+text,id,"answer",age,index);
   });
   add(q.hint,id,"hint",age,index);
   add(q.explain,id,"explanation",age,index);
  }
 }
}
const raw=[...rows.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"));
const safe=raw.filter(r=>!r.pronunciationReviewRequired);
const term=raw.filter(r=>r.pronunciationReviewRequired);
const out={
 schemaVersion:1,id:"TAWHID_KIDS_65_EXISTING_LESSONS_V32_VOICE_CATALOG",
 source:"all eight live Kids Academy curriculum-v*.js + active display-order algorithm",
 lessonCount:Object.keys(lessons).length,ageVersions:Object.keys(lessons).length*ages.length,
 ageKeys:ages,questions:questionsByAge,questionCount:Object.values(questionsByAge).reduce((a,b)=>a+b,0),
 voiceId:"DkU7j9uO4ZEtLD2iRZSH",voiceProfile:"kids_story",modelId:"eleven_v4",
 counts:{uniqueExactPhrases:raw.length,germanSafeCandidates:safe.length,
   arabicTermPronunciationReview:term.length,sourceAuditMissingLessons:sourceReviewNeeded.length,
   nativeArabicExcluded:excludedArabic.length,approvedForPublicPlayback:0},
 audit:{lessonsMissingSourceAudit:sourceReviewNeeded,excludedArabic,
   curriculumIsChildApproved:false,
   sourceReviewRequiredBeforePaidProductionOfUnreviewedLessons:true},
 policy:{productionNotStarted:true,requiresHumanListening:true,neverSyntheticQuranRecitation:true,
   noPublicDeploy:true,displayOrderAnswerAudio:true,existingṢidq80StageKeptSeparate:true},
 phrases:raw
};
assert.equal(out.ageVersions,195);
assert.equal(out.questionCount,520);
const destination=path.join(root,"kids/data/academy-65-lessons-v32-voice-catalog.json");
const encoded=JSON.stringify(out,null,2)+"\n";
if(process.argv.includes("--write"))fs.writeFileSync(destination,encoded);
else if(process.argv.includes("--check"))assert.equal(fs.readFileSync(destination,"utf8"),encoded,"V32 voice catalog differs from actual first-party source");
else console.log(JSON.stringify({lessonCount:out.lessonCount,ageVersions:out.ageVersions,
  questionCount:out.questionCount,counts:out.counts,missingSourceAudit:sourceReviewNeeded.slice(0,15)},null,2));
console.log("KIDS V32 catalog: exact visible-order recording queue; zero ElevenLabs credits.");
