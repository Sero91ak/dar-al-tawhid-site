/* DĀR HOME V6 — canonical Tadabbur lookup and tvOS screensaver contract. */
(()=>{'use strict';
 const BASE='/apple-tv/',TAD=BASE+'quran/tadabbur/',SCREEN=BASE+'screensaver/',HADITH=BASE+'hadith/';
 const $=id=>document.getElementById(id),DB_NAME='dar-home-content-v1';
 let dbPromise=null,tadPromise=null,saverPromise=null,readyPromise=null,library=null,tadDataCache=null,rotation=null,rotationState=null;
 let quranMemory=new Map(),renderToken=0,lastLoadError='';
 const say=(el,value)=>{if(el)el.textContent=String(value||'')};
 function openDB(){
  if(!('indexedDB'in window))return Promise.resolve(null);
  if(dbPromise)return dbPromise;
  dbPromise=new Promise(resolve=>{
   const req=indexedDB.open(DB_NAME,1);
   req.onupgradeneeded=()=>{const d=req.result;for(const name of ['tadabbur','saver','state','quran'])if(!d.objectStoreNames.contains(name))d.createObjectStore(name)};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
  });return dbPromise;
 }
 async function read(store,key){const d=await openDB();if(!d)return null;return new Promise(resolve=>{try{const r=d.transaction(store,'readonly').objectStore(store).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch{resolve(null)}})}
 async function write(store,key,value){const d=await openDB();if(!d)return false;return new Promise(resolve=>{try{const tx=d.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false)}catch{resolve(false)}})}
 async function json(url){
  const response=await fetch(url,{cache:'no-cache',credentials:'omit'});
  if(!response.ok)throw Error('HTTP '+response.status+' · '+url);
  return response.json();
 }
 function refOK(ref){return typeof ref==='string'&&/^(?:[1-9][0-9]{0,2}):(?:[1-9][0-9]{0,2})$/.test(ref)}
 function refMap(entries){const m=new Map();for(const e of entries){if(!m.has(e.reference))m.set(e.reference,[]);m.get(e.reference).push(e)}return m}
 function tadValid(e){return !!e&&refOK(e.reference)&&typeof e.text==='string'&&e.text.trim().length>0&&typeof e.narrator==='string'&&e.narrator.trim()&&typeof e.generation==='string'&&typeof e.source==='string'&&e.source.trim()&&typeof e.grading==='string'&&e.grading.trim()}
 function safeFile(path){return typeof path==='string'&&/^[A-Za-z0-9._-]+\.json$/.test(path)}
 function notifyProgress(done,total){const e=$('tadabburStatus');if(e)say(e,'DĀR-Tadabbur wird abgeglichen · '+done+' von '+total+' Datensätzen')}
 async function loadTadabbur(){
  if(tadPromise)return tadPromise;
  tadPromise=(async()=>{
   const cached=await read('tadabbur','complete');
   try{
    const [catalog,index]=await Promise.all([json(TAD+'catalog.json'),json(TAD+'entries-index.json')]);
    const files=Array.isArray(index.files)?index.files:[],paths=Array.isArray(catalog.entriesPaths)?catalog.entriesPaths:[];
    const filePaths=files.map(x=>x.path).sort(),catalogPaths=paths.slice().sort(),total=files.reduce((n,x)=>n+Number(x.count||0),0);
    if(!Number.isInteger(catalog.entriesCount)||catalog.entriesCount<1||index.totalVerifiedEntries!==catalog.entriesCount||total!==catalog.entriesCount||files.length!==paths.length||filePaths.some((p,i)=>p!==catalogPaths[i])||files.some(x=>!safeFile(x.path)))throw Error('Tadabbur-Katalog und Index stimmen nicht überein');
    const revision=String(catalog.contentRevision||catalog.entriesCount)+'/'+String(index.totalVerifiedEntries);
    if(cached?.revision===revision&&Array.isArray(cached.entries)&&cached.entries.length===catalog.entriesCount)return {revision,entries:cached.entries,byReference:refMap(cached.entries),catalog};
    const entries=[];let cursor=0,done=0;
    async function worker(){while(cursor<files.length){const file=files[cursor++],payload=await json(TAD+file.path),batch=payload.entries;if(!Array.isArray(batch)||batch.length!==file.count||!batch.every(tadValid))throw Error('Ungültiger Tadabbur-Batch: '+file.path);entries.push(...batch);done+=batch.length;notifyProgress(done,catalog.entriesCount)}}
    await Promise.all(Array.from({length:Math.min(10,files.length)},worker));
    if(entries.length!==catalog.entriesCount)throw Error('Tadabbur-Prüfung unvollständig');
    const next={revision,entries};await write('tadabbur','complete',next);
    return {revision,entries,byReference:refMap(entries),catalog};
   }catch(error){
    if(cached?.entries?.length){return {revision:cached.revision,entries:cached.entries,byReference:refMap(cached.entries),catalog:null,offline:true}}
    throw error;
   }
  })();
  try{return await tadPromise}finally{tadPromise=null}
 }
 const MARKDOWN=x=>String(x||'').replace(/\*\*/g,'').replace(/__|[_*]/g,'').replace(/\[[^\]]+\]\([^)]*\)/g,'').trim();
 function showPanel(entries,verse){
  const panel=$('tadabburPanel'),list=$('tadabburResults'),title=$('tadabburVerse'),status=$('tadabburStatus');
  if(!panel||!list)return;
  panel.hidden=false;panel.setAttribute('aria-expanded','true');list.replaceChildren();
  say(title,'Vers '+(verse.reference||''));
  const items=entries||[];
  if(!items.length){
   const empty=document.createElement('article');empty.className='tadabbur-item';
   const p=document.createElement('p');p.textContent='Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.';empty.append(p);list.append(empty);say(status,'Geprüfte DĀR-Daten · kein Eintrag für diese Referenz');return;
  }
  for(const entry of items){
   const card=document.createElement('article');card.className='tadabbur-item';
   const statement=document.createElement('p');statement.className='tadabbur-statement';statement.textContent=MARKDOWN(entry.text);
   const speaker=document.createElement('div');speaker.className='tadabbur-speaker';speaker.textContent=[entry.narrator,entry.generation].filter(Boolean).join(' · ');
   const source=document.createElement('div');source.className='tadabbur-source';source.textContent=[entry.source,entry.grading,entry.relation].filter(Boolean).join(' · ');
   card.append(statement,speaker,source);list.append(card);
  }
  const data=tadDataCache;
  say(status,(data?.offline?'Offline-Cache':'DĀR-Tadabbur')+' · '+items.length+' geprüfte '+(items.length===1?'Überlieferung':'Überlieferungen'));
 }
 async function openTadabbur(){
  const panel=$('tadabburPanel'),list=$('tadabburResults'),status=$('tadabburStatus');
  if(!panel)return;
  panel.hidden=false;panel.setAttribute('aria-expanded','true');$('closeTadabbur')?.focus({preventScroll:true});
  const verse=window.darHomeDailyVerse||{},reference=verse.reference||'';
  if(!refOK(reference)){say(status,'Öffne zuerst einen Qurʾān-Vers des Tages.');return}
  say($('tadabburVerse'),'Vers '+reference);say(status,'Prüfe den vollständigen DĀR-Tadabbur-Katalog …');if(list)list.replaceChildren();
  try{
   const data=await loadTadabbur();tadDataCache=data;
   showPanel(data.byReference.get(reference)||[],verse);
  }catch(error){
   say(status,'DĀR-Tadabbur ist gerade nicht erreichbar. Der letzte vollständige lokale Stand bleibt erhalten.');
   if(list){const card=document.createElement('article');card.className='tadabbur-item';const p=document.createElement('p');p.textContent='Der geprüfte Tadabbur konnte nicht geladen werden. Es wird kein Ersatztext erzeugt.';card.append(p);list.replaceChildren(card)}
  }
 }
 function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
 function stableMix(list,weights){
  const modules=['hadith','athar','quranTad'],queues={};for(const m of modules){queues[m]=list.filter(x=>x.module===m).slice();for(let i=queues[m].length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queues[m][i],queues[m][j]]=[queues[m][j],queues[m][i]]}}
  const result=[];let left=modules.reduce((n,m)=>n+queues[m].length,0);
  while(left){for(const m of modules){for(let k=0;k<weights[m]&&queues[m].length;k++){result.push(queues[m].shift().id);left--}}}
  return result;
 }
 function durationFor(card,display,renderedText=''){
  let text=String(renderedText||'').trim();
  if(!text){
   if(card.module==='quranTad')text=[card.tad.text,card.tad.narrator,card.tad.generation,card.tad.reference,card.tad.source,card.tad.grading].filter(Boolean).join(' ');
   else{text=[card.record.textMarkdown,card.record.narratorLine,card.record.speakerLabel,card.record.source,card.record.grade].filter(Boolean).join(' ');if(display.sharhMode==='compact'&&card.record.sharhStatus==='verified')text+=' '+String(card.record.sharhText||'')}
  }
  text=MARKDOWN(text).replace(/\s+/g,' ').trim();
  const words=text.split(' ').filter(Boolean).length;
  const letters=(text.match(/[\p{L}\p{N}]/gu)||[]).length;
  const d=display.duration,base=Number(d.baseSeconds)||16,perWord=Number(d.secondsPerWord)||.35,min=Number(d.minSeconds)||18,max=Number(d.maxSeconds)||40;
  const policySeconds=base+words*perWord;
  const readingSeconds=8+words*60/180;
  const characterSeconds=letters/22;
  return Math.max(min,Math.min(max,Math.ceil(Math.max(policySeconds,readingSeconds,characterSeconds))));
 }
 function makeCards(records,tad){
  const out=[],byId=new Map();
  for(const r of records){if(!['hadith','athar'].includes(r.recordType)||!r.id||!r.textMarkdown||!r.source)continue;const item={id:String(r.id),module:r.recordType,record:r};if(!byId.has(item.id)){byId.set(item.id,item);out.push(item)}}
  for(const t of tad){const id='QTD-'+hash([t.reference,t.narrator,t.source,t.text].join('|')),item={id,module:'quranTad',tad:t};if(!byId.has(id)){byId.set(id,item);out.push(item)}}
  return {cards:out,byId};
 }
 async function loadSaverLibrary(){
  if(saverPromise)return saverPromise;
  saverPromise=(async()=>{
   const cached=await read('saver','library');
   try{
    const [rotationConfig,catalog,tadData]=await Promise.all([json(SCREEN+'rotation.json'),json(SCREEN+'catalog.json'),loadTadabbur()]);
    const weights=rotationConfig.futureModuleMixing?.weights;
    if(rotationConfig.mode!=='shuffleBag'||!rotationConfig.cyclePolicy?.showEveryItemBeforeRepeat||!weights||['hadith','athar','quranTad'].some(m=>!Number.isInteger(weights[m])||weights[m]<1))throw Error('Ungültige tvOS-Rotationsregeln');
    if(!Array.isArray(catalog.entriesPaths)||!catalog.contentSource?.includedRecordTypes?.includes('hadith')||!catalog.contentSource?.includedRecordTypes?.includes('athar'))throw Error('Ungültiger Screensaver-Katalog');
    let records=[];
    for(const p of catalog.entriesPaths){if(typeof p!=='string'||!p.startsWith('../hadith/'))throw Error('Ungültiger Screensaver-Pfad');const root=new URL(SCREEN,location.href),url=new URL(p,root);if(!url.pathname.startsWith('/apple-tv/hadith/'))throw Error('Nicht erlaubter Datenpfad');const file=await json(url.pathname);const part=file.records;if(!Array.isArray(part))throw Error('Screensaver-Datensätze fehlen');records.push(...part)}
    if(records.length!==catalog.entriesCount)throw Error('Screensaver-Katalog ist unvollständig');
    const built=makeCards(records,tadData.entries),revision=[catalog.contentRevision,catalog.entriesCount,tadData.revision,rotationConfig.schemaVersion].join('/');
    const data={revision,cards:built.cards,weights,display:rotationConfig.display,policy:rotationConfig.cyclePolicy,tad:tadData};
    await write('saver','library',{revision,cards:built.cards,weights,display:data.display,policy:data.policy});
    return data;
   }catch(error){
    if(cached?.cards?.length){return {...cached,offline:true,tad:null}}
    throw error;
   }
  })();
  try{return await saverPromise}finally{saverPromise=null}
 }
 function tadCacheForCard(){return false}
 async function getQuranVerse(reference){
  if(quranMemory.has(reference))return quranMemory.get(reference);
  const cached=await read('quran',reference);if(cached){quranMemory.set(reference,cached);return cached}
  if(!refOK(reference))throw Error('Ungültige Qurʾān-Referenz');
  const [ar,de]=await Promise.all(['quran-uthmani','de.bubenheim'].map(async edition=>{const d=await json('https://api.alquran.cloud/v1/ayah/'+reference+'/'+edition);if(d.code!==200||!d.data?.text)throw Error('Qurʾān-Vers nicht verfügbar');return d.data}));
  if(ar.surah?.number!==de.surah?.number||ar.numberInSurah!==de.numberInSurah)throw Error('Qurʾān-Editionen stimmen nicht überein');
  const v={reference,ar:ar.text,de:de.text};quranMemory.set(reference,v);await write('quran',reference,v);return v;
 }
 async function setText(id,value){say($(id),value)}
 async function renderCard(cardOverride=null){
  const token=++renderToken,s=rotationState?.current;if((!s&&!cardOverride)||!library)return;
  const card=cardOverride||library.byId.get(s.id);if(!card)return;
  $('saverAr').style.display='none';$('saverAr').textContent='';
  $('saverStatement')?.replaceChildren();$('saverNarrator')?.replaceChildren();say($('saverSource'),'');say($('saverDe'),'');
  if(card.module==='quranTad'){
   say($('saverType'),'Qurʾān · Tadabbur');
   const verseNode=$('saverDe');say(verseNode,'Lade Qurʾān-Text und deutsche Übersetzung …');
   const meta=document.createElement('span');meta.textContent=[card.tad.narrator,card.tad.generation].filter(Boolean).join(' · ');$('saverNarrator')?.append(meta);
   const statement=document.createElement('p');statement.className='saver-tadabbur-text';statement.textContent=card.tad.text;$('saverStatement')?.append(statement);
   say($('saverSource'),[card.tad.reference,card.tad.source,card.tad.grading].filter(Boolean).join(' · '));
   try{const v=await getQuranVerse(card.tad.reference);if(token!==renderToken)return;say(verseNode,v.de)}catch{if(token!==renderToken)return;say(verseNode,'Qurʾān-Vers '+card.tad.reference+' · Übersetzung wird bei Verbindung nachgeladen')}
  }else{
   const r=card.record;say($('saverType'),card.module==='athar'?'Āṯār · Überlieferung':'Ḥadīṯ · Überlieferung');$('saverAr').style.display='none';
   const line=[r.narratorLine,r.speakerLabel].filter(Boolean).join(' ');
   if(line){const n=document.createElement('p');n.className='saver-narrator-line';n.textContent=line;$('saverNarrator')?.append(n)}
   say($('saverDe'),MARKDOWN(r.textMarkdown));
   say($('saverSource'),[r.source,r.grade].filter(Boolean).join(' · '));
   if(r.sharhStatus==='verified'&&r.sharhText&&rotation.display.sharhMode==='compact'){const p=document.createElement('p');p.className='saver-sharh';p.textContent=MARKDOWN(r.sharhText);$('saverStatement')?.append(p)}
  }
 }
 async function nextCardCore(){
  if(!library)await ensureReady();
  if(!library)return;
  const all=library.cards,byId=library.byId;
  if(!rotationState)rotationState=await read('state','tvos-bag');
  if(!rotationState||!Array.isArray(rotationState.remaining)){
   rotationState={revision:library.revision,remaining:stableMix(all,library.weights),shown:[],recent:[],current:null};
  }else{
   const valid=new Set(byId.keys()),known=new Set([...rotationState.remaining,...(rotationState.shown||[])]);
   rotationState.remaining=rotationState.remaining.filter(id=>valid.has(id));
   rotationState.shown=(rotationState.shown||[]).filter(id=>valid.has(id));
   rotationState.recent=(rotationState.recent||[]).filter(id=>valid.has(id)).slice(-Number(library.policy.crossCycleCooldownCount||20));
   const additions=all.filter(x=>!known.has(x.id));
   if(additions.length)rotationState.remaining.push(...stableMix(additions,library.weights));
   rotationState.revision=library.revision;
  }
  if(!rotationState.remaining.length){
   const cooldown=new Set((rotationState.recent||[]).slice(-Number(library.policy.crossCycleCooldownCount||20)));
   rotationState.remaining=stableMix(all,library.weights);rotationState.shown=[];
   for(let i=0;i<Math.min(cooldown.size,rotationState.remaining.length);){if(cooldown.has(rotationState.remaining[i]))rotationState.remaining.push(rotationState.remaining.splice(i,1)[0]);else i++}
  }
  const id=rotationState.remaining.shift(),card=byId.get(id);if(!card)return;
  await renderCard(card);
  const rendered=['saverDe','saverNarrator','saverStatement','saverSource'].map(id=>$(id)?.textContent||'').filter(Boolean).join(' ');
  const now=Math.floor(Date.now()/1000),duration=durationFor(card,library.display,rendered);
  rotationState.current={id,startedAt:now,duration};rotationState.lastId=id;await write('state','tvos-bag',rotationState);
 }
 let nextPromise=null;
 async function nextCard(){
  if(nextPromise)return nextPromise;
  nextPromise=nextCardCore();
  try{return await nextPromise}finally{nextPromise=null}
 }
 async function advance(now){
  if(!rotationState?.current){await nextCard();return}
  const cur=rotationState.current;if(now-cur.startedAt<cur.duration)return;
  rotationState.recent=rotationState.recent||[];rotationState.recent.push(cur.id);rotationState.recent=rotationState.recent.slice(-Number(library.policy.crossCycleCooldownCount||20));
  rotationState.shown=rotationState.shown||[];rotationState.shown.push(cur.id);rotationState.current=null;
  await nextCard();
 }
 async function ensureReady(){
  if(library)return library;
  if(readyPromise)return readyPromise;
  readyPromise=(async()=>{
   try{
    const [data,state]=await Promise.all([loadSaverLibrary(),read('state','tvos-bag')]);
    if(!data)throw Error('Screensaver-Inhalte fehlen');
    library={...data,byId:new Map(data.cards.map(card=>[card.id,card]))};
    rotation=data;rotationState=state||null;
    return library;
   }catch(error){
    lastLoadError=String(error?.message||error);console.error('DĀR tvOS content load failed',lastLoadError);
    const cached=await read('saver','library');
    if(cached?.cards?.length){
     library={...cached,byId:new Map(cached.cards.map(card=>[card.id,card])),offline:true,tad:null};
     rotation=cached;rotationState=await read('state','tvos-bag');return library;
    }
    say($('saverType'),'Bildschirmschoner-Inhalt nicht verfügbar');
    say($('saverDe'),'DĀR-Inhalte können derzeit nicht geladen werden. Die Verbindung wird erneut geprüft.');
    return null;
   }finally{readyPromise=null}
  })();
  return readyPromise;
 }
 function status(){
  const counts={hadith:0,athar:0,quranTad:0};
  for(const card of library?.cards||[])counts[card.module]=(counts[card.module]||0)+1;
  return {ready:!!library,offline:!!library?.offline,error:lastLoadError,counts,weights:library?.weights||null,mode:rotation?.mode||'shuffleBag',revision:library?.revision||null,currentDuration:rotationState?.current?.duration??null,currentId:rotationState?.current?.id??null};
 }
 async function renderCurrent(){
  const current=rotationState?.current,card=current&&library?.byId.get(current.id);if(!current||!card)return;
  await renderCard(card);
  if(rotationState?.current!==current)return;
  const rendered=['saverAr','saverDe','saverNarrator','saverStatement','saverSource'].map(id=>$(id)?.textContent||'').filter(Boolean).join(' ');
  current.duration=Math.max(Number(current.duration)||0,durationFor(card,library.display,rendered));
  await write('state','tvos-bag',rotationState);
 }
 function render(){if(!library){say($('saverType'),'DĀR-Bildschirmschoner · wird geladen');say($('saverDe'),'Geprüfte Inhalte werden synchronisiert …');ensureReady().then(()=>{if(library){if(!rotationState?.current)nextCard();else renderCurrent()}}).catch(()=>{});return}if(!rotationState?.current)nextCard();else renderCurrent()}
 function tick(now){if(!document.body.classList.contains('saver-open')&&!$('app')?.classList.contains('saver-open'))return;if(!library){ensureReady().then(()=>{if(library)nextCard()});return}advance(now).catch(()=>{})}
 function install(){
  $('openTadabbur')?.addEventListener('click',()=>{$('openTadabbur')?.setAttribute('aria-expanded','true');openTadabbur()});
  $('nextTadabbur')?.addEventListener('click',openTadabbur);
  $('closeTadabbur')?.addEventListener('click',()=>{const p=$('tadabburPanel');if(p){p.hidden=true;p.setAttribute('aria-expanded','false')}$('openTadabbur')?.setAttribute('aria-expanded','false');$('openTadabbur')?.focus({preventScroll:true})});
  $('saverMode')?.addEventListener('change',e=>{const isTv=e.target.value==='tvos',field=$('saverRotate')?.closest('.field');if(field)field.hidden=isTv;if(isTv)ensureReady()});
  if($('saverMode')?.value==='tvos')ensureReady();
  window.darTvScreensaver={render,tick,ensureReady,status};
  window.addEventListener('online',()=>{if($('saverMode')?.value==='tvos')ensureReady()});
 }
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const p=$('tadabburPanel');if(p&&!p.hidden){p.hidden=true;p.setAttribute('aria-expanded','false');$('openTadabbur')?.setAttribute('aria-expanded','false');$('openTadabbur')?.focus({preventScroll:true})}}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();