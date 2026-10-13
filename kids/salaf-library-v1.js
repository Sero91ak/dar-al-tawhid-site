/* DAR AL TAWHID KIDS — Schätze der Salaf · isolated library shell V1
 * ONLY explicit editorially approved items enter the public library.
 * One shared master narration and master audio across every age profile.
 */
(function(){
  "use strict";
  var root=document.getElementById("view-salaf");
  if(!root)return;
  var CATEGORIES=[
    {id:"rahma",title:"Barmherzigkeit & Helfen",short:"Barmherzigkeit",caption:"Helfen und Gutes tun",img:"/kids/assets/salaf/topics-v1380/rahma.jpg"},
    {id:"sidq",title:"Ehrlichkeit & Vertrauen",short:"Ehrlichkeit",caption:"Die Wahrheit sagen",img:"/kids/assets/salaf/topics-v1380/sidq.jpg"},
    {id:"sabr",title:"Geduld & Sanftmut",short:"Geduld",caption:"Ruhig und freundlich bleiben",img:"/kids/assets/salaf/topics-v1380/sabr.jpg"},
    {id:"ilm",title:"Wissen & Lernen",short:"Wissen",caption:"Mit Freude Neues lernen",img:"/kids/assets/salaf/topics-v1380/ilm.jpg"},
    {id:"adab",title:"Freundschaft & Adab",short:"Freundschaft",caption:"Gut miteinander umgehen",img:"/kids/assets/salaf/topics-v1380/adab.jpg"},
    {id:"family",title:"Familie & Eltern",short:"Familie",caption:"Liebe und Fürsorge",img:"/kids/assets/salaf/topics-v1380/family.jpg"},
    {id:"hikma",title:"Klugheit & Verantwortung",short:"Klugheit",caption:"Gute Entscheidungen",img:"/kids/assets/salaf/topics-v1380/hikma.jpg"},
    {id:"shukr",title:"Dankbarkeit & Bescheidenheit",short:"Dankbarkeit",caption:"Das Gute erkennen",img:"/kids/assets/salaf/topics-v1380/shukr.jpg"}
  ];
  var INSIGHTS={"rahma":{"intro":{"4-5":"Barmherzig sein heißt: Du siehst, wenn jemand Hilfe braucht, und bist freundlich.","6-8":"Wer barmherzig ist, bemerkt, wenn andere Hilfe brauchen, und hilft mit einem guten Herzen.","9-10":"Barmherzigkeit zeigt sich darin, wie wir mit Menschen umgehen, besonders wenn sie unsere Hilfe brauchen."},"question":{"4-5":"Wem kannst du heute helfen?","6-8":"Welche kleine Hilfe könnte heute jemanden glücklich machen?","9-10":"Wie kannst du jemanden unterstützen, ohne dafür ein Lob zu erwarten?"}},"sidq":{"intro":{"4-5":"Ehrlich sein bedeutet: Du sagst die Wahrheit.","6-8":"Ehrlichkeit bedeutet, bei der Wahrheit zu bleiben – auch wenn es schwerfällt.","9-10":"Ehrlichkeit heißt, aufrichtig zu sprechen und zu handeln, selbst wenn wir einen Fehler zugeben müssen."},"question":{"4-5":"Was sagst du, wenn dir etwas kaputtgeht?","6-8":"Was hilft dir, einen Fehler ehrlich zuzugeben?","9-10":"Warum ist Vertrauen wichtig, wenn wir mit anderen umgehen?"}},"sabr":{"intro":{"4-5":"Geduld heißt: Du bleibst ruhig und gibst nicht gleich auf.","6-8":"Geduldig sein heißt, ruhig weiterzumachen, auch wenn etwas Zeit und Übung braucht.","9-10":"Geduld hilft uns, Schwierigkeiten mit Ruhe und Ausdauer zu begegnen, statt vorschnell aufzugeben."},"question":{"4-5":"Worauf kannst du geduldig warten?","6-8":"Wann hat dir Geduld schon einmal geholfen?","9-10":"Wie kannst du ruhig bleiben, wenn etwas nicht sofort gelingt?"}},"ilm":{"intro":{"4-5":"Lernen ist schön. Mit jeder neuen Sache weißt du ein bisschen mehr.","6-8":"Wissen hilft dir, deine Fragen zu verstehen, Gutes zu tun und Allah besser kennenzulernen.","9-10":"Wer Wissen sucht, lernt Fragen zu stellen, zuverlässig zu prüfen und das Gelernte gut anzuwenden."},"question":{"4-5":"Was willst du heute lernen?","6-8":"Welche Frage möchtest du heute jemandem stellen?","9-10":"Wie findest du heraus, ob eine Antwort zuverlässig ist?"}},"adab":{"intro":{"4-5":"Gute Freunde helfen sich und sprechen freundlich.","6-8":"Freundschaft wächst, wenn wir zuhören, freundlich reden und einander helfen.","9-10":"Guter Umgang zeigt sich durch Rücksicht, ehrliche Worte und Hilfe, auch wenn Freunde einmal verschiedener Meinung sind."},"question":{"4-5":"Wie machst du jemandem eine Freude?","6-8":"Was kannst du tun, wenn dein Freund traurig ist?","9-10":"Wie kannst du freundlich bleiben, wenn du anderer Meinung bist?"}},"family":{"intro":{"4-5":"In der Familie helfen wir einander und zeigen Liebe.","6-8":"Zu Hause zeigen wir Fürsorge, indem wir einander unterstützen und mit Respekt sprechen.","9-10":"Familie bedeutet Verantwortung füreinander: Wir achten aufeinander und helfen auch bei kleinen Alltagsaufgaben."},"question":{"4-5":"Wem hilfst du heute zu Hause?","6-8":"Welche Aufgabe könntest du heute für deine Familie übernehmen?","9-10":"Wie kannst du zu Hause Verantwortung übernehmen, ohne erst darum gebeten zu werden?"}},"hikma":{"intro":{"4-5":"Klug sein heißt: Erst denken, dann handeln.","6-8":"Eine kluge Entscheidung beginnt damit, dass du kurz nachdenkst, bevor du etwas tust.","9-10":"Verantwortung bedeutet, mögliche Folgen einer Entscheidung zu bedenken und das Gute bewusst zu wählen."},"question":{"4-5":"Was machst du, bevor du losrennst?","6-8":"Wer kann dir bei einer schweren Entscheidung helfen?","9-10":"Welche Fragen helfen dir, eine gute Entscheidung zu treffen?"}},"shukr":{"intro":{"4-5":"Dankbar sein heißt: Du freust dich über Gutes und sagst Danke.","6-8":"Dankbarkeit heißt, schöne Dinge und kleine Hilfen zu erkennen und dafür Danke zu sagen.","9-10":"Dankbarkeit zeigt sich nicht nur in Worten, sondern auch darin, wie sorgsam wir mit dem umgehen, was wir haben."},"question":{"4-5":"Wofür sagst du heute Danke?","6-8":"Für welche kleine Sache bist du heute dankbar?","9-10":"Wie kannst du deine Dankbarkeit durch eine gute Tat zeigen?"}}};
  var MANIFEST="/kids/data/salaf-library-v1.json?v=2";
  var items=[],tab="all",topic="",active=null,reader=null,audio=new Audio(),playing=false;
  audio.preload="metadata";audio.setAttribute("playsinline","");
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var age=function(){return String(document.querySelector(".app")?.getAttribute("data-age")||"6–8").replace("–","-")};
  var gender=function(){return document.querySelector(".app")?.getAttribute("data-gender")==="girl"?"girl":"boy"};
  var textFor=function(i){return String(i?.masterStoryText||"").trim()};
  var audioFor=function(i){var a=i?.audioMaster||i?.audio;return a&&typeof a==="object"&&a.url?a:null};
  function safeAsset(path){try{var u=new URL(path,location.origin);return u.origin===location.origin&&/^\/kids\/assets\/[\w\/.%+-]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(u.pathname)?u.pathname:""}catch(_){return""}}
  function safeAudio(path){try{var u=new URL(path,location.origin);return u.origin===location.origin&&/^\/kids\/[\w\/.%+-]+\.(?:mp3|m4a)$/i.test(u.pathname)?u.pathname+u.search:""}catch(_){return""}}
  function soundFor(i){var a=audioFor(i);return a&&safeAudio(a.url)||""}
  function valid(i){
    return i&&/^[a-z0-9-]+$/.test(String(i.id||""))&&i.verification==="approved"&&i.editorialRelease===true&&
      CATEGORIES.some(function(c){return c.id===i.category})&&
      typeof i.title==="string"&&i.title.trim()&&
      typeof i.person==="string"&&i.person.trim()&&
      Array.isArray(i.sources)&&i.sources.some(function(s){return s&&s.author&&s.work&&s.reference&&s.assessment==="verified"})&&
      typeof i.masterStoryText==="string"&&i.masterStoryText.trim().length>80&&
      i.masterStoryText.trim().startsWith("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh")&&
      /lieber Bruder/i.test(i.masterStoryText)&&/liebe Schwester/i.test(i.masterStoryText)&&
      /As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh\.?\s*$/.test(i.masterStoryText);
  }
  function available(){return items.filter(function(i){return !!textFor(i)})}
  function prettyAge(){return age().replace("-","–")}
  var home=
    '<nav id="salafTopicAppbar" class="salaf-topic-nav kids-detail-appbar kids-subpage-nav" aria-label="Seitennavigation" hidden>'+
      '<button type="button" id="salafClear" class="kids-detail-dock-back" aria-label="Zurück zu allen Themen"></button>'+
      '<div class="kids-detail-appbar-copy"><strong class="kids-detail-appbar-title">Schätze der Salaf</strong>'+
      '<small class="kids-detail-appbar-subtitle" id="salafTopicLabel">Themen</small></div></nav>'+
    '<header class="salaf-hero">'+
      '<span class="salaf-hero-light" aria-hidden="true"></span>'+
      '<div class="salaf-hero-copy"><span class="salaf-eyebrow">DĀR AL TAWḤĪD KIDS · GESCHICHTENWELT</span>'+
      '<h2>Schätze der Salaf</h2><p>Geschichten zum Hören, Lesen und Staunen.</p>'+
      '</div>'+
    '</header>'+
    '<div class="salaf-wrap">'+
      '<div class="salaf-intro"><div class="salaf-intro-top"><span class="salaf-eyebrow">DEINE GESCHICHTENWELT</span>'+
      '<span class="salaf-age" id="salafAge"></span></div><h3>Was möchtest du entdecken?</h3></div>'+
      '<div class="salaf-switch" role="group" aria-label="Bibliotheksansicht">'+
        '<button type="button" data-salaf-tab="all" class="selected">Themen</button>'+
        '<button type="button" data-salaf-tab="people">Personen</button>'+
        '<button type="button" data-salaf-tab="offline">Offline</button>'+
      '</div>'+
      '<section id="salafHome" class="salaf-pane" aria-label="Themen"></section>'+
      '<section id="salafList" class="salaf-results" aria-live="polite"></section>'+
      ''+
    '</div>'+
    '<section id="salafDetail" class="salaf-detail" role="dialog" aria-modal="true" aria-label="Geschichte" aria-hidden="true" hidden>'+
      '<div class="salaf-detail-scroll"><nav class="salaf-story-nav kids-detail-appbar" aria-label="Seitennavigation">'+
      '<button class="salaf-back kids-detail-dock-back" type="button" aria-label="Zurück zur Geschichtenbibliothek"></button>'+
      '<div class="kids-detail-appbar-copy"><strong class="kids-detail-appbar-title">Schätze der Salaf</strong>'+
      '<small class="kids-detail-appbar-subtitle" id="salafStoryNavTitle">Geschichte</small></div></nav>'+
      '<div class="salaf-detail-cover" id="salafDetailCover"><span class="salaf-eyebrow">HÖRGESCHICHTE</span><h2 id="salafDetailTitle"></h2><p id="salafDetailPerson"></p></div>'+
      '<div class="salaf-detail-body"><div class="salaf-player"><strong>Deine Geschichte</strong>'+
        '<div class="salaf-player-row"><button type="button" id="salafBack15" aria-label="15 Sekunden zurück">−15 s</button>'+
        '<button type="button" id="salafPlay" class="salaf-play">▶ Hören</button>'+
        '<button type="button" id="salafNext15" aria-label="15 Sekunden vor">+15 s</button></div>'+
        '<input id="salafSeek" type="range" min="0" max="1000" value="0" aria-label="Hörposition">'+
        '<div class="salaf-times"><span id="salafCurrent">0:00</span><span id="salafDuration">0:00</span></div>'+
        '<p id="salafAudioStatus" class="salaf-audio-status" role="status"></p></div>'+
        '<div class="salaf-actions"><button type="button" id="salafRead">Lesen</button><button type="button" id="salafFollow">Hören &amp; Mitlesen</button></div>'+
        '<article class="salaf-text" id="salafText" hidden></article>'+
        '<section class="salaf-refs"><h3>Unsere Quellen</h3><div id="salafRefs"></div></section></div></div>'+
    '</section>';
  root.innerHTML=home;
  var q=function(s){return root.querySelector(s)||(details&&(details.matches(s)?details:details.querySelector(s)))||null};
  var pane=q("#salafHome"),list=q("#salafList"),details=q("#salafDetail");
  /* Escape the shell stacking context so the full-screen player covers the bottom navigation. */
  document.body.appendChild(details);
  function card(i){
    var img=safeAsset(i.image||"")||CATEGORIES.find(function(c){return c.id===i.category})?.img||"";
    return '<button class="salaf-story" type="button" data-story-id="'+esc(i.id)+'">'+
      '<span class="salaf-story-art" style="background-image:url(&quot;'+esc(img)+'&quot;)"></span>'+
      '<span class="salaf-story-copy"><small>'+esc(i.person)+'</small><strong>'+esc(i.title)+'</strong>'+
      '<span>'+esc(i.summary||"Eine wahre Begebenheit entdecken")+'</span>'+
      '<em>'+(soundFor(i)?"▶ Hören & lesen":"Geschichte lesen")+'</em></span><span aria-hidden="true">›</span></button>';
  }
  function renderCards(target,arr){
    target.innerHTML=arr.length?'<div class="salaf-story-grid">'+arr.map(card).join("")+'</div>':
      '<div class="salaf-empty"><span class="salaf-empty-icon" aria-hidden="true"></span><strong>Geschichten kommen bald dazu</strong>'+
      '<p>Hier gibt es bald Neues zum Hören und Lesen.</p></div>';
  }
  function scrollSalafTop(){
    var scroller=document.querySelector(".shell");
    if(scroller){try{scroller.scrollTo({top:0,left:0,behavior:"auto"})}catch(_){scroller.scrollTop=0}}
    else{try{root.scrollIntoView({block:"start",behavior:"auto"})}catch(_){}}
  }
  function render(){
    root.dataset.profile=gender();
    var detailOpen=tab==="all"&&!!topic;
    root.dataset.topicOpen=detailOpen?"true":"false";
    root.dataset.kidsDetailLayout=detailOpen?"v1390":"";
    root.classList.toggle("kids-detail-page",detailOpen);
    var appbar=q("#salafTopicAppbar");
    appbar.hidden=!detailOpen;
    if(detailOpen)q("#salafTopicLabel").textContent=CATEGORIES.find(function(c){return c.id===topic})?.short||"Themen";
    q("#salafAge").textContent="Für "+prettyAge()+" Jahre";
    root.querySelectorAll("[data-salaf-tab]").forEach(function(b){b.classList.toggle("selected",b.dataset.salafTab===tab);b.setAttribute("aria-pressed",String(b.dataset.salafTab===tab))});
    var vis=available();
    if(tab==="all"){
      if(topic){
        var chosen=CATEGORIES.find(function(c){return c.id===topic});
        var matches=vis.filter(function(i){return i.category===topic});
        var insight=INSIGHTS[chosen.id]||INSIGHTS.rahma;
        var topicArt=safeAsset(chosen.img)||"";
        pane.innerHTML='<header class="salaf-topic-stage kids-detail-hero" style="--salaf-stage-art:url(&quot;'+esc(topicArt)+'&quot;)">'+
          '<div class="salaf-topic-stage-copy"><span class="salaf-eyebrow">DEIN THEMA</span>'+
          '<h3>'+esc(chosen.short)+'</h3><p>'+esc(chosen.caption)+'</p></div></header>'+
          '<section class="salaf-topic-thought" aria-label="Über das Thema nachdenken">'+
          '<span class="salaf-topic-kicker">ENTDECKEN & NACHDENKEN</span>'+
          '<p>'+esc(insight.intro[age()]||insight.intro["6-8"])+'</p>'+
          '<strong>'+esc(insight.question[age()]||insight.question["6-8"])+'</strong></section>';
        list.innerHTML="";
        if(matches.length){
          list.innerHTML='<div class="salaf-list-head"><h3>Geschichten zu diesem Thema</h3></div>';
          var storiesNode=document.createElement("div");
          list.appendChild(storiesNode);
          renderCards(storiesNode,matches);
        }else{
          list.innerHTML='<p class="salaf-upcoming salaf-topic-note">Hier sammeln wir sorgfältig geprüfte Geschichten. Bis dahin kannst du über die Frage oben nachdenken.</p>';
        }
      }else{
        pane.innerHTML='<div class="salaf-topic-grid">'+CATEGORIES.map(function(c){
          var count=vis.filter(function(i){return i.category===c.id}).length;
          return '<button type="button" class="salaf-topic" data-topic="'+c.id+'" aria-label="'+esc(c.title)+' öffnen">'+
            '<span class="salaf-topic-image" style="background-image:url(&quot;'+esc(c.img)+'&quot;)"></span>'+
            '<span class="salaf-topic-copy"><strong>'+esc(c.short)+'</strong><small>'+esc(c.caption)+'</small></span>'+
            (count?'<span class="salaf-card-count">'+count+' Geschichten</span>':"")+'</button>';
        }).join("")+'</div>';
        list.innerHTML=vis.length
          ?'<div class="salaf-list-head"><h3>Alle Geschichten</h3></div><div class="salaf-story-grid">'+vis.map(card).join("")+'</div>'
          :'<p class="salaf-upcoming">Wähle ein Thema und entdecke, was es bedeutet. Die ersten geprüften Geschichten folgen nach ihrer Freigabe.</p>';
      }
    }else if(tab==="people"){
      var people=[...new Set(vis.map(function(i){return i.person}))].sort(function(a,b){return a.localeCompare(b,"de")});
      pane.innerHTML='<div class="salaf-section-title"><h3>Persönlichkeiten</h3><p>Lerne besondere Menschen und ihre Geschichten kennen.</p></div>';
      list.innerHTML=people.length?people.map(function(person){
        return '<section class="salaf-person"><h4>'+esc(person)+'</h4><div class="salaf-story-grid">'+vis.filter(function(i){return i.person===person}).map(card).join("")+'</div></section>';
      }).join(""):'<div class="salaf-empty salaf-empty-compact"><span class="salaf-empty-icon" aria-hidden="true"></span><strong>Hier warten besondere Menschen auf dich</strong><p>Ihre Geschichten erzählen wir dir bald.</p></div>';
    }else{
      pane.innerHTML='<div class="salaf-offline-hero"><span class="salaf-offline-art" aria-hidden="true"></span><div class="salaf-offline-copy"><strong>Deine Geschichten für unterwegs</strong><p>Einmal speichern. Auch ohne Internet hören und lesen.</p>'+
        '<button type="button" id="salafOpenParentsOffline">Meine Downloads ansehen</button></div></div>';
      list.innerHTML=vis.some(function(i){return !!soundFor(i)})?'<div class="salaf-section-title"><h3>Zum Speichern</h3></div>':'<p class="salaf-upcoming">Hier findest du bald deine Hörgeschichten zum Speichern.</p>';
      var node=document.createElement("div");list.appendChild(node);
      if(vis.some(function(i){return !!soundFor(i)}))renderCards(node,vis.filter(function(i){return !!soundFor(i)}));
      var cards=node.querySelectorAll(".salaf-story");
      cards.forEach(function(b){
        var i=items.find(function(x){return x.id===b.dataset.storyId});
        if(i)window.DARKidsItemDownloads?.story(b,{category:"salaf",item:i,sourceUrl:MANIFEST,artwork:i.image,hero:i.hero||i.image,audioMeta:audioFor(i),readerUrl:"/kids/salaf-library-v1.js?v=1390"});
      });
      q("#salafOpenParentsOffline")?.addEventListener("click",function(){
        q("#salafDetail")?.setAttribute("hidden","");
        document.querySelector('.nav-btn[data-target="parents"]')?.click();
        setTimeout(function(){document.getElementById("kidsOfflineLibrary")?.scrollIntoView({block:"start",behavior:"smooth"})},100);
      });
    }
  }
  function dur(t){var n=Math.max(0,Math.floor(Number(t)||0));return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")}
  function updatePlay(){q("#salafPlay").textContent=audio.paused?"▶ Hören":"Ⅱ Pause"}
  function updateTime(){
    var n=Number(audio.duration)||0;q("#salafCurrent").textContent=dur(audio.currentTime);
    q("#salafDuration").textContent=dur(n);q("#salafSeek").value=n?String(Math.round(1000*audio.currentTime/n)):"0";
  }
  function pause(){try{audio.pause()}catch(_){}playing=false;updatePlay()}
  function closeStory(){
    pause();reader?.close?.();details.hidden=true;details.setAttribute("aria-hidden","true");
    document.documentElement.classList.remove("salaf-detail-open");
    details.removeAttribute("data-open");active=null;
    document.querySelector(".bottom-nav")?.removeAttribute("aria-hidden");
  }
  function showStory(i){
    if(!i||!textFor(i))return;closeStory();active=i;
    q("#salafDetailTitle").textContent=i.title;q("#salafDetailPerson").textContent=i.person;
    q("#salafStoryNavTitle").textContent=i.title;
    var art=safeAsset(i.hero||i.image||"")||"/kids/assets/deen/deen-entry.jpg";
    q("#salafDetailCover").style.backgroundImage="linear-gradient(0deg,#0a202b 1%,rgba(5,22,32,.08) 85%),url('"+art+"')";
    q("#salafText").innerHTML=textFor(i).split(/\n{2,}/).filter(Boolean).map(function(s){return "<p>"+esc(s)+"</p>"}).join("");
    q("#salafText").hidden=true;
    var src=i.sources||[];
    q("#salafRefs").innerHTML=src.map(function(s){return '<div class="salaf-ref"><strong>'+esc(s.author)+'</strong><span>'+esc(s.work)+" · "+esc(s.reference)+'</span></div>'}).join("");
    var url=soundFor(i);
    if(url){audio.src=url;audio.preload="metadata";q("#salafAudioStatus").textContent="Deine Hörposition wird automatisch gespeichert."}
    else{audio.removeAttribute("src");audio.load();q("#salafAudioStatus").textContent="Diese Geschichte kannst du schon lesen. Eine Aufnahme gibt es hier bald auch."}
    q("#salafPlay").disabled=!url;q("#salafBack15").disabled=!url;q("#salafNext15").disabled=!url;q("#salafSeek").disabled=!url;
    q("#salafFollow").disabled=!url;updatePlay();updateTime();
    var act=q(".salaf-actions");act.querySelector(".kids-offline-inline")?.remove();
    if(url)window.DARKidsItemDownloads?.storyDetail(act,{category:"salaf",item:i,sourceUrl:MANIFEST,
      artwork:i.image,hero:i.hero||i.image,audioMeta:audioFor(i),readerUrl:"/kids/salaf-library-v1.js?v=1390"});
    reader?.setContent?.({key:"salaf:"+i.id,title:i.title,subtitle:i.person,
      album:"DĀR AL TAWḤĪD KIDS · Schätze der Salaf",text:textFor(i),artwork:art,timings:audioFor(i)?.timings||[],audioOnly:false});
    details.hidden=false;details.setAttribute("aria-hidden","false");document.documentElement.classList.add("salaf-detail-open");details.dataset.open="yes";
    q(".salaf-detail-scroll").scrollTop=0;q(".salaf-back").focus({preventScroll:true});
  }
  function toggleAudio(){
    if(!active||!soundFor(active))return;
    if(!audio.paused){pause();return}
    try{window.DARKidsStoryHub?.stop?.();window.DARKidsProphetStories?.stop?.();window.DARKidsSahabiyyat?.stop?.();window.DARKidsMubashshirun?.stop?.()}catch(_){}
    audio.play().catch(function(){q("#salafAudioStatus").textContent="Bitte tippe erneut auf Hören."});
  }
  reader=window.DARKidsFollowReader?.create({
    id:"salaf-library",audio:audio,
    getContent:function(){var i=active;return {key:i?"salaf:"+i.id:"salaf-library",title:i?.title||"Geschichte",
      subtitle:i?.person||"Schätze der Salaf",text:textFor(i),artwork:safeAsset(i?.hero||i?.image||""),
      timings:audioFor(i)?.timings||[],audioOnly:false}},
    toggleAudio:toggleAudio,autoOpen:false,disabled:function(){return !soundFor(active)}
  })||null;
  audio.addEventListener("timeupdate",updateTime);audio.addEventListener("durationchange",updateTime);
  audio.addEventListener("play",updatePlay);audio.addEventListener("pause",updatePlay);audio.addEventListener("ended",updatePlay);
  q("#salafPlay").addEventListener("click",toggleAudio);
  q("#salafBack15").addEventListener("click",function(){audio.currentTime=Math.max(0,audio.currentTime-15)});
  q("#salafNext15").addEventListener("click",function(){audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+15)});
  q("#salafSeek").addEventListener("input",function(e){if(Number(audio.duration))audio.currentTime=Number(e.target.value)*audio.duration/1000});
  q("#salafRead").addEventListener("click",function(){q("#salafText").hidden=!q("#salafText").hidden;q("#salafText").scrollIntoView({block:"start",behavior:"smooth"})});
  q("#salafFollow").addEventListener("click",function(){reader?.openReadAlong?.()});
  q(".salaf-back").addEventListener("click",closeStory);
  root.addEventListener("click",function(e){
    if(e.target.closest("#salafClear")){
      e.preventDefault();topic="";tab="all";render();scrollSalafTop();return;
    }
    var story=e.target.closest("[data-story-id]");if(story&&story.closest(".salaf-story")){
      var i=items.find(function(x){return x.id===story.dataset.storyId});if(i)showStory(i);return;
    }
    var cat=e.target.closest("[data-topic]");if(cat){topic=topic===cat.dataset.topic?"":cat.dataset.topic;render();scrollSalafTop();return}
    var switcher=e.target.closest("[data-salaf-tab]");if(switcher){tab=switcher.dataset.salafTab;topic="";render();}
  });
  document.addEventListener("click",function(e){var b=e.target.closest?.(".nav-btn[data-target]");if(b&&b.dataset.target!=="salaf"&&active)closeStory()},true);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&active)closeStory()});
  var app=document.querySelector(".app");
  if(app&&"MutationObserver" in window){new MutationObserver(function(){if(active)closeStory();render()}).observe(app,{attributes:true,attributeFilter:["data-gender","data-age"]})}
  window.DARKidsSalafLibrary=Object.freeze({version:1,open:function(){document.querySelector('.nav-btn[data-target="salaf"]')?.click()},refresh:render});
  render();
  fetch(MANIFEST,{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("Manifest nicht erreichbar");return r.json()})
    .then(function(data){items=(Array.isArray(data.items)?data.items:[]).filter(valid);render()})
    .catch(function(){items=[];render()});
})();