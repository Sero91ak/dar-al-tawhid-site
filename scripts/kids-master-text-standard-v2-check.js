#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),"utf8"));
const SALAM="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
const OUTRO="Und Allah, subḥānahu wa taʿālā, weiß es am besten.\n\nMöge Allah, subḥānahu wa taʿālā, uns nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses schenken.\n\n"+SALAM;
let checked=0;
function check(text,id){
  if(typeof text!=="string"||!text.startsWith(SALAM.slice(0,-1)))throw Error(id+": full opening Salām missing");
  if(!text.endsWith(OUTRO))throw Error(id+": required closing differs");
  if(text.split(OUTRO).length!==2)throw Error(id+": duplicated closing");
  checked++;
}
const deen=read("kids/data/deen-lessons.json").items;
if(deen.length!==6)throw Error("Unexpected Dīn primary lesson count");
for(const item of deen){
  check(item.masterStoryText,"Dīn:"+item.id);
  for(const age of ["4-5","6-8","9-10"]){
    if(item.scripts?.[age]!==item.masterStoryText)throw Error(item.id+": different age master "+age);
  }
  if(Object.values(item.audio||{}).some(a=>a&&a.url))throw Error(item.id+": audio present; re-check exact parity before edits");
}
const curriculum=read("kids/data/deen-curriculum-v1.json");
const followUps=curriculum.categories.flatMap(c=>(c.lessons||[]).filter(l=>l.masterStoryText));
if(followUps.length!==24)throw Error("Unexpected Dīn follow-up count");
for(const l of followUps)check(l.masterStoryText,"Dīn:"+l.id);
const salaf=read("kids/data/salaf-library-v1.json").items;
if(salaf.length!==34)throw Error("Unexpected Salaf story count");
for(const item of salaf){
  check(item.masterStoryText,"Salaf:"+item.id);
  if(item.audioMaster?.url)throw Error(item.id+": Salaf master audio exists; re-check parity");
}
const other=read("kids/data/stories-authentic.json");
if(other.items.length!==4)throw Error("Unexpected authentic story count");
if(other.policy?.storyTextStandard?.outro!==OUTRO)throw Error("Shared story standard differs");
for(const item of other.items)check(item.text,"Story:"+item.id);
// Voice Studio is a separate release lane and is checked in its own PR.\nconsole.log("Master closing v2: "+checked+" verified texts; single-master parity intact.");
