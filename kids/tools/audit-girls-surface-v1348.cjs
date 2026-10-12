"use strict";
const {chromium}=require("playwright");
const BASE="https://dar-kids-ipad-preview.sero91ak.workers.dev";
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const ctx=await browser.newContext({viewport:{width:414,height:896},isMobile:true,hasTouch:true});
  await ctx.addInitScript(()=>{
   const id="audit-girl";
   localStorage.setItem("kids.activeProfile",id);
   localStorage.setItem("kids.profiles.v1",JSON.stringify([{id,gender:"girl",age:"6–8",name:"Test",data:{}}]));
  });
  const page=await ctx.newPage();await page.goto(BASE+"/kids/start?audit=palette-v1348",{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForTimeout(700);
  for(const dest of ["today","stories","dua","quran","parents"]){
   const btn=page.locator('.nav-btn[data-target="'+dest+'"]');
   if(dest!=="today"){if(await btn.count())await btn.click({timeout:7000,force:true}).catch(()=>{});await page.waitForTimeout(450);}
   const result=await page.evaluate(d=>{
    const view=document.querySelector("#view-"+d);
    const root=document.querySelector(".app");
    if(!view)return {view:d,error:"not found"};
    const css=getComputedStyle(view);
    const colors=[];
    const set=new Set();
    const elements=[view,...view.querySelectorAll("*")];
    for(const el of elements){
      const rect=el.getBoundingClientRect();
      if(rect.width<36||rect.height<20||rect.height>1800||rect.width>1100)continue;
      const cs=getComputedStyle(el),raw=cs.backgroundColor;
      if(!raw||raw==="rgba(0, 0, 0, 0)"||raw==="transparent")continue;
      if(/url\(/.test(cs.backgroundImage))continue;
      const arr=raw.match(/[\d.]+/g)?.map(Number)||[];
      if(arr.length<3)continue;
      const [r,g,b,a=1]=arr;
      // Saturated teal/navy/blue non-photographic surfaces.
      if(a<.25||b<38)continue;
      const cyan=g>r*1.32&&g>53&&b>=g*.76;
      const brightBlue=b>r*1.48&&b>g*1.13&&b>70;
      if(!(cyan||brightBlue))continue;
      const klass=String(el.className||"").slice(0,100);
      const key=[el.tagName,klass,raw].join("|");
      if(set.has(key))continue;set.add(key);
      colors.push({tag:el.tagName,klass,color:raw,bgImage:cs.backgroundImage.slice(0,160),w:Math.round(rect.width),h:Math.round(rect.height),text:el.textContent?.trim().slice(0,38)});
    }
    return {view:d,gender:root.dataset.gender,display:css.display,count:elements.length,cyanBlueSurfaces:colors.slice(0,36)};
   },dest);
   console.log("GIRL_SURFACE_AUDIT "+JSON.stringify(result));
  }
  await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error("AUDIT_ERROR",e);process.exitCode=1});
