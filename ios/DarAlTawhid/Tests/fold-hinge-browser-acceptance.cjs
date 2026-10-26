#!/usr/bin/env node
"use strict";
/* Exact two-half fold layout acceptance in a real browser, with a synthetic
   UIKit division rectangle as a fixture. Never pretend the fixture is a
   physical device measurement. */
const assert=require("node:assert/strict");
const {chromium,webkit}=require("playwright");
const engine=process.env.DAR_HINGE_ENGINE==="webkit"?webkit:chromium;
const base=process.env.DAR_AUDIT_BASE_URL||"http://127.0.0.1:8765/";
(async()=>{
  const browser=await engine.launch({headless:true,args:engine===chromium?["--no-sandbox"]:[]});
  try{
    const context=await browser.newContext({
      viewport:{width:1024,height:1366},
      userAgent:"DarAlTawhid-iOS/1.0 WKWebView",hasTouch:true,isMobile:true,
      locale:"de-DE",reducedMotion:"reduce"
    });
    const page=await context.newPage();
    await page.goto(base+"#quran",{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForFunction(()=>!!window.DarFoldHinge&&!!document.querySelector("#appView"),
      null,{timeout:15000});
    await page.evaluate(()=>{
      // Browser-only test fixture. No production content or route state is edited.
      const shell=document.createElement("div");
      shell.className="dar-fold";
      shell.setAttribute("data-fold-mode","dual");
      shell.setAttribute("data-fold-single-show","rail");
      shell.id="darHingeBrowserFixture";
      shell.innerHTML='<aside class="dar-fold__rail">Linke Hälfte: Liste</aside>'+
        '<section class="dar-fold__pane">Rechte Hälfte: Text und Lesebereich</section>';
      document.getElementById("appView").appendChild(shell);
      window.DarFoldHinge.sync();
    });
    async function check(w,h,dual){
      await page.setViewportSize({width:w,height:h});
      await page.waitForTimeout(420);
      const r=await page.evaluate(()=>{
        const root=document.documentElement,wrapper=document.getElementById("darHingeBrowserFixture");
        const rail=wrapper.querySelector(".dar-fold__rail"),pane=wrapper.querySelector(".dar-fold__pane");
        const rect=x=>{let b=x.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
        return {paired:root.getAttribute("data-dar-hinge-layout"),
          source:root.getAttribute("data-dar-hinge-source"),
          axis:root.getAttribute("data-dar-hinge-axis"),
          mode:root.getAttribute("data-fold-dual"),
          display:getComputedStyle(wrapper).display,
          grid:getComputedStyle(wrapper).gridTemplateColumns,
          wrap:rect(wrapper),rail:rect(rail),pane:rect(pane)};
      });
      if(dual){
        assert.equal(r.paired,"paired",w+"x"+h+" paired");
        assert.equal(r.mode,"1",w+"x"+h+" master/detail");
        assert.equal(r.display,"grid",w+"x"+h+" grid");
        assert.ok(r.rail.width>270&&r.pane.width>270,"both halves readable "+JSON.stringify(r));
        assert.ok(Math.abs(r.rail.width-r.pane.width)<3,"halves must be symmetric "+JSON.stringify(r));
        assert.ok(r.rail.right+20<=r.pane.left,"center clearance "+JSON.stringify(r));
        assert.ok(r.rail.left>=r.wrap.left-2&&r.pane.right<=r.wrap.right+2,
          "content must not move beyond app shell "+JSON.stringify(r));
      }else{
        assert.notEqual(r.paired,"paired","compact screen must not retain 2 panes");
      }
      console.log("OK",w+"x"+h, r.paired||"compact",r.grid);
      return r;
    }
    await check(1024,1366,true);
    await check(1366,1024,true);
    await check(390,844,false);
    await check(1024,1366,true);
    const geometry=await page.evaluate(()=>{
      const root=document.getElementById("darHingeBrowserFixture").getBoundingClientRect();
      return {x:innerWidth/2-20,y:0,width:40,height:innerHeight,
        shellLeft:root.left,shellRight:root.right};
    });
    await page.evaluate(region=>{
      window.dispatchEvent(new CustomEvent("dar:native-fold-region",{detail:{
        axis:"vertical",active:true,frame:region,
        viewportWidth:innerWidth,viewportHeight:innerHeight}}));
    },geometry);
    await page.waitForTimeout(300);
    const measured=await page.evaluate(()=>{
      const shell=document.getElementById("darHingeBrowserFixture");
      return {source:document.documentElement.getAttribute("data-dar-hinge-source"),
        measured:shell.getAttribute("data-dar-hinge-measured"),
        rail:shell.querySelector(".dar-fold__rail").getBoundingClientRect().right,
        pane:shell.querySelector(".dar-fold__pane").getBoundingClientRect().left};
    });
    assert.equal(measured.source,"native");
    assert.equal(measured.measured,"1","physical region coordinates must be applied");
    assert.ok(measured.rail<=geometry.x+1,"left region must end before fold");
    assert.ok(measured.pane>=geometry.x+geometry.width-1,"right region begins after fold");
    await page.evaluate(()=>{
      window.dispatchEvent(new CustomEvent("dar:native-fold-region",{detail:{active:false}}));
    });
    await page.waitForTimeout(220);
    assert.equal((await check(1024,1366,true)).source,"capacity",
      "when fully open, remove physical fold avoidance but preserve paired reading");
    // Hardware takes precedence over the old 900px "desktop" breakpoint:
    // a partially folded 800px inner window still has two usable halves.
    await page.setViewportSize({width:800,height:900});
    await page.waitForTimeout(260);
    await page.evaluate(()=>{
      window.dispatchEvent(new CustomEvent("dar:native-fold-region",{detail:{
        axis:"vertical",active:true,
        frame:{x:385,y:0,width:30,height:900},
        viewportWidth:800,viewportHeight:900
      }}));
    });
    await page.waitForTimeout(300);
    const narrowFold=await page.evaluate(()=>{
      const shell=document.getElementById("darHingeBrowserFixture");
      const left=shell.querySelector(".dar-fold__rail").getBoundingClientRect();
      const right=shell.querySelector(".dar-fold__pane").getBoundingClientRect();
      return {layout:document.documentElement.getAttribute("data-dar-hinge-layout"),
        source:document.documentElement.getAttribute("data-dar-hinge-source"),
        leftRight:left.right,rightLeft:right.left,
        widthLeft:left.width,widthRight:right.width,
        visibleLeft:getComputedStyle(shell.querySelector(".dar-fold__rail")).display!=="none",
        visibleRight:getComputedStyle(shell.querySelector(".dar-fold__pane")).display!=="none"};
    });
    assert.equal(narrowFold.source,"native");
    assert.equal(narrowFold.layout,"paired");
    assert.ok(narrowFold.visibleLeft&&narrowFold.visibleRight,
      "Measured narrow Fold must not hide either half");
    assert.ok(narrowFold.leftRight<=386&&narrowFold.rightLeft>=414,
      "Measured middle division must be kept empty");
    assert.ok(narrowFold.widthLeft>270&&narrowFold.widthRight>270,
      "Both narrow-fold pages must stay readable");
    await page.evaluate(()=>{
      window.dispatchEvent(new CustomEvent("dar:native-fold-region",{detail:{active:false}}));
    });
    await page.waitForTimeout(220);
    assert.notEqual(await page.locator("html").getAttribute("data-dar-hinge-layout"),"paired");
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
