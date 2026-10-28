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
  var photo="/assets/promo/mehr-apps-reference-20261017.jpg?v=mehr-promo-crop-20261028";
  function isMore(){try{return (new URLSearchParams(location.search).get("page")||"start").toLowerCase()==="mehr"}catch(_){return false}}
  function mount(){
    if(!isMore())return;
    var root=document.getElementById("pageRoot");if(!root)return;
    var grid=root.querySelector(".more-grid");if(!grid||root.querySelector("#darPublicAppPromoV1"))return;
    var section=document.createElement("section");
    section.id="darPublicAppPromoV1";
    section.className="dar-public-apps-promo reveal is-visible";
    section.setAttribute("data-promo-crop-lock","v20261028");
    section.style.setProperty("max-width","100%","important");
    section.style.setProperty("overflow","hidden","important");
    section.setAttribute("aria-label","Weitere Apps von DĀR AL TAWḤĪD");
    section.innerHTML=
      '<header class="dar-promo-head"><span class="dar-promo-kicker">DĀR AL TAWḤĪD · UNSERE APPS</span>'+
        '<h2>Wissen auf jedem Bildschirm.</h2>'+
        '<p>Entdecke unsere Angebote für das Wohnzimmer und die ganze Familie.</p></header>'+
      '<div class="dar-promo-cards" style="display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;width:100%!important;min-width:0!important">'+
        '<article class="dar-promo-card dar-promo-tv" style="box-sizing:border-box!important;position:relative!important;display:block!important;overflow:hidden!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;padding:0!important;margin:0!important;border-radius:clamp(14px,3vw,30px)!important;aspect-ratio:808/376!important" aria-label="DĀR AL TAWḤĪD auf Apple TV, jetzt verfügbar">'+
          '<img src="'+photo+'" style="position:absolute!important;display:block!important;left:-3.465347%!important;width:106.930693%!important;height:auto!important;max-width:none!important;max-height:none!important;object-fit:unset!important;object-position:unset!important;border:0!important;border-radius:0!important;pointer-events:none!important;top:-128.191489%!important" alt="" aria-hidden="true" width="864" height="1536" loading="lazy" decoding="async">'+
          '<span class="dar-promo-screenreader">Die DĀR AL TAWḤĪD App ist jetzt auf Apple TV verfügbar. Qurʾān, Sunnah und Āṯār auf dem großen Bildschirm.</span>'+
          '<a class="dar-promo-overlay-link" style="position:absolute!important;display:block!important;z-index:10!important;left:0!important;top:0!important;width:100%!important;height:100%!important;cursor:pointer!important;touch-action:manipulation!important" href="'+tvStoreHref+'" target="_blank" rel="noopener noreferrer" aria-label="DĀR AL TAWḤĪD für Apple TV im App Store ansehen"><span class="dar-promo-screenreader">Im App Store ansehen</span></a>'+
        '</article>'+
        '<article class="dar-promo-card dar-promo-kids" style="box-sizing:border-box!important;position:relative!important;display:block!important;overflow:hidden!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;padding:0!important;margin:0!important;border-radius:clamp(14px,3vw,30px)!important;aspect-ratio:808/393!important" aria-label="TAWḤĪD KIDS, iPhone-App in Vorbereitung">'+
          '<img src="'+photo+'" style="position:absolute!important;display:block!important;left:-3.465347%!important;width:106.930693%!important;height:auto!important;max-width:none!important;max-height:none!important;object-fit:unset!important;object-position:unset!important;border:0!important;border-radius:0!important;pointer-events:none!important;top:-222.137405%!important" alt="" aria-hidden="true" width="864" height="1536" loading="lazy" decoding="async">'+
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
