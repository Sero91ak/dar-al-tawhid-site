(() => {
"use strict";

/* DĀR AL TAWḤĪD Kids — shared audiobook / follow reader v2
   - persistent per-story progress
   - child-friendly focus reader with live paragraph following
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
function normalizeKey(value){return String(value||"").trim().replace(/\s+/g,"-")}
function progressStorageKey(value){return PROGRESS_PREFIX+normalizeKey(value)}

function create(options){
  if(!options||!options.id||!options.audio)return null;
  const audio=options.audio,id=String(options.id).replace(/[^a-z0-9_-]/gi,"-");
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
        '<button class="kfr-progress" type="button" aria-label="Wiedergabeposition ändern"><span></span></button>'+
        '<div class="kfr-help">Der aktuelle Abschnitt wird hervorgehoben und folgt der Stimme automatisch. Du kannst jederzeit selbst scrollen.</div>'+
      '</div>'+
      '<div class="kfr-read" tabindex="0" aria-label="Text zum Mitlesen"></div>'+
    '</section>';
  document.body.appendChild(root);

  const titleEl=root.querySelector(".kfr-title");
  const subtitleEl=root.querySelector(".kfr-subtitle");
  const playEl=root.querySelector(".kfr-play");
  const restartEl=root.querySelector(".kfr-restart");
  const closeEl=root.querySelector(".kfr-close");
  const readEl=root.querySelector(".kfr-read");
  const progressButton=root.querySelector(".kfr-progress");
  const progressEl=root.querySelector(".kfr-progress span");
  const currentEl=root.querySelector(".kfr-current");
  const totalEl=root.querySelector(".kfr-total");
  let paragraphs=[],weights=[],totalWeight=0,lastIndex=-1,manualUntil=0;
  let currentContent={},restoredToken="",lastPersistAt=0,mediaSessionActive=false;

  function content(){
    const value=typeof options.getContent==="function"?options.getContent():{};
    return value&&typeof value==="object"?value:{};
  }
  function storyKey(value=currentContent){
    const c=value&&typeof value==="object"?value:{};
    return normalizeKey(c.key||[id,c.title||"story",c.age||""].filter(Boolean).join(":"));
  }
  function setContent(value){
    const c=value&&typeof value==="object"?value:content();
    const prevKey=storyKey(currentContent);
    currentContent=c;
    const nextKey=storyKey(c);
    if(prevKey!==nextKey)restoredToken="";
    if(titleEl)titleEl.textContent=String(c.title||"Geschichte");
    if(subtitleEl)subtitleEl.textContent=String(c.subtitle||c.album||"DĀR AL TAWḤĪD Kids");
    paragraphs=splitParagraphs(c.text||"");
    weights=paragraphs.map(p=>Math.max(1,(p.match(/\S+/g)||[]).length));
    totalWeight=weights.reduce((n,w)=>n+w,0)||1;
    readEl.innerHTML=paragraphs.map((p,i)=>'<p data-kfr-index="'+i+'">'+esc(p)+'</p>').join("");
    lastIndex=-1;
    sync(true);
  }
  function paragraphIndex(ratio){
    if(!paragraphs.length)return-1;
    const target=Math.max(0,Math.min(1,ratio))*totalWeight;
    let sum=0;
    for(let i=0;i<weights.length;i++){sum+=weights[i];if(target<=sum)return i}
    return paragraphs.length-1;
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
    if(node&&(forceScroll||performance.now()>manualUntil)){
      try{node.scrollIntoView({block:"center",behavior:forceScroll?"auto":"smooth"})}catch(_){node.scrollIntoView()}
    }
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
    else playEl.textContent="Abspielen";
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
    mark(paragraphIndex(ratio),!!forceScroll);
    updatePlay();
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
  function activateMediaSession(){
    const c=currentContent&&Object.keys(currentContent).length?currentContent:content();
    currentContent=c;
    mediaSessionActive=true;
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
    updatePositionState();
  }
  function open(){
    const c=content();
    if(c.text!=null)setContent(c);
    root.classList.add("open");
    root.removeAttribute("aria-hidden");
    document.documentElement.classList.add("kids-follow-reader-open");
    sync(true);
    setTimeout(()=>playEl?.focus(),0);
  }
  function close(){
    persist(true);
    root.classList.remove("open");
    root.setAttribute("aria-hidden","true");
    document.documentElement.classList.remove("kids-follow-reader-open");
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
  audio.addEventListener("timeupdate",()=>{sync(false);persist(false)});
  audio.addEventListener("loadedmetadata",()=>{restore();sync(true)});
  audio.addEventListener("canplay",()=>{restore();sync(false)},{passive:true});
  audio.addEventListener("durationchange",()=>sync(false));
  audio.addEventListener("play",()=>{activateMediaSession();if(options.autoOpen!==false&&!isOpen())open();updatePlay()});
  audio.addEventListener("pause",()=>{persist(true);updatePlay()});
  audio.addEventListener("ended",()=>{const key=storyKey();if(key)safeRemove(progressStorageKey(key));sync(true)});
  audio.addEventListener("seeking",()=>sync(false));
  audio.addEventListener("seeked",()=>{sync(true);persist(true)});
  window.addEventListener("pagehide",()=>persist(true));
  document.addEventListener("visibilitychange",()=>{if(document.hidden)persist(true)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isOpen()){e.stopPropagation();close()}},true);

  setContent(content());
  return {
    open,close,isOpen,setContent,sync,persist,restore,clearProgress,
    activateMediaSession,
    formatTime,
    getSavedProgress:readProgress
  };
}
window.DARKidsFollowReader={version:2,create,formatTime,progressPrefix:PROGRESS_PREFIX,nowPlayingKey:NOW_PLAYING_KEY};
})();