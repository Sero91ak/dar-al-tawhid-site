#!/usr/bin/env node
"use strict";
/* DĀR AL TAWḤĪD 16×9 Frauen-Lernbereich: real Chromium interaction against
 * local repository files. Approved statuses are mocked IN THE TEST BROWSER ONLY.
 * Real source JSON remains not-anzeigen; NEVER writes/deploys/sends pushes.
 * Chromium emulation is not physical iOS-WKWebView or Android sign-off. */
const {chromium}=require("playwright");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const batch=read("content/admin/frauen-batch-16-2026-11-18.json"),locales=read("assets/frauen/frauen-entry-locales-v1.json");
const js=fs.readFileSync(path.join(root,"assets/frauen/frauen-learning-v1.js"),"utf8");
const globals={window:{},document:{getElementById(){return null}},URL,console};
vm.runInNewContext(js,globals,{filename:"frauen-learning-v1.js"});
const api=globals.window.DARFrauenLearningV1,ids=new Set(batch.records.map(r=>r.id));
const MIME={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png"};
function fileFor(raw){
 let u;try{u=new URL(raw,"http://localhost")}catch(e){return null}
 let pathname=decodeURIComponent(u.pathname);
 if(pathname==="/lernen/frauen-wissen/")pathname+="index.html";
 const full=path.resolve(root,"."+pathname);
 return full.startsWith(root+path.sep)?full:null;
}
const server=http.createServer((req,res)=>{
 const name=fileFor(req.url);
 if(!name||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end("Not found");return}
 const ext=path.extname(name);
 res.writeHead(200,{"content-type":MIME[ext]||"application/octet-stream","cache-control":"no-store"});
 fs.createReadStream(name).pipe(res);
});
(async()=>{
 let browser;
 try{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const host="http://127.0.0.1:"+server.address().port;
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const viewportConfigs=[{name:"iPhone",width:390,height:844},{name:"Duo",width:660,height:750},{name:"iPad",width:834,height:1112},{name:"Desktop",width:1280,height:800}];
 let checked=0,questions=0,rtl=0;
 const browserErrors=[];
 for(const vp of viewportConfigs){
 const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
 const page=await context.newPage();
 page.on("pageerror",error=>browserErrors.push(vp.name+": "+String(error)));
 // Prove that the staging file does NOT accidentally show private study.
 const hidden=batch.records[0].id;
 await page.goto(host+"/lernen/frauen-wissen/?id="+encodeURIComponent(hidden)+"&lang=de",{waitUntil:"domcontentloaded"});
 await page.locator(".fw-message").filter({hasText:api.labels.de.ready}).waitFor({timeout:10000});
 assert.equal(await page.locator(".fw-answer").count(),0,"Private report leaked before approval");
 // Browser-only replacement of the *response*; never changes repository files.
 await page.route("**/data/frauen-*.json*",route=>{
   const p=new URL(route.request().url()).pathname;
   const relative=p.replace(/^\//,""),file=path.resolve(root,relative);
   assert.ok(file.startsWith(root+path.sep));
   const d=read(relative);
   for(const e of d.eintraege||[])if(ids.has(e.kennung)){e.quellenstatus="geprueft";e.freigabeDurchSerhat=true;}
   route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(d)});
 });
 // Four viewports with representative samples; full language/article coverage
 // in the phone viewport to keep CI economical but still substantive.
 const rows=vp.name==="iPhone"?batch.records:batch.records.filter((_,i)=>i===0||i===5||i===10||i===15);
 const languages=vp.name==="iPhone"?batch.requiredLocales:["de","ar","ckb","tr"];
 for(const row of rows){
   for(const code of languages){
     const url=host+"/lernen/frauen-wissen/?id="+encodeURIComponent(row.id)+"&lang="+code;
     await page.goto(url,{waitUntil:"domcontentloaded"});
     await page.locator("button.fw-answer").first().waitFor({timeout:10000});
     const pack=locales.entries[row.id].locales[code];
     assert.equal(await page.locator("h1.fw-title").innerText(),pack.title,"Wrong title "+row.id+" "+code);
     assert.equal(await page.locator("html").getAttribute("dir"),["ar","ckb"].includes(code)?"rtl":"ltr","Incorrect RTL "+code);
     assert.equal(await page.locator(".fw-source").getAttribute("href"),locales.entries[row.id].sourceUrl);
     // The user can reopen the entire statement, lesson and editorial sharh
     // in the same locale without navigating away from the quiz.
     const reading=page.locator(".fw-reading-reference");
     assert.equal(await reading.count(),1);
     await reading.locator("summary").click();
     assert.equal(await reading.locator(".fw-reading-statement .fw-reading-body").innerText(),pack.statement);
     assert.equal(await reading.locator(".fw-reading-lesson .fw-reading-body").innerText(),pack.lesson);
     assert.equal(await reading.locator(".fw-reading-sharh .fw-reading-body").innerText(),pack.sharh);
     assert.equal(await reading.locator(".fw-reading-source .fw-reading-body").innerText(),pack.source);
     await reading.locator("summary").click();
     assert.equal(await page.locator(".fw-progress i").count(),4);
     assert.equal(await page.locator("button.fw-answer").count(),3);
     const q=api.questions(row.id,locales.entryIds,locales.entries,code,new Set(batch.records.map(r=>r.id)));
     // Play the full learning path, not only static DOM.
     for(let i=0;i<q.length;i++){
       assert.equal(await page.locator(".fw-question").innerText(),q[i].question);
       assert.equal(await page.locator("button.fw-answer").nth(q[i].answer).innerText().then(t=>t.replace(/^[A-C]\s*/,"").replace(/\s+/g," ").trim()),q[i].options[q[i].answer].replace(/\s+/g," ").trim());
       await page.locator("button.fw-answer").nth(q[i].answer).click();
       assert.equal(await page.locator('button.fw-answer[data-state="correct"]').count(),1);
       assert.equal(await page.locator("button.fw-next").isEnabled(),true);
       await page.locator("button.fw-next").click();
       questions++;
     }
     assert.ok((await page.locator(".fw-result").innerText()).includes("4 / 4"));
     checked++;if(["ar","ckb"].includes(code))rtl++;
   }
 }
 await context.close();
 }
 assert.equal(checked,144+3*4*4);
 assert.equal(questions,checked*4);
 assert.deepEqual(browserErrors,[]);
 console.log("PASS Frauen browser QA: "+checked+" real Chromium lesson sessions, "+questions+" answered questions, "+rtl+" RTL sessions, 4 viewport classes; hidden article gated and no repo statuses changed.");
 }finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
