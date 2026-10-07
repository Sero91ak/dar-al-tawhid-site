(function(){
  "use strict";
  var mode="dashboard";
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
  function bandId(){
    return typeof window.currentKidsQuizAgeBand==="function"?window.currentKidsQuizAgeBand():"7-8";
  }
  function ageLabel(){
    var band=bandId();
    return band==="4-6"?"4–6 Jahre":band==="7-8"?"7–8 Jahre":"9–10 Jahre";
  }
  function canonicalItems(){
    var pool=Array.isArray(window.kidsQuizPool)?window.kidsQuizPool:[];
    return pool.filter(function(q){
      return q&&/^kids-quiz-\d{3}$/.test(String(q.id||""))&&
        q.verification==="approved"&&q.status==="published"&&q.reviewStatus==="approved";
    }).sort(function(a,b){return Number(a.number||0)-Number(b.number||0)});
  }
  function bandItems(){
    var band=bandId();
    return canonicalItems().filter(function(q){return q.ageBand===band});
  }
  function progressFor(q){
    try{
      return typeof window.quizProgress==="function"?window.quizProgress(q.id):{stage:"new",attempts:0,wrong:0,lapses:0,dueAt:0,lastSeenAt:0};
    }catch(_){
      return{stage:"new",attempts:0,wrong:0,lapses:0,dueAt:0,lastSeenAt:0};
    }
  }
  function statsFor(items){
    var now=Date.now();
    var total=items.length,seen=0,secure=0,learning=0,due=0,mistakeQuestions=0,wrong=0,errors=0,attempts=0,directKnown=0;
    items.forEach(function(q){
      var e=progressFor(q);
      var a=Number(e.attempts||0),w=Number(e.wrong||0),errorTaps=Number(e.mistakeTaps||0);
      attempts+=a;wrong+=w;errors+=errorTaps;
      if(a>0){
        seen++;
        if(w===0)directKnown++;
        if(e.stage==="secure")secure++;
        else learning++;
        if(Number(e.dueAt||0)>0&&Number(e.dueAt||0)<=now)due++;
      }
      if(w>0||Number(e.lapses||0)>0)mistakeQuestions++;
    });
    var firstTry=attempts?Math.max(0,Math.min(100,Math.round(((attempts-wrong)/attempts)*100))):0;
    var learnedPct=total?Math.round((secure/total)*100):0;
    return{
      total:total,seen:seen,secure:secure,learning:learning,due:due,
      mistakeQuestions:mistakeQuestions,wrong:wrong,errors:errors,attempts:attempts,
      directKnown:directKnown,firstTry:firstTry,learnedPct:learnedPct
    };
  }
  function categories(){
    var map={};
    bandItems().forEach(function(q){
      var name=String(q.category||"Quiz");
      (map[name]||(map[name]=[])).push(q);
    });
    return Object.keys(map).sort(function(a,b){return a.localeCompare(b,"de")}).map(function(name){
      return{name:name,items:map[name],stats:statsFor(map[name])};
    });
  }
  function stateLabel(q){
    var e=progressFor(q);
    if(e.stage==="secure")return"✓ Sicher";
    if(Number(e.wrong||0)>0)return"↻ Wiederholen";
    if(Number(e.attempts||0)>0)return"• Gelernt";
    return"Neu";
  }
  function sessionInfo(){
    try{
      if(typeof window.getKidsQuizSession!=="function")return null;
      var s=window.getKidsQuizSession();
      if(!s)return null;
      var all=canonicalItems(),by={};
      all.forEach(function(q){by[String(q.id)]=q});
      var ids=Array.isArray(s.ids)?s.ids:[];
      var index=Math.max(0,Math.min(ids.length-1,Number(s.index||0)));
      var q=by[String(ids[index]||"")];
      if(!q)return null;
      return{
        session:s,
        question:q,
        index:index,
        count:ids.length,
        category:String(s.category||q.category||"Gemischt")
      };
    }catch(_){return null}
  }
  function ensureUi(){
    var stage=byId("quizStage");
    if(!stage)return;
    if(!byId("quizLearningDashboard")){
      var dash=document.createElement("div");
      dash.id="quizLearningDashboard";
      dash.className="quiz-learning-dashboard";
      stage.insertBefore(dash,stage.firstChild);
    }
    if(byId("quizLibraryToolbar"))return;

    var toolbar=document.createElement("div");
    toolbar.id="quizLibraryToolbar";
    toolbar.className="quiz-library-toolbar";
    toolbar.innerHTML=
      '<div class="quiz-library-summary"><strong id="quizLibrarySummary">Dein Quiz</strong><small id="quizLibrarySub">Lernen · wiederholen · sicher werden</small></div>'+
      '<div class="quiz-library-modes" role="group" aria-label="Quiz-Ansicht">'+
        '<button id="quizModeDashboard" class="active" type="button">Übersicht</button>'+
        '<button id="quizModeLibrary" type="button">Alle Fragen</button>'+
      '</div>';
    var progress=byId("quizProgress");
    if(progress)stage.insertBefore(toolbar,progress);
    else stage.appendChild(toolbar);

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

    byId("quizModeDashboard").addEventListener("click",showDashboard);
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
  }
  function updateModeButtons(){
    var dash=byId("quizModeDashboard"),lib=byId("quizModeLibrary");
    if(dash)dash.classList.toggle("active",mode==="dashboard");
    if(lib)lib.classList.toggle("active",mode==="library");
  }
  function startRound(cat,roundMode){
    directQuestion=false;
    category=cat||"all";
    mode="play";
    updateModeButtons();
    var modal=byId("quizModal");
    if(modal){
      modal.classList.remove("quiz-library-mode","quiz-dashboard-mode");
      modal.classList.add("quiz-round-mode");
    }
    if(byId("quizLearningDashboard"))byId("quizLearningDashboard").classList.remove("show");
    if(byId("quizLibraryPanel"))byId("quizLibraryPanel").classList.remove("show");
    if(byId("quizLibraryBack"))byId("quizLibraryBack").classList.remove("show");
    if(typeof window.startKidsQuizRound==="function")window.startKidsQuizRound(cat||"all",roundMode||"normal");
  }
  function renderDashboard(){
    ensureUi();
    var box=byId("quizLearningDashboard");if(!box)return;
    var items=bandItems(),stats=statsFor(items),cats=categories(),resume=sessionInfo();
    var now=Date.now();
    var reviewCount=items.filter(function(q){
      var e=progressFor(q);
      return Number(e.wrong||0)>0||Number(e.lapses||0)>0||
        (Number(e.attempts||0)>0&&Number(e.dueAt||0)>0&&Number(e.dueAt||0)<=now);
    }).length;
    var recommendation=reviewCount>0
      ? reviewCount+" Frage"+(reviewCount===1?"":"n")+" solltest du wiederholen."
      : stats.seen?"Heute ist keine dringende Wiederholung offen.":"Starte deine erste Quizrunde.";
    var categoryHtml=cats.map(function(c){
      var st=c.stats;
      var pct=st.total?Math.round((st.secure/st.total)*100):0;
      return '<button class="quiz-topic-card" type="button" data-quiz-topic="'+escapeHtml(c.name)+'">'+
        '<span class="quiz-topic-name">'+escapeHtml(c.name)+'</span>'+
        '<span class="quiz-topic-meta">'+st.total+' Fragen · '+st.secure+' sicher'+(st.errors?' · '+st.errors+' Fehler':'')+'</span>'+
        '<span class="quiz-topic-progress"><i style="width:'+pct+'%"></i></span>'+
      '</button>';
    }).join("");

    var resumeHtml=resume?
      '<section class="quiz-resume-card">'+
        '<div><span class="quiz-dash-eyebrow">Zuletzt gelernt</span><strong>'+escapeHtml(resume.category==="all"?"Gemischtes Quiz":resume.category)+'</strong>'+
        '<small>Frage '+(resume.index+1)+' von '+resume.count+' · '+escapeHtml(resume.question.category||"Quiz")+'</small></div>'+
        '<button id="quizResumeRound" type="button">Weiterlernen</button>'+
      '</section>':"";

    box.innerHTML=
      '<section class="quiz-dash-head">'+
        '<div class="quiz-dash-title"><span class="quiz-dash-eyebrow">'+escapeHtml(ageLabel())+' · aus den Einstellungen</span>'+
        '<h2>Dein Lernstand</h2><p>'+stats.seen+' von '+stats.total+' Fragen kennengelernt</p></div>'+
        '<div class="quiz-dash-progress" role="img" aria-label="'+stats.learnedPct+' Prozent sicher gelernt">'+
          '<strong>'+stats.learnedPct+'%</strong><span>sicher</span>'+
        '</div>'+
      '</section>'+
      '<div class="quiz-dash-bar"><i style="width:'+stats.learnedPct+'%"></i></div>'+
      '<section class="quiz-stat-grid">'+
        '<div><strong>'+stats.secure+'</strong><span>Sicher</span></div>'+
        '<div><strong>'+stats.seen+'</strong><span>Bearbeitet</span></div>'+
        '<div><strong>'+stats.learning+'</strong><span>Im Lernen</span></div>'+
        '<div><strong>'+stats.errors+'</strong><span>Fehler</span></div>'+
        '<div><strong>'+stats.due+'</strong><span>Jetzt fällig</span></div>'+
        '<div><strong>'+stats.firstTry+'%</strong><span>Direkt richtig</span></div>'+
      '</section>'+
      resumeHtml+
      '<section class="quiz-review-card '+(reviewCount>0?"needs-review":"is-clear")+'">'+
        '<div><span class="quiz-dash-eyebrow">Deine Wiederholung</span><strong>'+escapeHtml(recommendation)+'</strong>'+
        '<small>'+stats.due+' fällig · '+stats.mistakeQuestions+' mit Fehlerhistorie</small></div>'+
        '<div class="quiz-review-actions">'+
          '<button id="quizStartMixed" class="primary" type="button">Gemischte Runde</button>'+
          '<button id="quizReviewMistakes" type="button" '+(stats.mistakeQuestions?"":"disabled")+'>Fehler wiederholen</button>'+
          '<button id="quizReviewDue" type="button" '+(stats.due?"":"disabled")+'>Jetzt fällig'+(stats.due?" · "+stats.due:"")+'</button>'+
        '</div>'+
      '</section>'+
      '<section class="quiz-topic-section"><div class="quiz-topic-head"><div><span class="quiz-dash-eyebrow">Themen frei wählen</span><h3>Was möchtest du üben?</h3></div><button id="quizOpenAllQuestions" type="button">Alle Fragen</button></div>'+
        '<div class="quiz-topic-grid">'+categoryHtml+'</div>'+
      '</section>';

    if(byId("quizResumeRound"))byId("quizResumeRound").addEventListener("click",function(){
      mode="play";
      var modal=byId("quizModal");
      if(modal){modal.classList.remove("quiz-dashboard-mode","quiz-library-mode");modal.classList.add("quiz-round-mode")}
      box.classList.remove("show");
      if(typeof window.resumeKidsQuizSession==="function")window.resumeKidsQuizSession();
    });
    if(byId("quizStartMixed"))byId("quizStartMixed").addEventListener("click",function(){startRound("all","normal")});
    if(byId("quizReviewMistakes"))byId("quizReviewMistakes").addEventListener("click",function(){startRound("all","mistakes")});
    if(byId("quizReviewDue"))byId("quizReviewDue").addEventListener("click",function(){startRound("all","due")});
    if(byId("quizOpenAllQuestions"))byId("quizOpenAllQuestions").addEventListener("click",showLibrary);
    box.querySelectorAll("[data-quiz-topic]").forEach(function(btn){
      btn.addEventListener("click",function(){startRound(btn.getAttribute("data-quiz-topic")||"all","normal")});
    });
  }
  function showDashboard(){
    ensureUi();
    mode="dashboard";directQuestion=false;category="all";updateModeButtons();
    var modal=byId("quizModal");
    if(modal){
      modal.classList.add("open","quiz-dashboard-mode");
      modal.classList.remove("quiz-library-mode","quiz-round-mode");
      modal.setAttribute("data-quiz-band",bandId());
    }
    var label=byId("quizAgeLabel");if(label)label.textContent=ageLabel()+" · dein Lernstand";
    if(byId("quizLearningDashboard"))byId("quizLearningDashboard").classList.add("show");
    if(byId("quizLibraryPanel"))byId("quizLibraryPanel").classList.remove("show");
    if(byId("quizLibraryBack"))byId("quizLibraryBack").classList.remove("show");
    if(byId("quizProgress"))byId("quizProgress").style.display="";
    if(byId("quizBody"))byId("quizBody").style.display="";
    renderDashboard();
  }
  window.openKidsQuizHub=function(){
    var modal=byId("quizModal");
    if(modal)modal.classList.add("open");
    if(!Array.isArray(window.kidsQuizPool)||!window.kidsQuizPool.length){
      if(byId("quizAgeLabel"))byId("quizAgeLabel").textContent="Quiz wird geladen …";
      if(typeof window.fetchKidsQuiz==="function"){
        Promise.resolve(window.fetchKidsQuiz()).then(showDashboard);
        return;
      }
    }
    showDashboard();
  };
  window.onKidsQuizAgeChanged=function(){
    category="all";query="";visibleLimit=PAGE_SIZE;
    try{localStorage.removeItem("kids.quiz.ageBand")}catch(_){}
    var modal=byId("quizModal");
    if(modal&&modal.classList.contains("open"))showDashboard();
  };

  function refreshSummary(){
    var all=canonicalItems(),band=bandItems();
    var sum=byId("quizLibrarySummary"),sub=byId("quizLibrarySub");
    if(sum)sum.textContent=band.length+" Fragen für "+ageLabel();
    if(sub)sub.textContent=all.length+" Fragen insgesamt · dein Profil wählt das Alter";
    var lib=byId("quizModeLibrary");
    if(lib)lib.textContent="Alle Fragen · "+band.length;
  }
  function setHero(){
    var hero=byId("quizLibraryHero"),count=byId("quizLibraryHeroCount"),age=byId("quizLibraryHeroAge");
    var items=bandItems(),filtered=category==="all"?items:items.filter(function(q){return String(q.category||"")===category});
    if(count)count.textContent=filtered.length+" Fragen";
    if(age)age.textContent=category==="all"?ageLabel()+" · vollständig":ageLabel()+" · "+category;
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
    var cats=categories().map(function(c){return c.name});
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
    voiceRefreshTimer=setTimeout(function(){if(mode==="library"&&!directQuestion)renderList()},650);
  }
  function renderList(){
    var list=byId("quizLibraryList"),meta=byId("quizLibraryResultCount"),more=byId("quizLibraryMore"),hint=byId("quizLibraryMetaHint");if(!list)return;
    var allBand=bandItems(),items=allBand.filter(matches),shown=items.slice(0,visibleLimit);
    if(meta)meta.textContent=items.length+" Treffer · "+shown.length+" angezeigt";
    if(hint)hint.textContent=items.length<allBand.length?"Suche/Filter aktiv":"Antippen = direkt testen";
    list.innerHTML="";
    if(!items.length){
      if(more)more.classList.remove("show");
      list.innerHTML='<div class="quiz-library-empty">Keine Frage passt zu dieser Suche.</div>';
      return;
    }
    var frag=document.createDocumentFragment(),waitingForVoice=false;
    shown.forEach(function(q){
      var row=document.createElement("div");row.className="quiz-library-row";
      var art=rowArtwork(q);
      if(art.url){
        row.style.setProperty("--quiz-row-art",'url("'+String(art.url).replace(/"/g,"%22")+'")');
        row.style.setProperty("--quiz-row-pos",String(art.position||"50% 50%"));
        row.setAttribute("data-quiz-family",String(art.family||"age"));
      }
      var thumb=document.createElement("span");thumb.className="quiz-library-thumb";thumb.setAttribute("aria-hidden","true");
      var open=document.createElement("button");open.type="button";open.className="quiz-library-open";
      open.innerHTML=
        '<span class="quiz-library-topline"><span class="quiz-library-num">#'+String(q.number).padStart(3,"0")+'</span><span class="quiz-library-cat">'+escapeHtml(q.category||"Quiz")+'</span><span class="quiz-library-state">'+escapeHtml(stateLabel(q))+'</span></span>'+
        '<span class="quiz-library-question">'+escapeHtml(q.question)+'</span>';
      open.addEventListener("click",function(){openQuestion(q)});
      var audio=document.createElement("button"),state=voiceState(q);
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
    var modal=byId("quizModal"),panel=byId("quizLibraryPanel"),back=byId("quizLibraryBack");
    if(modal){modal.classList.add("quiz-library-mode");modal.classList.remove("quiz-dashboard-mode","quiz-round-mode");modal.setAttribute("data-quiz-band",bandId())}
    if(byId("quizLearningDashboard"))byId("quizLearningDashboard").classList.remove("show");
    if(panel)panel.classList.add("show");
    if(back)back.classList.remove("show");
    refreshSummary();setHero();renderCategories();renderList();
    var label=byId("quizAgeLabel");if(label)label.textContent=ageLabel()+" · alle Fragen";
    if(panel)panel.scrollTop=0;
  }
  function showLibrary(){renderLibrary()}
  function openQuestion(q){
    mode="library";directQuestion=true;updateModeButtons();
    try{localStorage.removeItem("kids.quiz.session.v1")}catch(_){}
    var modal=byId("quizModal"),panel=byId("quizLibraryPanel"),back=byId("quizLibraryBack");
    if(modal){modal.classList.remove("quiz-library-mode","quiz-dashboard-mode");modal.classList.add("quiz-round-mode")}
    if(byId("quizLearningDashboard"))byId("quizLearningDashboard").classList.remove("show");
    if(panel)panel.classList.remove("show");
    if(back)back.classList.add("show");
    window.currentQuiz=[q];
    window.currentQuizIndex=0;
    window.quizCorrectCount=0;
    window.quizLocked=false;
    window.quizQuestionHadError=false;
    var label=byId("quizAgeLabel");if(label)label.textContent="Frage #"+String(q.number).padStart(3,"0")+" · "+String(q.category||"Quiz");
    if(typeof window.renderQuizQuestion==="function")window.renderQuizQuestion();
    try{localStorage.removeItem("kids.quiz.session.v1")}catch(_){}
    setTimeout(function(){var next=byId("quizNext");if(next)next.textContent="Zur Übersicht"},0);
  }

  if(typeof originalFinish==="function"){
    window.renderQuizFinish=function(){
      if(directQuestion){renderLibrary();return}
      var result=originalFinish.apply(this,arguments);
      setTimeout(function(){
        var body=byId("quizBody");if(!body)return;
        var finish=body.querySelector(".quiz-finish");if(!finish)return;
        var btn=document.createElement("button");
        btn.type="button";btn.className="secondary quiz-finish-home";btn.textContent="Zur Lernübersicht";
        btn.addEventListener("click",showDashboard);
        finish.appendChild(btn);
      },0);
      return result;
    };
  }

  var originalFetch=window.fetchKidsQuiz;
  if(typeof originalFetch==="function"){
    window.fetchKidsQuiz=function(){
      var p=originalFetch.apply(this,arguments);
      return Promise.resolve(p).then(function(result){
        setTimeout(function(){refreshSummary();if(mode==="dashboard")renderDashboard();if(mode==="library")renderLibrary()},0);
        return result;
      });
    };
  }

  function init(){
    ensureUi();
    try{localStorage.removeItem("kids.quiz.ageBand")}catch(_){}
    var attempts=0;
    (function waitForQuizData(){
      refreshSummary();
      if(canonicalItems().length>0){if(mode==="dashboard")renderDashboard();return}
      attempts++;
      if(attempts<24)setTimeout(waitForQuizData,250);
    })();
  }
  window.addEventListener("dar-kids-quiz-loaded",function(){
    refreshSummary();
    if(mode==="dashboard")renderDashboard();
    if(mode==="library")renderLibrary();
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
