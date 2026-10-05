(() => {
"use strict";

const DATA_URL="/kids/data/mubashshirun-stories.json";
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
const DONE_PREFIX="kids.mubashshirunStory.done.";
let items=[],libraryPolicy={},active=null,activeText="",playing=false,busy=false,coverResizeObserver=null,followReader=null;
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const age=()=>String($(".app")?.getAttribute("data-age")||"6–8");
const ageKey=()=>age().replace("–","-");
function isAudioOnlyAge(){return age()==="4–5"}
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"read"}catch(_){return"read"}}
function setMode(v){
  if(!["both","listen","read"].includes(v))return;
  try{localStorage.setItem(MODE_KEY,v)}catch(_){}
  renderModeButtons();
  if(!active){applyMode();return}
  if(v==="both"){
    if(typeof followReader?.openReadAlong==="function")followReader.openReadAlong();
    else followReader?.open?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
    return;
  }
  if(v==="listen"){
    if(typeof followReader?.openListening==="function")followReader.openListening();
    else followReader?.open?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
    return;
  }
  if(v==="read"){
    if(!audio.paused)audio.pause();
    if(typeof followReader?.openReading==="function")followReader.openReading();
    else followReader?.open?.();
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
  document.querySelectorAll(".ms-row-visual img[data-ms-cover-id]").forEach(img=>{
    const item=items.find(x=>x.id===img.dataset.msCoverId);
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
  const detailModes=document.querySelector(".ms-detail-modes");
  if(detailModes)detailModes.hidden=false;
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
  const libraryPage=$("#msLibraryPage");if(libraryPage)libraryPage.dataset.age=age();
  grid.innerHTML=items.map((item,index)=>{
    const t=textFor(item),src=art(item);
    const rawSummary=String(item.summary||"").replace(/\s+/g," ").trim();
    const leadSummary=rawSummary.split(/\s+[–—]\s+|;\s+/)[0].trim();
    const cardSummary=(leadSummary.length>=14&&leadSummary.length<=72)?leadSummary:rawSummary;
    const shortSummary=cardSummary.length>78?(cardSummary.slice(0,75).replace(/\s+\S*$/,"")+"…"):cardSummary;
    return '<button class="ms-story-row" type="button" data-ms-id="'+esc(item.id)+'">'+
      '<span class="ms-row-visual" aria-hidden="true">'+
        (src?'<img src="'+esc(src)+'" alt="" data-ms-cover-id="'+esc(item.id)+'" decoding="async" loading="'+(index<4?"eager":"lazy")+'">':'')+
        '<span class="ms-rank">'+String(index+1).padStart(2,"0")+'</span>'+
      '</span>'+
      '<span class="ms-row-copy">'+
        '<strong class="ms-row-title">'+esc(item.name)+'</strong>'+
        '<span class="ms-row-ar" dir="rtl">'+esc(item.nameAr||"")+'</span>'+
        '<span class="ms-row-summary">'+esc(shortSummary)+'</span>'+
        '<span class="ms-row-meta">'+durationLabel(item,t)+' · Alter '+esc(age())+'</span>'+
      '</span>'+
      '<span class="ms-row-go'+(isAudioOnlyAge()?' is-listen':'')+'" aria-hidden="true">'+(isAudioOnlyAge()?'▶':'›')+'</span>'+
      (done(item.id)?'<span class="ms-done" aria-label="Abgeschlossen">✓</span>':'')+
    '</button>';
  }).join("");
  grid.querySelectorAll(".ms-row-visual img[data-ms-cover-id]").forEach(img=>{
    const item=items.find(x=>x.id===img.dataset.msCoverId);
    if(item)applyCoverFocus(img,item);
  });
  grid.querySelectorAll("[data-ms-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.msId)));
  const dc=$("#msDoneCount");if(dc)dc.textContent=String(doneCount());
  const ag=$("#msAge");if(ag)ag.textContent="Alter "+age();
  const entryCopy=$("#msEntry .ms-entry-copy > span:last-child");
  if(entryCopy)entryCopy.textContent=isAudioOnlyAge()?"10 Ṣaḥābah · Hörgeschichten":"10 Ṣaḥābah · ihre Geschichten · lesen & hören";
}
function insertEntry(view){
  if($("#msEntry"))return;
  const entry=document.createElement("button");
  entry.id="msEntry"; entry.className="ms-entry"; entry.type="button";
  entry.innerHTML=
    '<span class="ms-entry-bg" aria-hidden="true"><img src="/kids/assets/stories-home/sahaba-v1133.webp?v=1136" alt="" decoding="async" loading="eager"></span>'+
    '<span class="ms-entry-art" aria-hidden="true"><span class="ms-entry-arch"></span><span class="ms-entry-stars">'+
    Array.from({length:10},(_,i)=>'<i style="--i:'+i+'"></i>').join("")+
    '</span></span>'+
    '<span class="ms-entry-copy">'+
      '<span class="ms-entry-kicker">DIE ZEHN GEFÄHRTEN</span>'+
      '<strong>Die zehn Mubaschschirūn</strong>'+
      '<span>'+(isAudioOnlyAge()?'10 Ṣaḥābah · Hörgeschichten':'10 Ṣaḥābah · ihre Geschichten · lesen &amp; hören')+'</span>'+
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



      '<div class="story-list-head"><span>DIE ZEHN GEFÄHRTEN</span><strong>Die zehn Mubaschschirūn</strong><small>Wähle eine Geschichte aus.</small></div>'+
      '<div id="msGrid" class="ms-list"></div>'+
    '</div>';
  document.body.appendChild(page);
  const coverGrid=$("#msGrid");
  if(coverGrid&&"ResizeObserver" in window){
    coverResizeObserver?.disconnect();
    coverResizeObserver=new ResizeObserver(()=>applyAllCoverFocus());
    coverResizeObserver.observe(coverGrid);
  }
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
          '<div class="ms-detail-modes"><button data-ms-mode="both" type="button">Hören &amp; Mitlesen</button><button data-ms-mode="listen" type="button">Hören</button><button data-ms-mode="read" type="button">Lesen</button></div>'+
          '<div class="ms-profile-grid"><section><small>WIE WAR ER?</small><strong id="msTrait"></strong></section><section><small>SEIN LEBENSWEG</small><span id="msLife"></span></section><section><small>WICHTIGER MOMENT</small><span id="msWitness"></span></section></div>'+
          '<article id="msRead" class="ms-read"></article>'+
          '<section class="ms-sources"><strong>GEPRÜFTE QUELLEN</strong><div id="msSources"></div></section>'+
          '<section id="msQuestion" class="ms-question"></section>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
  $("#msClose").addEventListener("click",closeStory);
  installSwipeBack($("#msScroll"),closeStory);
  $("#msPlay")?.addEventListener("click",toggleAudio);
  $("#msBack15")?.addEventListener("click",()=>seekBy(-15));
  $("#msFwd15")?.addEventListener("click",()=>seekBy(15));
  $("#msFollowOpen")?.addEventListener("click",()=>{
    if(isAudioOnlyAge())return;
    if(typeof followReader?.openReadAlong==="function")followReader.openReadAlong();
    else followReader?.open?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
  });
  $("#msProgressTrack")?.addEventListener("click",seekFromProgress);
  $("#msProgressTrack")?.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();seekBy(e.key==="ArrowLeft"?-15:15)}});
  modal.querySelectorAll("[data-ms-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.msMode)));
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("loadedmetadata",()=>{followReader?.restore();updateProgress()});
  audio.addEventListener("play",()=>{playing=true;updatePlayButton()});
  audio.addEventListener("pause",()=>{playing=false;updatePlayButton()});
  audio.addEventListener("ended",()=>{playing=false;updatePlayButton();markDone(active?.id||"");});
  followReader=window.DARKidsFollowReader?.create({
    id:"sahaba-story",audio,
    getContent:()=>{
      const meta=audioMeta(active)||{};
      return{
        key:active?("sahabi:"+active.id+":"+ageKey()):"sahabi:story",
        title:active?(active.name):"Geschichte",
        subtitle:"Ṣaḥābah-Geschichte",
        album:"DĀR AL TAWḤĪD Kids · Mubaschschirūn",
        text:activeText,
        artwork:active?(art(active,"hero")):"",
        deepLink:active?("#stories/sahabi/"+encodeURIComponent(active.id)):"#stories",
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
function closeStory(){followReader?.close();stopAudio();$("#msModal")?.classList.remove("open");unlockLibrary();clearStoryDeepLink("sahabi");active=null}
function renderActive(){
  if(!active)return;
  activeText=textFor(active);
  const hero=$("#msHero");if(hero){hero.src=art(active,"hero");hero.style.objectPosition=heroPos(active);hero.onerror=()=>{hero.onerror=null;hero.src=art(active,"cover")}}
  $("#msTitle").textContent=active.name;
  $("#msArabic").textContent=(active.nameAr||"")+" رضي الله عنه";
  $("#msSummary").textContent=active.summary||"";
  $("#msMeta").innerHTML='<span>'+durationLabel(active,activeText)+'</span><span>Alter '+esc(age())+'</span><span>Lebensgeschichte</span>';
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
  $("#msWitness").textContent=active.storyHighlight||active.witnessContext||active.summary||"";
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
  renderModeButtons();
  const read=$("#msRead");
  if(read)read.hidden=true;
}
function resetAudio(){
  stopAudio();
  const meta=audioMeta(active),note=$("#msVoiceNote");
  if(meta?.url){
    audio.src=meta.url;audio.preload="metadata";
    if(note)note.textContent="Serhat-Stimme · geprüfte Fuṣḥā-Aussprache";
  }else{
    audio.removeAttribute("src");
    if(note)note.textContent=isAudioOnlyAge()?"Das Hörbuch ist gerade nicht verfügbar.":"Der Lesetext ist vollständig. Audio folgt, sobald es freigeschaltet ist.";
  }
  if($("#msProgress"))$("#msProgress").style.width="0";
  if($("#msTimeCurrent"))$("#msTimeCurrent").textContent="0:00";
  if($("#msTimeTotal"))$("#msTimeTotal").textContent="0:00";
  updatePlayButton();
}
function updatePlayButton(){
  const b=$("#msPlay");if(!b)return;
  const meta=audioMeta(active);
  b.disabled=busy||!meta?.url;
  b.textContent=playing?"Pause":(audio.currentTime>0&&!audio.ended?"Weiterhören":(isAudioOnlyAge()?"Hören":(mode()==="both"?"Hören & mitlesen":"Hören")));
}
function storyTime(v){return window.DARKidsFollowReader?.formatTime?window.DARKidsFollowReader.formatTime(v):Math.floor((Number(v)||0)/60)+":"+String(Math.floor((Number(v)||0)%60)).padStart(2,"0")}
function updateProgress(){
  const duration=Number(audio.duration)||0,current=Number(audio.currentTime)||0;
  if($("#msProgress"))$("#msProgress").style.width=(duration?Math.min(100,current/duration*100):0)+"%";
  if($("#msTimeCurrent"))$("#msTimeCurrent").textContent=storyTime(current);
  if($("#msTimeTotal"))$("#msTimeTotal").textContent=storyTime(duration);
  const track=$("#msProgressTrack");
  if(track){track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(Math.max(0,Math.round(duration))));track.setAttribute("aria-valuenow",String(Math.max(0,Math.round(current))));track.setAttribute("aria-valuetext",storyTime(current)+" von "+storyTime(duration))}
}
function seekBy(delta){
  if(!Number(audio.duration))return;
  try{audio.currentTime=Math.max(0,Math.min(audio.duration,(Number(audio.currentTime)||0)+Number(delta||0)))}catch(_){}
  updateProgress();followReader?.persist(true);
}
function seekFromProgress(e){
  const track=$("#msProgressTrack");if(!track||!Number(audio.duration))return;
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
    if($("#msVoiceNote"))$("#msVoiceNote").textContent="Audio ist gerade nicht verfügbar.";
  }finally{busy=false;updatePlayButton()}
}
function stopAudio(){
  followReader?.persist(true);
  try{audio.pause();audio.removeAttribute("src");audio.load()}catch(_){}
  playing=false;busy=false;updatePlayButton();updateProgress();
}
async function init(){
  if(!ensureUi())return;
  try{
    const r=await fetch(DATA_URL+"?v=18",{cache:"no-store"});
    if(!r.ok)throw Error("Mubaschschirūn "+r.status);
    const data=await r.json();
    libraryPolicy=data.policy&&typeof data.policy==="object"?data.policy:{};
    items=(data.items||[]).slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
    renderCards();renderModeButtons();
    try{
      const m=String(location.hash||"").match(/^#stories\/sahabi\/([^/?#]+)/i);
      const id=m?decodeURIComponent(m[1]||""):"";
      if(id&&items.some(x=>x.id===id)){document.querySelector('.nav-btn[data-target="stories"]')?.click();openLibrary();setTimeout(()=>openStory(id),0)}
    }catch(_){};
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