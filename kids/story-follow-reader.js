(() => {
"use strict";

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
    '<section class="kfr-sheet" role="region" aria-label="Geschichte mitlesen">'+
      '<header class="kfr-head">'+
        '<div class="kfr-head-copy"><span class="kfr-kicker">MITLESEN · HÖREN</span><strong class="kfr-title"></strong></div>'+
        '<button class="kfr-close" type="button" aria-label="Mitlesen schließen">×</button>'+
      '</header>'+
      '<div class="kfr-controls">'+
        '<button class="kfr-play" type="button">Abspielen</button>'+
        '<div class="kfr-time"><span class="kfr-current">0:00</span><span class="kfr-total">0:00</span></div>'+
        '<div class="kfr-progress" aria-hidden="true"><span></span></div>'+
        '<div class="kfr-help">Der aktuelle Abschnitt folgt dem Audio automatisch. Du kannst den Text auch selbst scrollen.</div>'+
      '</div>'+
      '<div class="kfr-read" tabindex="0" aria-label="Text zum Mitlesen"></div>'+
    '</section>';
  document.body.appendChild(root);

  const titleEl=root.querySelector(".kfr-title");
  const playEl=root.querySelector(".kfr-play");
  const closeEl=root.querySelector(".kfr-close");
  const readEl=root.querySelector(".kfr-read");
  const progressEl=root.querySelector(".kfr-progress span");
  const currentEl=root.querySelector(".kfr-current");
  const totalEl=root.querySelector(".kfr-total");
  let paragraphs=[],weights=[],totalWeight=0,lastIndex=-1,manualUntil=0;

  function content(){
    const value=typeof options.getContent==="function"?options.getContent():{};
    return value&&typeof value==="object"?value:{};
  }
  function setContent(value){
    const c=value&&typeof value==="object"?value:content();
    if(titleEl)titleEl.textContent=String(c.title||"Geschichte");
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
  function updatePlay(){
    if(!playEl)return;
    playEl.disabled=typeof options.disabled==="function"?!!options.disabled():false;
    if(!audio.paused&&!audio.ended)playEl.textContent="Pause";
    else if(audio.currentTime>0&&!audio.ended)playEl.textContent="Weiter";
    else if(audio.ended)playEl.textContent="Nochmal";
    else playEl.textContent="Abspielen";
  }
  function sync(forceScroll){
    const duration=Number(audio.duration)||0,current=Number(audio.currentTime)||0;
    const ratio=duration>0?Math.max(0,Math.min(1,current/duration)):0;
    if(progressEl)progressEl.style.width=(ratio*100)+"%";
    if(currentEl)currentEl.textContent=formatTime(current);
    if(totalEl)totalEl.textContent=formatTime(duration);
    mark(paragraphIndex(ratio),!!forceScroll);
    updatePlay();
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
    root.classList.remove("open");
    root.setAttribute("aria-hidden","true");
    document.documentElement.classList.remove("kids-follow-reader-open");
  }
  function isOpen(){return root.classList.contains("open")}

  playEl.addEventListener("click",()=>{if(typeof options.toggleAudio==="function")options.toggleAudio()});
  closeEl.addEventListener("click",close);
  root.addEventListener("click",e=>{if(e.target===root)close()});
  ["pointerdown","touchstart","wheel"].forEach(type=>readEl.addEventListener(type,()=>{manualUntil=performance.now()+5000},{passive:true}));
  audio.addEventListener("timeupdate",()=>sync(false));
  audio.addEventListener("loadedmetadata",()=>sync(true));
  audio.addEventListener("durationchange",()=>sync(false));
  audio.addEventListener("play",()=>{if(options.autoOpen!==false&&!isOpen())open();updatePlay()});
  audio.addEventListener("pause",updatePlay);
  audio.addEventListener("ended",()=>sync(true));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isOpen()){e.stopPropagation();close()}},true);

  setContent(content());
  return {open,close,isOpen,setContent,sync};
}
window.DARKidsFollowReader={version:1,create};
})();