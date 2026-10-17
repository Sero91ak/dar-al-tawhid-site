/* DAR PUBLIC CROSSPROMO V1 – public website Mehr, not the adult native/PWA shell. */
(function(){
  "use strict";
  if(window.__DAR_PUBLIC_CROSSPROMO_V1)return;
  window.__DAR_PUBLIC_CROSSPROMO_V1=true;
  var appleUA=String(navigator.userAgent||"");
  var appleMobile=/(?:iPhone|iPad|iPod|DarAlTawhid-iOS|DarAlTawhidOfficialIOS)/i.test(appleUA)||(/Macintosh/i.test(appleUA)&&Number(navigator.maxTouchPoints||0)>1);
  // iPhone/iPad: show the official developer storefront with its Apple TV section.
  // Desktop/TV: request the tvOS variant of the verified shared App Store product.
  var tvStoreHref=appleMobile?"https://apps.apple.com/de/developer/serhat-akter/id6805988755":"https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753?platform=tv";
  var photo="/assets/promo/mehr-apps-reference-20261017.jpg?v=20261017-promo";
  function isMore(){try{return (new URLSearchParams(location.search).get("page")||"start").toLowerCase()==="mehr"}catch(_){return false}}
  function mount(){
    if(!isMore())return;
    var root=document.getElementById("pageRoot");if(!root)return;
    var grid=root.querySelector(".more-grid");if(!grid||root.querySelector("#darPublicAppPromoV1"))return;
    var section=document.createElement("section");
    section.id="darPublicAppPromoV1";
    section.className="dar-public-apps-promo reveal is-visible";
    section.setAttribute("aria-label","Weitere Apps von DĀR AL TAWḤĪD");
    section.innerHTML=
      '<header class="dar-promo-head"><span class="dar-promo-kicker">DĀR AL TAWḤĪD · UNSERE APPS</span>'+
        '<h2>Wissen auf jedem Bildschirm.</h2>'+
        '<p>Entdecke unsere Angebote für das Wohnzimmer und die ganze Familie.</p></header>'+
      '<div class="dar-promo-cards">'+
        '<article class="dar-promo-card dar-promo-tv" aria-label="DĀR AL TAWḤĪD auf Apple TV, jetzt verfügbar">'+
          '<img src="'+photo+'" alt="" aria-hidden="true" width="864" height="1536" loading="lazy" decoding="async">'+
          '<span class="dar-promo-screenreader">Die DĀR AL TAWḤĪD App ist jetzt auf Apple TV verfügbar. Qurʾān, Sunnah und Āṯār auf dem großen Bildschirm.</span>'+
          '<a class="dar-promo-overlay-link" href="'+tvStoreHref+'" target="_blank" rel="noopener noreferrer" aria-label="DĀR AL TAWḤĪD für Apple TV im App Store ansehen"><span class="dar-promo-screenreader">Im App Store ansehen</span></a>'+
        '</article>'+
        '<article class="dar-promo-card dar-promo-kids" aria-label="TAWḤĪD KIDS, iPhone-App in Vorbereitung">'+
          '<img src="'+photo+'" alt="" aria-hidden="true" width="864" height="1536" loading="lazy" decoding="async">'+
          '<span class="dar-promo-screenreader">TAWḤĪD KIDS mit iPhone und iPad. Die Kinder-App ist noch nicht offiziell veröffentlicht. Demnächst verfügbar.</span>'+
          '<button class="dar-promo-locked" type="button" disabled aria-label="TAWḤĪD KIDS ist noch nicht erhältlich"><span class="dar-promo-screenreader">Demnächst verfügbar</span></button>'+
        '</article>'+
      '</div>'+
      '<p class="dar-promo-disclaimer">Gerätedarstellungen mit Werbemotiven aus dem Projekt. Keine App-Store-Screenshots.</p>';
    var parent=grid.closest("section");
    if(parent&&parent.parentNode){parent.insertAdjacentElement("afterend",section)}
    else root.appendChild(section);
  }
  var queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;mount()});
  }
  function start(){
    var root=document.getElementById("pageRoot");
    if(root&&window.MutationObserver)new MutationObserver(schedule).observe(root,{childList:true});
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  window.addEventListener("pageshow",schedule);
  window.addEventListener("popstate",schedule);
})();
