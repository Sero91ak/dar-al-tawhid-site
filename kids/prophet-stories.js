(() => {
"use strict";
const DATA_URL="/kids/data/prophet-stories.json";
const MODE_KEY="kids.contentMode.v1";
const VOICE_CACHE="dar-kids-prophet-voice-v2";
const DONE_PREFIX="kids.prophetStory.done.";
const VOICE_API="/voice-studio/api/generate";
const FUSHA=[
  ["صلى الله عليه وسلم","صلى الله عليه وسلم"],
  ["Banū Isrāʾīl","بنو إسرائيل"],["Israʾīliyyāt","إسرائيليات"],["al-Jūdī","الجودي"],
  ["Tawḥīd","التوحيد"],["Qurʾān","القرآن"],["Firʿawn","فرعون"],["Shayṭān","الشيطان"],
  ["Ṣalāh","الصلاة"],["Zakāh","الزكاة"],["Duʿāʾ","الدعاء"],["Ṣabr","الصبر"],
  ["Kaʿbah","الكعبة"],["Tawrāh","التوراة"],["Injīl","الإنجيل"],["Zabūr","الزبور"],
  ["Madyan","مدين"],["Jālūt","جالوت"],["Ṭuwā","طوى"],["Sabaʾ","سبأ"],
  ["Baʿl","بعل"],["Thamūd","ثمود"],["ʿĀd","عاد"],["Īmān","الإيمان"],
  ["Hiǧrah","الهجرة"],["Sīrah","السيرة"],["Maryam","مريم"],["Aḥmad","أحمد"]
];
let items=[],active=null,activeText="",objectUrl="",playing=false,busy=false;
let chunks=[],chunkIndex=0,chunkTime=0;
const audio=new Audio();
const $= (s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"both"}catch(_){return "both"}}
function setMode(v){try{localStorage.setItem(MODE_KEY,v)}catch(_){}renderModeButtons();if(active){const keep=audio.currentTime;renderActive();if(playing&&keep){try{audio.currentTime=keep}catch(_){}}}}
function uniqueItems(list){
  const seen=new Set();
  return (Array.isArray(list)?list:[]).filter(item=>{
    const id=String(item?.id||"");
    if(!id||seen.has(id))return false;
    seen.add(id);
    return Boolean(item.cover);
  });
}
function ageIntro(item){
  const a=age();
  if(a==="4–5")return "Komm, wir hören eine wahre Geschichte aus dem Qurʾān über "+item.name+". Wir erzählen nur, was zuverlässig belegt ist.";
  if(a==="9–10")return "Diese Erzählung über "+item.name+" folgt den geprüften Qurʾān-Belegen. Unbelegte Ausschmückungen und Israʾīliyyāt werden nicht ergänzt.";
  return "Heute hören wir die Geschichte von "+item.name+". Sie ist aus geprüften Qurʾān-Belegen zusammengefasst und wird ohne erfundene Einzelheiten erzählt.";
}
function ageOutro(item){
  if(item.disputed)return "Merke dir: Dhū l-Kifl wird im Qurʾān gelobt. Ob er ein Prophet war, wurde von Gelehrten unterschiedlich beurteilt. Wir sagen deshalb nicht mehr, als die Quellen sicher tragen.";
  if(age()==="4–5")return "Das Wichtigste ist: Wir glauben den Berichten Allahs und lernen daraus, Allah zu gehorchen und Ihm zu vertrauen.";
  return "So endet unsere Zusammenfassung. Die Quellen stehen direkt unter der Geschichte, damit du sehen kannst, worauf die Erzählung beruht.";
}
function chaptersForAge(item){
  const ch=Array.isArray(item.chapters)?item.chapters.slice():[];
  if(age()!=="4–5"||ch.length<=3)return ch;
  return [ch[0],ch[1],ch[ch.length-1]];
}
function buildText(item){
  const parts=[ageIntro(item)].concat(chaptersForAge(item));
  if(age()==="9–10"&&item.older)parts.push(item.older);
  parts.push(ageOutro(item));
  return parts.join("\n\n").replace(/\s+\n/g,"\n").trim();
}
function wordCount(text){return (String(text).match(/\S+/g)||[]).length}
function durationLabel(text){
  const minutes=Math.max(1,Math.round(wordCount(text)/130));
  return "ca. "+minutes+" Min.";
}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function markDone(id){if(!id)return;try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){}renderCards()}
function honorific(item){
  if(!item)return "";
  if(item.id==="muhammad")return "ﷺ";
  if(item.disputed)return "";
  return item.honorific||"عليه السلام";
}
function renderModeButtons(){
  const wrap=$("#psModes");if(!wrap)return;const current=mode();
  wrap.querySelectorAll("[data-ps-mode]").forEach(b=>b.classList.toggle("active",b.dataset.psMode===current));
}
function renderCards(){
  const grid=$("#psGrid");if(!grid)return;
  grid.innerHTML=items.map(item=>{
    const text=buildText(item);
    const h=honorific(item);
    return '<button class="ps-card" data-ps-id="'+esc(item.id)+'" type="button">'+
      '<img src="'+esc(item.cover)+'" alt="" loading="lazy">'+
      (done(item.id)?'<span class="ps-done" aria-hidden="true"></span>':'')+
      '<span class="ps-card-copy"><span class="ps-badges"><span class="ps-badge ok">QURʾĀN · GEPRÜFT</span>'+
      (item.disputed?'<span class="ps-badge warn">IKHTILĀF</span>':'')+
      '</span><h4>'+esc(item.name)+(h?" "+esc(h):"")+'</h4>'+
      '<small>'+esc(durationLabel(text))+'</small></span></button>';
  }).join("");
  grid.querySelectorAll("[data-ps-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.psId)));
}
function ensureUi(){
  const view=$("#view-stories");if(!view||$("#prophetStoriesSection"))return false;
  const old=$("#authenticStoryList");
  const title=old?.previousElementSibling;
  const section=document.createElement("section");
  section.id="prophetStoriesSection";section.className="ps-wrap";
  section.innerHTML='<div class="ps-head"><div><div class="ps-kicker">Qurʾān · geprüft · nach Altersstufe</div><h3>Geschichten der Propheten</h3><p>Aus den geprüften Prophetenprofilen. Keine erfundenen Dialoge oder Israʾīliyyāt.</p></div><div class="ps-count">25 PROFILE</div></div>'+
    '<div class="ps-modes" id="psModes"><button class="ps-mode" data-ps-mode="both" type="button">Lesen &amp; Hören</button><button class="ps-mode" data-ps-mode="listen" type="button">Nur Hören</button><button class="ps-mode" data-ps-mode="read" type="button">Nur Lesen</button></div><div class="ps-grid" id="psGrid"></div>';
  if(old)view.insertBefore(section,title&&title.classList.contains("section-title")?title:old);
  else view.appendChild(section);
  section.querySelectorAll("[data-ps-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.psMode)));
  renderModeButtons();
  const modal=document.createElement("div");
  modal.className="ps-modal";modal.id="psModal";
  modal.innerHTML='<div class="ps-sheet" role="dialog" aria-modal="true" aria-labelledby="psTitle"><div class="ps-top"><span class="ps-top-label">DĀR AL TAWḤĪD KIDS · PROPHETEN</span><button class="ps-close" id="psClose" type="button" aria-label="Schließen">×</button></div>'+
    '<div class="ps-scroll" id="psScroll"><div class="ps-hero"><img id="psHero" src="" alt=""></div><div class="ps-body"><h2 class="ps-title" id="psTitle"></h2><div class="ps-ar" id="psArabic" dir="rtl"></div><div class="ps-honor" id="psHonor"></div><p class="ps-summary" id="psSummary"></p><div class="ps-meta" id="psMeta"></div>'+
    '<div class="ps-player" id="psPlayer"><div class="ps-player-row"><button class="ps-play" id="psPlay" type="button">Mit Serhats Stimme hören</button></div><div class="ps-progress"><span id="psProgress"></span></div><div class="ps-player-note" id="psVoiceNote">DĀR Voice · Kinder-Geschichte · keine fremde Systemstimme</div></div>'+
    '<article class="ps-read" id="psRead"></article><div class="ps-sources"><strong>QUELLEN</strong><div id="psSources"></div></div><div class="ps-question" id="psQuestion"></div></div></div></div>';
  document.body.appendChild(modal);
  $("#psClose").addEventListener("click",closeStory);
  modal.addEventListener("click",e=>{e.stopPropagation()});
  $("#psPlay").addEventListener("click",toggleAudio);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#psModal")?.classList.contains("open"))closeStory()});
  audio.preload="metadata";
  audio.addEventListener("timeupdate",updateProgress);
  audio.addEventListener("ended",onChunkEnded);
  audio.addEventListener("pause",()=>{if(!busy){playing=false;updatePlayButton()}});
  audio.addEventListener("play",()=>{playing=true;updatePlayButton()});
  return true;
}
function applyMode(){
  const m=mode();
  const read=$("#psRead"),player=$("#psPlayer");
  if(!read||!player)return;
  if(m==="read"){read.style.display="block";player.style.display="none"}
  else if(m==="listen"){read.style.display="none";player.style.display="block"}
  else{read.style.display="block";player.style.display="block"}
}
function renderActive(){
  if(!active)return;
  activeText=buildText(active);
  chunks=splitChunks(activeText);
  chunkIndex=0;chunkTime=0;
  $("#psHero").src=active.cover;
  $("#psHero").alt=active.name;
  $("#psTitle").textContent=active.name;
  $("#psArabic").textContent=active.nameAr||"";
  const h=honorific(active);
  $("#psHonor").textContent=h||(active.disputed?"Im Qurʾān genannt · Prophetenstatus unterschiedlich beurteilt":"");
  $("#psSummary").textContent=active.summary||"";
  $("#psMeta").innerHTML='<span class="ps-pill">'+esc(durationLabel(activeText))+'</span><span class="ps-pill">Alter '+esc(age())+'</span><span class="ps-pill">Qurʾān · geprüft</span>'+(active.disputed?'<span class="ps-pill">IKHTILĀF</span>':'');
  $("#psRead").innerHTML=activeText.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#psSources").textContent=(active.sourceRefs||[]).join(" · ");
  renderQuestion();
  applyMode();
  $("#psProgress").style.width="0";
  $("#psVoiceNote").textContent="DĀR Voice · Serhat · Fuṣḥā-Namen · keine fremde Systemstimme";
  updatePlayButton();
}
function renderQuestion(){
  const q=$("#psQuestion");if(!q||!active)return;
  q.innerHTML='<div class="ps-kicker">HAST DU GUT AUFGEPASST?</div><h4>'+esc(active.question)+'</h4>'+
    (active.answers||[]).map((a,i)=>'<button class="ps-answer" data-ps-answer="'+i+'" type="button">'+esc(a)+'</button>').join("")+
    '<div class="ps-feedback" id="psFeedback"></div>';
  q.querySelectorAll("[data-ps-answer]").forEach(b=>b.addEventListener("click",()=>{
    const i=Number(b.dataset.psAnswer);
    if(i===Number(active.correct||0)){b.classList.add("good");$("#psFeedback").textContent="Richtig. Gut aufgepasst.";markDone(active.id)}
    else{b.classList.add("bad");$("#psFeedback").textContent="Schau oder hör noch einmal in Ruhe nach.";setTimeout(()=>b.classList.remove("bad"),900)}
  }));
}
function lockPage(){
  document.documentElement.classList.add("ps-modal-open");
  [".shell",".bottom-nav"].forEach(sel=>{
    const el=$(sel);if(!el)return;
    el.setAttribute("inert","");
    el.setAttribute("aria-hidden","true");
  });
}
function unlockPage(){
  document.documentElement.classList.remove("ps-modal-open");
  [".shell",".bottom-nav"].forEach(sel=>{
    const el=$(sel);if(!el)return;
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
  });
}
function openStory(id){
  active=items.find(x=>x.id===id);if(!active)return;
  stopAudio();renderActive();
  $("#psModal").classList.add("open");
  lockPage();
  $("#psScroll").scrollTop=0;
  $("#psClose")?.focus();
}
function closeStory(){
  stopAudio();
  $("#psModal")?.classList.remove("open");
  unlockPage();
  active=null;
}
function preparedText(item,text){
  let v=String(text);
  items.slice().sort((a,b)=>String(b.name).length-String(a.name).length).forEach(p=>{
    const honor=p.id==="muhammad"?"صلى الله عليه وسلم":(p.disputed?"":"عليه السلام");
    if(p.honorific)v=v.split(p.name+" "+p.honorific).join((p.nameAr||p.name)+(honor?" "+honor:""));
    v=v.split(p.name).join((p.nameAr||p.name)+(honor?" "+honor:""));
  });
  FUSHA.forEach(pair=>{v=v.split(pair[0]).join(pair[1])});
  return v.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
}
function splitChunks(text){
  const paras=String(text).split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  const out=[];let buf="";
  paras.forEach(p=>{
    if((buf+"\n\n"+p).length>1600&&buf){out.push(buf);buf=p}
    else buf=buf?buf+"\n\n"+p:p;
  });
  if(buf)out.push(buf);
  return out.length?out:[text];
}
function hashKey(s){
  let h=2166136261;
  const str=String(s);
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(16);
}
async function getVoiceBlob(item,text){
  const prepared=preparedText(item,text);
  const key=item.id+"-"+age()+"-"+hashKey(prepared);
  const keyUrl=location.origin+"/kids/__voice-cache__/prophet-"+encodeURIComponent(key)+".mp3";
  if("caches" in window){try{const cache=await caches.open(VOICE_CACHE);const hit=await cache.match(keyUrl);if(hit)return await hit.blob()}catch(_){}}
  if(prepared.length>4900)throw new Error("Diese Geschichte ist für eine einzelne Sprachdatei zu lang.");
  const res=await fetch(VOICE_API,{
    method:"POST",
    credentials:"omit",
    cache:"no-store",
    headers:{"Content-Type":"application/json","Accept":"audio/mpeg"},
    body:JSON.stringify({text:text,prepared:prepared,profile:"kids_story"})
  });
  if(!res.ok){
    let msg="Serhat-Stimme ist gerade nicht verfügbar.";
    try{const j=await res.json();if(j?.error)msg=j.error}catch(_){}
    throw new Error(msg);
  }
  const blob=await res.blob();
  if("caches" in window){try{const cache=await caches.open(VOICE_CACHE);await cache.put(keyUrl,new Response(blob,{headers:{"Content-Type":blob.type||"audio/mpeg"}}))}catch(_){}}
  return blob;
}
function updateProgress(){
  if(!$("#psProgress")||!chunks.length)return;
  const part=1/chunks.length;
  const local=audio.duration?audio.currentTime/audio.duration:0;
  const p=Math.min(100,(chunkIndex+local)*part*100);
  $("#psProgress").style.width=p+"%";
}
function updatePlayButton(){
  const b=$("#psPlay");if(!b)return;
  if(busy)b.textContent="Stimme wird vorbereitet …";
  else if(playing)b.textContent="Pause";
  else if(chunkIndex>0||(audio.currentTime>0&&!audio.ended))b.textContent="Weiterhören";
  else b.textContent="Mit Serhats Stimme hören";
  b.disabled=busy;
}
async function playChunk(index,fromTime){
  if(!active)return;
  const text=chunks[index];
  if(!text)return;
  const blob=await getVoiceBlob(active,text);
  if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl=URL.createObjectURL(blob);
  audio.src=objectUrl;
  audio.currentTime=fromTime||0;
  await audio.play();
  playing=true;
  if($("#psVoiceNote"))$("#psVoiceNote").textContent="DĀR Voice · Serhat · fließende Kinder-Erzählung";
  updatePlayButton();
  if(chunks[index+1])getVoiceBlob(active,chunks[index+1]).catch(()=>{});
}
async function onChunkEnded(){
  if(!active)return;
  if(chunkIndex<chunks.length-1){
    chunkIndex+=1;chunkTime=0;
    try{await playChunk(chunkIndex,0)}catch(err){showVoiceError(err)}
    return;
  }
  playing=false;updatePlayButton();markDone(active.id);
  if($("#psVoiceNote"))$("#psVoiceNote").textContent="Geschichte vollständig angehört.";
}
function showVoiceError(err){
  busy=false;playing=false;updatePlayButton();
  const note=$("#psVoiceNote");
  if(note)note.innerHTML='<span class="ps-voice-lock">'+esc(err?.message||"Serhat-Stimme nicht verfügbar.")+" Es wird keine fremde Systemstimme verwendet. Lesen bleibt verfügbar.</span>";
}
async function toggleAudio(){
  if(!active||busy)return;
  if(playing){audio.pause();playing=false;chunkTime=audio.currentTime;updatePlayButton();return}
  try{
    if(objectUrl&&audio.src&&!audio.ended){
      await audio.play();playing=true;updatePlayButton();return
    }
    busy=true;updatePlayButton();
    if($("#psVoiceNote"))$("#psVoiceNote").textContent="Serhat-Stimme wird geladen …";
    await playChunk(chunkIndex,chunkTime||0);
    busy=false;updatePlayButton();
  }catch(err){showVoiceError(err)}
}
function stopAudio(){
  try{audio.pause();audio.currentTime=0}catch(_){}
  playing=false;busy=false;chunkIndex=0;chunkTime=0;
  if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch(_){}objectUrl=""}
  audio.removeAttribute("src");try{audio.load()}catch(_){}
  updatePlayButton();
}
async function init(){
  if(!ensureUi())return;
  try{
    const r=await fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"});
    if(!r.ok)throw new Error("Propheten-Geschichten "+r.status);
    const data=await r.json();
    items=uniqueItems(data.items);
    renderCards();
    const app=$(".app");
    if(app&&"MutationObserver" in window){
      new MutationObserver(()=>{renderCards();if(active){stopAudio();renderActive()}}).observe(app,{attributes:true,attributeFilter:["data-age"]});
    }
  }catch(err){
    const grid=$("#psGrid");
    if(grid)grid.innerHTML='<div class="gentle-note">Die Propheten-Geschichten konnten gerade nicht geladen werden.</div>';
    console.warn("[DĀR Kids Prophet Stories]",err);
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.DARKidsProphetStories={open:openStory,stop:stopAudio};
})();
