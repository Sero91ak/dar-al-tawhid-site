#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=x=>fs.readFileSync(path.join(root,x),"utf8");
const id="fiqh-gebetsplatz-vorbereiten",topic="Einen Gebetsplatz vorbereiten";
const V=JSON.parse(read("kids/data/academy-voice-foundation-fiqh-118-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,[id]);assert.equal(V.contexts.length,19);assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const old={id,topic,quran:{surah:2,ayah:238,arabic:"original"},hadith:{reference:"original"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:{[id]:old},DARKidsAcademyCurriculumFoundationFiqh070082094106:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-foundation-fiqh-118-v1.js"),{window:w},{filename:"foundation-fiqh-118"});
const actual=w.DARKidsAcademyCurriculum[id],meta=w.DARKidsAcademyCurriculumFoundationFiqh118;
assert.equal(meta.ageVersionCount,3);assert.equal(meta.scientificApproval,false);assert.equal(meta.audioGenerated,false);assert.equal(meta.liveApproved,false);
assert.equal(actual.id,id);assert.equal(actual.questions,old.questions);assert.equal(actual.quran,old.quran);assert.equal(actual.hadith,old.hadith);
assert.equal(actual.sourceAudit.scientificApproval,false);assert.equal(actual.sourceAudit.fiqhHumanReviewNeeded,true);
const html=read("kids/akademie/index.html");const a=html.indexOf("curriculum-foundation-fiqh-070-082-094-106-v1.js"),b=html.indexOf("curriculum-foundation-fiqh-118-v1.js");
assert.ok(a>=0&&b>a);assert.equal(html.indexOf("curriculum-foundation-fiqh-118-v1.js",b+1),-1);
const seen=new Set();
for(const age of ["4-5","6-8","9-10"]){const d=actual.ageText[age],intro=d.lines.join(" ");
 assert.equal(d.lines.length,4);assert.ok(d.goal&&d.practice&&d.situation&&d.evidence&&d.summary);
 assert.equal(d.intro,intro);assert.equal(d.audioScript,topic+". "+intro);assert.ok(!seen.has(intro));seen.add(intro);
 assert.doesNotMatch([d.goal,intro,d.situation,d.practice,d.evidence,d.summary].join(" "),/QA-Hinweis|Keine Freigabe für Besucher|Masterstimme|scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Audiotest|synthetische Rezitation/i);
 const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
 assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
 for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
}
assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,actual.ageText["4-5"].audioScript);
process.stdout.write("PASS Fiqh 118: 3 ages, 19 voice texts, old quiz+Quran preserved, scholar review held, no audio\n");
