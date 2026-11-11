#!/usr/bin/env node
"use strict";
/* Zero-credit exact binary and source QA. Optionally build a LOCAL owner
 * listening kit containing only the 68 already generated V4 recordings.
 * No audio generation, no approval, no child-app playback manifest changes. */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const plan=read("kids/data/academy-sidq-v4-voice-plan-v30.json");
const first=read("kids/data/academy-audio-staging-sidq-v4-20261111.json");
const next=read("kids/data/academy-audio-staging-sidq-v30-20261111.json");
const batches=read("kids/data/academy-sidq-v30-safe-batches-20261111.json");
const publicAudio=read("kids/data/academy-audio.json");
const baseline=read("kids/data/academy-voice-policy-v10.json");
assert.equal(plan.counts.uniquePhrases,80);
assert.equal(plan.counts.stagedV4,4);
assert.equal(plan.counts.unrecorded,76);
assert.equal(first.stagingOnly,true);
assert.equal(next.stagingOnly,true);
assert.equal(first.reviewRequiredBeforePublicPlayback,true);
assert.equal(next.reviewRequiredBeforePublicPlayback,true);
assert.equal(Object.keys(first.entries).length,4);
assert.equal(Object.keys(next.entries).length,64);
assert.equal(batches.heldCount,12);
assert.equal(Object.keys(publicAudio.entries||{}).filter(x=>first.entries[x]||next.entries[x]).length,0);
const all=new Map([...Object.entries(first.entries),...Object.entries(next.entries)]);
assert.equal(all.size,68,"No duplication or missing owner clips");
const ordered=plan.phrases.filter(row=>all.has(row.text));
assert.equal(ordered.length,68);
const missing=plan.phrases.filter(row=>!all.has(row.text));
assert.equal(missing.length,12,"All safe phrases must be present");
assert.deepEqual(missing.map(x=>x.text),batches.heldForFushaReview.map(x=>x.text),
  "Only Fuṣḥā-sensitive lines may remain unrecorded");
let totalDuration=0,totalBytes=0;
const records=[];
for(const [i,p] of ordered.entries()){
 const x=all.get(p.text);
 assert.equal(x.voiceId,baseline.voiceIdentity.voiceId,p.text);
 assert.equal(x.modelId,"eleven_v4",p.text);
 assert.equal(x.voiceSettingsProfile,"kids_story",p.text);
 assert.equal(x.qaStatus,"technical-passed-awaiting-human-fusha-review",p.text);
 assert.equal(x.approvedForPlayback,false,p.text);
 assert.equal(x.pronunciationDictionaryAppliedByBackend,false,p.text);
 assert.ok(x.url.startsWith("/kids/assets/kids-academy-audio/"),p.text);
 const f=path.join(ROOT,x.url.slice(1));
 assert.ok(fs.existsSync(f),"Audio missing: "+x.url);
 const bytes=fs.readFileSync(f);
 assert.ok(bytes.length>=1800,"Truncated file: "+x.url);
 assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),x.sha256,p.text);
 assert.ok(x.durationSeconds>=.8&&x.durationSeconds<=65,p.text);
 totalDuration+=x.durationSeconds;
 totalBytes+=bytes.length;
 const contexts=p.contexts.map(c=>({age:c.age,kind:c.kind,profile:c.profile||"both"}));
 records.push({
   sequence:i+1,text:p.text,contexts,durationSeconds:x.durationSeconds,
   file:String(i+1).padStart(3,"0")+".m4a",sha256:x.sha256,
   originalUrl:x.url
 });
}
const summary={
 schemaVersion:1,scope:"TAWHID KIDS · Ṣidq only",
 source:"kids/data/academy-sidq-v4-voice-plan-v30.json",
 voice:"Serhat Abu Malik – Master",modelId:"eleven_v4",
 ageVersions:3,choiceQuestions:8,uniqueRequired:80,
 generated:68,unrecordedFushaSensitive:12,
 approvedForPublicPlayback:0,totalRecordedDurationSeconds:Math.round(totalDuration*100)/100,
 totalMediaBytes:totalBytes,recordings:records,
 warnings:[
  "Voice Studio German-safe V4 segments do not apply the global Fuṣḥā PLS because of cross-language collisions.",
  "Native full Salām and all Arabic terminology require owner's listening approval.",
  "No generated clips should be made available to child profiles until reviewed and approved."
 ]
};
const outputIndex=process.argv.indexOf("--output");
if(outputIndex>=0){
 const raw=process.argv[outputIndex+1];assert.ok(raw&&!raw.startsWith("-"));
 const dest=path.resolve(raw);
 fs.mkdirSync(dest,{recursive:true});
 for(const record of records){
  fs.copyFileSync(path.join(ROOT,record.originalUrl.slice(1)),path.join(dest,record.file));
 }
 fs.writeFileSync(path.join(dest,"playlist.json"),JSON.stringify(summary,null,2)+"\n");
 const escapeHtml=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
 const cards=records.map(row=>{
  const groups=[...new Set(row.contexts.map(c=>c.age))].join(", ");
  return '<article class="clip"><div class="number">'+String(row.sequence).padStart(2,"0")+
   ' · '+escapeHtml(groups)+'</div><p>'+escapeHtml(row.text)+'</p><audio preload="none" controls src="'+row.file+'"></audio></article>';
 }).join("\n");
 const html='<!doctype html><html lang="de"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1"><title>TAWḤĪD KIDS · Ṣidq V4 Hörprüfung</title>'+
  '<style>body{font-family:system-ui,-apple-system,sans-serif;background:#101f21;color:#f2ede2;padding:24px;max-width:840px;margin:auto}'+
  'h1{font-size:clamp(25px,5vw,42px);line-height:1.2}p{line-height:1.65}.muted{color:#c0c8bd}.clip{background:#172a2b;border:1px solid #4b5b50;border-radius:16px;margin:14px 0;padding:20px}'+
  '.number{font-size:13px;color:#d5be82;letter-spacing:.05em}.clip p{font-size:17px}audio{width:100%}header{padding:12px 0 24px;border-bottom:1px solid #576254}'+
  'small{color:#cabf9d}</style></head><body><header><small>DĀR AL TAWḤĪD · INTERNES HÖRREVIEW</small>'+
  '<h1>Ṣidq – Wahrhaftigkeit</h1><p>68 echte V4-Masteraufnahmen · Drei Altersstufen · <strong>Nicht öffentlich freigegeben</strong></p>'+
  '<p class="muted">Prüfe Stimme, Fuṣḥā, Aussprache, Endungen und kindgerechte Betonung. Die 12 komplexen Fuṣḥā-Texte sind nicht enthalten.</p></header>'+
  cards+'</body></html>';
 fs.writeFileSync(path.join(dest,"Hoerpruefung.html"),html,"utf8");
}
console.log("PASS: "+summary.generated+"/80 exact canonical V4 clips, "+summary.unrecordedFushaSensitive+
 " marked Fuṣḥā-sensitive, "+summary.totalRecordedDurationSeconds+" seconds, 0 public approvals; no credits");
