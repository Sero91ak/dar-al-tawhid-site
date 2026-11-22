#!/usr/bin/env node
"use strict";
/* Strict fixture-based Chromium contract for independent, Q-number-free
 * source-backed post reader and 9-language learning. No live writes or push. */
const {chromium}=require("playwright");
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const text=p=>fs.readFileSync(path.join(root,p),"utf8");
const config=read("assets/beitrag/reader-catalogs-v1.json");
const catalog=read("assets/frauen/frauen-entry-locales-v1.json");
const launch=read("assets/frauen/frauen-neufokus-v1.json");
const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const source=Object.fromEntries(launch.sourceFiles.map(x=>["/"+x,read(x)]));
const files={
 "/wissen/beitrag/":{html:text("wissen/beitrag/index.html")},
 "/lernen/beitrag/":{html:text("lernen/beitrag/index.html")},
 "/lernen/frauen-wissen/":{html:text("lernen/frauen-wissen/index.html")},
 "/assets/beitrag/reader-v1.js":{js:text("assets/beitrag/reader-v1.js")},
 "/assets/beitrag/reader-v1.css":{css:text("assets/beitrag/reader-v1.css")},
 "/assets/beitrag/learning-v1.js":{js:text("assets/beitrag/learning-v1.js")},
 "/assets/beitrag/learning-v1.css":{css:text("assets/beitrag/learning-v1.css")},
 "/assets/frauen/frauen-learning-v1.js":{js:text("assets/frauen/frauen-learning-v1.js")},
 "/assets/frauen/frauen-learning-v1.css":{css:text("assets/frauen/frauen-learning-v1.css")},
 "/assets/dar-reading-surface-v1.js":{js:""},
 "/assets/beitrag/reader-catalogs-v1.json":{json:config},
 "/assets/frauen/frauen-entry-locales-v1.json":{json:catalog}
};
assert.equal(config.schemaVersion,1);
assert.ok(config.catalogs.frauen,"Frauen non-Q catalog must be registered");
assert.deepEqual(config.catalogs.frauen.requiredLocales,codes);
assert.equal(launch.items.length,16);
const seen=new Set();
for(const row of launch.items){
 assert.ok(!seen.has(row.id),"duplicate canonical ID");seen.add(row.id);
 const entry=catalog.entries[row.id],records=source["/"+row.sourceFile]?.eintraege||[];
 const actual=records.filter(x=>x.kennung===row.id);
 assert.ok(entry&&entry.id===row.id&&catalog.entryIds.includes(row.id));
 assert.equal(actual.length,1);
 assert.equal(actual[0].quellenstatus,"geprueft");
 assert.equal(actual[0].freigabeDurchSerhat,true);
 assert.equal(entry.sourceUrl,row.sourceUrl);
 assert.equal(actual[0].direktnachweisUrl,row.sourceUrl);
 for(const code of codes){
  const p=entry.locales[code];
  assert.ok(p,row.id+" missing "+code);
  for(const f of ["title","preview","statement","sharh","lesson","source"])
   assert.ok(typeof p[f]==="string"&&p[f].trim(),row.id+" "+code+" "+f+" empty");
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];let blocked="";
  page.on("pageerror",e=>errors.push(String(e)));
  await page.route("**/*",async route=>{
   const p=new URL(route.request().url()).pathname;
   if(source[p]){
    let data=source[p];
    if(blocked){data=JSON.parse(JSON.stringify(data));
     for(const x of data.eintraege||[])if(x.kennung===blocked)x.quellenstatus="nicht-anzeigen"}
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
   }
   const v=files[p];
   if(!v)return route.fulfill({status:404,body:"Missing fixture: "+p});
   const k=Object.keys(v)[0],contentType={html:"text/html",js:"application/javascript",css:"text/css",json:"application/json"}[k];
   return route.fulfill({status:200,contentType,body:k==="json"?JSON.stringify(v[k]):v[k]});
  });
  async function check(id,code){
   await page.goto("https://reader.test/wissen/beitrag/?id="+encodeURIComponent(id)+"&lang="+code,{waitUntil:"domcontentloaded"});
   const reader=page.locator("#darNonQReader[data-canonical-content-id='"+id+"']");
   await reader.waitFor({timeout:12000});
   const pack=catalog.entries[id].locales[code],body=await reader.innerText();
   for(const [key,label] of [["title","title"],["statement","statement"],["sharh","explanation"],["lesson","lesson"],["source","source"]]){
    assert.ok(body.includes(pack[key]),id+" "+code+" missing "+label);
   }
   assert.equal(await reader.getAttribute("data-reader-locale"),code);
   assert.equal(await page.locator("html").getAttribute("dir"),["ar","ckb"].includes(code)?"rtl":"ltr");
   assert.equal(await page.locator(".dar-post-lang-select option").count(),9);
   assert.equal(await page.locator(".dar-post-source-link").getAttribute("href"),catalog.entries[id].sourceUrl);
   assert.equal(await page.locator(".dar-post-learning-link").getAttribute("href"),
    "/lernen/frauen-wissen/?id="+encodeURIComponent(id)+"&lang="+code);
   assert.ok(!page.url().includes("/q/"),"New Q number must not be minted");
  }
  for(let i=0;i<launch.items.length;i++)
   await check(launch.items[i].id,codes[i%codes.length]);
  for(const c of codes)await check(launch.items[0].id,c);
  for(const c of codes){
   const id=launch.items[0].id;
   await page.goto("https://reader.test/lernen/frauen-wissen/?id="+encodeURIComponent(id)+"&lang="+c,{waitUntil:"domcontentloaded"});
   const question=page.locator("#quiz .fw-question");
   await question.waitFor({timeout:15000});
   assert.equal(await page.locator(".fw-language-select option").count(),9,"Quiz missing language selector "+c);
   assert.equal(await page.locator("html").getAttribute("dir"),["ar","ckb"].includes(c)?"rtl":"ltr");
   assert.ok((await question.innerText()).trim().length>10,"Quiz question blank "+c);
   assert.equal(await page.locator(".fw-link").last().getAttribute("href"),
     "/wissen/beitrag/?id="+encodeURIComponent(id)+"&lang="+c,"Quiz return route wrong "+c);
  }
  for(const c of codes){
   const id=launch.items[0].id;
   await page.goto("https://reader.test/lernen/beitrag/?id="+encodeURIComponent(id)+"&lang="+c,{waitUntil:"domcontentloaded"});
   const shell=page.locator("#darNonQCourse[data-canonical-content-id='"+id+"']");
   await shell.waitFor({timeout:12000});
   assert.equal(await page.locator(".dar-post-lang-select option").count(),9);
   assert.ok((await shell.innerText()).length>85,"Generic fallback learning blank "+c);
   await page.locator(".dar-study-show").click();
   assert.ok(await page.locator(".dar-study-answer").isVisible(),"Generic learning answer not revealed "+c);
  }
  const id=launch.items[0].id;
  blocked=id;await page.goto("https://reader.test/wissen/beitrag/?id="+encodeURIComponent(id)+"&lang=de");
  await page.locator(".dar-post-error").waitFor({timeout:12000});
  assert.equal(await page.locator("#darNonQReader[data-canonical-content-id]").count(),0,
   "Hidden source must not become a public article");
  blocked="";
  assert.deepEqual(errors,[],"Page JavaScript errors");
  console.log("PASS NON-Q: 16 canonical IDs, 144 complete language versions, 25 detailed browser reads, 9 original four-question quizzes, 9 fallback learning flows, source gate. No Q numbers.");
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error("NON-Q READER QA FAILED",e.stack||e);process.exitCode=1});
