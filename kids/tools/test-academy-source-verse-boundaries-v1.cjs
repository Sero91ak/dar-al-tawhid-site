#!/usr/bin/env node
"use strict";
/* Conservative source-registry regression after independent editorial corrections.
 * This is not a comprehensive Qurʾān transcription or Hadith authenticity audit.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const reg=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../kids-akademie/research/SOURCE_REGISTRY.json"),"utf8"));
const sources=reg.sources;
assert.ok(Array.isArray(sources)&&sources.length>0);
assert.equal(reg.sourceCount,sources.length);
assert.equal(new Set(sources.map(x=>x.sourceId)).size,sources.length,"duplicated sourceId");
const get=id=>{const x=sources.find(s=>s.sourceId===id);assert.ok(x,"missing source "+id);return x};
const a=get("SRC-V38-17-29");
assert.equal(a.locus,"Qurʾān 17:29");
assert.ok(a.arabic.endsWith("مَحْسُورًا"));
assert.ok(!a.arabic.endsWith(" إِنَّ"),"Qurʾān 17:30 must not leak into 17:29");
const b=get("SRC-V38-71-10");
assert.equal(b.locus,"Qurʾān 71:10");
assert.ok(b.arabic.endsWith("غَفَّارًا"));
assert.ok(!b.arabic.includes("يُرْسِلِ السَّمَاءَ"),"Qurʾān 71:11 leaked into 71:10");
const c=get("SRC-V38-94-5");
assert.equal(c.locus,"Qurʾān 94:5–6");
assert.ok(c.arabic.includes("إِنَّ مَعَ الْعُسْرِ يُسْرًا"));
const d=get("SRC-V38-112-1");
assert.equal(d.locus,"Qurʾān 112:1–4");
assert.ok(d.arabic.includes("وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ"));
const e=get("SRC-V38-2-286");
assert.ok(!e.lessonIds.includes("iman-sechs-glaubenssaeulen"),"Qurʾān 2:286 is NOT the six-pillars list");
const hadith=get("SRC-EDITORIAL-MUSLIM-JIBRIL-IMAN-6");
assert.ok(hadith.lessonIds.includes("iman-sechs-glaubenssaeulen"));
assert.ok(hadith.work.includes("Ṣaḥīḥ Muslim"));
assert.ok(hadith.arabic.includes("الْقَدَرِ"));
assert.ok(hadith.directLink.startsWith("https://www.islamweb.net/ar/library/content/53/86"));
assert.ok(hadith.authenticityNote.includes("NUR"),"hadith excerpt must be labeled as an excerpt");
for(const s of sources){assert.ok(s.sourceId&&s.locus&&s.directLink,"incomplete source "+s.sourceId);}
process.stdout.write("PASS: "+sources.length+" unique registry entries, corrected 4 Qurʾān spans, six Īmān pillars bound to Muslim/Jibrīl only. Full scholarship audit still open.\n");
