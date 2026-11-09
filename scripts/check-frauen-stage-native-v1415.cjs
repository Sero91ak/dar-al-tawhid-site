#!/usr/bin/env node
"use strict";
/* HERODOCK_V1416 physical-layout browser contract. The real Frauen CSS
 * cascade and live adapter are used; content-only renderer is a fixture.
 * Chromium emulation is NOT native WKWebView or physical Android QA. */
const {chromium}=require("playwright");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const adapter=read("assets/frauen/frauen-live-adapter.js");
const css=[
  read("assets/frauen/frauen-fiqh.css"),
  read("assets/frauen/frauen-authority-v1292.css"),
  read("assets/adult-immersive-hero-v1.css"),
  read("assets/frauen/frauen-original-v1224-header-seam-v1405.css")
];
const foldCss=read("test/assets/dar-fold-workspace-v2.css");
const devices=[
  {label:"iphone",w:390,h:844},
  {label:"android",w:412,h:915},
  {label:"duo",w:594,h:820},
  {label:"fold",w:768,h:1024,inset:180},
  {label:"ipad",w:1024,h:1366},
  {label:"wide",w:1440,h:900},
  {label:"landscape",w:844,h:430}
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const device of devices){
   for(const theme of ["salbei","dar-al-layl"]){
    const ctx=await browser.newContext({viewport:{width:device.w,height:device.h},
      hasTouch:true,deviceScaleFactor:1,locale:"de-DE"});
    const page=await ctx.newPage();
    const label=device.label+"/"+theme;
    await page.setContent('<!doctype html><html data-theme="'+(theme==="salbei"?"light":"dark")+
     '" data-theme-variant="'+theme+'" class="dar-adult-global-brand-ready">'+
     '<head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
     '<style>:root{--dar-adult-header-obscured-top:90px;--dar-adult-brand-header-height:90px;}'+
     'html,body{margin:0;padding:0;min-height:100%;}'+
     'body{--bg:#e7ede5;--card:#fffefa;background:var(--bg)}'+
     '#darAdultBrandHeaderV2{position:fixed;top:0;left:0;right:0;height:90px;z-index:730;'+
     'background:#f5f5e9;box-sizing:border-box}'+
     '#darAdultBrandHeaderSpacerV2{height:90px}'+
     '.app{width:100%;max-width:100%;min-height:2300px;}'+
     '#appView{width:calc(100% - '+(device.inset||0)+'px);margin-left:'+(device.inset||0)+
     'px;min-height:2100px;box-sizing:border-box;}'+
     '.frauen-library-shell{min-height:2000px;}'+
     '.frauen-library-grid{display:block;padding:12px;}'+
     '.frauen-library-card{min-height:96px;border-bottom:1px solid #889a89;}'+
     '.frauen-library-card button{display:block;min-width:160px;padding:14px;}'+
     '.frauen-library-search-wrap input{font-size:16px;min-height:36px;max-width:100%;}'+
     '</style></head><body class="is-frauen-route has-bottom-nav is-area-route" data-frauen-view="hub">'+
     '<header id="darAdultBrandHeaderV2">DĀR AL TAWḤĪD</header>'+
     '<div class="app"><div id="darAdultBrandHeaderSpacerV2"></div>'+
     '<main id="appView" class="view"></main></div></body></html>');
    for(const content of (device.label==="fold"?css.slice(0,-1).concat([foldCss,css[css.length-1]]):css))
      await page.addStyleTag({content});
    await page.evaluate(()=>{
     location.hash="#frauen";
     window.__query="";
     window.render=function(){};
     window.readRoute=function(){return {view:"frauen",value:location.hash.replace(/^#frauen\/?/,"")}};
     window.DARFrauenFiqh={
      render:function(value){
       const group=value.indexOf("group/")===0;
       const q=window.__query;
       const safe=q.replace(/[&<>"']/g,"");
       const cards=Array.from({length:25},(_,i)=>
         '<article class="frauen-library-card"><button data-nav="frauen" data-value="group/din">'+
          'Kapitel '+(i+1)+'</button></article>').join("");
       return '<div class="frauen-library-shell">'+
        '<section class="frauen-library-hero frauen-library-hero--'+(group?'group frauen-library-hero--tone-din':'hub')+
        '"><div class="frauen-library-hero__content"><p class="frauen-library-hero__eyebrow">Wissensbibliothek</p>'+
        '<h2>Frauen im Islam</h2><p class="frauen-library-hero__subtitle">Originale Quellen und Kapitel</p>'+
        '<div class="frauen-library-hero__stats"><span>7 Wissenswelten</span></div></div></section>'+
        (group?'':'<div class="frauen-library-search-wrap"><div class="frauen-search-pro">'+
        '<div class="search-input-shell"><input data-frauen-q value="'+safe+'" aria-label="Suche"></div>'+
        '</div></div>')+
        '<div class="frauen-library-section-head"><h3>Ergebnisse für '+safe+'</h3></div>'+
        '<section class="frauen-library-grid">'+cards+'</section></div>';
      },
      bind:function(){
       const input=document.querySelector("[data-frauen-q]");
       if(input&&!input.dataset.bound){
        input.dataset.bound="1";
        input.addEventListener("input",()=>{
         window.__query=input.value;
         window.render();
        });
       }
      }
     };
    });
    await page.addScriptTag({content:adapter});
    await page.waitForFunction(()=>!!document.getElementById("darFrauenHeroDockV1416")&&
      parseInt(document.body.style.getPropertyValue("--frauen-dock-reserved"),10)>0);
    const first=await page.evaluate(()=>{
      const stage=document.getElementById("darFrauenHeroDockV1416");
      const hero=stage.querySelector(".frauen-library-hero");
      const input=stage.querySelector("[data-frauen-q]");
      const spacer=document.querySelector("#appView .dar-frauen-dock-spacer");
      const app=document.getElementById("appView");
      window.__stage=stage;window.__hero=hero;window.__search=input;
      const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,
        width:r.width,height:r.height,bottom:r.bottom}};
      return {parent:stage.parentElement.tagName,stageCount:document.querySelectorAll("#darFrauenHeroDockV1416").length,
       photoCount:document.querySelectorAll(".frauen-library-hero").length,
       searchCount:document.querySelectorAll("[data-frauen-q]").length,
       photo:rect(hero),dock:rect(stage),app:rect(app),spacer:rect(spacer),
       position:getComputedStyle(stage).position,background:getComputedStyle(hero).backgroundImage};
    });
    assert.equal(first.parent,"BODY",label+": fixed Dock must be direct BODY child");
    assert.equal(first.stageCount,1,label+": duplicate Dock");
    assert.equal(first.photoCount,1,label+": duplicated original image");
    assert.equal(first.searchCount,1,label+": duplicate search");
    assert.equal(first.position,"fixed",label+": not a fixed viewport Dock");
    assert.ok(Math.abs(first.dock.top-90)<=2,label+": header seam "+JSON.stringify(first));
    assert.ok(Math.abs(first.dock.left-first.app.left)<=2,label+": reading pane inset lost");
    assert.ok(Math.abs(first.dock.width-first.app.width)<=2,label+": not full width");
    assert.ok(Math.abs(first.photo.width-first.app.width)<=2,label+": image not full bleed");
    assert.ok(Math.abs(first.spacer.height-first.dock.height)<=2,label+": ghost gap");
    assert.ok(first.background.includes("library-v1224/"),label+": original photo changed");
    await page.evaluate(()=>{for(let i=0;i<40;i++)window.render();window.scrollTo(0,750)});
    await page.waitForTimeout(150);
    const moved=await page.evaluate(()=>{
      const stage=document.getElementById("darFrauenHeroDockV1416");
      return {top:stage.getBoundingClientRect().top,scroll:window.scrollY,
        same:stage===window.__stage&&stage.querySelector(".frauen-library-hero")===window.__hero};
    });
    assert.ok(moved.scroll>400,label+": document scroll stuck");
    assert.ok(Math.abs(moved.top-90)<=2,label+": photo flicker/scroll drift");
    assert.ok(moved.same,label+": render tick replaced photo");
    await page.locator("[data-frauen-q]").fill("Wissen");
    await page.waitForTimeout(120);
    const updated=await page.evaluate(()=>{
      const stage=document.getElementById("darFrauenHeroDockV1416");
      return {same:stage===window.__stage&&stage.querySelector(".frauen-library-hero")===window.__hero,
        sameInput:stage.querySelector("[data-frauen-q]")===window.__search,
        focused:document.activeElement===window.__search,
        text:document.querySelector(".frauen-library-section-head")?.textContent,
        scroll:window.scrollY,stageCount:document.querySelectorAll("#darFrauenHeroDockV1416").length};
    });
    assert.ok(updated.same&&updated.sameInput&&updated.focused,label+": search reconstructed original input");
    assert.ok(updated.text.includes("Wissen"),label+": search not updated");
    assert.ok(updated.scroll>400,label+": input jumped to scroll top "+JSON.stringify(updated));
    assert.equal(updated.stageCount,1,label+": duplicate stage on input");
    if(device.h>600){
      await page.setViewportSize({width:device.w,height:device.h-220});
      await page.waitForTimeout(130);
      const keyboard=await page.evaluate(()=>({
       top:document.getElementById("darFrauenHeroDockV1416").getBoundingClientRect().top,
       same:document.querySelector("[data-frauen-q]")===window.__search
      }));
      assert.ok(Math.abs(keyboard.top-90)<=2&&keyboard.same,label+": keyboard moved photo/input");
    }
    await page.evaluate(()=>window.scrollTo(0,1100));
    await page.locator(".frauen-library-grid button").last().click();
    await page.waitForFunction(()=>location.hash.includes("group/din")&&
      document.getElementById("darFrauenHeroDockV1416")?.dataset.hasSearch==="0");
    const group=await page.evaluate(()=>({
      docks:document.querySelectorAll("#darFrauenHeroDockV1416").length,
      photos:document.querySelectorAll(".frauen-library-hero").length,
      inputs:document.querySelectorAll("[data-frauen-q]").length,
      reserve:parseInt(document.body.style.getPropertyValue("--frauen-dock-reserved"),10)
    }));
    assert.equal(group.docks,1,label+": duplicate dock on group route");
    assert.equal(group.photos,1,label+": duplicate photo on group route");
    assert.equal(group.inputs,0,label+": stale search input on group route");
    assert.ok(group.reserve>0,label+": missing group spacer");
    await page.evaluate(()=>{location.hash="#home";window.render()});
    await page.waitForTimeout(100);
    const exit=await page.evaluate(()=>({
      docks:document.querySelectorAll("#darFrauenHeroDockV1416").length,
      reserved:document.body.style.getPropertyValue("--frauen-dock-reserved")
    }));
    assert.equal(exit.docks,0,label+": dock leaked into other routes");
    assert.equal(exit.reserved,"",label+": spacer leaked into other routes");
    if(device.label==="fold"&&theme==="salbei"){
      await page.evaluate(()=>{
        location.hash="#frauen";
        window.render();
        const pane=document.createElement("main");
        pane.id="darFoldV2Pane";
        const bar=document.createElement("header");bar.id="darFoldV2Topbar";
        document.body.append(bar,pane);
        pane.appendChild(document.getElementById("appView"));
        document.documentElement.style.setProperty("--dar-fold-v2-rail","220px");
        document.documentElement.style.setProperty("--dar-fold-v2-top","48px");
        document.documentElement.classList.add("dar-fold-v2-active");
      });
      await page.waitForFunction(()=>{
        const d=document.getElementById("darFrauenHeroDockV1416");
        const p=document.getElementById("darFoldV2Pane");
        if(!d||!p)return false;
        const a=d.getBoundingClientRect(),b=p.getBoundingClientRect();
        return Math.abs(a.top-48)<=2&&Math.abs(a.left-b.left)<=2&&
          Math.abs(a.width-b.width)<=2;
      });
      const split=await page.evaluate(()=>{
        const d=document.getElementById("darFrauenHeroDockV1416");
        const p=document.getElementById("darFoldV2Pane");
        p.scrollTop=300;
        return {top:d.getBoundingClientRect().top,
          left:d.getBoundingClientRect().left,
          right:d.getBoundingClientRect().right,
          paneLeft:p.getBoundingClientRect().left,
          overflow:getComputedStyle(document.body).overflowY,
          scroll:p.scrollTop};
      });
      assert.equal(split.overflow,"hidden",label+": Fold independent scroll root was overridden");
      assert.ok(split.scroll>200,label+": Fold reading pane cannot scroll");
      assert.ok(Math.abs(split.top-48)<=2,label+": Fold dock detached from local topbar");
      assert.ok(Math.abs(split.left-split.paneLeft)<=2,label+": Fold rail is covered");
      console.log("PASS HeroDock V1416 Fold V2 true split-pane / independent reader scroll");
    }
    console.log("PASS HeroDock V1416 "+label+
      " — original widescreen, one header, stable scroll/search, route return");
    await ctx.close();
   }
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
