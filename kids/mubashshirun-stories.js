(() => {
"use strict";

const DATA_URL="/kids/data/mubashshirun-stories.json";
const MODE_KEY="kids.contentMode.v19";
const DONE_PREFIX="kids.mubashshirunStory.done.";
let items=[],libraryPolicy={},active=null,activeText="",playing=false,busy=false;
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const age=()=>String($(".app")?.getAttribute("data-age")||"6–8");
const ageKey=()=>age().replace("–","-");
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"read"}catch(_){return"read"}}
function setMode(v){try{localStorage.setItem(MODE_KEY,v)}catch(_){}renderModeButtons();applyMode()}
function textFor(item){const k=ageKey(),s=item?.scripts||{};return String(s[k]||s["6-8"]||"").trim()}
function words(t){return(String(t).match(/\S+/g)||[]).length}
function durationLabel(item,t){
  const target=item?.durationTargets?.[ageKey()];
  if(target)return "ca. "+target;
  const w=words(t),wpm=age()==="4–5"?78:(age()==="9–10"?92:86);
  return "ca. "+Math.max(4,Math.min(10,Math.round(w/wpm)))+" Min.";
}
function audioMeta(item){return item?.audio?.[ageKey()]||null}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function markDone(id){try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){}renderCards()}
function doneCount(){return items.reduce((n,x)=>n+(done(x.id)?1:0),0)}
function art(item,kind="cover"){return String(item?.[kind]||item?.cover||"").trim()}
function installSwipeBack(el,onBack){
  if(!el||el.dataset.swipeBackReady==="1")return;
  el.dataset.swipeBackReady="1";
  el.style.touchAction="pan-y";
  let startX=0,startY=0,lastX=0,startT=0,tracking=false,claimed=false;
  const reset=()=>{tracking=false;claimed=false;startX=startY=lastX=startT=0};
  el.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    const edge=Math.max(34,Math.min(56,window.innerWidth*.11));
    if(e.clientX>edge)return;
    startX=lastX=e.clientX;startY=e.clientY;startT=performance.now();tracking=true;claimed=false;
  },{passive:true});
  el.addEventListener("pointermove",e=>{
    if(!tracking)return;
    const dx=e.clientX-startX,dy=Math.abs(e.clientY-startY);
    lastX=e.clientX;
    if(!claimed&&dx>12&&dx>dy*1.25)claimed=true;
    if(claimed&&dx<0)reset();
  },{passive:true});
  const finish=e=>{
    if(!tracking)return;
    const dx=(e.clientX??lastX)-startX,dy=Math.abs((e.clientY??startY)-startY);
    const dt=Math.max(1,performance.now()-startT),vx=dx/dt;
    const shouldBack=claimed&&dx>Math.min(110,window.innerWidth*.22)&&dx>dy*1.35&&(vx>.18||dx>150);
    reset();
    if(shouldBack){
      try{navigator.vibrate?.(10)}catch(_){}
      onBack();
    }
  };
  el.addEventListener("pointerup",finish,{passive:true});
  el.addEventListener("pointercancel",reset,{passive:true});
}
function renderModeButtons(){
  const m=mode();
  document.querySelectorAll("[data-ms-mode]").forEach(b=>b.classList.toggle("active",b.dataset.msMode===m));
}
function sourceHtml(item){
  const refs=Array.isArray(item?.sourceRefs)?item.sourceRefs:[];
  const links=Array.isArray(item?.sourceLinks)?item.sourceLinks:[];
  const story=refs.map(ref=>{
    const hit=links.find(x=>String(x.label||"")===String(ref));
    return hit?.url
      ? '<a class="ms-source-link" href="'+esc(hit.url)+'" target="_blank" rel="noopener">'+esc(ref)+'</a>'
      : '<span class="ms-source-ref">'+esc(ref)+'</span>';
  }).join("");
  const visualRefs=Array.isArray(item?.visualSourceRefs)?item.visualSourceRefs:[];
  const clothing=Array.isArray(libraryPolicy?.visualEvidence?.clothingBasis)?libraryPolicy.visualEvidence.clothingBasis:[];
  const visual=visualRefs.map(ref=>{
    const hit=clothing.find(x=>String(x.ref||"")===String(ref));
    return hit?.url
      ? '<a class="ms-source-link visual" href="'+esc(hit.url)+'" target="_blank" rel="noopener">'+esc(ref)+' · Bildgrundlage</a>'
      : '<span class="ms-source-ref visual">'+esc(ref)+' · Bildgrundlage</span>';
  }).join("");
  return story+(visual?'<div class="ms-visual-source-group"><small>ALLGEMEINE KLEIDUNGSBELEGE · KEIN INDIVIDUELLER PORTRÄTBEWEIS</small>'+visual+'</div>':'');
}
function renderCards(){
  const grid=$("#msGrid");if(!grid)return;
  grid.innerHTML=items.map((item,index)=>{
    const t=textFor(item),src=art(item);
    return '<button class="ms-story-row" type="button" data-ms-id="'+esc(item.id)+'">'+
      '<span class="ms-row-visual" aria-hidden="true">'+
        (src?'<img src="'+esc(src)+'" alt="" decoding="async" loading="'+(index<4?"eager":"lazy")+'">':'')+
        '<span class="ms-rank">'+String(index+1).padStart(2,"0")+'</span>'+
      '</span>'+
      '<span class="ms-row-copy">'+
        '<span class="ms-row-kicker">ṢAḤĀBĪ · GEPRÜFTE QUELLEN</span>'+
        '<strong class="ms-row-title">'+esc(item.name)+'</strong>'+
        '<span class="ms-row-ar" dir="rtl">'+esc(item.nameAr||"")+' رضي الله عنه</span>'+
        '<span class="ms-row-summary">'+esc(item.summary||"")+'</span>'+
        '<span class="ms-row-meta">'+durationLabel(item,t)+' · Alter '+esc(age())+'</span>'+
      '</span>'+
      '<span class="ms-row-go" aria-hidden="true">›</span>'+
      (done(item.id)?'<span class="ms-done" aria-label="Abgeschlossen">✓</span>':'')+
    '</button>';
  }).join("");
  grid.querySelectorAll("[data-ms-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.msId)));
  const dc=$("#msDoneCount");if(dc)dc.textContent=String(doneCount());
  const ag=$("#msAge");if(ag)ag.textContent="Alter "+age();
}
function insertEntry(view){
  if($("#msEntry"))return;
  const entry=document.createElement("button");
  entry.id="msEntry"; entry.className="ms-entry"; entry.type="button";
  entry.innerHTML=
    '<span class="ms-entry-art" aria-hidden="true"><span class="ms-entry-arch"></span><span class="ms-entry-stars">'+
    Array.from({length:10},(_,i)=>'<i style="--i:'+i+'"></i>').join("")+
    '</span></span>'+
    '<span class="ms-entry-copy">'+
      '<span class="ms-entry-kicker">EIGENER BEREICH · SUNNAH GEPRÜFT</span>'+
      '<strong>Die zehn Mubaschschirūn</strong>'+
      '<span>10 Ṣaḥābah · ihre Geschichten · lesen &amp; hören</span>'+
    '</span>'+
    '<span class="ms-entry-action">Entdecken <b aria-hidden="true">›</b></span>';
  const prophet=$("#psProphetEntry");
  if(prophet)prophet.insertAdjacentElement("afterend",entry);
  else view.querySelector(".page-head")?.insertAdjacentElement("afterend",entry);
  entry.addEventListener("click",openLibrary);
}
function ensureUi(){
  const view=$("#view-stories");if(!view||$("#msLibraryPage"))return false;
  insertEntry(view);

  const page=document.createElement("section");
  page.id="msLibraryPage"; page.className="ms-library-page"; page.setAttribute("aria-hidden","true");
  page.innerHTML=
    '<div class="ms-library-nav">'+
      '<button id="msBack" class="ms-back" type="button" aria-label="Zurück zu Geschichten">‹</button>'+
      '<div><strong>Die zehn Mubaschschirūn</strong><span>al-ʿAšarah al-Mubaššarūn · 10 Gefährten</span></div>'+
    '</div>'+
    '<div class="ms-library-scroll" id="msLibraryScroll">'+
      '<header class="ms-library-hero">'+
        '<div class="ms-library-kicker">QURʾĀN · AUTHENTISCHE SUNNAH · ṢAḤĀBAH</div>'+
        '<h2>Die zehn Gefährten,<br>denen das Paradies angekündigt wurde</h2>'+

        '<div class="ms-library-stats"><span><b id="msDoneCount">0</b>/10 geschafft</span><span id="msAge">Alter 6–8</span></div>'+
      '</header>'+

      '<div class="ms-method-note"><strong>Unsere Quellenregel</strong><span>Keine erfundenen Gespräche, keine ausgeschmückten Heldensagen. Wir erzählen nur, was Qurʾān, authentische Sunnah und sichere frühe Berichte tragen.</span></div>'+
      '<div id="msGrid" class="ms-list"></div>'+
    '</div>';
  document.body.appendChild(page);
  $("#msBack").addEventListener("click",closeLibrary);
  installSwipeBack($("#msLibraryScroll"),closeLibrary);
  page.querySelectorAll("[data-ms-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.msMode)));

  const modal=document.createElement("div");
  modal.id="msModal"; modal.className="ms-modal";
  modal.innerHTML=
    '<div class="ms-sheet" role="dialog" aria-modal="true" aria-labelledby="msTitle">'+
      '<button id="msClose" class="ms-close" type="button" aria-label="Zurück">‹</button>'+
      '<div class="ms-scroll" id="msScroll">'+
        '<header class="ms-detail-hero" id="msDetailHero">'+
          '<img id="msHero" class="ms-detail-image" src="" alt="" decoding="async">'+
          '<span class="ms-detail-shade" aria-hidden="true"></span>'+
          '<div class="ms-detail-copy">'+
            '<div class="ms-detail-kicker">ṢAḤĀBĪ · AL-ʿAŠARAH AL-MUBAŠŠARŪN</div>'+
            '<h2 id="msTitle"></h2><div id="msArabic" class="ms-ar" dir="rtl"></div>'+
            '<p id="msSummary"></p><div id="msMeta" class="ms-meta"></div>'+
          '</div>'+
        '</header>'+
        '<div class="ms-body">'+
          '<div id="msVisualDisclaimer" class="ms-visual-disclaimer"></div>'+
          '<div class="ms-detail-modes"><button data-ms-mode="both" type="button">Lesen &amp; Hören</button><button data-ms-mode="listen" type="button">Hören</button><button data-ms-mode="read" type="button">Lesen</button></div>'+
          '<div class="ms-profile-grid"><section><small>WIE WAR ER?</small><strong id="msTrait"></strong></section><section><small>SEINE AUFGABE &amp; ZEIT</small><span id="msLife"></span></section><section><small>WER BERICHTET?</small><span id="msWitness"></span></section></div>'+
          '<section id="msPlayer" class="ms-player"><button id="msPlay" class="ms-play" type="button">Hören</button><div class="ms-progress"><span id="msProgress"></span></div><p id="msVoiceNote"></p></section>'+
          '<article id="msRead" class="ms-read"></article>'+
          '<section class="ms-sources"><strong>GEPRÜFTE QUELLEN</strong><div id="msSources"></div></section>'+
          '<section id="msQuestion" class="ms-question"></section>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
  $("#msClose").addEventListener("click",closeStory);
  installSwipeBack($("#msScroll"),closeStory);
  $("#msPlay").addEventListener("click",toggleAudio);
  modal.querySelectorAll("[data-ms-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.msMode)));
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("ended",()=>{playing=false;updatePlayButton();markDone(active?.id||"")});
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    if($("#msModal")?.classList.contains("open"))closeStory();
    else if($("#msLibraryPage")?.classList.contains("open"))closeLibrary();
  });
  return true;
}
function openLibrary(){
  const p=$("#msLibraryPage");if(!p)return;
  p.classList.add("open");p.removeAttribute("aria-hidden");
  document.documentElement.classList.add("ms-library-open");
  const app=$(".app");if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
  $("#msLibraryScroll").scrollTop=0;renderCards();renderModeButtons();
}
function closeLibrary(){
  if($("#msModal")?.classList.contains("open"))return;
  const p=$("#msLibraryPage");if(!p)return;
  p.classList.remove("open");p.setAttribute("aria-hidden","true");
  document.documentElement.classList.remove("ms-library-open");
  const app=$(".app");if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
  setTimeout(()=>$("#msEntry")?.focus(),0);
}
function lockLibrary(){
  const p=$("#msLibraryPage");if(p){p.setAttribute("inert","");p.setAttribute("aria-hidden","true")}
  document.documentElement.classList.add("ms-modal-open");
}
function unlockLibrary(){
  const p=$("#msLibraryPage");if(p?.classList.contains("open")){p.removeAttribute("inert");p.removeAttribute("aria-hidden")}
  document.documentElement.classList.remove("ms-modal-open");
}
function openStory(id){
  active=items.find(x=>x.id===id);if(!active)return;
  stopAudio();renderActive();
  $("#msModal").classList.add("open");lockLibrary();$("#msScroll").scrollTop=0;$("#msClose").focus();
}
function closeStory(){stopAudio();$("#msModal")?.classList.remove("open");unlockLibrary();active=null}
function renderActive(){
  if(!active)return;
  activeText=textFor(active);
  const hero=$("#msHero");if(hero){hero.src=art(active,"hero");hero.onerror=()=>{hero.onerror=null;hero.src=art(active,"cover")}}
  $("#msTitle").textContent=active.name;
  $("#msArabic").textContent=(active.nameAr||"")+" رضي الله عنه";
  $("#msSummary").textContent=active.summary||"";
  $("#msMeta").innerHTML='<span>'+durationLabel(active,activeText)+'</span><span>Alter '+esc(age())+'</span><span>Qurʾān + Sunnah</span>';
  {
    const vd=$("#msVisualDisclaimer");
    if(vd){
      if(age()==="4–5")vd.textContent="Das Bild ist nur eine Lernszene. Wir wissen nicht genau, wie dieser Ṣaḥābī aussah oder welche Kleidung er genau trug.";
      else if(age()==="6–8")vd.textContent="Historische Lernszene: Aussehen und persönliche Kleidung des Ṣaḥābī werden nicht als sicher behauptet.";
      else vd.textContent=[active.visualDisclaimer||"Szenische historische Illustration; kein Anspruch auf das tatsächliche Aussehen des Ṣaḥābī.",active.visualBasis||""].filter(Boolean).join(" ");
    }
  }
  $("#msTrait").textContent=active.trait||"";
  $("#msLife").textContent=active.lifeContext||active.summary||"";
  $("#msWitness").textContent=active.witnessContext||"Die verwendeten Belege stehen direkt unter der Geschichte.";
  $("#msRead").innerHTML=activeText.split(/\n{2,}/).map(p=>'<p>'+esc(p)+'</p>').join("");
  $("#msSources").innerHTML=sourceHtml(active);
  renderQuestion();applyMode();resetAudio();
}
function renderQuestion(){
  const q=$("#msQuestion");if(!q||!active)return;
  q.innerHTML='<div class="ms-q-kicker">HAST DU GUT AUFGEPASST?</div><h3>'+esc(active.question||"")+'</h3>'+
    (active.answers||[]).map((a,i)=>'<button type="button" data-ms-answer="'+i+'">'+esc(a)+'</button>').join("")+
    '<p id="msFeedback" class="ms-feedback"></p>';
  q.querySelectorAll("[data-ms-answer]").forEach(b=>b.addEventListener("click",()=>{
    const good=Number(b.dataset.msAnswer)===Number(active.correct||0);
    b.classList.add(good?"good":"bad");
    $("#msFeedback").textContent=good?"Richtig. Gut aufgepasst.":"Lies oder hör die Geschichte noch einmal in Ruhe.";
    if(good)markDone(active.id);
    else setTimeout(()=>b.classList.remove("bad"),900);
  }));
}
function applyMode(){
  const m=mode();renderModeButtons();
  if($("#msRead"))$("#msRead").hidden=m==="listen";
  if($("#msPlayer"))$("#msPlayer").hidden=m==="read";
}
function resetAudio(){
  stopAudio();
  const meta=audioMeta(active),note=$("#msVoiceNote");
  if(meta?.url){
    audio.src=meta.url; audio.preload="metadata";
    if(note)note.textContent="Serhat-Stimme · geprüfte Fuṣḥā-Aussprache";
  }else{
    audio.removeAttribute("src");
    if(note)note.textContent="Der Lesetext ist vollständig. Serhat-Audio wird erst nach der Ausspracheprüfung im Voice Studio freigeschaltet.";
  }
  $("#msProgress").style.width="0";updatePlayButton();
}
function updatePlayButton(){
  const b=$("#msPlay");if(!b)return;
  const meta=audioMeta(active);
  b.disabled=busy||!meta?.url;
  b.textContent=playing?"Pause":(audio.currentTime>0&&!audio.ended?"Weiterhören":"Hören");
}
function updateProgress(){
  if($("#msProgress"))$("#msProgress").style.width=(audio.duration?Math.min(100,audio.currentTime/audio.duration*100):0)+"%";
}
async function toggleAudio(){
  if(!active||busy)return;
  const meta=audioMeta(active);if(!meta?.url)return;
  if(playing){audio.pause();playing=false;updatePlayButton();return}
  try{busy=true;updatePlayButton();if(!audio.src)audio.src=meta.url;await audio.play();playing=true}
  catch(_){playing=false;if($("#msVoiceNote"))$("#msVoiceNote").textContent="Audio ist gerade nicht verfügbar."}
  finally{busy=false;updatePlayButton()}
}
function stopAudio(){try{audio.pause();audio.currentTime=0;audio.removeAttribute("src");audio.load()}catch(_){}playing=false;busy=false;updatePlayButton()}
async function init(){
  if(!ensureUi())return;
  try{
    const r=await fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw Error("Mubaschschirūn "+r.status);
    const data=await r.json();
    libraryPolicy=data.policy&&typeof data.policy==="object"?data.policy:{};
    items=(data.items||[]).slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
    renderCards();renderModeButtons();
    const app=$(".app");
    if(app&&"MutationObserver" in window)new MutationObserver(()=>{renderCards();if(active)renderActive()}).observe(app,{attributes:true,attributeFilter:["data-age"]});
  }catch(err){
    console.warn("[DĀR Kids Mubashshirun]",err);
    const g=$("#msGrid");if(g)g.innerHTML='<div class="ms-load-error">Die Geschichten konnten gerade nicht geladen werden.</div>';
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
window.DARKidsMubashshirun={open:openStory,openLibrary,closeLibrary,stop:stopAudio};
})();