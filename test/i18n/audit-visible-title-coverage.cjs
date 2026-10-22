#!/usr/bin/env node
"use strict";
/* Offline inventory of article and Duʿāʾ title coverage, from canonical IDs.
 * Missing titles are audit items, never fabricated translations.
 * No API, no network, and no modification of religious content. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const titles=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-visible-title-drafts-seven.json"),"utf8"));
const postsDir=path.join(root,"content/posts");
const originalPosts=[];
for(const name of fs.readdirSync(postsDir).filter(x=>x.endsWith(".md"))){
 const s=fs.readFileSync(path.join(postsDir,name),"utf8");
 const front=s.startsWith("---\n")?s.split(/\n---(?:\r)?\n/,1)[0]:"";
 const id=front.match(/^id:\s*"([^"]+)"/m)?.[1];
 const rawTitle=front.match(/^title:\s*(.+)$/m)?.[1]?.trim()||"";
 const title=rawTitle.startsWith('"')&&rawTitle.endsWith('"')?
   JSON.parse(rawTitle):rawTitle.startsWith("'")&&rawTitle.endsWith("'")?
   rawTitle.slice(1,-1):rawTitle;
 if(id&&title)originalPosts.push({id,title});
}
const duaRows=JSON.parse(fs.readFileSync(path.join(root,"content/duas/duas.json"),"utf8"));
const records=titles.records||{};
const missingPosts=originalPosts.filter(p=>!records["post:"+p.id]);
const missingDuas=duaRows.filter(p=>!records["dua:"+p.id]);
const availablePosts=originalPosts.length-missingPosts.length;
const availableDuas=duaRows.length-missingDuas.length;
assert(availablePosts<=originalPosts.length);
assert(availableDuas<=duaRows.length);
for(const item of Object.values(records)){
 assert(typeof item.id==="string"&&typeof item.sourceTitle==="string");
 for(const lang of ["tr","en","ar","ku","ckb","bs"])
  assert(typeof item.translations?.[lang]==="string"&&item.translations[lang].trim());
}
console.log("TITLE-COVERAGE (drafts only; no approval implied):",JSON.stringify({
 posts:{indexed:originalPosts.length,drafted:availablePosts,missing:missingPosts.length},
 duas:{indexed:duaRows.length,drafted:availableDuas,missing:missingDuas.length},
 noPaidApi:true
}));
if(missingPosts.length){
 console.log("First untranslated canonical post IDs:",
  missingPosts.slice(0,12).map(x=>x.id).join(", "));
}
