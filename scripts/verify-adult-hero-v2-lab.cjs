#!/usr/bin/env node
"use strict";
/* DAR_STICKY_HERO_SAFE_V2 · isolated test harness.
 * No external production calls, no live browser cookies, no changes to apps.
 * Covers Chromium + WebKit geometry, search, keyboard focus, theme and navigation.
 */
const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const assert=require("node:assert/strict");
const {chromium,webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const evidence=path.join(root,"hero-v2-lab-evidence");
fs.mkdirSync(evidence,{recursive:true});
const file=path.join(root,"test/hero-v2-lab/index.html");
const html=fs.readFileSync(file,"utf8");
const ladyCSS=fs.readFileSync(path.join(root,"assets/frauen/frauen-authority-v1292.css"),"utf8");
const testLadyCSS=fs.readFileSync(path.join(root,"test/assets/frauen/frauen-authority-v1292.css"),"utf8");
const siteRouter=fs.readFileSync(path.join(root,"cloudflare/site-router.js"),"utf8");
const testWorker=fs.readFileSync(path.join(root,"cloudflare/test-app-worker.js"),"utf8");
assert.match(html,/DAR_STICKY_HERO_SAFE_V2/,"V2 explicit opt-in marker absent");
assert.match(html,/position:sticky;top:0/,"V2 native sticky missing");
assert.doesNotMatch(html,/appendChild\(hero\)|insertBefore\(stage|addEventListener\(["']scroll|touchmove|preventDefault\(\)/,"V2 cannot move app DOM or intercept native scroll");
for(const s of [ladyCSS,testLadyCSS]){
  assert.match(s,/--frauen-hero-img/,"Original Frauen hero image variable absent");
  assert.match(s,/\.frauen-library-hero/,"Original Frauen hero selector absent");
}
assert.ok(fs.existsSync(path.join(root,"assets/frauen/library-v1224/03-erste-generationen.jpg")),"Original Frauen photo must exist");
assert.ok(fs.existsSync(path.join(root,"assets/frauen/library-v1224/01-grundlagen-din.jpg")),"Original chapter photo must exist");
for(const s of [siteRouter,testWorker]){
  assert.ok(!s.includes('darAdultImmersiveHeroVisitorV1')&&!s.includes('darAdultImmersiveHeroTestV1'),
    "Regressed V1 auto-injection still active in production");
}
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const relative=pathname==="/test/hero-v2-lab/"?"test/hero-v2-lab/index.html":pathname.replace(/^\/+/, "");
  const resolved=path.resolve(root,relative);
  if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved)||!fs.statSync(resolved).isFile()){
    res.writeHead(404);res.end("Not found");return;
  }
  const type=/\.html$/i.test(resolved)?"text/html; charset=utf-8":/\.jpe?g$/i.test(resolved)?"image/jpeg":/\.css$/i.test(resolved)?"text/css":"application/octet-stream";
  res.writeHead(200,{"Content-Type":type,"Cache-Control":"no-store"});fs.createReadStream(resolved).pipe(res);
});
const sizes=[
  {id:"iphone-375",width:375,height:667,mobile:true},
  {id:"iphone-393",width:393,height:852,mobile:true},
  {id:"android-412",width:412,height:915,mobile:true},
  {id:"small-320",width:320,height:640,mobile:true},
  {id:"ipad-820",width:820,height:1180,mobile:true},
  {id:"tablet-landscape-1024",width:1024,height:768,mobile:true},
  {id:"desktop-1440",width:1440,height:900,mobile:false},
  {id:"landscape-844",width:844,height:390,mobile:true}
];
function snapshot(){
  const hero=document.querySelector('[data-testid="hero-photo"]');
  const rail=document.querySelector('[data-testid="sticky-rail"]');
  const search=document.querySelector('[data-testid="attached-search"]');
  const first=document.querySelector(".v2-card:not([hidden])");
  const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,width:r.width,height:r.height};};
  return {y:window.scrollY,total:document.documentElement.scrollHeight,client:innerHeight,
    hero:rect(hero),rail:rect(rail),search:rect(search),card:rect(first),
    heroBg:getComputedStyle(hero).backgroundImage,
    heroBgSize:getComputedStyle(hero).backgroundSize,
    railPosition:getComputedStyle(rail).position,
    overflowDelta:document.documentElement.scrollWidth-innerWidth,
    stageCount:document.querySelectorAll(".hero-v2-rail").length,
    appFrauenCount:document.querySelectorAll(".frauen-library-hero").length};
}
const failures=[],results=[];
const main=async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const url="http://127.0.0.1:"+server.address().port+"/test/hero-v2-lab/";
  for(const [engineName,engine] of [["chromium",chromium],["webkit",webkit]]){
    let browser;
    try{browser=await engine.launch({headless:true});}
    catch(e){failures.push(engineName+": browser unavailable "+String(e).slice(0,180));continue;}
    const cases=engineName==="chromium"?sizes:[sizes[1],sizes[4],sizes[7]];
    for(const cfg of cases){
      const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},
        deviceScaleFactor:cfg.mobile?2:1,isMobile:cfg.mobile,hasTouch:cfg.mobile,
        locale:"de-DE",reducedMotion:"reduce"});
      const page=await context.newPage();
      const label=engineName+"-"+cfg.id;
      const errors=[],badResponses=[];
      page.on("pageerror",e=>errors.push(e.message));
      page.on("response",r=>{if(r.status()>=400)badResponses.push(r.status()+" "+r.url());});
      try{
        const response=await page.goto(url,{waitUntil:"load",timeout:30000});
        assert.equal(response.status(),200,label+" fixture did not load");
        await page.waitForFunction(()=>document.querySelector("#heroV2Lab")?.dataset.ready==="1");
        const initial=await page.evaluate(snapshot);
        assert.equal(initial.stageCount,1,label+" unexpected hero stage count");
        assert.equal(initial.appFrauenCount,0,label+" must not mount actual Frauen DOM");
        assert.match(initial.heroBg,/03-erste-generationen\.jpg/,label+" hero asset absent");
        assert.match(initial.heroBgSize,/cover/,label+" hero not cover-sized");
        assert.ok(initial.hero.height>150,label+" missing hero height");
        assert.ok(initial.hero.width>=cfg.width-2&&initial.hero.left<=1,label+" hero not full-bleed");
        assert.ok(initial.overflowDelta<=2,label+" horizontal overflow "+initial.overflowDelta);
        assert.equal(initial.railPosition,"sticky",label+" initial rail must be sticky");
        assert.ok(initial.total-initial.client>160,label+" fixture lacks scrollable content");
        await page.screenshot({path:path.join(evidence,label+"-top.png")});
        await page.mouse.wheel(0,430);
        await page.waitForTimeout(200);
        const moved=await page.evaluate(snapshot);
        assert.ok(moved.y>90,label+" natural document scrolling blocked: "+moved.y);
        assert.ok(Math.abs(moved.rail.top)<=2,label+" rail moved on scroll "+moved.rail.top);
        assert.ok(moved.card.top<initial.card.top-80,label+" content did not pass under rail");
        assert.ok(Math.abs(moved.search.top-initial.search.top)<=2,label+" attached search moved independently");
        await page.screenshot({path:path.join(evidence,label+"-scrolled.png")});
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.locator("#heroV2Search").fill("Fiqh");
        assert.equal(await page.locator(".v2-card:not([hidden])").count(),1,label+" search filtering failed");
        assert.equal(await page.locator("#heroV2Search").inputValue(),"Fiqh");
        assert.equal(await page.evaluate(()=>document.activeElement?.id),"heroV2Search",label+" keyboard focus lost");
        await page.locator("#heroV2Search").fill("");
        assert.equal(await page.locator(".v2-card:not([hidden])").count(),6,label+" search reset failed");
        await page.locator('[data-title="Grundlagen des Dīn"]').click();
        assert.equal(await page.locator("#v2Detail").isVisible(),true,label+" detail navigation broken");
        assert.match(await page.locator("#v2HeroPhoto").evaluate(x=>getComputedStyle(x).backgroundImage),/01-grundlagen-din\.jpg/,label+" chapter image missing");
        await page.locator("#v2Back").click();
        assert.equal(await page.locator("#v2List").isVisible(),true,label+" back-navigation broken");
        await page.locator("#v2Theme").click();
        assert.equal(await page.locator("html").getAttribute("data-theme"),"dark",label+" theme switch failed");
        assert.ok((await page.evaluate(snapshot)).overflowDelta<=2,label+" horizontal overflow in dark theme");
        assert.deepEqual(errors,[],label+" JS errors");
        assert.deepEqual(badResponses,[],label+" failed assets");
        results.push({label,status:"ok",geometry:initial.hero,sticky:true,nativeScroll:moved.y,search:true,navigation:true,asset:"200"});
        console.log("SAFE_HERO_V2_PASS "+JSON.stringify(results[results.length-1]));
      }catch(err){
        failures.push(label+": "+String(err.stack||err).slice(0,900));
        results.push({label,status:"FAIL",error:String(err.message||err).slice(0,350)});
        console.error("SAFE_HERO_V2_FAIL "+label+" "+String(err.stack||err).slice(0,900));
        try{await page.screenshot({path:path.join(evidence,label+"-FAIL.png")})}catch(e){}
      }finally{await context.close();}
    }
    await browser.close();
  }
  // A new Hero without attached search must also pin naturally.
  try{
    const browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:393,height:852}});
    await page.goto(url+"?search=0",{waitUntil:"load"});
    assert.equal(await page.locator("#heroV2SearchRow").isVisible(),false);
    await page.mouse.wheel(0,450);await page.waitForTimeout(180);
    const s=await page.evaluate(snapshot);
    assert.equal(s.railPosition,"sticky");
    assert.ok(Math.abs(s.rail.top)<2&&s.y>70);
    results.push({label:"hero-without-search",status:"ok"});
    await browser.close();
  }catch(err){failures.push("hero-without-search: "+String(err).slice(0,450));}
};
main().catch(e=>{failures.push(String(e.stack||e));}).finally(()=>{
  server.close();
  fs.writeFileSync(path.join(evidence,"results.json"),JSON.stringify({results,failures},null,2));
  console.log("SAFE_HERO_V2_SUMMARY "+JSON.stringify({passed:results.filter(x=>x.status==="ok").length,failures}));
  if(failures.length)process.exitCode=1;
});
