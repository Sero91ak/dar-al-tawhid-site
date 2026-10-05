(() => {
"use strict";
const SOURCES=[
  {id:"prophets",label:"Propheten",kicker:"GESCHICHTEN DER PROPHETEN",url:"/kids/data/prophet-stories.json?v=28",countLabel:"25 Geschichten",kind:"prophet"},
  {id:"sahaba",label:"Ṣaḥābah",kicker:"DIE GEFÄHRTEN",url:"/kids/data/mubashshirun-stories.json?v=18",countLabel:"10 Geschichten",kind:"sahabi"},
  {id:"sahabiyyat",label:"Ṣaḥābiyyāt",kicker:"DIE FRAUEN DER ERSTEN GENERATION",url:"/kids/data/sahabiyyat-stories.json?v=18",countLabel:"14 Geschichten",kind:"sahabiyyah"}
];
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const audio=new Audio(); audio.preload="metadata"; audio.setAttribute("playsinline","");
let catalog={},activeCategory="prophets",active=null,playing=false,busy=false,reader=null,lastFocus=null;
function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function ageKey(){return age().replace("–","-")}
function isYoung(){return age()==="4–5"}
function category(){return SOURCES.find(x=>x.id===activeCategory)||SOURCES[0]}
function textFor(item){
  if(!item)return"";
  const scripts=item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  let text=String(scripts[ageKey()]||scripts["9-10"]||scripts["6-8"]||scripts["4-5"]||item.voiceScript||"").trim();
  if(!text&&Array.isArray(item.chapters))text=item.chapters.join("\n\n");
  if(!text&&Array.isArray(item.blocks))text=item.blocks.join("\n\n");
  return text;
}
function audioMeta(item){return item&&item.audio&&item.audio[ageKey()]?item.audio[ageKey()]:null}
function artFor(item,cat=activeCategory,hero=false){
  if(!item)return"";
  if(cat==="prophets")return "/kids/assets/prophets-v2/"+encodeURIComponent(item.id)+(hero?"-hero.jpg?v=22":"-card.jpg?v=22");
  return String((hero&&item.hero)||item.cover||item.hero||"");
}
function honorific(item,cat=activeCategory){
  if(cat==="prophets")return item?.id==="muhammad"?"ﷺ":(item?.disputed?"":"عليه السلام");
  return cat==="sahabiyyat"?"رضي الله عنها":"رضي الله عنه";
}
function arabic(item,cat=activeCategory){return [item?.nameAr||"",honorific(item,cat)].filter(Boolean).join(" ")}
function sourceCount(cat){return (catalog[cat]||[]).length}
function stopOtherPlayers(){
  try{window.DARKidsProphetStories?.stop?.()}catch(_){}
  try{window.DARKidsMubashshirun?.stop?.()}catch(_){}
  try{window.DARKidsSahabiyyat?.stop?.()}catch(_){}
}
function ensureEntry(){
  const view=$("#view-stories");if(!view||$("#ghEntry"))return;
  const entry=document.createElement("button");entry.id="ghEntry";entry.className="gh-entry";entry.type="button";
  entry.innerHTML='<span class="gh-entry-bg" aria-hidden="true"></span><span class="gh-entry-copy"><span class="gh-entry-kicker">HÖREN · LESEN · MITLESEN</span><strong class="gh-entry-title">Geschichten des Īmān</strong><span class="gh-entry-sub">Propheten, Ṣaḥābah und Ṣaḥābiyyāt an einem Ort – einfach auswählen und eintauchen.</span><span class="gh-entry-action">Hörwelten öffnen <b aria-hidden="true">›</b></span></span>';
  const head=view.querySelector(".page-head"); if(head)head.insertAdjacentElement("afterend",entry); else view.prepend(entry);
  entry.addEventListener("click",openWorld);
}
function ensureUi(){
  if($("#ghWorld"))return;
  const world=document.createElement("section");world.id="ghWorld";world.className="gh-world";world.setAttribute("aria-hidden","true");
  world.innerHTML='<header class="gh-world-nav"><button class="gh-back" id="ghBack" type="button" aria-label="Hörwelten schließen">‹</button><div class="gh-world-nav-copy"><strong>Geschichten des Īmān</strong><span>Hören · Lesen · Mitlesen</span></div></header><div class="gh-world-scroll" id="ghWorldScroll"><section class="gh-world-hero"><div class="gh-world-hero-copy"><div class="gh-world-kicker">DĀR AL TAWḤĪD KIDS · HÖRWELTEN</div><h2>Geschichten, die den Īmān stärken</h2><p>Wähle eine Welt und danach eine Geschichte. Bilder, Text und Audio gehören immer zusammen.</p></div></section><main class="gh-content"><div class="gh-categories" id="ghCategories"></div><div class="gh-list-head"><div><small id="ghListKicker"></small><strong id="ghListTitle"></strong><span id="ghListCount"></span></div></div><div class="gh-list" id="ghList"></div></main></div>';
  document.body.appendChild(world);
  $("#ghBack").addEventListener("click",closeWorld);

  const player=document.createElement("section");player.id="ghPlayer";player.className="gh-player";player.setAttribute("aria-hidden","true");
  player.innerHTML='<div class="gh-player-scroll" id="ghPlayerScroll"><section class="gh-player-hero"><img id="ghPlayerBg" class="gh-player-bg" src="" alt=""><span class="gh-player-shade" aria-hidden="true"></span><button id="ghPlayerBack" class="gh-player-back" type="button" aria-label="Zurück zur Auswahl">‹</button><div class="gh-player-copy"><div class="gh-player-kicker" id="ghPlayerKicker"></div><h2 id="ghPlayerTitle"></h2><div class="gh-player-ar" id="ghPlayerArabic" dir="rtl"></div><div class="gh-player-summary" id="ghPlayerSummary"></div></div></section><main class="gh-player-body"><section class="gh-controls"><div class="gh-main-controls"><button class="gh-skip" id="ghBack15" type="button">−15 s</button><button class="gh-play" id="ghPlay" type="button">Hören</button><button class="gh-skip" id="ghFwd15" type="button">+15 s</button></div><div class="gh-progress" id="ghProgress" role="slider" tabindex="0" aria-label="Wiedergabeposition"><span></span></div><div class="gh-time"><span id="ghCurrent">0:00</span><span id="ghTotal">0:00</span></div><div class="gh-player-actions"><button class="gh-read-toggle" id="ghReadToggle" type="button">Text lesen</button><button class="gh-read-toggle" id="ghFollow" type="button">Mitlesen</button></div><p class="gh-audio-note" id="ghAudioNote"></p></section><article class="gh-read" id="ghRead" hidden></article><section class="gh-sources"><strong>QUELLEN</strong><div id="ghSources"></div></section></main></div>';
  document.body.appendChild(player);
  $("#ghPlayerBack").addEventListener("click",minimizePlayer);
  $("#ghPlay").addEventListener("click",toggleAudio);
  $("#ghBack15").addEventListener("click",()=>seek(-15));
  $("#ghFwd15").addEventListener("click",()=>seek(15));
  $("#ghReadToggle").addEventListener("click",toggleRead);
  $("#ghFollow").addEventListener("click",()=>reader?.open());
  $("#ghProgress").addEventListener("click",seekFromBar);
  $("#ghProgress").addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();seek(e.key==="ArrowLeft"?-15:15)}});

  const mini=document.createElement("button");mini.id="ghMini";mini.className="gh-mini";mini.type="button";mini.setAttribute("aria-label","Aktuelle Hörgeschichte öffnen");
  mini.innerHTML='<img id="ghMiniImg" src="" alt=""><span class="gh-mini-copy"><strong id="ghMiniTitle"></strong><span id="ghMiniMeta"></span></span><span class="gh-mini-play" id="ghMiniPlay" aria-hidden="true">▶</span>';
  document.body.appendChild(mini);
  mini.addEventListener("click",openPlayer);

  reader=window.DARKidsFollowReader?.create({
    id:"universal-story",audio,
    getContent:()=>{
      const meta=audioMeta(active)||{};
      return{key:active?(category().kind+":"+active.id+":"+ageKey()):"kids-story",title:active?active.name:"Geschichte",subtitle:category().label+" · Alter "+age(),album:"DĀR AL TAWḤĪD Kids · Geschichten des Īmān",text:textFor(active),artwork:active?artFor(active,activeCategory,true):"",deepLink:active?("#stories/listen/"+activeCategory+"/"+encodeURIComponent(active.id)):"#stories",audioOnly:isYoung(),timings:meta.timings||meta.paragraphTimings||meta.cues||[],syncPoints:meta.syncPoints||meta.syncAnchors||[]};
    },
    toggleAudio,disabled:()=>!audioMeta(active)?.url
  })||null;
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("loadedmetadata",()=>{reader?.restore();updateProgress()});
  audio.addEventListener("play",()=>{playing=true;renderPlay();renderMini()});
  audio.addEventListener("pause",()=>{playing=false;renderPlay();renderMini()});
  audio.addEventListener("ended",()=>{playing=false;renderPlay();renderMini()});
  window.addEventListener("pagehide",()=>reader?.persist(true));
  document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if($("#ghPlayer")?.classList.contains("open"))minimizePlayer();else if($("#ghWorld")?.classList.contains("open"))closeWorld()});
}
function renderCategories(){
  const host=$("#ghCategories");if(!host)return;
  host.innerHTML=SOURCES.map((s,i)=>{
    const first=(catalog[s.id]||[])[0],img=artFor(first,s.id,false);
    return '<button class="gh-category '+(s.id===activeCategory?"active":"")+'" data-gh-cat="'+s.id+'" type="button">'+(img?'<img src="'+esc(img)+'" alt="" decoding="async" loading="'+(i===0?"eager":"lazy")+'">':'')+'<span class="gh-category-copy"><strong>'+s.label+'</strong><span>'+sourceCount(s.id)+' Geschichten</span></span></button>';
  }).join("");
  host.querySelectorAll("[data-gh-cat]").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.ghCat;renderCategories();renderList()}));
}
function renderList(){
  const cat=category(),list=catalog[activeCategory]||[];
  $("#ghListKicker").textContent=cat.kicker;
  $("#ghListTitle").textContent=cat.label;
  $("#ghListCount").textContent=list.length+" Geschichten · Alter "+age();
  $("#ghList").innerHTML=list.map(item=>{
    const m=audioMeta(item),img=artFor(item,activeCategory,false);
    return '<button class="gh-story" type="button" data-gh-id="'+esc(item.id)+'">'+
      '<span class="gh-story-art">'+(img?'<img src="'+esc(img)+'" alt="" decoding="async" loading="lazy">':'')+'</span>'+
      '<span class="gh-story-copy"><small>'+(m?.url?"HÖRBEREIT":"LESEN · AUDIO FOLGT")+'</small><strong>'+esc(item.name)+'</strong><em dir="rtl">'+esc(arabic(item,activeCategory))+'</em><span>'+esc(item.summary||"")+'</span></span><span class="gh-story-go" aria-hidden="true">›</span></button>';
  }).join("");
  $("#ghList").querySelectorAll("[data-gh-id]").forEach(b=>b.addEventListener("click",()=>selectStory(b.dataset.ghId)));
}
function openWorld(){
  lastFocus=document.activeElement;
  stopOtherPlayers();
  $("#ghWorld").classList.add("open");$("#ghWorld").removeAttribute("aria-hidden");document.documentElement.classList.add("gh-world-open");
  const app=$(".app");if(app){app.setAttribute("inert","");app.setAttribute("aria-hidden","true")}
  $("#ghWorldScroll").scrollTop=0;renderCategories();renderList();setTimeout(()=>$("#ghBack")?.focus(),0);
}
function closeWorld(){
  if($("#ghPlayer")?.classList.contains("open"))return;
  $("#ghWorld").classList.remove("open");$("#ghWorld").setAttribute("aria-hidden","true");document.documentElement.classList.remove("gh-world-open");
  const app=$(".app");if(app){app.removeAttribute("inert");app.removeAttribute("aria-hidden")}
  try{lastFocus?.focus?.()}catch(_){}
}
function selectStory(id){
  active=(catalog[activeCategory]||[]).find(x=>x.id===id)||null;if(!active)return;
  stopAudio(false);renderPlayer();openPlayer();
}
function renderPlayer(){
  if(!active)return;
  const cat=category(),meta=audioMeta(active),text=textFor(active),img=artFor(active,activeCategory,true);
  const bg=$("#ghPlayerBg");bg.onerror=()=>{bg.onerror=null;bg.src=artFor(active,activeCategory,false)};bg.src=img;bg.alt="";
  $("#ghPlayerKicker").textContent=cat.label.toUpperCase()+" · HÖRGESCHICHTE";
  $("#ghPlayerTitle").textContent=active.name;
  $("#ghPlayerArabic").textContent=arabic(active,activeCategory);
  $("#ghPlayerSummary").textContent=active.summary||"";
  $("#ghRead").innerHTML=text.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#ghSources").textContent=(active.sourceRefs||[]).join(" · ");
  $("#ghRead").hidden=true;
  $("#ghReadToggle").textContent=isYoung()?"Mitlesen für Erwachsene":"Text lesen";
  $("#ghFollow").hidden=isYoung()||!meta?.url;
  $("#ghAudioNote").textContent=meta?.url?"Deine Stelle wird automatisch gespeichert.":(isYoung()?"Diese Hörgeschichte ist noch nicht als Audio freigeschaltet.":"Der vollständige Lesetext ist da. Audio wird automatisch ergänzt, sobald es freigeschaltet ist.");
  reader?.setContent({title:active.name,subtitle:cat.label+" · Alter "+age(),text,audioOnly:isYoung(),timings:meta?.timings||meta?.paragraphTimings||meta?.cues||[],syncPoints:meta?.syncPoints||meta?.syncAnchors||[]});
  if(meta?.url){audio.src=meta.url;audio.preload="metadata"}else{audio.removeAttribute("src");try{audio.load()}catch(_){}}
  updateProgress();renderPlay();renderMini();
}
function openPlayer(){
  if(!active)return;
  $("#ghPlayer").classList.add("open");$("#ghPlayer").removeAttribute("aria-hidden");document.documentElement.classList.add("gh-player-open");
  $("#ghWorld").setAttribute("inert","");$("#ghWorld").setAttribute("aria-hidden","true");
  $("#ghPlayerScroll").scrollTop=0;setTimeout(()=>$("#ghPlayerBack")?.focus(),0);
}
function minimizePlayer(){
  reader?.close();reader?.persist(true);
  $("#ghPlayer").classList.remove("open");$("#ghPlayer").setAttribute("aria-hidden","true");document.documentElement.classList.remove("gh-player-open");
  $("#ghWorld").removeAttribute("inert");if($("#ghWorld").classList.contains("open"))$("#ghWorld").removeAttribute("aria-hidden");
  renderMini();setTimeout(()=>$("#ghList [data-gh-id='"+CSS.escape(active?.id||"")+"']")?.focus(),0);
}
function toggleRead(){
  const read=$("#ghRead");if(!read)return;read.hidden=!read.hidden;$("#ghReadToggle").textContent=read.hidden?(isYoung()?"Mitlesen für Erwachsene":"Text lesen"):"Text schließen";if(!read.hidden)setTimeout(()=>read.scrollIntoView({block:"start",behavior:"smooth"}),20)
}
function formatTime(v){return window.DARKidsFollowReader?.formatTime?window.DARKidsFollowReader.formatTime(v):Math.floor((Number(v)||0)/60)+":"+String(Math.floor((Number(v)||0)%60)).padStart(2,"0")}
function updateProgress(){
  const d=Number(audio.duration)||0,c=Number(audio.currentTime)||0,p=d?Math.min(100,c/d*100):0;
  const bar=$("#ghProgress span");if(bar)bar.style.width=p+"%";
  $("#ghCurrent").textContent=formatTime(c);$("#ghTotal").textContent=formatTime(d);
  const track=$("#ghProgress");if(track){track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(Math.round(d)));track.setAttribute("aria-valuenow",String(Math.round(c)));track.setAttribute("aria-valuetext",formatTime(c)+" von "+formatTime(d))}
  renderMini();
}
function seek(delta){if(!Number(audio.duration))return;try{audio.currentTime=Math.max(0,Math.min(audio.duration,(Number(audio.currentTime)||0)+delta))}catch(_){}updateProgress();reader?.persist(true)}
function seekFromBar(e){if(!Number(audio.duration))return;const r=$("#ghProgress").getBoundingClientRect();if(!r.width)return;try{audio.currentTime=Math.max(0,Math.min(audio.duration,((e.clientX-r.left)/r.width)*audio.duration))}catch(_){}updateProgress();reader?.persist(true)}
function renderPlay(){const b=$("#ghPlay");if(!b)return;const m=audioMeta(active);b.disabled=busy||!m?.url;b.textContent=playing?"Pause":(audio.currentTime>0&&!audio.ended?"Weiter":"Hören")}
function renderMini(){
  const mini=$("#ghMini");if(!mini)return;
  const has=!!active&&(playing||Number(audio.currentTime)>0);
  mini.classList.toggle("show",has&&!$("#ghPlayer")?.classList.contains("open"));
  if(!has)return;
  $("#ghMiniImg").src=artFor(active,activeCategory,false);$("#ghMiniTitle").textContent=active.name;$("#ghMiniMeta").textContent=(playing?"Läuft · ":"Pausiert · ")+formatTime(audio.currentTime);$("#ghMiniPlay").textContent=playing?"Ⅱ":"▶";
}
async function toggleAudio(){
  if(!active||busy)return;const meta=audioMeta(active);if(!meta?.url)return;
  if(playing){audio.pause();return}
  stopOtherPlayers();
  try{busy=true;renderPlay();if(!audio.src)audio.src=meta.url;if(audio.ended)audio.currentTime=0;reader?.restore();await audio.play()}catch(_){$("#ghAudioNote").textContent="Audio konnte gerade nicht gestartet werden."}finally{busy=false;renderPlay()}
}
function stopAudio(clear=true){reader?.persist(true);try{audio.pause()}catch(_){}playing=false;busy=false;if(clear){try{audio.removeAttribute("src");audio.load()}catch(_){}}renderPlay();renderMini()}
async function load(){
  ensureEntry();ensureUi();
  const results=await Promise.all(SOURCES.map(async s=>{try{const r=await fetch(s.url,{cache:"no-store"});if(!r.ok)throw Error(String(r.status));const d=await r.json();return[s.id,(d.items||[]).slice().sort((a,b)=>Number(a.displayOrder||999)-Number(b.displayOrder||999))]}catch(e){console.warn("[DĀR Kids Hörwelten]",s.id,e);return[s.id,[]]}}));
  results.forEach(([id,items])=>catalog[id]=items);renderCategories();renderList();
  try{const m=String(location.hash||"").match(/^#stories\/listen\/(prophets|sahaba|sahabiyyat)\/([^/?#]+)/i);if(m){activeCategory=m[1];openWorld();setTimeout(()=>selectStory(decodeURIComponent(m[2])),0)}}catch(_){}
  const app=$(".app");if(app&&"MutationObserver" in window)new MutationObserver(()=>{renderCategories();renderList();if(active)renderPlayer()}).observe(app,{attributes:true,attributeFilter:["data-age"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(load,0),{once:true});else setTimeout(load,0);
window.DARKidsStoryHub={open:openWorld,openStory:(cat,id)=>{activeCategory=cat;openWorld();selectStory(id)},stop:()=>stopAudio(true)};
})();