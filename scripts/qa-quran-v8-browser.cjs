const {chromium}=require('playwright');
const fs=require('node:fs');
const host='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
const cases=[['tiny',320,568],['compact',360,640],['iphone',390,844],['iphone-max',430,932],['fold-closed',600,800],['fold-hinge',719,900],['fold-open',720,900],['tablet',820,1180],['ipad-landscape',1024,768],['desktop',1440,900]];
const files=[['adult','dar-al-tawhid-quran-player-v8.html'],['kids','tawhid-kids-quran-player-v8.html']];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 fs.mkdirSync('.qa-quran-shots',{recursive:true});
 let failed=0,total=0;
 for(const [kind,file] of files){
 for(const [device,w,h] of cases){
  total++;
  const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:w<720,isMobile:w<720});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   const response=await page.goto(host+'/'+file+'?qa=v8-'+device,{waitUntil:'domcontentloaded',timeout:40000});
   if(response.status()!==200)throw Error('HTTP '+response.status());
   await page.waitForTimeout(720);
   const size=await page.evaluate(()=>{
    const b=sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};
    return {vh:window.innerHeight,vw:window.innerWidth,docH:document.documentElement.scrollHeight,docW:document.documentElement.scrollWidth,
      player:b('.media-dock'),reader:b('.focus-stage'),arab:b('#quranText'),textLength:document.querySelector('#quranText').textContent.length,
      surah:b('.surah-line'),switch:b('.focus-switch'),play:b('#play'),buttons:[...document.querySelectorAll('.focus-switch button')].every(x=>x.getBoundingClientRect().width>45)};
   });
   if(errors.length)throw Error('JavaScript: '+errors.join('; '));
   if(size.textLength<8||size.arab.w<200||size.arab.h<25||size.reader.h<70)throw Error('Quran reader not visible '+JSON.stringify(size));
   if(size.docH>h+3||size.docW>w+3)throw Error('Page scroll/overflow '+JSON.stringify(size));
   if(size.reader.bottom>size.player.y+2||size.player.bottom>h+3||size.player.h<85||size.player.h>270)throw Error('Media layout overlap '+JSON.stringify(size));
   if(!size.buttons)throw Error('Mode controls clipped');
   await page.locator('#openMenu').click();
   if(!await page.locator('#sheetOverlay').isVisible())throw Error('Sheet does not open');
   await page.locator('[data-panel="surahs"]').click();
   const search=page.locator('.v5-surah-search');
   await search.fill('Al-');
   await page.waitForTimeout(130);
   const visible=await page.locator('#surahList .sura-button:not(.v5-hidden)').count();
   if(visible<1||visible>6)throw Error('Sura search/pagination failed '+visible);
   await page.locator('[data-panel="settings"]').click();
   if(!await page.locator('#reciter').isVisible()||!await page.locator('#repeat').isVisible())throw Error('Audio settings inaccessible');
   await page.locator('[data-panel="display"]').click();
   const latin=page.locator('[data-layer="lat"]');
   if(!await latin.isVisible())throw Error('Display settings inaccessible');
   await page.locator('#sheetClose').click();
   if(await page.locator('#sheetOverlay').isVisible())throw Error('Sheet remains visible after close');
   if(kind==='adult'){
    await page.locator('[data-mode="understand"]').click();
    if(await page.locator('#commentBox').isHidden())throw Error('Tadabbur mode not visible');
    await page.locator('[data-mode="tafsir"]').click();
    if(!(await page.locator('#commentBox').innerText()).includes('Tafsīr'))throw Error('Tafsir mode does not respond');
    await page.locator('[data-mode="read"]').click();
   }else{
    await page.locator('[data-mode="learn"]').click();
    await page.locator('#kidWords').click();
    if(await page.locator('#quranText .kword.on').count()!==1)throw Error('Word learning not selectable');
    await page.locator('#kidComplete').click();
    if(!(await page.locator('#coachStatus').innerText()).includes('Geschafft'))throw Error('Child learning feedback missing');
   }
   const repeat=page.locator('#quickRepeat');
   await repeat.click();if(await page.locator('#repeat').inputValue()!=='ayah')throw Error('Repeat shortcut not synced');
   await repeat.click();if(await page.locator('#repeat').inputValue()!=='none')throw Error('Repeat did not turn off');
   if(['tiny','iphone','iphone-max','fold-open','tablet'].includes(device)){
     await page.screenshot({path:'.qa-quran-shots/'+kind+'-v8-'+device+'.png',animations:'disabled'});
     if(device==='iphone'||device==='tiny'){
       const buff=await page.screenshot({type:'jpeg',quality:57,animations:'disabled'});
       const str=buff.toString('base64'),chunks=str.match(/.{1,2600}/g)||[];
       console.log('V8SHOTBEGIN '+kind+'-'+device+' '+chunks.length);
       chunks.forEach((ch,i)=>console.log('V8SHOT '+kind+'-'+device+' '+i+' '+ch));
       console.log('V8SHOTEND '+kind+'-'+device);
     }
   }
   console.log('PASS '+kind+' '+device+' '+JSON.stringify({verse:Math.round(size.arab.h),stage:Math.round(size.reader.h),dock:Math.round(size.player.h),bodyOverflow:size.docH-h}));
  }catch(e){
   failed++;console.log('FAIL '+kind+' '+device+' '+String(e));
   await page.screenshot({path:'.qa-quran-shots/FAIL-'+kind+'-'+device+'.png'}).catch(()=>{});
  }
  await ctx.close();
 }
 }
 await browser.close();
 console.log('FINAL '+(total-failed)+'/'+total+' failed='+failed);
 if(failed)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
