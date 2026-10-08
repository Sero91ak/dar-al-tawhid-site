/* KIDS SALAH STAGE V1 — five real prayer times, no fake/demo clock values.
   Keeps the established home hero and the listening-resume button intact. */
(function(){
"use strict";
const HOME=document.querySelector("#view-today");
const HERO=HOME&&HOME.querySelector(".hero");
if(!HERO||document.getElementById("kidsSalahStage"))return;
const STORE="darkids_kids_prayer_place_v1";
const CACHE="darkids_kids_prayer_days_v1";
const NAMES={fajr:"Fajr",dhuhr:"Dhuhr",asr:"ʿAṣr",maghrib:"Maghrib",isha:"ʿIshāʾ"};
const ORDER=["fajr","dhuhr","asr","maghrib","isha"];
const escapeHtml=value=>String(value==null?"":value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let place=null,days={},lastDay="",fetchTicket=0,lastFetch=0,lastAttempt=0;
try{place=JSON.parse(localStorage.getItem(STORE)||"null");}catch(_){}
if(!place||!Number.isFinite(+place.lat)||!Number.isFinite(+place.lon)||!place.tz)place=null;
try{if(place)new Intl.DateTimeFormat("en-GB",{timeZone:place.tz});}catch(_){place=null;}
try{const saved=JSON.parse(localStorage.getItem(CACHE)||"{}");if(saved&&saved.placeKey===placeKey(place)&&saved.days)days=saved.days;}catch(_){}
const stage=document.createElement("section");
stage.className="kids-salah-stage";
stage.id="kidsSalahStage";
stage.setAttribute("aria-label","Gebetszeiten");
stage.innerHTML=
  '<div class="kids-salah-top"><span class="kids-salah-kicker">DEIN GEBETSMOMENT</span>'+
  '<button class="kids-salah-location" id="kidsSalahLocation" type="button" aria-label="Gebetsort einstellen"><span id="kidsSalahCity">Ort wählen</span></button></div>'+
  '<h2 class="kids-salah-heading">Zeit für <em>Ṣalāh</em></h2>'+
  '<div class="kids-salah-time-pair">'+
  '<div class="kids-salah-now"><span class="kids-salah-pair-label">AKTUELL</span>'+
  '<strong id="kidsSalahCurrentName">Noch kein Gebet</strong>'+
  '<time id="kidsSalahCurrentTime">--:--</time></div>'+
  '<span class="kids-salah-time-divider" aria-hidden="true"></span>'+
  '<div class="kids-salah-upcoming"><span class="kids-salah-pair-label">ALS NÄCHSTES</span>'+
  '<span class="kids-salah-name" id="kidsSalahName">Dein nächstes Gebet</span>'+
  '<time class="kids-salah-clock" id="kidsSalahClock">--:--</time></div></div>'+
  '<div class="kids-salah-next"><i class="kids-salah-beat" aria-hidden="true"></i>'+
  '<span id="kidsSalahNextText">Standort einstellen</span><strong class="kids-salah-countdown" id="kidsSalahCountdown"></strong></div>'+
  '<div class="kids-salah-progress" aria-hidden="true"><span id="kidsSalahProgress"></span></div>'+
  '<div class="kids-salah-five" id="kidsSalahFive" aria-label="Fünf tägliche Gebetszeiten">'+
  ORDER.map(key=>'<button type="button" tabindex="-1" data-prayer="'+key+'"><span class="kids-salah-dot" aria-hidden="true"></span><span class="kids-salah-prayer">'+NAMES[key]+'</span><time>--:--</time></button>').join("")+
  '</div><button class="kids-salah-open-day" id="kidsSalahOpenDay" type="button">Alle Gebetszeiten ansehen <span aria-hidden="true">›</span></button>'+
  '<p class="kids-salah-status" id="kidsSalahStatus">Gebetszeiten passend zu deinem Ort.</p>';
HERO.insertAdjacentElement("afterend",stage);

/* Adobe static plate stays local; Runway ambient motion is also local after import.
   Low-power and reduced-motion users see the static high-contrast stage instead. */
if(!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches && !navigator.connection?.saveData){
 const motion=document.createElement("video");
 motion.className="kids-salah-motion";motion.muted=true;motion.loop=true;motion.playsInline=true;
 motion.autoplay=true;motion.preload="none";motion.controls=false;
 motion.setAttribute("playsinline","");motion.setAttribute("muted","");motion.setAttribute("aria-hidden","true");
 motion.poster="/kids/assets/kids-salah-v1262/cinematic-still.jpg";
 motion.onerror=()=>{motion.remove();};
 stage.insertBefore(motion,stage.firstChild);
 const startMotion=()=>{
  if(!motion.isConnected||document.hidden)return;
  if(!motion.src)motion.src="/kids/assets/kids-salah-v1262/cinematic-motion.mp4";
  const p=motion.play();if(p&&typeof p.catch==="function")p.catch(()=>{});
 };
 const stopMotion=()=>{try{motion.pause();}catch(_){}};
 if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(rows=>{
   if(rows[0]?.isIntersecting)startMotion();else stopMotion();
  },{threshold:.05});observer.observe(stage);
 }else{startMotion();}
 document.addEventListener("visibilitychange",()=>{if(document.hidden)stopMotion();else if(stage.getBoundingClientRect().bottom>0)startMotion();});
}

const $=sel=>stage.querySelector(sel);
const city=$("#kidsSalahCity"),prayerName=$("#kidsSalahName"),clock=$("#kidsSalahClock");
const nextText=$("#kidsSalahNextText"),countdown=$("#kidsSalahCountdown");
const status=$("#kidsSalahStatus"),progress=$("#kidsSalahProgress");
const currentName=$("#kidsSalahCurrentName"),currentTime=$("#kidsSalahCurrentTime");
$("#kidsSalahLocation").addEventListener("click",openSettings);

/* Full-page daily schedule: a new immersive surface, not another nested home card. */
const dayPage=document.createElement("section");
dayPage.className="kids-salah-day";
dayPage.id="kidsSalahDailyPage";
dayPage.hidden=true;
dayPage.setAttribute("aria-label","Tagesgebetszeiten");
dayPage.innerHTML=
 '<div class="kids-salah-day-body"><header class="kids-salah-day-header">'+
 '<button class="kids-salah-day-back" id="kidsSalahDayBack" type="button" aria-label="Zurück zur Startseite">‹</button>'+
 '<span class="kids-salah-day-brand">DĀR AL TAWḤĪD KIDS · ṢALĀH</span></header>'+
 '<h2>Unsere fünf <em>Gebete</em></h2>'+
 '<p class="kids-salah-day-subtitle">Hier siehst du alle Gebetszeiten für heute.</p>'+
 '<div class="kids-salah-day-place"><strong id="kidsSalahDayCity">Dein Gebetsort</strong>'+
 '<button type="button" id="kidsSalahDayLocation">Ort ändern</button></div>'+
 '<div class="kids-salah-day-list" id="kidsSalahDayList"></div>'+
 '<p class="kids-salah-day-notice">Die Gebetszeiten werden für deinen Ort und die ausgewählte Berechnungsmethode ermittelt. Bei abweichenden Angaben frage deine Eltern oder die Moschee vor Ort.</p></div>';
document.body.appendChild(dayPage);
const dayList=dayPage.querySelector("#kidsSalahDayList");
let lastRenderedDaySignature="";
const dayCity=dayPage.querySelector("#kidsSalahDayCity");
const dayBack=dayPage.querySelector("#kidsSalahDayBack");
$("#kidsSalahOpenDay").addEventListener("click",()=>{
 dayPage.hidden=false;document.body.classList.add("kids-salah-day-open");
 dayPage.dataset.gender=document.querySelector(".app")?.dataset.gender||"boy";
 renderDay();dayPage.scrollTop=0;dayBack.focus();
});
dayBack.addEventListener("click",closeDay);
dayPage.querySelector("#kidsSalahDayLocation").addEventListener("click",()=>{
 closeDay();openSettings();
});
function closeDay(){
 dayPage.hidden=true;document.body.classList.remove("kids-salah-day-open");
 $("#kidsSalahOpenDay").focus();
}
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&!dayPage.hidden&&overlay.hidden)closeDay();
});
function renderDay(){
 if(dayPage.hidden)return;
 dayCity.textContent=place?.name||"Gebetsort einstellen";
 if(!place){if(lastRenderedDaySignature!=="missing"){dayList.innerHTML='<p>Bitte wähle zuerst deinen Gebetsort.</p>';lastRenderedDaySignature="missing";}return;}
 let date;try{date=dateInZone(new Date(),place.tz);}catch(_){return;}
 const today=days[date];
 const all=[...entries(yesterday(date),days[yesterday(date)]),...entries(date,today),...entries(tomorrow(date),days[tomorrow(date)])];
 const now=Date.now(),previous=all.filter(i=>i.ts<=now).pop(),next=all.find(i=>i.ts>now);
 const sig=[date,placeKey(place),ORDER.map(key=>today?.times?.[key]?.time||"--:--").join(","),previous?.key,previous?.date,next?.key,next?.date].join("|");
 if(lastRenderedDaySignature===sig)return;
 lastRenderedDaySignature=sig;
 dayList.innerHTML=ORDER.map(key=>{
  const time=today?.times?.[key]?.time||"--:--";
  const current=previous?.key===key&&previous?.date===date;
  const following=next?.key===key&&next?.date===date;
  return '<div class="kids-salah-day-item'+(current?' is-current':following?' is-next':'')+'">'+
   '<div class="kids-salah-day-item-name"><strong>'+NAMES[key]+'</strong><small>'+
   (current?'AKTUELLES GEBET':following?'ALS NÄCHSTES':'TAGESGEBET')+
   '</small></div><time>'+time+'</time></div>';
 }).join("");
}


const overlay=document.createElement("div");
overlay.className="kids-salah-overlay";overlay.hidden=true;
overlay.innerHTML=
 '<div class="kids-salah-dialog" role="dialog" aria-modal="true" aria-labelledby="kidsSalahModalTitle">'+
 '<button type="button" class="kids-salah-close" id="kidsSalahClose" aria-label="Schließen">Schließen</button>'+
 '<h2 id="kidsSalahModalTitle">Dein Gebetsort</h2>'+
 '<p>Damit deine Gebetszeiten stimmen, wähle deinen Ort. Bitte deine Eltern um Hilfe.</p>'+
 '<button type="button" class="kids-salah-primary" id="kidsSalahGps">Meinen Standort verwenden</button>'+
 '<label for="kidsSalahQuery">Oder Stadt suchen</label>'+
 '<input id="kidsSalahQuery" type="search" autocomplete="off" placeholder="z. B. Bonn, Berlin, Istanbul">'+
 '<div class="kids-salah-results" id="kidsSalahResults" aria-live="polite"></div>'+
 '<details><summary>Berechnung einstellen (für Eltern)</summary>'+
 '<label for="kidsSalahAngle">Fajr-/ʿIshāʾ-Winkel</label>'+
 '<select id="kidsSalahAngle"><option value="12">12°</option><option value="15">15°</option><option value="18">18°</option></select>'+
 '<label for="kidsSalahAsr">ʿAṣr-Berechnung</label>'+
 '<select id="kidsSalahAsr"><option value="1">Standard (Faktor 1)</option><option value="2">Ḥanafī (Faktor 2)</option></select>'+
 '<button class="kids-salah-primary" id="kidsSalahSaveMethod" type="button" style="margin-top:12px">Einstellungen speichern</button>'+
 '</details><p class="kids-salah-err" id="kidsSalahErr" role="status"></p></div>';
document.body.appendChild(overlay);
const dialog=overlay.querySelector(".kids-salah-dialog");
const q=overlay.querySelector("#kidsSalahQuery");
const results=overlay.querySelector("#kidsSalahResults");
const err=overlay.querySelector("#kidsSalahErr");
const angle=overlay.querySelector("#kidsSalahAngle");
const asr=overlay.querySelector("#kidsSalahAsr");
let inputTimer=null,searchTicket=0;
overlay.querySelector("#kidsSalahClose").addEventListener("click",closeSettings);
overlay.addEventListener("click",e=>{if(e.target===overlay)closeSettings();});
document.addEventListener("keydown",e=>{if(!overlay.hidden&&e.key==="Escape")closeSettings();});
overlay.querySelector("#kidsSalahGps").addEventListener("click",()=>{
 err.textContent="";
 if(!navigator.geolocation){err.textContent="Standort ist hier nicht verfügbar. Suche bitte deine Stadt.";return;}
 navigator.geolocation.getCurrentPosition(pos=>{
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"Europe/Berlin";
  setPlace({lat:+pos.coords.latitude.toFixed(3),lon:+pos.coords.longitude.toFixed(3),tz,name:"Dein Standort"});
  closeSettings();
 },()=>{err.textContent="Standort nicht freigegeben. Suche bitte deine Stadt.";},
 {enableHighAccuracy:false,timeout:15000,maximumAge:30*60*1000});
});
function openSettings(){
 overlay.hidden=false;err.textContent="";results.innerHTML="";
 angle.value=String(place?.angle||12);asr.value=String(place?.asr||1);
 overlay.querySelector("#kidsSalahClose").focus();
}
function closeSettings(){overlay.hidden=true;$("#kidsSalahLocation").focus();}
overlay.querySelector("#kidsSalahSaveMethod").addEventListener("click",()=>{
 if(!place){err.textContent="Wähle bitte zuerst deinen Gebetsort.";return;}
 setPlace({...place,angle:Number(angle.value),asr:Number(asr.value)});closeSettings();
});
q.addEventListener("input",()=>{
 clearTimeout(inputTimer);const text=q.value.trim();
 if(text.length<2){results.innerHTML="";return;}
 inputTimer=setTimeout(()=>searchCity(text),350);
});
async function searchCity(query){
 const request=++searchTicket;results.textContent="Suche Orte …";
 try{
  const url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(query)+"&count=7&language=de&format=json";
  const response=await fetch(url);
  if(!response.ok)throw new Error("Search unavailable");
  const data=await response.json();
  if(request!==searchTicket)return;
  const rows=Array.isArray(data.results)?data.results:[];
  results.innerHTML="";
  if(!rows.length){results.textContent="Kein Ort gefunden. Bitte anders schreiben.";return;}
  rows.forEach(item=>{
   if(!Number.isFinite(+item.latitude)||!Number.isFinite(+item.longitude)||!item.timezone)return;
   const b=document.createElement("button");b.type="button";
   b.textContent=[item.name,item.admin1,item.country].filter(Boolean).join(", ");
   b.addEventListener("click",()=>{
    setPlace({lat:Number(item.latitude.toFixed(3)),lon:Number(item.longitude.toFixed(3)),tz:item.timezone,
      name:[item.name,item.country_code].filter(Boolean).join(", ")});
    closeSettings();
   });
   results.appendChild(b);
  });
 }catch(_){if(request===searchTicket)results.textContent="Die Ortssuche ist gerade nicht verfügbar. Nutze bitte den Standortknopf.";}
}
function placeKey(p){return p?[p.lat,p.lon,p.tz,p.angle||12,p.asr||1].join("|"):"";}
function setPlace(p){
 const changed=placeKey(place)!==placeKey(p);
 place=p;
 try{localStorage.setItem(STORE,JSON.stringify(p));}catch(_){}
 if(changed){days={};lastFetch=0;lastAttempt=0;try{localStorage.removeItem(CACHE);}catch(_){}}
 draw();refresh();
}
function dateInZone(date,tz){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const get=t=>parts.find(p=>p.type===t)?.value||"";
 return get("year")+"-"+get("month")+"-"+get("day");
}
function tomorrow(date){
 const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+1);
 return d.toISOString().slice(0,10);
}
function yesterday(date){
 const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-1);
 return d.toISOString().slice(0,10);
}
function prayerUtc(date,hm,tz){
 const match=/^(\d{1,2}):(\d{2})$/.exec(String(hm||""));if(!match)return NaN;
 const [y,m,d]=date.split("-").map(Number);
 const wanted=Date.UTC(y,m-1,d,+match[1],+match[2]);
 let actual=wanted;
 const formatter=new Intl.DateTimeFormat("en-GB",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 for(let n=0;n<3;n++){
  const parts=formatter.formatToParts(new Date(actual));
  const val=t=>Number(parts.find(p=>p.type===t)?.value||0);
  const visible=Date.UTC(val("year"),val("month")-1,val("day"),val("hour"),val("minute"));
  actual+=wanted-visible;
 }
 return actual;
}
function hhmm(seconds){
 const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
 return [h,m,s].map(n=>String(n).padStart(2,"0")).join(":");
}
function entries(date,data){
 if(!data?.times)return[];
 return ORDER.map(key=>{
  const v=data.times[key]?.time;return{key,date,time:v,ts:prayerUtc(date,v,place.tz)};
 }).filter(p=>Number.isFinite(p.ts));
}
function draw(){
 city.textContent=place?.name||"Ort wählen";
 if(!place){currentName.textContent="Gebetsort wählen";currentTime.textContent="--:--";prayerName.textContent="Nächstes Gebet";clock.textContent="--:--";nextText.textContent="Standort einstellen";
  countdown.textContent="";status.textContent="Wähle deinen Ort für zuverlässige Gebetszeiten.";
  progress.style.width="0%";return;}
 let today;
 try{today=dateInZone(new Date(),place.tz);}catch(_){status.textContent="Zeitzone prüfen";return;}
 if(today!==lastDay){lastDay=today;lastFetch=0;}
 const now=Date.now(),list=[...entries(yesterday(today),days[yesterday(today)]),...entries(today,days[today]),...entries(tomorrow(today),days[tomorrow(today)])].sort((a,b)=>a.ts-b.ts);
 const todays=days[today];
 ORDER.forEach(key=>{
  const b=$("#kidsSalahFive").querySelector('[data-prayer="'+key+'"]');
  b.querySelector("time").textContent=todays?.times?.[key]?.time||"--:--";
  b.setAttribute("aria-current","false");
 });
 const previous=list.filter(p=>p.ts<=now).pop();
 currentName.textContent=previous?NAMES[previous.key]:"Wird geladen";
 currentTime.textContent=previous?.time||"--:--";
 const next=list.find(p=>p.ts>now);
 if(!next){
  prayerName.textContent="Gebetszeiten";clock.textContent="--:--";nextText.textContent="Nächstes Gebet wird geladen";
  countdown.textContent="";progress.style.width="0%";
  status.textContent=todays?"Die nächste Gebetszeit wird aktualisiert.":"Gebetszeiten werden geladen …";
  return;
 }
 const tomorrowPrayer=next.date!==today;
 prayerName.textContent=(tomorrowPrayer?"Morgen · ":"")+NAMES[next.key];
 clock.textContent=next.time;
 const remaining=Math.max(0,Math.ceil((next.ts-now)/1000));
 nextText.textContent="Beginnt in";
 countdown.textContent=hhmm(remaining);
 const b=$("#kidsSalahFive").querySelector('[data-prayer="'+next.key+'"]');
 if(!tomorrowPrayer&&b)b.setAttribute("aria-current","true");
 const start=previous?.ts||prayerUtc(today,"00:00",place.tz);
 const width=Math.max(0,Math.min(100,((now-start)/(next.ts-start))*100));
 progress.style.width=width.toFixed(2)+"%";
 status.textContent="Berechnet für "+(place.name||"deinen Ort")+(navigator.onLine?"":" · Offline-Daten");
 renderDay();
}
async function refresh(){
 if(!place)return;
 lastAttempt=Date.now();
 const ticket=++fetchTicket,now=new Date(),today=dateInZone(now,place.tz),tom=tomorrow(today),prev=yesterday(today);
 const stale=[prev,today,tom].filter(day=>!days[day]||days[day].date!==day||Date.now()-lastFetch>60*60*1000);
 if(!stale.length){draw();return;}
 let succeeded=false;
 await Promise.all(stale.map(async day=>{
  const params=new URLSearchParams({lat:String(place.lat),lon:String(place.lon),tz:place.tz,
   angle:String(place.angle||12),asr:String(place.asr||1),date:day});
  try{
   const response=await fetch("/api/prayer/times?"+params,{cache:"no-store"});
   if(!response.ok)throw new Error("prayer API unavailable");
   const data=await response.json();
   if(ticket!==fetchTicket)return;
   if(data.ok&&data.date===day&&data.times&&ORDER.every(k=>data.times[k]?.time)){
    days[day]=data;succeeded=true;
   }
  }catch(_){}
 }));
 if(ticket!==fetchTicket)return;
 if(succeeded){lastFetch=Date.now();try{localStorage.setItem(CACHE,JSON.stringify({placeKey:placeKey(place),days}));}catch(_){}}
 draw();
 renderDay();
 if(!days[today])status.textContent="Verbindung fehlt. Bitte später erneut versuchen.";
}
draw();
if(place)refresh();
setInterval(()=>{
 if(!place)return;
 draw();
 const current=dateInZone(new Date(),place.tz);
 if(Date.now()-lastAttempt>60*1000&&(current!==lastDay||!days[current]||Date.now()-lastFetch>65*60*1000))refresh();
},1000);
window.addEventListener("online",()=>{if(place)refresh();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&place)refresh();});
})();
