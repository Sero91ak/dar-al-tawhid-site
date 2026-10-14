#!/usr/bin/env node
"use strict";
/* Draft-only KIDS editorial regression. No network, audio, merge or deploy. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const src=read("kids/akademie/curriculum-v38.js");
const start=src.indexOf("{",src.indexOf("const additions="));let end=-1,depth=0,quoted=false,escaped=false;
for(let i=start;i<src.length;i++){const ch=src[i];if(quoted){if(escaped)escaped=false;else if(ch==="\\")escaped=true;else if(ch==='"')quoted=false;}else if(ch==='"')quoted=true;else if(ch==="{")depth++;else if(ch==="}"&&--depth===0){end=i+1;break;}}
assert.ok(start>0&&end>start);
const base=JSON.parse(src.slice(start,end));assert.equal(Object.keys(base).length,111);
const ctx={window:{DARKidsAcademyCurriculum:Object.freeze({...base}),DARKidsAcademyCurriculumV38:{count:111}}};
for(let n=39;n<=45;n++)vm.runInNewContext(read("kids/akademie/curriculum-v"+n+".js"),ctx,{timeout:4000});
const prev=ctx.window.DARKidsAcademyCurriculum;
for(const p of ["kids/akademie/curriculum-editorial-119-122-v1.js","kids/akademie/curriculum-editorial-123-126-v1.js"])vm.runInNewContext(read(p),ctx,{timeout:4000,filename:p});
const now=ctx.window.DARKidsAcademyCurriculum;
const ids=["quran-arabisch-und-uebersetzung","sirah-muhammad-barmherziger-lehrer","dua-in-schwierigen-momenten","family-gemeinsam-in-der-moschee","tawhid-allahs-wissen","iman-allen-gesandten-respekt","ikhlas-kleine-taten-wertvoll","akhlaq-bescheiden-bleiben"];
assert.equal(Object.keys(now).length,111);assert.equal(ctx.window.DARKidsAcademyCurriculumEditorial123126.ageVersionCount,12);
let ageCount=0;
for(const id of ids){const before=prev[id],after=now[id];assert.ok(before&&after);
 assert.strictEqual(after.questions,before.questions);
 assert.equal(after.id,before.id);
 assert.equal(after.sourceAudit.scientificApproval,false);
 if(id!=="ikhlas-kleine-taten-wertvoll")assert.strictEqual(after.quran,before.quran);
 for(const age of ["4-5","6-8","9-10"]){ageCount++;
  const a=after.ageText[age],b=before.ageText[age];
  assert.notEqual(a.intro,b.intro);
  assert.equal(a.lines.length,4);assert.equal(a.intro,a.lines.join(" "));
  assert.ok(a.goal&&a.evidence&&a.situation&&a.practice&&a.summary&&a.audioScript);
  assert.ok(!/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe/i.test(a.intro));
  assert.ok(!/Fa-man yaʿmal miṯqāla|lā nufarriqu bayna|al-ḥamdu lillāhi rabbi l-ʿālamīn/i.test(a.audioScript));
 }
}
assert.equal(ageCount,24);
for(const id of Object.keys(prev))if(!ids.includes(id))assert.strictEqual(now[id],prev[id]);
assert.equal(now["ikhlas-kleine-taten-wertvoll"].quran.arabic,"فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ");
assert.equal(now["iman-allen-gesandten-respekt"].sourceAudit.sameLocusAsSlot,112);
const voice=JSON.parse(read("kids/data/academy-voice-plan-v38.json"));
assert.equal(voice.policy.generateCreditsUsed,0);assert.equal(voice.lessonCount,111);
assert.equal(voice.phraseCount,voice.phrases.length);
assert.equal(voice.phrases.reduce((n,p)=>n+p.contexts.length,0),2109);
const has=(id,age,kind,text,index)=>voice.phrases.some(p=>p.text===text&&p.contexts.some(c=>c.lessonId===id&&c.age===age&&c.kind===kind&&(kind!=="line"||c.index===index)));
for(const id of ids)for(const age of ["4-5","6-8","9-10"]){const t=now[id].ageText[age];assert.ok(has(id,age,"intro",t.intro));assert.ok(has(id,age,"audio",t.audioScript));t.lines.forEach((line,i)=>assert.ok(has(id,age,"line",line,i)));}
const html=read("kids/akademie/index.html");
const pos=["curriculum-v45.js?v=","curriculum-editorial-119-122-v1.js?v=","curriculum-editorial-123-126-v1.js?v="].map(s=>html.indexOf(s));
assert.ok(pos.every(x=>x>=0)&&pos[0]<pos[1]&&pos[1]<pos[2]);
console.log("PASS: lessons 119-126, 24 age versions, 111 IDs, Quran 99:7, 2109 voice contexts, zero credits.");
