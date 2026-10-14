#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const reg=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json")).sources;
const b=reg.find(x=>x.sourceId==="SRC-FIQH166-BUKHARI-1117");
const m=reg.find(x=>x.sourceId==="SRC-FIQH166-MUGHNI-861");
assert.ok(b&&m,"both original source records must exist");
assert.equal(b.number,"Ṣaḥīḥ al-Buḫārī 1117");
assert.equal(m.number,"1064");
assert.ok(b.lessonIds.includes("fiqh-zum-gebet-stehen"));
assert.ok(m.lessonIds.includes("fiqh-zum-gebet-stehen"));
assert.ok(b.directLink.includes("dorar.net/h/"));
assert.ok(m.directLink.includes("islamweb.net/ar/library/content/15/861"));
const s=read("kids/akademie/curriculum-editorial-163-166-v1.js");
const from=s.indexOf("const drafts=")+13,to=s.indexOf(";\nconst next=",from);
assert.ok(from>12&&to>from,"drafts section not found");
const lesson=JSON.parse(s.slice(from,to))["fiqh-zum-gebet-stehen"];
assert.ok(lesson);
const voice=JSON.parse(read("kids/data/academy-voice-editorial-163-166-delta-v1.json"));
assert.equal(voice.generateCreditsUsed,0);
for(const age of ["4-5","6-8","9-10"]){
 const d=lesson[age];
 assert.match(d.evidence,/1117/);
 assert.match(d.evidence,/15\/861/);
 assert.ok(!/fiqhHumanReviewNeeded|scientificApproval|Masterstimme|Keine Freigabe für Besucher/i.test(d.evidence));
 const intro=d.lines.join(" ");
 assert.equal(voice.contexts.find(x=>x.lessonId==="fiqh-zum-gebet-stehen"&&x.age===age&&x.kind==="intro")?.text,intro);
 for(let i=0;i<4;i++)assert.equal(voice.contexts.find(x=>x.lessonId==="fiqh-zum-gebet-stehen"&&x.age===age&&x.kind==="line"&&x.index===i)?.text,d.lines[i]);
}
assert.ok(s.includes("audit.fiqhHumanReviewNeeded=true"));
assert.ok(s.includes("scientificApproval:false"));
process.stdout.write("PASS Fiqh 166: Bukhari 1117 + al-Mughni 1064 registered, 3 child sources correct, 0 voice text changes, human review held\n");
