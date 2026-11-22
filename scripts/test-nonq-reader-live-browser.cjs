#!/usr/bin/env node
"use strict";
/* Public Cloudflare live proof for permanent canonical Q-free reader.
 * Does not depend on 48-hour focus window. No notification or write. */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const BASE=process.env.NONQ_LIVE_BASE||"https://dar-al-tawhid.de";
const manifest=require("../assets/frauen/frauen-neufokus-v1.json");
const catalog=require("../assets/frauen/frauen-entry-locales-v1.json");
const CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 let successes=0;
 try{
 const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors=[];page.on("pageerror",error=>errors.push(String(error)));
 async function verify(row,code){
  const url=BASE+"/wissen/beitrag/?id="+encodeURIComponent(row.id)+"&lang="+code+"&reader-live-proof=1";
  let issue="";
  for(let attempt=0;attempt<8;attempt++){
   const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:40000});
   assert.equal(response?.status(),200,"Public article URL HTTP status "+url);
   try{
    await page.locator("#darNonQReader[data-canonical-content-id='"+row.id+"']").waitFor({state:"visible",timeout:10000});
    const pack=catalog.entries[row.id].locales[code],all=await page.locator("#darNonQReader").innerText();
    assert.ok(all.includes(pack.title),"Missing original title");
    assert.ok(all.includes(pack.statement),"Missing source text");
    assert.ok(all.includes(pack.sharh),"Missing editorial explanation");
    assert.ok(all.includes(pack.lesson),"Missing lesson");
    assert.ok(all.includes(pack.source),"Missing citation");
    assert.equal(await page.locator(".dar-post-source-link").getAttribute("href"),row.sourceUrl);
    assert.equal(await page.locator("html").getAttribute("dir"),["ar","ckb"].includes(code)?"rtl":"ltr");
    assert.equal(await page.locator(".dar-post-lang-select option").count(),9);
    assert.ok((await page.locator(".dar-post-learning-link").getAttribute("href")).includes("lang="+code));
    assert.ok(!page.url().includes("/q/"),"Q numbering invented");
    successes++;return;
   }catch(e){issue=String(e).slice(0,500);if(attempt===7)throw new Error(row.id+" "+code+" "+issue);await sleep(3500)}
  }
 }
 for(const row of manifest.items)await verify(row,"de");
 for(const lang of CODES)await verify(manifest.items[0],lang);
 const id=manifest.items[0].id;
 for(const code of CODES){
  await page.goto(BASE+"/lernen/frauen-wissen/?id="+encodeURIComponent(id)+"&lang="+code,{waitUntil:"domcontentloaded",timeout:40000});
  await page.locator("#quiz .fw-question").waitFor({timeout:16000});
  assert.equal(await page.locator(".fw-language-select option").count(),9);
  assert.equal(await page.locator("html").getAttribute("dir"),["ar","ckb"].includes(code)?"rtl":"ltr");
 }
 for(const code of ["de","ar","ckb"]){
  await page.goto(BASE+"/lernen/beitrag/?id="+encodeURIComponent(id)+"&lang="+code,{waitUntil:"domcontentloaded",timeout:40000});
  await page.locator("#darNonQCourse[data-canonical-content-id='"+id+"']").waitFor({timeout:16000});
  await page.locator(".dar-study-show").click();
  assert.ok(await page.locator(".dar-study-answer").isVisible());
 }
 assert.deepEqual(errors,[],"Browser JavaScript errors");
 console.log("PASS LIVE NON-Q: "+successes+" actual public article/locale readers, all nine multiple-choice learning locales, three generic future-learning locales. One canonical source ID each, no Q minting.");
 await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error("LIVE NON-Q QA FAILED",e.stack||e);process.exitCode=1});
