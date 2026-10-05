(() => {
"use strict";

const DATA_URL="/kids/data/sahabiyyat-stories.json";
const KIDS_STORY_INTRO="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, liebe Kinder.";
const KIDS_STORY_OUTRO="Und الله weiß es am besten.\n\nMöge الله euch nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses, schenken.\n\nAs-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
function normalizeKidsStoryText(value){
  let text=String(value||"").trim();
  if(!text)return"";
  if(!text.startsWith(KIDS_STORY_INTRO))text=KIDS_STORY_INTRO+"\n\n"+text;
  if(!text.endsWith(KIDS_STORY_OUTRO))text=text+"\n\n"+KIDS_STORY_OUTRO;
  return text;
}
const MODE_KEY="kids.contentMode.v19";
const DONE_PREFIX="kids.sahabiyyatStory.done.";
let items=[],libraryPolicy={},active=null,activeText="",playing=false,busy=false,coverResizeObserver=null,followReader=null;
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const age=()=>String($(".app")?.getAttribute("data-age")||"6–8");
const ageKey=()=>age().replace("–","-");
function isAudioOnlyAge(){return age()==="4–5"}
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"read"}catch(_){return"read"}}
function setMode(v){
  try{localStorage.setItem(MODE_KEY,v)}catch(_){}
  renderModeButtons();applyMode();
  if(active&&v==="both"&&!isAudioOnlyAge()){
    if(typeof followReader?.openReadAlong==="function")followReader.openReadAlong();
    else followReader?.open?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
  }
}
function textFor(item){const policy=window.DARKidsStoryPolicy;if(policy?.canonicalText)return normalizeKidsStoryText(policy.canonicalText(item));const s=item?.scripts||{};const c=[s["4-5"],s["6-8"],s["9-10"]].map(v=>String(v||"").trim()).filter(Boolean).sort((a,b)=>(b.match(/\S+/g)||[]).length-(a.match(/\S+/g)||[]).length||b.length-a.length);return normalizeKidsStoryText(c[0]||"")}
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
function coverFocusX(item){
  const raw=Number(item?.coverFocusX);
  return Number.isFinite(raw)?Math.max(0,Math.min(100,raw))/100:.5;
}
function applyCoverFocus(img,item){
  if(!img||!item)return;
  const focus=coverFocusX(item);
  const position=()=>{
    const iw=img.naturalWidth||0,ih=img.naturalHeight||0;
    const box=img.parentElement,cw=box?.clientWidth||img.clientWidth||0,ch=box?.clientHeight||img.clientHeight||0;
    if(!iw||!ih||!cw||!ch){img.style.objectPosition="50% 50%";return}
    const scale=Math.max(cw/iw,ch/ih),rw=iw*scale;
    if(rw<=cw+1){img.style.objectPosition="50% 50%";return}
    const p=(cw*.5-focus*rw)/(cw-rw);
    const pct=Math.max(0,Math.min(1,p))*100;
    img.style.objectPosition=pct.toFixed(2)+"% 50%";
  };
  if(img.complete&&img.naturalWidth)position();
  else img.addEventListener("load",position,{once:true});
  requestAnimationFrame(position);
}
function applyAllCoverFocus(){
  document.querySelectorAll(".ms-row-visual img[data-sy-cover-id]").forEach(img=>{
    const item=items.find(x=>x.id===img.dataset.syCoverId);
    if(item)applyCoverFocus(img,item);
  });
}
function heroPos(item){return String(item?.heroPosition||"50% 50%").trim()}
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
  const audioOnly=isAudioOnlyAge();
  const detailModes=document.querySelector(".ms-detail-modes");
  if(detailModes)detailModes.hidden=audioOnly;
  const m=audioOnly?"listen":mode();
  document.querySelectorAll("[data-sy-mode]").forEach(b=>b.classList.toggle("active",b.dataset.syMode===m));
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
  const grid=$("#syGrid");if(!grid)return;
  grid.innerHTML=items.map((item,index)=>{
    const t=textFor(item),src=art(item);
    return '<button class="ms-story-row" type="button" data-sy-id="'+esc(item.id)+'">'+
      '<span class="ms-row-visual" aria-hidden="true">'+
        (src?'<img src="'+esc(src)+'" alt="" data-sy-cover-id="'+esc(item.id)+'" decoding="async" loading="'+(index<4?"eager":"lazy")+'">':'')+
        '<span class="ms-rank">'+String(index+1).padStart(2,"0")+'</span>'+
        '<span class="sy-image-name">'+esc(item.name)+'</span>'+
      '</span>'+
      '<span class="ms-row-copy">'+
        '<strong class="ms-row-title">'+esc(item.name)+'</strong>'+
        '<span class="ms-row-ar" dir="rtl">'+esc(item.nameAr||"")+' رضي الله عنها</span>'+
        '<span class="ms-row-summary">'+esc(item.summary||"")+'</span>'+
        '<span class="ms-row-meta">'+durationLabel(item,t)+' · Alter '+esc(age())+'</span>'+
      '</span>'+
      '<span class="ms-row-go" aria-hidden="true">›</span>'+
      (done(item.id)?'<span class="ms-done" aria-label="Abgeschlossen">✓</span>':'')+
    '</button>';
  }).join("");
  grid.querySelectorAll(".ms-row-visual img[data-sy-cover-id]").forEach(img=>{
    const item=items.find(x=>x.id===img.dataset.syCoverId);
    if(item)applyCoverFocus(img,item);
  });
  grid.querySelectorAll("[data-sy-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.syId)));
  const dc=$("#syDoneCount");if(dc)dc.textContent=String(doneCount());
  const ag=$("#syAge");if(ag)ag.textContent="Alter "+age();
  const entryCopy=$("#syEntry .ms-entry-copy > span:last-child");
  if(entryCopy)entryCopy.textContent=isAudioOnlyAge()?"14 Ṣaḥābiyyāt · Hörgeschichten":"14 Ṣaḥābiyyāt · ihre Geschichten · lesen & hören";
}
function bindEntry(entry){
  if(!entry||entry.dataset.syBound==="1")return entry;
  entry.dataset.syBound="1";
  entry.addEventListener("click",openLibrary);
  return entry;
}
function bindAreaJump(){
  document.querySelectorAll("[data-story-area]").forEach(btn=>{
    if(btn.dataset.storyAreaBound==="1")return;
    btn.dataset.storyAreaBound="1";
    btn.addEventListener("click",()=>{
      const kind=btn.dataset.storyArea;
      if(kind==="prophets"){document.getElementById("psProphetEntry")?.click();return}
      if(kind==="sahaba"){document.getElementById("msEntry")?.click();return}
      if(kind==="sahabiyyat"){
        const entry=document.getElementById("syEntry");
        if(entry){entry.click();return}
        openLibrary();
      }
    });
  });
}
function ensureEntryOrder(){
  const entry=$("#syEntry"),sahaba=$("#msEntry"),prophet=$("#psProphetEntry");
  if(!entry)return;
  if(sahaba&&entry.previousElementSibling!==sahaba)sahaba.insertAdjacentElement("afterend",entry);
  else if(!sahaba&&prophet&&entry.previousElementSibling!==prophet)prophet.insertAdjacentElement("afterend",entry);
}
function insertEntry(view){
  const existing=$("#syEntry");
  if(existing){bindEntry(existing);ensureEntryOrder();setTimeout(ensureEntryOrder,120);return existing}
  const entry=document.createElement("button");
  entry.id="syEntry"; entry.className="ms-entry sy-entry"; entry.type="button";
  entry.innerHTML=
    '<span class="ms-entry-bg" aria-hidden="true"><img src="/kids/assets/stories-home/sahabiyyat-v1133.webp?v=1136" alt="" decoding="async" loading="eager"></span>'+
    '<span class="ms-entry-art" aria-hidden="true"><span class="ms-entry-arch"></span><span class="ms-entry-stars">'+
    Array.from({length:14},(_,i)=>'<i style="--i:'+i+'"></i>').join("")+
    '</span></span>'+
    '<span class="ms-entry-copy">'+
      '<span class="ms-entry-kicker">FRAUEN DER ERSTEN GENERATION</span>'+
      '<strong>Ṣaḥābiyyāt</strong>'+
      '<span>'+(isAudioOnlyAge()?'14 Ṣaḥābiyyāt · Hörgeschichten':'14 Ṣaḥābiyyāt · ihre Geschichten · lesen &amp; hören')+'</span>'+
    '</span>'+
    '<span class="ms-entry-action">Entdecken <b aria-hidden="true">›</b></span>';
  const sahaba=$("#msEntry");
  const prophet=$("#psProphetEntry");
  if(sahaba)sahaba.insertAdjacentElement("afterend",entry);
  else if(prophet)prophet.insertAdjacentElement("afterend",entry);
  else view.querySelector(".page-head")?.insertAdjacentElement("afterend",entry);
  bindEntry(entry);
  ensureEntryOrder();setTimeout(ensureEntryOrder,120);
  return entry;
}
function ensureUi(){
  const view=$("#view-stories");if(!view||$("#syLibraryPage"))return false;
  insertEntry(view);

  const page=document.createElement("section");
  page.id="syLibraryPage"; page.className="ms-library-page sy-library-page"; page.setAttribute("aria-hidden","true");
  page.innerHTML=
    '<div class="ms-library-nav">'+
      '<button id="syBack" class="ms-back" type="button" aria-label="Zurück zu Geschichten">‹</button>'+
      '<div><strong>Ṣaḥābiyyāt</strong><span>Frauen der ersten Generation · 14 Geschichten</span></div>'+
    '</div>'+
    '<div class="ms-library-scroll" id="syLibraryScroll">'+



      '<div id="syGrid" class="ms-list"></div>'+
    '</div>';
  document.body.appendChild(page);
  const coverGrid=$("#syGrid");
  if(coverGrid&&"ResizeObserver" in window){
    coverResizeObserver?.disconnect();
    coverResizeObserver=new ResizeObserver(()=>applyAllCoverFocus());
    coverResizeObserver.observe(coverGrid);
  }
  $("#syBack").addEventListener("click",closeLibrary);
  installSwipeBack($("#syLibraryScroll"),closeLibrary);
  page.querySelectorAll("[data-sy-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.syMode)));

  const modal=document.createElement("div");
  modal.id="syModal"; modal.className="ms-modal sy-modal";
  modal.innerHTML=
    '<div class="ms-sheet" role="dialog" aria-modal="true" aria-labelledby="syTitle">'+
      '<button id="syClose" class="ms-close" type="button" aria-label="Zurück">‹</button>'+
      '<div class="ms-scroll" id="syScroll">'+
        '<header class="ms-detail-hero" id="syDetailHero">'+
          '<img id="syHero" class="ms-detail-image" src="" alt="" decoding="async">'+
          '<span class="ms-detail-shade" aria-hidden="true"></span>'+

          '<div class="ms-detail-copy">'+
            '<div class="ms-detail-kicker">ṢAḤĀBIYYAH · ERSTE GENERATION</div>'+
            '<h2 id="syTitle"></h2><div id="syArabic" class="ms-ar" dir="rtl"></div>'+
            '<p id="sySummary"></p><div id="syMeta" class="ms-meta"></div>'+
          '</div>'+
        '</header>'+
        '<div class="ms-body">'+
          '<div id="syVisualDisclaimer" class="ms-visual-disclaimer"></div>'+
          '<div class="ms-detail-modes"><button data-sy-mode="both" type="button">Hören &amp; Mitlesen</button><button data-sy-mode="listen" type="button">Hören</button><button data-sy-mode="read" type="button">Lesen</button></div>'+
          '<div class="ms-profile-grid"><section><small>WAS ZEICHNETE SIE AUS?</small><strong id="syTrait"></strong></section><section><small>IHRE GESCHICHTE &amp; ZEIT</small><span id="syLife"></span></section><section><small>QUELLENKONTEXT</small><span id="syWitness"></span></section></div>'+
          '<section id="syPlayer" class="ms-player"><div class="story-local-controls"><button class="story-skip" id="syBack15" type="button" aria-label="15 Sekunden zurück">−15 s</button><button id="syPlay" class="ms-play" type="button">Hören</button><button class="story-skip" id="syFwd15" type="button" aria-label="15 Sekunden vor">+15 s</button></div><div class="ms-progress" id="syProgressTrack" role="slider" tabindex="0" aria-label="Wiedergabeposition"><span id="syProgress"></span></div><div class="ms-player-time"><strong id="syTimeCurrent">0:00</strong><span id="syTimeTotal">0:00</span></div><button class="ms-follow-open" id="syFollowOpen" type="button">Hören &amp; Mitlesen</button><p id="syVoiceNote"></p></section>'+
          '<article id="syRead" class="ms-read"></article>'+
          '<section class="ms-sources"><strong>GEPRÜFTE QUELLEN</strong><div id="sySources"></div></section>'+
          '<section id="syQuestion" class="ms-question"></section>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
  $("#syClose").addEventListener("click",closeStory);
  installSwipeBack($("#syScroll"),closeStory);
  $("#syPlay").addEventListener("click",toggleAudio);
  $("#syBack15")?.addEventListener("click",()=>seekBy(-15));
  $("#syFwd15")?.addEventListener("click",()=>seekBy(15));
  $("#syFollowOpen")?.addEventListener("click",()=>{
    if(isAudioOnlyAge())return;
    if(typeof followReader?.openReadAlong==="function")followReader.openReadAlong();
    else followReader?.open?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
  });
  $("#syProgressTrack")?.addEventListener("click",seekFromProgress);
  $("#syProgressTrack")?.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();seekBy(e.key==="ArrowLeft"?-15:15)}});
  modal.querySelectorAll("[data-sy-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.syMode)));
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("loadedmetadata",()=>{followReader?.restore();updateProgress()});
  audio.addEventListener("play",()=>{playing=true;updatePlayButton()});
  audio.addEventListener("pause",()=>{playing=false;updatePlayButton()});
  audio.addEventListener("ended",()=>{playing=false;updatePlayButton();markDone(active?.id||"");});
  followReader=window.DARKidsFollowReader?.create({
    id:"sahabiyyat-story",audio,
    getContent:()=>{
      const meta=audioMeta(active)||{};
      return{
        key:active?("sahabiyyah:"+active.id+":"+ageKey()):"sahabiyyah:story",
        title:active?(active.name):"Geschichte",
        subtitle:"Ṣaḥābiyyāt-Geschichte",
        album:"DĀR AL TAWḤĪD Kids · Ṣaḥābiyyāt",
        text:activeText,
        artwork:active?(art(active,"hero")):"",
        deepLink:active?("#stories/sahabiyyah/"+encodeURIComponent(active.id)):"#stories",
        audioOnly:isAudioOnlyAge(),
        timings:meta.timings||meta.paragraphTimings||meta.cues||[],
        syncPoints:meta.syncPoints||meta.syncAnchors||[]
      };
    },
    toggleAudio,
    autoOpen:false,
    disabled:()=>!audioMeta(active)?.url
  })||null;
  return true;
}
function openLibrary(){
  const p=$("#syLibraryPage");if(!p)return;
  p.classList.add("open");p.removeAttribute("aria-hidden");
  document.documentElement.classList.add("ms-library-open");
  const app=$(".app");if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
  $("#syLibraryScroll").scrollTop=0;renderCards();renderModeButtons();
}
function closeLibrary(){
  if($("#syModal")?.classList.contains("open"))return;
  const p=$("#syLibraryPage");if(!p)return;
  p.classList.remove("open");p.setAttribute("aria-hidden","true");
  document.documentElement.classList.remove("ms-library-open");
  const app=$(".app");if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
  setTimeout(()=>$("#syEntry")?.focus(),0);
}
function lockLibrary(){
  const p=$("#syLibraryPage");if(p){p.setAttribute("inert","");p.setAttribute("aria-hidden","true")}
  document.documentElement.classList.add("ms-modal-open");
}
function unlockLibrary(){
  const p=$("#syLibraryPage");if(p?.classList.contains("open")){p.removeAttribute("inert");p.removeAttribute("aria-hidden")}
  document.documentElement.classList.remove("ms-modal-open");
}
function openStory(id){
  active=items.find(x=>x.id===id);if(!active)return;
  stopAudio();renderActive();
  $("#syModal").classList.add("open");lockLibrary();$("#syScroll").scrollTop=0;$("#syClose").focus();
}
function closeStory(){followReader?.close();stopAudio();$("#syModal")?.classList.remove("open");unlockLibrary();clearStoryDeepLink("sahabiyyah");active=null}
function renderActive(){
  if(!active)return;
  activeText=textFor(active);
  const hero=$("#syHero");if(hero){hero.src=art(active,"hero");hero.style.objectPosition=heroPos(active);hero.onerror=()=>{hero.onerror=null;hero.src=art(active,"cover")}}
  $("#syTitle").textContent=active.name;
  $("#syArabic").textContent=(active.nameAr||"")+" رضي الله عنها";
  $("#sySummary").textContent=active.summary||"";
  $("#syMeta").innerHTML='<span>'+durationLabel(active,activeText)+'</span><span>Alter '+esc(age())+'</span><span>Lebensgeschichte</span>';
  {
    const vd=$("#syVisualDisclaimer");
    if(vd){
      if(age()==="4–5")vd.textContent="Das Bild ist nur eine Lernszene. Wir wissen nicht genau, wie dieser Ṣaḥābī aussah oder welche Kleidung er genau trug.";
      else if(age()==="6–8")vd.textContent="Historische Lernszene: Aussehen und persönliche Kleidung des Ṣaḥābī werden nicht als sicher behauptet.";
      else vd.textContent=[active.visualDisclaimer||"Szenische historische Illustration; kein Anspruch auf das tatsächliche Aussehen des Ṣaḥābī.",active.visualBasis||""].filter(Boolean).join(" ");
    }
  }
  $("#syTrait").textContent=active.trait||"";
  $("#syLife").textContent=active.lifeContext||active.summary||"";
  $("#syWitness").textContent=active.storyHighlight||active.witnessContext||active.summary||"";
  $("#syRead").innerHTML=activeText.split(/\n{2,}/).map(p=>'<p>'+esc(p)+'</p>').join("");
  $("#sySources").innerHTML=sourceHtml(active);
  renderQuestion();applyMode();resetAudio();
}
function renderQuestion(){
  const q=$("#syQuestion");if(!q||!active)return;
  q.innerHTML='<div class="ms-q-kicker">HAST DU GUT AUFGEPASST?</div><h3>'+esc(active.question||"")+'</h3>'+
    (active.answers||[]).map((a,i)=>'<button type="button" data-sy-answer="'+i+'">'+esc(a)+'</button>').join("")+
    '<p id="syFeedback" class="ms-feedback"></p>';
  q.querySelectorAll("[data-sy-answer]").forEach(b=>b.addEventListener("click",()=>{
    const good=Number(b.dataset.syAnswer)===Number(active.correct||0);
    b.classList.add(good?"good":"bad");
    $("#syFeedback").textContent=good?"Richtig. Gut aufgepasst.":"Lies oder hör die Geschichte noch einmal in Ruhe.";
    if(good)markDone(active.id);
    else setTimeout(()=>b.classList.remove("bad"),900);
  }));
}
function applyMode(){
  renderModeButtons();
  const read=$("#syRead"),player=$("#syPlayer"),follow=$("#syFollowOpen");
  if(isAudioOnlyAge()){
    if(read)read.hidden=true;
    if(player)player.hidden=false;
    if(follow){
      follow.hidden=true;
      follow.setAttribute("aria-hidden","true");
      follow.tabIndex=-1;
    }
    return;
  }
  const m=mode();
  if(read)read.hidden=m==="listen";
  if(player)player.hidden=m==="read";
  if(follow){follow.hidden=false;follow.removeAttribute("aria-hidden");follow.tabIndex=0;follow.textContent="Mitlesen öffnen";follow.setAttribute("aria-label","Mitlesen öffnen")}
}
function resetAudio(){
  stopAudio();
  const meta=audioMeta(active),note=$("#syVoiceNote");
  if(meta?.url){
    audio.src=meta.url;audio.preload="metadata";
    if(note)note.textContent="Serhat-Stimme · geprüfte Fuṣḥā-Aussprache";
  }else{
    audio.removeAttribute("src");
    if(note)note.textContent=isAudioOnlyAge()?"Das Hörbuch ist gerade nicht verfügbar.":"Der Lesetext ist vollständig. Audio folgt, sobald es freigeschaltet ist.";
  }
  if($("#syProgress"))$("#syProgress").style.width="0";
  if($("#syTimeCurrent"))$("#syTimeCurrent").textContent="0:00";
  if($("#syTimeTotal"))$("#syTimeTotal").textContent="0:00";
  updatePlayButton();
}
function updatePlayButton(){
  const b=$("#syPlay");if(!b)return;
  const meta=audioMeta(active);
  b.disabled=busy||!meta?.url;
  b.textContent=playing?"Pause":(audio.currentTime>0&&!audio.ended?"Weiterhören":(isAudioOnlyAge()?"Hören":(mode()==="both"?"Hören & mitlesen":"Hören")));
}
function storyTime(v){return window.DARKidsFollowReader?.formatTime?window.DARKidsFollowReader.formatTime(v):Math.floor((Number(v)||0)/60)+":"+String(Math.floor((Number(v)||0)%60)).padStart(2,"0")}
function updateProgress(){
  const duration=Number(audio.duration)||0,current=Number(audio.currentTime)||0;
  if($("#syProgress"))$("#syProgress").style.width=(duration?Math.min(100,current/duration*100):0)+"%";
  if($("#syTimeCurrent"))$("#syTimeCurrent").textContent=storyTime(current);
  if($("#syTimeTotal"))$("#syTimeTotal").textContent=storyTime(duration);
  const track=$("#syProgressTrack");
  if(track){track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(Math.max(0,Math.round(duration))));track.setAttribute("aria-valuenow",String(Math.max(0,Math.round(current))));track.setAttribute("aria-valuetext",storyTime(current)+" von "+storyTime(duration))}
}
function seekBy(delta){
  if(!Number(audio.duration))return;
  try{audio.currentTime=Math.max(0,Math.min(audio.duration,(Number(audio.currentTime)||0)+Number(delta||0)))}catch(_){}
  updateProgress();followReader?.persist(true);
}
function seekFromProgress(e){
  const track=$("#syProgressTrack");if(!track||!Number(audio.duration))return;
  const rect=track.getBoundingClientRect();if(!rect.width)return;
  try{audio.currentTime=Math.max(0,Math.min(audio.duration,((e.clientX-rect.left)/rect.width)*audio.duration))}catch(_){}
  updateProgress();followReader?.persist(true);
}
function clearStoryDeepLink(kind){
  try{
    const raw=String(location.hash||"");
    if(raw.indexOf("#stories/"+kind+"/")===0)history.replaceState(history.state||{},"",location.pathname+(location.search||"")+"#stories");
  }catch(_){}
}
async function toggleAudio(){
  if(!active||busy)return;
  const meta=audioMeta(active);if(!meta?.url)return;
  if(playing){audio.pause();return}
  try{
    busy=true;updatePlayButton();
    if(!audio.src)audio.src=meta.url;
    if(audio.ended)try{audio.currentTime=0}catch(_){}
    followReader?.restore();
    await audio.play();
  }catch(_){
    playing=false;
    if($("#syVoiceNote"))$("#syVoiceNote").textContent="Audio ist gerade nicht verfügbar.";
  }finally{busy=false;updatePlayButton()}
}
function stopAudio(){
  followReader?.persist(true);
  try{audio.pause();audio.removeAttribute("src");audio.load()}catch(_){}
  playing=false;busy=false;updatePlayButton();updateProgress();
}
async function init(){
  if(!ensureUi())return;
  bindAreaJump();
  try{
    const r=await fetch(DATA_URL+"?v=1131",{cache:"no-store"});
    if(!r.ok)throw Error("Ṣaḥābiyyāt "+r.status);
    const data=await r.json();
    libraryPolicy=data.policy&&typeof data.policy==="object"?data.policy:{};
    items=(data.items||[]).slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
    renderCards();renderModeButtons();
    try{
      const m=String(location.hash||"").match(/^#stories\/sahabiyyah\/([^/?#]+)/i);
      const id=m?decodeURIComponent(m[1]||""):"";
      if(id&&items.some(x=>x.id===id)){document.querySelector('.nav-btn[data-target="stories"]')?.click();openLibrary();setTimeout(()=>openStory(id),0)}
    }catch(_){};
    const app=$(".app");
    if(app&&"MutationObserver" in window)new MutationObserver(()=>{renderCards();if(active)renderActive()}).observe(app,{attributes:true,attributeFilter:["data-age"]});
  }catch(err){
    console.warn("[DĀR Kids Sahabiyyat]",err);
    const g=$("#syGrid");if(g)g.innerHTML='<div class="ms-load-error">Die Geschichten konnten gerade nicht geladen werden.</div>';
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
window.DARKidsSahabiyyat={open:openStory,openLibrary,closeLibrary,stop:stopAudio};
})();