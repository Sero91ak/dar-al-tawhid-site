/* DĀR HOME V4 · Apple TV editorial surface and cinematic prayer motif controller.
   This layer does not modify the canonical prayer/audio/content engine. */
(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const NAMES={fajr:'Faǧr',dhuhr:'Ḍuhr',asr:'ʿAṣr',maghrib:'Maġrib',isha:'ʿIšāʾ'};
  const ROOT='https://dar-al-tawhid.de';
  const MOTIF_BASE=ROOT+'/test/assets/prayer-motifs/';
  let current='';

  function findPrayerKey(){
    const raw=($('adhanInfo')?.textContent||'').toLowerCase();
    if(/fajr|faǧr|morgengebet/i.test(raw))return'fajr';
    if(/ḍuhr|dhuhr|mittags/i.test(raw))return'dhuhr';
    if(/ʿaṣr|asr|nachmittag/i.test(raw))return'asr';
    if(/maġrib|maghrib|abendgebet/i.test(raw))return'maghrib';
    if(/ʿišā|isha|nachtgebet/i.test(raw))return'isha';
    return'';
  }
  function artwork(){
    const adhan=$('adhanVisual');
    if(!adhan || !adhan.classList.contains('active')){current='';return}
    const name=findPrayerKey();if(!name)return;
    const title=adhan.querySelector('.adhan-title');
    if(title)title.textContent=NAMES[name]+' · Aḏān';
    let image=$('h4PrayerArtwork');
    if(!image){image=document.createElement('img');image.id='h4PrayerArtwork';image.className='h4-prayer-image';image.alt='';image.setAttribute('aria-hidden','true');
      image.addEventListener('error',()=>{image.style.display='none'});adhan.prepend(image)}
    if(name!==current){
      current=name;image.style.display='block';image.src=MOTIF_BASE+name+'.webp';
      const t=document.querySelector('.prayer-cell[data-prayer="'+name+'"] .ptime')?.textContent?.trim();
      const sub=$('adhanInfo');if(sub && !sub.dataset.h4Augmented && t && /^[0-2][0-9]:[0-5][0-9]$/.test(t)){
        sub.textContent=NAMES[name]+' · '+t+' Uhr';sub.dataset.h4Augmented='true';
      }
    }
  }
  function setupAdhan(){
    const visual=$('adhanVisual'), info=$('adhanInfo');
    if(!visual||!info)return;
    const obs=new MutationObserver(()=>{if(!visual.classList.contains('active')){current='';delete info.dataset.h4Augmented;}else artwork()});
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
  function init(){header();setupAdhan();handleKeyboard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
