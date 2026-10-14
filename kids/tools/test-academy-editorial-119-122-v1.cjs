"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const ids=[
 "quran-arabisch-und-uebersetzung",
 "sirah-muhammad-barmherziger-lehrer",
 "dua-in-schwierigen-momenten",
 "family-gemeinsam-in-der-moschee"
],ages=["4-5","6-8","9-10"];
const base={};
for(const id of ids)base[id]={
 id,topic:id,quran:{arabic:"PRESERVE_ARABIC"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},
 sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:false,keep:"SOURCE_AUDIT"},
 ageText:Object.fromEntries(ages.map(a=>[a,{goal:"OLD",intro:"OLD",lines:["OLD"],audioScript:"OLD",terms:["PRESERVE_TERMS"]}]))
};
const sandbox={window:{
 DARKidsAcademyCurriculum:Object.freeze(base),
 DARKidsAcademyCurriculumV44:{version:"stub-predecessor"}
}};
const js=fs.readFileSync(path.join(root,"kids/akademie/curriculum-editorial-119-122-v1.js"),"utf8");
vm.runInNewContext(js,sandbox,{filename:"curriculum-editorial-119-122-v1.js"});
const after=sandbox.window.DARKidsAcademyCurriculum;
assert.equal(sandbox.window.DARKidsAcademyCurriculumEditorial119122.ageVersionCount,12);
assert.equal(Object.keys(after).length,4);
const voice=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-voice-editorial-119-122-delta-v1.json"),"utf8"));
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const get=(id,age,kind,index)=>voice.contexts.filter(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(index===undefined||c.index===index));
const intros=new Set();
for(const id of ids){
 const before=base[id],out=after[id];
 assert.equal(out.id,id);
 assert.equal(out.quran,before.quran);
 assert.equal(out.questions,before.questions);
 assert.equal(out.sourceAudit.scientificApproval,false);
 assert.equal(out.sourceAudit.keep,"SOURCE_AUDIT");
 assert.equal(out.sourceAudit.fiqhHumanReviewNeeded,false);
 for(const age of ages){
  const a=out.ageText[age];
  assert.equal(a.lines.length,4);
  assert.ok(a.lines.every(x=>x.length>=40));
  assert.ok(a.intro.includes("Assalāmu ʿalaikum"));
  assert.ok(a.intro.length>=280);
  assert.equal(a.terms,before.ageText[age].terms);
  assert.ok(!/Keine Freigabe für Besucher|Masterstimme testen|Keine synthetische Rezitation/i.test(a.intro));
  intros.add(a.intro);
  for(const [kind,text] of [["audio",a.audioScript],["intro",a.intro]]){
   const rows=get(id,age,kind);assert.equal(rows.length,1);assert.equal(rows[0].text,text);
  }
  a.lines.forEach((text,index)=>{const rows=get(id,age,"line",index);assert.equal(rows.length,1);assert.equal(rows[0].text,text)});
  if(id==="quran-arabisch-und-uebersetzung")
    assert.ok(!/الْحَمْدُ|al-ḥamdu lillāhi/i.test(a.audioScript+" "+a.intro));
 }
 const summary=get(id,"all","summary");
 assert.equal(summary.length,1);
 assert.equal(summary[0].text,out.ageText["4-5"].audioScript);
}
assert.equal(intros.size,12);
const index=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
const oldAt=index.indexOf("/kids/akademie/curriculum-v44.js");
const newAt=index.indexOf("/kids/akademie/curriculum-editorial-119-122-v1.js");
const coachAt=index.indexOf("/kids/akademie/term-coach-v24.js");
assert.ok(oldAt>=0&&newAt>oldAt&&coachAt>newAt);
console.log("KIDS editorial 119–122: 4 lessons, 12 age versions, 76 ungenerierte voice contexts; display order and invariants PASS.");
