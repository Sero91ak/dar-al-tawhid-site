const {chromium}=require('playwright');
(async()=>{
 const base='https://dar-quran-players-showcase-v3.sero91ak.workers.dev/dar-al-tawhid-quran-player-v9.html';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await page.goto(base+'?v=9-queue-test',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.QURAN_V9_QUEUE&&document.querySelectorAll('#surahList .sura-button').length===114);
 async function mode(name,reciters='fixed'){
  await page.locator('#openMenu').click();await page.locator('[data-panel="settings"]').click();
  await page.locator('#v9PlaybackMode').selectOption(name);
  await page.locator('#v9ReciterMode').selectOption(reciters);
  await page.locator('#sheetClose').click();
 }
 async function move(s,a,rand){await page.evaluate(async ({s,a,rand})=>{Math.random=()=>rand;await window.QURAN_V9_BRIDGE.goto(s,a,false);await window.QURAN_V9_QUEUE.skip(1)},{s,a,rand});
 return await page.evaluate(()=>window.QURAN_V9_BRIDGE.snapshot());}
 function check(s,name,p){if(!p(s))throw Error(name+' '+JSON.stringify(s));console.log('PASS_QUEUE',name,JSON.stringify({surah:s.surah,ayah:s.ayah,reciter:s.reciter}));}
 await mode('sequential_ayah');
 check(await move(1,3,.3),'sequential aya',x=>x.surah===1&&x.ayah===4);
 check(await move(1,7,.3),'sequential stops',x=>x.surah===1&&x.ayah===7);
 await mode('sequential_surah','per_surah');
 check(await move(1,7,.3),'sequential surah + per surah reciter',x=>x.surah===2&&x.ayah===1&&x.reciter!=='Alafasy_128kbps');
 await mode('shuffle_within');
 check(await move(103,1,.2),'shuffle same surah',x=>x.surah===103&&x.ayah!==1);
 await mode('shuffle_surah','per_ayah');
 check(await move(103,3,.2),'random entire Surah after its final verse',x=>x.surah!==103&&x.ayah===1);
 await mode('shuffle_ayah');
 check(await move(1,1,0),'global verse shuffle avoids immediate repeat',x=>x.surah!==1||x.ayah!==1);
 await mode('shuffle_ayah','per_ayah');
 check(await move(1,3,.99),'global verse shuffle with reciter per verse',x=>x.surah!==1&&x.reciter!=='Alafasy_128kbps');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.QURAN_V9_QUEUE);
 const restored=await page.evaluate(()=>window.QURAN_V9_QUEUE.debug().config);
 if(restored.mode!=='shuffle_ayah'||restored.reciters!=='per_ayah')throw Error('Queue config not persisted '+JSON.stringify(restored));
 console.log('PASS_QUEUE persisted user modes');
 await browser.close();
})().catch(e=>{console.error('QUEUE_FAILURE',e.message);process.exit(1)});
