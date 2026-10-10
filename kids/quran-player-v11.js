/* TAWḤĪD KIDS Qurʾān V11.
 * Progressive enhancement only: keeps original microphone lessons,
 * word checkpoints, progress keys, and all legacy event handlers.
 */
(function(){
  'use strict';
  if (window.DARKidsQuranV11) return;
  var KEY='kids.quran.reciter.v11';
  var RECITERS=[
    {id:'Husary_128kbps',name:'al-Ḥuṣarī'},
    {id:'Alafasy_128kbps',name:'al-ʿAfāsī'},
    {id:'Minshawy_Murattal_128kbps',name:'al-Minšāwī'},
    {id:'Abdurrahmaan_As-Sudais_192kbps',name:'as-Sudais'},
    {id:'MaherAlMuaiqly128kbps',name:'al-Muʿayqlī'},
    {id:'Saood_ash-Shuraym_128kbps',name:'aš-Šuraym'}
  ];
  function current(){
    try{var n=localStorage.getItem(KEY);return RECITERS.some(function(r){return r.id===n})?n:RECITERS[0].id;}
    catch(e){return RECITERS[0].id;}
  }
  function save(id){try{localStorage.setItem(KEY,id);}catch(e){}}
  function init(){
    var controls=document.querySelector('#quranModal .quran-controls');
    var audio=document.getElementById('quranAudio');
    if(!controls||!audio||document.getElementById('kidsQuranReciterV11'))return;
    var row=document.createElement('div');
    row.className='quran-v11-reciters';
    var label=document.createElement('label');label.htmlFor='kidsQuranReciterV11';label.textContent='Rezitator';
    var select=document.createElement('select');select.id='kidsQuranReciterV11';
    select.setAttribute('aria-label','Rezitator für die Qurʾān-Āyah auswählen');
    RECITERS.forEach(function(r){var opt=document.createElement('option');opt.value=r.id;opt.textContent=r.name;select.appendChild(opt)});
    select.value=current();row.appendChild(label);row.appendChild(select);controls.insertBefore(row,controls.firstChild);
    select.addEventListener('change',function(){
      if(!RECITERS.some(function(r){return r.id===select.value})){select.value=current();return;}
      var active=!audio.paused && !!audio.currentSrc;
      save(select.value);
      if(active){
        audio.pause();
        var btn=document.getElementById('ayahPlay');
        if(btn)btn.click();
      }
    });
    // If the chosen voice is unavailable, revert ONCE to the existing default.
    var lastRetryUrl='';
    audio.addEventListener('error',function(){
      var src=String(audio.currentSrc||audio.src||'');
      if(!src||current()===RECITERS[0].id||src===lastRetryUrl)return;
      lastRetryUrl=src;save(RECITERS[0].id);select.value=RECITERS[0].id;
      setTimeout(function(){
        var modal=document.getElementById('quranModal');
        if(!modal||!modal.classList.contains('open'))return;
        var btn=document.getElementById('ayahPlay');
        if(btn){audio.pause();btn.click()}
      },100);
    });
  }
  window.DARKidsQuranV11={reciters:RECITERS.slice(),selectedReciter:current};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
