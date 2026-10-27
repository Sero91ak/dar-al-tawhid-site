#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const html=fs.readFileSync("kids/quiz-v4-audio-review.html","utf8");
const data=JSON.parse(fs.readFileSync("kids/data/quiz-v4-full-rebuild-public.json","utf8"));
assert.equal(data.ownerOptionalListeningPage,"/kids/quiz-v4-audio-review.html");
assert.ok(html.includes('lang="de"') && html.includes('name="viewport"'));
assert.ok(html.includes('id="audioList"')&&html.includes('id="risk"')&&html.includes('id="age"'));
assert.ok(html.includes('audio.controls=true'));
assert.ok(html.includes('audio.preload="none"'));
assert.ok(!html.includes('speechSynthesis.'),"Cannot substitute browser synthetic speech for owner V4");
assert.ok(!html.includes('humanListeningApproved=true'),"Do not fabricate hearing approval");
const code=(html.match(/<script>([\s\S]*?)<\/script>/)||[])[1];
assert.ok(code,"Client review script missing");
new Function(code);
const arabic=/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const latin=/[A-Za-zÄÖÜäöüß]/u,nur=/(?<!\w)nur(?!\w)/iu;
const all=Object.values(data.questions).flatMap(q=>Object.values(q.clips));
let flaggedNur=0,flaggedMixed=0,overlap=0,corrected=0;
for(const c of all){
 const fixed=c.humanListeningApproved===true&&c.approvedForPlayback===true;
 const n=nur.test(c.text)&&!fixed,m=arabic.test(c.text)&&latin.test(c.text)&&!fixed;
 if(fixed)corrected++;
 if(n)flaggedNur++;
 if(m)flaggedMixed++;
 if(n&&m)overlap++;
}
assert.equal(Object.keys(data.questions).length,450);
assert.equal(all.length,1800);
assert.ok(flaggedNur<=130&&flaggedMixed<=12,"Unexpected additional unreviewed candidate clips; refresh public QA scope");
assert.ok(corrected>=1,"Owner-approved q178 audio missing");
console.log("PASS: optional individual MP3 audition page: "+flaggedNur+" Nur, "+flaggedMixed+" Arabic-word scripts, "+corrected+" owner-reviewed retakes, "+(flaggedNur+flaggedMixed-overlap)+" open unique audio slots");
