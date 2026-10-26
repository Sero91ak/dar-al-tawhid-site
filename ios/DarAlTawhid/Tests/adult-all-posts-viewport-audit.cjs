#!/usr/bin/env node
"use strict";
/* Read-only route audit for EVERY published adult Markdown post.
   Operates only against locally served PR files, no sign-in, no writes.
   For wide/different screen mode use DAR_POST_AUDIT_VIEWPORT=1024x1366.
*/
const fs=require("node:fs"),path=require("node:path");
const { chromium }=require("playwright");
const ROOT=path.resolve(__dirname,"../../..");
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,"content/posts/posts-index.json"),"utf8"));
const source=(catalog.files||[]).map(f=>typeof f==="string"?f:f.name).filter(Boolean);
const base=(process.env.DAR_AUDIT_BASE_URL||"http://127.0.0.1:8765/").replace(/#.*$/,"");
const viewportRaw=process.env.DAR_POST_AUDIT_VIEWPORT||"390x844";
const parts=viewportRaw.split("x").map(Number);
if(parts.length!==2||parts.some(x=>!Number.isInteger(x)||x<320||x>2500))throw Error("Bad viewport");
const out=path.resolve(process.env.DAR_POST_AUDIT_OUTPUT||"dar-adult-post-evidence");
fs.mkdirSync(out,{recursive:true});
const records=[];
const ids=new Set();
for(const file of source){
  const filename=path.join(ROOT,"content/posts",file);
  if(!fs.existsSync(filename)) {records.push({file,reason:"published-md-missing"});continue;}
  const raw=fs.readFileSync(filename,"utf8");
  const fm=(raw.match(/^---\s*\n([\s\S]*?)\n---/)||[])[1]||"";
  const match=fm.match(/^id:\s*["']?([^"' \r\n]+)["']?\s*$/m);
  if(!match){records.push({file,reason:"missing-post-id"});continue;}
  const id=match[1].trim();
  if(ids.has(id)){records.push({file,id,reason:"duplicate-post-id"});continue;}
  ids.add(id);
  records.push({file,id});
}
const issues=records.filter(r=>r.reason);
const report={generated:new Date().toISOString(),base,viewport:parts,
  indexed:source.length,uniqueIds:ids.size,passed:0,issues,visited:[]};
(async()=>{
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  try{
    const context=await browser.newContext({viewport:{width:parts[0],height:parts[1]},
      userAgent:"DarAlTawhid-iOS/1.0 WKWebView",hasTouch:true,isMobile:true,
      locale:"de-DE",reducedMotion:"reduce"});
    const page=await context.newPage();
    page.on("pageerror",e=>{report.issues.push({
      type:"runtime",hash:new URL(page.url()).hash,message:String(e.message).slice(0,350)
    })});
    await page.goto(base+"#home",{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForFunction(()=>!!document.getElementById("appView"),null,{timeout:15000});
    // The master markdown catalogue is requested asynchronously.
    await page.waitForTimeout(1800);
    for(const record of records){
      if(!record.id)continue;
      const hash="#post/"+encodeURIComponent(record.id);
      const result={id:record.id,file:record.file};
      try{
        await page.evaluate(h=>{location.hash=h},hash);
        await page.waitForFunction(expected=>{
          const view=document.getElementById("appView");
          if(!view||!document.body.classList.contains("is-post-route"))return false;
          const area=view.querySelector(".post-reader");
          return !!area&&area.getBoundingClientRect().width>25
            && view.textContent.trim().length>70
            && decodeURIComponent(location.hash).endsWith(expected);
        },record.id,{timeout:5000});
        await page.waitForTimeout(70);
        const state=await page.evaluate(()=>{
          const root=document.documentElement,view=document.getElementById("appView");
          const main=view.querySelector(".post-reader");
          const heading=main?.querySelector(".post-reader-title")?.textContent.trim()||"";
          return {hash:location.hash,route:[...document.body.classList].filter(c=>c.startsWith("is-")),
            mode:root.getAttribute("data-layout"),
            heading:heading.slice(0,160),
            contentLength:view.textContent.trim().length,
            overflow:Math.max(0,root.scrollWidth-root.clientWidth,
              document.body.scrollWidth-root.clientWidth),
            readerWidth:Math.round(main?.getBoundingClientRect().width||0),
            missing:/Beitrag (?:nicht gefunden|konnte nicht geladen)|Fehler beim Laden/i.test(view.textContent)};
        });
        if(!state.mode)result.issue="missing-layout-mode";
        else if(state.overflow>3)result.issue="page-overflow:"+state.overflow;
        else if(state.readerWidth<25)result.issue="reader-collapsed";
        else if(state.missing)result.issue="missing-post-content";
        else if(state.heading.length<5)result.issue="empty-post-heading";
        result.state=state;
        if(result.issue)report.issues.push({id:record.id,file:record.file,...result});
        else report.passed++;
      }catch(e){
        result.issue=String(e.message).slice(0,400);
        report.issues.push({id:record.id,file:record.file,reason:"post-navigation",detail:result.issue});
      }
      report.visited.push({id:record.id,file:record.file,issue:result.issue||null});
      if(result.issue && report.issues.length<26){
        await page.screenshot({path:path.join(out,record.id.replace(/[^a-z0-9_-]/gi,"-").slice(0,80)+".png"),
          fullPage:false}).catch(()=>{});
      }
    }
    await context.close();
  }finally{
    await browser.close();
    report.completed=new Date().toISOString();
    fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(report,null,2)+"\n");
    console.log("Published adult posts:",report.indexed,"passed:",report.passed,"issues:",report.issues.length);
  }
  if(report.issues.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
