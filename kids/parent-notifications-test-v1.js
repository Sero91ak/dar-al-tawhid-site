/* KIDS_TEST_PARENT_SETTINGS_V1: creator staging only. No live OneSignal sends. */
(function(){
"use strict";
const TEST_HOST="dar-al-tawhid-kids-creator.sero91ak.workers.dev";
if(location.hostname!==TEST_HOST && window.DAR_KIDS_TEST_CONTAINER!==true)return;
if(window.DARKidsTestNotificationSettings)return;
const PREF="kids.test.notify.preferences.v1",SEEN="kids.test.notify.welcome.v1",QIBLA="kids.test.qibla.place.v1";
const PRAYER_PLACE="darkids_kids_prayer_place_v1",PRAYER_CACHE="darkids_kids_prayer_days_v1";
const CHANNELS=[["prayer","Fünf Gebete","Gebetszeiten individuell auswählen"],["learning","Lernen fortsetzen","An begonnene Lerneinheiten erinnern"],["quiz","Quiz fortsetzen","Unterbrochene Quizrunden"],["content","Neue Inhalte","Geschichten und Lernangebote"]];
const PRAYERS=[["fajr","Fajr"],["dhuhr","Ẓuhr"],["asr","ʿAṣr"],["maghrib","Maġrib"],["isha","ʿIšāʾ"]];
const $=id=>document.getElementById(id);
const get=k=>{try{return localStorage.getItem(k)}catch(_){return null}};
const set=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
const nativeAvailable=()=>Boolean(window.DAR_KIDS_TEST_CONTAINER && window.webkit?.messageHandlers?.darKidsTestNotifications);
let nativePermission="unknown", opened=false, focused=null, selectedCity=null, heading=null, compassListener=null, seq=0, inputTimer=null;
function defaults(){return{channels:{prayer:false,learning:false,quiz:false,content:false},prayers:{fajr:true,dhuhr:true,asr:true,maghrib:true,isha:true},advance:0}}
function load(){
 const d=defaults();try{const p=JSON.parse(get(PREF)||"null");if(!p||typeof p!=="object")return d;
 for(const key of Object.keys(d.channels))d.channels[key]=p.channels?.[key]===true;
 for(const [key] of PRAYERS)d.prayers[key]=p.prayers?.[key]!==false;
 d.advance=[0,5,10,15,30].includes(Number(p.advance))?Number(p.advance):0;
 }catch(_){}
 return d;
}
function save(s){set(PREF,JSON.stringify(s));window.dispatchEvent(new Event("kids-test-notification-preferences-changed"));nativeSchedule()}
function element(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function message(txt){if($("knStatus"))$("knStatus").textContent=txt}
function deviceMessage(action){
 if(!nativeAvailable())return false;
 try{window.webkit.messageHandlers.darKidsTestNotifications.postMessage({action});return true}catch(_){return false}
}
function permissionStatus(){
 if(!nativeAvailable())return "Browser-Vorschau: Die Systemfreigabe funktioniert im nativen iOS-Testbuild.";
 if(nativePermission==="granted")return "iOS: Lokale Testmitteilungen sind auf diesem Gerät erlaubt.";
 if(nativePermission==="denied")return "iOS: Benachrichtigungen sind in den Systemeinstellungen gesperrt.";
 if(nativePermission==="notDetermined")return "iOS: Die Benachrichtigungsfreigabe wurde noch nicht angefragt.";
 return "iOS-Berechtigungsstatus wird geprüft …";
}
function refreshPermission(){
 if($("knPermissionState"))$("knPermissionState").textContent=permissionStatus();
 if($("knPermissionRequest"))$("knPermissionRequest").disabled=!nativeAvailable();
 if($("knSendTest"))$("knSendTest").disabled=!nativeAvailable()||nativePermission!=="granted";
 if($("knOpenSettings"))$("knOpenSettings").hidden=!nativeAvailable()||nativePermission!=="denied";
}
function refreshSummary(){
 const s=load();const n=Object.values(s.channels).filter(Boolean).length;
 if($("knEntryStatus"))$("knEntryStatus").textContent=n?n+" Bereiche ausgewählt":"Noch keine Erinnerungen ausgewählt";
 if($("knSaved"))$("knSaved").textContent=n+" Bereiche vorgemerkt · lokal gespeichert · kein Fernversand";
 if($("knPrayerSettings"))$("knPrayerSettings").style.opacity=s.channels.prayer?"1":".65";
}
function prayerPlace(){
 try{const p=JSON.parse(get(PRAYER_PLACE)||"null");if(p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))&&p.tz)return p}catch(_){}
 return null;
}
function qiblaPlace(){
 if(selectedCity)return selectedCity;
 try{const p=JSON.parse(get(QIBLA)||"null");if(p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)))return p}catch(_){}
 return prayerPlace();
}
function qiblaBearing(p){
 if(!p)return null;
 const rad=x=>Number(x)*Math.PI/180, a=rad(p.lat), k=rad(21.4225), dl=rad(39.8262)-rad(p.lon);
 return (Math.atan2(Math.sin(dl)*Math.cos(k),Math.cos(a)*Math.sin(k)-Math.sin(a)*Math.cos(k)*Math.cos(dl))*180/Math.PI+360)%360;
}
function refreshQibla(){
 const place=qiblaPlace(),bearing=qiblaBearing(place);
 if($("knQiblaCity"))$("knQiblaCity").textContent=place?.name||place?.city||"Bitte Stadt oder Gebetsort wählen";
 if($("knQiblaDegree"))$("knQiblaDegree").textContent=bearing===null?"—":Math.round(bearing)+"°";
 if($("knQiblaArrow"))$("knQiblaArrow").style.transform="rotate("+((bearing===null?0:bearing)-(heading||0))+"deg)";
 if($("knQiblaArrow")?.parentElement)$("knQiblaArrow").parentElement.classList.toggle("is-live",heading!==null);
 if($("knQiblaNote"))$("knQiblaNote").textContent=bearing===null?"Ort wählen, um die Richtung zu berechnen.":heading===null?"Geografische Richtung in Grad ab Norden.":"Live-Ausrichtung über den Gerätesensor (Genauigkeit geräteabhängig).";
}
// Schedule local alerts only for already calculated real Kids Salah times.
function localPrayerMillis(day,hm,tz){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{1,2}:\d{2}$/.test(hm))return NaN;
 const [y,m,d]=day.split("-").map(Number),[h,minute]=hm.split(":").map(Number);
 if(h>23||minute>59)return NaN;
 const expected=Date.UTC(y,m-1,d,h,minute);
 let actual=expected;
 try{
  const fmt=new Intl.DateTimeFormat("en-GB",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  for(let i=0;i<4;i++){
   const p=fmt.formatToParts(new Date(actual)),n=k=>Number(p.find(x=>x.type===k)?.value||0);
   actual+=expected-Date.UTC(n("year"),n("month")-1,n("day"),n("hour"),n("minute"));
  }
 }catch(_){return NaN}
 return actual;
}
function nativeSchedule(){
 if(!nativeAvailable()||nativePermission!=="granted")return;
 const s=load(),place=prayerPlace(),schedule=[];
 if(s.channels.prayer&&place){
  try{
   const cache=JSON.parse(get(PRAYER_CACHE)||"null");
   const placeKey=[place.lat,place.lon].join("|");
   if(cache?.days&&String(cache.placeKey||"").startsWith(placeKey)){
    const now=Date.now();
    const days=Object.keys(cache.days).sort();
    for(const day of days){
     for(const [key,label] of PRAYERS){
      if(!s.prayers[key])continue;
      const hm=cache.days[day]?.times?.[key]?.time;
      if(!hm)continue;
      const epoch=localPrayerMillis(day,hm,place.tz)-s.advance*60000;
      if(!Number.isFinite(epoch)||epoch<now+60000||epoch>now+48*3600000)continue;
      schedule.push({key,day,label,epoch,advance:s.advance});
     }
    }
   }
  }catch(_){}
 }
 schedule.sort((a,b)=>a.epoch-b.epoch);
 try{window.webkit.messageHandlers.darKidsTestNotifications.postMessage({
  action:"syncSchedule",schedule:schedule.slice(0,14)
 })}catch(_){}
}
function prayerDate(tz){
 try{
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:tz||"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const n=k=>parts.find(x=>x.type===k)?.value||"";
 return n("year")+"-"+n("month")+"-"+n("day");
 }catch(_){return new Date().toISOString().slice(0,10)}
}
function refreshPrayers(){
 const place=prayerPlace();let days=null;
 try{
 const cache=JSON.parse(get(PRAYER_CACHE)||"null");const match=place?[place.lat,place.lon].join("|"):null;
 if(cache?.days&&match&&String(cache.placeKey||"").startsWith(match))days=cache.days[prayerDate(place.tz)]?.times||null;
 }catch(_){}
 if($("knPrayerPlace"))$("knPrayerPlace").textContent=place?.name||"Bitte Gebetsort wählen";
 for(const [key] of PRAYERS)if($("knPrayerTime_"+key))$("knPrayerTime_"+key).textContent=days?.[key]?.time||"--:--";
 if($("knPrayerNote"))$("knPrayerNote").textContent=days?"Aus dem echten Kids-Gebetszeitenbereich übernommen.":"Gebetsort und Gebetszeiten auf „Heute“ auswählen. Es werden keine Uhrzeiten erfunden.";
}
function stopCompass(){
 if(compassListener)window.removeEventListener("deviceorientation",compassListener,true);
 compassListener=null;heading=null;
}
async function startCompass(){
 if(!("DeviceOrientationEvent" in window)){message("Live-Kompass wird auf diesem Gerät nicht unterstützt.");return}
 try{
 if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!=="granted"){
 message("Kompassfreigabe nicht erteilt.");return;
 }
 stopCompass();let got=false;
 compassListener=event=>{
  const v=Number(event.webkitCompassHeading);
  if(!Number.isFinite(v)||v<0||v>=360)return;
  got=true;heading=v;refreshQibla();
 };
 window.addEventListener("deviceorientation",compassListener,true);
 setTimeout(()=>{if(opened&&!got)message("Kein präziser Kompasswert verfügbar. Die geografische Qibla-Gradzahl bleibt nutzbar.")},2200);
 }catch(_){message("Kompass momentan nicht verfügbar.")}
}
async function queryCity(q){
 const local=++seq,root=$("knCityResults");if(!root)return;
 if(q.trim().length<2){root.replaceChildren();return}
 root.replaceChildren(element("p","", "Suche Orte …"));
 try{
 const resp=await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(q)+"&count=6&language=de&format=json",{cache:"no-store"});
 if(!resp.ok)throw Error("search");
 const rows=(await resp.json()).results||[];if(local!==seq)return;
 root.replaceChildren();
 if(!rows.length){root.append(element("p","","Keine Stadt gefunden."));return}
 for(const x of rows.filter(v=>Number.isFinite(v.latitude)&&Number.isFinite(v.longitude))){
  const name=[x.name,x.admin1,x.country].filter(Boolean).join(", ");
  const b=element("button","",name);b.type="button";
  b.addEventListener("click",()=>{
   selectedCity={name,lat:x.latitude,lon:x.longitude,tz:x.timezone||"UTC"};
   set(QIBLA,JSON.stringify(selectedCity));heading=null;
   root.replaceChildren();$("knCityQuery").value="";refreshQibla();
  });
  root.append(b);
 }
 }catch(_){if(local===seq)root.replaceChildren(element("p","","Stadtsuche derzeit nicht erreichbar."))}
}
function hideWelcome(){
 set(SEEN,"1");if($("kidsTestSettingsIntro"))$("kidsTestSettingsIntro").hidden=true;
}
function open(){
 const sheet=$("kidsTestSettingsSheet");if(!sheet)return;
 focused=document.activeElement;sheet.hidden=false;opened=true;
 $("knClose").focus({preventScroll:true});
 hideWelcome();refreshSummary();refreshPrayers();refreshQibla();refreshPermission();
 deviceMessage("status");
 nativeSchedule();
}
function close(){
 if(!$("kidsTestSettingsSheet"))return;
 $("kidsTestSettingsSheet").hidden=true;opened=false;stopCompass();
 if(focused?.isConnected)focused.focus({preventScroll:true});
}
function setupWelcome(){
 if(get(SEEN))return;
 const toast=element("aside","");toast.id="kidsTestSettingsIntro";toast.hidden=true;
 toast.innerHTML='<strong>Eltern-Einstellungen entdecken</strong><p>Gebetserinnerungen, Quiz und Qibla freiwillig einrichten. Noch wird nichts versendet.</p>';
 const now=element("button","kn-btn kn-btn-primary","Einstellen");now.type="button";now.addEventListener("click",open);
 const later=element("button","kn-btn","Später");later.type="button";later.addEventListener("click",hideWelcome);
 toast.append(now,later);document.body.append(toast);
 let attempts=0;
 const offerAfterOnboarding=()=>{
  if(get(SEEN))return;
  // Do not interrupt the initial child profile selection or welcome screen.
  if($("profileJoin")?.hidden===false||$("kidsJoin")?.classList.contains("open")){
   if(++attempts<60)setTimeout(offerAfterOnboarding,1000);
   return;
  }
  toast.hidden=false;set(SEEN,"1");
 };
 setTimeout(offerAfterOnboarding,3800);
}
function init(){
 const page=$("view-parents");
 if(!page||$("kidsTestSettingsEntry"))return;
 const card=element("section","parent-card");card.id="kidsTestSettingsEntry";
 const btn=element("button","kn-entry");btn.type="button";btn.id="knOpen";
 btn.innerHTML='<span class="kn-bell" aria-hidden="true">✦</span><span class="kn-entry-copy"><small>ELTERN · EINSTELLUNGEN</small><strong>Benachrichtigungen &amp; Qibla</strong><span id="knEntryStatus">Benachrichtigungen einrichten</span></span><span class="kn-chevron" aria-hidden="true">›</span>';
 btn.addEventListener("click",open);card.append(btn);
 page.querySelector(".page-head")?.after(card);
 const sheet=element("div","");sheet.id="kidsTestSettingsSheet";sheet.hidden=true;
 sheet.innerHTML=[
 '<div class="kn-panel" role="dialog" aria-modal="true" aria-labelledby="knTitle">',
 '<div class="kn-top"><div><small>TAWḤĪD KIDS · ELTERNBEREICH</small><h2 id="knTitle">Mitteilungen &amp; Qibla</h2></div><button id="knClose" class="kn-close" type="button" aria-label="Schließen">×</button></div>',
 '<div class="kn-body"><div class="kn-hero"><strong>Ein ruhiger Rhythmus für dein Kind</strong><p>Eltern entscheiden, an welche Gebete, Lernschritte und Inhalte erinnert werden soll. Alles ist freiwillig.</p></div>',
 '<p id="knPermissionState" class="kn-status" role="status">iOS-Berechtigung wird geprüft …</p>',
 '<div class="kn-controls"><button id="knPermissionRequest" class="kn-btn kn-btn-primary" type="button">Benachrichtigungen erlauben</button><button id="knSendTest" class="kn-btn" type="button">Testmitteilung</button><button id="knOpenSettings" class="kn-btn" type="button" hidden>iOS-Einstellungen</button></div>',
 '<p id="knStatus" class="kn-status" role="status">Testmodus: Einstellungen lokal, keine echten OneSignal-Fernbenachrichtigungen.</p>',
 '<div class="kn-section"><h3>Welche Erinnerungen?</h3><p>Alle Kategorien sind einzeln wählbar.</p><div id="knChannels"></div></div>',
 '<div class="kn-section" id="knPrayerSettings"><h3>Gebetszeiten · fünf Gebete</h3><p id="knPrayerPlace">Gebetsort wählen</p>',
 '<div class="kn-controls"><label for="knAdvance">Erinnern</label><select id="knAdvance"><option value="0">Zur Gebetszeit</option><option value="5">5 Min. vorher</option><option value="10">10 Min. vorher</option><option value="15">15 Min. vorher</option><option value="30">30 Min. vorher</option></select><button id="knPrayerLocation" type="button" class="kn-btn">Gebetsort / Berechnung</button></div>',
 '<div id="knFive"></div><p id="knPrayerNote"></p></div>',
 '<div class="kn-section"><h3>Schnell-Qibla · Richtung Makkah</h3><p>Stadt suchen oder den vorhandenen Gebetsort nutzen. Der Ort bleibt lokal.</p>',
 '<div class="kn-card"><div class="kn-qibla-bearing"><div class="kn-qibla-dial"><span id="knQiblaArrow" class="kn-qibla-arrow" aria-hidden="true">↑</span></div><div><strong id="knQiblaDegree" class="kn-qibla-value">—</strong><span id="knQiblaCity" class="kn-qibla-city">Ort wählen</span></div></div>',
 '<p id="knQiblaNote"></p><label for="knCityQuery">Stadt für Qibla suchen</label><input id="knCityQuery" type="search" autocomplete="off" placeholder="z. B. Köln, Istanbul">',
 '<div id="knCityResults" class="kn-results" role="region" aria-live="polite"></div>',
 '<div class="kn-controls"><button id="knQiblaPlace" class="kn-btn" type="button">Gebetsort verwenden</button><button id="knQiblaGps" class="kn-btn" type="button">GPS (freiwillig)</button><button id="knQiblaCompass" class="kn-btn" type="button">Live-Ausrichtung</button></div></div></div>',
 '<p class="kn-status" id="knSaved">Noch keine Bereiche ausgewählt.</p>',
 '<p style="opacity:.76;font-size:12px;line-height:1.5">KIDS TEST: Ein lokaler iOS-Testalarm ist nicht dasselbe wie ein OneSignal-Push. Für echten Fernversand benötigen wir getrennte Kids-Test-APNs-Zugangsdaten.</p>',
 '</div></div>'
 ].join("");
 document.body.append(sheet);
 $("knClose").addEventListener("click",close);
 sheet.addEventListener("click",e=>{if(e.target===sheet)close()});
 document.addEventListener("keydown",e=>{
  if(!opened)return;
  if(e.key==="Escape"){e.preventDefault();close();return}
  if(e.key==="Tab"){
   const fields=Array.from(sheet.querySelectorAll("button:not([disabled]):not([hidden]),input:not([disabled]),select:not([disabled])")).filter(x=>x.offsetWidth>0);
   if(!fields.length)return;
   if(e.shiftKey&&document.activeElement===fields[0]){e.preventDefault();fields[fields.length-1].focus()}
   if(!e.shiftKey&&document.activeElement===fields[fields.length-1]){e.preventDefault();fields[0].focus()}
  }
 });
 for(const [key,name,subtitle] of CHANNELS){
  const row=element("label","kn-row"),copy=element("span","");
  copy.append(element("strong","",name),element("small","",subtitle));
  const input=element("input","");input.type="checkbox";input.checked=load().channels[key];
  input.setAttribute("aria-label",name);
  input.addEventListener("change",()=>{const s=load();s.channels[key]=input.checked;save(s);refreshSummary()});
  row.append(copy,input);$("knChannels").append(row);
 }
 for(const [key,label] of PRAYERS){
  const row=element("div","kn-prayer"),lab=element("label",""),cb=element("input","");
  cb.type="checkbox";cb.checked=load().prayers[key];cb.setAttribute("aria-label",label+" erinnern");
  cb.addEventListener("change",()=>{const s=load();s.prayers[key]=cb.checked;save(s)});
  lab.append(cb,element("strong","",label));
  const time=element("time","","--:--");time.id="knPrayerTime_"+key;
  row.append(lab,time);$("knFive").append(row);
 }
 $("knAdvance").value=String(load().advance);
 $("knAdvance").addEventListener("change",()=>{const s=load();s.advance=Number($("knAdvance").value)||0;save(s)});
 $("knPermissionRequest").addEventListener("click",()=>{
  if(deviceMessage("request"))message("Die iOS-Berechtigung wird jetzt angefordert.");
  else message("iOS-Berechtigungen können nur in der nativen KIDS-TEST-App angefordert werden.");
 });
 $("knSendTest").addEventListener("click",()=>{
  if(deviceMessage("test"))message("Lokale Testmitteilung angefordert.");
  else message("Für die Testmitteilung den nativen Testbuild öffnen.");
 });
 $("knOpenSettings").addEventListener("click",()=>deviceMessage("openSettings"));
 $("knPrayerLocation").addEventListener("click",()=>{
  close();
  const b=$("kidsSalahLocation");
  if(b)b.click();else message("Gebetsort unter „Heute → Gebetszeiten“ auswählen.");
 });
 $("knCityQuery").addEventListener("input",event=>{
  clearTimeout(inputTimer);inputTimer=setTimeout(()=>queryCity(event.target.value),350);
 });
 $("knQiblaPlace").addEventListener("click",()=>{
  selectedCity=null;heading=null;set(QIBLA,"null");refreshQibla();
 });
 $("knQiblaGps").addEventListener("click",()=>{
  if(!navigator.geolocation){message("Standortzugriff nicht verfügbar.");return}
  navigator.geolocation.getCurrentPosition(pos=>{
   selectedCity={name:"Mein Standort",lat:pos.coords.latitude,lon:pos.coords.longitude};
   set(QIBLA,JSON.stringify(selectedCity));heading=null;refreshQibla();
  },()=>message("GPS nicht erlaubt. Bitte eine Stadt suchen."),{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
 });
 $("knQiblaCompass").addEventListener("click",startCompass);
 window.addEventListener("dar-kids-test-native-notifications",event=>{
  const oldPermission=nativePermission;
  if(event.detail?.status)nativePermission=String(event.detail.status);
  refreshPermission();
  if(nativePermission==="granted"&&oldPermission!=="granted")nativeSchedule();
  if(event.detail?.message)message(String(event.detail.message));
 });
 refreshSummary();refreshPrayers();refreshQibla();refreshPermission();setupWelcome();
 window.addEventListener("pageshow",()=>{if(nativeAvailable()){deviceMessage("status");nativeSchedule()}});
 window.DARKidsTestNotificationSettings={open,close,getPreferences:load,qiblaBearing:(lat,lon)=>qiblaBearing({lat,lon})};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();