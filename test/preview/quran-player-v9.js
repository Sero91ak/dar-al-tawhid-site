/* QURAN_V9_INTERACTION - preview-only controller; retains existing HTMLAudioElement playback */
(function(){
 'use strict';
 const bridge=window.QURAN_V9_BRIDGE;
 if(!bridge)return;
 const kids=document.body.classList.contains('kids');
 const $=id=>document.getElementById(id);
 const st=()=>bridge.snapshot();
 function recordStats(){
  const x=st();
  for(const [id,key] of [['v9DifficultCount','difficult'],['v9LearnedCount','learned'],['v9PracticeCount','practiced']]){
   if($(id))$(id).textContent=(x[key]||[]).length;
  }
  for(const [id,key] of [['v9MarkDifficult','difficult'],['v9MarkLearned','learned']]){
   const button=$(id);if(button){const active=(x[key]||[]).includes(x.surah+':'+x.ayah);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  }
  const key=x.surah+':'+x.ayah;
  if($('v9CurrentProgress'))$('v9CurrentProgress').textContent='Āyah '+x.ayah+' · '+(x.learned?.includes(key)?'als gelernt markiert':x.difficult?.includes(key)?'noch üben':'bereit');
 }
 $('v9MarkDifficult')?.addEventListener('click',()=>{bridge.toggle('difficult');recordStats()});
 $('v9MarkLearned')?.addEventListener('click',()=>{bridge.toggle('learned');recordStats()});
 $('v9PracticeNow')?.addEventListener('click',()=>{
  bridge.toggle('practiced',true);recordStats();
  if(!kids){
   const sel=$('rate');sel.value='0.75';sel.dispatchEvent(new Event('change',{bubbles:true}));
   const rep=$('repeat');rep.value='ayah';rep.dispatchEvent(new Event('change',{bubbles:true}));
   const btn=document.querySelector('[data-mode="read"]');btn?.click();
   $('audioState').textContent='Übungsmodus · 0,75× · Āyah wiederholen';
  }else{
   $('kidSlow')?.click();
  }
 });
 $('kidComplete')?.addEventListener('click',()=>{setTimeout(recordStats,0)});
 $('bookmark')?.addEventListener('click',()=>setTimeout(recordStats,0));
 $('topBookmark')?.addEventListener('click',()=>setTimeout(recordStats,0));
 new MutationObserver(()=>{recordStats();syncTop()}).observe($('counter'),{childList:true});
 function syncTop(){
  const label=$('topSurah');if(label)label.textContent=$('surahName')?.textContent||'Qurʾān';
  const count=$('v9CurrentSurah');if(count)count.textContent=st().surah+' · '+(st().ayah)+'/'+st().verseCount;
  const focus=$('stage');
  if(focus){
   const len=$('quranText')?.textContent?.length||0;
   focus.classList.toggle('long-ayah',len>130);
   focus.classList.toggle('very-long-ayah',len>280);
  }
  recordStats();
 }
 syncTop();
 new MutationObserver(syncTop).observe($('quranText'),{characterData:true,childList:true,subtree:true});
 if(kids){
  const slow=$('kidSlow'),words=$('kidWords');
  if(slow){slow.setAttribute('title','Gesamte Āyah mit reduziertem Tempo wiedergeben; keine künstlichen Wortclips');slow.setAttribute('aria-label','Ganze Āyah langsam hören');}
  if(words){words.setAttribute('title','Wörter nacheinander markieren, ohne behauptete Einzelwort-Audiodateien');words.setAttribute('aria-label','Wörter nacheinander auswählen');}
  return;
 }
 /* Explicit adult playback modes, with exactly one audio element and no overlapping requests. */
 const persistedKey='dar-quran-v9-playback-options';
 let cfg={mode:'sequential_ayah',reciters:'fixed'};
 try{cfg={...cfg,...JSON.parse(localStorage.getItem(persistedKey)||'{}')}}catch(e){}
 const modes=new Set(['sequential_ayah','sequential_surah','shuffle_ayah','shuffle_surah','shuffle_within']);
 const reciterModes=new Set(['fixed','per_ayah','per_surah']);
 if(!modes.has(cfg.mode))cfg.mode='sequential_ayah';
 if(!reciterModes.has(cfg.reciters))cfg.reciters='fixed';
 const modeSelect=$('v9PlaybackMode'),reciterSelect=$('v9ReciterMode');
 if(modeSelect)modeSelect.value=cfg.mode;
 if(reciterSelect)reciterSelect.value=cfg.reciters;
 const reciters=['Alafasy_128kbps','Husary_128kbps','Minshawy_Murattal_128kbps'];
 let manifest=null,lock=false,history=[];
 const chooseDifferent=(set,current)=>set.length<=1?set[0]:set.filter(x=>x!==current)[Math.floor(Math.random()*(set.length-1))];
 async function index(){
  if(manifest)return manifest;
  const resp=await fetch('/content/quran/surahs.json',{cache:'force-cache'});
  if(!resp.ok)throw Error('Sūrah-Katalog nicht erreichbar');
  const data=await resp.json();
  if(data.surahs?.length!==114)throw Error('Sūrah-Katalog ist unvollständig');
  manifest=data.surahs;
  return manifest;
 }
 function sampleVerse(rows,current){
  const total=rows.reduce((sum,x)=>sum+(Number(x.total_verses)||0),0);
  if(total<1)return [current.surah,current.ayah];
  let roll=Math.floor(Math.random()*total);
  for(const row of rows){
   const n=Number(row.total_verses)||0;
   if(roll<n)return [Number(row.id),roll+1];
   roll-=n;
  }
  return [current.surah,current.ayah];
 }
 async function selectNext(catalog,x){
  const current=Number(x.surah),v=Number(x.ayah),limit=Number(x.verseCount);
  if(cfg.mode==='shuffle_ayah'){
   const choices=Array.from({length:5},()=>sampleVerse(catalog,x));
   return choices.find(([s,a])=>s!==current||a!==v)||(v<limit?[current,v+1]:[current>=114?1:current+1,1]);
  }
  if(cfg.mode==='shuffle_within'){
   const total=limit||1;
   const n=total<2?1:(v-1+1+Math.floor(Math.random()*(total-1)))%total+1;
   return [current,n];
  }
  if(v<limit)return [current,v+1];
  if(cfg.mode==='sequential_ayah')return null;
  if(cfg.mode==='sequential_surah')return [current>=114?1:current+1,1];
  if(cfg.mode==='shuffle_surah'){
   const opts=catalog.map(r=>Number(r.id)).filter(id=>id!==current);
   return [opts[Math.floor(Math.random()*opts.length)]||1,1];
  }
  return null;
 }
 async function move(direction,auto){
  if(lock)return;
  lock=true;
  try{
   const catalog=await index();
   const curr=st();
   let target;
   if(direction<0&&history.length){
    const prev=history.pop();
    target=[prev.surah,prev.ayah,prev.reciter];
   }else if(direction<0){
    if(curr.ayah>1)target=[curr.surah,curr.ayah-1,curr.reciter];
    else{const id=curr.surah===1?114:curr.surah-1;target=[id,Number(catalog[id-1].total_verses)||1,curr.reciter]}
   }else{
    const next=await selectNext(catalog,curr);
    if(!next){bridge.notice('Sūrah beendet · Wiedergabe anhalten');return;}
    target=next;
    history.push({surah:curr.surah,ayah:curr.ayah,reciter:curr.reciter});
    if(history.length>200)history.shift();
   }
   let desired=target[2]||curr.reciter;
   if(direction>0&&cfg.reciters==='per_ayah')desired=chooseDifferent(reciters,curr.reciter);
   else if(direction>0&&cfg.reciters==='per_surah'&&target[0]!==curr.surah)desired=chooseDifferent(reciters,curr.reciter);
   if(desired!==curr.reciter)bridge.setReciter(desired);
   await bridge.goto(target[0],target[1],auto);
   recordStats();syncTop();
  }catch(e){bridge.notice('Wechsel derzeit nicht verfügbar. Bitte Verbindung prüfen.');console.warn('Quran queue transition failed',e)}
  finally{lock=false}
 }
 window.QURAN_V9_QUEUE={
  enabled:true,
  advance(){return move(1,true)},
  skip(direction){return move(direction,!!st().playing)},
  debug(){return {config:{...cfg},history:history.slice(),busy:lock}}
 };
 modeSelect?.addEventListener('change',e=>{
  cfg.mode=modes.has(e.target.value)?e.target.value:'sequential_ayah';history=[];save();
 });
 reciterSelect?.addEventListener('change',e=>{
  cfg.reciters=reciterModes.has(e.target.value)?e.target.value:'fixed';save();
 });
 function save(){try{localStorage.setItem(persistedKey,JSON.stringify(cfg))}catch(e){}}
 $('v9SkipToNext')?.addEventListener('click',()=>move(1,false));
 $('v9PlaybackInfo').textContent='Sūrah und Rezitator lassen sich unabhängig einstellen.';
})();
