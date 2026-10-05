(() => {
"use strict";

const DATA_URL="/kids/data/prophet-stories.json";
const KIDS_STORY_INTRO="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, liebe Kinder.";
const KIDS_STORY_OUTRO="Und الله weiß es am besten.\n\nMöge الله euch nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses, schenken.\n\nAs-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
function normalizeKidsStoryText(value){
  let text=String(value||"").trim();
  if(!text)return"";
  if(!text.startsWith(KIDS_STORY_INTRO))text=KIDS_STORY_INTRO+"\n\n"+text;
  if(!text.endsWith(KIDS_STORY_OUTRO))text=text+"\n\n"+KIDS_STORY_OUTRO;
  return text;
}
const STORIES_FINAL_CSS="/kids/stories-final-v1088.css?v=1088";
(function installStoriesFinalCss(){
  if(document.querySelector('link[data-kids-stories-final="1088"]'))return;
  const link=document.createElement("link");
  link.rel="stylesheet";
  link.href=STORIES_FINAL_CSS;
  link.dataset.kidsStoriesFinal="1088";
  document.head.appendChild(link);
})();
const MODE_KEY="kids.contentMode.v19";
const PROPHET_ORDER=[
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];
const PROPHET_RANK=new Map(PROPHET_ORDER.map((id,index)=>[id,index]));
const ART_ROOT="/kids/assets/prophets-v2/";
const DEDICATED_HERO=new Set(PROPHET_ORDER);
function cardUrl(item){return ART_ROOT+encodeURIComponent(item.id)+"-card.jpg?v=22"}
function heroUrl(item){return DEDICATED_HERO.has(item.id)?ART_ROOT+encodeURIComponent(item.id)+"-hero.jpg?v=22":cardUrl(item)}
const DONE_PREFIX="kids.prophetStory.done.";
let items=[],active=null,activeText="",playing=false,busy=false,followReader=null;\nconst audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function ageKey(){return age().replace("–","-")}
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
}\nfunction uniqueItems(list)function uniqueItems(list){
  const seen=new Set();
  return (Array.isArray(list)?list:[])
    .filter(x=>x&&x.id&&!seen.has(x.id)&&(seen.add(x.id),true))
    .sort((a,b)=>(PROPHET_RANK.get(a.id)??999)-(PROPHET_RANK.get(b.id)??999));
}
function honorific(item){
  if(!item)return"";
  if(item.id==="muhammad")return"ﷺ";
  if(item.disputed)return"";
  return item.honorific||"عليه السلام";
}
function arabicLine(item){
  const h=item.id==="muhammad"?"ﷺ":(item.disputed?"":"عليه السلام");
  return [item.nameAr||"",h].filter(Boolean).join(" ");
}
function ageIntro(item){
  if(age()==="4–5"){
    return "Komm, wir hören aufmerksam zu. Jetzt geht es um "+item.name+". Diese Geschichte stammt aus geprüften Qurʾān-Belegen. Wir erzählen sie ruhig und einfach und fügen keine erfundenen Abenteuer hinzu.";
  }
  if(age()==="9–10"){
    return "Bevor wir beginnen, merk dir einen wichtigen Grundsatz: Diese Erzählung über "+item.name+" folgt den geprüften Qurʾān-Belegen des DĀR-AL-TAWḤĪD-Prophetenprofils. Wir unterscheiden bewusst zwischen sicherem Wissen und späteren Ausschmückungen. Achte beim Zuhören darauf, welche Entscheidungen, Prüfungen und Lehren der Qurʾān selbst hervorhebt.";
  }
  return "Mach es dir bequem und hör aufmerksam zu. Heute geht es um "+item.name+". Die Geschichte ist aus geprüften Qurʾān-Belegen zusammengefasst. Wir bleiben bei dem, was zuverlässig berichtet ist, und machen aus unbekannten Einzelheiten keine erfundenen Abenteuer. Achte besonders darauf, was diese Geschichte über Tawḥīd, Vertrauen, Geduld und Gehorsam gegenüber Allah lehrt.";
}
function ageOutro(item){
  if(item.disputed){
    return "Am Ende ist hier besonders wichtig: Dhū l-Kifl wird im Qurʾān lobend genannt. Sein genauer Prophetenstatus wurde von Gelehrten unterschiedlich beurteilt. Darum behaupten wir nicht mehr, als die Quellen sicher tragen. Genau so lernen wir, Wissen ehrlich und sorgfältig weiterzugeben.";
  }
  if(age()==="4–5"){
    return "Jetzt denk noch einmal an den wichtigsten Punkt der Geschichte. Allah kennt Seine Diener, hilft, prüft und führt. Wir lernen aus den Propheten, Allah zu gehorchen, Ihm zu vertrauen und nach einem Fehler wieder zu Ihm zurückzukehren. Gleich kommt eine kleine Frage für dich.";
  }
  if(age()==="9–10"){
    return "Fass die Geschichte noch einmal im Kopf zusammen: Was war der Auftrag dieses Propheten? Welche Prüfung kam vor? Wie zeigte sich Gehorsam gegenüber Allah? Genau diese Fragen helfen, Qurʾān-Geschichten nicht nur zu hören, sondern ihre Botschaft zu verstehen. Die verwendeten Qurʾān-Stellen findest du direkt unter der Erzählung.";
  }
  return "Bevor du zur Frage weitergehst, denk noch einmal an die wichtigsten Punkte. Die Propheten riefen zu Allah, hielten in Prüfungen an der Wahrheit fest und vertrauten auf Seine Führung. Die Geschichte soll nicht nur spannend sein, sondern dir helfen, die Botschaft des Qurʾān zu verstehen. Die genauen Qurʾān-Stellen stehen direkt unter der Erzählung.";
}
function chaptersForAge(item){
  return Array.isArray(item.chapters)?item.chapters.slice():[];
}
function customScript(item){
  const policy=window.DARKidsStoryPolicy;
  if(policy?.canonicalText)return String(policy.canonicalText(item)||"").trim();
  const s=item&&item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  return [s["4-5"],s["6-8"],s["9-10"],item?.voiceScript]
    .map(v=>String(v||"").trim()).filter(Boolean)
    .sort((a,b)=>(b.match(/\S+/g)||[]).length-(a.match(/\S+/g)||[]).length||b.length-a.length)[0]||"";
}
function buildText(item){
  const owned=customScript(item);
  if(owned)return normalizeKidsStoryText(owned);
  const parts=chaptersForAge(item);
  if(item?.older)parts.push(item.older);
  return normalizeKidsStoryText(parts.join("\n\n").replace(/\s+\n/g,"\n").trim());
}
function words(text){return(String(text).match(/\S+/g)||[]).length}
function audioMeta(item){return item&&item.audio&&item.audio[ageKey()]?item.audio[ageKey()]:null}
function durationLabel(item,text){
  const m=audioMeta(item);
  if(m&&Number(m.durationSec)>0)return"ca. "+Math.max(1,Math.round(Number(m.durationSec)/60))+" Min.";
  return"ca. "+Math.max(2,Math.min(8,Math.ceil(words(text)/105)))+" Min.";
}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function doneCount(){return items.reduce((n,item)=>n+(done(item.id)?1:0),0)}
function markDone(id){if(!id)return;try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){}renderCards()}

function renderModeButtons(){
  const audioOnly=isAudioOnlyAge();
  const detailModes=document.querySelector(".ps-detail-modes");
  const libraryModes=document.querySelector("#psModes");
  const toolbar=libraryModes?.closest(".ps-toolbar");
  if(detailModes)detailModes.hidden=audioOnly;
  if(libraryModes)libraryModes.hidden=audioOnly;
  if(toolbar)toolbar.hidden=audioOnly;
  const current=audioOnly?"listen":mode();
  document.querySelectorAll("[data-ps-mode]").forEach(b=>b.classList.toggle("active",b.dataset.psMode===current));
}
function renderMuhammadFeature(){
  const host=$("#psMuhammadFeature");
  if(!host)return;
  const item=items.find(x=>x.id==="muhammad");
  if(!item){host.innerHTML="";return}
  const text=buildText(item);
  const meta=durationLabel(item,text);
  host.innerHTML=
    '<button class="ps-muhammad-card" data-ps-id="muhammad" type="button">'+
      '<span class="ps-muhammad-visual" aria-hidden="true"><img src="'+esc(cardUrl(item))+'" data-fallback="'+esc(item.cover||"")+'" alt="" decoding="async" fetchpriority="high"></span>'+
      '<span class="ps-muhammad-panel">'+
        '<span class="ps-muhammad-kicker">BESONDERER BEREICH · SIEGEL DER PROPHETEN</span>'+
        '<span class="ps-muhammad-title">Prophet Muhammad ﷺ</span>'+
        '<span class="ps-muhammad-ar" dir="rtl">'+esc(arabicLine(item))+'</span>'+
        '<span class="ps-muhammad-meta">'+esc(meta)+'</span>'+
        '<span class="ps-muhammad-cta"><span>Geschichte öffnen</span><span class="ps-muhammad-go" aria-hidden="true">›</span></span>'+
      '</span>'+
      (done(item.id)?'<span class="ps-done ps-muhammad-done" aria-label="Abgeschlossen"></span>':'')+
    '</button>';
  const btn=host.querySelector("[data-ps-id='muhammad']");
  if(btn)btn.addEventListener("click",()=>openStory("muhammad"));
  const img=host.querySelector("img");
  if(img)img.onerror=()=>{
    const fallback=img.dataset.fallback||"";
    img.onerror=null;
    if(fallback)img.src=fallback;
  };
}
function renderCards(){
  const grid=$("#psGrid");if(!grid)return;
  renderMuhammadFeature();
  const regularItems=items.filter(item=>item.id!=="muhammad");
  grid.innerHTML=regularItems.map((item,index)=>{
    const text=buildText(item);
    const meta=(item.disputed?"IKHTILĀF · ":"")+durationLabel(item,text);
    return '<button class="ps-story-row" data-ps-id="'+esc(item.id)+'" type="button">'+
      '<img class="ps-row-scene" src="'+esc(cardUrl(item))+'" data-fallback="'+esc(item.cover||"")+'" alt="" decoding="async" loading="lazy">'+
      '<span class="ps-row-copy">'+
        '<span class="ps-row-meta">'+esc(meta)+'</span>'+
        '<span class="ps-row-title">'+esc(item.name)+'</span>'+
        '<span class="ps-row-ar" dir="rtl">'+esc(arabicLine(item))+'</span>'+
      '</span>'+
      '<span class="ps-row-go" aria-hidden="true">›</span>'+
      (done(item.id)?'<span class="ps-done" aria-label="Abgeschlossen"></span>':'')+
    '</button>';
  }).join("");
  grid.querySelectorAll("[data-ps-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.psId)));
  grid.querySelectorAll("img.ps-row-scene").forEach(img=>{
    img.onerror=()=>{
      const fallback=img.dataset.fallback||"";
      img.onerror=null;
      if(fallback)img.src=fallback;
    };
  });
  const doneEl=$("#psDoneCount");if(doneEl)doneEl.textContent=String(doneCount());
  const ageEl=$("#psAgeHero");if(ageEl)ageEl.textContent="Alter "+age();
  const entrySub=$("#psProphetEntry .ps-entry-sub");
  if(entrySub)entrySub.textContent=isAudioOnlyAge()?"25 Hörgeschichten":"25 Geschichten · lesen & hören";
}
function prepareStoriesHome(view){
  const old=$("#authenticStoryList");
  const oldTitle=old?.previousElementSibling;
  if(old)old.style.display="none";
  if(oldTitle)oldTitle.style.display="none";
  view.querySelectorAll(".gentle-note").forEach(note=>{
    if(/Authentische Propheten/i.test(note.textContent||""))note.style.display="none";
  });

  const pageHead=view.querySelector(".page-head");
  if(pageHead)pageHead.hidden=false;

  if(!$("#psProphetEntry")){
    const entry=document.createElement("button");
    entry.id="psProphetEntry";
    entry.className="ps-prophet-entry";
    entry.type="button";
    entry.innerHTML=
      '<span class="ps-entry-visual" aria-hidden="true"><img src="/kids/assets/stories-home/prophets-v1133.webp?v=1136" alt="" decoding="async" loading="eager"></span>'+
      '<span class="ps-entry-panel">'+
        '<span class="ps-entry-copy">'+
          '<span class="ps-entry-kicker">GESCHICHTEN DER PROPHETEN</span>'+
          '<strong>Prophetengeschichten</strong>'+
          '<span class="ps-entry-sub">'+(isAudioOnlyAge()?'25 Hörgeschichten':'25 Geschichten · lesen &amp; hören')+'</span>'+
        '</span>'+
        '<span class="ps-entry-action"><span>Entdecken</span><span class="ps-entry-go" aria-hidden="true">›</span></span>'+
      '</span>';
    if(pageHead)pageHead.insertAdjacentElement("afterend",entry);
    else view.insertBefore(entry,view.firstChild);
    entry.addEventListener("click",openLibrary);
  }
}
function openLibrary(){
  const page=$("#psLibraryPage");if(!page)return;
  page.classList.add("open");
  page.removeAttribute("aria-hidden");
  document.documentElement.classList.add("ps-library-open");
  const app=$(".app");
  if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
  const scroll=$("#psLibraryScroll");if(scroll)scroll.scrollTop=0;
  setTimeout(()=>$("#psLibraryBack")?.focus(),0);
}
function closeLibrary(){
  if($("#psModal")?.classList.contains("open"))return;
  const page=$("#psLibraryPage");if(!page)return;
  page.classList.remove("open");
  page.setAttribute("aria-hidden","true");
  document.documentElement.classList.remove("ps-library-open");
  const app=$(".app");
  if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
  setTimeout(()=>$("#psProphetEntry")?.focus(),0);
}
function ensureUi(){
  const view=$("#view-stories");if(!view||$("#psLibraryPage"))return false;
  view.classList.add("ps-world-view","ps-stories-home");
  prepareStoriesHome(view);

  const library=document.createElement("section");
  library.id="psLibraryPage";
  library.className="ps-library-page";
  library.setAttribute("aria-hidden","true");
  library.innerHTML=
    '<div class="ps-library-nav">'+
      '<button class="ps-library-back" id="psLibraryBack" type="button" aria-label="Zurück zu Geschichten">‹</button>'+
      '<div class="ps-library-nav-copy"><strong>Propheten</strong><span>25 geprüfte Geschichten</span></div>'+
    '</div>'+
    '<div class="ps-toolbar">'+
      '<div class="ps-modes" id="psModes">'+
        '<button class="ps-mode" data-ps-mode="both" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Hören &amp; Mitlesen</button>'+
        '<button class="ps-mode" data-ps-mode="listen" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Hören</button>'+
        '<button class="ps-mode" data-ps-mode="read" type="button"><span class="ps-mode-icon ps-mode-icon-book" aria-hidden="true"></span>Lesen</button>'+
      '</div>'+
    '</div>'+
    '<div class="ps-library-scroll" id="psLibraryScroll">'+
      '<div id="psMuhammadFeature" class="ps-muhammad-feature"></div>'+
      '<div class="ps-sequence-head"><span>IN REIHENFOLGE</span><strong>Die Propheten</strong><small>Danach geht es chronologisch von Ādam bis ʿĪsā weiter.</small></div>'+
      '<div id="psGrid" class="ps-library-list"></div>'+
    '</div>';
  document.body.appendChild(library);
  library.querySelectorAll("[data-ps-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.psMode)));
  $("#psLibraryBack").addEventListener("click",closeLibrary);

  const modal=document.createElement("div");
  modal.className="ps-modal";modal.id="psModal";
  modal.innerHTML=
    '<div class="ps-sheet" role="dialog" aria-modal="true" aria-labelledby="psTitle">'+
      '<div class="ps-top"><button class="ps-close" id="psClose" type="button" aria-label="Zurück zu den Propheten">‹</button></div>'+
      '<div class="ps-scroll" id="psScroll">'+
        '<div class="ps-hero">'+
          '<span class="ps-detail-sky" aria-hidden="true"></span>'+
          '<span class="ps-detail-land" aria-hidden="true"></span>'+
          '<span class="ps-detail-glow" aria-hidden="true"></span>'+
          '<img id="psHero" src="" alt="">'+
          '<div class="ps-hero-copy">'+
            '<h2 class="ps-title" id="psTitle"></h2>'+
            '<div class="ps-ar" id="psArabic" dir="rtl"></div>'+
            '<p class="ps-summary" id="psSummary"></p>'+
            '<div class="ps-meta" id="psMeta"></div>'+
            '<div class="ps-detail-modes"><button class="ps-detail-mode" data-ps-mode="both" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Hören &amp; Mitlesen</button><button class="ps-detail-mode" data-ps-mode="listen" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Hören</button><button class="ps-detail-mode" data-ps-mode="read" type="button"><span class="ps-mode-icon ps-mode-icon-book" aria-hidden="true"></span>Lesen</button></div>'+
          '</div>'+
        '</div>'+
        '<div class="ps-body">'+
          '<div class="ps-player" id="psPlayer"><div class="story-local-controls"><button class="story-skip" id="psBack15" type="button" aria-label="15 Sekunden zurück">−15 s</button><button class="ps-play" id="psPlay" type="button">Hören</button><button class="story-skip" id="psFwd15" type="button" aria-label="15 Sekunden vor">+15 s</button></div><div class="ps-progress" id="psProgressTrack" role="slider" tabindex="0" aria-label="Wiedergabeposition"><span id="psProgress"></span></div><div class="ps-player-time"><strong id="psTimeCurrent">0:00</strong><span id="psTimeTotal">0:00</span></div><button class="ps-follow-open" id="psFollowOpen" type="button">Hören &amp; Mitlesen</button><div class="ps-player-note" id="psVoiceNote"></div></div>'+
          '<article class="ps-read" id="psRead"></article>'+
          '<div class="ps-sources"><strong>QUELLEN</strong><div id="psSources"></div></div>'+
          '<div class="ps-question" id="psQuestion"></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-ps-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.psMode)));
  $("#psClose").addEventListener("click",closeStory);
  $("#psPlay").addEventListener("click",toggleAudio);
  $("#psBack15")?.addEventListener("click",()=>seekBy(-15));
  $("#psFwd15")?.addEventListener("click",()=>seekBy(15));
  $("#psFollowOpen")?.addEventListener("click",()=>{
    if(isAudioOnlyAge())return;
    if(typeof followReader?.openReadAlong==="function")followReader.openReadAlong();
    else followReader?.open?.();
    if(audioMeta(active)?.url&&audio.paused)void toggleAudio();
  });
  $("#psProgressTrack")?.addEventListener("click",seekFromProgress);
  $("#psProgressTrack")?.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();seekBy(e.key==="ArrowLeft"?-15:15)}});
  $("#psScroll").addEventListener("scroll",()=>{$("#psModal")?.classList.toggle("scrolled",$("#psScroll").scrollTop>72)},{passive:true});
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    if($("#psModal")?.classList.contains("open"))closeStory();
    else if($("#psLibraryPage")?.classList.contains("open"))closeLibrary();
  });
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("loadedmetadata",()=>{followReader?.restore();updateProgress()});
  audio.addEventListener("play",()=>{playing=true;updatePlayButton()});
  audio.addEventListener("pause",()=>{playing=false;updatePlayButton()});
  audio.addEventListener("ended",()=>{playing=false;updatePlayButton();markDone(active?.id||"");if($("#psVoiceNote"))$("#psVoiceNote").textContent="Geschichte vollständig angehört."; });
  followReader=window.DARKidsFollowReader?.create({
    id:"prophet-story",audio,
    getContent:()=>{
      const meta=audioMeta(active)||{};
      return{
        key:active?("prophet:"+active.id+":"+ageKey()):"prophet:story",
        title:active?(active.name+(active.id==="muhammad"?" ﷺ":"")):"Geschichte",
        subtitle:"Prophetengeschichte",
        album:"DĀR AL TAWḤĪD Kids · Propheten",
        text:activeText,
        artwork:active?(heroUrl(active)):"",
        deepLink:active?("#stories/prophet/"+encodeURIComponent(active.id)):"#stories",
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
function applyMode(){
  const read=$("#psRead"),player=$("#psPlayer"),follow=$("#psFollowOpen");
  renderModeButtons();
  if(!read||!player)return;
  if(isAudioOnlyAge()){
    read.hidden=true;
    player.hidden=false;
    if(follow){
      follow.hidden=true;
      follow.setAttribute("aria-hidden","true");
      follow.tabIndex=-1;
    }
    return;
  }
  const m=mode();
  read.hidden=m==="listen";
  player.hidden=m==="read";
  if(follow){follow.hidden=false;follow.removeAttribute("aria-hidden");follow.tabIndex=0;follow.textContent="Mitlesen öffnen";follow.setAttribute("aria-label","Mitlesen öffnen")}
}
function renderActive(){
  if(!active)return;
  activeText=buildText(active);
  const hero=$(".ps-hero");if(hero){hero.setAttribute("data-ps-id",active.id);hero.setAttribute("data-hero-copy",DEDICATED_HERO.has(active.id)?"left":"right")}
  const heroImg=$("#psHero");if(heroImg){
    heroImg.onerror=()=>{
      heroImg.onerror=null;
      const card=cardUrl(active);
      if(heroImg.src!==card)heroImg.src=card;
      else if(active.cover)heroImg.src=active.cover;
    };
    heroImg.src=heroUrl(active);
    heroImg.alt="";
  }
  $("#psTitle").textContent=active.name+(active.id==="muhammad"?" ﷺ":"");
  $("#psArabic").textContent=arabicLine(active);
  $("#psSummary").textContent=active.summary||"";
  $("#psMeta").innerHTML=
    '<span class="ps-pill"><span class="ps-pill-icon ps-pill-icon-clock" aria-hidden="true"></span>'+esc(durationLabel(active,activeText))+'</span>'+
    '<span class="ps-pill"><span class="ps-pill-icon ps-pill-icon-age" aria-hidden="true"></span>Alter '+esc(age())+'</span>'+

    (active.disputed?'<span class="ps-pill warn">Prophetenstatus: Ikhtilāf</span>':'');
  $("#psRead").innerHTML=activeText.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#psSources").textContent=(active.sourceRefs||[]).join(" · ");
  renderQuestion();
  applyMode();
  resetAudioForActive();
}
function renderQuestion(){
  const q=$("#psQuestion");if(!q||!active)return;
  q.innerHTML='<div class="ps-kicker">HAST DU GUT AUFGEPASST?</div><h4>'+esc(active.question)+'</h4>'+
    (active.answers||[]).map((a,i)=>'<button class="ps-answer" data-ps-answer="'+i+'" type="button">'+esc(a)+'</button>').join("")+
    '<div class="ps-feedback" id="psFeedback"></div>';
  q.querySelectorAll("[data-ps-answer]").forEach(b=>b.addEventListener("click",()=>{
    const i=Number(b.dataset.psAnswer);
    if(i===Number(active.correct||0)){b.classList.add("good");$("#psFeedback").textContent="Richtig. Gut aufgepasst.";markDone(active.id)}
    else{b.classList.add("bad");$("#psFeedback").textContent="Hör oder lies noch einmal in Ruhe nach.";setTimeout(()=>b.classList.remove("bad"),900)}
  }));
}
function lockPage(){
  document.documentElement.classList.add("ps-modal-open");
  const library=$("#psLibraryPage");
  if(library?.classList.contains("open")){
    library.setAttribute("inert","");
    library.setAttribute("aria-hidden","true");
    return;
  }
  [".shell",".bottom-nav"].forEach(sel=>{const el=$(sel);if(el){el.setAttribute("inert","");el.setAttribute("aria-hidden","true")}});
}
function unlockPage(){
  document.documentElement.classList.remove("ps-modal-open");
  const library=$("#psLibraryPage");
  if(library?.classList.contains("open")){
    library.removeAttribute("inert");
    library.removeAttribute("aria-hidden");
    setTimeout(()=>$("#psLibraryBack")?.focus(),0);
    return;
  }
  [".shell",".bottom-nav"].forEach(sel=>{const el=$(sel);if(el){el.removeAttribute("inert");el.removeAttribute("aria-hidden")}});
}
function openStory(id){
  active=items.find(x=>x.id===id);if(!active)return;
  stopAudio();renderActive();$("#psModal").classList.remove("scrolled");$("#psModal").classList.add("open");lockPage();$("#psScroll").scrollTop=0;$("#psClose")?.focus();
}
function closeStory(){followReader?.close();stopAudio();$("#psModal")?.classList.remove("open","scrolled");unlockPage();clearStoryDeepLink("prophet");active=null}
function resetAudioForActive(){
  stopAudio();
  const meta=audioMeta(active),note=$("#psVoiceNote");
  if(meta?.url){
    audio.src=meta.url;audio.preload="metadata";
    if(note)note.textContent="";
  }else{
    audio.removeAttribute("src");
    if(note)note.textContent=isAudioOnlyAge()?"Das Hörbuch ist gerade nicht verfügbar.":"Die Geschichte kann gelesen werden.";
  }
  if($("#psProgress"))$("#psProgress").style.width="0";
  if($("#psTimeCurrent"))$("#psTimeCurrent").textContent="0:00";
  if($("#psTimeTotal"))$("#psTimeTotal").textContent="0:00";
  updatePlayButton();
}
function updatePlayButton(){
  const b=$("#psPlay");if(!b)return;
  const meta=audioMeta(active);
  b.disabled=busy||!meta?.url;
  b.textContent=playing?"Pause":(audio.currentTime>0&&!audio.ended?"Weiterhören":(isAudioOnlyAge()?"Hören":(mode()==="both"?"Hören & mitlesen":"Hören")));
}
function storyTime(v){return window.DARKidsFollowReader?.formatTime?window.DARKidsFollowReader.formatTime(v):Math.floor((Number(v)||0)/60)+":"+String(Math.floor((Number(v)||0)%60)).padStart(2,"0")}
function updateProgress(){
  const duration=Number(audio.duration)||0,current=Number(audio.currentTime)||0;
  if($("#psProgress"))$("#psProgress").style.width=(duration?Math.min(100,current/duration*100):0)+"%";
  if($("#psTimeCurrent"))$("#psTimeCurrent").textContent=storyTime(current);
  if($("#psTimeTotal"))$("#psTimeTotal").textContent=storyTime(duration);
  const track=$("#psProgressTrack");
  if(track){track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(Math.max(0,Math.round(duration))));track.setAttribute("aria-valuenow",String(Math.max(0,Math.round(current))));track.setAttribute("aria-valuetext",storyTime(current)+" von "+storyTime(duration))}
}
function seekBy(delta){
  if(!Number(audio.duration))return;
  try{audio.currentTime=Math.max(0,Math.min(audio.duration,(Number(audio.currentTime)||0)+Number(delta||0)))}catch(_){}
  updateProgress();followReader?.persist(true);
}
function seekFromProgress(e){
  const track=$("#psProgressTrack");if(!track||!Number(audio.duration))return;
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
    if($("#psVoiceNote"))$("#psVoiceNote").textContent="Audio ist gerade nicht verfügbar.";
  }finally{busy=false;updatePlayButton()}
}
function stopAudio(){
  followReader?.persist(true);
  try{audio.pause();audio.removeAttribute("src");audio.load()}catch(_){}
  playing=false;busy=false;updatePlayButton();updateProgress();
}
async function init(){async function init(){
  if(!ensureUi())return;
  try{
    const r=await fetch(DATA_URL+"?v=28",{cache:"force-cache"});
    if(!r.ok)throw new Error("Propheten-Geschichten "+r.status);
    const data=await r.json();
    items=uniqueItems(data.items);
    renderCards();renderModeButtons();
    try{
      const m=String(location.hash||"").match(/^#stories\/prophet\/([^/?#]+)/i);
      const id=m?decodeURIComponent(m[1]||""):"";
      if(id&&items.some(x=>x.id===id)){document.querySelector('.nav-btn[data-target="stories"]')?.click();openLibrary();setTimeout(()=>openStory(id),0)}
    }catch(_){};
    const app=$(".app");
    if(app&&"MutationObserver" in window){
      new MutationObserver(()=>{renderCards();if(active){renderActive()}}).observe(app,{attributes:true,attributeFilter:["data-age"]});
    }
  }catch(err){
    const grid=$("#psGrid");if(grid)grid.innerHTML='<div class="gentle-note">Die Propheten-Geschichten konnten gerade nicht geladen werden.</div>';
    console.warn("[DĀR Kids Prophet Stories]",err);
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.DARKidsProphetStories={open:openStory,openLibrary,closeLibrary,stop:stopAudio};
})();