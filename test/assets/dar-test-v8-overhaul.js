/* DĀR AL TAWḤĪD · Adult DAR TEST V8 shell, all routes, reversible.
 * The existing app owns routes, rendering, player, content, account, language state,
 * themes, prayer logic, push, service worker and persistent data.
 * This file contributes visual navigation and additional local presentation controls ONLY.
 */
(function (w,d) {
 "use strict";
 if (!/^\/test\/?$/.test(w.location.pathname)) return;
 if (w.DARTestV8Overhaul) return;
 const RAIL=[
  ["home","Start","home"],["quran","Qurʾān","quran"],
  ["recent","Beiträge","posts"],["hadith","Ḥadīṯ","hadith"],
  ["books","Quellen","library"],["bibliothek","Bibliothek","library"],
  ["frauen","Frauen","frauen"],["duas","Duʿāʾ","dua"],
  ["quiz","Quiz","quiz"],["prayer","Gebetszeiten","prayer"],
  ["more","Mehr","more"],["settings","Einstellungen","settings"]
 ];
 const STORAGE_DENSITY="dat-test-v8-density";
 const STORAGE_MOTION="dat-test-v8-motion";
 const LOCALE_KEY="darAdultPreferredLocaleV1";
 const esc=v=>String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const get=(key,fallback)=>{try{return w.localStorage.getItem(key)||fallback}catch(_){return fallback}};
 const set=(key,value)=>{try{w.localStorage.setItem(key,value)}catch(_){}};
 const image=name=>'<img alt="" aria-hidden="true" loading="lazy" decoding="async" src="/test/assets/dar-3d-icons/'+esc(name)+'.png">';
 let scheduled=false,observer=null;
 function currentRoute(){const hash=decodeURIComponent(w.location.hash.slice(1).split("/")[0]||"home");return hash==="start"?"home":hash}
 function nav(view,value){
   try{
    if(typeof w.navigate==="function"){w.navigate(view,value||"");return}
   }catch(_){}
   w.location.hash="#"+view+(value?"/"+encodeURIComponent(value):"");
 }
 function themeCss(){
  if(d.getElementById("datV8OverhaulCss"))return;
  const link=d.createElement("link");link.id="datV8OverhaulCss";link.rel="stylesheet";
  link.href="/test/assets/dar-test-v8-overhaul.css?v=20261022-1";
  d.head.appendChild(link);
 }
 function rail(){
  if(d.getElementById("datV8Rail"))return;
  const aside=d.createElement("aside");aside.id="datV8Rail";aside.setAttribute("aria-label","DĀR Hauptnavigation");
  aside.innerHTML='<a class="dv8-wordmark" href="#home" aria-label="DĀR AL TAWḤĪD Start">'+
    image("home")+'<span>DĀR AL TAWḤĪD<br><small>QURʾĀN · SUNNAH · ĀṮĀR</small></span></a>'+
    '<nav aria-label="Bereiche">'+RAIL.map(([view,name,ico])=>
      '<button type="button" data-dv8-nav="'+view+'" aria-label="'+esc(name)+'">'+image(ico)+'<span>'+esc(name)+'</span></button>'
    ).join("")+'</nav><div class="dv8-rail-bottom">'+
    '<button type="button" data-dv8-language aria-label="Sprache wechseln">🌐 <span>Sprache</span></button></div>';
  d.body.appendChild(aside);
  refreshRail();
 }
 function refreshRail(){
  const hash=currentRoute();
  d.querySelectorAll("#datV8Rail [data-dv8-nav]").forEach(btn=>{
   const here=btn.dataset.dv8Nav===hash||(hash==="post"&&btn.dataset.dv8Nav==="recent");
   if(here)btn.setAttribute("aria-current","page");else btn.removeAttribute("aria-current");
  });
 }
 function optionButton(label,value,actual,attribute){
  return '<button type="button" data-dv8-'+attribute+'="'+esc(value)+'" aria-pressed="'+(value===actual)+'">'+esc(label)+'</button>';
 }
 function preferences(){
  const themes=[["light","Klassisch Hell","#f2eee3"],["eisgold","Eisgold","#d8eefb"],["salbei","Salbei Elfenbein","#b6cbb6"],["soft","Sanft Elegant","#f2e6e2"],["dark","Klassisch Dunkel","#050706"],["royal","Royal Nachtblau","#07162c"],["bordeaux","Bordeaux Royal","#5d3640"],["dar-al-layl","Dār al-Layl","#15271f"]];
  const density=get(STORAGE_DENSITY,"compact");
  const motion=get(STORAGE_MOTION,"system");
  return '<div class="dat-v8-preferences">'+
    '<details class="dat-v8-palette"><summary>Farbwelten & Erscheinungsbilder · 8</summary><div class="dat-v8-palette-grid">'+themes.map(([key,name,color])=>'<button type="button" data-dv8-theme="'+key+'" aria-label="'+name+'" title="'+name+'"><i style="background:'+color+'" aria-hidden="true"></i><span>'+name+'</span></button>').join('')+'</div></details>'+
    '<div class="dsh-group-head"><span>Oberfläche & Geräte</span></div>'+
    '<div class="dat-v8-preference-group" role="group" aria-label="Darstellungsdichte">'+
       optionButton("Kompakt","compact",density,"density")+optionButton("Komfort","comfort",density,"density")+
    '</div><div class="dat-v8-preference-group" role="group" aria-label="Bewegungseffekte">'+
       optionButton("Systemeffekte","system",motion,"motion")+optionButton("Bewegung reduzieren","reduce",motion,"motion")+
    '</div><p class="dsh-note">Gilt nur für die Test-App auf diesem Gerät. Alle Farbwelten bleiben in Erscheinungsbild einstellbar.</p>'+
  '</div>';
 }
 function settings(){
  const home=d.querySelector("#appView .dsh-home");
  if(!home)return;
  // Language picker already exists as a centralized nine-language control.
  // Only mount its settings entry; NEVER fork the picker or its locale storage.
  let group=[...home.querySelectorAll(".dsh-group")].find(g=>g.textContent.includes("Darstellung & Lesbarkeit"));
  if(!group)group=home.querySelector(".dsh-group");
  const list=group&&group.querySelector(".dsh-list");
  if(list&&!list.querySelector(".dat-v8-language-host")&&!home.querySelector('[data-dar-language-entry="settings"]')){
    const host=d.createElement("div");host.className="dat-v8-language-host";
    host.setAttribute("data-dar-language-entry","settings");
    list.insertBefore(host,list.firstChild);
    w.DARAdultLanguagePickerV1?.refresh?.();
  }
  if(group&&!group.querySelector(".dat-v8-preferences")){
   const holder=d.createElement("div");holder.innerHTML=preferences();group.appendChild(holder.firstElementChild);
  }
  const code=get(LOCALE_KEY,"de");
  let note=home.querySelector(".dat-v8-locale-note");
  if(code==="fr"||code==="es"){
   if(!note){note=d.createElement("p");note.className="dsh-note dat-v8-locale-note";home.appendChild(note)}
   note.textContent=code==="fr"?
    "Français : traduction de l’interface en cours. Les textes non traduits restent en allemand.":
    "Español: traducción de la interfaz en curso. Los textos pendientes se muestran en alemán.";
  }else if(note)note.remove();
 }
 function home(){
  const el=d.querySelector("#dv3Home");
  if(!el||el.querySelector(".dat-v8-home-tools"))return;
  const header=el.querySelector(".dv3-hometitle");if(!header)return;
  const div=d.createElement("div");div.className="dat-v8-home-tools";
  div.innerHTML='<div data-dar-language-entry="quick" class="dal-entry dal-entry-quick"></div>'+
   '<button type="button" data-dv8-nav="settings" aria-label="Einstellungen öffnen">'+image("settings")+'</button>';
  header.appendChild(div);
  w.DARAdultLanguagePickerV1?.refresh?.();
 }
 function sync(){
  d.documentElement.classList.add("dat-v8-overhaul");
  d.documentElement.dataset.dv8Density=get(STORAGE_DENSITY,"compact");
  d.documentElement.dataset.dv8Motion=get(STORAGE_MOTION,"system");
  rail();refreshRail();settings();home();
 }
 function schedule(){
   if(scheduled)return;
   scheduled=true;w.requestAnimationFrame(()=>{scheduled=false;sync()});
 }
 d.addEventListener("click",e=>{
  const navBtn=e.target.closest("[data-dv8-nav]");
  if(navBtn){e.preventDefault();nav(navBtn.dataset.dv8Nav,navBtn.dataset.dv8Value||"");return}
  const language=e.target.closest("[data-dv8-language]");
  if(language){e.preventDefault();w.DARAdultLanguagePickerV1?.open?.("settings",language);return}
  const palette=e.target.closest("[data-dv8-theme]");
  if(palette){e.preventDefault();const theme=palette.dataset.dv8Theme;
    if(typeof w.applyTheme==="function"){w.applyTheme(theme);schedule()}
    else nav("settings","appearance");return}
  const dense=e.target.closest("[data-dv8-density]");
  if(dense){set(STORAGE_DENSITY,dense.dataset.dv8Density);schedule();
   d.querySelectorAll("[data-dv8-density]").forEach(b=>b.setAttribute("aria-pressed",String(b===dense)));return}
  const motion=e.target.closest("[data-dv8-motion]");
  if(motion){set(STORAGE_MOTION,motion.dataset.dv8Motion);schedule();
   d.querySelectorAll("[data-dv8-motion]").forEach(b=>b.setAttribute("aria-pressed",String(b===motion)));return}
 });
 w.addEventListener("hashchange",schedule);
 w.addEventListener("storage",e=>{if([STORAGE_DENSITY,STORAGE_MOTION,LOCALE_KEY].includes(e.key))schedule()});
 w.addEventListener("dar-adult-locale-changed",schedule);
 d.addEventListener("dar:view-rendered",schedule);
 function boot(){
  themeCss();schedule();
  const app=d.getElementById("appView");
  if(app&&w.MutationObserver){
   observer=new w.MutationObserver(changes=>{if(changes.some(x=>x.addedNodes.length||x.removedNodes.length))schedule()});
   observer.observe(app,{subtree:true,childList:true});
  }
 }
 w.DARTestV8Overhaul=Object.freeze({version:"20261022-1",baseline:"44076f298b9966999ed16d955409a08c408145a4",refresh:schedule,
   get isTestOnly(){return true}});
 if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
