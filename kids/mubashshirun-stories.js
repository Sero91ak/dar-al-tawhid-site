(() => {
"use strict";
const DATA_URL="/kids/data/mubashshirun-stories.json";
const MODE_KEY="kids.mubashshirun.mode.v1";
const DONE_PREFIX="kids.mubashshirun.done.";
let items=[],active=null,activeText="";
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function ageKey(){return age().replace("–","-")}
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"both"}catch(_){return"both"}}
function setMode(v){try{localStorage.setItem(MODE_KEY,v)}catch(_){} renderModes(); applyMode()}
function words(t){return(String(t).match(/\S+/g)||[]).length}
function script(item){return String(item?.scripts?.[ageKey()]||item?.scripts?.["6-8"]||"").trim()}
function duration(item){
  const t=script(item);
  const w=words(t);
  return Math.max(4,Math.min(10,Math.round(w/105)))+" Min.";
}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function markDone(id){try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){} renderCards()}
function renderModes(){
  document.querySelectorAll("[data-mb-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mbMode===mode()));
}
function insertEntry(){
  const view=$("#view-stories"); if(!view||$("#mbEntry"))return;
  const entry=document.createElement("button");
  entry.id="mbEntry";entry.className="mb-entry";entry.type="button";
  entry.innerHTML=
    '<span class="mb-entry-copy">'+
      '<span class="mb-entry-kicker">ṢAḤĀBAH · AUTHENTISCH GEPRÜFT</span>'+
      '<strong>Die zehn Mubaschschirūn</strong>'+
      '<span class="mb-entry-sub">10 Gefährten · Qurʾān &amp; authentische Sunnah · lesen &amp; hören</span>'+
    '</span><span class="mb-entry-badge" aria-hidden="true">10</span>';
  const prophet=$("#psProphetEntry");
  if(prophet)prophet.insertAdjacentElement("afterend",entry);
  else{
    const head=view.querySelector(".page-head");
    if(head)head.insertAdjacentElement("afterend",entry); else view.prepend(entry);
  }
  entry.addEventListener("click",openLibrary);
}
function ensureUi(){
  if($("#mbLibraryPage"))return;
  const library=document.createElement("section");
  library.id="mbLibraryPage";library.className="mb-library-page";library.setAttribute("aria-hidden","true");
  library.innerHTML=
    '<div class="mb-library-nav">'+
      '<button class="mb-back" id="mbLibraryBack" type="button" aria-label="Zurück zu Geschichten">‹</button>'+
      '<div class="mb-nav-copy"><strong>Die zehn Mubaschschirūn</strong><span>10 geprüfte Ṣaḥābah-Geschichten</span></div>'+
    '</div>'+
    '<div class="mb-library-scroll" id="mbLibraryScroll">'+
      '<div class="mb-library-head"><small>AL-ʿAŠARAH AL-MUBAŠŠARŪN</small><h2>Die zehn Gefährten</h2><p>Die Gefährten, denen der Gesandte Allahs ﷺ das Paradies ausdrücklich ankündigte. Keine Legenden: Qurʾān, authentische Sunnah und klar gekennzeichnete Quellen.</p></div>'+
      '<div class="mb-modes">'+
        '<button class="mb-mode" data-mb-mode="both" type="button">Lesen &amp; Hören</button>'+
        '<button class="mb-mode" data-mb-mode="listen" type="button">Hören</button>'+
        '<button class="mb-mode" data-mb-mode="read" type="button">Lesen</button>'+
      '</div>'+
      '<div class="mb-list" id="mbList"></div>'+
    '</div>';
  document.body.appendChild(library);
  $("#mbLibraryBack").addEventListener("click",closeLibrary);
  library.querySelectorAll("[data-mb-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mbMode)));

  const modal=document.createElement("div");
  modal.id="mbModal";modal.className="mb-modal";modal.setAttribute("aria-hidden","true");
  modal.innerHTML=
    '<div class="mb-sheet" role="dialog" aria-modal="true" aria-labelledby="mbTitle">'+
      '<div class="mb-detail-nav"><button class="mb-close" id="mbClose" type="button" aria-label="Zurück">‹</button><div class="mb-detail-nav-copy"><strong id="mbNavName"></strong><span>Ṣaḥābī · رضي الله عنه</span></div></div>'+
      '<div class="mb-scroll" id="mbScroll">'+
        '<div class="mb-hero"><div class="mb-hero-inner">'+
          '<div class="mb-hero-kicker">AUTHENTISCHE ṢAḤĀBAH-GESCHICHTE</div>'+
          '<h2 class="mb-title" id="mbTitle"></h2>'+
          '<div class="mb-ar" id="mbArabic" dir="rtl"></div>'+
          '<p class="mb-summary" id="mbSummary"></p>'+
          '<div class="mb-pills" id="mbPills"></div>'+
        '</div></div>'+
        '<div class="mb-body">'+
          '<div class="mb-player" id="mbPlayer"><button class="mb-play" id="mbPlay" type="button">Hören</button><div class="mb-player-note" id="mbPlayerNote"></div></div>'+
          '<article class="mb-read" id="mbRead"></article>'+
          '<div class="mb-sources"><strong>QUELLEN</strong><div id="mbSources"></div></div>'+
          '<div class="mb-question" id="mbQuestion"></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
  $("#mbClose").addEventListener("click",closeStory);
  $("#mbPlay").addEventListener("click",toggleAudio);
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    if($("#mbModal")?.classList.contains("open"))closeStory();
    else if($("#mbLibraryPage")?.classList.contains("open"))closeLibrary();
  });
  audio.preload="metadata";
  audio.addEventListener("ended",()=>{if(active)markDone(active.id);$("#mbPlay").textContent="Noch einmal hören"});
}
function renderCards(){
  const list=$("#mbList");if(!list)return;
  list.innerHTML=items.map((item,index)=>
    '<button class="mb-card" type="button" data-mb-id="'+esc(item.id)+'">'+
      '<span class="mb-card-num">'+String(index+1).padStart(2,"0")+'</span>'+
      '<span><span class="mb-card-meta">PARADIES ANGEKÜNDIGT · '+esc(duration(item))+'</span>'+
      '<span class="mb-card-title">'+esc(item.name)+'</span>'+
      '<span class="mb-card-ar" dir="rtl">'+esc(item.nameAr||"")+' رضي الله عنه</span>'+
      '<span class="mb-card-sub">'+esc(item.summary||"")+'</span></span>'+
      '<span class="mb-card-go" aria-hidden="true">'+(done(item.id)?"✓":"›")+'</span>'+
    '</button>'
  ).join("");
  list.querySelectorAll("[data-mb-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.mbId)));
  renderModes();
}
function openLibrary(){
  ensureUi();
  const page=$("#mbLibraryPage"); if(!page)return;
  page.classList.add("open"); page.removeAttribute("aria-hidden");
  document.documentElement.classList.add("mb-library-open");
  const app=$(".app"); if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
  $("#mbLibraryScroll").scrollTop=0;
  renderCards();
  setTimeout(()=>$("#mbLibraryBack")?.focus(),0);
}
function closeLibrary(){
  if($("#mbModal")?.classList.contains("open"))return;
  const page=$("#mbLibraryPage");if(!page)return;
  page.classList.remove("open");page.setAttribute("aria-hidden","true");
  document.documentElement.classList.remove("mb-library-open");
  const app=$(".app");if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
  setTimeout(()=>$("#mbEntry")?.focus(),0);
}
function openStory(id){
  active=items.find(x=>x.id===id);if(!active)return;
  activeText=script(active);
  $("#mbTitle").textContent=active.name;
  $("#mbNavName").textContent=active.name;
  $("#mbArabic").textContent=(active.nameAr||"")+" رضي الله عنه";
  $("#mbSummary").textContent=active.summary||"";
  $("#mbPills").innerHTML='<span class="mb-pill">'+esc(duration(active))+'</span><span class="mb-pill">Alter '+esc(age())+'</span><span class="mb-pill">Qurʾān &amp; Sunnah geprüft</span>';
  $("#mbRead").innerHTML=activeText.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#mbSources").textContent=(active.sourceRefs||[]).join(" · ");
  renderQuestion();
  resetAudio();
  applyMode();
  const modal=$("#mbModal");modal.classList.add("open");modal.removeAttribute("aria-hidden");
  $("#mbScroll").scrollTop=0;
  setTimeout(()=>$("#mbClose")?.focus(),0);
}
function closeStory(){
  audio.pause();audio.removeAttribute("src");
  const modal=$("#mbModal");if(!modal)return;
  modal.classList.remove("open");modal.setAttribute("aria-hidden","true");
  setTimeout(()=>document.querySelector('[data-mb-id="'+CSS.escape(active?.id||"")+'"]')?.focus(),0);
}
function renderQuestion(){
  const q=$("#mbQuestion");if(!q||!active)return;
  q.innerHTML='<h4>'+esc(active.question||"Was hast du gelernt?")+'</h4>'+
    (active.answers||[]).map((a,i)=>'<button class="mb-answer" type="button" data-a="'+i+'">'+esc(a)+'</button>').join("");
  q.querySelectorAll("[data-a]").forEach(b=>b.addEventListener("click",()=>{
    q.querySelectorAll(".mb-answer").forEach(x=>x.disabled=true);
    const ok=Number(b.dataset.a)===Number(active.correct||0);
    b.classList.add(ok?"correct":"wrong");
    if(!ok)q.querySelector('[data-a="'+Number(active.correct||0)+'"]')?.classList.add("correct");
    if(ok)markDone(active.id);
  }));
}
function resetAudio(){
  audio.pause();audio.removeAttribute("src");
  const meta=active?.audio?.[ageKey()]||{};
  const btn=$("#mbPlay"),note=$("#mbPlayerNote");
  const url=String(meta.url||"").trim();
  if(url){
    btn.disabled=false;btn.textContent="Hören";
    note.textContent="Serhat-Audio für Alter "+age()+" · nach Ausspracheprüfung freigegeben.";
    audio.src=url;
  }else{
    btn.disabled=true;btn.textContent="Audio wird vorbereitet";
    note.textContent="Der Erzähltext ist vollständig für die Voice App vorbereitet. Audio erscheint hier erst nach Serhat-Erzeugung und Ausspracheprüfung.";
  }
}
function toggleAudio(){
  if(!active||!audio.src)return;
  if(audio.paused){audio.play().catch(()=>{});$("#mbPlay").textContent="Pause"}
  else{audio.pause();$("#mbPlay").textContent="Weiterhören"}
}
function applyMode(){
  const m=mode();renderModes();
  const read=$("#mbRead"),player=$("#mbPlayer");
  if(read)read.hidden=m==="listen";
  if(player)player.hidden=m==="read";
}
async function load(){
  try{
    const r=await fetch(DATA_URL+"?v=1",{cache:"no-store"});
    if(!r.ok)throw new Error("data "+r.status);
    const d=await r.json();
    items=Array.isArray(d.items)?d.items.slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99)):[];
    if(items.length!==10)throw new Error("expected 10 items");
    ensureUi();insertEntry();renderCards();
  }catch(e){console.warn("[DĀR Kids] Mubashshirun stories",e)}
}
function start(){
  let tries=0;
  const tick=()=>{
    tries++;
    if($("#view-stories")){load();return}
    if(tries<80)setTimeout(tick,100);
  };
  tick();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();