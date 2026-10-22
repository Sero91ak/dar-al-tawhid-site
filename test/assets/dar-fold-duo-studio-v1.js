/* DAR TEST Fold/Duo Studio V1: opt-in, fully reversible via URL removal.
   No network calls, no native iOS changes, no localStorage resets. */
(function(w,d){"use strict";
  if(!/^\/test(?:\/|$)/.test(w.location.pathname)||/^\/test\/kids(?:\/|$)/.test(w.location.pathname))return;
  var query=new URLSearchParams(w.location.search);
  if(query.get("foldstudio")!=="1")return;
  if(w.__DAR_FOLD_DUO_STUDIO_V1)return;
  w.__DAR_FOLD_DUO_STUDIO_V1=true;
  var root=d.documentElement,scheduled=false,viewObserver=null;
  root.dataset.darFoldStudio="1";
  var glyphs={
    language:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-4 5-4 13 0 18M12 3c4 5 4 13 0 18"/></svg>',
    account:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/></svg>',
    appearance:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3a9 9 0 1 0 0 18h1c2 0 3-2 1.5-3.5C13.5 16 14.5 15 16 15h2a4 4 0 0 0 4-4A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="11" r=".8"/><circle cx="10" cy="7.5" r=".8"/><circle cx="15" cy="7.5" r=".8"/></svg>'
  };
  function dimensions(){
    var e=d.documentElement;
    var width=Math.round(e.clientWidth||w.innerWidth||0);
    var height=Math.round(e.clientHeight||w.innerHeight||0);
    var rail=Math.min(310,Math.max(228,Math.round(width*.335)));
    var room=width-rail-34;
    var split=width>=680&&height>=500&&room>=370;
    var desktop=split&&width>=800&&height>=560&&(room-74)>=390;
    e.dataset.darStudioCapacity=split?"dual":"single";
    e.dataset.darStudioMode=desktop?"desktop":split?"split":width>=600?"medium":"compact";
    e.style.setProperty("--dar-studio-rail",rail+"px");
  }
  function original(){
    var url=new URL(w.location.href);
    url.searchParams.delete("foldstudio");
    w.location.replace(url.toString());
  }
  function openLanguage(btn){
    var picker=w.DARAdultLanguagePickerV1;
    if(picker&&typeof picker.open==="function"){picker.open("settings",btn);return}
    var fallback=d.querySelector("[data-dal-open]");
    if(fallback)fallback.click();
  }
  function header(){
    var target=d.querySelector(".header-row--brand-only");
    if(!target||target.querySelector(".dar-studio-header-tools"))return;
    var bar=d.createElement("div");bar.className="dar-studio-header-tools";
    bar.setAttribute("role","group");bar.setAttribute("aria-label","Schnellzugriff");
    bar.innerHTML=
      '<button class="dar-studio-action" type="button" data-dar-fold-action="language" aria-label="Sprache wählen" title="9 Sprachen">'+glyphs.language+'</button>'+
      '<button class="dar-studio-action" type="button" data-nav="account" aria-label="Konto öffnen" title="Konto">'+glyphs.account+'</button>'+
      '<button class="dar-studio-action" type="button" data-nav="settings" data-value="appearance" aria-label="Farben und Erscheinungsbild" title="Farben">'+glyphs.appearance+'</button>'+
      '<button class="dar-studio-action dar-studio-original" type="button" data-dar-fold-action="original" aria-label="Zur Originalansicht zurück">Zurück</button>';
    target.appendChild(bar);
  }

  // One visible navigation at a time: desktop rail forwards to the REAL
  // bottom-nav buttons, preserving their original routing and handlers.
  var tabs=[
    ["home","Start","home.png"],
    ["ilm","ʿIlm","ilm.png"],
    ["recent","Beiträge","posts.png"],
    ["quran","Qurʾān","quran.png"],
    ["more","Mehr","more.png"]
  ];
  function sideRail(){
    if(d.getElementById("darStudioSideNav"))return;
    var nav=d.createElement("nav");nav.id="darStudioSideNav";nav.className="dar-studio-side";
    nav.setAttribute("aria-label","Hauptnavigation bei großem Display");
    nav.innerHTML='<span class="dar-studio-side-logo" aria-hidden="true">د</span>'+
      tabs.map(function(tab){
        return '<button class="dar-studio-side-btn" type="button" data-dar-studio-route="'+tab[0]+'" aria-label="'+tab[1]+'" title="'+tab[1]+'">'+
          '<img src="/test/assets/dar-3d-icons/'+tab[2]+'" alt="" loading="lazy" decoding="async"><span>'+tab[1]+'</span></button>';
      }).join("");
    d.documentElement.appendChild(nav);
  }
  function syncSide(){
    var all=d.querySelectorAll("#darStudioSideNav [data-dar-studio-route]");
    if(!all.length)return;
    var active=d.querySelector("#bottomNav .bottom-nav-btn.active,#bottomNav .bottom-nav-btn.is-active,#bottomNav .bottom-nav-btn[aria-current='page']");
    var name=active&&active.getAttribute("data-bottom-nav");
    if(!name){
      var hash=(w.location.hash||"").toLowerCase();
      name=hash.indexOf("quran")>=0?"quran":hash.indexOf("ilm")>=0?"ilm":
        hash.indexOf("post")>=0||hash.indexOf("recent")>=0?"recent":
        hash.indexOf("more")>=0||hash.indexOf("settings")>=0?"more":"home";
    }
    all.forEach(function(btn){
      var isActive=btn.getAttribute("data-dar-studio-route")===name;
      btn.classList.toggle("is-active",isActive);
      if(isActive)btn.setAttribute("aria-current","page");
      else btn.removeAttribute("aria-current");
    });
  }
  d.addEventListener("click",function(ev){
    var button=ev.target.closest&&ev.target.closest("[data-dar-studio-route]");
    if(!button)return;
    ev.preventDefault();ev.stopPropagation();
    var target=d.querySelector('#bottomNav [data-bottom-nav="'+button.getAttribute("data-dar-studio-route")+'"]');
    if(target)target.click();
    schedule();
  },true);
  function panel(){
    var home=d.querySelector("#appView .dsh-shell.dsh-home");
    if(!home||home.querySelector(".dar-studio-settings"))return;
    var p=d.createElement("section");
    p.className="dar-studio-settings";p.setAttribute("aria-label","Schnelleinstellungen für Fold und Duo");
    p.innerHTML='<div class="dar-studio-settings-head"><strong>Deine App · Schnellzugriff</strong><small>Fold/Duo · Testentwurf</small></div>'+
    '<div class="dar-studio-settings-grid">'+
    '<button type="button" class="dar-studio-quick" data-dar-fold-action="language"><span class="dar-studio-quick-icon">🌐</span><span><b>Sprachen</b><small>9 im Katalog · Freigaben beachten</small></span></button>'+
    '<button type="button" class="dar-studio-quick" data-nav="settings" data-value="appearance"><span class="dar-studio-quick-icon">◈</span><span><b>Farben</b><small>Originale Farbwelten</small></span></button>'+
    '<button type="button" class="dar-studio-quick" data-nav="settings" data-value="font"><span class="dar-studio-quick-icon">Aa</span><span><b>Lesbarkeit</b><small>Qurʾān, Duʿāʾ und Texte</small></span></button>'+
    '<button type="button" class="dar-studio-quick" data-nav="settings" data-value="icon"><span class="dar-studio-quick-icon">✦</span><span><b>App-Symbol</b><small>Originale Icons</small></span></button>'+
    '<button type="button" class="dar-studio-quick" data-nav="settings" data-value="location"><span class="dar-studio-quick-icon">⌖</span><span><b>Standort</b><small>GPS und Gebetszeiten</small></span></button>'+
    '<button type="button" class="dar-studio-quick" data-dar-fold-action="original"><span class="dar-studio-quick-icon">↶</span><span><b>Originalansicht</b><small>Ohne Datenverlust zurück</small></span></button></div>'+
    '<p class="dar-studio-note">Die vorhandenen Funktionen, Einstellungen und Sprachfreigaben bleiben maßgeblich. Dies ist eine Layout-Vorschau, keine neue Übersetzungsfreigabe.</p>';
    var welcome=home.querySelector(".dsh-welcome");
    if(welcome)welcome.after(p);else home.prepend(p);
  }
  function enhance(){dimensions();header();sideRail();panel();syncSide()}
  function schedule(){
    if(scheduled)return;scheduled=true;
    (w.requestAnimationFrame||function(fn){setTimeout(fn,0)})(function(){scheduled=false;enhance()});
  }
  d.addEventListener("click",function(ev){
    var btn=ev.target.closest&&ev.target.closest("[data-dar-fold-action]");
    if(!btn)return;
    ev.preventDefault();ev.stopPropagation();
    var act=btn.getAttribute("data-dar-fold-action");
    if(act==="original")original();
    if(act==="language")openLanguage(btn);
  },true);
  function boot(){
    enhance();
    var target=d.getElementById("appView");
    if(target&&w.MutationObserver){
      viewObserver=new MutationObserver(schedule);
      viewObserver.observe(target,{childList:true,subtree:true});
    }
  }
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  w.addEventListener("resize",schedule,{passive:true});
  w.addEventListener("orientationchange",schedule,{passive:true});
  if(w.visualViewport)w.visualViewport.addEventListener("resize",schedule,{passive:true});
  w.addEventListener("pageshow",schedule,{passive:true});
  w.addEventListener("hashchange",schedule,{passive:true});
  d.addEventListener("dar:view-rendered",schedule);
  w.DARFoldDuoStudio=Object.freeze({refresh:schedule,returnToOriginal:original});
})(window,document);
