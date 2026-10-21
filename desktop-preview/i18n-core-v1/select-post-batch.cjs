#!/usr/bin/env node
"use strict";
/**
 * DĀR AL TAWḤĪD Zentrum – read-only, repeatable 10-post translation batch.
 * No API, provider cost, write, content publication or device notification.
 *
 * Generate the inventory first:
 * node desktop-preview/i18n-core-v1/translation-worklist.cjs --out /tmp/dar-worklist.json
 * node desktop-preview/i18n-core-v1/select-post-batch.cjs --inventory /tmp/dar-worklist.json --batch 1
 */
const fs=require("node:fs");
const path=require("node:path");
const args=process.argv.slice(2);
function flag(name,initial){const i=args.indexOf(name);return i<0?initial:args[i+1]}
const number=Number(flag("--batch","1"));
const SIZE=10;
if(!Number.isSafeInteger(number)||number<1)throw Error("--batch must be a positive integer");
const source=path.resolve(flag("--inventory",path.join(__dirname,"translation-worklist.json")));
const input=JSON.parse(fs.readFileSync(source,"utf8"));
if(input.schemaVersion!==2||!Array.isArray(input.items)||!Array.isArray(input.locales))throw Error("Expected worklist v2");
const localeCodes=input.locales;
const posts=input.items.filter(item=>item.kind==="post"&&!item.immutable?.sourceReviewBlocked)
  .sort((a,b)=>a.id.localeCompare(b.id,"en"));
const totalBatches=Math.ceil(posts.length/SIZE);
const start=(number-1)*SIZE;
const items=posts.slice(start,start+SIZE).map(post=>{
 const locales=Object.fromEntries(localeCodes.map(code=>{
  const rec=post.languages?.[code]||{};
  return [code,{status:rec.state||"pending",translationPath:rec.translationPath||null}];
 }));
 return {
  id:post.id,sourcePath:post.sourcePath,sourceHash:post.sourceHash,
  canonicalSourcePreserved:true,
  qSourcePath:"refer to the canonical Q registry/manifests; never invent a Q number",
  locales,
  openLocales:localeCodes.filter(code=>locales[code].status!=="approved")
 };
});
const report={
 schemaVersion:1,kind:"read-only-adult-post-translation-batch",batch:number,
 size:SIZE,totalEligiblePosts:posts.length,totalBatches,
 canonicalLocale:"de",targetLocales:localeCodes,contentIds:items.map(p=>p.id),
 openTranslationTasks:items.reduce((n,p)=>n+p.openLocales.length,0),
 hasNext:number<totalBatches,items,
 notes:[
  "Existing canonical post IDs, source revision and Q registry are authoritative.",
  "Translation is prepared in this batch without a paid provider; human linguistic and religious review is required.",
  "A reviewed translation is stored under the same canonical ID and original Q number.",
  "Do not deploy or send device pushes from this planning script."
 ]
};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
