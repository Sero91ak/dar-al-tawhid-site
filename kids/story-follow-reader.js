(() => {
"use strict";

/* DĀR AL TAWḤĪD Kids — shared audiobook / follow reader v4
   - persistent per-story progress
   - timestamp-aware paragraph following with calibrated fallback
   - child-friendly focus reader with automatic voice-follow scrolling
   - Media Session metadata + artwork + lock-screen controls
   - seek / resume / restart support
*/
const PROGRESS_PREFIX="kids.storyAudioProgress.v2.";
const NOW_PLAYING_KEY="kids.storyNowPlaying.v2";

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function formatTime(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)return"0:00";
  const m=Math.floor(n/60),s=Math.floor(n%60);
  return m+":"+String(s).padStart(2,"0");
}
function splitParagraphs(text){
  return String(text||"").split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
}
function absoluteUrl(src){
  const raw=String(src||"").trim();
  if(!raw)return"";
  try{return new URL(raw,location.href).href}catch(_){return raw}
}
function safeJsonRead(key){
  try{const value=JSON.parse(localStorage.getItem(key)||"null");return value&&typeof value==="object"?value:null}catch(_){return null}
}
function safeJsonWrite(key,value){
  try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}
}
function safeRemove(key){try{localStorage.removeItem(key)}catch(_){}}
let nativeNowPlayingAt=0;
function postNativeNowPlaying(payload,force=false){
  try{
    const handler=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darKidsNowPlaying;
    if(!handler||typeof handler.postMessage!=="function")return;
    const now=Date.now();
    if(!force&&now-nativeNowPlayingAt<850)return;
    nativeNowPlayingAt=now;
    handler.postMessage(payload||{});
  }catch(_){}
}
function normalizeKey(value){return String(value||"").trim().replace(/\s+/g,"-")}
function progressStorageKey(value){return PROGRESS_PREFIX+normalizeKey(value)}

function create(options){
  if(!options||!options.id||!options.audio)return null;
  const audio=options.audio,id=String(options.id).replace(/[^a-z0-9_-]/gi,"-");
  try{audio.setAttribute("playsinline","");audio.setAttribute("webkit-playsinline","");audio.preload="metadata"}catch(_){}
  const prior=document.getElementById("kidsFollowReader-"+id);
  if(prior)prior.remove();

  const root=document.createElement("div");
  root.id="kidsFollowReader-"+id;
  root.className="kids-follow-reader";
  root.setAttribute("aria-hidden","true");
  root.innerHTML=
    '<section class="kfr-sheet" role="dialog" aria-modal="true" aria-label="Geschichte mitlesen">'+
      '<header class="kfr-head">'+
        '<div class="kfr-head-copy"><span class="kfr-kicker">HÖRBUCH · MITLESEN</span><strong class="kfr-title"></strong><span class="kfr-subtitle"></span></div>'+
        '<button class="kfr-close" type="button" aria-label="Mitlesen schließen"><span>Zur Geschichte</span><b aria-hidden="true">×</b></button>'+
      '</header>'+
      '<div class="kfr-controls">'+
        '<button class="kfr-play" type="button">Abspielen</button>'+
        '<button class="kfr-restart" type="button" aria-label="Geschichte von vorn starten">Von vorn</button>'+
        '<div class="kfr-time"><span class="kfr-current">0:00</span><span class="kfr-time-sep">/</span><span class="kfr-total">0:00</span></div>'+
        '<button class="kfr-progress" type="button" role="slider" aria-label="Wiedergabeposition ändern"><span></span></button>'+
        '<div class="kfr-help">Der aktuelle Abschnitt wird hervorgehoben und folgt der Stimme automatisch. Du kannst jederzeit selbst scrollen.</div>'+
      '</div>'+
      '<div class="kfr-read" tabindex="0" aria-label="Text zum Mitlesen"></div>'+
    '</section>';
  document.body.appendChild(root);

  const titleEl=root.querySelector(".kfr-title");
  const subtitleEl=root.querySelector(".kfr-subtitle");
  const kickerEl=root.querySelector(".kfr-kicker");
  const helpEl=root.querySelector(".kfr-help");
  const playEl=root.querySelector(".kfr-play");
  const restartEl=root.querySelector(".kfr-restart");
  const closeEl=root.querySelector(".kfr-close");
  const readEl=root.querySelector(".kfr-read");
  const progressButton=root.querySelector(".kfr-progress");
  const progressEl=root.querySelector(".kfr-progress span");
  const currentEl=root.querySelector(".kfr-current");
  const totalEl=root.querySelector(".kfr-total");
  let paragraphs=[],weights=[],totalWeight=0,timingCues=[],syncPoints=[],lastIndex=-1,manualUntil=0;
  let currentContent={},restoredToken="",lastPersistAt=0,mediaSessionActive=false,readerView="follow",backgroundLocks=[];

  function content(){
    const value=typeof options.getContent==="function"?options.getContent():{};
    return value&&typeof value==="object"?value:{};
  }
  function storyKey(value=currentContent){
    const c=value&&typeof value==="object"?value:{};
    return normalizeKey(c.key||[id,c.title||"story",c.age||""].filter(Boolean).join(":"));
  }
  function normalizeTimingCues(raw){
    if(!Array.isArray(raw)||!paragraphs.length)return[];
    const list=[];
    raw.forEach((entry,order)=>{
      if(entry==null)return;
      let start,end,index;
      if(typeof entry==="number"){
        start=Number(entry);index=order;
      }else if(typeof entry==="object"){
        start=Number(entry.start??entry.startSec??entry.time??entry.from);
        end=Number(entry.end??entry.endSec??entry.to);
        index=Number(entry.paragraphIndex??entry.paragraph??entry.index??order);
      }
      if(!Number.isFinite(start)||!Number.isInteger(index)||index<0||index>=paragraphs.length)return;
      list.push({start:Math.max(0,start),end:Number.isFinite(end)?Math.max(start,end):null,index});
    });
    list.sort((a,b)=>a.start-b.start||a.index-b.index);
    return list;
  }
  function normalizeSyncPoints(raw){
    if(!Array.isArray(raw)||!paragraphs.length)return[];
    return raw.map(entry=>{
      if(!entry||typeof entry!=="object")return null;
      const time=Number(entry.time??entry.start??entry.startSec);
      const paragraph=Number(entry.paragraph??entry.paragraphIndex??entry.index);
      if(!Number.isFinite(time)||!Number.isInteger(paragraph)||paragraph<0||paragraph>=paragraphs.length)return null;
      return{time:Math.max(0,time),paragraph};
    }).filter(Boolean).sort((a,b)=>a.time-b.time||a.paragraph-b.paragraph);
  }
  function setContent(value){
    const incoming=value&&typeof value==="object"?value:content();
    const base=content();
    const c=Object.assign({},base&&typeof base==="object"?base:{},incoming);
    const prevKey=storyKey(currentContent);
    currentContent=c;
    const nextKey=storyKey(c);
    if(prevKey!==nextKey)restoredToken="";
    const audioOnly=!!c.audioOnly;
    root.classList.toggle("audio-only",audioOnly);
    root.dataset.readerMode=audioOnly?"audio":"read-along";
    if(titleEl)titleEl.textContent=String(c.title||"Geschichte");
    if(subtitleEl)subtitleEl.textContent=String(c.subtitle||c.album||"DĀR AL TAWḤĪD Kids");
    if(kickerEl)kickerEl.textContent=audioOnly?"HÖRBUCH":"HÖRBUCH · MITLESEN";
    if(helpEl)helpEl.textContent=audioOnly
      ?"Dein Hörbuch merkt sich automatisch, wo du aufgehört hast."
      :"Der aktuelle Abschnitt wird hervorgehoben und folgt der Stimme automatisch. Du kannst jederzeit selbst scrollen.";
    readEl.setAttribute("aria-hidden",audioOnly?"true":"false");
    paragraphs=audioOnly?[]:splitParagraphs(c.text||"");
    weights=paragraphs.map(p=>Math.max(1,(p.match(/\S+/g)||[]).length));
    totalWeight=weights.reduce((n,w)=>n+w,0)||1;
    timingCues=normalizeTimingCues(c.timings||c.paragraphTimings||c.cues||[]);
    syncPoints=normalizeSyncPoints(c.syncPoints||c.syncAnchors||[]);
    root.dataset.syncMode=timingCues.length?"timestamps":(syncPoints.length?"calibrated":"estimated");
    readEl.innerHTML=paragraphs.map((p,i)=>'<p data-kfr-index="'+i+'">'+esc(p)+'</p>').join("");
    lastIndex=-1;
    sync(true);
  }
  function cumulativeWeightBefore(index){
    let sum=0;
    for(let i=0;i<Math.max(0,Math.min(index,weights.length));i++)sum+=weights[i];
    return sum;
  }
  function paragraphIndexFromTimings(current){
    if(!timingCues.length)return-1;
    let chosen=timingCues[0];
    for(let i=0;i<timingCues.length;i++){
      const cue=timingCues[i];
      if(current+0.04<cue.start)break;
      chosen=cue;
      if(Number.isFinite(cue.end)&&current<=cue.end+0.04)break;
    }
    return chosen.index;
  }
  function calibratedTargetWeight(current,duration){
    const anchors=[{time:0,weight:0}]
      .concat(syncPoints.map(p=>({time:p.time,weight:cumulativeWeightBefore(p.paragraph)})))
      .concat([{time:Math.max(0,duration),weight:totalWeight}])
      .filter((p,i,a)=>Number.isFinite(p.time)&&Number.isFinite(p.weight)&&(!i||p.time>=a[i-1].time));
    if(anchors.length<2||duration<=0)return Math.max(0,Math.min(1,current/Math.max(1,duration)))*totalWeight;
    const t=Math.max(0,Math.min(duration,current));
    let left=anchors[0],right=anchors[anchors.length-1];
    for(let i=1;i<anchors.length;i++){
      if(t<=anchors[i].time){left=anchors[i-1];right=anchors[i];break}
    }
    const span=Math.max(.001,right.time-left.time);
    const r=Math.max(0,Math.min(1,(t-left.time)/span));
    return left.weight+(right.weight-left.weight)*r;
  }
  function paragraphIndexAtTime(current,duration){
    if(!paragraphs.length)return-1;
    const timed=paragraphIndexFromTimings(current);
    if(timed>=0)return timed;
    const target=calibratedTargetWeight(current,duration);
    let sum=0;
    for(let i=0;i<weights.length;i++){sum+=weights[i];if(target<sum||i===weights.length-1)return i}
    return paragraphs.length-1;
  }
  function clearMarks(){
    readEl.querySelectorAll("p[data-kfr-index]").forEach(node=>node.classList.remove("active","past"));
    lastIndex=-1;
  }
  function scrollReaderNode(node,instant=false){
    if(!node||!readEl)return;
    const top=Math.max(0,node.offsetTop-(readEl.clientHeight-node.offsetHeight)/2);
    try{readEl.scrollTo({top,behavior:instant?"auto":"smooth"})}catch(_){readEl.scrollTop=top}
  }
  function mark(index,forceScroll){
    const nodes=readEl.querySelectorAll("p[data-kfr-index]");
    nodes.forEach((node,i)=>{
      node.classList.toggle("active",i===index);
      node.classList.toggle("past",i<index);
    });
    if(index<0||index===lastIndex)return;
    lastIndex=index;
    const node=nodes[index];
    if(node&&(forceScroll||performance.now()>manualUntil))scrollReaderNode(node,!!forceScroll);
  }
  function readProgress(){
    const key=storyKey();
    return key?safeJsonRead(progressStorageKey(key)):null;
  }
  function persist(force=false){
    const key=storyKey();
    if(!key)return;
    const now=Date.now();
    if(!force&&now-lastPersistAt<900)return;
    lastPersistAt=now;
    const current=Number(audio.currentTime)||0;
    const duration=Number(audio.duration)||Number(readProgress()?.duration)||0;
    if(audio.ended||(duration>0&&current>=duration-1)){
      safeRemove(progressStorageKey(key));
      return;
    }
    if(current<0.5)return;
    const c=currentContent||{};
    safeJsonWrite(progressStorageKey(key),{
      time:Math.round(current*4)/4,
      duration:Number.isFinite(duration)?duration:0,
      updatedAt:now,
      title:String(c.title||"Geschichte"),
      artwork:absoluteUrl(c.artwork||""),
      deepLink:String(c.deepLink||"")
    });
  }
  function restore(){
    const key=storyKey();
    if(!key)return false;
    const src=String(audio.currentSrc||audio.src||"");
    const token=key+"|"+src;
    if(restoredToken===token)return false;
    const saved=readProgress();
    const duration=Number(audio.duration)||Number(saved?.duration)||0;
    if(!saved||Number(saved.time)<1){
      restoredToken=token;
      return false;
    }
    let target=Number(saved.time)||0;
    if(duration>0){
      if(target>=duration-1.5){safeRemove(progressStorageKey(key));restoredToken=token;return false}
      target=Math.min(target,Math.max(0,duration-.5));
    }
    try{
      audio.currentTime=target;
      restoredToken=token;
      sync(true);
      return true;
    }catch(_){return false}
  }
  function clearProgress(){
    const key=storyKey();
    if(key)safeRemove(progressStorageKey(key));
    restoredToken="";
    try{audio.currentTime=0}catch(_){}
    sync(true);
  }
  function updatePlay(){
    if(!playEl)return;
    playEl.disabled=typeof options.disabled==="function"?!!options.disabled():false;
    if(!audio.paused&&!audio.ended)playEl.textContent="Pause";
    else if(audio.currentTime>0&&!audio.ended)playEl.textContent="Weiterhören";
    else if(audio.ended)playEl.textContent="Nochmal";
    else playEl.textContent=root.classList.contains("audio-only")?"Hörbuch starten":"Abspielen";
  }
  function updatePositionState(){
    if(!mediaSessionActive||!("mediaSession" in navigator)||typeof navigator.mediaSession.setPositionState!=="function")return;
    const duration=Number(audio.duration),position=Number(audio.currentTime),rate=Number(audio.playbackRate)||1;
    if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(position))return;
    try{navigator.mediaSession.setPositionState({duration,playbackRate:rate,position:Math.max(0,Math.min(duration,position))})}catch(_){}
  }
  function sync(forceScroll){
    const duration=Number(audio.duration)||0,current=Number(audio.currentTime)||0;
    const ratio=duration>0?Math.max(0,Math.min(1,current/duration)):0;
    if(progressEl)progressEl.style.width=(ratio*100)+"%";
    if(currentEl)currentEl.textContent=formatTime(current);
    if(totalEl)totalEl.textContent=formatTime(duration);
    if(progressButton){
      progressButton.setAttribute("aria-valuemin","0");
      progressButton.setAttribute("aria-valuemax",String(Math.max(0,Math.round(duration))));
      progressButton.setAttribute("aria-valuenow",String(Math.max(0,Math.round(current))));
      progressButton.setAttribute("aria-valuetext",formatTime(current)+" von "+formatTime(duration));
    }
    if(!root.classList.contains("audio-only")&&readerView!=="read")mark(paragraphIndexAtTime(current,duration),!!forceScroll);
    updatePlay();
    try{navigator.mediaSession.playbackState="playing"}catch(_){}
    updatePositionState();
  }
  function mediaArtwork(c){
    const src=absoluteUrl(c.artwork||"");
    if(!src)return[];
    const type=/\.png(?:$|\?)/i.test(src)?"image/png":/\.webp(?:$|\?)/i.test(src)?"image/webp":"image/jpeg";
    return[{src,sizes:"512x512",type}];
  }
  function installMediaHandlers(){
    if(!("mediaSession" in navigator))return;
    const safe=(name,handler)=>{try{navigator.mediaSession.setActionHandler(name,handler)}catch(_){}};
    safe("play",()=>{Promise.resolve(audio.play()).catch(()=>{})});
    safe("pause",()=>audio.pause());
    safe("stop",()=>{persist(true);audio.pause()});
    safe("seekbackward",details=>{const amount=Number(details?.seekOffset)||15;try{audio.currentTime=Math.max(0,(Number(audio.currentTime)||0)-amount)}catch(_){}});
    safe("seekforward",details=>{const amount=Number(details?.seekOffset)||15;const d=Number(audio.duration)||Infinity;try{audio.currentTime=Math.min(d,(Number(audio.currentTime)||0)+amount)}catch(_){}});
    safe("seekto",details=>{if(Number.isFinite(Number(details?.seekTime)))try{audio.currentTime=Math.max(0,Math.min(Number(audio.duration)||Number(details.seekTime),Number(details.seekTime)))}catch(_){}});
  }
  function applyDeepLink(c){
    const link=String(c.deepLink||"").trim();
    if(!link||link[0]!=="#")return;
    try{
      if(location.hash!==link)history.replaceState(history.state||{},"",location.pathname+(location.search||"")+link);
    }catch(_){}
  }
  function nativePayload(clear=false){
    const c=currentContent&&Object.keys(currentContent).length?currentContent:content();
    return clear?{clear:true}:{
      title:String(c.title||"Geschichte"),
      artist:String(c.subtitle||"DĀR AL TAWḤĪD Kids"),
      album:String(c.album||"DĀR AL TAWḤĪD Kids · Hörbuch"),
      artwork:absoluteUrl(c.artwork||""),
      deepLink:String(c.deepLink||""),
      elapsed:Number(audio.currentTime)||0,
      duration:Number(audio.duration)||0,
      playing:!audio.paused&&!audio.ended
    };
  }
  function exposeNativeRemote(){
    window.DARKidsAudioRemote={
      play:()=>Promise.resolve(audio.play()).catch(()=>{}),
      pause:()=>audio.pause(),
      seekTo:value=>{const d=Number(audio.duration)||Infinity,v=Number(value)||0;try{audio.currentTime=Math.max(0,Math.min(d,v))}catch(_){}},
      seekBy:value=>{const d=Number(audio.duration)||Infinity,v=(Number(audio.currentTime)||0)+(Number(value)||0);try{audio.currentTime=Math.max(0,Math.min(d,v))}catch(_){}},
      openCurrent:()=>{applyDeepLink(currentContent||content());open()},
      state:()=>nativePayload(false)
    };
  }
  function activateMediaSession(){
    const c=currentContent&&Object.keys(currentContent).length?currentContent:content();
    currentContent=c;
    mediaSessionActive=true;
    exposeNativeRemote();
    if("mediaSession" in navigator&&typeof MediaMetadata!=="undefined"){
      try{
        navigator.mediaSession.metadata=new MediaMetadata({
          title:String(c.title||"Geschichte"),
          artist:String(c.subtitle||"DĀR AL TAWḤĪD Kids"),
          album:String(c.album||"Kinder-Hörbuch"),
          artwork:mediaArtwork(c)
        });
      }catch(_){}
      installMediaHandlers();
    }
    applyDeepLink(c);
    safeJsonWrite(NOW_PLAYING_KEY,{
      key:storyKey(c),
      title:String(c.title||"Geschichte"),
      subtitle:String(c.subtitle||"DĀR AL TAWḤĪD Kids"),
      artwork:absoluteUrl(c.artwork||""),
      deepLink:String(c.deepLink||""),
      updatedAt:Date.now()
    });
    try{navigator.mediaSession.playbackState="playing"}catch(_){}
    postNativeNowPlaying(nativePayload(false),true);
    updatePositionState();
  }
  function lockBackground(){
    unlockBackground();
    backgroundLocks=[];
    Array.from(document.body.children).forEach(el=>{
      if(el===root||!(el instanceof HTMLElement)||["SCRIPT","STYLE","LINK"].includes(el.tagName)||el.hasAttribute("inert"))return;
      el.setAttribute("inert","");
      backgroundLocks.push(el);
    });
  }
  function unlockBackground(){
    backgroundLocks.forEach(el=>{try{el.removeAttribute("inert")}catch(_){}});
    backgroundLocks=[];
  }
  function applyReaderView(mode){
    readerView=mode==="read"?"read":"follow";
    root.dataset.readerView=readerView;
    if(readerView==="read"){
      if(kickerEl)kickerEl.textContent="NUR LESEN";
      root.querySelector(".kfr-sheet")?.setAttribute("aria-label","Geschichte nur lesen");
      clearMarks();
    }else{
      if(kickerEl)kickerEl.textContent=root.classList.contains("audio-only")?"HÖRBUCH":"HÖREN · MITLESEN";
      root.querySelector(".kfr-sheet")?.setAttribute("aria-label",root.classList.contains("audio-only")?"Hörbuch-Player":"Geschichte hören und mitlesen");
    }
  }
  function openWithContent(value,mode="follow"){
    const c=value&&typeof value==="object"?value:content();
    if(c.text!=null)setContent(c);
    applyReaderView(mode);
    lockBackground();
    root.classList.add("open");
    root.removeAttribute("aria-hidden");
    document.documentElement.classList.add("kids-follow-reader-open");
    if(readerView==="read"){try{readEl.scrollTop=0}catch(_){}}
    else sync(true);
    setTimeout(()=>(readerView==="read"?closeEl:playEl)?.focus(),0);
  }
  function open(){openWithContent(content(),"follow")}
  function openReadAlong(){
    const c=Object.assign({},content(),{audioOnly:false,adultCompanion:true});
    openWithContent(c,"follow");
  }
  function openReading(){
    const c=Object.assign({},content(),{audioOnly:false,adultCompanion:true});
    openWithContent(c,"read");
  }
  function close(){
    persist(true);
    root.classList.remove("open");
    root.setAttribute("aria-hidden","true");
    document.documentElement.classList.remove("kids-follow-reader-open");
    unlockBackground();
  }
  function isOpen(){return root.classList.contains("open")}
  function seekFromEvent(e){
    const r=progressButton.getBoundingClientRect();
    if(!r.width||!Number(audio.duration))return;
    const ratio=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    try{audio.currentTime=ratio*audio.duration}catch(_){}
    sync(true);persist(true);
  }

  playEl.addEventListener("click",()=>{if(typeof options.toggleAudio==="function")options.toggleAudio()});
  restartEl.addEventListener("click",()=>{clearProgress();if(audio.paused&&typeof options.toggleAudio==="function")options.toggleAudio()});
  closeEl.addEventListener("click",close);
  root.addEventListener("click",e=>{if(e.target===root)close()});
  progressButton.addEventListener("click",seekFromEvent);
  ["pointerdown","touchstart","wheel"].forEach(type=>readEl.addEventListener(type,()=>{manualUntil=performance.now()+5000},{passive:true}));
  audio.addEventListener("timeupdate",()=>{sync(false);persist(false);if(mediaSessionActive)postNativeNowPlaying(nativePayload(false),false)});
  audio.addEventListener("loadedmetadata",()=>{restore();sync(true)});
  audio.addEventListener("canplay",()=>{restore();sync(false)},{passive:true});
  audio.addEventListener("durationchange",()=>sync(false));
  audio.addEventListener("play",()=>{activateMediaSession();if(options.autoOpen!==false&&!isOpen())open();updatePlay()});
  audio.addEventListener("pause",()=>{persist(true);try{if("mediaSession" in navigator)navigator.mediaSession.playbackState="paused"}catch(_){}if(mediaSessionActive)postNativeNowPlaying(nativePayload(false),true);updatePlay()});
  audio.addEventListener("ended",()=>{const key=storyKey();if(key)safeRemove(progressStorageKey(key));try{if("mediaSession" in navigator)navigator.mediaSession.playbackState="none"}catch(_){}if(mediaSessionActive)postNativeNowPlaying(nativePayload(false),true);sync(true)});
  audio.addEventListener("seeking",()=>sync(false));
  audio.addEventListener("seeked",()=>{sync(true);persist(true)});
  window.addEventListener("pagehide",()=>{persist(true);if(mediaSessionActive)postNativeNowPlaying(nativePayload(false),true)});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)persist(true)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isOpen()){e.stopPropagation();close()}},true);

  setContent(content());
  return {
    open,openReadAlong,openReading,close,isOpen,setContent,sync,persist,restore,clearProgress,
    activateMediaSession,
    formatTime,
    getSavedProgress:readProgress
  };
}
window.DARKidsFollowReader={version:5,create,formatTime,progressPrefix:PROGRESS_PREFIX,nowPlayingKey:NOW_PLAYING_KEY};
})();