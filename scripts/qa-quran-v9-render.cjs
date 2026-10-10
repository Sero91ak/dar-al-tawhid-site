const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const host='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
 const cases=[['adult-iphone','dar-al-tawhid-quran-player-v9.html',390,844],['kids-iphone','tawhid-kids-quran-player-v9.html',390,844],
 ['adult-tiny','dar-al-tawhid-quran-player-v9.html',320,568],['kids-tiny','tawhid-kids-quran-player-v9.html',320,568]];
 for(const [name,file,width,height] of cases){
   const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   await p.goto(host+'/'+file+'?render='+name,{waitUntil:'domcontentloaded',timeout:45000});
   await p.waitForTimeout(500);
   const m=await p.evaluate(()=>{
    const box=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return [Math.round(r.top),Math.round(r.bottom),Math.round(r.height)]};
    return {stage:box('#stage'),top:box('.topline'),dock:box('.media-dock'),v9:!!window.QURAN_V9_BRIDGE,playGlyph:getComputedStyle(document.querySelector('#play'),'::before').transform};});
   console.log('V9_VISUAL_METRICS '+name+' '+JSON.stringify(m));
   const bytes=await p.screenshot({type:'jpeg',quality:50,animations:'disabled'});
   const s=bytes.toString('base64'),chunk=3100,count=Math.ceil(s.length/chunk);
   console.log('V9_IMAGE_BEGIN '+name+' '+count);
   for(let i=0;i<count;i++)console.log('V9_IMAGE '+name+' '+i+' '+s.slice(i*chunk,(i+1)*chunk));
   console.log('V9_IMAGE_END '+name);
   await p.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
