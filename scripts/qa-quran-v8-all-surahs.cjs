const {chromium}=require('playwright');
(async()=>{
const host='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
const manifestRes=await fetch(host+'/content/quran/surahs.json');
if(manifestRes.status!==200)throw Error('Full Quran manifest HTTP '+manifestRes.status);
const index=await manifestRes.json();
if(!Array.isArray(index.surahs)||index.surahs.length!==114)throw Error('Expected all 114 canonical Surahs');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let ok=0,failed=0;
for(const [type,file] of [['adult','dar-al-tawhid-quran-player-v8.html'],['kids','tawhid-kids-quran-player-v8.html']]){
 for(const [device,width,height] of [['tiny',320,568],['iphone',390,844],['ipad',820,1180]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:width<720,hasTouch:width<720});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(host+'/'+file+'?surah=36&qa=fullquran-'+device,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelectorAll('#surahList .sura-button').length===114,null,{timeout:15000});
  await page.waitForFunction(()=>document.getElementById('suraCount').textContent.includes('83 Āyāt'),null,{timeout:15000});
  if(errors.length)throw Error('JS errors '+errors.join('; '));
  const title=await page.locator('#surahName').innerText();
  if(!title)throw Error('Sūrah 36 not loaded');
  await page.locator('#openMenu').click();
  await page.locator('[data-panel="surahs"]').click();
  const search=page.locator('#surahs .v5-surah-search');
  if(!await search.isVisible())throw Error('Search missing');
  await search.fill('112');
  const target=page.locator('#surahs .sura-button[data-surah="112"]');
  if(!await target.isVisible())throw Error('Sūrah 112 filter failed');
  await target.click();
  await page.waitForFunction(()=>document.getElementById('suraCount').textContent.includes('4 Āyāt'),null,{timeout:15000});
  await page.goto(host+'/'+file+'?qa=persistence-only',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('suraCount').textContent.includes('4 Āyāt'),null,{timeout:15000});
  const all=await page.locator('#surahList .sura-button').count();
  if(all!==114)throw Error('Sūrah catalog lost on reload '+all);
  const overflow=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
  if(width<720&&overflow>3)throw Error('Phone document scroll '+overflow);
  console.log('PASS_FULL_QURAN',type,device,'114',title,'current=112');
  ok++;
 }catch(e){failed++;console.error('FAIL_FULL_QURAN',type,device,e.message);}
 await page.close();
 }
}
await browser.close();
console.log('FULL_QURAN_RESULT',ok,'/',ok+failed);
if(failed)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
