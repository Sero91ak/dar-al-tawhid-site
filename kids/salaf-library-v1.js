/* DAR AL TAWHID KIDS — Schätze der Salaf · isolated library shell V1
 * ONLY explicit editorially approved items enter the public library.
 * Age-specific masters never fall back to a different age.
 */
(function(){
  "use strict";
  var root=document.getElementById("view-salaf");
  if(!root)return;
  var CATEGORIES=[
    {id:"rahma",title:"Barmherzigkeit & Helfen",short:"Barmherzigkeit",caption:"Helfen und Gutes tun",img:"/kids/assets/deen/adab-akhlaq.jpg"},
    {id:"sidq",title:"Ehrlichkeit & Vertrauen",short:"Ehrlichkeit",caption:"Die Wahrheit sagen",img:"/kids/assets/deen/iman.jpg"},
    {id:"sabr",title:"Geduld & Sanftmut",short:"Geduld",caption:"Ruhig und freundlich bleiben",img:"/kids/assets/prophets-v2/ayyub-card.jpg"},
    {id:"ilm",title:"Wissen & Lernen",short:"Wissen",caption:"Mit Freude Neues lernen",img:"/kids/assets/deen/deen-entry.jpg"},
    {id:"adab",title:"Freundschaft & Adab",short:"Freundschaft",caption:"Gut miteinander umgehen",img:"/kids/assets/kids-art/knowledge-courtyard-v11.jpg"},
    {id:"family",title:"Familie & Eltern",short:"Familie",caption:"Liebe und Fürsorge",img:"/kids/assets/prophets-v2/ismail-card.jpg"},
    {id:"hikma",title:"Klugheit & Verantwortung",short:"Klugheit",caption:"Gute Entscheidungen",img:"/kids/assets/deen/ibadah.jpg"},
    {id:"shukr",title:"Dankbarkeit & Bescheidenheit",short:"Dankbarkeit",caption:"Das Gute erkennen",img:"/kids/assets/deen/tawhid.jpg"}
  ];
  var MANIFEST="/kids/data/salaf-library-v1.json?v=1";
  var items=[],tab="all",topic="",active=null,reader=null,audio=new Audio(),playing=false;
  audio.preload="metadata";audio.setAttribute("playsinline","");
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var age=function(){return String(document.querySelector(".app")?.getAttribute("data-age")||"6–8").replace("–","-")};
  var gender=function(){return document.querySelector(".app")?.getAttribute("data-gender")==="girl"?"girl":"boy"};
  var textFor=function(i){return String(i?.texts?.[age()]||"").trim()};
  var audioFor=function(i){var a=i?.audio?.[age()];return a&&typeof a==="object"&&a.url?a:null};
  function safeAsset(path){try{var u=new URL(path,location.origin);return u.origin===location.origin&&/^\/kids\/assets\/[\w\/.%+-]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(u.pathname)?u.pathname:""}catch(_){return""}}
  function safeAudio(path){try{var u=new URL(path,location.origin);return u.origin===location.origin&&/^\/kids\/[\w\/.%+-]+\.(?:mp3|m4a)$/i.test(u.pathname)?u.pathname+u.search:""}catch(_){return""}}
  function soundFor(i){var a=audioFor(i);return a&&safeAudio(a.url)||""}
  function valid(i){
    return i&&/^[a-z0-9-]+$/.test(String(i.id||""))&&i.verification==="approved"&&i.editorialRelease===true&&
      CATEGORIES.some(function(c){return c.id===i.category})&&
      typeof i.title==="string"&&i.title.trim()&&
      typeof i.person==="string"&&i.person.trim()&&
      Array.isArray(i.sources)&&i.sources.some(function(s){return s&&s.author&&s.work&&s.reference&&s.assessment==="verified"})&&
      Boolean(i.texts&&Object.values(i.texts).some(function(t){return typeof t==="string"&&t.trim().length>80}));
  }
  function available(){return items.filter(function(i){return !!textFor(i)})}
  function prettyAge(){return age().replace("-","–")}
  var home=
    '<header class="salaf-hero">'+
      '<span class="salaf-hero-light" aria-hidden="true"></span>'+
      '<div class="salaf-hero-copy"><span class="salaf-eyebrow">DĀR AL TAWḤĪD KIDS · GESCHICHTENWELT</span>'+
      '<h2>Schätze der Salaf</h2><p>Geschichten zum Hören, Lesen und Staunen.</p>'+
      '</div>'+
    '</header>'+
    '<div class="salaf-wrap">'+
      '<div class="salaf-intro"><div class="salaf-intro-copy"><span class="salaf-eyebrow">ENTDECKE DEINE GESCHICHTENWELT</span><h3>Was möchtest du entdecken?</h3></div>'+
      '<span class="salaf-age" id="salafAge"></span></div>'+
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
      '<div class="salaf-detail-scroll"><button class="salaf-back" type="button" aria-label="Zur Geschichtenbibliothek zurück">‹ <span>Zurück</span></button>'+
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
  function render(){
    root.dataset.profile=gender();
    q("#salafAge").textContent="Für "+prettyAge()+" Jahre";
    root.querySelectorAll("[data-salaf-tab]").forEach(function(b){b.classList.toggle("selected",b.dataset.salafTab===tab);b.setAttribute("aria-pressed",String(b.dataset.salafTab===tab))});
    var vis=available();
    if(tab==="all"){
      if(topic){
        var chosen=CATEGORIES.find(function(c){return c.id===topic});
        var matches=vis.filter(function(i){return i.category===topic});
        pane.innerHTML='<div class="salaf-topic-focus">'+
          '<button type="button" id="salafClear" class="salaf-return">‹ Alle Themen</button>'+
          '<h3>'+esc(chosen?.short||"Geschichten")+'</h3>'+
          '<p>'+esc(chosen?.caption||"Entdecke eine neue Geschichtenwelt")+'</p></div>';
        list.innerHTML="";
        renderCards(list,matches);
        q("#salafClear")?.addEventListener("click",function(){topic="";render()});
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
          :'<p class="salaf-upcoming">Hier erwarten dich bald wunderschöne Geschichten.</p>';
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
        if(i)window.DARKidsItemDownloads?.story(b,{category:"salaf",item:i,sourceUrl:MANIFEST,artwork:i.image,hero:i.hero||i.image,audioMeta:audioFor(i),readerUrl:"/kids/salaf-library-v1.js?v=1"});
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
      artwork:i.image,hero:i.hero||i.image,audioMeta:audioFor(i),readerUrl:"/kids/salaf-library-v1.js?v=1"});
    reader?.setContent?.({key:"salaf:"+i.id+":"+age(),title:i.title,subtitle:i.person+" · "+prettyAge()+" Jahre",
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
    getContent:function(){var i=active;return {key:i?"salaf:"+i.id+":"+age():"salaf-library",title:i?.title||"Geschichte",
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
    var story=e.target.closest("[data-story-id]");if(story&&story.closest(".salaf-story")){
      var i=items.find(function(x){return x.id===story.dataset.storyId});if(i)showStory(i);return;
    }
    var cat=e.target.closest("[data-topic]");if(cat){topic=topic===cat.dataset.topic?"":cat.dataset.topic;render();return}
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