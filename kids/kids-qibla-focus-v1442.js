/* KIDS_QIBLA_FOCUS_V1442
   Kids-only Qibla experience: location and live compass are distinct.
   No adult-app changes, no service worker or notification/push mutations. */
(function(){
"use strict";
const HOME=document.getElementById("view-today");
const stage=document.getElementById("kidsSalahStage");
const original=document.getElementById("kidsSalahOpenDay");
if(!HOME||!stage||!original||document.getElementById("kidsQiblaFocus"))return;
const PRAYER_PLACE="darkids_kids_prayer_place_v1";
const QIBLA_PLACE="kids.visitor.qibla.place.v1";
const KAABA={lat:21.4225,lon:39.8262};
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch(_){return null}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const valid=p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lon))<=180;
const norm=n=>(n%360+360)%360;
const angularDistance=(a,b)=>Math.abs(((a-b+540)%360)-180);
const QIBLA_ALIGN_ENTER=6,QIBLA_ALIGN_EXIT=9,QIBLA_ALIGN_STABLE_MS=250;
const bearing=p=>{
 const radians=x=>x*Math.PI/180;
 const a=radians(Number(p.lat)),b=radians(KAABA.lat),delta=radians(KAABA.lon-Number(p.lon));
 return norm(Math.atan2(Math.sin(delta)*Math.cos(b),Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(delta))*180/Math.PI);
};
const nameOf=p=>p?.name||p?.city||"Ausgewählter Ort";
let selected=null,source="none",heading=null,needleAngle=null,isOpen=false,searchTimer=null,searchTicket=0,request=null,liveTimer=null;
let lastFocus=null,wasInert=false,lastLiveMessage="",session=0,gpsRequest=0,sensorRequest=0;
let aligned=false,alignmentCandidateAt=0;
const controls=document.createElement("div");controls.className="kids-salah-shortcuts";
original.parentNode.insertBefore(controls,original);
controls.appendChild(original);
const titleText=original.firstChild;
if(titleText&&titleText.nodeType===Node.TEXT_NODE){
 const label=document.createElement("span");
 label.className="kids-shortcut-label";label.textContent="Gebetszeiten";
 original.replaceChild(label,titleText);
}
original.setAttribute("aria-label","Alle fünf Gebetszeiten ansehen");
const clockIcon=document.createElement("span");
clockIcon.className="kids-shortcut-emoji";clockIcon.setAttribute("aria-hidden","true");clockIcon.textContent="🕰️";
original.insertBefore(clockIcon,original.firstChild);
original.lastElementChild?.classList.add("kids-shortcut-tail");
const launch=document.createElement("button");
launch.type="button";launch.id="kidsQiblaQuick";launch.className="kids-salah-open-day kids-qibla-shortcut";
launch.setAttribute("aria-haspopup","dialog");
launch.innerHTML='<span class="kids-shortcut-emoji" aria-hidden="true">🧭</span><span class="kids-shortcut-label">Qibla</span><span class="kids-shortcut-tail" aria-hidden="true">›</span>';
controls.appendChild(launch);
const focus=document.createElement("section");
focus.id="kidsQiblaFocus";focus.className="kids-qibla-focus";focus.hidden=true;
focus.innerHTML=
 '<div class="kq-dialog" role="dialog" aria-modal="true" aria-labelledby="kqTitle" aria-describedby="kqDescription">'+
 '<div class="kq-header"><div><span class="kq-eyebrow">TAWḤĪD KIDS · RICHTUNG MAKKAH</span><h2 id="kqTitle">Mein Qibla-Kompass</h2></div>'+
 '<button type="button" id="kqClose" class="kq-close" aria-label="Qibla-Kompass schließen">×</button></div>'+
 '<p id="kqDescription" class="kq-description">Finde die Richtung zur Kaʿbah. Halte dein Gerät möglichst flach und fern von Metall.</p>'+
 '<div class="kq-compass-stage"><div class="kq-compass" role="img" aria-label="Qibla-Richtung; für echte Ausrichtung Kompass starten">'+
 '<span id="kqNeedle" class="kq-needle" aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false" aria-hidden="true"><path d="M50 8 76 78 50 64 24 78Z" fill="currentColor"/><path d="M50 16 50 64 34 70Z" fill="white" opacity=".38"/></svg></span><span class="kq-center" aria-hidden="true"></span></div>'+
 '<strong class="kq-bearing" id="kqBearing">—</strong><span class="kq-city" id="kqCity">Ort bestimmen</span>'+
 '<p id="kqLive" class="kq-live">Standort auswählen, um die Qibla zu berechnen.</p></div>'+
 '<div class="kq-actions"><button class="kq-button kq-button--primary" type="button" id="kqGps">📍 Mein Standort</button>'+
 '<button class="kq-button" type="button" id="kqSensor">🧭 Live-Kompass</button></div>'+
 '<button class="kq-button" type="button" id="kqPrayerPlace" style="width:100%">Vorhandenen Gebetsort verwenden</button>'+
 '<label class="kq-field" for="kqQuery">Oder Stadt suchen</label>'+
 '<input id="kqQuery" class="kq-search" type="search" autocomplete="off" autocapitalize="words" placeholder="z. B. Rheinbach, Köln, Istanbul">'+
 '<div class="kq-results" id="kqResults" role="region" aria-live="polite"></div>'+
 '<p class="kq-status" id="kqStatus" role="status">GPS und Kompass benötigen die Freigabe deines Geräts.</p>'+
 '<p class="kq-help">Standortfreigabe ist freiwillig. GPS-Daten bleiben in dieser Ansicht und werden nicht als Kinderprofil gespeichert. Stadtwahl bleibt nur auf diesem Gerät.</p></div>';
document.body.appendChild(focus);
const $=id=>document.getElementById(id);
const needle=$("kqNeedle"),status=$("kqStatus"),live=$("kqLive"),city=$("kqCity"),degree=$("kqBearing");
const query=$("kqQuery"),results=$("kqResults");
function syncTheme(){
 const app=document.querySelector(".app");
 const gender=app?.dataset.gender||document.documentElement.dataset.kidsBootGender||"boy";
 focus.dataset.gender=gender;
 // Share the actual parent profile's palette, including later appearance changes.
 const parent=document.getElementById("view-parents");
 if(parent){
  const computed=getComputedStyle(parent);
  for(const [local,source] of [
   ["--q-bg","--kp-card"],["--q-surface","--kp-raised"],
   ["--q-surface2","--kp-raised"],["--q-accent","--kp-accent"],
   ["--q-text","--kp-ink"],["--q-muted","--kp-muted"],["--q-edge","--kp-stroke"]
  ]){
   const value=computed.getPropertyValue(source).trim();
   if(value)focus.style.setProperty(local,value);
  }
 }
 for(const id of ["kidsVisitorSettingsSheet","kidsVisitorSettingsIntro"]){
  const el=$(id);
  if(el){
   el.dataset.gender=gender;
   if(parent){
    const palette=getComputedStyle(parent);
    for(const [local,source] of [["--kn-ink","--kp-ink"],["--kn-gold","--kp-accent"],["--kn-border","--kp-stroke"]]){
     const value=palette.getPropertyValue(source).trim();
     if(value)el.style.setProperty(local,value);
    }
   }
  }
 }
}
const app=document.querySelector(".app");
if(typeof MutationObserver!=="undefined"){
 if(app)new MutationObserver(syncTheme).observe(app,{attributes:true,attributeFilter:["class","data-gender","data-theme","data-appearance"]});
 new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:["class","data-kids-boot-gender","data-theme"]});
 // The parent's first-run invitation is mounted after a delay; tint it too.
 new MutationObserver(mutations=>{
  if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1&&
     (n.id==="kidsVisitorSettingsIntro"||n.id==="kidsVisitorSettingsSheet"))))syncTheme();
 }).observe(document.body,{childList:true});
}
syncTheme();
function selectPlace(place,kind){
 if(!valid(place))return false;
 clearAlignment();
 selected={lat:Number(place.lat),lon:Number(place.lon),name:nameOf(place)};
 source=kind;render();return true;
}
function setDefaultPlace(){
 const saved=get(QIBLA_PLACE),prayer=get(PRAYER_PLACE);
 if(valid(saved))selectPlace(saved,"city");
 else if(valid(prayer))selectPlace(prayer,"prayer");
 else{clearAlignment();selected=null;source="none";render()}
}
function setAligned(value){
 if(aligned===value)return;
 aligned=Boolean(value);
 focus.classList.toggle("is-aligned",aligned);
}
function clearAlignment(){
 alignmentCandidateAt=0;
 setAligned(false);
}
function render(){
 const q=selected?bearing(selected):null;
 degree.textContent=q===null?"—":Math.round(q)+"°";
 city.textContent=selected?nameOf(selected):"Bitte Standort oder Stadt wählen";
 const direction=q===null?null:heading===null?q:norm(q-heading);
 needle.style.opacity=q===null?".28":"1";
 if(direction!==null){
  if(needleAngle===null)needleAngle=direction;
  else needleAngle+=((direction-needleAngle+540)%360)-180;
  needle.style.transform="rotate("+needleAngle+"deg)";
 }
 if(q===null)live.textContent="Zuerst einen Ort auswählen.";
 else if(heading===null)live.textContent="Grad ab Norden · Live-Ausrichtung noch nicht aktiviert";
 else if(aligned)live.textContent="✨ Qibla gefunden! Du blickst Richtung Makkah.";
 else {
  const turn=((q-heading+540)%360)-180;
  live.textContent=Math.abs(turn)<=QIBLA_ALIGN_ENTER?
   "Fast geschafft! Halte das Gerät kurz ruhig.":
   "Drehe dich etwa "+Math.round(Math.abs(turn))+"° nach "+(turn>0?"rechts":"links")+".";
 }
 const badge=focus.querySelector(".kq-compass");
 if(badge)badge.setAttribute("aria-label",heading===null?"Qibla "+(q===null?"unbekannt":Math.round(q)+" Grad ab Norden"):"Live-Qibla, "+live.textContent);
}
function message(s){status.textContent=s}
function stopCompass(){
 window.removeEventListener("deviceorientation",onOrientation,true);
 window.removeEventListener("deviceorientationabsolute",onOrientation,true);
 clearTimeout(liveTimer);liveTimer=null;heading=null;lastLiveMessage="";
 clearAlignment();
}
function onOrientation(event){
 let value=null,accuracy=null;
 if(typeof event.webkitCompassHeading==="number"&&Number.isFinite(event.webkitCompassHeading)&&event.webkitCompassHeading>=0){
  value=norm(event.webkitCompassHeading);
  accuracy=typeof event.webkitCompassAccuracy==="number"?event.webkitCompassAccuracy:null;
  if(accuracy!==null&&(accuracy<0||accuracy>45)){
   heading=null;clearAlignment();render();message("Kompass nicht ausreichend kalibriert. Bitte das Gerät bewegen und Metall meiden.");return;
  }
 }else if(event.absolute===true&&typeof event.alpha==="number"&&Number.isFinite(event.alpha)){
  const angle=Number(screen.orientation?.angle??window.orientation??0)||0;
  value=norm(360-event.alpha+angle);
 }else return;
 if(!isOpen||value===null)return;
 heading=value;
 // A geographic bearing by itself cannot trigger success. Require accurate
 // NORTH-REFERENCED heading and at least 250ms of stable sensor agreement.
 const target=selected?bearing(selected):null;
 const difference=target===null?Infinity:angularDistance(target,value);
 const confidence=accuracy===null||(accuracy>=0&&accuracy<=25);
 if(confidence&&difference<=QIBLA_ALIGN_ENTER){
  if(!alignmentCandidateAt)alignmentCandidateAt=Date.now();
  if(Date.now()-alignmentCandidateAt>=QIBLA_ALIGN_STABLE_MS)setAligned(true);
 }else{
  alignmentCandidateAt=0;
  if(!confidence||difference>=QIBLA_ALIGN_EXIT||target===null)setAligned(false);
 }
 render();
 const info=aligned?"✨ Qibla gefunden! Die Richtung nach Makkah stimmt.":
  !confidence?"Kompass noch ungenau. Bitte das Gerät bewegen und kalibrieren.":
  "Live-Ausrichtung aktiv · Genauigkeit geräteabhängig.";
 if(lastLiveMessage!==info){message(info);lastLiveMessage=info}
}
async function startCompass(){
 const epoch=session,requestId=++sensorRequest;
 const Orientation=window.DeviceOrientationEvent;
 if(!Orientation){message("Kein Gerätesensor verfügbar. Die Gradzahl ab Norden bleibt nutzbar.");return}
 try{
  if(typeof Orientation.requestPermission==="function"){
   const permit=await Orientation.requestPermission();
   if(!isOpen||epoch!==session||requestId!==sensorRequest)return;
   if(permit!=="granted"){message("Kompass nicht freigegeben. Nutze die Gradzahl ab Norden.");return}
  }
  if(!isOpen||epoch!==session||requestId!==sensorRequest)return;
  stopCompass();
  message("Warte auf einen zuverlässigen Kompasswert …");
  window.addEventListener("deviceorientationabsolute",onOrientation,true);
  window.addEventListener("deviceorientation",onOrientation,true);
  liveTimer=setTimeout(()=>{
   if(isOpen&&heading===null)message("Kein verlässlicher Nordwert verfügbar. Bitte die Stadt-Richtung ab Norden verwenden oder die Gerätesensoren prüfen.");
  },3500);
 }catch(_){message("Gerätekompass ist hier nicht verfügbar. Bitte Berechtigungen prüfen.")}
}
function requestGps(){
 const epoch=session,requestId=++gpsRequest;
 if(!navigator.geolocation){message("GPS nicht verfügbar. Bitte Stadt suchen.");return}
 message("Dein Standort wird gesucht …");
 $("kqGps").disabled=true;
 navigator.geolocation.getCurrentPosition(pos=>{
  if(!isOpen||epoch!==session||requestId!==gpsRequest)return;
  $("kqGps").disabled=false;
  const p={lat:pos.coords.latitude,lon:pos.coords.longitude,name:"Mein aktueller Standort"};
  if(selectPlace(p,"gps"))message("GPS bestimmt"+(Number.isFinite(pos.coords.accuracy)?" (±"+Math.round(pos.coords.accuracy)+" m)":"")+". Jetzt kannst du den Live-Kompass starten.");
 },err=>{
  if(!isOpen||epoch!==session||requestId!==gpsRequest)return;
  $("kqGps").disabled=false;
  const denied=err?.code===1;
  message(denied?"Standort nicht erlaubt. Bitte in den Geräteeinstellungen erlauben oder eine Stadt suchen.":"Standort nicht erreichbar. Bitte eine Stadt auswählen oder erneut versuchen.");
 },{enableHighAccuracy:true,timeout:15000,maximumAge:15000});
}
function prayerPlace(){
 const p=get(PRAYER_PLACE);
 if(!valid(p)){message("Noch kein Gebetsort gewählt. Bitte GPS oder die Stadtsuche nutzen.");return}
 selectPlace(p,"prayer");message("Gebetsort übernommen. Für die Live-Ausrichtung Kompass starten.");
}
async function searchCity(term){
 const ticket=++searchTicket;
 if(request)request.abort();
 request=typeof AbortController==="function"?new AbortController():null;
 results.replaceChildren();
 if(term.length<2)return;
 const searching=document.createElement("p");searching.textContent="Suche Städte …";results.append(searching);
 try{
  const url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(term)+"&count=8&language=de&format=json";
  const response=await fetch(url,request?{signal:request.signal,cache:"no-store"}:{cache:"no-store"});
  if(!response.ok)throw Error("city search");
  const data=await response.json();
  if(ticket!==searchTicket||!isOpen)return;
  results.replaceChildren();
  const cities=Array.isArray(data.results)?data.results.filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)):[];
  if(!cities.length){results.textContent="Keinen Ort gefunden. Bitte anders schreiben.";return}
  for(const item of cities){
   const label=[item.name,item.admin1,item.country].filter(Boolean).join(", ");
   const button=document.createElement("button");
   button.type="button";button.className="kq-result";button.textContent=label;
   button.addEventListener("click",()=>{
    const p={lat:item.latitude,lon:item.longitude,name:label};
    selectPlace(p,"city");put(QIBLA_PLACE,p);
    results.replaceChildren();query.value="";query.blur();
    message("Ort gespeichert. Qibla-Richtung berechnet; Live-Ausrichtung bei Bedarf starten.");
   });
   results.appendChild(button);
  }
 }catch(error){
  if(ticket===searchTicket&&isOpen&&error?.name!=="AbortError")results.textContent="Stadtsuche derzeit nicht erreichbar. GPS oder Gebetsort verwenden.";
 }
}
function close(){
 if(!isOpen)return;
 isOpen=false;session++;gpsRequest++;sensorRequest++;stopCompass();clearTimeout(searchTimer);searchTicket++;
 if(request)request.abort();request=null;
 focus.hidden=true;document.body.classList.remove("kids-qibla-focus-open");
 if(app)app.inert=wasInert;
 if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
}
function open(){
 if(isOpen)return;
 lastFocus=document.activeElement;wasInert=Boolean(app?.inert);
 syncTheme();setDefaultPlace();heading=null;needleAngle=null;render();
 isOpen=true;session++;focus.hidden=false;
 document.body.classList.add("kids-qibla-focus-open");
 if(app)app.inert=true;
 results.replaceChildren();query.value="";$("kqGps").disabled=false;
 message("Nutze GPS oder deinen Gebetsort; Live-Kompass wird nur mit Sensorsignal aktiv.");
 $("kqClose").focus({preventScroll:true});
 // Do not trigger a new GPS permission prompt implicitly; reuse existing consent.
 if(navigator.permissions?.query){
  navigator.permissions.query({name:"geolocation"}).then(state=>{
   if(isOpen&&state.state==="granted"&&source!=="gps")requestGps();
  }).catch(()=>{});
 }
}
launch.addEventListener("click",open);
$("kqClose").addEventListener("click",close);
$("kqGps").addEventListener("click",requestGps);
$("kqSensor").addEventListener("click",startCompass);
$("kqPrayerPlace").addEventListener("click",prayerPlace);
query.addEventListener("input",()=>{
 clearTimeout(searchTimer);searchTicket++;
 if(request)request.abort();
 const term=query.value.trim();
 if(term.length<2){results.replaceChildren();return}
 searchTimer=setTimeout(()=>searchCity(term),320);
});
document.addEventListener("keydown",e=>{
 if(!isOpen)return;
 if(e.key==="Escape"){e.preventDefault();close();return}
 if(e.key!=="Tab")return;
 const fields=Array.from(focus.querySelectorAll("button:not(:disabled),input:not(:disabled)")).filter(x=>x.getClientRects().length);
 if(!fields.length)return;
 if(e.shiftKey&&document.activeElement===fields[0]){e.preventDefault();fields[fields.length-1].focus()}
 else if(!e.shiftKey&&document.activeElement===fields[fields.length-1]){e.preventDefault();fields[0].focus()}
},true);
document.addEventListener("touchmove",e=>{
 if(isOpen&&!focus.contains(e.target))e.preventDefault();
},{passive:false,capture:true});
window.addEventListener("pagehide",()=>{if(isOpen)close()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&isOpen){stopCompass();render();message("Kompass pausiert. Tippe nach Rückkehr auf Live-Kompass.")}});
function linkParentSettings(){
 const existing=$("knQiblaCompass");
 const section=existing?.closest(".kn-section");
 if(!section||section.dataset.kidsQiblaReplaced)return;
 section.dataset.kidsQiblaReplaced="true";
 const b=document.createElement("button");
 b.type="button";b.className="kn-btn kq-parent-entry";
 b.textContent="🧭 Qibla-Kompass öffnen";
 b.addEventListener("click",()=>{
  if(window.DARKidsVisitorNotificationSettings?.close)window.DARKidsVisitorNotificationSettings.close();
  open();
 });
 section.appendChild(b);syncTheme();
}
linkParentSettings();
document.addEventListener("DOMContentLoaded",linkParentSettings,{once:true});
window.DARKidsQiblaFocus={open,close,bearing:(lat,lon)=>valid({lat,lon})?bearing({lat,lon}):null,angularDistance};
})();