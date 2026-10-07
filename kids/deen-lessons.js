(() => {
"use strict";
const DATA_URL="/kids/data/deen-lessons.json?v=3";
const MODE_KEY="kids.contentMode.v19";
const DONE_PREFIX="kids.deenLesson.done.";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const age=()=>String($(".app")?.getAttribute("data-age")||"6–8");
const ageKey=()=>age().replace("–","-");
const isAudioOnlyAge=()=>age()==="4–5";
const audio=new Audio();
let items=[],active=null,activeText="",playing=false,busy=false,followReader=null;

function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"read"}catch(_){return"read"}}
function audioMeta(item){
  const a=item&&item.audio&&typeof item.audio==="object"?item.audio:{};
  return a[ageKey()]||a["4-10"]||a.master||null;
}
function textFor(item){
  const policy=window.DARKidsStoryPolicy;
  if(policy?.canonicalText)return String(policy.canonicalText(item)||"").trim();
  return String(item?.masterStoryText||item?.scripts?.[ageKey()]||"").trim();
}
function art(item,kind="cover"){return String(item?.[kind]||item?.cover||"").trim()}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function markDone(id){try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){}renderCards()}
function stopOtherPlayers(){
  try{window.DARKidsProphetStories?.stop?.()}catch(_){}
  try{window.DARKidsMubashshirun?.stop?.()}catch(_){}
  try{window.DARKidsSahabiyyat?.stop?.()}catch(_){}
  try{window.DARKidsStoryHub?.stop?.()}catch(_){}
}
function installSwipeBack(el,onBack){
  if(!el||el.dataset.swipeBackReady==="1")return;
  el.dataset.swipeBackReady="1";el.style.touchAction="pan-y";
  let sx=0,sy=0,lx=0,st=0,tracking=false,claimed=false;
  const reset=()=>{tracking=claimed=false;sx=sy=lx=st=0};
  el.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    const edge=Math.max(34,Math.min(56,window.innerWidth*.11));
    if(e.clientX>edge)return;
    sx=lx=e.clientX;sy=e.clientY;st=performance.now();tracking=true;
  },{passive:true});
  el.addEventListener("pointermove",e=>{
    if(!tracking)return;const dx=e.clientX-sx,dy=Math.abs(e.clientY-sy);lx=e.clientX;
    if(!claimed&&dx>12&&dx>dy*1.25)claimed=true;if(claimed&&dx<0)reset();
  },{passive:true});
  const finish=e=>{
    if(!tracking)return;
    const dx=(e.clientX??lx)-sx,dy=Math.abs((e.clientY??sy)-sy),dt=Math.max(1,performance.now()-st),vx=dx/dt;
    const go=claimed&&dx>Math.min(110,window.innerWidth*.22)&&dx>dy*1.35&&(vx>.18||dx>150);reset();
    if(go)onBack();
  };
  el.addEventListener("pointerup",finish,{passive:true});el.addEventListener("pointercancel",reset,{passive:true});
}
function sourceHtml(item){
  return (Array.isArray(item?.sourceRefs)?item.sourceRefs:[]).map(ref=>'<span class="ms-source-ref">'+esc(ref)+'</span>').join("");
}
function renderCards(){
  const grid=$("#dlGrid");if(!grid)return;
  grid.innerHTML=items.map((item,index)=>{
    const src=art(item);
    return '<button class="ms-story-row dl-story-row" type="button" data-dl-id="'+esc(item.id)+'">'+
      '<span class="ms-row-visual" aria-hidden="true">'+(src?'<img src="'+esc(src)+'" alt="" decoding="async" loading="'+(index<3?"eager":"lazy")+'">':'')+
      '<span class="ms-rank">'+String(index+1).padStart(2,"0")+'</span></span>'+
      '<span class="ms-row-copy"><span class="ms-row-kicker">LERNBEREICH '+String(index+1).padStart(2,"0")+'</span>'+
      '<strong class="ms-row-title">'+esc(item.categoryTitle||item.series||item.title||"")+'</strong>'+
      '<span class="dl-row-lesson">'+esc(item.categoryLessonLabel||item.title||"")+'</span>'+
      '<span class="ms-row-summary">'+esc(item.categorySummary||item.summary||"")+'</span></span>'+
      (done(item.id)?'<span class="ms-done" aria-label="Abgeschlossen">✓</span>':'')+
    '</button>';
  }).join("");
  grid.querySelectorAll("[data-dl-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.dlId)));
}
function effectiveMode(){
  const m=mode();
  const has=!!audioMeta(active)?.url;
  return !has&&(m==="listen"||m==="both")?"read":m;
}
function renderModeButtons(){
  const m=effectiveMode(),has=!!audioMeta(active)?.url;
  document.querySelectorAll("[data-dl-mode]").forEach(b=>{
    const kind=b.dataset.dlMode;
    b.hidden=false;
    b.classList.toggle("active",kind===m);
    b.disabled=!!active&&((kind==="listen"||kind==="both")&&!has);
  });
}
function applyMode(interactive=false){
  const m=effectiveMode();
  const read=$("#dlRead");
  if(read)read.hidden=(m==="listen");
  renderModeButtons();
  if(!active||!interactive)return;
  if(m==="both"){
    followReader?.openReadAlong?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
  }else if(m==="listen"){
    followReader?.openListening?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
  }else{
    if(!audio.paused)audio.pause();
    followReader?.close?.();
    if(read)read.hidden=false;
  }
}
function setMode(v){
  if(!["both","listen","read"].includes(v))return;
  const has=!!audioMeta(active)?.url;
  if((v==="listen"||v==="both")&&!has)return;
  try{localStorage.setItem(MODE_KEY,v)}catch(_){}
  applyMode(true);
}
function ensureUi(){
  const entry=$("#deenEntry");
  if(entry&&!entry.dataset.dlBound){entry.dataset.dlBound="1";entry.addEventListener("click",openLibrary)}
  if($("#dlLibraryPage"))return true;
  const page=document.createElement("section");
  page.id="dlLibraryPage";page.className="ms-library-page dl-library-page";page.setAttribute("aria-hidden","true");
  page.innerHTML=
    '<div class="ms-library-nav dl-library-nav"><button id="dlBack" class="ms-back" type="button" aria-label="Zurück zu Geschichten">‹</button>'+
    '<div><strong>Den Dīn lernen</strong><span>6 Lernbereiche · Qurʾān &amp; authentische Sunnah</span></div></div>'+
    '<div class="ms-library-scroll" id="dlLibraryScroll"><div id="dlGrid" class="ms-list dl-list"></div></div>';
  document.body.appendChild(page);
  $("#dlBack").addEventListener("click",closeLibrary);installSwipeBack($("#dlLibraryScroll"),closeLibrary);

  const modal=document.createElement("div");
  modal.id="dlModal";modal.className="ms-modal dl-modal";
  modal.innerHTML=
    '<div class="ms-sheet" role="dialog" aria-modal="true" aria-labelledby="dlTitle">'+
      '<button id="dlClose" class="ms-close" type="button" aria-label="Zurück">‹</button>'+
      '<div class="ms-scroll" id="dlScroll">'+
        '<header class="ms-detail-hero dl-detail-hero"><img id="dlHero" class="ms-detail-image" src="" alt="" decoding="async">'+
          '<span class="ms-detail-shade" aria-hidden="true"></span><div class="ms-detail-copy">'+
            '<div class="ms-detail-kicker">DĪN-LEKTION</div><h2 id="dlTitle"></h2><p id="dlSummary"></p>'+
            '<div class="ms-meta"><span>Qurʾān &amp; authentische Sunnah</span></div>'+
          '</div></header>'+
        '<div class="ms-body dl-body">'+
          '<div class="ms-detail-modes dl-detail-modes"><button data-dl-mode="both" type="button">Hören &amp; Mitlesen</button><button data-dl-mode="listen" type="button">Hören</button><button data-dl-mode="read" type="button">Lesen</button></div>'+
          '<p id="dlAudioNote" class="dl-audio-note"></p>'+
          '<article id="dlRead" class="ms-read" hidden></article>'+
          '<section class="ms-sources dl-sources"><strong>QUELLEN &amp; NACHWEISE</strong><div id="dlSources"></div></section>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
  $("#dlClose").addEventListener("click",closeStory);installSwipeBack($("#dlScroll"),closeStory);
  modal.querySelectorAll("[data-dl-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.dlMode)));
  audio.preload="metadata";
  audio.addEventListener("play",()=>{playing=true});
  audio.addEventListener("pause",()=>{playing=false});
  audio.addEventListener("ended",()=>{playing=false;if(active)markDone(active.id)});
  followReader=window.DARKidsFollowReader?.create({
    id:"deen-lesson",audio,
    getContent:()=>{
      const meta=audioMeta(active)||{};
      return{
        key:active?("deen:"+active.id+":"+ageKey()):"deen:lesson",
        title:active?(active.title||active.name):"Den Dīn lernen",
        subtitle:"Dīn-Lektion",
        album:"DĀR AL TAWḤĪD Kids · Den Dīn lernen",
        text:activeText,
        artwork:active?art(active,"hero"):"",
        deepLink:active?("#stories/deen/"+encodeURIComponent(active.id)):"#stories",
        audioOnly:isAudioOnlyAge(),
        timings:meta.timings||meta.paragraphTimings||meta.cues||[],
        syncPoints:meta.syncPoints||meta.syncAnchors||[]
      };
    },
    toggleAudio,autoOpen:false,disabled:()=>!audioMeta(active)?.url
  })||null;
  return true;
}
function openLibrary(){
  if(!$("#dlLibraryPage"))return;
  stopOtherPlayers();
  $("#dlLibraryPage").classList.add("open");$("#dlLibraryPage").removeAttribute("aria-hidden");
  document.documentElement.classList.add("ms-library-open");
  const app=$(".app");if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
  $("#dlLibraryScroll").scrollTop=0;renderCards();renderModeButtons();setTimeout(()=>$("#dlBack")?.focus(),0);
}
function closeLibrary(){
  if($("#dlModal")?.classList.contains("open"))return;
  const p=$("#dlLibraryPage");if(!p)return;
  p.classList.remove("open");p.setAttribute("aria-hidden","true");document.documentElement.classList.remove("ms-library-open");
  const app=$(".app");if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
  setTimeout(()=>$("#deenEntry")?.focus(),0);
}
function lockLibrary(){
  const p=$("#dlLibraryPage");if(p){p.setAttribute("inert","");p.setAttribute("aria-hidden","true")}
  document.documentElement.classList.add("ms-modal-open");
}
function unlockLibrary(){
  const p=$("#dlLibraryPage");if(p?.classList.contains("open")){p.removeAttribute("inert");p.removeAttribute("aria-hidden")}
  document.documentElement.classList.remove("ms-modal-open");
}
function openStory(id){
  active=items.find(x=>x.id===id)||null;if(!active)return;
  stopAudio();renderActive();$("#dlModal").classList.add("open");lockLibrary();$("#dlScroll").scrollTop=0;$("#dlClose").focus();
}
function closeStory(){
  followReader?.close?.();stopAudio();$("#dlModal")?.classList.remove("open");unlockLibrary();active=null;
}
function renderActive(){
  if(!active)return;
  activeText=textFor(active);
  const hero=$("#dlHero");if(hero){hero.src=art(active,"hero");hero.onerror=()=>{hero.onerror=null;hero.src=art(active)}}
  $("#dlTitle").textContent=active.title||active.name||"";
  $("#dlSummary").textContent=active.summary||"";
  $("#dlRead").innerHTML=activeText.split(/\n{2,}/).map(p=>'<p>'+esc(p)+'</p>').join("");
  $("#dlSources").innerHTML=sourceHtml(active);
  const has=!!audioMeta(active)?.url,note=$("#dlAudioNote");
  if(note)note.textContent=has
    ?"Hören, Hören & Mitlesen und Lesen sind bereit."
    :"Der vollständige Lesetext ist bereit. Hören und intelligentes Mitlesen werden aktiv, sobald die freigegebene Aufnahme hinterlegt ist.";
  resetAudio();applyMode(false);
}
function resetAudio(){
  stopAudio();
  const meta=audioMeta(active);
  if(meta?.url){audio.src=meta.url;audio.preload="metadata"}else audio.removeAttribute("src");
}
async function toggleAudio(){
  if(!active||busy)return;const meta=audioMeta(active);if(!meta?.url)return;
  if(playing){audio.pause();return}
  try{busy=true;if(!audio.src)audio.src=meta.url;if(audio.ended)audio.currentTime=0;followReader?.restore?.();await audio.play()}catch(_){}finally{busy=false}
}
function stopAudio(){
  followReader?.persist?.(true);try{audio.pause();audio.removeAttribute("src");audio.load()}catch(_){}playing=false;busy=false;
}
async function init(){
  if(!ensureUi())return;
  try{
    const r=await fetch(DATA_URL,{cache:"no-store"});if(!r.ok)throw Error(String(r.status));
    const data=await r.json();items=(data.items||[]).slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
    renderCards();
    try{
      const m=String(location.hash||"").match(/^#stories\/deen\/([^/?#]+)/i),id=m?decodeURIComponent(m[1]||""):"";
      if(id&&items.some(x=>x.id===id)){document.querySelector('.nav-btn[data-target="stories"]')?.click();openLibrary();setTimeout(()=>openStory(id),0)}
    }catch(_){}
    const app=$(".app");if(app&&"MutationObserver" in window)new MutationObserver(()=>{renderCards();if(active)renderActive()}).observe(app,{attributes:true,attributeFilter:["data-age"]});
  }catch(err){
    console.warn("[DĀR Kids Dīn]",err);const g=$("#dlGrid");if(g)g.innerHTML='<div class="ms-load-error">Die Dīn-Lektionen konnten gerade nicht geladen werden.</div>';
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
window.DARKidsDeenLessons={open:openStory,openLibrary,closeLibrary,stop:stopAudio};
})();