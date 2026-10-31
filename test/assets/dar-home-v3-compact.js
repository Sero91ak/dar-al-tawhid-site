/* DĀR AL TAWḤĪD · V3 TEST HOME · 2026-10-18
   Test route only. Reuse canonical app prayer, account, theme, posts and navigation.
   Never patch native visitors, iOS, other routes or the original live hero. */
(function(){
"use strict";

/* Shared adult TEST language runtime. No production, Kids, API or paid model access. */
if(/^\/test(?:\/|$)/.test(location.pathname)&&!/^\/test\/kids(?:\/|$)/.test(location.pathname)
    &&!window.__DAR_TEST_TR_UI_SCRIPT_LOADING){
 window.__DAR_TEST_TR_UI_SCRIPT_LOADING=true;
 const trScript=document.createElement("script");
 trScript.src="/test/assets/dar-test-turkish-ui.js?v=20261024-ui-more-33";
 trScript.async=true;
 trScript.onerror=()=>{window.__DAR_TEST_TR_UI_SCRIPT_LOADING=false};
 (document.head||document.documentElement).appendChild(trScript);
}

if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__DAR_TEST_HOME_V3)return;
window.__DAR_TEST_HOME_V3=true;
const THEMES=[["light","Hell"],["soft","Sanft Elegant"],["eisgold","Eisgold"],["salbei","Salbei Elfenbein"],["dark","Klassisch Dunkel"],["royal","Royal Nachtblau"],["bordeaux","Bordeaux Royal"],["dar-al-layl","Dār al-Layl"]];
const LINKS=[
 ["quran","Qurʾān","Lesen & suchen","▤"],
 ["books","Quellenbibliothek","Originalwerke","▥"],
 ["bibliothek","DĀR AL TAWḤĪD","PDF-Bibliothek","▤"],
 ["scholars","Gelehrte","Imāme & Salaf","♙"],
 ["duas","Duʿāʾ","Authentische Bittgebete","✧"],
 ["hadith","Ḥadīṯ","Sunnah und Überlieferungen","◈"],
 ["frauen","Frauenbereich","Wissen und Fiqh","❀"],
 ["propheten","Propheten","Geschichten und Lehren","✦"],
 ["quiz","Dīn-Quiz","Wissen prüfen","◇"],
 ["prayer","Gebetszeiten","Qiblah und Kalender","◷"]
];
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

const LANGUAGE_KEY="darAdultPreferredLocaleV1";
const LANGUAGE_CHOICES=[["de","Deutsch"],["tr","Türkçe"],["en","English"],["ar","العربية"],["ku","Kurmancî"],["ckb","سۆرانی"],["bs","Bosanski"],["fr","Français"],["es","Español"]];
const LANGUAGE_CODES=new Set(LANGUAGE_CHOICES.map(x=>x[0]));
function currentLanguage(){try{return LANGUAGE_CODES.has(localStorage.getItem(LANGUAGE_KEY))?localStorage.getItem(LANGUAGE_KEY):"de"}catch(_){return"de"}}
function syncLanguageButtons(){
 document.querySelectorAll("#dv3Home [data-dv3-locale]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.dv3Locale===currentLanguage())));
}
function setLanguage(code){
 if(!LANGUAGE_CODES.has(code))return;
 try{localStorage.setItem(LANGUAGE_KEY,code)}catch(_){}
 syncLanguageButtons();window.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));
}

const icon=(name)=>'<img src="/test/assets/dar-3d-icons/'+name+'.png" loading="lazy" alt="" decoding="async">';
let lastPosts="",lastCity="",weatherBusy=false,weatherKey="",weatherAt=0,scheduled=false;
const nativeNav=(name,val)=>{
 try{if(typeof navigate==="function"){navigate(name,val||"");return}}catch(e){}
 location.hash="#"+name+(val?"/"+encodeURIComponent(val):"");
};
function isHome(){return !!(document.body&&document.body.classList.contains("is-home-route"))}
function make(){
const quick=LINKS.slice(0,4).map((x,i)=>'<button type="button" class="dv3-quick" data-dv3-nav="'+x[0]+'"><span class="dv3-quick-icon">'+icon(["quran","library","library","scholars"][i])+'</span><span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></span></button>').join("");
const more=LINKS.slice(4).map((x,i)=>'<button class="dv3-more-link" type="button" data-dv3-nav="'+esc(x[0])+'"><span class="dv3-mini-ico">'+icon(["dua","hadith","frauen","prophets","quiz","prayer"][i])+'</span><span>'+esc(x[1])+'</span><b aria-hidden="true">→</b></button>').join("");
const swatches=THEMES.map(([k,v])=>'<button type="button" data-dv3-theme="'+k+'" aria-pressed="false"><span class="dv3-color dv3-color--'+k+'"></span>'+esc(v)+'</button>').join("");
return '<div id="dv3Home" class="dv3-home" data-v3-version="3.1">'+
  '<div class="dv3-hometitle"><div><small>WILLKOMMEN IM DĀR</small><h2>Startseite</h2></div><button class="dv3-accountlink" type="button" data-dv3-nav="account" aria-label="Konto öffnen oder registrieren">'+icon("lock")+'<span>Konto / Registrieren</span><b>→</b></button></div>'+
  '<div class="dv3-language" role="group" aria-label="Sprache wählen / Dil seçimi"><span>Sprache / Dil</span>'+
 LANGUAGE_CHOICES.map(([code,label])=>'<button type="button" data-dv3-locale="'+code+'" aria-pressed="'+(currentLanguage()===code)+'">'+label+'</button>').join('')+
 '</div>'+
  '<div id="dv3Weather" class="dv3-weather" role="status" aria-live="polite">Wetterdaten werden geladen …</div>'+
  '<div class="dv3-search-box"><label class="dv3-search-label" for="homeSearchInput"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.7" cy="10.7" r="7"/><path d="m16 16 5 5"/></svg></label><input id="homeSearchInput" type="search" autocomplete="off" enterkeyhint="search" placeholder="Suche Wissen, Beiträge, Bücher, Gelehrte …" aria-label="Beiträge, Gelehrte und Bücher suchen"><button type="button" id="dv3SearchClear" aria-label="Suche löschen" hidden>×</button></div>'+
  '<button type="button" class="dv3-tawhid" data-dv3-nav="tawhid-guide"><span class="dv3-ornament" aria-hidden="true"></span><span class="dv3-kicker">GRUNDLAGEN DES GLAUBENS</span><strong>Tawḥīd &amp; ʿAqīdah</strong><span class="dv3-description">Allah allein anbeten. Die Glaubensgrundlagen nach Qurʾān, Sunnah und dem Verständnis der Salaf.</span><span class="dv3-tawhid-footer">Bedeutung, Belege &amp; Quellen entdecken <b>→</b></span></button>'+
  '<section class="dv3-section" aria-labelledby="dv3LatestTitle"><div class="dv3-section-title"><h3 id="dv3LatestTitle">Neueste Beiträge</h3><button type="button" data-dv3-nav="recent">Alle lesen →</button></div><div id="dv3Latest" class="dv3-posts" aria-live="polite"><span>Beiträge werden geladen …</span></div></section>'+
  '<section class="dv3-section" aria-labelledby="dv3QuickTitle"><div class="dv3-section-title"><h3 id="dv3QuickTitle">Schnellzugriff</h3><button type="button" data-dv3-nav="more">Alle Bereiche →</button></div><div class="dv3-quick-grid">'+quick+'</div><details class="dv3-more"><summary>Weitere Bereiche direkt öffnen <span aria-hidden="true">＋</span></summary><div class="dv3-more-grid">'+more+'</div></details></section>'+
  '<section class="dv3-bottom"><div class="dv3-extras"><div class="dv3-resume-card"><h3>Dein Qurʾān</h3><div id="dv3QuranSlot"></div></div><button type="button" class="dv3-today-card" data-dv3-nav="duas"><small>HEUTE FÜR DICH</small><strong>Duʿāʾ &amp; Empfehlung</strong><span>Dein täglicher Wissensimpuls und aktuelle Bittgebete.</span><b>Duʿāʾ des Tages öffnen →</b></button></div><div class="dv3-bottom-row"><button data-dv3-nav="calendar" type="button">Kalender &amp; Hijrī-Datum →</button><button data-dv3-nav="settings" type="button">Einstellungen →</button></div></section>'+
  '<div id="dv3ThemePanel" class="dv3-theme-panel" hidden role="dialog" aria-label="Erscheinungsbild wählen"><div><strong>Erscheinungsbild</strong><button type="button" data-dv3-close aria-label="Schließen">×</button></div><div class="dv3-theme-grid">'+swatches+'</div></div>'+
'</div>';
}
window.DARHomeV3Markup=make;
function renderLatest(){
 const el=document.getElementById("dv3Latest");if(!el)return;
 let data=[];
 try{if(typeof posts!=="undefined"&&Array.isArray(posts))data=posts.filter(p=>p&&p.id).slice(0,2)}catch(e){}
 const sig=data.map(p=>p.id+"|"+p.title).join(":");
 if(sig===lastPosts&&el.dataset.ready)return;
 lastPosts=sig;el.dataset.ready="1";
 el.innerHTML=data.length?data.map((p,i)=>{
  const line=[p.scholar,p.category].filter(Boolean).join(" · ");
  return '<button type="button" class="dv3-post" data-dv3-nav="post" data-dv3-value="'+esc(p.id)+'"><span class="dv3-post-icon">'+(i===0?"▤":"✒")+'</span><span class="dv3-post-body"><small data-dar-ui-label="editorial-card-label">'+(i===0?"AKTUELLE VERÖFFENTLICHUNG":"WEITERER BEITRAG")+'</small><b>'+esc(p.title)+'</b><em>'+esc(line||"Qurʾān · Sunnah · Aṯār")+'</em></span><span class="dv3-post-arrow" aria-hidden="true">→</span></button>';
 }).join(""):'<button type="button" class="dv3-post" data-dv3-nav="recent">Alle Veröffentlichungen ansehen →</button>';
}
function ensureTopControls(){
 const row=document.querySelector(".top-shell .header-row--brand-only");if(!row)return;
 if(!row.querySelector("#dv3HeaderActions")){
  const el=document.createElement("div");el.id="dv3HeaderActions";el.className="dv3-top-actions";
  el.innerHTML='<button type="button" class="dv3-tool" data-dv3-theme-open aria-label="Erscheinungsbild wechseln" title="Farbwelt">◐</button><button type="button" class="dv3-tool" data-dv3-nav="settings" data-dv3-value="notifications" aria-label="Benachrichtigungen einstellen" title="Benachrichtigungen"><img src="/test/assets/dar-3d-icons/bell.png" alt=""></button><button type="button" class="dv3-tool" data-dv3-nav="settings" aria-label="Einstellungen öffnen" title="Einstellungen"><img src="/test/assets/dar-3d-icons/settings.png" alt=""></button>';
  row.appendChild(el);
 }
 const k=row.querySelector(".brand-kicker-row small");
 const sourceLines={de:"BEITRÄGE NACH QURʾĀN, SUNNAH & ĀTHĀR",ar:"مشاركات وفق القرآن والسنة والآثار",en:"CONTRIBUTIONS FROM THE QURʾĀN, SUNNAH & ĀTHĀR",tr:"KUR'AN, SÜNNET VE ÂSÂRA GÖRE YAZILAR",ku:"NIVÎS LI GOR QUR'AN, SUNNAH Û ESERAN",ckb:"بەشدارییەکان بەپێی قورئان، سوننەت و ئاسار",bs:"TEKSTOVI PREMA KUR'ANU, SUNNETU I PREDAJAMA",fr:"ARTICLES SELON LE QURʾĀN, LA SUNNAH ET LES ĀTHĀR",es:"ARTÍCULOS SEGÚN EL QURʾĀN, LA SUNNAH Y LOS ĀTHĀR"};
 const sourceLine=sourceLines[currentLanguage()]||sourceLines.de;
 if(k&&k.textContent!==sourceLine)k.textContent=sourceLine;
 const main=row.querySelector(".brand-main"),title=main?.querySelector(".brand-title-refined");
 if(main&&title&&k&&!main.querySelector(".dv3-brand-copy")){
  const copy=document.createElement("span");copy.className="dv3-brand-copy";
  main.appendChild(copy);copy.appendChild(k);copy.appendChild(title);
 }
}
function rearrangeHeader(){
 const h=document.querySelector(".top-shell .header");
 if(!h)return;
 const greet=h.querySelector(".hero-text");
 const prayer=h.querySelector("#headerPrayerStatus");
 if(greet&&prayer&&greet.nextElementSibling!==prayer)h.insertBefore(greet,prayer);
 const weatherNodes=Array.from(document.querySelectorAll("#dv3Weather"));
 const weather=weatherNodes.find(n=>n.closest("#appView"))||weatherNodes[0];
 const oldWeather=weatherNodes.find(n=>n!==weather);
 if(weather&&oldWeather){
   const prev=String(oldWeather.textContent||"").trim();
   if(prev&&!prev.includes("geladen"))weather.textContent=prev;
 }
 weatherNodes.forEach(n=>{if(n!==weather)n.remove()});
 if(weather&&prayer&&weather.previousElementSibling!==prayer)prayer.after(weather);
 // Old home scripts wrote hardcoded images as inline background properties.
 // Clear only the image properties; let the selected appearance theme own all colors.
 [document.documentElement,document.body,document.querySelector(".top-shell"),h,document.getElementById("appView")].forEach(function(node){
   if(!node||!node.style)return;
   const pic=node.style.getPropertyValue("background-image")||"";
   if(/url\s*\(/i.test(pic))node.style.removeProperty("background-image");
 });
 const root=document.documentElement;
 root.classList.add("dar-home-v3");
}
async function fetchWeather(){
 if(!isHome()||weatherBusy)return;
 const target=document.getElementById("dv3Weather");if(!target)return;
 let city="";
 try{if(typeof getPrayerSettings==="function")city=String(getPrayerSettings()?.city||"").trim()}catch(e){}
 if(!city){target.textContent="Wetter: Standort in Gebetszeiten festlegen";return;}
 const key=city.toLowerCase();
 if(weatherKey===key&&Date.now()-weatherAt<30*60*1000)return;
 weatherKey=key;weatherAt=Date.now();weatherBusy=true;
 target.textContent="Wetter für "+city+" wird geladen …";
 try{
  const geo=await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(city)+"&count=1&language=de",{signal:AbortSignal.timeout(7000)}).then(r=>r.ok?r.json():null);
  const hit=geo?.results?.[0];
  if(!hit)throw Error("Standort nicht gefunden");
  const url="https://api.open-meteo.com/v1/forecast?latitude="+encodeURIComponent(hit.latitude)+"&longitude="+encodeURIComponent(hit.longitude)+"&current=temperature_2m,weather_code&timezone=auto";
  const data=await fetch(url,{signal:AbortSignal.timeout(7000)}).then(r=>r.ok?r.json():null);
  if(!data?.current||!Number.isFinite(data.current.temperature_2m))throw Error("Wetter nicht verfügbar");
  const temp=Math.round(data.current.temperature_2m),code=Number(data.current.weather_code);
  const desc=code===0?"Klar":code<=3?"Leicht bewölkt":code<=48?"Nebel":code<=67?"Regen":code<=77?"Schnee":code<=82?"Schauer":code<=86?"Schneeschauer":"Gewitter";
  if(target.isConnected&&isHome())target.textContent="Wetter · "+city+": "+temp+" °C · "+desc;
 }catch(e){if(target.isConnected)target.textContent="Wetter · "+city+": derzeit nicht verfügbar";}
 finally{weatherBusy=false;}
}
function sync(){
 if(!document.body)return;
 if(!isHome()){
  document.documentElement.classList.remove("dar-home-v3");
  const row=document.querySelector(".top-shell .header-row--brand-only");
  const main=row?.querySelector(".brand-main");
  const copy=main?.querySelector(".dv3-brand-copy");
  const originalBrand=row?.querySelector(".brand");
  if(copy&&originalBrand){
   const kicker=copy.querySelector(".brand-kicker-row");
   const title=copy.querySelector(".brand-title-refined");
   if(kicker)originalBrand.insertBefore(kicker,originalBrand.firstChild);
   if(title)main.appendChild(title);
   copy.remove();
  }
  document.getElementById("dv3HeaderActions")?.remove();
  document.getElementById("dv3Weather")?.remove();
  const h=document.querySelector(".top-shell .header");
  const pr=h?.querySelector("#headerPrayerStatus");
  const greeting=h?.querySelector(".hero-text");
  if(pr&&greeting&&pr.nextElementSibling!==greeting)h.insertBefore(pr,greeting);
  lastPosts="";lastCity="";
  return;
 }
 const shell=document.querySelector("#appView .home-v380-shell");
 if(!shell)return;
 ensureTopControls();rearrangeHeader();
 const root=document.getElementById("dv3Home");
 if(!root)return; // Single canonical renderer owns the home; never insert a second layout.
 const searchBlock=shell.querySelector("#homeSearchBlock");
 const searchField=root.querySelector(".dv3-search-box");
 if(searchBlock&&searchField&&searchField.nextElementSibling!==searchBlock)searchField.insertAdjacentElement("afterend",searchBlock);
 syncLanguageButtons();
 renderLatest();fetchWeather();
 const select=document.querySelectorAll("#dv3ThemePanel [data-dv3-theme]");
 const current=document.documentElement.getAttribute("data-theme");
 select.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.dv3Theme===current)));
}
function queue(){
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;try{sync()}catch(e){console.warn("DAR test home v3:",e)}});
}
document.addEventListener("click",function(e){
 const button=e.target.closest?.("[data-dv3-locale],[data-dv3-nav],[data-dv3-theme-open],[data-dv3-theme],[data-dv3-close],#dv3SearchClear");
 if(!button||!/^\/test(?:\/|$)/.test(location.pathname))return;
 if(button.hasAttribute("data-dv3-locale")){e.preventDefault();e.stopPropagation();setLanguage(button.dataset.dv3Locale);return;}
 if(button.hasAttribute("data-dv3-nav")){
  e.preventDefault();e.stopPropagation();nativeNav(button.dataset.dv3Nav,button.dataset.dv3Value);return;
 }
 if(button.matches("[data-dv3-theme-open]")){e.preventDefault();e.stopPropagation();const p=document.getElementById("dv3ThemePanel");if(p)p.hidden=!p.hidden;return;}
 if(button.matches("[data-dv3-theme]")){
  e.preventDefault();e.stopPropagation();const choice=button.dataset.dv3Theme;
  try{if(typeof applyTheme==="function")applyTheme(choice);else nativeNav("settings","appearance")}catch(x){nativeNav("settings","appearance")}
  const p=document.getElementById("dv3ThemePanel");if(p)p.hidden=true;queue();return;
 }
 if(button.matches("[data-dv3-close]")){e.preventDefault();document.getElementById("dv3ThemePanel").hidden=true;return;}
 if(button.id==="dv3SearchClear"){const x=document.getElementById("homeSearchInput");if(x){x.value="";x.dispatchEvent(new Event("input",{bubbles:true}));x.focus();}}
},true);
document.addEventListener("input",function(e){
 if(e.target?.id!=="homeSearchInput"||!document.getElementById("dv3Home"))return;
 const clear=document.getElementById("dv3SearchClear");if(clear)clear.hidden=!e.target.value;
 // Existing bindHomeV380Events already performs one native search; do not fire a second.
});
document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;const p=document.getElementById("dv3ThemePanel");if(p&&!p.hidden){p.hidden=true;e.preventDefault();}});
window.addEventListener("dar-adult-locale-changed",function(){syncLanguageButtons();queue()});
window.addEventListener("storage",function(e){if(e.key===LANGUAGE_KEY)syncLanguageButtons()});
document.addEventListener("dar:view-rendered",queue);
window.addEventListener("hashchange",queue);
window.addEventListener("pageshow",queue);
document.addEventListener("DOMContentLoaded",function(){
 const app=document.getElementById("appView");
 if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:false});
 queue();
});
if(document.readyState!=="loading")queue();
})();
