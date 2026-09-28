/* TEST ONLY · DĀR AL TAWḤĪD Home Premium v2 */
(function(){
  "use strict";
  if(window.__DAR_HOME_PREMIUM_V2)return;
  const path=String(location.pathname||"");
  if(!(path==="/test"||path.indexOf("/test/")===0))return;
  window.__DAR_HOME_PREMIUM_V2=true;

  const ICON_BASE="/test/assets/dar-3d-icons/";
  const ICON_VER="1094";
  const cards=[
    {nav:"quran",icon:"quran.png",title:"Qurʾān",desc:"Lesen, hören und weiterlesen."},
    {nav:"topics",icon:"ilm.png",title:"Tawḥīd & Beiträge",desc:"Wissen aus Qurʾān, Sunnah und Āthār.",emph:true},
    {nav:"duas",icon:"dua.png",title:"Duʿāʾ",desc:"Authentische Bittgebete geordnet."},
    {nav:"prayer",icon:"prayer.png",title:"Gebetszeiten",desc:"Zeiten, Qiblah und Erinnerungen."},
    {nav:"quiz",icon:"quiz.png",title:"Quiz",desc:"Wissen prüfen und festigen."},
    {nav:"bibliothek",icon:"library.png",title:"Bibliothek",desc:"PDFs und Lernmaterialien."}
  ];

  function iconSrc(file){
    return ICON_BASE+file+"?v="+ICON_VER;
  }

  function isHome(){
    return document.body&&document.body.classList.contains("is-home-route");
  }

  function ensureHero(){
    const body=document.body;
    const top=document.querySelector(".top-shell");
    const header=top&&top.querySelector(".header");
    const hero=header&&header.querySelector(".hero-text");
    const prayer=header&&header.querySelector("#headerPrayerStatus");
    if(!body||!top||!header||!hero)return;

    body.classList.add("home-premium-v2");
    top.classList.add("home-premium-v2-shell");
    header.classList.add("home-premium-v2-hero");

    const kicker=header.querySelector(".brand-kicker-row small");
    if(kicker&&!kicker.dataset.homePremiumOriginal){
      kicker.dataset.homePremiumOriginal=kicker.textContent||"";
      kicker.textContent="TAWḤĪD · QURʾĀN · SUNNAH · ĀTHĀR";
    }

    if(!hero.querySelector(".home-tawhid-focus")){
      const focus=document.createElement("div");
      focus.className="home-tawhid-focus";
      focus.setAttribute("aria-label","Tawḥīd im Mittelpunkt. Qurʾān, Sunnah und Āthār der Salaf.");
      focus.innerHTML=
        '<img class="home-tawhid-focus__icon" src="'+iconSrc("ilm.png")+'" alt="" decoding="async">'+
        '<div class="home-tawhid-focus__copy"><strong>Tawḥīd im Mittelpunkt</strong><span>Qurʾān · Sunnah · Āthār der Salaf</span></div>';
      hero.insertBefore(focus,hero.firstChild);
    }

    /* Text vor Gebetszeiten: klare Hierarchie wie im freigegebenen Konzept. */
    if(prayer&&prayer.previousElementSibling!==hero){
      try{hero.after(prayer)}catch(e){}
    }

    const isnad=top.querySelector(".isnad");
    if(isnad&&!isnad.querySelector(".home-isnad-3d")){
      const book=document.createElement("img");
      book.className="home-isnad-3d";
      book.src=iconSrc("library.png");
      book.alt="";
      book.decoding="async";
      book.setAttribute("aria-hidden","true");
      isnad.appendChild(book);
    }
  }

  function quickCardMarkup(c){
    return '<button type="button" class="home-premium-card'+(c.emph?' home-premium-card--tawhid':'')+'" data-home-premium-nav="'+c.nav+'" aria-label="'+c.title+' öffnen">'+
      '<span class="home-premium-card__visual" aria-hidden="true"><img src="'+iconSrc(c.icon)+'" alt="" decoding="async"></span>'+
      '<span class="home-premium-card__body"><strong>'+c.title+'</strong><span>'+c.desc+'</span></span>'+
      '<span class="home-premium-card__chev" aria-hidden="true">›</span>'+
    '</button>';
  }

  function ensureQuickAccess(){
    const shell=document.querySelector("#appView .home-v380-shell");
    if(!shell)return;

    let section=shell.querySelector(".home-premium-quick");
    if(!section){
      section=document.createElement("section");
      section.className="home-premium-quick";
      section.setAttribute("aria-labelledby","homePremiumQuickTitle");
      section.innerHTML=
        '<div class="home-premium-quick__head">'+
          '<div class="home-premium-quick__titles"><span class="home-premium-quick__kicker">Direkter Zugang</span><h2 id="homePremiumQuickTitle" class="home-premium-quick__title">Schnellzugriff</h2></div>'+
          '<button type="button" class="home-premium-quick__all" data-home-premium-nav="more">Alle Bereiche ›</button>'+
        '</div>'+
        '<div class="home-premium-quick__grid">'+cards.map(quickCardMarkup).join("")+'</div>';
      shell.insertBefore(section,shell.firstChild);
    }

    section.querySelectorAll("[data-home-premium-nav]").forEach(function(btn){
      if(btn.dataset.homePremiumBound==="1")return;
      btn.dataset.homePremiumBound="1";
      btn.addEventListener("click",function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        const nav=btn.getAttribute("data-home-premium-nav")||"more";
        try{
          if(typeof navigate==="function")navigate(nav);
          else location.hash="#"+nav;
        }catch(e){
          location.hash="#"+nav;
        }
      });
    });

    try{if(typeof window.__darNoble3dScan==="function")window.__darNoble3dScan()}catch(e){}
  }

  function compactHome(){
    const shell=document.querySelector("#appView .home-v380-shell");
    if(!shell)return;
    shell.classList.add("home-v380-shell--premium-v2");

    /* Qurʾān-Fortsetzen bleibt erhalten, direkt nach Schnellzugriff. */
    const quick=shell.querySelector(".home-premium-quick");
    const quran=shell.querySelector(".home-v380-quran-hero");
    if(quick&&quran&&quick.nextElementSibling!==quran){
      try{quick.after(quran)}catch(e){}
    }
  }

  function restoreNonHome(){
    if(!document.body)return;
    document.body.classList.remove("home-premium-v2");
  }

  function sync(){
    if(!document.body)return;
    if(!isHome()){
      restoreNonHome();
      return;
    }
    ensureHero();
    ensureQuickAccess();
    compactHome();
  }

  let queued=false;
  function queueSync(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){
      queued=false;
      sync();
    });
  }

  document.addEventListener("dar:view-rendered",queueSync);
  window.addEventListener("hashchange",function(){setTimeout(queueSync,0)});
  window.addEventListener("pageshow",queueSync);

  const root=document.getElementById("appView");
  if(root){
    const observer=new MutationObserver(queueSync);
    observer.observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",queueSync,{once:true});
  else queueSync();
})();
