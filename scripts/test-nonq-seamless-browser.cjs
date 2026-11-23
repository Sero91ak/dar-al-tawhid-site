#!/usr/bin/env node
"use strict";
/* Regression: a published non-Q post must stay inside the already running
 * adult reader; switching languages and returning from learning cannot
 * navigate the top document or rebuild the previously read article. */
const {chromium}=require("playwright");
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const text=p=>fs.readFileSync(path.join(root,p),"utf8");
const json=p=>JSON.parse(text(p));
const manifest=json("assets/frauen/frauen-neufokus-v1.json");
const catalog=json("assets/frauen/frauen-entry-locales-v1.json");
const registry=json("assets/beitrag/reader-catalogs-v1.json");
const source=Object.fromEntries(manifest.sourceFiles.map(p=>["/"+p,json(p)]));
const id=manifest.items[0].id;
const files={
 "/assets/dar-app-chrome.js":["application/javascript",text("assets/dar-app-chrome.js")],
 "/wissen/beitrag/":["text/html",text("wissen/beitrag/index.html")],
 "/lernen/frauen-wissen/":["text/html",text("lernen/frauen-wissen/index.html")],
 "/assets/beitrag/reader-v1.js":["application/javascript",text("assets/beitrag/reader-v1.js")],
 "/assets/beitrag/reader-v1.css":["text/css",text("assets/beitrag/reader-v1.css")],
 "/assets/frauen/frauen-learning-v1.js":["application/javascript",text("assets/frauen/frauen-learning-v1.js")],
 "/assets/frauen/frauen-learning-v1.css":["text/css",text("assets/frauen/frauen-learning-v1.css")],
 "/assets/dar-reading-surface-v1.js":["application/javascript",""],
 "/assets/beitrag/reader-catalogs-v1.json":["application/json",JSON.stringify(registry)],
 "/assets/frauen/frauen-entry-locales-v1.json":["application/json",JSON.stringify(catalog)]
};
for(const [p,obj] of Object.entries(source))files[p]=["application/json",JSON.stringify(obj)];
files["/shell/"]=["text/html",
 '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Already mounted adult app</title><script defer src="/assets/dar-app-chrome.js"></script></head><body><main id="appView"><p id="stableAppRoot">App shell preserved</p><section id="darFrauenNeufokusIndex"><a id="openPost" href="/wissen/beitrag/?id='+encodeURIComponent(id)+'&lang=de">Open canonical contribution</a></section></main></body></html>'];
(async function(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.route("**/*",route=>{
   const p=new URL(route.request().url()).pathname;
   const file=files[p];if(!file)return route.fulfill({status:404,body:"Fixture missing: "+p});
   return route.fulfill({status:200,contentType:file[0],body:file[1]});
  });
  await page.goto("https://reader.test/shell/",{waitUntil:"domcontentloaded"});
  await page.evaluate(({manifest,catalog,registry,source,id})=>{
   window.__nonqFixture={manifest,catalog,registry,sources:source};
   window.__originalMain=document.getElementById("appView");
   window.DARFrauenNeufokusV1={
    getReaderData:key=>key===id?window.__nonqFixture:null,
    closeIndex:()=>document.getElementById("darFrauenNeufokusIndex")?.remove(),
    openIndex:()=>{const root=document.getElementById("appView");const el=document.createElement("section");el.id="darFrauenNeufokusIndex";root.appendChild(el)}
   };
  },{manifest,catalog,registry,source,id});
  await page.locator("#openPost").click();
  const reader=page.frameLocator("#darInternalSourceFrameV3");
  await reader.locator('#darNonQReader[data-canonical-content-id="'+id+'"]').waitFor();
  assert.equal(await page.locator("#darFrauenNeufokusIndex").count(),0,"Focus overlay must close");
  assert.equal(page.url(),"https://reader.test/shell/","Top app must not navigate");
  assert.equal(await page.evaluate(()=>window.__originalMain===document.getElementById("appView")),true);
  await page.evaluate(()=>{window.__originalReaderDoc=document.getElementById("darInternalSourceFrameV3").contentDocument});
  await reader.locator("#darPostLangSelect").selectOption("ar");
  await reader.locator('#darNonQReader[data-reader-locale="ar"]').waitFor();
  assert.equal(await reader.locator("html").getAttribute("dir"),"rtl");
  assert.equal(page.url(),"https://reader.test/shell/","Language switch must not navigate");
  await reader.locator(".dar-post-learning-link").click();
  const quiz=page.frameLocator("#darInternalSourceFrameV3");
  await quiz.locator("#quiz .fw-question").waitFor();
  assert.equal(page.url(),"https://reader.test/shell/","Learning route must stay mounted");
  await quiz.locator("#fwReaderLanguage").selectOption("tr");
  await quiz.locator("html[lang=tr]").waitFor();
  assert.equal(page.url(),"https://reader.test/shell/","Quiz language switch must not navigate");
  await page.locator("#darInternalSourceV3 .dar-source-back").click();
  await reader.locator('#darNonQReader[data-reader-locale="ar"]').waitFor();
  assert.equal(await page.evaluate(()=>document.getElementById("darInternalSourceFrameV3").contentDocument===window.__originalReaderDoc),true,
   "Back must restore the same article DOM, not reload srcdoc");
  assert.equal(await reader.locator(".dar-post-loading").count(),0);
  await page.locator("#darInternalSourceV3 .dar-source-back").click();
  await page.locator("#darFrauenNeufokusIndex").waitFor();
  assert.equal(await page.evaluate(()=>window.__originalMain===document.getElementById("appView")),true);
  assert.deepEqual(errors,[],"Browser runtime errors");
  console.log("PASS NON-Q SEAMLESS: no top navigation, zero locale reloads, previous iframe restored, focus index returned.");
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
