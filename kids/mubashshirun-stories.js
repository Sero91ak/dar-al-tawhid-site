(() => {
"use strict";

const DATA_URL="/kids/data/mubashshirun-stories.json";
const DONE_PREFIX="kids.mubashshirun.done.";
const MODE_KEY="kids.mubashshirun.mode.v1";
let items=[],active=null,activeText="",busy=false,playing=false;
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function ageKey(){return age().replace("–","-")}
function mode(){try{const x=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(x)?x:"both"}catch(_){return"both"}}
function setMode(v){try{localStorage.setItem(MODE_KEY,v)}catch(_){}applyMode()}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function markDone(id){if(!id)return;try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){}renderList()}
function doneCount(){return items.reduce((n,x)=>n+(done(x.id)?1:0),0)}
function scriptFor(item){return String(item?.scripts?.[ageKey()]||item?.scripts?.["6-8"]||"").trim()}
function audioMeta(item){return item?.audio?.[ageKey()]||null}
function duration(item){
  const p=item?.voiceProduction?.ageProfiles?.[ageKey()];
  if(p?.estimatedMinutes)return "ca. "+p.estimatedMinutes+" Min.";
  const w=(scriptFor(item).match(/\S+/g)||[]).length;
  return "ca. "+Math.max(3,Math.round(w/95))+" Min.";
}
function arabic(item){return [item?.nameAr||"",item?.honorific||"رضي الله عنه"].filter(Boolean).join(" ")}
function sourceType(ref){
  const r=String(ref||"");
  if(/^Qurʾān/i.test(r))return"QURʾĀN";
  if(/Buḫār|Bukh/i.test(r))return"ṢAḤĪḤ AL-BUḪĀRĪ";
  if(/Muslim/i.test(r))return"ṢAḤĪḤ MUSLIM";
  if(/Tirm/i.test(r))return"JĀMIʿ AT-TIRMIDHĪ";
  return"QUELLE";
}

function ensureHub(){
  const view=$("#view-stories");
  const prophet=$("#psProphetEntry");
  if(!view||!prophet)return false;
  if($("#msSahabaEntry"))return true;

  let hub=$("#msStoryHub");
  if(!hub){
    hub=document.createElement("div");
    hub.id="msStoryHub";
    hub.className="ms-story-hub";
    prophet.parentNode.insertBefore(hub,prophet);
    hub.appendChild(prophet);
  }

  const entry=document.createElement("button");
  entry.id="msSahabaEntry";
  entry.className="ms-entry";
  entry.type="button";
  entry.innerHTML=
    '<span class="ms-entry-art" aria-hidden="true">'+
      '<span class="ms-entry-stars"></span>'+
      '<span class="ms-entry-ten">10</span>'+
      '<span class="ms-entry-arch"></span>'+
    '</span>'+
    '<span class="ms-entry-panel">'+
      '<span class="ms-entry-kicker">EIGENER BEREICH · QURʾĀN &amp; AUTHENTISCHE SUNNAH</span>'+
      '<strong>Die zehn al-Mubaššarūn</strong>'+
      '<span class="ms-entry-sub">10 Ṣaḥābah · ihre Geschichten, Vorzüge &amp; Lehren</span>'+
      '<span class="ms-entry-action">Entdecken <b aria-hidden="true">›</b></span>'+
    '</span>';
  hub.appendChild(entry);
  entry.addEventListener("click",openLibrary);
  return true;
}

function ensureUi(){
  if($("#msLibraryPage"))return true;
  const page=document.createElement("section");
  page.id="msLibraryPage";
  page.className="ms-library";
  page.setAttribute("aria-hidden","true");
  page.innerHTML=
    '<div class="ms-library-shell">'+
      '<header class="ms-library-head">'+
        '<button id="msLibraryBack" class="ms-back" type="button" aria-label="Zurück zu Geschichten">‹</button>'+
        '<div class="ms-library-title"><span>ṢAḤĀBAH · DIE ZEHN</span><strong>al-ʿAšarah al-Mubaššarūn</strong><small>Die zehn Gefährten, denen das Paradies angekündigt wurde</small></div>'+
      '</header>'+
      '<div class="ms-library-toolbar">'+
        '<div class="ms-age"><span id="msAgeLabel">Alter '+esc(age())+'</span><span>Quellengeprüfte Erzähltexte</span></div>'+
        '<div class="ms-modes">'+
          '<button data-ms-mode="both" type="button">Lesen &amp; Hören</button>'+
          '<button data-ms-mode="listen" type="button">Hören</button>'+
          '<button data-ms-mode="read" type="button">Lesen</button>'+
        '</div>'+
      '</div>'+
      '<div class="ms-intro">'+
        '<div><span class="ms-intro-kicker">WAS BEDEUTET DAS?</span><h2>Zehn Gefährten mit einer besonderen frohen Botschaft</h2><p>Der Qurʾān lobt die frühen Gläubigen und Gefährten. Die konkrete Liste dieser zehn Männer kennen wir aus der authentischen Sunnah. In jeder Geschichte trennen wir deshalb Qurʾān, Ḥadīṯ und spätere Berichte sauber voneinander.</p></div>'+
        '<div class="ms-intro-proof"><strong>10</strong><span>Geschichten</span><small>ohne erfundene Abenteuer</small></div>'+
      '</div>'+
      '<div class="ms-progress-line"><span id="msDoneCount">0</span> von 10 abgeschlossen</div>'+
      '<div id="msGrid" class="ms-grid"></div>'+
    '</div>'+
    '<section id="msDetail" class="ms-detail" aria-hidden="true">'+
      '<div class="ms-detail-shell">'+
        '<header class="ms-detail-head"><button id="msDetailBack" class="ms-back" type="button" aria-label="Zurück zur Übersicht">‹</button><div><span id="msDetailKicker">ṢAḤĀBĪ</span><strong id="msDetailName"></strong></div></header>'+
        '<div class="ms-detail-hero">'+
          '<div class="ms-detail-number" id="msDetailNumber"></div>'+
          '<div class="ms-detail-copy"><div class="ms-detail-ar" id="msDetailArabic" dir="rtl"></div><h2 id="msDetailTitle"></h2><p id="msDetailSummary"></p><div id="msDetailMeta" class="ms-detail-meta"></div></div>'+
        '</div>'+
        '<div class="ms-detail-modes ms-modes"><button data-ms-mode="both" type="button">Lesen &amp; Hören</button><button data-ms-mode="listen" type="button">Hören</button><button data-ms-mode="read" type="button">Lesen</button></div>'+
        '<div id="msPlayer" class="ms-player"><button id="msPlay" type="button">Hören</button><div class="ms-audio-track"><span id="msProgress"></span></div><small id="msVoiceNote"></small></div>'+
        '<article id="msRead" class="ms-read"></article>'+
        '<section class="ms-sources"><span>QUELLEN · GEPRÜFT</span><div id="msSources"></div><p>Allgemeines Qurʾān-Lob und persönliche Ḥadīṯ-Belege werden bewusst getrennt.</p></section>'+
        '<section id="msQuestion" class="ms-question"></section>'+
      '</div>'+
    '</section>';
  document.body.appendChild(page);

  $("#msLibraryBack").addEventListener("click",closeLibrary);
  $("#msDetailBack").addEventListener("click",closeDetail);
  $("#msPlay").addEventListener("click",toggleAudio);
  page.querySelectorAll("[data-ms-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.msMode)));
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    if($("#msDetail")?.classList.contains("open"))closeDetail();
    else if($("#msLibraryPage")?.classList.contains("open"))closeLibrary();
  });
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("loadedmetadata",updateProgress);
  audio.addEventListener("play",()=>{playing=true;updatePlay()});
  audio.addEventListener("pause",()=>{playing=false;updatePlay()});
  audio.addEventListener("ended",()=>{playing=false;markDone(active?.id);updatePlay();if($("#msVoiceNote"))$("#msVoiceNote").textContent="Geschichte vollständig angehört."});
  return true;
}

function lockBackground(){
  document.documentElement.classList.add("ms-library-open");
  const app=$(".app");
  if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
}
function unlockBackground(){
  document.documentElement.classList.remove("ms-library-open");
  const app=$(".app");
  if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
}
function openLibrary(){
  ensureUi();
  const page=$("#msLibraryPage");if(!page)return;
  page.classList.add("open");page.removeAttribute("aria-hidden");lockBackground();
  page.scrollTop=0;renderList();applyMode();
  setTimeout(()=>$("#msLibraryBack")?.focus(),0);
}
function closeLibrary(){
  stopAudio();closeDetail(true);
  const page=$("#msLibraryPage");if(!page)return;
  page.classList.remove("open");page.setAttribute("aria-hidden","true");unlockBackground();
  setTimeout(()=>$("#msSahabaEntry")?.focus(),0);
}
function openDetail(id){
  active=items.find(x=>x.id===id)||null;if(!active)return;
  stopAudio();renderDetail();
  const d=$("#msDetail");d.classList.add("open");d.removeAttribute("aria-hidden");
  d.scrollTop=0;setTimeout(()=>$("#msDetailBack")?.focus(),0);
}
function closeDetail(silent=false){
  stopAudio();
  const d=$("#msDetail");if(d){d.classList.remove("open");d.setAttribute("aria-hidden","true")}
  const prev=active?.id;active=null;
  if(!silent&&prev)setTimeout(()=>$("[data-ms-id='"+CSS.escape(prev)+"']")?.focus(),0);
}

function renderList(){
  const grid=$("#msGrid");if(!grid)return;
  grid.innerHTML=items.map((item,i)=>{
    const src=(item.sourceRefs||[]).filter(x=>!/Tirmidhī 3747/.test(x));
    return '<button class="ms-card" data-ms-id="'+esc(item.id)+'" type="button">'+
      '<span class="ms-card-top"><span class="ms-card-index">'+String(i+1).padStart(2,"0")+'</span><span class="ms-card-proof">'+esc(sourceType(src[0]||item.sourceRefs?.[0]||""))+'</span></span>'+
      '<span class="ms-card-ar" dir="rtl">'+esc(item.nameAr||"")+'</span>'+
      '<strong>'+esc(item.name)+'</strong>'+
      '<span class="ms-card-summary">'+esc(item.summary||"")+'</span>'+
      '<span class="ms-card-foot"><span>'+esc(duration(item))+' · Alter '+esc(age())+'</span><b aria-hidden="true">›</b></span>'+
      (done(item.id)?'<span class="ms-card-done">✓</span>':'')+
    '</button>';
  }).join("");
  grid.querySelectorAll("[data-ms-id]").forEach(b=>b.addEventListener("click",()=>openDetail(b.dataset.msId)));
  if($("#msDoneCount"))$("#msDoneCount").textContent=String(doneCount());
  if($("#msAgeLabel"))$("#msAgeLabel").textContent="Alter "+age();
}

function renderDetail(){
  if(!active)return;
  activeText=scriptFor(active);
  $("#msDetailKicker").textContent="ṢAḤĀBĪ · "+String(active.displayOrder||"").padStart(2,"0")+" / 10";
  $("#msDetailName").textContent=active.name;
  $("#msDetailNumber").textContent=String(active.displayOrder||"");
  $("#msDetailArabic").textContent=arabic(active);
  $("#msDetailTitle").textContent=active.name;
  $("#msDetailSummary").textContent=active.summary||"";
  $("#msDetailMeta").innerHTML=
    '<span>'+esc(duration(active))+'</span>'+
    '<span>Alter '+esc(age())+'</span>'+
    '<span>Qurʾān + Sunnah</span>'+
    '<span>Fuṣḥā geprüft</span>';
  $("#msRead").innerHTML=activeText.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#msSources").innerHTML=(active.sourceRefs||[]).map(ref=>'<div class="ms-source-row"><span>'+esc(sourceType(ref))+'</span><strong>'+esc(ref)+'</strong></div>').join("");
  renderQuestion();resetAudio();applyMode();
}
function renderQuestion(){
  const q=$("#msQuestion");if(!q||!active)return;
  q.innerHTML='<span>HAST DU GUT AUFGEPASST?</span><h3>'+esc(active.question||"")+'</h3>'+
    (active.answers||[]).map((a,i)=>'<button type="button" data-ms-answer="'+i+'">'+esc(a)+'</button>').join("")+
    '<div id="msFeedback" class="ms-feedback"></div>';
  q.querySelectorAll("[data-ms-answer]").forEach(b=>b.addEventListener("click",()=>{
    const ok=Number(b.dataset.msAnswer)===Number(active.correct||0);
    b.classList.add(ok?"good":"bad");
    $("#msFeedback").textContent=ok?"Richtig. Gut aufgepasst.":"Lies oder hör den Abschnitt noch einmal.";
    if(ok)markDone(active.id); else setTimeout(()=>b.classList.remove("bad"),900);
  }));
}
function applyMode(){
  const m=mode();
  document.querySelectorAll("[data-ms-mode]").forEach(b=>b.classList.toggle("active",b.dataset.msMode===m));
  const read=$("#msRead"),player=$("#msPlayer");
  if(read)read.hidden=m==="listen";
  if(player)player.hidden=m==="read";
}
function resetAudio(){
  stopAudio();
  const meta=audioMeta(active);
  const note=$("#msVoiceNote");
  if(meta?.url){
    audio.src=meta.url;
    if(note)note.textContent="Serhat Voice · geprüfte Aussprache";
  }else{
    audio.removeAttribute("src");
    if(note)note.textContent="Voice-Audio ist vorbereitet und wird im DĀR AL TAWḤĪD Voice Studio erzeugt.";
  }
  if($("#msProgress"))$("#msProgress").style.width="0";
  updatePlay();
}
function updateProgress(){
  if(!$("#msProgress"))return;
  $("#msProgress").style.width=(audio.duration?Math.min(100,audio.currentTime/audio.duration*100):0)+"%";
}
function updatePlay(){
  const b=$("#msPlay");if(!b)return;
  const meta=audioMeta(active);
  b.disabled=busy||!meta?.url;
  b.textContent=playing?"Pause":(audio.currentTime>0&&!audio.ended?"Weiterhören":"Hören");
}
async function toggleAudio(){
  const meta=audioMeta(active);if(!active||busy||!meta?.url)return;
  if(playing){audio.pause();return}
  try{busy=true;updatePlay();if(!audio.src)audio.src=meta.url;await audio.play();playing=true}
  catch(_){if($("#msVoiceNote"))$("#msVoiceNote").textContent="Audio konnte gerade nicht geladen werden."}
  finally{busy=false;updatePlay()}
}
function stopAudio(){
  try{audio.pause();audio.currentTime=0;audio.removeAttribute("src");audio.load()}catch(_){}
  busy=false;playing=false;updatePlay();
}

async function load(){
  try{
    const r=await fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw new Error("Mubashshirun "+r.status);
    const d=await r.json();
    items=(Array.isArray(d.items)?d.items:[]).slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
    renderList();
  }catch(err){
    console.warn("[DĀR Kids Mubashshirun]",err);
    const grid=$("#msGrid");if(grid)grid.innerHTML='<div class="ms-load-error">Die Ṣaḥābah-Geschichten konnten gerade nicht geladen werden.</div>';
  }
}
function boot(){
  let tries=0;
  const wait=()=>{
    tries++;
    if(ensureHub()){ensureUi();load();const app=$(".app");if(app&&"MutationObserver" in window)new MutationObserver(()=>{renderList();if(active)renderDetail()}).observe(app,{attributes:true,attributeFilter:["data-age"]});return}
    if(tries<50)setTimeout(wait,100);
  };
  wait();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
window.DARKidsMubashshirun={openLibrary,closeLibrary,open:openDetail,stop:stopAudio};
})();