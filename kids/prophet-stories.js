(() => {
"use strict";

const DATA_URL="/kids/data/prophet-stories.json";
const MODE_KEY="kids.contentMode.v21";
const PROPHET_ORDER=[
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];
const PROPHET_RANK=new Map(PROPHET_ORDER.map((id,index)=>[id,index]));
const ART_ROOT="/kids/assets/prophets-v2/";
const DEDICATED_HERO=new Set(PROPHET_ORDER);
function cardUrl(item){return ART_ROOT+encodeURIComponent(item.id)+"-card.jpg?v=21"}
function heroUrl(item){return DEDICATED_HERO.has(item.id)?ART_ROOT+encodeURIComponent(item.id)+"-hero.jpg?v=21":cardUrl(item)}
const DONE_PREFIX="kids.prophetStory.done.";
const MUHAMMAD_EPISODES=[
  {id:"birth",title:"Seine Geburt in Makkah",meta:"MAKKAH · KINDHEIT",duration:"ca. 4 Min.",source:"Qurʾān 93:6",subtitle:"In Makkah beginnt seine Geschichte.",summary:"Muḥammad ﷺ wurde in Makkah geboren und wuchs als Waisenkind auf. Allah erinnert ihn im Qurʾān daran, dass Er ihn als Waisen fand und ihm Schutz gab.",art:"/kids/assets/story-wow/muhammad-hero.jpg?v=22"},
  {id:"wahy",title:"Die erste Offenbarung",meta:"MAKKAH · ḤIRĀʾ",duration:"ca. 5 Min.",source:"Qurʾān 96:1–5",subtitle:"Der Moment, der alles veränderte.",summary:"In der Höhle Ḥirāʾ begann die Offenbarung. Dort wurden die ersten Verse aus Sūrat al-ʿAlaq offenbart.",art:"/kids/assets/story-wow/muhammad-hira.jpg?v=22"},
  {id:"hijrah",title:"Die Hiǧrah nach Madīnah",meta:"VERTRAUEN · GEDULD",duration:"ca. 6 Min.",source:"Qurʾān 9:40",subtitle:"Eine Reise voller Vertrauen.",summary:"Die Auswanderung von Makkah nach Madīnah zeigt Vertrauen auf Allah, Geduld und den Beginn einer neuen Phase für die muslimische Gemeinschaft.",art:"/kids/assets/story-wow/muhammad-route.jpg?v=22"},
  {id:"tawhid",title:"Der Ruf zum Tawḥīd",meta:"MAKKAH · DAʿWAH",duration:"ca. 5 Min.",source:"Qurʾān 6:162–163",subtitle:"Allah allein anbeten.",summary:"Er rief die Menschen dazu, Allah allein anzubeten, und blieb trotz Ablehnung und Widerstand standhaft.",art:"/kids/assets/story-wow/muhammad-hero.jpg?v=22"},
  {id:"madinah",title:"Die Gemeinschaft in Madīnah",meta:"LEHREN · GERECHTIGKEIT",duration:"ca. 6 Min.",source:"Qurʾān 33:21",subtitle:"Glaube wird im Alltag sichtbar.",summary:"In Madīnah lehrte der Prophet ﷺ Gottesdienst, Familie, Nachbarschaft, Gerechtigkeit und Verantwortung.",art:"/kids/assets/story-wow/muhammad-madinah.jpg?v=22"},
  {id:"rahmah",title:"Barmherzigkeit für die Welten",meta:"BOTSCHAFT · CHARAKTER",duration:"ca. 5 Min.",source:"Qurʾān 21:107 · 68:4",subtitle:"Barmherzigkeit und edler Charakter.",summary:"Allah beschreibt seine Sendung als Barmherzigkeit für die Welten und lobt seinen großartigen Charakter.",art:"/kids/assets/story-wow/muhammad-madinah.jpg?v=22"},
  {id:"return",title:"Die Rückkehr nach Makkah",meta:"MAKKAH · RÜCKKEHR",duration:"ca. 6 Min.",source:"Qurʾān 48:1 · 110:1–3",subtitle:"Eine Rückkehr nach Jahren der Prüfung.",summary:"Nach Jahren der Prüfung kehrte der Prophet ﷺ mit den Muslimen nach Makkah zurück. Die Kaʿbah wurde von den Götzen gereinigt und Allah allein gewidmet.",art:"/kids/assets/story-wow/muhammad-hero.jpg?v=22"},
  {id:"khatam",title:"Siegel der Propheten",meta:"ABSCHLUSS · BOTSCHAFT",duration:"ca. 4 Min.",source:"Qurʾān 33:40",subtitle:"Nach ihm kommt kein neuer Prophet.",summary:"Muḥammad ﷺ ist das Siegel der Propheten. Seine Botschaft bestätigt die grundlegende Botschaft der Propheten vor ihm: Allah allein anzubeten.",art:"/kids/assets/story-wow/muhammad-madinah.jpg?v=22"}
]
let items=[],active=null,activeText="",playing=false,busy=false;
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function ageKey(){return age().replace("–","-")}
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"read"}catch(_){return"read"}}
function setMode(v){try{localStorage.setItem(MODE_KEY,v)}catch(_){}renderModeButtons();applyMode()}
function uniqueItems(list){
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
  const ch=Array.isArray(item.chapters)?item.chapters.slice():[];
  if(age()!=="4–5"||ch.length<=4)return ch;
  return [ch[0],ch[1],ch[Math.max(2,ch.length-2)],ch[ch.length-1]];
}
function customScript(item){
  const s=item&&item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  return String(s[ageKey()]||"").trim();
}
function buildText(item){
  const owned=customScript(item);
  if(owned)return owned;
  const parts=[ageIntro(item)].concat(chaptersForAge(item));
  if(age()==="9–10"&&item.older)parts.push(item.older);
  parts.push(ageOutro(item));
  return parts.join("\n\n").replace(/\s+\n/g,"\n").trim();
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
  const current=mode();
  document.querySelectorAll("[data-ps-mode]").forEach(b=>b.classList.toggle("active",b.dataset.psMode===current));
}
function storyRowMarkup(item,index){
  const text=buildText(item);
  const meta=(item.disputed?"IKHTILĀF · ":"QURʾĀN GEPRÜFT · ")+durationLabel(item,text);
  return '<button class="ps-story-row" data-ps-id="'+esc(item.id)+'" type="button">'+
    '<img class="ps-row-scene" src="'+esc(cardUrl(item))+'" data-fallback="'+esc(item.cover||"")+'" alt="" decoding="async" loading="'+(index<4?"eager":"lazy")+'">'+
    '<span class="ps-row-copy"><span class="ps-row-meta">'+esc(meta)+'</span><span class="ps-row-title">'+esc(item.name)+(item.id==="muhammad"?" ﷺ":"")+'</span><span class="ps-row-ar" dir="rtl">'+esc(arabicLine(item))+'</span></span>'+
    '<span class="ps-row-go" aria-hidden="true">›</span>'+(done(item.id)?'<span class="ps-done" aria-label="Abgeschlossen"></span>':'')+'</button>';
}
function renderCards(){
  const grid=$("#psGrid");if(!grid)return;
  const muhammad=items.find(item=>item.id==="muhammad");
  const rest=items.filter(item=>item.id!=="muhammad");
  const special=muhammad?'<button class="ps-muhammad-feature" data-ps-id="muhammad" type="button"><img class="ps-muhammad-feature-art" src="'+esc(heroUrl(muhammad))+'" alt="" decoding="async"><span class="ps-muhammad-feature-shade" aria-hidden="true"></span><span class="ps-muhammad-feature-copy"><span class="ps-muhammad-feature-kicker">★ BESONDERER BEREICH · SIEGEL DER PROPHETEN</span><strong>Prophet Muḥammad ﷺ</strong><span class="ps-muhammad-feature-sub">Sein Leben. Sein Weg. Seine Botschaft.</span><span class="ps-muhammad-feature-cta">Besonderen Bereich öffnen <b aria-hidden="true">→</b></span></span></button>':"";
  grid.innerHTML=special+rest.map((item,index)=>storyRowMarkup(item,index)).join("");
  grid.querySelectorAll("[data-ps-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.psId)));
  grid.querySelectorAll("img.ps-row-scene").forEach(img=>{img.onerror=()=>{const fallback=img.dataset.fallback||"";img.onerror=null;if(fallback)img.src=fallback;}});
  const doneEl=$("#psDoneCount");if(doneEl)doneEl.textContent=String(doneCount());
  const ageEl=$("#psAgeHero");if(ageEl)ageEl.textContent="Alter "+age();
}
function prepareStoriesHome(view){
  const old=$("#authenticStoryList"),oldTitle=old?.previousElementSibling;
  if(old)old.style.display="none";if(oldTitle)oldTitle.style.display="none";
  view.querySelectorAll(".gentle-note").forEach(note=>{if(/Authentische Propheten/i.test(note.textContent||""))note.style.display="none"});
  const pageHead=view.querySelector(".page-head");if(pageHead)pageHead.hidden=false;
  if(!$("#psMuhammadHomeEntry")){
    const special=document.createElement("button");special.id="psMuhammadHomeEntry";special.className="ps-muhammad-home";special.type="button";
    special.innerHTML='<span class="ps-mh-home-art" aria-hidden="true"></span><span class="ps-mh-home-shade" aria-hidden="true"></span><span class="ps-mh-home-copy"><span class="ps-mh-home-kicker">★ BESONDERER BEREICH · ḪĀTAM AN-NABIYYĪN</span><strong>Prophet Muḥammad ﷺ</strong><span class="ps-mh-home-sub">Sein Leben. Sein Weg. Seine Botschaft.</span><span class="ps-mh-home-cta">Geschichten entdecken <b aria-hidden="true">→</b></span></span>';
    if(pageHead)pageHead.insertAdjacentElement("afterend",special);else view.insertBefore(special,view.firstChild);
    special.addEventListener("click",()=>openStory("muhammad"));
  }
  if(!$("#psProphetEntry")){
    const entry=document.createElement("button");entry.id="psProphetEntry";entry.className="ps-prophet-entry";entry.type="button";
    entry.innerHTML='<span class="ps-entry-shade" aria-hidden="true"></span><span class="ps-entry-copy"><span class="ps-entry-kicker">EIGENER BEREICH · QURʾĀN GEPRÜFT</span><strong>Prophetengeschichten</strong><span class="ps-entry-sub">25 Geschichten · lesen &amp; hören</span><span class="ps-entry-cta">Jetzt entdecken <b aria-hidden="true">→</b></span></span>';
    const special=$("#psMuhammadHomeEntry");if(special)special.insertAdjacentElement("afterend",entry);else if(pageHead)pageHead.insertAdjacentElement("afterend",entry);else view.insertBefore(entry,view.firstChild);
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
        '<button class="ps-mode" data-ps-mode="both" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Lesen &amp; Hören</button>'+
        '<button class="ps-mode" data-ps-mode="listen" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Hören</button>'+
        '<button class="ps-mode" data-ps-mode="read" type="button"><span class="ps-mode-icon ps-mode-icon-book" aria-hidden="true"></span>Lesen</button>'+
      '</div>'+
    '</div>'+
    '<div class="ps-library-scroll" id="psLibraryScroll"><div id="psGrid" class="ps-library-list"></div></div>';
  document.body.appendChild(library);
  library.querySelectorAll("[data-ps-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.psMode)));
  $("#psLibraryBack").addEventListener("click",closeLibrary);

  const modal=document.createElement("div");
  modal.className="ps-modal";modal.id="psModal";
  modal.innerHTML=
    '<div class="ps-sheet" role="dialog" aria-modal="true" aria-labelledby="psTitle">'+
      '<div class="ps-top"><button class="ps-close" id="psClose" type="button" aria-label="Zurück zu den Propheten">‹</button></div>'+
      '<div class="ps-scroll" id="psScroll">'+
        '<section class="ps-muhammad-special" id="psMuhammadSpecial" hidden>'+
          '<header class="ps-mh-hero">'+
            '<img class="ps-mh-hero-art" src="/kids/assets/story-wow/muhammad-hero.jpg?v=22" alt="">'+
            '<span class="ps-mh-hero-shade" aria-hidden="true"></span>'+
            '<div class="ps-mh-hero-copy">'+
              '<span class="ps-mh-special-label">★&nbsp;&nbsp;BESONDERER BEREICH</span>'+
              '<div class="ps-mh-title-line"><h2>Prophet<br>Muḥammad</h2><div class="ps-mh-ar" dir="rtl">محمد ﷺ</div></div>'+
              '<p class="ps-mh-tagline">Sein Leben. Sein Weg. Seine Botschaft.</p>'+
              '<p class="ps-mh-intro">Eine besondere Sammlung über den letzten Propheten ﷺ – kindgerecht, authentisch und mit wertvollen Lehren für unseren Alltag.</p>'+
            '</div>'+
          '</header>'+
          '<div class="ps-mh-ornament" aria-hidden="true"><span></span></div>'+
          '<section class="ps-mh-panel ps-mh-way"><div class="ps-mh-panel-art" aria-hidden="true"></div><div class="ps-mh-panel-copy">'+
            '<div class="ps-mh-panel-title"><span class="ps-mh-line-icon ps-mh-line-icon-route" aria-hidden="true"></span><h3>Sein Weg</h3></div>'+
            '<p>Von Makkah nach Madīnah – eine außergewöhnliche Reise voller Vertrauen, Geduld und Licht.</p>'+
            '<button class="ps-mh-discover" type="button" data-mh-action="episode" data-episode="hijrah">Den Weg entdecken</button>'+
          '</div></section>'+
          '<section class="ps-mh-panel ps-mh-message"><div class="ps-mh-panel-art" aria-hidden="true"></div><div class="ps-mh-panel-copy">'+
            '<div class="ps-mh-panel-title"><span class="ps-mh-line-icon ps-mh-line-icon-book" aria-hidden="true"></span><h3>Seine Botschaft</h3></div>'+
            '<p>Worte, die Herzen berühren – über Tawḥīd, Barmherzigkeit und eine bessere Welt.</p>'+
            '<button class="ps-mh-discover" type="button" data-mh-action="episode" data-episode="tawhid">Die Botschaft entdecken</button>'+
          '</div></section>'+
          '<section class="ps-mh-values">'+
            '<div class="ps-mh-values-head"><div class="ps-mh-panel-title"><span class="ps-mh-line-icon ps-mh-line-icon-heart" aria-hidden="true"></span><h3>Werte für Kinder</h3></div><p>Zeitlose Werte aus seinem Leben – eine Inspiration für jeden Tag.</p></div>'+
            '<div class="ps-mh-value-grid">'+
              '<div class="ps-mh-value ps-mh-value-truth"><b class="ps-mh-value-icon ps-mh-value-icon-leaf" aria-hidden="true"></b><strong>Wahrheit</strong></div>'+
              '<div class="ps-mh-value ps-mh-value-mercy"><b class="ps-mh-value-icon ps-mh-value-icon-heart" aria-hidden="true"></b><strong>Barmherzigkeit</strong></div>'+
              '<div class="ps-mh-value ps-mh-value-patience"><b class="ps-mh-value-icon ps-mh-value-icon-mountain" aria-hidden="true"></b><strong>Geduld</strong></div>'+
              '<div class="ps-mh-value ps-mh-value-trust"><b class="ps-mh-value-icon ps-mh-value-icon-hand" aria-hidden="true"></b><strong>Vertrauen</strong></div>'+
            '</div>'+
          '</section>'+
          '<section class="ps-mh-episodes" id="psMhEpisodesSection">'+
            '<div class="ps-mh-section-head"><div><div class="ps-mh-section-title"><span class="ps-mh-line-icon ps-mh-line-icon-book" aria-hidden="true"></span><h3>Geschichten &amp; Hören</h3><i aria-hidden="true"></i></div><p>Entdecke besondere Stationen aus dem Leben des Propheten ﷺ.</p></div><button class="ps-mh-all" type="button" data-mh-action="toggle-all" aria-expanded="false">Alle anzeigen <b aria-hidden="true">→</b></button></div>'+
            '<div class="ps-mh-episode-rail" id="psMhEpisodes"></div><article class="ps-mh-episode-detail" id="psMhEpisodeDetail" hidden></article>'+
          '</section>'+
          '<section class="ps-mh-more">'+
            '<div class="ps-mh-section-head"><div><div class="ps-mh-section-title"><span class="ps-mh-line-icon ps-mh-line-icon-book" aria-hidden="true"></span><h3>Weitere Geschichten</h3><i aria-hidden="true"></i></div></div><button class="ps-mh-all" type="button" data-mh-action="library">Alle anzeigen <b aria-hidden="true">→</b></button></div>'+
            '<div class="ps-mh-more-rail" id="psMhMore"></div>'+
          '</section>'+
          '<nav class="ps-mh-bottom-nav" aria-label="Hauptnavigation">'+
            '<button type="button" data-mh-nav="today"><span class="ps-mh-nav-icon ps-mh-nav-icon-sun" aria-hidden="true"></span><span>Heute</span></button>'+
            '<button class="active" type="button" data-mh-nav="stories"><span class="ps-mh-nav-icon ps-mh-nav-icon-stories" aria-hidden="true"></span><span>Geschichten</span></button>'+
            '<button type="button" data-mh-nav="quran"><span class="ps-mh-nav-icon ps-mh-nav-icon-quran" aria-hidden="true"></span><span>Qurʾān</span></button>'+
            '<button type="button" data-mh-nav="parents"><span class="ps-mh-nav-icon ps-mh-nav-icon-parents" aria-hidden="true"></span><span>Eltern</span></button>'+
          '</nav>'+
        '</section>'+'<div class="ps-hero">'+
          '<span class="ps-detail-sky" aria-hidden="true"></span>'+
          '<span class="ps-detail-land" aria-hidden="true"></span>'+
          '<span class="ps-detail-glow" aria-hidden="true"></span>'+
          '<img id="psHero" src="" alt="">'+
          '<div class="ps-hero-copy">'+
            '<h2 class="ps-title" id="psTitle"></h2>'+
            '<div class="ps-ar" id="psArabic" dir="rtl"></div>'+
            '<p class="ps-summary" id="psSummary"></p>'+
            '<div class="ps-meta" id="psMeta"></div>'+
            '<div class="ps-detail-modes"><button class="ps-detail-mode" data-ps-mode="both" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Lesen &amp; Hören</button><button class="ps-detail-mode" data-ps-mode="listen" type="button"><span class="ps-mode-icon ps-mode-icon-headphones" aria-hidden="true"></span>Hören</button><button class="ps-detail-mode" data-ps-mode="read" type="button"><span class="ps-mode-icon ps-mode-icon-book" aria-hidden="true"></span>Lesen</button></div>'+
          '</div>'+
        '</div>'+
        '<div class="ps-body">'+
          '<div class="ps-player" id="psPlayer"><div class="ps-player-row"><button class="ps-play" id="psPlay" type="button">Hören</button></div><div class="ps-progress"><span id="psProgress"></span></div><div class="ps-player-note" id="psVoiceNote"></div></div>'+
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
  $("#psScroll").addEventListener("scroll",()=>{$("#psModal")?.classList.toggle("scrolled",$("#psScroll").scrollTop>72)},{passive:true});
  modal.addEventListener("click",e=>{
    const open=e.target.closest("[data-ps-open]");if(open){openStory(open.dataset.psOpen);return}
    const nav=e.target.closest("[data-mh-nav]");if(nav){goMuhammadNav(nav.dataset.mhNav);return}
    const action=e.target.closest("[data-mh-action]");
    if(action){
      const kind=action.dataset.mhAction;
      if(kind==="episode"){jumpMuhammadEpisode(action.dataset.episode);return}
      if(kind==="toggle-all"){toggleMuhammadEpisodes(action);return}
      if(kind==="library"){goMuhammadLibrary();return}
    }
    const episode=e.target.closest("[data-mh-episode]");if(episode)openMuhammadEpisode(episode.dataset.mhEpisode);
  });
  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    if($("#psModal")?.classList.contains("open"))closeStory();
    else if($("#psLibraryPage")?.classList.contains("open"))closeLibrary();
  });
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("loadedmetadata",updateProgress);
  audio.addEventListener("ended",()=>{playing=false;updatePlayButton();markDone(active?.id||"");if($("#psVoiceNote"))$("#psVoiceNote").textContent="Geschichte vollständig angehört."});
  audio.addEventListener("play",()=>{playing=true;updatePlayButton()});
  audio.addEventListener("pause",()=>{playing=false;updatePlayButton()});
  return true;
}
function applyMode(){
  const m=mode(),read=$("#psRead"),player=$("#psPlayer");
  renderModeButtons();
  if(!read||!player)return;
  read.hidden=m==="listen";
  player.hidden=m==="read";
}
function renderMuhammadSpecial(){
  const rail=$("#psMhEpisodes"),detail=$("#psMhEpisodeDetail"),more=$("#psMhMore"),section=$("#psMhEpisodesSection"),all=section?.querySelector('[data-mh-action="toggle-all"]');
  if(rail)rail.innerHTML=MUHAMMAD_EPISODES.map(ep=>
    '<button class="ps-mh-episode" type="button" data-mh-episode="'+esc(ep.id)+'">'+
      '<span class="ps-mh-episode-art" style="background-image:url('+esc(ep.art)+')"><span class="ps-mh-time">'+esc(ep.duration||"ca. 5 Min.")+'</span></span>'+
      '<span class="ps-mh-episode-copy"><strong>'+esc(ep.title)+'</strong><small>'+esc(ep.subtitle||ep.meta)+'</small></span>'+
    '</button>'
  ).join("");
  if(more){
    const picks=items.filter(item=>item.id!=="muhammad").slice(0,5);
    more.innerHTML=picks.map(item=>
      '<button class="ps-mh-more-card" type="button" data-ps-open="'+esc(item.id)+'">'+
        '<span class="ps-mh-more-art" style="background-image:url('+esc(cardUrl(item))+')"></span>'+
        '<span class="ps-mh-more-copy"><strong>'+esc(item.name)+'</strong><small>Geschichte entdecken</small></span>'+
      '</button>'
    ).join("");
  }
  if(section)section.classList.remove("expanded");
  if(all){all.setAttribute("aria-expanded","false");all.innerHTML='Alle anzeigen <b aria-hidden="true">→</b>';}
  if(detail){detail.hidden=true;detail.innerHTML="";}
}
function openMuhammadEpisode(id){
  const ep=MUHAMMAD_EPISODES.find(x=>x.id===id),detail=$("#psMhEpisodeDetail");if(!ep||!detail)return;
  const card=document.querySelector('[data-mh-episode="'+id+'"]');
  document.querySelectorAll(".ps-mh-episode.selected").forEach(el=>el.classList.remove("selected"));
  if(card)card.classList.add("selected");
  detail.innerHTML='<span>'+esc(ep.meta)+'</span><h4>'+esc(ep.title)+'</h4><p>'+esc(ep.summary)+'</p><strong>'+esc(ep.source)+'</strong>';
  detail.hidden=false;detail.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function jumpMuhammadEpisode(id){
  const card=document.querySelector('[data-mh-episode="'+id+'"]');
  if(card)card.scrollIntoView({behavior:"smooth",block:"center",inline:"center"});
  setTimeout(()=>openMuhammadEpisode(id),220);
}
function toggleMuhammadEpisodes(button){
  const section=$("#psMhEpisodesSection");if(!section)return;
  const expanded=!section.classList.contains("expanded");
  section.classList.toggle("expanded",expanded);
  if(button){button.setAttribute("aria-expanded",String(expanded));button.innerHTML=expanded?'Weniger <b aria-hidden="true">↑</b>':'Alle anzeigen <b aria-hidden="true">→</b>';}
}
function goMuhammadLibrary(){
  closeStory();
  setTimeout(()=>$("#psLibraryScroll")?.scrollTo({top:0,behavior:"smooth"}),40);
}
function goMuhammadNav(target){
  closeStory();
  setTimeout(()=>{
    if($("#psLibraryPage")?.classList.contains("open"))closeLibrary();
    setTimeout(()=>document.querySelector('.bottom-nav .nav-btn[data-target="'+target+'"]')?.click(),30);
  },30);
}
function renderActive(){
  if(!active)return;activeText=buildText(active);
  const isMuhammad=active.id==="muhammad",modal=$("#psModal"),special=$("#psMuhammadSpecial"),hero=$(".ps-hero");
  if(modal)modal.classList.toggle("ps-muhammad-open",isMuhammad);if(special)special.hidden=!isMuhammad;
  if(hero){hero.hidden=isMuhammad;hero.setAttribute("data-ps-id",active.id);hero.setAttribute("data-hero-copy",DEDICATED_HERO.has(active.id)?"left":"right")}
  if(isMuhammad)renderMuhammadSpecial();
  const heroImg=$("#psHero");if(heroImg){heroImg.onerror=()=>{heroImg.onerror=null;const card=cardUrl(active);if(heroImg.src!==card)heroImg.src=card;else if(active.cover)heroImg.src=active.cover;};heroImg.src=heroUrl(active);heroImg.alt="";}
  $("#psTitle").textContent=active.name+(isMuhammad?" ﷺ":"");$("#psArabic").textContent=arabicLine(active);$("#psSummary").textContent=active.summary||"";
  $("#psMeta").innerHTML='<span class="ps-pill"><span class="ps-pill-icon ps-pill-icon-clock" aria-hidden="true"></span>'+esc(durationLabel(active,activeText))+'</span><span class="ps-pill"><span class="ps-pill-icon ps-pill-icon-age" aria-hidden="true"></span>Alter '+esc(age())+'</span><span class="ps-pill"><span class="ps-pill-icon ps-pill-icon-book" aria-hidden="true"></span>Qurʾān · geprüft</span>'+(active.disputed?'<span class="ps-pill warn">Prophetenstatus: Ikhtilāf</span>':'');
  $("#psRead").innerHTML=activeText.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");$("#psSources").textContent=(active.sourceRefs||[]).join(" · ");renderQuestion();applyMode();resetAudioForActive();
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
function closeStory(){stopAudio();$("#psModal")?.classList.remove("open","scrolled");unlockPage();active=null}
function resetAudioForActive(){
  stopAudio();
  const meta=audioMeta(active);
  const note=$("#psVoiceNote");
  if(meta&&meta.url){
    audio.src=meta.url;
    audio.preload="metadata";
    if(note)note.textContent="";
  }else{
    audio.removeAttribute("src");
    if(note)note.textContent="Die Geschichte kann gelesen werden.";
  }
  $("#psProgress").style.width="0";
  updatePlayButton();
}
function updateProgress(){
  const p=audio.duration?Math.min(100,audio.currentTime/audio.duration*100):0;
  if($("#psProgress"))$("#psProgress").style.width=p+"%";
}
function updatePlayButton(){
  const b=$("#psPlay");if(!b)return;
  const meta=audioMeta(active);
  b.disabled=busy||!meta?.url;
  if(playing)b.textContent="Pause";
  else if(audio.currentTime>0&&!audio.ended)b.textContent="Weiterhören";
  else b.textContent="Hören";
}
async function toggleAudio(){
  if(!active||busy)return;
  const meta=audioMeta(active);
  if(!meta?.url)return;
  if(playing){audio.pause();return}
  try{
    busy=true;updatePlayButton();
    if(!audio.src)audio.src=meta.url;
    await audio.play();
    busy=false;playing=true;updatePlayButton();
  }catch(err){
    busy=false;playing=false;updatePlayButton();
    const note=$("#psVoiceNote");if(note)note.textContent="Die Geschichte kann gelesen werden.";
  }
}
function stopAudio(){
  try{audio.pause();audio.currentTime=0}catch(_){}
  playing=false;busy=false;
  try{audio.removeAttribute("src");audio.load()}catch(_){}
  updatePlayButton();
}
async function init(){
  if(!ensureUi())return;
  try{
    const r=await fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw new Error("Propheten-Geschichten "+r.status);
    const data=await r.json();
    items=uniqueItems(data.items);
    renderCards();renderModeButtons();
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