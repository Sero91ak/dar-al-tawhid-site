#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["tawhid-im-alltag","iman-bemuehen-und-vertrauen","akhlaq-unterschiedliche-menschen","adab-trinken-mit-guten-sitten"];
const titles={"tawhid-im-alltag":"Tawḥīd im Alltag","iman-bemuehen-und-vertrauen":"Bemühen und Allah vertrauen","akhlaq-unterschiedliche-menschen":"Unterschiedliche Menschen respektieren","adab-trinken-mit-guten-sitten":"Trinken mit guten Sitten"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-175-178-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.status,"text-only-not-generated-not-approved");
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:titles[id],quran:{surah:1,ayah:1,arabic:"original"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial171174:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-175-178-v1.js"),{window:w},{filename:"editorial-175-178"});
const next=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial175178;
assert.equal(meta.ageVersionCount,12);
assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);
const index=read("kids/akademie/index.html");
const a=index.indexOf("curriculum-editorial-171-174-v1.js"),b=index.indexOf("curriculum-editorial-175-178-v1.js");
assert.ok(a>=0&&b>a);
assert.equal(index.indexOf("curriculum-editorial-175-178-v1.js",b+1),-1);
for(const id of ids){
 const l=next[id],seen=new Set();
 assert.ok(l&&l.sourceAudit.scientificApproval===false);
 assert.equal(l.questions,base[id].questions,"quiz unchanged");
 assert.equal(l.quran,base[id].quran,"Quran original unchanged");
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.practice&&d.evidence&&d.situation&&d.summary);
  assert.equal(d.intro,intro);
  assert.equal(d.audioScript,titles[id]+". "+intro);
  assert.ok(!seen.has(intro));seen.add(intro);
  assert.doesNotMatch(intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe/i);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 175–178 / 12 age drafts / 76 ungenerated contexts / unchanged Quran/quiz / safe loader\n");
