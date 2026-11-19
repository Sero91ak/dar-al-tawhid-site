/* DĀR HOME V7 · bilingual Qur'an reader. Uses the V2 audio API and local HOME view. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const panel=$('quranReaderPanel');
 if(!panel)return;
 const savedPrefs=initialPrefs();const transliterationControl=$('readerShowTransliteration');if(transliterationControl)transliterationControl.checked=savedPrefs.readerTransliteration!=='hide';
 const api=()=>window.darQuranReaderAPI;
 const initialPrefs=()=>{try{return JSON.parse(localStorage.getItem('dar-home-cinematic-v2')||'{}')}catch{return {}}};
 const cache=new Map();
 let requestKey='';
 function fillOptions(){
  const a=api();if(!a)return;
  const state=a.state(),surahs=a.surahs(),reciters=a.reciters();
  const surah=$('readerSurah'),reciter=$('readerReciter');
  if(!surah.options.length)surahs.forEach(x=>surah.add(new Option(x.id+' · '+x.name,x.id)));
  if(!reciter.options.length)reciters.forEach(x=>reciter.add(new Option(x.name,x.edition)));
  surah.value=String(state.surah);reciter.value=state.reciter;
  $('readerSurahLabel').textContent=(surahs.find(x=>x.id===state.surah)?.name||'Sūrah '+state.surah)+' · '+state.ayah;
  $('readerProgress').textContent='Āyah '+state.ayah+' · '+(surahs.find(x=>x.id===state.surah)?.count||'');
  $('readerPlay').textContent=state.playing?'Ⅱ　Pause':'▶　Wiedergabe';
 }
 async function render(){
  const a=api();if(!a)return;
  const state=a.state(),key=state.surah+':'+state.ayah;
  fillOptions();
  if(requestKey===key)return;
  requestKey=key;
  const ar=$('readerArabic'),de=$('readerGerman'),tr=$('readerTransliterationText'),status=$('readerStatus');
  if(cache.has(key)){const v=cache.get(key);ar.textContent=v.ar;de.textContent=v.de;tr.textContent=v.tr||'Lautschrift nicht verfügbar';tr.hidden=!$('readerShowTransliteration').checked;status.textContent='';return}
  ar.textContent='…';de.textContent='Übersetzung wird geladen …';status.textContent='Versdaten werden geladen.';
  try{
   const global=state.ayah+a.surahs().slice(0,state.surah-1).reduce((n,x)=>n+Number(x.count||0),0);
   const url='https://api.alquran.cloud/v1/ayah/'+global;
   const results=await Promise.all(['quran-uthmani','de.bubenheim','en.transliteration'].map(async edition=>{const response=await fetch(url+'/'+edition);if(!response.ok)throw Error('Textdienst');return response.json()}));
   const v={ar:results[0]?.data?.text||'Arabischer Text nicht verfügbar.',de:results[1]?.data?.text||'Deutsche Übersetzung nicht verfügbar.',tr:results[2]?.data?.text||''};
   cache.set(key,v);
   if(requestKey!==key)return;
   ar.textContent=v.ar;de.textContent=v.de;tr.textContent=v.tr||'Lautschrift nicht verfügbar';tr.hidden=!$('readerShowTransliteration').checked;status.textContent='';
  }catch{if(requestKey===key){ar.textContent='';de.textContent='Übersetzung konnte nicht geladen werden.';status.textContent='Qurʾān-Textdienst nicht erreichbar.'}}
 }
 const on=id=>$(id)?.addEventListener('click',()=>{const a=api();if(a)a.skip(id==='readerNext'?1:-1)});
 $('readerSurah')?.addEventListener('change',()=>{api()?.selectSurah($('readerSurah').value);render()});
 $('readerReciter')?.addEventListener('change',()=>{api()?.selectReciter($('readerReciter').value);fillOptions()});
 on('readerPrevious');on('readerNext');
 $('readerPlay')?.addEventListener('click',()=>{api()?.play();setTimeout(fillOptions,100)});
 $('readerShowTransliteration')?.addEventListener('change',()=>{api()?.setTransliteration($('readerShowTransliteration').checked?'show':'hide');$('readerTransliterationText').hidden=!$('readerShowTransliteration').checked});
 document.addEventListener('dar:quran-state',()=>{if(!panel.hidden){render();fillOptions()}});
 document.addEventListener('dar:quran-reader-open',render);
 document.querySelectorAll('[data-home-action="quran"]').forEach(button=>button.addEventListener('click',()=>setTimeout(render,0)));
 $('openSurahPicker')?.addEventListener('click',event=>{event.preventDefault();setTimeout(render,0)});
})();