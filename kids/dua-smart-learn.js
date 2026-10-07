(function(){
  "use strict";

  var TIMING_URL="/kids/data/dua-learning-timings.json?v=1";
  var STORE_KEY="kids.dua.smart.progress.v1";
  var manifest=null;
  var manifestPromise=null;
  var root=null;
  var audio=new Audio();
  var currentDua=null;
  var currentTiming=null;
  var currentIndex=0;
  var playToken=0;
  var raf=0;
  var playing=false;
  var mode="";
  var queue=[];
  var queueIndex=0;
  var activeTrack=-1;
  var activeRange=null;
  var externalPlaying=false;

  audio.preload="auto";
  audio.setAttribute("playsinline","");
  audio.setAttribute("webkit-playsinline","");
  audio.setAttribute("disableremoteplayback","");
  audio.preservesPitch=true;

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function loadManifest(){
    if(manifest)return Promise.resolve(manifest);
    if(manifestPromise)return manifestPromise;
    manifestPromise=fetch(TIMING_URL,{cache:"no-store"})
      .then(function(r){if(!r.ok)throw new Error("dua-smart-timings");return r.json()})
      .then(function(d){
        if(!d||d.syncMode!=="elevenlabs-forced-alignment-v1"||d.estimatedTimingsAllowed!==false){
          throw new Error("non-exact-dua-timings");
        }
        manifest=d;
        return d;
      })
      .catch(function(err){
        manifestPromise=null;
        throw err;
      });
    return manifestPromise;
  }
  function store(){
    try{return JSON.parse(localStorage.getItem(STORE_KEY)||"{}")||{}}catch(e){return{}}
  }
  function saveProgress(){
    if(!currentDua)return;
    try{
      var all=store();
      all[currentDua.id]={
        index:currentIndex,
        updatedAt:Date.now()
      };
      localStorage.setItem(STORE_KEY,JSON.stringify(all));
    }catch(e){}
  }
  function restoreIndex(dua){
    try{
      var x=(store()[dua.id]||{}).index;
      x=Number(x);
      if(Number.isFinite(x))return Math.max(0,Math.min((dua.learningSegments||[]).length-1,x));
    }catch(e){}
    return 0;
  }
  function stopAudio(){
    playToken++;
    playing=false;
    externalPlaying=false;
    mode="";
    queue=[];
    queueIndex=0;
    activeRange=null;
    activeTrack=-1;
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    try{audio.pause()}catch(e){}
    audio.onloadedmetadata=null;
    audio.oncanplay=null;
    audio.onended=null;
    try{if(typeof window.stopDuaAudio==="function")window.stopDuaAudio()}catch(e2){}
    try{if(window.DARKidsOwnerVoice&&typeof window.DARKidsOwnerVoice.stop==="function")window.DARKidsOwnerVoice.stop()}catch(e3){}
    paintControls();
  }
  function lockBackground(on){
    document.documentElement.classList.toggle("dua-smart-open",!!on);
    document.body.classList.toggle("dua-smart-open",!!on);
    var modal=document.getElementById("duaModal");
    if(modal){
      if(on)modal.setAttribute("inert","");
      else modal.removeAttribute("inert");
    }
  }
  function ensureRoot(){
    if(root)return root;
    root=document.createElement("div");
    root.id="duaSmartLearn";
    root.className="dsl";
    root.setAttribute("aria-hidden","true");
    root.innerHTML=
      '<div class="dsl-backdrop" data-dsl="close"></div>'+
      '<section class="dsl-sheet" role="dialog" aria-modal="true" aria-labelledby="dslTitle">'+
        '<header class="dsl-head">'+
          '<button class="dsl-close" type="button" data-dsl="close" aria-label="Lernmodus schließen">×</button>'+
          '<div class="dsl-headcopy"><small>SMART-DUʿĀʾ-LERNMODUS</small><strong id="dslTitle">Duʿāʾ lernen</strong><span id="dslSub">Wort für Wort</span></div>'+
          '<div class="dsl-count" id="dslCount">1 / 1</div>'+
        '</header>'+
        '<div class="dsl-progress"><i id="dslProgress"></i></div>'+
        '<div class="dsl-scroll">'+
          '<div class="dsl-guide">Tippe auf ein arabisches Wort oder auf die Lautschrift. Beides bleibt exakt gekoppelt.</div>'+
          '<div class="dsl-arabic" id="dslArabic" dir="rtl" lang="ar"></div>'+
          '<div class="dsl-translit" id="dslTranslit"></div>'+
          '<div class="dsl-focus" id="dslFocus">'+
            '<small>AKTUELLES WORT</small>'+
            '<div class="dsl-focus-ar" id="dslFocusAr" dir="rtl" lang="ar"></div>'+
            '<div class="dsl-focus-tr" id="dslFocusTr"></div>'+
            '<div class="dsl-focus-hint">Antippen = genau dieses Wort hören</div>'+
          '</div>'+
          '<div class="dsl-controls">'+
            '<button class="dsl-play primary" type="button" data-dsl="full">Ganz hören</button>'+
            '<button class="dsl-play slow" type="button" data-dsl="slow">Langsam hören</button>'+
            '<button class="dsl-play repeat" type="button" data-dsl="repeat">Wort wiederholen</button>'+
          '</div>'+
          '<div class="dsl-speednote">Langsam-Modus: 68 % Geschwindigkeit · Aussprache bleibt unverändert.</div>'+
          '<div class="dsl-stepnav">'+
            '<button type="button" data-dsl="prev">‹ Vorheriges Wort</button>'+
            '<button type="button" data-dsl="next">Nächstes Wort ›</button>'+
          '</div>'+
          '<div class="dsl-status" id="dslStatus">Bereit zum Lernen.</div>'+
        '</div>'+
      '</section>';
    document.body.appendChild(root);
    root.addEventListener("click",onClick);
    return root;
  }
  function getSegments(){
    return currentDua&&Array.isArray(currentDua.learningSegments)?currentDua.learningSegments:[];
  }
  function timingSegments(){
    return currentTiming&&Array.isArray(currentTiming.segments)?currentTiming.segments:[];
  }
  function setStatus(text,kind){
    var el=document.getElementById("dslStatus");
    if(!el)return;
    el.textContent=String(text||"");
    el.classList.toggle("good",kind==="good");
    el.classList.toggle("bad",kind==="bad");
  }
  function selectIndex(i,opts){
    opts=opts||{};
    var segs=getSegments();
    if(!segs.length)return;
    currentIndex=Math.max(0,Math.min(segs.length-1,Number(i)||0));
    saveProgress();
    paintSelection();
    if(opts.play)playSegment(currentIndex,Number(opts.rate)||1);
    if(opts.scroll!==false){
      var node=root&&root.querySelector('[data-seg="'+currentIndex+'"]');
      if(node&&typeof node.scrollIntoView==="function"){
        try{node.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"})}catch(e){}
      }
    }
  }
  function paintSelection(){
    var segs=getSegments();
    var seg=segs[currentIndex]||{};
    if(!root)return;
    root.querySelectorAll("[data-seg]").forEach(function(n){
      n.classList.toggle("active",Number(n.getAttribute("data-seg"))===currentIndex);
    });
    var fa=document.getElementById("dslFocusAr");
    var ft=document.getElementById("dslFocusTr");
    var count=document.getElementById("dslCount");
    var progress=document.getElementById("dslProgress");
    if(fa)fa.textContent=seg.arabic||"";
    if(ft)ft.textContent=seg.transliteration||"";
    if(count)count.textContent=(currentIndex+1)+" / "+Math.max(1,segs.length);
    if(progress)progress.style.width=(((currentIndex+1)/Math.max(1,segs.length))*100).toFixed(1)+"%";
  }
  function paintControls(){
    if(!root)return;
    var full=root.querySelector('[data-dsl="full"]');
    var slow=root.querySelector('[data-dsl="slow"]');
    var repeat=root.querySelector('[data-dsl="repeat"]');
    if(full)full.textContent=playing&&mode==="full"?"Stopp":"Ganz hören";
    if(slow)slow.textContent=playing&&mode==="slow"?"Stopp":"Langsam hören";
    if(repeat)repeat.textContent=playing&&mode==="segment"?"Stopp":"Wort wiederholen";
  }
  function render(){
    ensureRoot();
    var segs=getSegments();
    var ar=document.getElementById("dslArabic");
    var tr=document.getElementById("dslTranslit");
    document.getElementById("dslTitle").textContent=currentDua?currentDua.title:"Duʿāʾ lernen";
    document.getElementById("dslSub").textContent="Hören · verfolgen · Wort für Wort";
    ar.innerHTML=segs.map(function(s,i){
      return '<button type="button" class="dsl-word ar" data-seg="'+i+'" aria-label="'+esc(s.transliteration)+'">'+esc(s.arabic)+'</button>';
    }).join(" ");
    tr.innerHTML=segs.map(function(s,i){
      return '<button type="button" class="dsl-word tr" data-seg="'+i+'">'+esc(s.transliteration)+'</button>';
    }).join(" ");
    paintSelection();
    paintControls();
  }
  function highlightFromTime(track,t){
    var rows=timingSegments();
    var hit=-1;
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      if(Number(r.track)===Number(track)&&t+0.015>=Number(r.start)&&t<=Number(r.end)+0.045){
        hit=i;break;
      }
    }
    if(hit>=0&&hit!==currentIndex){
      currentIndex=hit;
      saveProgress();
      paintSelection();
    }
  }
  function monitor(token){
    if(token!==playToken||!playing||!activeRange)return;
    var t=Number(audio.currentTime)||0;
    highlightFromTime(activeTrack,t);
    if(t>=Number(activeRange.end)-0.018){
      try{audio.pause()}catch(e){}
      queueIndex++;
      if(queueIndex>=queue.length){
        playing=false;
        mode="";
        activeRange=null;
        paintControls();
        setStatus("Fertig. Tippe auf ein Wort, um es einzeln zu wiederholen.","good");
        return;
      }
      startQueueItem(token);
      return;
    }
    raf=requestAnimationFrame(function(){monitor(token)});
  }
  function startQueueItem(token){
    if(token!==playToken||queueIndex>=queue.length)return;
    var range=queue[queueIndex];
    var tracks=(currentTiming&&currentTiming.tracks)||[];
    var track=tracks[Number(range.track)];
    if(!track||!track.url){
      playing=false;mode="";paintControls();setStatus("Exakte Lern-Audio ist noch nicht verfügbar.","bad");return;
    }
    activeRange=range;
    activeTrack=Number(range.track);
    var desired=Number(range.start)||0;
    var rate=Number(range.rate)||1;
    var start=function(){
      if(token!==playToken)return;
      try{
        audio.currentTime=Math.max(0,desired);
        audio.playbackRate=Math.max(.6,Math.min(1.05,rate));
        audio.preservesPitch=true;
        var p=audio.play();
        if(p&&p.catch)p.catch(function(){setStatus("Audio konnte nicht gestartet werden. Tippe noch einmal.","bad")});
        if(raf)cancelAnimationFrame(raf);
        raf=requestAnimationFrame(function(){monitor(token)});
      }catch(e){setStatus("Audio konnte nicht gestartet werden.","bad")}
    };
    if(audio.src!==new URL(track.url,location.origin).href){
      audio.src=track.url;
      audio.currentTime=0;
      audio.onloadedmetadata=start;
      audio.oncanplay=start;
      audio.load();
    }else{
      start();
    }
  }
  function playQueue(ranges,whichMode){
    stopAudio();
    if(!currentTiming||!Array.isArray(ranges)||!ranges.length){
      setStatus("Exakte Wort-Zeitmarken werden noch geladen.","bad");
      return false;
    }
    playToken++;
    var token=playToken;
    queue=ranges.map(function(r){return Object.assign({},r)});
    queueIndex=0;
    playing=true;
    mode=whichMode||"full";
    paintControls();
    setStatus(whichMode==="slow"?"Langsam zuhören und mitlesen …":"Hör zu und verfolge die markierten Wörter …","");
    startQueueItem(token);
    return true;
  }
  function playWhole(rate,whichMode){
    var ranges=(currentTiming&&currentTiming.ranges)||[];
    if(ranges.length){
      return playQueue(ranges.map(function(r){return {track:r.track,start:r.start,end:r.end,rate:rate};}),whichMode);
    }
    // Whole-Duʿāʾ playback must still work even while the exact word map is
    // unavailable. This uses the same already-working source as the normal
    // Duʿāʾ page; only word-following remains locked until exact alignment exists.
    stopAudio();
    if(currentDua&&typeof window.playDuaArabic==="function"){
      playing=true;
      externalPlaying=true;
      mode=whichMode||"full";
      paintControls();
      setStatus(whichMode==="slow"?"Langsam zuhören …":"Duʿāʾ wird abgespielt …","");
      var ok=window.playDuaArabic(currentDua,rate||1,function(){
        playing=false;
        externalPlaying=false;
        mode="";
        paintControls();
        setStatus("Fertig. Wort-für-Wort wird erst mit exakten Zeitmarken freigeschaltet.","good");
      });
      if(ok===false){
        playing=false;
        externalPlaying=false;
        mode="";
        paintControls();
        setStatus("Audio konnte nicht gestartet werden.","bad");
        return false;
      }
      return true;
    }
    setStatus("Audioquelle ist gerade nicht verfügbar.","bad");
    return false;
  }
  function playSegment(i,rate){
    var row=timingSegments()[Number(i)];
    if(!row){setStatus("Für dieses Wort fehlt eine exakte Zeitmarke.","bad");return false}
    selectIndex(i,{scroll:true});
    return playQueue([{track:row.track,start:row.start,end:row.end,rate:rate||1}],"segment");
  }
  function onClick(ev){
    var seg=ev.target.closest&&ev.target.closest("[data-seg]");
    if(seg){
      var i=Number(seg.getAttribute("data-seg"));
      selectIndex(i,{play:true,rate:1});
      return;
    }
    var b=ev.target.closest&&ev.target.closest("[data-dsl]");
    if(!b)return;
    var a=b.getAttribute("data-dsl");
    if(a==="close"){close();return}
    if(a==="full"){
      if(playing&&mode==="full"){stopAudio();setStatus("Wiedergabe gestoppt.","");}
      else playWhole(1,"full");
      return;
    }
    if(a==="slow"){
      if(playing&&mode==="slow"){stopAudio();setStatus("Wiedergabe gestoppt.","");}
      else playWhole(.68,"slow");
      return;
    }
    if(a==="repeat"){
      if(playing&&mode==="segment"){stopAudio();setStatus("Wiedergabe gestoppt.","");}
      else playSegment(currentIndex,.82);
      return;
    }
    if(a==="prev"){selectIndex(currentIndex-1,{play:true,rate:.82});return}
    if(a==="next"){selectIndex(currentIndex+1,{play:true,rate:.82});return}
  }
  function open(dua){
    if(!dua||!Array.isArray(dua.learningSegments)||!dua.learningSegments.length)return;
    ensureRoot();
    stopAudio();
    currentDua=dua;
    currentTiming=null;
    currentIndex=restoreIndex(dua);
    render();
    root.classList.add("open");
    root.setAttribute("aria-hidden","false");
    lockBackground(true);
    setStatus("Exakte Wort-Zeitmarken werden geladen …","");
    loadManifest().then(function(m){
      if(currentDua!==dua)return;
      currentTiming=(m.items||{})[dua.id]||null;
      if(!currentTiming||currentTiming.syncMode!=="elevenlabs-forced-alignment-v1"){
        setStatus("Dieser Eintrag ist noch nicht für exaktes Smart-Lernen freigegeben.","bad");
        return;
      }
      setStatus("Bereit. Tippe auf ein Wort oder starte das ganze Duʿāʾ.","good");
      paintSelection();
    }).catch(function(){
      setStatus("Der exakte Lernmodus ist noch nicht verfügbar. Es wird nichts geschätzt.","bad");
    });
  }
  function close(){
    stopAudio();
    saveProgress();
    if(root){
      root.classList.remove("open");
      root.setAttribute("aria-hidden","true");
    }
    lockBackground(false);
    currentDua=null;
    currentTiming=null;
  }
  function preview(dua,rate){
    return loadManifest().then(function(m){
      var timing=(m.items||{})[dua.id];
      if(!timing)throw new Error("no-exact-timing");
      currentDua=dua;
      currentTiming=timing;
      currentIndex=0;
      return playQueue((timing.ranges||[]).map(function(r){
        return {track:r.track,start:r.start,end:r.end,rate:rate||1};
      }),"preview");
    });
  }

  document.addEventListener("visibilitychange",function(){if(document.hidden)stopAudio()});
  window.DARDuaSmartLearn={
    open:open,
    close:close,
    stop:stopAudio,
    playPreview:preview,
    isReady:function(){return !!manifest}
  };
  loadManifest().catch(function(){});
})();