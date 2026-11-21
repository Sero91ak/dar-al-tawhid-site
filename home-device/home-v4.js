/* DĀR HOME V4 · Apple TV editorial surface and cinematic prayer motif controller.
   This layer does not modify the canonical prayer/audio/content engine. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const NAMES={fajr:'Faǧr',dhuhr:'Ḍuhr',asr:'ʿAṣr',maghrib:'Maġrib',isha:'ʿIšāʾ'};
  const ROOT='https://dar-al-tawhid.de';
  const MOTIF_BASE='/media/apple-tv/adhan-';
  let current='';

  function findPrayerKey(){
    const visual=$('adhanVisual');if(visual?.dataset.prayerKey==='test')return'';if(visual?.dataset.prayerKey?.startsWith('test:'))return visual.dataset.prayerKey.slice(5);
    const raw=($('adhanInfo')?.textContent||'').toLowerCase();
    if(/fajr|faǧr|morgengebet/i.test(raw))return'fajr';
    if(/ḍuhr|dhuhr|mittags/i.test(raw))return'dhuhr';
    if(/ʿaṣr|asr|nachmittag/i.test(raw))return'asr';
    if(/maġrib|maghrib|abendgebet/i.test(raw))return'maghrib';
    if(/ʿišā|isha|nachtgebet/i.test(raw))return'isha';
    return document.querySelector('.prayer-cell.active')?.dataset.prayer||'';
  }
  function setAdhanBackdrop(src){const backdrop=$('adhanWallpaperBackdrop');if(backdrop){backdrop.style.backgroundImage=src?'url("'+src.replaceAll('"','%22')+'")':'none';backdrop.hidden=!src}}
  function artwork(){
    const adhan=$('adhanVisual');
    if(!adhan || !adhan.classList.contains('active')){current='';const home=$('adhanWallpaperImage'),image=$('h4PrayerArtwork');if(home&&home.getAttribute('src'))home.hidden=false;if(image)image.style.display='none';setAdhanBackdrop(home?.getAttribute('src')||'');return}
    const test=adhan.dataset.prayerKey==='test';
    const name=findPrayerKey()||(!test?current:'');
    if(test){const title=adhan.querySelector('.adhan-title'),image=$('h4PrayerArtwork'),home=$('adhanWallpaperImage');if(title)title.textContent='Aḏān · Hörprobe';if(image)image.style.display='none';if(home&&home.getAttribute('src'))home.hidden=false;setAdhanBackdrop(home?.getAttribute('src')||'');return}
    if(!name)return;
    const title=adhan.querySelector('.adhan-title');
    if(title)title.textContent=NAMES[name]+' · Aḏān';
    let image=$('h4PrayerArtwork');
    if(!image){image=document.createElement('img');image.id='h4PrayerArtwork';image.className='h4-prayer-image';image.alt='';image.setAttribute('aria-hidden','true');
      image.addEventListener('error',()=>{if(image.dataset.fallback==='native'){image.dataset.fallback='web';image.src=ROOT+'/test/assets/prayer-motifs/'+(image.dataset.prayer||'fajr')+'.webp';setAdhanBackdrop(image.src)}else if(image.dataset.fallback==='web'){image.dataset.fallback='kids';image.src=ROOT+'/kids/assets/kids-salah-v1262/cinematic-still.jpg';setAdhanBackdrop(image.src)}else{image.style.display='none';setAdhanBackdrop('')}});adhan.prepend(image)}
    if(name!==current){
      current=name;image.dataset.fallback='native';image.dataset.prayer=name;image.style.display='block';image.src=MOTIF_BASE+name+'.jpg';const home=$('adhanWallpaperImage');if(home)home.hidden=true;setAdhanBackdrop(image.src);
      const t=document.querySelector('.prayer-cell[data-prayer="'+name+'"] .ptime')?.textContent?.trim();
      const sub=$('adhanInfo');if(sub && !sub.dataset.h4Augmented && t && /^[0-2][0-9]:[0-5][0-9]$/.test(t)){
        sub.textContent='Heute · '+t+' Uhr';sub.dataset.h4Augmented='true';
      }
    }
  }
  function setupAdhan(){
    const visual=$('adhanVisual'), info=$('adhanInfo');
    if(!visual||!info)return;
    const obs=new MutationObserver(()=>{artwork();if(!visual.classList.contains('active'))delete info.dataset.h4Augmented});
    obs.observe(visual,{attributes:true,attributeFilter:['class']});
    const changeInfo=new MutationObserver(()=>{if(visual.classList.contains('active'))artwork()});
    changeInfo.observe(info,{childList:true,subtree:false});
    artwork();
  }
  function header(){
    document.getElementById('h3ThemeToggle')?.remove();
    const title=document.querySelector('.brand-mini');if(title)title.textContent='H O M E · GEBETSZEITEN & QURʾĀN';
    const settings=$('openSettings');if(settings){
      settings.setAttribute('aria-label','Geräteeinstellungen öffnen');
      settings.setAttribute('title','HOME · Einstellungen');
    }
    const saver=$('saver');
    if(saver&&!$('h4SaverBrand')){
      const brand=document.createElement('div');brand.id='h4SaverBrand';
      brand.style.cssText='position:absolute;top:clamp(20px,3vw,48px);left:clamp(22px,4vw,74px);z-index:3;color:#f0e2c0;letter-spacing:.24em;font-size:clamp(11px,1.05vw,18px);font-family:Georgia,serif;text-shadow:0 3px 12px #000';
      brand.textContent='DĀR AL TAWḤĪD · HOME';
      saver.append(brand);
    }
  }
  function handleKeyboard(){
    // Native-like Focus outline for hardware keyboard and accessible external controls.
    document.body.classList.add('home-v4-ready');
    document.querySelectorAll('.settings-tabs button').forEach(b=>b.setAttribute('aria-controls','settings-page-'+b.dataset.tab));
    document.querySelectorAll('.tabpage[data-page]').forEach(p=>p.id='settings-page-'+p.dataset.page);
  }
  function spatialNavigation(){
    const selector='button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"]),input:not([disabled]),select:not([disabled])';
    document.addEventListener('keydown',event=>{
      const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]},vector=directions[event.key];
      if(!vector)return;
      const active=document.activeElement;
      if(active?.matches('input,textarea,select,[contenteditable="true"]'))return;
      const visible=[...document.querySelectorAll(selector)].filter(el=>{
        const style=getComputedStyle(el),rect=el.getBoundingClientRect();
        return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&rect.width>0&&rect.height>0;
      });
      if(!visible.length)return;
      if(!active||active===document.body||!visible.includes(active)){
        visible[0].focus({preventScroll:true});event.preventDefault();return;
      }
      const from=active.getBoundingClientRect(),cx=from.left+from.width/2,cy=from.top+from.height/2;
      let best=null,bestScore=Infinity;
      for(const el of visible){
        if(el===active)continue;
        const r=el.getBoundingClientRect(),dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy;
        const primary=dx*vector[0]+dy*vector[1];if(primary<=2)continue;
        const cross=Math.abs(dx*vector[1]-dy*vector[0]);
        const score=primary+cross*1.8;
        if(score<bestScore){best=el;bestScore=score}
      }
      if(best){event.preventDefault();best.focus({preventScroll:true})}
    });
  }
  function init(){header();setupAdhan();handleKeyboard();spatialNavigation()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
