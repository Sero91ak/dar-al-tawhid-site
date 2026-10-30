/* DĀR AL TAWḤĪD · Adult Visitor First Launch Academy V1
 * One shared HTTPS origin for iOS WKWebView, Android PWA and browser.
 * No user secrets, credentials, location requests, or automatic route changes.
 */
(function(){
"use strict";
var path=location.pathname||"/";
if(!(path==="/"||path==="/index.html"||path==="/pwa"||path.indexOf("/pwa/")===0))return;
if(window.DAR_VISITOR_ONBOARDING_V1)return;
var STORE="darVisitorFirstGuideV1",STEPS=["profile","start","quran","search","qibla","women","more","account","notes"];
var labels={profile:"Dein persönlicher Wissensweg",start:"Fünf Bereiche, klar geordnet",quran:"Qurʾān lesen und hören",search:"Wissen schnell finden",qibla:"Qibla und Gebetszeiten",women:"Für Frauen und Männer",more:"Mehr entdecken",account:"Konto und Geräte",notes:"Deine persönlichen Notizen"};
var at=0,active=false,savedFocus=null,queued=false;
function profileApi(){return window.DAR_VISITOR_SMART_PROFILE_V1||null}
function gender(){try{return profileApi()?.get()?.gender||"neutral"}catch(_){return "neutral"}}
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function finished(){try{return localStorage.getItem(STORE)==="done"}catch(_){return false}}
function mark(){try{localStorage.setItem(STORE,"done")}catch(_){}}
function nav(page){try{if(typeof window.navigate==="function"){window.navigate(page);return}}catch(_){}
 try{if(typeof navigate==="function"){navigate(page);return}}catch(_){}
 location.hash="#"+page}
function details(){
 var g=gender(),women=g==="woman",target=women?"Frauen":"Entdecken";
 return {
 profile:{eyebrow:"BEGINNE MIT DEINEM PROFIL",description:profileApi()?.isLocked?.()?"Dein angemeldetes Wissensprofil ist gespeichert. Eine Änderung ist nur nach erneuter Anmeldung mit deiner Konto-PIN im Profilmenü möglich.": "Wähle Frau, Mann oder Neutral. Als Gast kannst du frei wechseln; nach Anmeldung und Profilauswahl ist für einen Wechsel eine neue Kontoanmeldung nötig.",action:"",icon:"library"},
 start:{eyebrow:"DEIN NEUER APP-AUFBAU",description:"Unten findest du Start, "+target+", Beiträge, Qurʾān und Mehr. Die Navigation bleibt auf dem iPhone, iPad und im Browser vertraut.",action:"home",icon:"posts"},
 quran:{eyebrow:"LESEZEICHEN · REZITATION · ÜBERSETZUNG",description:"Öffne den Qurʾān, wähle eine Sūrah und nutze Rezitation, Übersetzung, Suche und den vorhandenen Lesestand. Wichtige Verse kannst du wiederfinden.",action:"quran",icon:"quran"},
 search:{eyebrow:"INTELLIGENTE SCHNELLSUCHE",description:"Auf der Startseite kannst du in den veröffentlichten Beiträgen, Qurʾān-Themen, Ḥadīṯ-Werken und Bibliotheksbereichen suchen. Beginne mit einem Begriff.",action:"home",icon:"posts"},
 qibla:{eyebrow:"RICHTUNG · ORT · GEBETSZEITEN",description:"Der Qibla-Schnellzugriff öffnet die Kompassansicht. Gebetszeiten richten sich nach deinem gewählten oder freigegebenen Standort. Du bestimmst die Standortfreigabe.",action:"qibla",icon:"qibla"},
 women:{eyebrow:"INHALTE NACH DEINEM PROFIL",description:women?"Der zweite Tab öffnet direkt das Frauenwissen mit Fiqh, Vorbildern, Familie und geprüften Quellen. Andere Bereiche bleiben erreichbar.":g==="man"?"Der zweite Tab zeigt Entdecken für Tawḥīd, Qurʾān, Sunnah und Fiqh. Frauenwissen ist ebenfalls über Mehr erreichbar.":"Mit dem neutralen Profil findest du die allgemeine Wissenswelt in Entdecken. Du kannst später jederzeit Frau oder Mann auswählen.",action:women?"frauen":"topics",icon:women?"frauen":"topics"},
 more:{eyebrow:"DEINE WISSENSBIBLIOTHEK",description:"Unter Mehr findest du die weiteren Themen, Quiz, Bibliothek, Quellen, Propheten, Einstellungen und weitere App-Funktionen. Die Quiz-Frage des Tages bleibt auf Start.",action:"more",icon:"library"},
 account:{eyebrow:"ANMELDEN · REGISTRIEREN",description:"Erstelle bei Bedarf ein Konto mit Anmeldename und PIN oder melde dich an. Bereits unterstützte Kontodaten wie Favoriten und Qurʾān-Lesestand werden über das bestehende Kontosystem behandelt. Ein vollständiger Sync aller persönlichen Bereiche ist noch nicht nachgewiesen.",action:"account",icon:"lock"},
 notes:{eyebrow:"DEIN WISSENSBEREICH",description:"Über das Profilmenü öffnest du direkt Notizen, Merkliste, Konto und Synchronisierung sowie deine Interessen. Persönliche Smart-Profilnotizen bleiben bis zur abgesicherten Erweiterung lokal; das bestehende Konto synchronisiert weiterhin seine unterstützten Inhalte.",action:"account",icon:"saved"}
 }[STEPS[at]]
}
function root(){var r=document.getElementById("darVisitorOnboardingV1");if(r)return r;r=document.createElement("div");r.id="darVisitorOnboardingV1";r.className="dvo-scrim";r.hidden=true;r.setAttribute("aria-hidden","true");document.body.appendChild(r);return r}
function iconSrc(n){return "/assets/dar-3d-icons/"+n+".png"}
function choices(){var g=gender(),locked=!!profileApi()?.isLocked?.();return '<div class="dvo-choices" role="group" aria-label="Persönliches Profil auswählen">'+[
 ["woman","Frau","Frauenwissen"],["man","Mann","Wissen entdecken"],["neutral","Neutral","Alle Bereiche"]].map(function(x){return '<button type="button" data-dvo-gender="'+x[0]+'" '+(locked&&g!==x[0]?'disabled aria-disabled="true"':"")+' aria-pressed="'+(g===x[0])+'" class="'+(g===x[0]?"dvo-active":"")+'"><span class="dvo-choice-icon"><img src="'+(profileApi()?.image?.(x[0])||iconSrc("library"))+'" alt=""></span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></button>'}).join("")+'</div>'}
function navPreview(){
 var second=gender()==="woman"?"Frauen":"Entdecken";
 return '<div class="dvo-tabs" aria-label="Die fünf App-Bereiche">'+[["Start","home"],[second,gender()==="woman"?"frauen":"topics"],["Beiträge","posts"],["Qurʾān","quran"],["Mehr","library"]].map(function(a){return '<span><img src="'+iconSrc(a[1])+'" alt=""><b>'+esc(a[0])+'</b></span>'}).join("")+'</div>'
}
function content(){
 var d=details(),first=at===0,last=at===STEPS.length-1;
 var preview=first?choices():at===1?navPreview():'<div class="dvo-feature"><img src="'+iconSrc(d.icon)+'" alt="" aria-hidden="true"><span>'+esc(d.eyebrow)+'</span></div>';
 return '<section class="dvo-panel" role="dialog" aria-modal="true" aria-labelledby="dvoTitle" aria-describedby="dvoDescription" tabindex="-1">'+
  '<header class="dvo-top"><span class="dvo-mark">DĀR AL TAWḤĪD <span>·</span> APP-EINFÜHRUNG</span><button type="button" data-dvo-close aria-label="Einführung schließen">×</button></header>'+
  '<div class="dvo-progress" role="progressbar" aria-label="Einführung" aria-valuemin="1" aria-valuemax="'+STEPS.length+'" aria-valuenow="'+(at+1)+'"><span style="width:'+((at+1)/STEPS.length*100).toFixed(1)+'%"></span></div>'+
  '<div class="dvo-body"><span class="dvo-count">SCHRITT '+String(at+1).padStart(2,"0")+' / '+String(STEPS.length).padStart(2,"0")+'</span><h2 id="dvoTitle">'+esc(labels[STEPS[at]])+'</h2><p id="dvoDescription">'+esc(d.description)+'</p>'+preview+
  (d.action?'<button class="dvo-open-area" type="button" data-dvo-open="'+d.action+'">Bereich jetzt öffnen <span aria-hidden="true">↗</span></button>':"")+'</div>'+
  '<footer class="dvo-bottom"><button type="button" class="dvo-muted" data-dvo-back '+(first?'disabled':"")+'>Zurück</button><button type="button" class="dvo-continue" data-dvo-next>'+(last?"Einführung abschließen":"Weiter")+' <span aria-hidden="true">›</span></button></footer>'+
  '<button type="button" data-dvo-close class="dvo-skip">Überspringen – später unter Mehr erneut ansehen</button>'+
 '</section>'
}
function paint(){var r=root();if(!r.hidden){r.innerHTML=content();r.querySelector(".dvo-panel")?.focus({preventScroll:true})}}
function open(start){at=Math.max(0,Math.min(STEPS.length-1,Number(start)||0));var r=root();savedFocus=document.activeElement;active=true;window.DAR_VISITOR_ONBOARDING_ACTIVE=true;r.hidden=false;r.setAttribute("aria-hidden","false");paint()}
function close(complete){var r=root();if(complete)mark();r.hidden=true;r.innerHTML="";r.setAttribute("aria-hidden","true");active=false;window.DAR_VISITOR_ONBOARDING_ACTIVE=false;if(savedFocus?.isConnected&&savedFocus.focus)savedFocus.focus({preventScroll:true})}
function end(){close(true)}
document.addEventListener("click",function(e){
 var el=e.target.closest&&e.target.closest("#darVisitorOnboardingV1 [data-dvo-next],#darVisitorOnboardingV1 [data-dvo-back],#darVisitorOnboardingV1 [data-dvo-close],#darVisitorOnboardingV1 [data-dvo-gender],#darVisitorOnboardingV1 [data-dvo-open],[data-dvo-restart]");
 if(!el)return;
 e.preventDefault();e.stopPropagation();
 if(el.hasAttribute("data-dvo-restart")){open();return}
 if(el.hasAttribute("data-dvo-close")){end();return}
 if(el.hasAttribute("data-dvo-gender")){try{profileApi()?.setGender?.(el.dataset.dvoGender)}catch(_){}paint();return}
 if(el.hasAttribute("data-dvo-back")){at=Math.max(0,at-1);paint();return}
 if(el.hasAttribute("data-dvo-next")){if(at>=STEPS.length-1)end();else{at++;paint()}return}
 if(el.hasAttribute("data-dvo-open")){var route=el.dataset.dvoOpen;end();nav(route);return}
},true);
document.addEventListener("keydown",function(e){
 if(!active)return;
 if(e.key==="Escape"){e.preventDefault();end();return}
 if(e.key!=="Tab")return;
 var b=Array.from(root().querySelectorAll("button:not([disabled])"));if(!b.length)return;
 if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b[b.length-1].focus()}
 if(!e.shiftKey&&document.activeElement===b[b.length-1]){e.preventDefault();b[0].focus()}
});
function launcher(){
 /* Keep the compact profile capsule focused: only the three profile options
    and one Mein DĀR entry. Replay lives under Mehr > App, not inside popup. */
 var view=document.getElementById("appView");
 if(!view)return;
 view.querySelectorAll(".dvo-more-replay:not(.dvo-more-replay--compact)").forEach(function(el){el.remove()});
 var more=view.querySelector(".dm15-shell")||view.querySelector(".dar-more-v15");
 if(!more)return;
 var modern=more.classList.contains("dm15-shell");
 var target=modern?more.querySelector(".dm15-results"):
   more.querySelector('.dm-group[data-dm-group="app"] .dm-grid');
 if(!target)return;
 var box=more.querySelector(".dvo-more-replay--compact");
 if(!box){
  box=document.createElement("div");box.className="dvo-more-replay dvo-more-replay--compact";
  box.setAttribute("role","group");box.setAttribute("aria-label","App-Einführung erneut ansehen");
  box.innerHTML='<span><b>App-Einführung</b><small>Die Funktionen kennenlernen</small></span><button type="button" data-dvo-restart="true">Ansehen</button>';
 }
 if(box.parentElement!==target)target.appendChild(box);
 box.hidden=modern?!Boolean(more.querySelector('.dm15-category[data-dm15-category="App"].is-current'))||Boolean(more.querySelector('#moreFeatureSearch')?.value):
  Boolean(more.querySelector('.dm-group[data-dm-group="app"]')?.hidden);
}
function init(){
 launcher();
 var intro=finished();
 if(!intro){
  window.DAR_VISITOR_ONBOARDING_ACTIVE=true;
  setTimeout(function(){
   if(finished()){window.DAR_VISITOR_ONBOARDING_ACTIVE=false;return}
   if(document.hidden){window.DAR_VISITOR_ONBOARDING_ACTIVE=false;return}
   var visible=document.querySelector('[role="dialog"][aria-modal="true"]:not([hidden])');
   if(visible&&visible.id!=="darVisitorOnboardingV1"){window.DAR_VISITOR_ONBOARDING_ACTIVE=false;return}
   open(0);
  },1800)
 }
 document.addEventListener("click",function(e){if(e.target&&e.target.closest&&e.target.closest("#darVisitorProfileButtonV1"))setTimeout(launcher,35)},true);
 document.addEventListener("dar:view-rendered",launcher);
 /* Category and search updates repaint inside the same root (no childList event
    on #appView). Refresh the compact entry after the existing app handlers. */
 document.addEventListener("click",function(e){
  if(e.target?.closest?.("[data-dm15-category],[data-dm-category]"))requestAnimationFrame(launcher);
 });
 document.addEventListener("input",function(e){
  if(e.target?.id==="moreFeatureSearch")requestAnimationFrame(launcher);
 });
 window.addEventListener("hashchange",launcher);
 var view=document.getElementById("appView");
 if(view)new MutationObserver(launcher).observe(view,{childList:true,subtree:false});
 var header=document.getElementById("darAdultBrandHeaderV2");
 if(header)new MutationObserver(function(){if(!queued){queued=true;requestAnimationFrame(function(){queued=false;launcher()})}}).observe(header,{childList:true,subtree:false});
 setTimeout(launcher,900);
}
window.DAR_VISITOR_ONBOARDING_V1={open:open,close:end,isActive:function(){return active},hasCompleted:finished,steps:STEPS.slice()};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();