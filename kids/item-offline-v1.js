/* KIDS_PER_ITEM_OFFLINE_V1 — independent download buttons, no nested buttons.
   A saved lesson stays in this device's PWA storage, not the iOS Files app.
   No learning progress, daily release or existing player is modified. */
(function(){
"use strict";
const AGE_KEYS=["4-5","6-8","9-10"];
// Direct-entry Academy installs the same Kids-only SW before an offline save.
if(location.pathname.startsWith("/kids/akademie/")&&"serviceWorker" in navigator){
 navigator.serviceWorker.register("/kids/sw.js?v=1314",{scope:"/kids/",updateViaCache:"none"}).catch(()=>{});
}
const DEFAULT_BASE=[
 "/kids/start.html","/kids/prayer-stage-v1261.js?v=1306",
 "/kids/akademie/index.html"
];
const currentAge=()=>String(document.querySelector(".app")?.getAttribute("data-age")||"6–8").replace("–","-");
const unique=a=>[...new Set((a||[]).filter(x=>typeof x==="string"&&x.length))];
function allowed(url){
 try{
  const u=new URL(url,location.origin);
  return u.origin===location.origin&&(
    /^\/kids\/[\w\d\/._%-]+\.(?:js|json|css|html|svg|png|jpe?g|webp|m4a|mp3)(?:$)/i.test(u.pathname)||
    /^\/desktop-preview\/assets\/kids-academy-[\w-]+\.jpg$/i.test(u.pathname)
  )?u.pathname+u.search:"";
 }catch(_){return""}
}
function post(type,data={},onProgress){
 return new Promise(async(resolve,reject)=>{
  if(!("serviceWorker" in navigator)||!("MessageChannel" in window))return reject(Error("Offline-Modus nicht verfügbar"));
  let worker=navigator.serviceWorker.controller;
  if(!worker){
   try{worker=(await navigator.serviceWorker.ready).active}catch(_){}
  }
  if(!worker)return reject(Error("Offline-Speicher startet noch"));
  const channel=new MessageChannel();
  let finished=false;
  const finish=(error,response)=>{
   if(finished)return;finished=true;clearTimeout(timer);channel.port1.close();
   if(error)reject(error);else resolve(response);
  };
  const timer=setTimeout(()=>finish(Error("Offline-Dienst reagiert nicht. App neu öffnen und erneut versuchen.")),type==="KIDS_ITEM_STATUS"?8000:180000);
  channel.port1.onmessage=e=>{
   const msg=e.data||{};
   if(msg.type==="KIDS_ITEM_PROGRESS"){onProgress?.(msg);return;}
   if(msg.type!=="KIDS_ITEM_RESULT")return;
   if(msg.error)finish(Error(msg.error));else finish(null,msg);
  };
  channel.port1.start?.();
  try{worker.postMessage({type,...data},[channel.port2]);}catch(e){finish(e)}
 });
}
const live=new Map();
const labels=new Map();
const events=()=>window.dispatchEvent(new CustomEvent("kids-item-offline-updated"));
function mark(key,message,state){
 const buttons=labels.get(key)||new Set();
 for(const btn of buttons){if(!btn.isConnected){buttons.delete(btn);continue;}
   btn.textContent=message;btn.dataset.offlineState=state||"idle";
   btn.disabled=state==="busy";
   btn.setAttribute("aria-label",(btn.dataset.offlineTitle||"Inhalt")+": "+message);
 }
}
function oneButton(card,spec,inline=false){
 if(!card||!card.parentNode||(!inline&&card.closest(".kids-offline-entry")))return;
 const key=String(spec.key||"");
 if(!/^(story|deen|academy):[\w-]+(?::[\w-]+){0,2}$/.test(key))return;
 const holder=document.createElement("div");
 holder.className=inline?"kids-offline-inline":"kids-offline-entry";
 if(inline){
   // The detail view is reused for all stories. Replace the previous lesson's
   // action instead of accumulating buttons or affecting the category cards.
   card.querySelector(".kids-offline-inline")?.remove();
 }
 const btn=document.createElement("button");btn.type="button";btn.className="kids-item-download";
 btn.textContent="↓ Offline speichern";btn.dataset.offlineState="idle";
 btn.dataset.offlineTitle=spec.title||"Inhalt";
 const hint=document.createElement("span");hint.className="kids-download-hint";
 hint.textContent=spec.audio?"Audio & Text für unterwegs":spec.kind==="academy"?"Unterricht für unterwegs":"Text & Bild · Audio folgt";
 if(inline){holder.append(btn,hint);card.append(holder);}
 else{card.replaceWith(holder);holder.append(card,btn,hint);}
 if(!labels.has(key))labels.set(key,new Set());
 labels.get(key).add(btn);
 const files=unique((spec.urls||[]).map(allowed).filter(Boolean));
 async function refresh(){
  if(!files.length){mark(key,"Noch nicht verfügbar","missing");return;}
  try{
   const response=await post("KIDS_ITEM_STATUS",{key,files});
   if(response.ready)mark(key,spec.audio?"✓ Audio & Text offline":"✓ Text offline","ready");
   else if(!live.has(key))mark(key,"↓ Offline speichern","idle");
  }catch(_){if(!live.has(key))mark(key,"↓ Offline speichern","idle");}
 }
 btn.addEventListener("click",async()=>{
  if(live.has(key))return;
  if(btn.dataset.offlineState==="ready")return;
  if(!navigator.onLine){hint.textContent="Zum ersten Speichern benötigst du Internet.";return;}
  live.set(key,true);mark(key,"↓ Wird gespeichert …","busy");
  hint.textContent="Bitte die App geöffnet lassen.";
  try{
   await navigator.storage?.persist?.();
  }catch(_){}
  try{
   const reply=await post("KIDS_ITEM_SAVE",{key,files},m=>{
      mark(key,"↓ "+m.done+" / "+m.total+" Dateien","busy");
   });
   if(reply.ready){
    mark(key,spec.audio?"✓ Audio & Text offline":"✓ Text offline","ready");
    hint.textContent=spec.audio?"Offline hören, lesen und mitlesen":"Offline lesen & lernen · keine fertige Aufnahme vorhanden";
   }else{
    mark(key,"↻ Erneut speichern","error");
    hint.textContent=String(reply.error||"Nicht alles gespeichert – bitte mit Internet erneut versuchen.");
   }
   events();
  }catch(err){mark(key,"↻ Erneut speichern","error");hint.textContent=err.message||"Verbindung prüfen";}
  finally{live.delete(key)}
 });
 // Detail buttons are checked immediately; long Academy card lists are lazy.
 if(inline){refresh();return;}
 if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(x=>x.isIntersecting)){observer.disconnect();refresh();}
  },{rootMargin:"320px 0px"});
  observer.observe(btn);
 }else refresh();
}
function story(card,{category,item,sourceUrl,artwork,hero,audioMeta,readerUrl},inline=false){
 if(!item?.id)return;
 const audio=allowed(String(audioMeta?.url||""));
 const urls=[sourceUrl,readerUrl||"/kids/story-hub.js?v=26",
  "/kids/data/story-hub.json?v=7",
  "/kids/story-follow-reader.js?v=17",
  "/kids/story-follow-reader.css?v=10","/kids/story-hub.css?v=12",
  "/kids/story-policy.js?v=2",
  artwork,hero,audio];
 oneButton(card,{key:"story:"+category+":"+String(item.id)+":"+currentAge(),
 title:item.name||item.title||"Geschichte",kind:"story",audio:!!audio,urls},inline);
}
function deen(card,{item,audioMeta,cover,hero},inline=false){
 if(!item?.id)return;
 const audio=allowed(String(audioMeta?.url||""));
 const urls=["/kids/data/deen-lessons.json?v=3","/kids/deen-lessons.js?v=5",
  "/kids/deen-lessons.css?v=2","/kids/deen-learning-v1199.css?v=1199",
  "/kids/story-follow-reader.css?v=10","/kids/story-follow-reader.js?v=17",
  "/kids/story-policy.js?v=2",cover,hero,audio];
 oneButton(card,{key:"deen:"+String(item.id)+":"+currentAge(),
 title:item.title||item.name||"Unterricht",kind:"deen",audio:!!audio,urls},inline);
}
function academy(card,{id,title,subject}){
 if(!id)return;
 const subjectPictures={
  akhlaq:"/desktop-preview/assets/kids-academy-akhlaq-v1.jpg",
  adab:"/desktop-preview/assets/kids-academy-adab-v1.jpg",
  fiqh:"/kids/assets/deen/ibadah.jpg?v=1205",
  aqidah:"/kids/assets/deen/tawhid.jpg?v=1205"
 };
 const urls=["/kids/akademie/index.html",
  "/kids/akademie/curriculum-v1.js?v=20261010-01",
  "/kids/akademie/curriculum-v2.js?v=20261010-09",
  "/kids/akademie/school-progress-v11.js?v=20261010-11",
  "/kids/owner-voice.js?v=academy-serhat-v1-20261010",
  "/kids/data/academy-audio.json?v=1",
  "/kids/data/owner-voice-audio.json?v=2",
  "/kids/data/quiz-audio.json?v=2",
  "/kids/data/dua-audio.json?v=8",
  "/kids/data/dua-arabic-audio.json?v=8",
  "/desktop-preview/assets/kids-academy-hero-boys-v1.jpg",
  "/desktop-preview/assets/kids-academy-hero-v1.jpg",
  "/kids/assets/profile-avatars/boy-kufi-v1235.svg",
  subjectPictures[subject]];
 oneButton(card,{key:"academy:"+String(id),title,kind:"academy",audio:false,urls});
}
window.DARKidsItemDownloads=Object.freeze({
 story,deen,academy,
 storyDetail:(host,spec)=>story(host,spec,true),
 deenDetail:(host,spec)=>deen(host,spec,true)
});
})();
