/* DĀR AL TAWḤĪD KIDS — offline library UI v1.
 * Isolated to the Kids/Eltern screen. Never mutates lesson state.
 */
(function(){
"use strict";
const UI_VERSION="KIDS_OFFLINE_LIBRARY_UI_V1";
const SW_PATH="/kids/sw.js";
let port=null,percent=0,busy=false,mode="",runningFull=false;
function el(tag,cls,html){const x=document.createElement(tag);if(cls)x.className=cls;if(html)x.innerHTML=html;return x;}
function boot(){
  const parent=document.getElementById("view-parents");
  if(!parent||document.getElementById("kidsOfflineLibrary"))return;
  const panel=el("section","kids-offline-library parent-card");
  panel.id="kidsOfflineLibrary";panel.setAttribute("aria-label","Offline-Bibliothek");
  panel.innerHTML=
    '<h3>Offline-Bibliothek</h3>'+
    '<p class="kids-offline-lead">Unterricht, Geschichten, Bilder und deine Sprachaufnahmen für unterwegs speichern.</p>'+
    '<div id="kidsOfflineState" class="kids-offline-state" role="status" aria-live="polite">Offline-Speicher wird geprüft …</div>'+
    '<progress id="kidsOfflineProgress" max="100" value="0" aria-label="Offline-Download"></progress>'+
    '<div class="kids-offline-actions"><button type="button" id="kidsOfflineDownload">Alles offline speichern</button>'+
    '<button type="button" id="kidsOfflinePause" hidden>Download anhalten</button></div>'+
    '<p id="kidsOfflineSpace" class="kids-offline-note"></p>'+
    '<p class="kids-offline-note">Bereits gespeicherte Dateien bleiben bei späteren App-Updates erhalten, solange das Gerät die Web-App-Daten nicht löscht. Der erste Komplett-Download benötigt Internet und ausreichend Speicher. Noch nicht gespeicherte Inhalte funktionieren offline nicht.</p>';
  const pageHead=parent.querySelector(".page-head");
  if(pageHead)pageHead.insertAdjacentElement("afterend",panel);
  else parent.prepend(panel);
  const state=panel.querySelector("#kidsOfflineState"),progress=panel.querySelector("#kidsOfflineProgress");
  const start=panel.querySelector("#kidsOfflineDownload"),pause=panel.querySelector("#kidsOfflinePause"),space=panel.querySelector("#kidsOfflineSpace");
  function message(value){state.textContent=value;}
  function uiBusy(on,downloadMode){
    busy=!!on;mode=downloadMode||mode;
    start.disabled=busy;pause.hidden=!busy;
    start.textContent=busy?"Download läuft …":"Alles offline speichern";
  }
  function controller(){
    return navigator.serviceWorker.controller||port;
  }
  function send(data){
    const target=controller();
    if(!target)return false;
    try{target.postMessage(data);return true;}catch(_){return false;}
  }
  function storage(){
    if(!navigator.storage?.estimate)return;
    navigator.storage.estimate().then(r=>{
      const used=Number(r.usage)||0,quota=Number(r.quota)||0;
      const mb=bytes=>(bytes/1048576).toLocaleString("de-DE",{maximumFractionDigits:0})+" MB";
      space.textContent="Speicher: "+mb(used)+(quota?" von ca. "+mb(quota)+" verfügbarer Browser-Quote":"")+" belegt.";
    }).catch(()=>{});
  }
  navigator.serviceWorker.addEventListener("message",e=>{
    const d=e.data||{};
    if(d.type==="KIDS_OFFLINE_STATUS"){
      if(!busy)message(d.complete?"Offline-Bibliothek gespeichert · "+d.count+" Dateien.":d.count?d.count+" Dateien lokal gespeichert. Für alles offline bitte Komplett-Download starten.":"Startpaket vorhanden. Große Sprach- und Geschichtenpakete noch nicht vollständig gespeichert.");
      if(d.complete){progress.value=100;percent=100;}
      storage();
    }
    if(d.type==="KIDS_OFFLINE_BUSY"){
      message("Ein anderer Offline-Download läuft bereits. Bitte einen Moment warten.");
      uiBusy(false);
    }
    if(d.type==="KIDS_OFFLINE_PROGRESS"){
      const done=Number(d.done)||0,total=Number(d.total)||0,failed=Number(d.failed)||0;
      progress.value=total?Math.floor(done*100/total):0;
      percent=progress.value;
      if(d.visualReady){uiBusy(false);progress.value=0;message("Startbilder vorbereitet. Für sämtliche Sprachaufnahmen und Geschichten bitte den Komplett-Download starten.");storage();}
      else if(d.complete){uiBusy(false);message("Offline-Bibliothek vollständig gespeichert: "+total+" Dateien. Jetzt auch unterwegs ohne Internet verfügbar.");storage();}
      else if(d.cancelled){uiBusy(false);message("Download angehalten. "+done+" Dateien geprüft. Fortsetzen ist jederzeit möglich.");}
      else if(done>=total&&total){uiBusy(false);message("Download beendet: "+(total-failed)+" von "+total+" Dateien gesichert. "+failed+" fehlen noch. Erneut starten zum Nachladen.");storage();}
      else {uiBusy(true,d.mode);message((d.mode==="visual"?"Bilder werden vorbereitet":"Offline-Bibliothek wird gespeichert")+": "+done+" / "+total+(failed?" · "+failed+" bisher nicht erreichbar":""));}
    }
  });
  start.addEventListener("click",async()=>{
    if(!navigator.onLine){message("Für den ersten Komplett-Download bitte Internet einschalten.");return;}
    if(!controller()){message("Der Offline-Dienst ist noch nicht bereit. Bitte die App einmal neu öffnen.");return;}
    // Let the storage manager keep important cached data when supported.
    try{await navigator.storage?.persist?.()}catch(_){}
    uiBusy(true,"full");message("Offline-Bibliothek wird zusammengestellt …");progress.value=0;
    if(!send({type:"KIDS_OFFLINE_START",mode:"full"})){uiBusy(false);message("Offline-Dienst nicht erreichbar.");}
  });
  pause.addEventListener("click",()=>{send({type:"KIDS_OFFLINE_CANCEL"});message("Download wird angehalten …")});
  function ready(){
    if(!("serviceWorker" in navigator)){message("Dieser Browser unterstützt keine Offline-Web-App.");return;}
    navigator.serviceWorker.ready.then(reg=>{
      port=reg.active;
      send({type:"KIDS_OFFLINE_STATUS"});
      // Light image warmup only after the essential hero had time to load.
      // Audio and large offline packs always remain explicit user choices.
      if(navigator.onLine&&!sessionStorage.getItem("kidsVisualWarmV1")){
        sessionStorage.setItem("kidsVisualWarmV1","1");
        setTimeout(()=>{if(!busy)send({type:"KIDS_OFFLINE_START",mode:"visual"})},3000);
      }
    }).catch(()=>message("Offline-Dienst nicht verfügbar."));
  }
  ready();storage();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();