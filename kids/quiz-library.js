(function(){
  "use strict";
  var mode="play";
  var category="all";
  var query="";
  var directQuestion=false;
  var PAGE_SIZE=40;
  var visibleLimit=PAGE_SIZE;
  var searchTimer=0;
  var voiceRefreshTimer=0;
  var originalFinish=window.renderQuizFinish;

  function byId(id){return document.getElementById(id)}
  function escapeHtml(v){
    return String(v==null?"":v).replace(/[&<>"]/g,function(ch){
      return ch==="&"?"&amp;":ch==="<"?"&lt;":ch===">"?"&gt;":"&quot;";
    });
  }
  function canonicalItems(){
    var pool=Array.isArray(window.kidsQuizPool)?window.kidsQuizPool:[];
    return pool.filter(function(q){
      return q&&/^kids-quiz-\d{3}$/.test(String(q.id||""))&&
        q.verification==="approved"&&q.status==="published"&&q.reviewStatus==="approved";
    }).sort(function(a,b){return Number(a.number||0)-Number(b.number||0)});
  }
  function bandItems(){
    var band=typeof window.currentKidsQuizAgeBand==="function"?window.currentKidsQuizAgeBand():"7-8";
    return canonicalItems().filter(function(q){return q.ageBand===band});
  }
  function stateLabel(q){
    try{
      if(typeof window.quizProgress!=="function")return"Neu";
      var e=window.quizProgress(q.id)||{};
      if(e.stage==="secure")return"✓ Sicher";
      if(e.attempts)return"↻ Lernen";
    }catch(_){}
    return"Neu";
  }
  function ensureUi(){
    var stage=byId("quizStage"),picker=byId("quizAgePick");
    if(!stage||!picker||byId("quizLibraryToolbar"))return;
    var toolbar=document.createElement("div");
    toolbar.id="quizLibraryToolbar";
    toolbar.className="quiz-library-toolbar";
    toolbar.innerHTML=
      '<div class="quiz-library-summary"><strong id="quizLibrarySummary">Quiz wird geladen …</strong><small id="quizLibrarySub">Alle vorhandenen Kids-Fragen bleiben sichtbar.</small></div>'+
      '<div class="quiz-library-modes" role="group" aria-label="Quiz-Modus">'+
        '<button id="quizModePlay" class="active" type="button">Quizrunde</button>'+
        '<button id="quizModeLibrary" type="button">Alle Fragen</button>'+
      '</div>';
    picker.insertAdjacentElement("afterend",toolbar);

    var back=document.createElement("button");
    back.id="quizLibraryBack";
    back.className="quiz-library-back";
    back.type="button";
    back.textContent="← Alle Fragen";
    toolbar.insertAdjacentElement("afterend",back);

    var panel=document.createElement("div");
    panel.id="quizLibraryPanel";
    panel.className="quiz-library-panel";
    panel.setAttribute("aria-label","Alle Quizfragen");
    panel.innerHTML=
      '<div id="quizLibraryHero" class="quiz-library-hero"><div class="quiz-library-hero-copy"><strong id="quizLibraryHeroCount">0 Fragen</strong><span id="quizLibraryHeroAge"></span></div></div>'+
      '<div class="quiz-library-tools">'+
        '<input id="quizLibrarySearch" class="quiz-library-search" type="search" inputmode="search" autocomplete="off" placeholder="Frage, Thema oder Nummer suchen" aria-label="Quizfragen suchen">'+
        '<div id="quizLibraryCategories" class="quiz-library-categories" aria-label="Themen"></div>'+
      '</div>'+
      '<div class="quiz-library-meta"><strong id="quizLibraryResultCount"></strong><span id="quizLibraryMetaHint">Antippen = direkt testen</span></div>'+
      '<div id="quizLibraryList" class="quiz-library-list"></div>'+
      '<button id="quizLibraryMore" class="quiz-library-more" type="button">Weitere Fragen anzeigen</button>';
    back.insertAdjacentElement("afterend",panel);

    byId("quizModePlay").addEventListener("click",showPlay);
    byId("quizModeLibrary").addEventListener("click",showLibrary);
    back.addEventListener("click",showLibrary);
    byId("quizLibrarySearch").addEventListener("input",function(){
      query=this.value||"";
      visibleLimit=PAGE_SIZE;
      clearTimeout(searchTimer);
      searchTimer=setTimeout(renderList,90);
    });
    byId("quizLibraryMore").addEventListener("click",function(){
      visibleLimit+=PAGE_SIZE;
      renderList();
    });

    document.querySelectorAll("#quizAgePick [data-quiz-age]").forEach(function(btn){
      btn.addEventListener("click",function(){
        category="all";query="";visibleLimit=PAGE_SIZE;
        var s=byId("quizLibrarySearch");if(s)s.value="";
        setTimeout(function(){refreshSummary();if(mode==="library")renderLibrary()},0);
      });
    });
    refreshSummary();
  }
  function updateModeButtons(){
    var play=byId("quizModePlay"),lib=byId("quizModeLibrary");
    if(play)play.classList.toggle("active",mode==="play");
    if(lib)lib.classList.toggle("active",mode==="library");
  }
  function refreshSummary(){
    var all=canonicalItems(),band=bandItems();
    var sum=byId("quizLibrarySummary"),sub=byId("quizLibrarySub");
    if(sum)sum.textContent=band.length+" Fragen für diese Altersstufe";
    if(sub)sub.textContent=all.length+" Fragen insgesamt · alle direkt aufrufbar";
    var lib=byId("quizModeLibrary");
    if(lib)lib.textContent="Alle Fragen · "+all.length;
  }
  function setHero(){
    var hero=byId("quizLibraryHero"),count=byId("quizLibraryHeroCount"),age=byId("quizLibraryHeroAge");
    var items=bandItems(),band=typeof window.currentKidsQuizAgeBand==="function"?window.currentKidsQuizAgeBand():"7-8";
    var filtered=category==="all"?items:items.filter(function(q){return String(q.category||"")===category});
    var ageLabel=band==="4-6"?"4–6 Jahre":band==="7-8"?"7–8 Jahre":"9–10 Jahre";
    if(count)count.textContent=filtered.length+" Fragen";
    if(age)age.textContent=category==="all"?ageLabel+" · vollständig eingebaut":ageLabel+" · "+category;
    if(hero&&typeof window.quizArtworkForBand==="function"){
      var art=category==="all"?window.quizArtworkForBand():window.quizArtworkForBand({category:category,scene:""});
      art=art||{};
      if(art.url){
        hero.style.backgroundImage='linear-gradient(180deg,rgba(3,14,23,.03),rgba(3,14,23,.10)),url("'+String(art.url).replace(/"/g,"%22")+'")';
        hero.style.backgroundPosition=art.position||"50% 50%";
        hero.setAttribute("data-quiz-family",String(art.family||"age"));
      }
    }
  }
  function renderCategories(){
    var box=byId("quizLibraryCategories");if(!box)return;
    var cats=[];
    bandItems().forEach(function(q){var v=String(q.category||"Quiz");if(cats.indexOf(v)<0)cats.push(v)});
    cats.sort(function(a,b){return a.localeCompare(b,"de")});
    box.innerHTML="";
    ["all"].concat(cats).forEach(function(cat){
      var b=document.createElement("button");b.type="button";
      b.className=category===cat?"active":"";
      b.setAttribute("aria-pressed",category===cat?"true":"false");
      var art={};
      if(typeof window.quizArtworkForBand==="function"){
        try{art=cat==="all"?window.quizArtworkForBand():window.quizArtworkForBand({category:cat,scene:""})||{}}catch(_){art={}}
      }
      if(art.url){
        b.classList.add("has-art");
        b.style.setProperty("--quiz-cat-art",'url("'+String(art.url).replace(/"/g,"%22")+'")');
        b.style.setProperty("--quiz-cat-pos",String(art.position||"50% 50%"));
        b.setAttribute("data-quiz-family",String(art.family||"age"));
      }
      b.innerHTML='<span class="quiz-cat-label">'+escapeHtml(cat==="all"?"Alle Themen":cat)+'</span>';
      b.addEventListener("click",function(){category=cat;visibleLimit=PAGE_SIZE;renderCategories();setHero();renderList()});
      box.appendChild(b);
    });
  }
  function matches(q){
    if(category!=="all"&&String(q.category||"")!==category)return false;
    var needle=String(query||"").trim().toLowerCase();
    if(!needle)return true;
    var hay=[q.number,q.question,q.topic,q.category,q.source,q.sourceType].join(" ").toLowerCase();
    return hay.indexOf(needle)>=0;
  }
  function voiceState(q){
    var owner=window.DARKidsOwnerVoice;
    if(!owner||typeof owner.isReady!=="function"||!owner.isReady())return"loading";
    if(typeof window.quizPrompt!=="function"||typeof owner.has!=="function")return"missing";
    return owner.has(window.quizPrompt(q))?"ready":"missing";
  }
  function rowArtwork(q){
    if(typeof window.quizArtworkForBand!=="function")return{url:"",position:"50% 50%",family:"age"};
    try{return window.quizArtworkForBand(q)||{url:"",position:"50% 50%",family:"age"}}catch(_){return{url:"",position:"50% 50%",family:"age"}}
  }
  function scheduleVoiceRefresh(){
    clearTimeout(voiceRefreshTimer);
    voiceRefreshTimer=setTimeout(function(){
      if(mode==="library"&&!directQuestion)renderList();
    },650);
  }
  function renderList(){
    var list=byId("quizLibraryList"),meta=byId("quizLibraryResultCount"),more=byId("quizLibraryMore"),hint=byId("quizLibraryMetaHint");if(!list)return;
    var allBand=bandItems();
    var items=allBand.filter(matches);
    var shown=items.slice(0,visibleLimit);
    if(meta)meta.textContent=items.length+" Treffer · "+shown.length+" angezeigt";
    if(hint)hint.textContent=items.length<allBand.length?"Suche/Filter aktiv":"Antippen = direkt testen";
    list.innerHTML="";
    if(!items.length){
      if(more)more.classList.remove("show");
      list.innerHTML='<div class="quiz-library-empty">Keine Frage passt zu dieser Suche.</div>';
      return;
    }
    var frag=document.createDocumentFragment();
    var waitingForVoice=false;
    shown.forEach(function(q){
      var row=document.createElement("div");row.className="quiz-library-row";
      var art=rowArtwork(q);
      if(art.url){
        row.style.setProperty("--quiz-row-art",'url("'+String(art.url).replace(/"/g,"%22")+'")');
        row.style.setProperty("--quiz-row-pos",String(art.position||"50% 50%"));
        row.setAttribute("data-quiz-family",String(art.family||"age"));
      }
      var thumb=document.createElement("span");
      thumb.className="quiz-library-thumb";
      thumb.setAttribute("aria-hidden","true");
      var open=document.createElement("button");open.type="button";open.className="quiz-library-open";
      open.innerHTML=
        '<span class="quiz-library-topline"><span class="quiz-library-num">#'+String(q.number).padStart(3,"0")+'</span><span class="quiz-library-cat">'+escapeHtml(q.category||"Quiz")+'</span><span class="quiz-library-state">'+escapeHtml(stateLabel(q))+'</span></span>'+
        '<span class="quiz-library-question">'+escapeHtml(q.question)+'</span>';
      open.addEventListener("click",function(){openQuestion(q)});

      var audio=document.createElement("button");
      var state=voiceState(q);
      audio.type="button";
      audio.className="quiz-library-audio "+(state==="missing"?"voice-missing":state==="loading"?"voice-loading":"voice-ready");
      if(state==="ready"){
        audio.setAttribute("aria-label","Frage "+q.number+" mit Serhat-Stimme hören");
        audio.innerHTML='<span aria-hidden="true">▶</span><small>Hören</small>';
        audio.addEventListener("click",function(){
          if(typeof window.quizSpeak==="function"&&typeof window.quizPrompt==="function"){
            window.quizSpeak(window.quizPrompt(q),{quizPrompt:true,source:"kids-quiz-library"});
          }
        });
      }else{
        audio.disabled=true;
        audio.setAttribute("aria-label",state==="loading"?"Stimme wird geladen":"Audio wird vorbereitet");
        audio.innerHTML='<span aria-hidden="true">…</span><small>'+(state==="loading"?"Lädt":"Bald")+'</small>';
        if(state==="loading")waitingForVoice=true;
      }
      row.appendChild(thumb);row.appendChild(open);row.appendChild(audio);frag.appendChild(row);
    });
    list.appendChild(frag);
    if(more){
      var remaining=Math.max(0,items.length-shown.length);
      more.classList.toggle("show",remaining>0);
      more.textContent=remaining>0?"Weitere "+Math.min(PAGE_SIZE,remaining)+" Fragen anzeigen":"";
      more.setAttribute("aria-hidden",remaining>0?"false":"true");
    }
    if(waitingForVoice)scheduleVoiceRefresh();
  }
  function renderLibrary(){
    ensureUi();mode="library";directQuestion=false;visibleLimit=PAGE_SIZE;updateModeButtons();
    if(typeof window.renderKidsQuizAgePicker==="function")window.renderKidsQuizAgePicker();
    var modal=byId("quizModal"),panel=byId("quizLibraryPanel"),back=byId("quizLibraryBack");
    if(modal)modal.classList.add("quiz-library-mode");
    if(panel)panel.classList.add("show");
    if(back)back.classList.remove("show");
    if(byId("quizBody"))byId("quizBody").style.display="";
    if(byId("quizProgress"))byId("quizProgress").style.display="";
    refreshSummary();setHero();renderCategories();renderList();
    var label=byId("quizAgeLabel"),band=typeof window.currentKidsQuizAgeBand==="function"?window.currentKidsQuizAgeBand():"7-8";
    if(label)label.textContent=(band==="4-6"?"4–6 Jahre":band==="7-8"?"7–8 Jahre":"9–10 Jahre")+" · alle Fragen";
    if(panel)panel.scrollTop=0;
  }
  function showLibrary(){renderLibrary()}
  function showPlay(){
    ensureUi();mode="play";directQuestion=false;updateModeButtons();
    if(typeof window.renderKidsQuizAgePicker==="function")window.renderKidsQuizAgePicker();
    var modal=byId("quizModal"),panel=byId("quizLibraryPanel"),back=byId("quizLibraryBack");
    if(modal)modal.classList.remove("quiz-library-mode");
    if(panel)panel.classList.remove("show");
    if(back)back.classList.remove("show");
    if(typeof window.beginQuizSession==="function")window.beginQuizSession();
    refreshSummary();
  }
  function openQuestion(q){
    mode="library";directQuestion=true;updateModeButtons();
    var modal=byId("quizModal"),panel=byId("quizLibraryPanel"),back=byId("quizLibraryBack");
    if(modal)modal.classList.remove("quiz-library-mode");
    if(panel)panel.classList.remove("show");
    if(back)back.classList.add("show");
    window.currentQuiz=[q];
    window.currentQuizIndex=0;
    window.quizCorrectCount=0;
    window.quizLocked=false;
    window.quizQuestionHadError=false;
    var label=byId("quizAgeLabel");if(label)label.textContent="Frage #"+String(q.number).padStart(3,"0")+" · "+String(q.category||"Quiz");
    if(typeof window.renderQuizQuestion==="function")window.renderQuizQuestion();
    setTimeout(function(){
      var next=byId("quizNext");
      if(next)next.textContent="Zur Übersicht";
    },0);
  }

  if(typeof originalFinish==="function"){
    window.renderQuizFinish=function(){
      if(directQuestion){renderLibrary();return}
      return originalFinish.apply(this,arguments);
    };
  }

  var originalFetch=window.fetchKidsQuiz;
  if(typeof originalFetch==="function"){
    window.fetchKidsQuiz=function(){
      var p=originalFetch.apply(this,arguments);
      return Promise.resolve(p).then(function(result){setTimeout(function(){refreshSummary();if(mode==="library")renderLibrary()},0);return result});
    };
  }

  function init(){
    ensureUi();
    var openBtn=byId("openQuizButton");
    if(openBtn)openBtn.addEventListener("click",function(){setTimeout(function(){refreshSummary();if(mode==="library")renderLibrary()},80)});
    var attempts=0;
    (function waitForQuizData(){
      refreshSummary();
      if(canonicalItems().length>0)return;
      attempts++;
      if(attempts<24)setTimeout(waitForQuizData,250);
    })();
  }
  window.addEventListener("dar-kids-quiz-loaded",function(){
    refreshSummary();
    if(typeof window.renderKidsQuizAgePicker==="function")window.renderKidsQuizAgePicker();
    if(mode==="library")renderLibrary();
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();