#!/usr/bin/env node
"use strict";
/* FRAUEN_COMPACT_EDITORIAL_V1417_ACCEPTANCE
 * True V1416 Frauen CSS cascade, original live-adapter DOM owner,
 * original img/custom properties and fixed search. Chromium emulation is
 * not a real iOS WKWebView or Android device sign-off.
 */
const {chromium}=require("playwright");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const base=[
 read("assets/frauen/frauen-fiqh.css"),
 read("assets/frauen/frauen-authority-v1292.css"),
 read("assets/adult-immersive-hero-v1.css"),
 read("assets/frauen/frauen-original-v1224-header-seam-v1405.css")
];
const compact=read("assets/frauen/frauen-compact-editorial-v1417.css");
const adapter=read("assets/frauen/frauen-live-adapter.js");
const devices=[
 {name:"small",w:320,h:700},
 {name:"iphone",w:390,h:844},
 {name:"android",w:430,h:932},
 {name:"duo",w:600,h:820},
 {name:"fold-pane",w:768,h:1024,inset:235},
 {name:"ipad",w:1024,h:1366},
 {name:"desktop",w:1280,h:900},
 {name:"landscape",w:844,h:430}
];
const themes=["salbei","dar-al-layl"];
const check=(condition,message)=>assert.ok(condition,message);
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try {
 for(const device of devices) for(const theme of themes){
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},
   hasTouch:true,deviceScaleFactor:1,locale:"de-DE"});
  const page=await context.newPage();
  const label=device.name+"/"+theme;
  await page.setContent('<!doctype html><html data-theme="'+(theme==="salbei"?"light":"dark")+
    '" data-theme-variant="'+theme+'" class="dar-adult-global-brand-ready"><head>'+
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
    '<style>:root{--dar-adult-header-obscured-top:80px;--dar-adult-brand-header-height:80px;}'+
    'html,body{margin:0;padding:0;min-height:100%}body{--bg:#e8efe5;--card:#fdfdf8;'+
    '--text:#132620;--gold2:#b39b62;--line:rgba(120,112,92,.3);background:var(--bg)}'+
    '#darAdultBrandHeaderV2{position:fixed;top:0;left:0;right:0;height:80px;z-index:730;background:#ebf0e7}'+
    '#darAdultBrandHeaderSpacerV2{height:80px} .app{width:100%;min-height:2500px;}'+
    '#appView{width:calc(100% - '+(device.inset||0)+'px);margin-left:'+(device.inset||0)+
    'px;min-height:2200px;box-sizing:border-box}'+
    '.frauen-library-shell{min-height:2100px}.frauen-search-pro input{width:100%;box-sizing:border-box}'+
    '.frauen-library-grid,.frauen-library-area-grid{display:grid}'+
    '</style></head><body class="has-bottom-nav is-area-route is-frauen-route" data-frauen-view="hub">'+
    '<header id="darAdultBrandHeaderV2">DĀR AL TAWḤĪD</header>'+
    '<div class="app"><div id="darAdultBrandHeaderSpacerV2"></div>'+
    '<main id="appView" class="view"></main></div></body></html>');
  for(const css of base)await page.addStyleTag({content:css});
  await page.evaluate(()=>{
   location.hash="#frauen";
   window.__q="";
   window.render=function(){};
   window.readRoute=function(){
     return location.hash.startsWith("#frauen") ?
       {view:"frauen",value:location.hash.replace(/^#frauen\/?/,"")} :
       {view:"home",value:""};
   };
   window.DARFrauenFiqh={
    render:function(value){
     const group=value.startsWith("group/");
     /* Mirror the exact original frauen-fiqh.js render() route flag. */
     document.body.setAttribute("data-frauen-view",group?"group":"hub");
     const photo="/assets/frauen/library-v1224/01-grundlagen.jpg";
     const desc="Tawḥīd, Īmān, Dhikr, Reue und die Grundlagen eines rechtschaffenen Lebens.";
     const longDesc="Geprüfte Grundlagen zu Dīn, Charakter, Verantwortung und Grenzen des Gehorsams. Eine vollständige Beschreibung mit gut lesbaren Inhalten.";
     const card=(id,i)=>group?
       '<article class="frauen-library-area-card has-visual" data-nav="frauen" data-value="din/'+i+
         '" style="--frauen-card-img:url('+photo+')">'+
         '<span class="frauen-library-area-card__nr">0'+i+'</span>'+
         '<div class="frauen-library-area-card__copy">'+
         '<h3>'+ (i===1?"Tawḥīd, Īmān & ʿIbādah":"Rechtschaffene Muslimah") +'</h3>'+
         '<p>'+longDesc+'</p><span class="frauen-library-area-card__meta">6 Inhalte</span></div>'+
         '<span class="frauen-library-area-card__arrow">›</span></article>':
       '<article class="frauen-library-card has-visual" data-nav="frauen" data-value="group/din"'+
         ' style="--frauen-card-img:url('+photo+')">'+
         '<span class="frauen-library-card__nr">0'+i+'</span>'+
         '<div class="frauen-library-card__copy">'+
         '<p class="frauen-library-card__kicker">ʿAQĪDAH · ʿIBĀDAH</p>'+
         '<h3>'+ (i===1?"Grundlagen des Dīn":"Fiqh der Frauen")+'</h3>'+
         '<p class="frauen-library-card__desc">'+desc+'</p>'+
         '<span class="frauen-library-card__meta">7 Kapitel · 33 Inhalte</span></div>'+
         '<span class="frauen-library-card__arrow">›</span></article>';
     const cards=Array.from({length:12},(_,i)=>card(i+1,i+1)).join("");
     return '<div class="frauen-library-shell">'+
       '<section class="frauen-library-hero frauen-library-hero--'+
          (group?"group frauen-library-hero--tone-din":"hub")+'">'+
         '<div class="frauen-library-hero__shade"></div>'+
         '<div class="frauen-library-hero__content">'+
           (group?'<button class="frauen-library-back" data-nav="frauen" data-value="">'+
                  '<b>Zurück</b></button>':'')+
           '<p class="frauen-library-hero__eyebrow">DĀR AL TAWḤĪD · WISSENSBIBLIOTHEK</p>'+
           '<h2>'+(group?"Grundlagen des Dīn":"Frauen im Islam")+'</h2>'+
           '<p class="frauen-library-hero__subtitle">'+
             (group?"Tawḥīd, Īmān, Dhikr, Reue und die Grundlagen eines rechtschaffenen Lebens.":
               "Qurʾān · Sunnah · Fiqh · Frauen der ersten Generationen")+'</p>'+
           '<div class="frauen-library-hero__stats"></div></div></section>'+
       (group?"":'<div class="frauen-library-search-wrap"><div class="frauen-search-pro">'+
         '<div class="search-input-shell"><input class="search-input-field" data-frauen-q'+
         ' aria-label="Suche" value="'+window.__q+'" placeholder="Thema, Aussage, Person oder Werk suchen">'+
         '</div></div></div>')+
       '<div class="frauen-library-section-head"><div><span>BIBLIOTHEK</span>'+
         '<h3>'+(group?"Wähle deinen Bereich":"Wissen geordnet nach Lebensbereichen")+'</h3></div>'+
         '<p>Die bisherigen Einzelbereiche bleiben erhalten und sind klarer zusammengefasst.</p></div>'+
       '<section class="'+(group?"frauen-library-area-grid":"frauen-library-grid")+'">'+cards+'</section></div>';
    },
    bind:function(){
     const input=document.querySelector("[data-frauen-q]");
     if(input&&!input.dataset.bound){
       input.dataset.bound="1";
       input.addEventListener("input",()=>{
         window.__q=input.value;window.render();
       });
     }
    }
   };
  });
  await page.addScriptTag({content:adapter});
  await page.waitForFunction(()=>document.getElementById("darFrauenHeroDockV1416")&&
   parseInt(document.body.style.getPropertyValue("--frauen-dock-reserved"),10)>0);
  const baseline=await page.evaluate(()=>{
    const dock=document.getElementById("darFrauenHeroDockV1416");
    const hero=dock.querySelector(".frauen-library-hero");
    const card=document.querySelector("#appView .frauen-library-card.has-visual");
    const input=document.querySelector("[data-frauen-q]");
    const snap=e=>{const r=e.getBoundingClientRect();return{top:r.top,left:r.left,width:r.width,
      height:r.height,bottom:r.bottom}};
    window.__stage=dock;window.__photo=hero;window.__input=input;
    return {hero:snap(hero),dock:snap(dock),card:snap(card),
      originalHero:getComputedStyle(hero).backgroundImage,
      originalCard:getComputedStyle(card).backgroundImage,
      backgroundPosition:getComputedStyle(card).backgroundPosition,
      backgroundSize:getComputedStyle(card).backgroundSize,
      search:snap(input)};
  });
  await page.addStyleTag({content:compact});
  await page.waitForTimeout(150);
  const after=await page.evaluate(()=>{
    const dock=document.getElementById("darFrauenHeroDockV1416");
    const hero=dock.querySelector(".frauen-library-hero");
    const card=document.querySelector("#appView .frauen-library-card.has-visual");
    const input=document.querySelector("[data-frauen-q]");
    const desc=card.querySelector(".frauen-library-card__desc");
    const copy=card.querySelector(".frauen-library-card__copy");
    const spacer=document.querySelector(".dar-frauen-dock-spacer");
    const rect=e=>{const r=e.getBoundingClientRect();return{top:r.top,left:r.left,
      width:r.width,height:r.height,bottom:r.bottom}};
    return {hero:rect(hero),dock:rect(dock),card:rect(card),search:rect(input),
      dockOwner:dock===window.__stage&&hero===window.__photo,
      inputOwner:input===window.__input,
      photo:getComputedStyle(hero).backgroundImage,
      cardArt:getComputedStyle(card).backgroundImage,
      cardPosition:getComputedStyle(card).backgroundPosition,
      cardSize:getComputedStyle(card).backgroundSize,
      description:desc.textContent,descLines:getComputedStyle(desc).webkitLineClamp,
      descVisible:getComputedStyle(desc).visibility,
      descHeight:rect(desc).height,descScroll:desc.scrollHeight,
      copyScroll:copy.scrollHeight,copyHeight:rect(copy).height,
      title:card.querySelector("h3").textContent,
      cols:getComputedStyle(document.querySelector(".frauen-library-grid")).gridTemplateColumns.split(" ").length,
      spacerHeight:rect(spacer).height,bodyReserve:parseInt(document.body.style.getPropertyValue("--frauen-dock-reserved"),10),
      matches:document.querySelectorAll("#darFrauenHeroDockV1416").length,
      inputs:document.querySelectorAll("[data-frauen-q]").length,
      fontSize:parseFloat(getComputedStyle(input).fontSize),
      scrollWidth:document.documentElement.scrollWidth,viewWidth:document.documentElement.clientWidth};
  });
  const near=(a,b,tol=2)=>Math.abs(a-b)<=tol;
  check(after.dockOwner&&after.inputOwner,label+": DOM owner or search replaced");
  check(after.matches===1&&after.inputs===1,label+": duplicate dock/search");
  check(near(after.dock.top,80),label+": shifted below global brand");
  check(near(after.hero.width,baseline.hero.width),label+": lost full bleed");
  check(after.photo===baseline.originalHero,label+": hero image changed");
  check(after.cardArt===baseline.originalCard,label+": card image changed");
  check(after.cardPosition===baseline.backgroundPosition,label+": image crop position changed");
  check(after.cardSize===baseline.backgroundSize,label+": image scaling changed");
  check(after.search.height>=48&&after.fontSize>=16,label+": iOS accessible input lost");
  check(after.card.height<=baseline.card.height+2,label+": compact card enlarged "+
    JSON.stringify({old:baseline.card.height,new:after.card.height}));
  if(device.name!=="landscape")
    check(after.hero.height<=baseline.hero.height+2,label+": compact hero enlarged "+
      JSON.stringify({old:baseline.hero.height,new:after.hero.height}));
  check(after.description.includes("rechtschaffenen")&&after.descHeight>=14,
    label+": card description missing");
  check(after.descVisible!=="hidden"&&after.descScroll<=after.descHeight+3,
    label+": card description clipped");
  check(after.copyScroll<=after.copyHeight+3,label+": copy text clipped");
  check(near(after.spacerHeight,after.dock.height)&&near(after.spacerHeight,after.bodyReserve),
    label+": stale V1416 spacer after compact stylesheet");
  check(after.scrollWidth<=after.viewWidth+2,label+": horizontal overflow");
  if(device.inset&&device.w-device.inset<690)
    check(after.cols===1,label+": Fold reading pane got two cramped cards");
  await page.evaluate(()=>{for(let i=0;i<25;i++)window.render();window.scrollTo(0,800)});
  await page.waitForTimeout(110);
  const scroll=await page.evaluate(()=>({
    y:window.scrollY,
    top:document.getElementById("darFrauenHeroDockV1416").getBoundingClientRect().top,
    same:document.getElementById("darFrauenHeroDockV1416")===window.__stage
  }));
  check(scroll.y>390&&near(scroll.top,80)&&scroll.same,label+": scrolling/fixed photo broken");
  await page.locator("[data-frauen-q]").fill("Sunnah");
  await page.waitForTimeout(70);
  const focus=await page.evaluate(()=>({
    same:document.querySelector("[data-frauen-q]")===window.__input,
    active:document.activeElement===window.__input,
    value:document.querySelector("[data-frauen-q]")?.value
  }));
  check(focus.same&&focus.active&&focus.value==="Sunnah",label+": input/search focus regression");
  await page.evaluate(()=>{location.hash="#frauen/group/din";window.render()});
  await page.waitForFunction(()=>document.querySelector(".frauen-library-area-card.has-visual")&&
    document.body.dataset.frauenView==="group" &&
    document.getElementById("darFrauenHeroDockV1416")?.dataset.hasSearch==="0");
  await page.waitForTimeout(100);
  const group=await page.evaluate(()=>{
    const hero=document.querySelector("#darFrauenHeroDockV1416 .frauen-library-hero");
    const card=document.querySelector(".frauen-library-area-card.has-visual");
    const desc=card.querySelector("p");
    const back=hero.querySelector(".frauen-library-back");
    const caption=hero.querySelector(".frauen-library-hero__eyebrow");
    const title=hero.querySelector("h2");
    return {min:card.getBoundingClientRect().height,
      descVisible:desc.scrollHeight<=desc.getBoundingClientRect().height+3,
      back:!!back&&back.getBoundingClientRect().height>=20,
      text:title.textContent,eyebrow:caption.textContent,
      heroHeight:hero.getBoundingClientRect().height,
      cardBg:getComputedStyle(card).backgroundImage,
      groupCol:getComputedStyle(document.querySelector(".frauen-library-area-grid")).gridTemplateColumns.split(" ").length,
      sameDock:document.getElementById("darFrauenHeroDockV1416")===window.__stage,
      inputs:document.querySelectorAll("[data-frauen-q]").length};
  });
  check(group.min>=135&&group.descVisible&&group.back,label+": group card/back truncated");
  check(group.heroHeight>=200||device.name==="landscape",label+": group hero too short");
  check(group.eyebrow.includes("WISSENSBIBLIOTHEK"),label+": hero title text lost");
  check(group.sameDock&&group.inputs===0,label+": group route duplicated search/dock");
  check(group.cardBg.includes("library-v1224"),label+": group image replaced");
  if(device.inset&&device.w-device.inset<690)
    check(group.groupCol===1,label+": Fold group squeezing into 2 columns");
  await page.evaluate(()=>{location.hash="#home";window.render()});
  await page.waitForTimeout(90);
  const exit=await page.evaluate(()=>({
    dock:document.querySelectorAll("#darFrauenHeroDockV1416").length,
    reserve:document.body.style.getPropertyValue("--frauen-dock-reserved")
  }));
  check(exit.dock===0&&exit.reserve==="",label+": route exit leaked fixed photo");
  console.log("PASS compact V1417 "+label+
   " hero "+baseline.hero.height.toFixed(0)+"→"+after.hero.height.toFixed(0)+
   " card "+baseline.card.height.toFixed(0)+"→"+after.card.height.toFixed(0)+
   " group "+group.min.toFixed(0)+", texts/search/scroll preserved");
  await context.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
