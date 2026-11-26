#!/usr/bin/env node
"use strict";
/* Child-facing Kids UI must never show the speaker's name. Internal IDs,
 * comments, voice-profile keys and manifest metadata may still mention it. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const NAME=/(Serhat|Serrat|Abu\s*Malik)/i;
const skipDir=new Set(["data","tools","assets","original-media","creator-test","__pycache__","qa-viewports-20261126"]);
function walk(dir,acc=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ent.name.startsWith("."))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()){
      if(!skipDir.has(ent.name))walk(p,acc);
    }else if(/\.(html|js|css)$/.test(ent.name))acc.push(p);
  }
  return acc;
}
function stripCommentsAndCode(html){
  return html
    .replace(/<!--[\s\S]*?-->/g," ")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ");
}
function visibleHtmlHits(file,source){
  const markup=stripCommentsAndCode(source);
  const hits=[];
  const attr=/(?:aria-label|title|alt|placeholder|value)\s*=\s*(["'])([\s\S]*?)\1/gi;
  let m;
  while((m=attr.exec(markup))){
    if(NAME.test(m[2]))hits.push({file,kind:"attr",text:m[2].trim().slice(0,140)});
  }
  const text=markup.replace(/<[^>]+>/g," ");
  if(NAME.test(text))hits.push({file,kind:"text",text:text.match(NAME)[0]});
  return hits;
}
function jsRenderHits(file,source){
  const hits=[];
  const cleaned=source.replace(/\/\*[\s\S]*?\*\//g," ").replace(/(^|[^:])\/\/.*$/gm,"$1");
  const re=/(?:textContent|innerHTML|innerText|outerHTML)\s*=\s*(?:[^;]{0,400})/g;
  const re2=/(?:setAttribute\(\s*["'](?:aria-label|title|alt|placeholder)["']\s*,\s*)([^)]{0,400})/g;
  const re3=/aria-label\s*[:=]\s*(["'`])([\s\S]*?)\1/g;
  for(const reX of [re,re2]){
    let m; while((m=reX.exec(cleaned))){
      if(NAME.test(m[0]))hits.push({file,kind:"js",text:m[0].replace(/\s+/g," ").trim().slice(0,180)});
    }
  }
  let m; while((m=re3.exec(cleaned))){
    if(NAME.test(m[2]))hits.push({file,kind:"aria",text:m[2].trim().slice(0,140)});
  }
  return hits;
}

const files=walk(path.join(root,"kids"));
const hits=[];
for(const file of files){
  const rel=path.relative(root,file);
  const source=fs.readFileSync(file,"utf8");
  if(file.endsWith(".html"))hits.push(...visibleHtmlHits(rel,source));
  if(file.endsWith(".js")||file.endsWith(".html"))hits.push(...jsRenderHits(rel,source));
}
assert.equal(hits.length,0, "Child-visible UI still names the speaker:\n"+hits.map(h=>` - ${h.file} [${h.kind}] ${h.text}`).join("\n"));
assert.ok(fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8").includes("▶ Anhören"),
  "The lesson intro button should use a neutral Anhören label");
assert.ok(!fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8").includes("▶ Serhat hören"));
console.log("PASS Kids UI: no child-visible Serhat/Abu Malik/Serrat labels.");
