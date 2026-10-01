(() => {
"use strict";
const DATA_URL="/kids/data/prophet-stories.json";
const MODE_KEY="kids.contentMode.v1";
const VOICE_CACHE="dar-kids-prophet-voice-v1";
const DONE_PREFIX="kids.prophetStory.done.";
const VOICE_API="/voice-studio/api/generate";
let items=[],active=null,activeText="",objectUrl="",playing=false,busy=false;
const audio=new Audio();
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function age(){return String($(".app")?.getAttribute("data-age")||"6–8")}
function mode(){try{const v=localStorage.getItem(MODE_KEY);return["both","listen","read"].includes(v)?v:"both"}catch(_){return"both"}}
function setMode(v){try{localStorage.setItem(MODE_KEY,v)}catch(_){}renderModeButtons();if(active)renderActive()}
function ageIntro(item){
 const a=age();
 if(a==="4–5")return "Komm, wir hören eine wahre Geschichte aus dem Qurʾān über "+item.name+" "+item.honorific+". Wir erzählen nur, was zuverlässig belegt ist.";
 if(a==="9–10")return "Diese Erzählung über "+item.name+" "+item.honorific+" folgt den geprüften Qurʾān-Belegen des DĀR-AL-TAWḤĪD-Prophetenprofils. Unbelegte Ausschmückungen und Israʾīliyyāt werden nicht ergänzt.";
 return "Heute hören wir die Geschichte von "+item.name+" "+item.honorific+". Sie ist aus geprüften Qurʾān-Belegen zusammengefasst und wird ohne erfundene Einzelheiten erzählt.";
}
function ageOutro(item){
 if(item.disputed)return "Merke dir: Dhū l-Kifl wird im Qurʾān gelobt. Ob er ein Prophet war, wurde von Gelehrten unterschiedlich beurteilt. Wir sagen deshalb nicht mehr, als die Quellen sicher tragen.";
 if(age()==="4–5")return "Das Wichtigste ist: Wir glauben den Berichten Allahs und lernen daraus, Allah zu gehorchen und Ihm zu vertrauen.";
 return "So endet unsere Zusammenfassung. Die Quellen stehen direkt unter der Geschichte, damit du sehen kannst, worauf die Erzählung beruht.";
}
function buildText(item){
 const parts=[ageIntro(item)].concat(item.chapters||[]);
 if(age()==="9–10"&&item.older)parts.push(item.older);
 parts.push(ageOutro(item));
 return parts.join("\n\n").replace(/\s+\n/g,"\n").trim();
}
function duration(text){const words=(String(text).match(/\S+/g)||[]).length;return clamp(Math.ceil(words/78),3,8)}
function done(id){try{return localStorage.getItem(DONE_PREFIX+id)==="1"}catch(_){return false}}
function markDone(id){if(!id)return;try{localStorage.setItem(DONE_PREFIX+id,"1")}catch(_){}renderCards()}
function renderModeButtons(){
 const wrap=$("#psModes");if(!wrap)return;const current=mode();
 wrap.querySelectorAll("[data-ps-mode]").forEach(b=>b.classList.toggle("active",b.dataset.psMode===current));
}
function renderCards(){
 const grid=$("#psGrid");if(!grid)return;
 grid.innerHTML=items.map(item=>{
   const min=duration(buildText(item));
   return '<button class="ps-card" data-ps-id="'+esc(item.id)+'" type="button">'+
    '<img src="'+esc(item.cover)+'" alt="" loading="lazy">'+
    (done(item.id)?'<span class="ps-done">✓</span>':'')+
    '<span class="ps-card-copy"><span class="ps-badges"><span class="ps-badge ok">QURʾĀN · GEPRÜFT</span>'+
    (item.disputed?'<span class="ps-badge warn">IKHTILĀF</span>':'')+
    '</span><h4>'+esc(item.name)+' '+esc(item.honorific)+'</h4><span class="ar" dir="rtl">'+esc(item.nameAr)+
    '</span><small>ca. '+min+' Min. · Lesen & Hören</small></span></button>';
 }).join("");
 grid.querySelectorAll("[data-ps-id]").forEach(b=>b.addEventListener("click",()=>openStory(b.dataset.psId)));
}
function ensureUi(){
 const view=$("#view-stories");if(!view||$("#prophetStoriesSection"))return false;
 const old=$("#authenticStoryList"),anchor=old?.previousElementSibling||null;
 const section=document.createElement("section");
 section.id="prophetStoriesSection";section.className="ps-wrap";
 section.innerHTML='<div class="ps-head"><div><div class="ps-kicker">Qurʾān · geprüft · nach Altersstufe</div><h3>Geschichten der Propheten</h3><p>Aus den geprüften Prophetenprofilen. Keine erfundenen Dialoge oder Israʾīliyyāt.</p></div><div class="ps-count">25 PROFILE</div></div>'+
 '<div class="ps-modes" id="psModes"><button class="ps-mode" data-ps-mode="both" type="button">Lesen & Hören</button><button class="ps-mode" data-ps-mode="listen" type="button">Nur Hören</button><button class="ps-mode" data-ps-mode="read" type="button">Nur Lesen</button></div><div class="ps-grid" id="psGrid"></div>';
 if(anchor)view.insertBefore(section,anchor);else view.appendChild(section);
 section.querySelectorAll("[data-ps-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.psMode)));
 renderModeButtons();
 if(old){const oldTitle=old.previousElementSibling;if(oldTitle)oldTitle.style.display="none";old.style.display="none"}
 const modal=document.createElement("div");modal.className="ps-modal";modal.id="psModal";
 modal.innerHTML='<div class="ps-sheet" role="dialog" aria-modal="true" aria-labelledby="psTitle"><div class="ps-top"><span class="ps-top-label">DĀR AL TAWḤĪD KIDS · PROPHETEN</span><button class="ps-close" id="psClose" type="button" aria-label="Schließen">×</button></div>'+
 '<div class="ps-scroll" id="psScroll"><div class="ps-hero"><img id="psHero" src="" alt=""></div><div class="ps-body"><h2 class="ps-title" id="psTitle"></h2><div class="ps-ar" id="psArabic" dir="rtl"></div><p class="ps-summary" id="psSummary"></p><div class="ps-meta" id="psMeta"></div>'+
 '<div class="ps-player" id="psPlayer"><div class="ps-player-row"><button class="ps-play" id="psPlay" type="button">▶ Mit Serhats Stimme hören</button></div><div class="ps-progress"><span id="psProgress"></span></div><div class="ps-player-note" id="psVoiceNote">DĀR Voice · Kinder-Geschichte · keine fremde Systemstimme</div></div>'+
 '<div class="ps-tabs" id="psTabs"><button class="ps-tab active" data-ps-tab="read" type="button">Lesen</button><button class="ps-tab" data-ps-tab="listen" type="button">Hören</button></div><article class="ps-read" id="psRead"></article><div class="ps-sources"><strong>QUELLEN</strong><div id="psSources"></div></div><div class="ps-question" id="psQuestion"></div></div></div></div>';
 document.body.appendChild(modal);
 $("#psClose").addEventListener("click",closeStory);
 modal.addEventListener("click",e=>{if(e.target===modal)closeStory()});
 modal.querySelectorAll("[data-ps-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.psTab)));
 $("#psPlay").addEventListener("click",toggleAudio);
 audio.preload="metadata";
 audio.addEventListener("timeupdate",()=>{const p=audio.duration?audio.currentTime/audio.duration*100:0;if($("#psProgress"))$("#psProgress").style.width=p+"%"});
 audio.addEventListener("ended",()=>{playing=false;updatePlayButton();markDone(active?.id||"");if($("#psVoiceNote"))$("#psVoiceNote").textContent="✓ Geschichte vollständig angehört."});
 audio.addEventListener("pause",()=>{playing=false;updatePlayButton()});
 return true;
}
function setTab(tab){
 const read=$("#psRead"),player=$("#psPlayer");
 $("#psTabs")?.querySelectorAll("[data-ps-tab]").forEach(b=>b.classList.toggle("active",b.dataset.psTab===tab));
 if(read)read.style.display=tab==="read"?"block":"none";
 if(player)player.style.display=tab==="listen"?"block":"none";
}
function renderActive(){
 if(!active)return;activeText=buildText(active);
 $("#psHero").src=active.cover;$("#psTitle").textContent=active.name+" "+active.honorific;
 $("#psArabic").textContent=active.nameAr+" "+(active.id==="muhammad"?"ﷺ":"عليه السلام");
 $("#psSummary").textContent=active.summary;
 $("#psMeta").innerHTML='<span class="ps-pill">ca. '+duration(activeText)+' Min.</span><span class="ps-pill">Alter '+esc(age())+'</span><span class="ps-pill">Qurʾān · geprüft</span>'+(active.disputed?'<span class="ps-pill">Prophetenstatus: Ikhtilāf</span>':'');
 $("#psRead").innerHTML=activeText.split(/\n{2,}/).map(p=>"<p>"+esc(p)+"</p>").join("");
 $("#psSources").textContent=(active.sourceRefs||[]).join(" · ");renderQuestion();
 const m=mode();$("#psTabs").style.display=m==="both"?"flex":"none";
 if(m==="read"){$("#psRead").style.display="block";$("#psPlayer").style.display="none"}
 else if(m==="listen"){$("#psRead").style.display="none";$("#psPlayer").style.display="block"}
 else setTab("read");
 $("#psProgress").style.width="0";$("#psVoiceNote").textContent="DĀR Voice · Serhat · Fuṣḥā-Namen · keine fremde Systemstimme";updatePlayButton();
}
function renderQuestion(){
 const q=$("#psQuestion");if(!q||!active)return;
 q.innerHTML='<div class="ps-kicker">HAST DU GUT AUFGEPASST?</div><h4>'+esc(active.question)+'</h4>'+
 (active.answers||[]).map((a,i)=>'<button class="ps-answer" data-ps-answer="'+i+'" type="button">'+esc(a)+'</button>').join("")+
 '<div class="ps-feedback" id="psFeedback"></div>';
 q.querySelectorAll("[data-ps-answer]").forEach(b=>b.addEventListener("click",()=>{
   const i=Number(b.dataset.psAnswer);
   if(i===Number(active.correct||0)){b.classList.add("good");$("#psFeedback").textContent="✓ Richtig. Gut aufgepasst.";markDone(active.id)}
   else{b.classList.add("bad");$("#psFeedback").textContent="Schau oder hör noch einmal in Ruhe nach.";setTimeout(()=>b.classList.remove("bad"),1000)}
 }));
}
function openStory(id){
 active=items.find(x=>x.id===id);if(!active)return;stopAudio();renderActive();$("#psModal").classList.add("open");
 try{$(".shell")?.setAttribute("inert","");$(".bottom-nav")?.setAttribute("inert","")}catch(_){}
 $("#psScroll").scrollTop=0;
}
function closeStory(){
 stopAudio();$("#psModal")?.classList.remove("open");
 try{$(".shell")?.removeAttribute("inert");$(".bottom-nav")?.removeAttribute("inert")}catch(_){}
 active=null;
}
function preparedText(item,text){
 let v=String(text);
 items.slice().sort((a,b)=>b.name.length-a.name.length).forEach(p=>{
   const honor=p.id==="muhammad"?"صلى الله عليه وسلم":"عليه السلام";
   v=v.split(p.name+" "+p.honorific).join(p.nameAr+" "+honor);
   v=v.split(p.name).join(p.nameAr);
 });
 const fusha=[
   ["Banū Isrāʾīl","بنو إسرائيل"],["Israʾīliyyāt","إسرائيليات"],["al-Jūdī","الجودي"],
   ["Tawḥīd","التوحيد"],["Qurʾān","القرآن"],["Firʿawn","فرعون"],["Shayṭān","الشيطان"],
   ["Ṣalāh","الصلاة"],["Zakāh","الزكاة"],["Duʿāʾ","الدعاء"],["Ṣabr","الصبر"],
   ["Kaʿbah","الكعبة"],["Tawrāh","التوراة"],["Injīl","الإنجيل"],["Zabūr","الزبور"],
   ["Madyan","مدين"],["Jālūt","جالوت"],["Ṭuwā","طوى"],["Sabaʾ","سبأ"],
   ["Baʿl","بعل"],["Thamūd","ثمود"],["ʿĀd","عاد"],["Īmān","الإيمان"],
   ["Hiǧrah","الهجرة"],["Sīrah","السيرة"],["Maryam","مريم"]
 ];
 fusha.forEach(pair=>{v=v.split(pair[0]).join(pair[1])});
 return v.replace(/\s+/g," ").trim();
}
async function getVoiceBlob(item,text){
 const keyUrl=location.origin+"/kids/__voice-cache__/prophet-"+encodeURIComponent(item.id)+"-"+encodeURIComponent(age())+"-v2.mp3";
 if("caches" in window){try{const cache=await caches.open(VOICE_CACHE);const hit=await cache.match(keyUrl);if(hit)return await hit.blob()}catch(_){}}
 const prepared=preparedText(item,text);
 if(prepared.length>4900)throw new Error("Diese Geschichte ist für eine einzelne Sprachdatei zu lang und muss in Kapitel geteilt werden.");
 const res=await fetch(VOICE_API,{method:"POST",credentials:"omit",cache:"no-store",headers:{"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text:text,prepared:prepared,profile:"kids_story"})});
 if(!res.ok){let msg="Serhat-Stimme ist gerade nicht verfügbar.";try{const j=await res.json();if(j?.error)msg=j.error}catch(_){}throw new Error(msg)}
 const blob=await res.blob();
 if("caches" in window){try{const cache=await caches.open(VOICE_CACHE);await cache.put(keyUrl,new Response(blob,{headers:{"Content-Type":blob.type||"audio/mpeg"}}))}catch(_){}}
 return blob;
}
function updatePlayButton(){
 const b=$("#psPlay");if(!b)return;
 if(busy)b.textContent="Stimme wird vorbereitet …";
 else if(playing)b.textContent="■ Stopp";
 else if(audio.currentTime>0&&audio.duration&&audio.currentTime<audio.duration)b.textContent="▶ Weiterhören";
 else b.textContent="▶ Mit Serhats Stimme hören";
 b.disabled=busy;
}
async function toggleAudio(){
 if(!active||busy)return;if(playing){audio.pause();return}
 try{
   if(audio.src&&audio.currentTime>0&&!audio.ended){await audio.play();playing=true;updatePlayButton();return}
   busy=true;updatePlayButton();$("#psVoiceNote").textContent="Serhat-Stimme wird geladen …";
   const blob=await getVoiceBlob(active,activeText);
   if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);audio.src=objectUrl;audio.currentTime=0;busy=false;
   await audio.play();playing=true;$("#psVoiceNote").textContent="DĀR Voice · Serhat · fließende Kinder-Erzählung";updatePlayButton();
 }catch(err){
   busy=false;playing=false;updatePlayButton();
   $("#psVoiceNote").innerHTML='<span class="ps-voice-lock">'+esc(err?.message||"Serhat-Stimme nicht verfügbar.")+' Es wird keine fremde Systemstimme verwendet. Lesen bleibt verfügbar.</span>';
 }
}
function stopAudio(){
 try{audio.pause();audio.currentTime=0}catch(_){}playing=false;busy=false;
 if(objectUrl){try{URL.revokeObjectURL(objectUrl)}catch(_){}objectUrl=""}
 audio.removeAttribute("src");try{audio.load()}catch(_){}updatePlayButton();
}
async function init(){
 if(!ensureUi())return;
 try{
   const r=await fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("Propheten-Geschichten "+r.status);
   const data=await r.json();items=Array.isArray(data.items)?data.items:[];renderCards();
   const app=$(".app");if(app&&"MutationObserver" in window)new MutationObserver(()=>{renderCards();if(active)renderActive()}).observe(app,{attributes:true,attributeFilter:["data-age"]});
 }catch(err){$("#psGrid").innerHTML='<div class="gentle-note">Die Propheten-Geschichten konnten gerade nicht geladen werden.</div>';console.warn("[DĀR Kids Prophet Stories]",err)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.DARKidsProphetStories={open:openStory,stop:stopAudio};
})();