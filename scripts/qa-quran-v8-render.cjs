const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const host='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
const cases=[
 ['adult-iphone','dar-al-tawhid-quran-player-v8.html',390,844],
 ['adult-max','dar-al-tawhid-quran-player-v8.html',430,932],
 ['kids-iphone','tawhid-kids-quran-player-v8.html',390,844],
 ['kids-max','tawhid-kids-quran-player-v8.html',430,932]
];
for(const [name,file,width,height] of cases){
 const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 await p.goto(host+'/'+file+'?render='+name,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForTimeout(700);
 const img=await p.screenshot({type:'jpeg',quality:58});
 const encoded=img.toString('base64'),chunk=3500,n=Math.ceil(encoded.length/chunk);
 const metrics=await p.evaluate(()=>{
  const rect=s=>{let r=document.querySelector(s).getBoundingClientRect();return [Math.round(r.top),Math.round(r.bottom),Math.round(r.width)]};
  return {stage:rect('.focus-stage'),title:rect('.surah-lead'),dock:rect('.media-dock'),quranText:document.getElementById('quranText').innerText.slice(0,50),overflow:document.documentElement.scrollHeight-innerHeight};
 });
 console.log('V8_RENDER_METRICS '+name+' '+JSON.stringify(metrics));
 console.log('V8_IMAGE_BEGIN '+name+' '+n);
 for(let i=0;i<n;i++)console.log('V8_IMAGE '+name+' '+i+' '+encoded.slice(i*chunk,(i+1)*chunk));
 console.log('V8_IMAGE_END '+name);
 await p.close();
}
await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
