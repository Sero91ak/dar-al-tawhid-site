/* TEST ONLY · DĀR AL TAWḤĪD · Bibliothek des Wissens v1183 */
(function(){
  "use strict";
  if(window.__DAR_HOME_KNOWLEDGE_V1183)return;
  var p=String(location.pathname||"");
  if(!(p==="/test"||p.indexOf("/test/")===0))return;
  window.__DAR_HOME_KNOWLEDGE_V1183=true;

  var originalIsnadParent=null;
  var originalIsnadNext=null;
  var observerInstalled=false;
  var queued=false;

  var paths=[
    {nav:"topics",no:"01",title:"Tawḥīd & ʿAqīdah",desc:"Grundlagen, Beweise und Aussagen der Salaf."},
    {nav:"quran",no:"02",title:"Qurʾān & Tafsīr",desc:"Lesen, suchen, verstehen und weiterlernen."},
    {nav:"hadith",no:"03",title:"Sunnah & Ḥadīṯ",desc:"Authentische Überlieferungen und Hadith-Bibliothek."},
    {nav:"scholars",no:"04",title:"Ṣaḥābah, Salaf & Gelehrte",desc:"Personen, Überlieferer und klassische Imāme."},
    {nav:"books",no:"05",title:"Bücher & Quellen",desc:"Geprüfte Werke und Quellenbibliothek."}
  ];

  function isHome(){
    try{
      if(document.body&&document.body.classList.contains("is-home-route"))return true;
      if(window.currentRoute&&String(window.currentRoute.view||"")==="home")return true;
      var h=decodeURIComponent(String(location.hash||"")).replace(/^#/,"").split("?")[0];
      if((!h||h==="home")&&document.querySelector("#appView .home-v380-shell"))return true;
    }catch(e){}
    return false;
  }

  function navTo(nav){
    try{
      if(typeof window.navigate==="function"){window.navigate(nav);return}
      if(typeof navigate==="function"){navigate(nav);return}
    }catch(e){}
    location.hash="#"+nav;
  }

  function bindNav(root){
    if(!root)return;
    root.querySelectorAll("[data-dkl-nav]").forEach(function(btn){
      if(btn.getAttribute("data-dkl-bound")==="1")return;
      btn.setAttribute("data-dkl-bound","1");
      btn.addEventListener("click",function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        navTo(btn.getAttribute("data-dkl-nav")||"topics");
      });
    });
  }

  function heroMarkup(){
    return ''+
      '<section id="dklKnowledgeStage" class="dkl-stage" aria-label="Bibliothek des Wissens">'+
        '<div class="dkl-stage__copy">'+
          '<span class="dkl-stage__eyebrow">Bibliothek des Wissens</span>'+
          '<h2 class="dkl-stage__title">TAWḤĪD</h2>'+
          '<p class="dkl-stage__lead"><strong>Das Fundament des Islām.</strong> Wissen aus Qurʾān, authentischer Sunnah und den Überlieferungen der Salaf – geordnet, direkt und ohne Umwege zugänglich.</p>'+
          '<div class="dkl-stage__links" aria-label="Direkte Wissenszugänge">'+
            '<button type="button" class="dkl-stage__link" data-dkl-nav="topics">Tawḥīd &amp; ʿAqīdah</button>'+
            '<button type="button" class="dkl-stage__link" data-dkl-nav="quran">Qurʾān</button>'+
            '<button type="button" class="dkl-stage__link" data-dkl-nav="hadith">Ḥadīṯ</button>'+
          '</div>'+
          '<div id="dklIbnSirinSlot" class="dkl-stage__quote" aria-live="off"></div>'+
        '</div>'+
        '<div class="dkl-stage__visual" aria-hidden="true">'+
          '<div class="dkl-book-stack">'+
            '<img class="dkl-book dkl-book--1" src="/test/assets/library/covers/qsrc/al-ibanah-ibn-battah.svg" alt="">'+
            '<img class="dkl-book dkl-book--2" src="/test/assets/library/covers/qsrc/al-uluw-lil-aliyy-al-ghaffar.svg" alt="">'+
            '<img class="dkl-book dkl-book--3" src="/test/assets/library/covers/qsrc/al-asma-wa-s-sifat.svg" alt="">'+
          '</div>'+
          '<span class="dkl-visual-label">QURʾĀN · SUNNAH · SALAF</span>'+
        '</div>'+
      '</section>';
  }

  function ensureHero(){
    var body=document.body;
    var top=document.querySelector(".top-shell");
    var header=top&&top.querySelector(".header");
    var hero=header&&header.querySelector(".hero-text");
    if(!body||!top||!header)return;

    body.classList.add("is-home-route","dar-knowledge-home-v1183");

    var stage=header.querySelector("#dklKnowledgeStage");
    if(!stage){
      var wrap=document.createElement("div");
      wrap.innerHTML=heroMarkup();
      stage=wrap.firstElementChild;
      if(hero&&hero.parentNode===header)hero.insertAdjacentElement("afterend",stage);
      else header.appendChild(stage);
    }

    bindNav(stage);

    var prayer=header.querySelector("#headerPrayerStatus");
    if(prayer&&stage.nextElementSibling!==prayer){
      try{stage.insertAdjacentElement("afterend",prayer)}catch(e){}
    }

    var slot=stage.querySelector("#dklIbnSirinSlot");
    var isnad=top.querySelector(".isnad");
    if(slot&&isnad&&isnad.parentNode!==slot){
      if(!originalIsnadParent){
        originalIsnadParent=isnad.parentNode;
        originalIsnadNext=isnad.nextSibling;
      }
      isnad.classList.add("dkl-isnad");
      slot.appendChild(isnad);
    }
  }

  function pathMarkup(item){
    return ''+
      '<button type="button" class="dkl-path" data-dkl-nav="'+item.nav+'" aria-label="'+item.title+' öffnen">'+
        '<span class="dkl-path__no" aria-hidden="true">'+item.no+'</span>'+
        '<span class="dkl-path__body"><strong>'+item.title+'</strong><span>'+item.desc+'</span></span>'+
        '<span class="dkl-path__go" aria-hidden="true">→</span>'+
      '</button>';
  }

  function ensureKnowledgeIndex(shell){
    var section=shell.querySelector("#dklKnowledgeIndex");
    if(!section){
      section=document.createElement("section");
      section.id="dklKnowledgeIndex";
      section.className="dkl-section";
      section.setAttribute("aria-labelledby","dklKnowledgeTitle");
      section.innerHTML=''+
        '<div class="dkl-section__head">'+
          '<span class="dkl-section__eyebrow">Direkter Zugang</span>'+
          '<h2 id="dklKnowledgeTitle" class="dkl-section__title">Bibliothek des Wissens</h2>'+
          '<p class="dkl-section__meta">Fünf Wege · ein geordneter Einstieg</p>'+
        '</div>'+
        '<div class="dkl-paths">'+paths.map(pathMarkup).join("")+'</div>';
    }
    if(shell.firstElementChild!==section)shell.insertBefore(section,shell.firstChild);
    bindNav(section);
    return section;
  }

  function ensureContinue(shell,anchor){
    var quran=shell.querySelector(".home-v380-quran-hero");
    if(!quran)return anchor;
    var section=shell.querySelector("#dklContinue");
    if(!section){
      section=document.createElement("section");
      section.id="dklContinue";
      section.className="dkl-continue";
      section.innerHTML='<div class="dkl-continue__head"><h2>Weiterlernen</h2><span>Dein letzter Stand</span></div><div class="dkl-continue__body"></div>';
    }
    var body=section.querySelector(".dkl-continue__body");
    if(body&&quran.parentNode!==body)body.appendChild(quran);
    if(anchor&&anchor.nextElementSibling!==section)anchor.insertAdjacentElement("afterend",section);
    return section;
  }

  function sectionByTitle(shell,id){
    var title=shell.querySelector("#"+id);
    return title&&title.closest(".home-v380-section");
  }

  function renameHomeSections(shell){
    var map={
      homeSearchTitle:"Suche im Wissen",
      homeTodayTitle:"Heute im DĀR",
      homeLibrariesTitle:"Bibliotheken & Quellen",
      homeDiscoverTitle:"Neu im Wissen"
    };
    Object.keys(map).forEach(function(id){
      var el=shell.querySelector("#"+id);
      if(el&&el.textContent!==map[id])el.textContent=map[id];
    });
  }

  function placeAfter(node,anchor){
    if(!node||!anchor||node===anchor)return anchor;
    if(anchor.nextElementSibling!==node)anchor.insertAdjacentElement("afterend",node);
    return node;
  }

  function ensureHomeBody(){
    var shell=document.querySelector("#appView .home-v380-shell");
    if(!shell)return;
    shell.classList.add("dkl-home-shell");

    document.querySelectorAll(".home-premium-quick").forEach(function(el){el.remove()});

    renameHomeSections(shell);

    var anchor=ensureKnowledgeIndex(shell);
    anchor=ensureContinue(shell,anchor);

    var search=sectionByTitle(shell,"homeSearchTitle");
    var today=sectionByTitle(shell,"homeTodayTitle");
    var libraries=sectionByTitle(shell,"homeLibrariesTitle");
    var discover=sectionByTitle(shell,"homeDiscoverTitle");

    [search,today,libraries,discover].forEach(function(node){
      if(node)anchor=placeAfter(node,anchor);
    });
  }

  function restoreIsnad(){
    var isnad=document.querySelector(".dkl-isnad");
    if(!isnad)return;
    isnad.classList.remove("dkl-isnad");
    if(originalIsnadParent&&document.documentElement.contains(originalIsnadParent)){
      try{
        if(originalIsnadNext&&originalIsnadNext.parentNode===originalIsnadParent)originalIsnadParent.insertBefore(isnad,originalIsnadNext);
        else originalIsnadParent.appendChild(isnad);
        return;
      }catch(e){}
    }
    var top=document.querySelector(".top-shell");
    if(top)top.appendChild(isnad);
  }

  function restoreNonHome(){
    if(document.body)document.body.classList.remove("dar-knowledge-home-v1183");
    restoreIsnad();
  }

  function sync(){
    if(!document.body)return;
    if(!isHome()){restoreNonHome();return}
    ensureHero();
    ensureHomeBody();
  }

  function queueSync(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){
      queued=false;
      sync();
    });
  }

  function installObservers(){
    if(observerInstalled)return;
    observerInstalled=true;
    var app=document.getElementById("appView");
    if(app){
      var appObs=new MutationObserver(queueSync);
      appObs.observe(app,{childList:true,subtree:true});
    }
    if(document.body){
      var bodyObs=new MutationObserver(queueSync);
      bodyObs.observe(document.body,{attributes:true,attributeFilter:["class"]});
    }
    document.addEventListener("dar:view-rendered",queueSync);
    window.addEventListener("hashchange",function(){setTimeout(queueSync,0)});
    window.addEventListener("pageshow",queueSync);
    queueSync();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installObservers,{once:true});
  else installObservers();
})();
