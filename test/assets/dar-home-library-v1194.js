/* DĀR AL TAWḤĪD · DAR TEST ONLY · Home Library v1194 */
(function(){
"use strict";
if(window.__DAR_HOME_LIBRARY_V1194)return;
var path=String(location.pathname||"");
if(!(path==="/test"||path.indexOf("/test/")===0)||path.indexOf("/test/kids")===0)return;
window.__DAR_HOME_LIBRARY_V1194=true;

var queued=false;
var observed=false;

var access=[
  {nav:"topics",icon:"topics.png",title:"Tawḥīd & ʿAqīdah",desc:"Grundlagen, Beweise und Aussagen der Salaf."},
  {nav:"quran",icon:"quran.png",title:"Qurʾān & Tafsīr",desc:"Lesen, suchen, verstehen und weiterlernen."},
  {nav:"hadith",icon:"hadith.png",title:"Ḥadīṯ-Bibliothek",desc:"Authentische Überlieferungen"},
  {nav:"scholars",icon:"scholars.png",title:"Ṣaḥābah, Salaf & Gelehrte",desc:"Überlieferer, frühe Imāme und ihre Werke."},
  {nav:"books",icon:"library.png",title:"Bücher & Quellen",desc:"Geprüfte Werke, Fundstellen und Veröffentlichungen."},
  {nav:"prophets",icon:"prophets.png",title:"Die Propheten",desc:"Qurʾān & authentische Sunnah"},
  {nav:"dua",icon:"dua.png",title:"Duʿāʾ & Adab",desc:"Qurʾān & Sunnah"},
  {nav:"prayer",icon:"prayer.png",title:"Gebetszeiten",desc:"Zeiten & Erinnerungen"},
  {nav:"quiz",icon:"quiz.png",title:"Dīn-Quiz",desc:"Wissen prüfen"},
  {nav:"more",icon:"more.png",title:"Alle Bereiche",desc:"Vollständiger Zugang"}
];

function isHome(){
  return !!(document.body&&document.body.classList.contains("is-home-route"));
}
function navTo(route){
  try{if(typeof window.navigate==="function"){window.navigate(route);return}}catch(e){}
  try{if(typeof navigate==="function"){navigate(route);return}}catch(e){}
  location.hash="#"+route;
}
function bind(root){
  if(!root)return;
  root.querySelectorAll("[data-dt-nav]").forEach(function(el){
    if(el.dataset.dtBound==="1")return;
    el.dataset.dtBound="1";
    el.addEventListener("click",function(e){
      e.preventDefault();
      navTo(el.dataset.dtNav||"topics");
    });
  });
  root.querySelectorAll("[data-dt-scroll]").forEach(function(el){
    if(el.dataset.dtBound==="1")return;
    el.dataset.dtBound="1";
    el.addEventListener("click",function(e){
      e.preventDefault();
      var id=el.dataset.dtScroll||"homeSearchTitle";
      var target=document.getElementById(id);
      var section=target&&target.closest(".home-v380-section");
      if(!section)return;
      section.scrollIntoView({behavior:"smooth",block:"start"});
      setTimeout(function(){
        var input=section.querySelector("input[type='search'],input.search,input");
        try{if(input)input.focus({preventScroll:true})}catch(err){}
      },320);
    });
  });
}
function removeOldLayers(){
  [
    "dklKnowledgeStage","dklKnowledgeIndex","dklContinue",
    "dhHero1190","dhLibrary1190","dhContinue1190",
    "dhHero1192","dhLibrary1192","dhContinue1192",
    "dtHero1193","dtAccess1193","dtContinue1193","dtCore1193","dtStudy1193"
  ].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.remove();
  });
  if(document.body)document.body.classList.remove("dar-knowledge-home-v1183");
  document.documentElement.classList.remove("dar-home-v1190","dar-home-v1192");
}
function applyHomeAtmosphereV1204(){
  if(!isHome())return;
  var html=document.documentElement;
  var theme=String(html.getAttribute("data-theme")||"").toLowerCase();
  var light=(theme==="light"||theme==="soft"||theme==="eisgold");
  var body=document.body;
  var top=document.querySelector(".top-shell");
  var header=top&&top.querySelector(".header");
  var view=document.getElementById("appView");
  var page=(body&&getComputedStyle(body).getPropertyValue("--dt-page").trim())||(light?"#f5f1e7":"#050706");
  var heroImg=window.matchMedia&&window.matchMedia("(min-width:760px)").matches
    ? "/test/assets/home-v1194/hero-wide-adobe.jpg?v=1239-home"
    : "/test/assets/home-v1194/hero-mobile-adobe.jpg?v=1239-home";
  var studyImg="/test/assets/home-v1194/study-runway.jpg?v=1239-home";
  if(html){
    html.style.setProperty("background-color",page,"important");
    html.style.setProperty(
      "background-image",
      light
        ? "linear-gradient(90deg,rgba(249,246,238,.44),rgba(249,246,238,.10)),url('"+heroImg+"')"
        : "linear-gradient(90deg,rgba(2,3,2,.58),rgba(2,3,2,.10)),url('"+heroImg+"')",
      "important"
    );
    html.style.setProperty("background-repeat","no-repeat","important");
    html.style.setProperty("background-size","cover","important");
    html.style.setProperty("background-position","62% top","important");
  }
  if(body){
    body.style.setProperty("background-color",page,"important");
    body.style.setProperty("background-image","none","important");
  }
  if(top){
    top.style.setProperty("background-color",page,"important");
    top.style.setProperty(
      "background-image",
      light
        ? "linear-gradient(180deg,rgba(249,246,238,.24) 0%,rgba(249,246,238,.28) 36%,rgba(249,246,238,.42) 78%,rgba(249,246,238,.48) 100%),linear-gradient(90deg,rgba(249,246,238,.50) 0%,rgba(249,246,238,.28) 50%,rgba(249,246,238,.12) 100%),url('"+heroImg+"')"
        : "linear-gradient(180deg,rgba(2,3,2,.10) 0%,rgba(2,3,2,.18) 34%,rgba(2,3,2,.58) 72%,rgba(2,3,2,.98) 100%),linear-gradient(90deg,rgba(2,3,2,.58) 0%,rgba(2,3,2,.28) 48%,rgba(2,3,2,.08) 100%),url('"+heroImg+"')",
      "important"
    );
    top.style.setProperty("background-repeat","no-repeat","important");
    top.style.setProperty("background-size","100% 100%,100% 100%,cover","important");
    top.style.setProperty("background-position","center,center,62% 32%","important");
  }
  if(header){
    header.style.setProperty("background","transparent","important");
    header.style.setProperty("background-image","none","important");
  }
  if(view){
    view.style.setProperty("background-color","transparent","important");
    view.style.setProperty("background-image","none","important");
    view.style.removeProperty("background-repeat");
    view.style.removeProperty("background-size");
    view.style.removeProperty("background-position");
  }
  document.querySelectorAll("#appView .home-v380-shell,#appView .home-v380-section,#appView .home-line-list,#appView .home-line-grid,.top-shell .header").forEach(function(el){
    el.style.setProperty("background-color","transparent","important");
    if(!el.classList.contains("header"))el.style.setProperty("background-image","none","important");
  });
}
function ensureHero(){
  var top=document.querySelector(".top-shell");
  var header=top&&top.querySelector(".header");
  if(!top||!header)return;

  var hero=header.querySelector("#dtHero1194");
  if(!hero){
    hero=document.createElement("section");
    hero.id="dtHero1194";
    hero.className="dt-hero";
    hero.setAttribute("aria-label","Bibliothek des Wissens");
    hero.innerHTML=
      '<div class="dt-hero-kicker">Bibliothek des Wissens</div>'+
      '<h1 class="dt-hero-title"><strong>TAWḤĪD</strong><span>Das Fundament allen Wissens.</span></h1>'+
      '<p class="dt-hero-lead">Qurʾān, authentische Sunnah und die Überlieferungen der Salaf – geordnet, nachvollziehbar und direkt zugänglich.</p>'+

      '<div class="dt-hero-search-slot" aria-label="Schnellsuche im Wissen"></div>';
    var brand=header.querySelector(".header-row--brand-only");
    if(brand)brand.insertAdjacentElement("afterend",hero);
    else header.appendChild(hero);
  }
  var staleLinks=hero.querySelector(".dt-hero-links");
  if(staleLinks)staleLinks.remove();
  bind(hero);

  var prayer=document.getElementById("headerPrayerStatus");
  if(prayer){
    prayer.classList.add("dt-prayer-feature");
    if(prayer.parentNode!==header||hero.nextElementSibling!==prayer){
      hero.insertAdjacentElement("afterend",prayer);
    }
  }

  var isnad=top.querySelector(".isnad")||document.querySelector(".isnad");
  if(isnad){
    isnad.classList.remove("dkl-isnad","dh2-isnad");
    isnad.classList.add("dt-isnad");
    if(isnad.parentNode!==top||header.nextElementSibling!==isnad)header.insertAdjacentElement("afterend",isnad);
  }
}
function accessHtml(item){
  return '<button type="button" class="dt-access-item" data-dt-nav="'+item.nav+'">'+
    '<span class="dt-access-icon" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+item.icon+'?v=1194" alt=""></span>'+
    '<span class="dt-access-copy"><b>'+item.title+'</b><span>'+item.desc+'</span></span>'+
    '<span class="dt-access-arrow" aria-hidden="true">→</span>'+
  '</button>';
}
function sectionByTitle(id){
  var title=document.getElementById(id);
  return title&&title.closest(".home-v380-section");
}
function placeAfter(node,anchor){
  if(!node||!anchor||node===anchor)return anchor;
  if(anchor.nextElementSibling!==node)anchor.insertAdjacentElement("afterend",node);
  return node;
}
function ensureFunctionalHeroSearch(){
  if(!isHome())return;
  var hero=document.getElementById("dtHero1194");
  var nativeSearch=sectionByTitle("homeSearchTitle");
  if(!hero||!nativeSearch)return;
  var slot=hero.querySelector(".dt-hero-search-slot");
  if(!slot){
    slot=document.createElement("div");
    slot.className="dt-hero-search-slot";
    slot.setAttribute("aria-label","Schnellsuche im Wissen");
    hero.appendChild(slot);
  }
  var stale=hero.querySelector(".dt-hero-search");
  if(stale)stale.remove();
  var existing=slot.querySelector(".home-v380-search-field");
  var field=nativeSearch.querySelector(".home-v380-search-field");
  if(field){
    if(existing&&existing!==field)existing.remove();
    if(field.parentNode!==slot)slot.appendChild(field);
  }else{
    field=existing;
  }
  if(field){
    field.classList.add("dt-hero-native-search");
    var input=field.querySelector("#homeSearchInput");
    if(input){
      input.setAttribute("placeholder","Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen");
      input.setAttribute("aria-label","Schnellsuche: Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen");
    }
  }
  nativeSearch.classList.add("dt-native-search-relocated");
}
function tuneSearch(){
  var title=document.getElementById("homeSearchTitle");
  if(title)title.textContent="Wissen durchsuchen";
  document.querySelectorAll(".home-v380-filter-chip").forEach(function(btn){
    var mode=btn.getAttribute("data-home-filter-open")||"";
    if(mode==="more"){
      btn.hidden=false;
      btn.classList.add("dt-filter-trigger");
      btn.textContent="Filter";
      btn.setAttribute("aria-label","Suchfilter öffnen");
    }else{
      btn.hidden=true;
      btn.setAttribute("aria-hidden","true");
    }
  });
}
function ensureHomeKnowledgeGridStyleV1239(){
  var stale=document.getElementById("dtHomeKnowledgeGridStyleV1238")||document.getElementById("dtHomeKnowledgeGridStyleV1236");
  if(stale)stale.remove();
  if(document.getElementById("dtHomeKnowledgeGridStyleV1239"))return;
  var style=document.createElement("style");
  style.id="dtHomeKnowledgeGridStyleV1239";
  style.textContent=[
    'html.dar-home-v1194 body.is-home-route #appView :is(.home-line-grid,.home-line-list).dt-home-nav-polished{position:relative!important;isolation:isolate!important;margin:0 0 4px!important;background:transparent!important;background-image:none!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border-top-color:transparent!important;}',
    'html.dar-home-v1194 body.is-home-route #appView :is(.home-line-grid,.home-line-list).dt-home-nav-polished::before{content:none!important;display:none!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-line-row,html.dar-home-v1194 body.is-home-route #appView .home-line-row:nth-child(odd){background:transparent!important;background-image:none!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-line-row{border-bottom-color:color-mix(in srgb,var(--dt-rule) 50%,transparent)!important;border-right-color:color-mix(in srgb,var(--dt-rule) 38%,transparent)!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-line-row :is(.home-line-row__title,h2,h3,h4,b,strong,a){text-decoration:none!important;text-decoration-line:none!important;border-bottom:0!important;box-shadow:none!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-line-tawhid{margin:0!important;padding:30px 0 24px!important;border:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-line-tawhid::before,html.dar-home-v1194 body.is-home-route #appView .home-line-tawhid::after{content:none!important;display:none!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-v380-quran-hero.dt-quran-resume-after-core{width:auto!important;max-width:none!important;height:auto!important;min-height:74px!important;max-height:none!important;margin:8px 20px 10px!important;padding:12px 4px!important;border:0!important;border-top:1px solid color-mix(in srgb,var(--dt-rule) 56%,transparent)!important;border-bottom:1px solid color-mix(in srgb,var(--dt-rule) 56%,transparent)!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;overflow:visible!important;}',
    'html.dar-home-v1194 body.is-home-route #appView .home-v380-quran-hero.dt-quran-resume-after-core::before,html.dar-home-v1194 body.is-home-route #appView .home-v380-quran-hero.dt-quran-resume-after-core::after{content:none!important;display:none!important;}',
    'html.dar-home-v1194 body.is-home-route #appView.view::before{top:-220px!important;height:clamp(1120px,165vw,1380px)!important;opacity:.72!important;-webkit-mask-image:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.06) 9%,rgba(0,0,0,.22) 18%,rgba(0,0,0,.48) 30%,rgba(0,0,0,.78) 42%,#000 56%,#000 82%,rgba(0,0,0,.58) 92%,transparent 100%)!important;mask-image:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.06) 9%,rgba(0,0,0,.22) 18%,rgba(0,0,0,.48) 30%,rgba(0,0,0,.78) 42%,#000 56%,#000 82%,rgba(0,0,0,.58) 92%,transparent 100%)!important;}',
    'html.dar-home-v1194 body.is-home-route #appView.view::after{content:none!important;display:none!important;}',
    'html.dar-home-v1194 body.is-home-route .footer{display:block!important;visibility:visible!important;height:auto!important;min-height:0!important;margin-top:0!important;overflow:visible!important;}',
    '@media(max-width:430px){html.dar-home-v1194 body.is-home-route #appView .home-line-row{min-height:88px!important;padding:11px 10px!important;}html.dar-home-v1194 body.is-home-route #appView .home-line-row__ico{width:44px!important;min-width:44px!important;height:44px!important;margin-right:8px!important;}html.dar-home-v1194 body.is-home-route #appView .home-line-row__ico img,html.dar-home-v1194 body.is-home-route #appView .home-line-row__ico img.dar3d-icon{width:37px!important;height:37px!important;max-width:37px!important;max-height:37px!important;}html.dar-home-v1194 body.is-home-route #appView.view::before{top:-205px!important;height:1100px!important;}}'
  ].join("");
  document.head.appendChild(style);
}
function tuneHomeKnowledgeGridV1236(){
  if(!isHome())return;
  ensureHomeKnowledgeGridStyleV1239();
  var scope=document.getElementById("appView")||document;
  scope.querySelectorAll(".home-line-grid,.home-line-list").forEach(function(el){
    el.classList.add("dt-home-nav-polished");
  });
  var hadithNodes=scope.querySelectorAll(
    '.home-line-row[data-nav="hadith"],.home-line-row[data-dt-nav="hadith"],[data-nav="hadith"].home-line-row,[data-dt-nav="hadith"].home-line-row,'+
    '#dtAccess1193 [data-dt-nav="hadith"],#dtAccess1194 [data-dt-nav="hadith"]'
  );
  hadithNodes.forEach(function(row){
    var title=row.querySelector(".home-line-row__title,.dt-access-copy>b,h2,h3,h4,b,strong");
    if(title)title.textContent="Ḥadīṯ-Bibliothek";
    var meta=row.querySelector(".home-line-row__meta,.home-line-row__desc,.dt-access-copy>span,p,small");
    if(meta)meta.textContent="Authentische Überlieferungen";
    row.setAttribute("aria-label","Ḥadīṯ-Bibliothek öffnen");
    row.classList.add("dt-hadith-library-entry");
  });
}
function enforceHomeEditorialSurfaceV1239(){
  if(!isHome())return;
  var view=document.getElementById("appView");
  if(!view)return;
  view.querySelectorAll(".home-line-grid,.home-line-list").forEach(function(grid){
    grid.classList.add("dt-home-nav-polished");
    grid.style.setProperty("background","transparent","important");
    grid.style.setProperty("background-image","none","important");
    grid.style.setProperty("box-shadow","none","important");
    grid.style.setProperty("border-top-color","transparent","important");
  });
  view.querySelectorAll(".home-line-row").forEach(function(row){
    row.style.setProperty("background","transparent","important");
    row.style.setProperty("background-image","none","important");
    row.style.setProperty("box-shadow","none","important");
    row.style.setProperty("-webkit-backdrop-filter","none","important");
    row.style.setProperty("backdrop-filter","none","important");
    row.style.setProperty("border-bottom-color","color-mix(in srgb,var(--dt-rule) 50%,transparent)","important");
    row.style.setProperty("border-right-color","color-mix(in srgb,var(--dt-rule) 38%,transparent)","important");
  });
  var core=view.querySelector(".home-line-tawhid");
  if(core){
    core.style.setProperty("background","transparent","important");
    core.style.setProperty("background-image","none","important");
    core.style.setProperty("border","0","important");
    core.style.setProperty("box-shadow","none","important");
  }
  var resume=view.querySelector(".home-v380-quran-hero.dt-quran-resume-after-core,.home-v380-quran-hero");
  if(resume){
    resume.style.setProperty("width","auto","important");
    resume.style.setProperty("height","auto","important");
    resume.style.setProperty("min-height","74px","important");
    resume.style.setProperty("max-height","none","important");
    resume.style.setProperty("margin","8px 20px 10px","important");
    resume.style.setProperty("padding","12px 4px","important");
    resume.style.setProperty("border","0","important");
    resume.style.setProperty("border-top","1px solid color-mix(in srgb,var(--dt-rule) 56%,transparent)","important");
    resume.style.setProperty("border-bottom","1px solid color-mix(in srgb,var(--dt-rule) 56%,transparent)","important");
    resume.style.setProperty("border-radius","0","important");
    resume.style.setProperty("background","transparent","important");
    resume.style.setProperty("background-image","none","important");
    resume.style.setProperty("box-shadow","none","important");
    resume.style.setProperty("-webkit-backdrop-filter","none","important");
    resume.style.setProperty("backdrop-filter","none","important");
    resume.style.setProperty("overflow","visible","important");
  }
  var footer=document.querySelector(".footer");
  if(footer){
    footer.style.setProperty("display","block","important");
    footer.style.setProperty("visibility","visible","important");
    footer.style.setProperty("height","auto","important");
    footer.style.setProperty("overflow","visible","important");
  }
}
function cleanupHomeDuplicates(shell){
  if(!shell)return;

  // Unwrap the real Qur'an resume row before removing the generated scene.
  ["dtContinue1194","dtContinue1193"].forEach(function(id){
    var wrap=shell.querySelector("#"+id);
    if(!wrap)return;
    var resume=wrap.querySelector(".home-v380-quran-hero");
    if(resume)wrap.insertAdjacentElement("beforebegin",resume);
    wrap.remove();
  });

  // Remove the duplicated presentation blocks that repeat native Home content.
  [
    "dtAccess1194","dtCore1194","dtStudy1194",
    "dtAccess1193","dtCore1193","dtStudy1193"
  ].forEach(function(id){
    var el=shell.querySelector("#"+id);
    if(el)el.remove();
  });

  // The library redesign used to inject another recommendation on Home.
  shell.querySelectorAll('[data-dar-library-recommend="1"]').forEach(function(el){el.remove()});

  // Keep exactly one functional Qur'an resume element.
  var resumes=Array.prototype.slice.call(shell.querySelectorAll(".home-v380-quran-hero"));
  resumes.slice(1).forEach(function(el){el.remove()});
}

function placeQuranResumeAfterCore(shell){
  if(!shell)return;
  var resume=shell.querySelector(".home-v380-quran-hero");
  var core=shell.querySelector(".home-line-tawhid");
  if(!resume||!core)return;

  resume.classList.add("dt-quran-resume-after-core");

  /* v1216: compact reading card with its own 3D Qur'an icon and
     a dedicated metadata column. Safe to run after every Home rerender. */
  var body=resume.querySelector(".home-v380-quran-hero__body");
  if(body){
    var kicker=body.querySelector(".home-v380-kicker");
    if(kicker)kicker.remove();

    var icon=resume.querySelector(".dt-quran-resume-icon");
    if(!icon){
      icon=document.createElement("span");
      icon.className="dt-quran-resume-icon";
      icon.setAttribute("aria-hidden","true");
      icon.innerHTML='<img src="/test/assets/dar-3d-icons/quran.png?v=1216" alt="">';
      resume.insertBefore(icon,resume.firstChild);
    }

    var info=resume.querySelector(".dt-quran-resume-info");
    if(!info){
      info=document.createElement("span");
      info.className="dt-quran-resume-info";
      resume.appendChild(info);
    }

    var meta=resume.querySelector(".home-v380-quran-hero__meta");
    var when=resume.querySelector(".home-v380-quran-hero__when");
    if(meta&&meta.parentNode!==info)info.appendChild(meta);
    if(when&&when.parentNode!==info)info.appendChild(when);
  }

  var chevron=resume.querySelector(".home-v380-quran-hero__chevron");
  if(chevron)chevron.style.setProperty("display","none","important");

  if(core.nextElementSibling!==resume)core.insertAdjacentElement("afterend",resume);
}
function ensureMain(){
  var shell=document.querySelector("#appView .home-v380-shell");
  if(!shell)return;

  cleanupHomeDuplicates(shell);
  tuneHomeKnowledgeGridV1236();
  placeQuranResumeAfterCore(shell);
  enforceHomeEditorialSurfaceV1239();
  tuneSearch();
  ensureFunctionalHeroSearch();

  // Keep the native Home sections in their original order. Only rename headings.
  var rename={
    homeTodayTitle:"Heute im DĀR",
    homeLibrariesTitle:"Sammlungen & Quellen",
    homeDiscoverTitle:"Neu im Wissen"
  };
  Object.keys(rename).forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.textContent=rename[id];
  });

  // The hero already has a direct search trigger. Do not show a second search surface.
  var nativeSearch=sectionByTitle("homeSearchTitle");
  if(nativeSearch)nativeSearch.classList.add("dt-native-search-single");

  document.querySelectorAll(
    ".home-header-update-chip,#homeRefreshBtn,.home-refresh-icon-btn--header,.home-refresh-panel,.home-update-row-v416"
  ).forEach(function(el){el.style.setProperty("display","none","important")});
}
function removeHomePersonalCreditV1238(){
  if(!isHome())return;
  var footer=document.querySelector(".footer");
  if(!footer)return;
  Array.prototype.slice.call(footer.querySelectorAll("*")).forEach(function(el){
    if(el.children&&el.children.length)return;
    var txt=String(el.textContent||"").replace(/\s+/g," ").trim();
    if(/^by\s+Serhat\s+Abu\s+Malik$/i.test(txt)){
      el.style.setProperty("display","block","important");
      el.style.setProperty("visibility","visible","important");
      el.removeAttribute("aria-hidden");
    }
  });
}
function compactHomeFooter(){
  if(!isHome())return;
  var footer=document.querySelector(".footer");
  var view=document.getElementById("appView");
  var shell=document.querySelector("#appView .home-v380-shell");
  [view,shell].forEach(function(el){
    if(!el)return;
    el.style.setProperty("min-height","0","important");
    el.style.setProperty("height","auto","important");
    el.style.setProperty("max-height","none","important");
  });
  if(view){
    view.style.setProperty("padding-bottom","8px","important");
    view.style.setProperty("margin-bottom","0","important");
  }
  if(shell){
    shell.style.setProperty("padding-bottom","0","important");
    Array.prototype.forEach.call(shell.children,function(el){
      if(!el||!el.matches||!el.matches(".home-v380-section"))return;
      var hasControls=!!el.querySelector("a,button,input,select,textarea,[data-dt-nav],[data-quran-continue]");
      var hasText=String(el.textContent||"").replace(/\s+/g,"").length>0;
      if(!hasControls&&!hasText)el.style.setProperty("display","none","important");
    });
  }
  if(!footer)return;
  footer.style.setProperty("margin-top","0","important");
  footer.style.setProperty("text-align","center","important");
  footer.style.setProperty("align-items","center","important");
  footer.style.setProperty("justify-items","center","important");
  var links=Array.prototype.slice.call(footer.querySelectorAll("a,button")).filter(function(el){
    var hay=((el.textContent||"")+" "+(el.getAttribute("href")||"")+" "+(el.getAttribute("aria-label")||"")).toLowerCase();
    return /telegram|whatsapp|instagram/.test(hay);
  });
  if(links.length>=2){
    var group=links[0].parentElement;
    while(group&&group!==footer&&!links.every(function(el){return group.contains(el)}))group=group.parentElement;
    if(!group)group=footer;
    group.style.setProperty("display","flex","important");
    group.style.setProperty("flex-wrap","nowrap","important");
    group.style.setProperty("align-items","center","important");
    group.style.setProperty("justify-content","center","important");
    group.style.setProperty("gap","6px 10px","important");
    group.style.setProperty("width","100%","important");
    group.style.setProperty("margin-left","auto","important");
    group.style.setProperty("margin-right","auto","important");
    group.style.setProperty("text-align","center","important");
    links.forEach(function(el){
      el.style.setProperty("margin-left","0","important");
      el.style.setProperty("margin-right","0","important");
      el.style.setProperty("text-align","center","important");
      el.style.setProperty("flex","1 1 0","important");
      el.style.setProperty("min-width","0","important");
    });
  }
}
function polishHomeStartV1315(){
  if(!isHome())return;
  var view=document.getElementById("appView");
  if(!view)return;

  view.querySelectorAll(".home-line-grid,.home-line-list").forEach(function(grid){
    grid.style.setProperty("display","grid","important");
    grid.style.setProperty("grid-template-columns","repeat(2,minmax(0,1fr))","important");
    grid.style.setProperty("column-gap","12px","important");
    grid.style.setProperty("row-gap","0","important");
    grid.style.setProperty("margin-bottom","18px","important");
    grid.style.setProperty("border-left","0","important");
    grid.style.setProperty("border-top","0","important");
    grid.style.setProperty("background","linear-gradient(180deg,color-mix(in srgb,var(--dt-page) 10%,transparent),transparent 48%)","important");
  });

  view.querySelectorAll(".home-line-row").forEach(function(row){
    row.style.setProperty("min-height","94px","important");
    row.style.setProperty("padding","13px 7px","important");
    row.style.setProperty("border-right","0","important");
    row.style.setProperty("border-bottom","1px solid color-mix(in srgb,var(--dt-rule) 72%,transparent)","important");
    row.style.setProperty("background","transparent","important");
    row.style.setProperty("box-shadow","none","important");

    var ico=row.querySelector(".home-line-row__ico");
    if(ico){
      ico.style.setProperty("width","38px","important");
      ico.style.setProperty("min-width","38px","important");
      ico.style.setProperty("height","40px","important");
      ico.style.setProperty("margin-right","7px","important");
    }
    var img=row.querySelector(".home-line-row__ico img");
    if(img){
      img.style.setProperty("width","34px","important");
      img.style.setProperty("height","34px","important");
      img.style.setProperty("max-width","34px","important");
      img.style.setProperty("max-height","34px","important");
      img.style.setProperty("object-fit","contain","important");
    }
    var title=row.querySelector(".home-line-row__copy b,.home-line-row__title,h2,h3,h4,b,strong,a");
    if(title){
      title.style.setProperty("font-size","15px","important");
      title.style.setProperty("line-height","1.12","important");
      title.style.setProperty("text-decoration","none","important");
      title.style.setProperty("text-decoration-line","none","important");
      title.style.setProperty("border-bottom","0","important");
    }
    var meta=row.querySelector(".home-line-row__copy small,.home-line-row__meta,.home-line-row__desc,p,small");
    if(meta){
      meta.style.setProperty("font-size","11px","important");
      meta.style.setProperty("line-height","1.28","important");
    }
  });

  view.querySelectorAll('[data-nav="hadith"].home-line-row,[data-dt-nav="hadith"].home-line-row,.dt-hadith-library-entry').forEach(function(row){
    row.querySelectorAll("a,b,strong,span,h2,h3,h4").forEach(function(el){
      el.style.setProperty("text-decoration","none","important");
      el.style.setProperty("text-decoration-line","none","important");
      el.style.setProperty("border-bottom","0","important");
    });
  });

  view.querySelectorAll('[data-nav="more"].home-line-row,[data-dt-nav="more"].home-line-row').forEach(function(row){
    var title=row.querySelector(".home-line-row__copy b,.home-line-row__title,b,strong");
    var meta=row.querySelector(".home-line-row__copy small,.home-line-row__meta,.home-line-row__desc,small");
    if(title)title.textContent="Weitere Bereiche";
    if(meta)meta.textContent="Weitere Funktionen und Einstellungen";
    row.setAttribute("aria-label","Weitere Bereiche öffnen");
  });

  var resume=view.querySelector(".home-v380-quran-hero.dt-quran-resume-after-core,.home-v380-quran-hero");
  if(resume){
    resume.style.setProperty("min-height","84px","important");
    resume.style.setProperty("margin","10px 8px 16px","important");
    resume.style.setProperty("padding","13px 8px","important");
    resume.style.setProperty("border-top","1px solid color-mix(in srgb,var(--dt-rule) 70%,transparent)","important");
    resume.style.setProperty("border-bottom","1px solid color-mix(in srgb,var(--dt-rule) 70%,transparent)","important");
    var rtitle=resume.querySelector(".home-v380-quran-hero__title");
    if(rtitle){
      rtitle.style.setProperty("font-size","clamp(20px,5vw,25px)","important");
      rtitle.style.setProperty("line-height","1.08","important");
    }
    resume.querySelectorAll(".home-v380-quran-hero__meta,.home-v380-quran-hero__when").forEach(function(el){
      el.style.setProperty("font-size","10.5px","important");
      el.style.setProperty("line-height","1.25","important");
    });
  }

  var core=view.querySelector(".home-line-tawhid");
  if(core){
    core.style.setProperty("padding","27px 0 22px","important");
    core.style.setProperty("margin-top","-1px","important");
  }

  var footer=document.querySelector(".footer");
  if(footer){
    footer.style.setProperty("min-height","0","important");
    footer.style.setProperty("height","auto","important");
    footer.style.setProperty("margin","0","important");
    footer.style.setProperty("padding","18px max(16px,env(safe-area-inset-left,0px)) calc(118px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-right,0px))","important");
    var actions=footer.querySelector(".footer-actions,.footer-socials");
    if(actions){
      actions.style.setProperty("margin-top","10px","important");
      actions.style.setProperty("gap","6px","important");
    }
    var signature=footer.querySelector(".signature");
    if(signature){
      signature.style.setProperty("margin-top","10px","important");
      signature.style.setProperty("font-size","clamp(22px,6vw,28px)","important");
      signature.style.setProperty("line-height","1.05","important");
    }
  }
}

function cleanupHomeLiteralArtifacts(){
  if(!isHome()||!document.body)return;
  Array.prototype.slice.call(document.body.childNodes).forEach(function(node){
    if(node&&node.nodeType===3&&String(node.textContent||"").trim()==="\\n"){
      try{node.remove()}catch(e){if(node.parentNode)node.parentNode.removeChild(node)}
    }
  });
}
function sync(){
  if(!document.documentElement||!document.body)return;
  if(!isHome()){
    document.documentElement.classList.remove("dar-home-v1194");
    document.documentElement.style.removeProperty("background-color");
    document.documentElement.style.removeProperty("background-image");
    document.documentElement.style.removeProperty("background-repeat");
    document.documentElement.style.removeProperty("background-size");
    document.documentElement.style.removeProperty("background-position");
    return;
  }
  removeOldLayers();
  cleanupHomeLiteralArtifacts();
  document.documentElement.classList.add("dar-home-v1194");
  ensureHero();
  ensureMain();
  applyHomeAtmosphereV1204();
  removeHomePersonalCreditV1238();
  compactHomeFooter();
  enforceHomeEditorialSurfaceV1239();
  polishHomeStartV1315();
}
function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(function(){queued=false;sync()});
}
function observe(){
  if(observed)return;
  observed=true;
  var app=document.getElementById("appView");
  if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
  new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:["class"]});
  new MutationObserver(queue).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","data-theme-variant"]});
  window.addEventListener("hashchange",queue);
  window.addEventListener("pageshow",queue);
  document.addEventListener("dar:view-rendered",queue);
  queue();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});
else observe();
})();