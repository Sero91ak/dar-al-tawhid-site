#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["akhlaq-verantwortung-fuer-worte","adab-juengere-freundlich","nafs-herz-mit-guten-taten","fiqh-sujud"];
const titles={"akhlaq-verantwortung-fuer-worte":"Verantwortung für Worte übernehmen","adab-juengere-freundlich":"Jüngere freundlich behandeln","nafs-herz-mit-guten-taten":"Das Herz mit guten Taten pflegen","fiqh-sujud":"Suǧūd kennenlernen"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-195-198-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);assert.equal(voice.contexts.length,76);assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.status,"text-only-not-generated-not-approved");assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:titles[id],quran:{surah:1,ayah:1,arabic:"original"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial191194:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-195-198-v1.js"),{window:w},{filename:"editorial-195-198"});
const after=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial195198;
assert.equal(meta.ageVersionCount,12);assert.equal(meta.scientificApproval,false);assert.equal(meta.audioGenerated,false);
const html=read("kids/akademie/index.html");
const a=html.indexOf("curriculum-editorial-191-194-v1.js"),b=html.indexOf("curriculum-editorial-195-198-v1.js");
assert.ok(a>=0&&b>a);assert.equal(html.indexOf("curriculum-editorial-195-198-v1.js",b+1),-1);
for(const id of ids){const l=after[id],seen=new Set();assert.ok(l&&l.sourceAudit.scientificApproval===false);
 assert.deepEqual(l.questions,base[id].questions);assert.deepEqual(l.quran,base[id].quran);
 if(id==="fiqh-sujud")assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){const d=l.ageText[age],intro=d.lines.join(" ");assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);assert.equal(d.intro,intro);
  assert.equal(d.audioScript,titles[id]+". "+intro);assert.ok(!seen.has(intro));seen.add(intro);
  assert.doesNotMatch([d.intro,d.evidence,d.summary].join(" "),/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|scientificApproval|fiqhHumanReviewNeeded/i);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
process.stdout.write("PASS 195–198: 12 ages, 76 voice texts, original quiz/Quran preserved, sujud human Fiqh review flag, 0 audio/approvals\n");
