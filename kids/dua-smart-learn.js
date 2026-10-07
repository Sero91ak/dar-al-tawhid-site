(function(){
  "use strict";

  var GERMAN_URL="/kids/data/dua-audio.json?v=8";
  var ARABIC_URL="/kids/data/dua-arabic-audio.json?v=8";
  var SLOW_URL="/kids/data/dua-arabic-slow-audio.json?v=3";
  var WORD_URL="/kids/data/dua-word-audio.json?v=3";
  var STORE_KEY="kids.dua.smart.progress.v2";

  var packs=null;
  var packPromise=null;
  var root=null;
  var audio=new Audio();
  var audioAttached=false;
  var warmers=[];
  var currentDua=null;
  var currentIndex=0;
  var playing=false;
  var mode="";
  var playToken=0;

  audio.preload="auto";
  audio.setAttribute("playsinline","");
  audio.setAttribute("webkit-playsinline","");
  audio.setAttribute("disableremoteplayback","");
  audio.volume=1;
  audio.muted=false;

  function ensureAudioAttached(){
    if(audioAttached&&audio.isConnected)return;
    var attach=function(){
      if(!document.body)return;
      if(!audio.isConnected){
        audio.style.display="none";
        audio.setAttribute("aria-hidden","true");
        document.body.appendChild(audio);
      }
      audioAttached=true;
    };
    if(document.body)attach();
    else document.addEventListener("DOMContentLoaded",attach,{once:true});
  }
  function warmUrl(url){
    if(!url)return;
    try{
      var node=new Audio();
      node.preload="auto";
      node.setAttribute("playsinline","");
      node.setAttribute("webkit-playsinline","");
      node.src=String(url);
      node.load();
      warmers.push(node);
      while(warmers.length>8){
        var stale=warmers.shift();
        try{stale.pause();stale.removeAttribute("src");stale.load()}catch(e){}
      }
    }catch(e){}
  }
  ensureAudioAttached();

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function norm(s){
    var value=String(s||"").replace(/\s+/g," ").trim();
    try{return value.normalize("NFD")}catch(e){return value}
  }
  function manifestEntryIndex(manifest){
    if(!manifest||!manifest.entries)return null;
    if(manifest.__darCanonicalEntries)return manifest.__darCanonicalEntries;
    var index=Object.create(null);
    Object.keys(manifest.entries).forEach(function(key){
      index[norm(key)]=manifest.entries[key];
    });
    try{Object.defineProperty(manifest,"__darCanonicalEntries",{value:index,configurable:true})}
    catch(e){manifest.__darCanonicalEntries=index}
    return index;
  }
  function arabicText(d){return norm(d&&(d.audioArabicText||d.arabic))}
  function fetchJson(url){
    return fetch(url,{cache:"no-store"}).then(function(r){
      if(!r.ok)throw new Error("dua-audio-manifest-"+r.status);
      return r.json();
    });
  }
  function loadPacks(){
    if(packs)return Promise.resolve(packs);
    if(packPromise)return packPromise;
    packPromise=Promise.all([fetchJson(GERMAN_URL),fetchJson(ARABIC_URL),fetchJson(SLOW_URL),fetchJson(WORD_URL)])
      .then(function(rows){
        var german=rows[0]||{},normal=rows[1]||{},slow=rows[2]||{},word=rows[3]||{};
        if(german.modelId!=="eleven_v4"||normal.modelId!=="eleven_v4"||slow.modelId!=="eleven_v4"||word.modelId!=="eleven_v4"){
          throw new Error("dua-audio-not-v4");
        }
        if(german.voiceProfileId!=="serhat-owner-voice-2026"||
           normal.voiceProfileId!=="serhat-owner-voice-2026"||
           slow.voiceProfileId!=="serhat-owner-voice-2026"||
           word.voiceProfileId!=="serhat-owner-voice-2026"){
          throw new Error("dua-audio-not-serhat-master");
        }
        packs={german:german,normal:normal,slow:slow,word:word};
        return packs;
      })
      .catch(function(err){packPromise=null;throw err});
    return packPromise;
  }
  function entry(manifest,text){
    var index=manifestEntryIndex(manifest);
    return index&&index[norm(text)]||null;
  }

  function store(){
    try{return JSON.parse(localStorage.getItem(STORE_KEY)||"{}")||{}}catch(e){return{}}
  }
  function saveProgress(){
    if(!currentDua)return;
    try{
      var all=store();
      all[currentDua.id]={index:currentIndex,updatedAt:Date.now()};
      localStorage.setItem(STORE_KEY,JSON.stringify(all));
    }catch(e){}
  }
  function restoreIndex(dua){
    try{
      var x=Number((store()[dua.id]||{}).index);
      if(Number.isFinite(x))return Math.max(0,Math.min(getSegments(dua).length-1,x));
    }catch(e){}
    return 0;
  }

  function stripArabicPunct(s){
    return norm(s).split(/\s+/).map(function(x){
      return x.replace(/^[،؛؟,.!…«»"'()\[\]{}]+|[،؛؟,.!…«»"'()\[\]{}]+$/g,"");
    }).filter(Boolean);
  }
  function latinParts(s){
    return norm(s).replace(/[،,؛;؟?!…]/g," ").split(/\s+/).filter(Boolean);
  }
  function alignTranslit(full,count){
    var p=latinParts(full);
    if(!count)return[];
    if(p.length<count){
      var expanded=[];
      p.forEach(function(tok){
        var bits=tok.split("-").filter(Boolean);
        if(bits.length>1)bits.forEach(function(b,j){expanded.push((j?"-":"")+b)});
        else expanded.push(tok);
      });
      if(expanded.length>=p.length)p=expanded;
    }
    if(p.length===count)return p;
    var out=[];
    for(var i=0;i<count;i++){
      var a=Math.floor(i*p.length/count);
      var b=Math.floor((i+1)*p.length/count);
      if(b<=a)b=Math.min(p.length,a+1);
      out.push(p.slice(a,b).join(" "));
    }
    return out;
  }
  function getSegments(dua){
    if(!dua)return[];
    var words=stripArabicPunct(dua.audioArabicText||dua.arabic||"");
    var old=Array.isArray(dua.learningSegments)?dua.learningSegments:[];
    var trans=alignTranslit(dua.transliteration||"",words.length);
    return words.map(function(word,i){
      var row=old[i]||{};
      return {
        index:i,
        arabic:word,
        transliteration:norm(row.transliteration||trans[i]||""),
        audioKey:word
      };
    });
  }

  function setStatus(text,kind){
    var el=document.getElementById("dslStatus");
    if(!el)return;
    el.textContent=String(text||"");
    el.classList.toggle("good",kind==="good");
    el.classList.toggle("bad",kind==="bad");
  }
  function paintControls(){
    if(!root)return;
    var full=root.querySelector('[data-dsl="full"]');
    var slow=root.querySelector('[data-dsl="slow"]');
    var repeat=root.querySelector('[data-dsl="repeat"]');
    if(full)full.textContent=playing&&mode==="full"?"Stopp":"Ganz hören";
    if(slow)slow.textContent=playing&&mode==="slow"?"Stopp":"Langsam hören";
    if(repeat)repeat.textContent=playing&&mode==="word"?"Stopp":"Wort wiederholen";
  }
  function paintSelection(){
    if(!root||!currentDua)return;
    var segs=getSegments(currentDua);
    var seg=segs[currentIndex]||{};
    root.querySelectorAll("[data-seg]").forEach(function(n){
      n.classList.toggle("active",Number(n.getAttribute("data-seg"))===currentIndex);
    });
    var ar=document.getElementById("dslFocusAr");
    var tr=document.getElementById("dslFocusTr");
    var count=document.getElementById("dslCount");
    var prog=document.getElementById("dslProgress");
    if(ar)ar.textContent=seg.arabic||"";
    if(tr)tr.textContent=seg.transliteration||"";
    if(count)count.textContent=(currentIndex+1)+" / "+Math.max(1,segs.length);
    if(prog)prog.style.width=(((currentIndex+1)/Math.max(1,segs.length))*100).toFixed(1)+"%";
  }
  function setReady(on){
    if(!root)return;
    root.classList.toggle("exact-ready",!!on);
    root.querySelectorAll("[data-seg]").forEach(function(n){n.disabled=!on});
    ["repeat","prev","next","full","slow"].forEach(function(a){
      var b=root.querySelector('[data-dsl="'+a+'"]');
      if(b)b.disabled=!on;
    });
  }
  function selectIndex(i,opts){
    opts=opts||{};
    var segs=getSegments(currentDua);
    if(!segs.length)return;
    currentIndex=Math.max(0,Math.min(segs.length-1,Number(i)||0));
    saveProgress();
    paintSelection();
    if(opts.play)playWord(currentIndex);
    var node=root&&root.querySelector('[data-seg="'+currentIndex+'"]');
    if(node&&opts.scroll!==false){
      try{node.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"})}catch(e){}
    }
  }

  function stopAudio(){
    playToken++;
    playing=false;
    mode="";
    try{audio.pause()}catch(e){}
    audio.onended=null;
    audio.onerror=null;
    audio.oncanplay=null;
    audio.onloadedmetadata=null;
    paintControls();
    try{if(window.DARKidsOwnerVoice&&typeof window.DARKidsOwnerVoice.stop==="function")window.DARKidsOwnerVoice.stop()}catch(e){}
  }
  function playUrl(url,whichMode,label){
    stopAudio();
    if(!url){setStatus("Audio ist noch nicht verfügbar.","bad");return Promise.reject(new Error("missing-audio"))}
    playToken++;
    var token=playToken;
    playing=true;
    mode=whichMode||"full";
    paintControls();
    setStatus(label||"Hör gut zu …","");
    return new Promise(function(resolve,reject){
      var finish=function(ok){
        if(token!==playToken)return;
        playing=false;mode="";paintControls();
        if(ok){setStatus("Fertig.","good");resolve(true)}
        else{setStatus("Audio konnte nicht gestartet werden.","bad");reject(new Error("audio-playback"))}
      };
      try{
        ensureAudioAttached();
        audio.muted=false;
        audio.volume=1;
        audio.src=String(url);
        audio.currentTime=0;
        audio.playbackRate=1;
        audio.preservesPitch=true;
        audio.onended=function(){finish(true)};
        audio.onerror=function(){finish(false)};
        try{audio.load()}catch(e){}
        var p=audio.play();
        if(p&&p.catch)p.catch(function(){finish(false)});
      }catch(e){finish(false)}
    });
  }
  function playWhole(slow){
    if(!currentDua)return false;
    var run=function(p){
      var text=arabicText(currentDua);
      var e=entry(slow?p.slow:p.normal,text);
      if(!e||!e.url)throw new Error("missing-phrase");
      return playUrl(e.url,slow?"slow":"full",slow?"Langsam und deutlich zuhören …":"Duʿāʾ anhören …");
    };
    if(packs){
      try{return run(packs)}catch(e){setStatus("Diese Aufnahme ist nicht verfügbar.","bad");return false}
    }
    return loadPacks().then(run).catch(function(){
      setStatus("Diese Aufnahme konnte nicht geladen werden.","bad");
      return false;
    });
  }
  function playWord(i){
    var segs=getSegments(currentDua);
    var seg=segs[Number(i)];
    if(!seg)return false;
    selectIndex(i,{scroll:true,play:false});
    var run=function(p){
      var e=entry(p.word,seg.audioKey||seg.arabic);
      if(!e||!e.url)throw new Error("missing-word");
      return playUrl(e.url,"word","Nur dieses Wort: "+(seg.transliteration||seg.arabic));
    };
    if(packs){
      try{return run(packs)}catch(e){setStatus("Die Einzelaufnahme ist nicht verfügbar.","bad");return false}
    }
    return loadPacks().then(run).catch(function(){
      setStatus("Die Einzelaufnahme konnte nicht geladen werden.","bad");
      return false;
    });
  }
  function germanText(d){
    return norm(d&&(d.audioGermanText||((d.childPrompt||"")+" "+(d.meaning||""))));
  }
  function playGerman(dua){
    if(!dua)return false;
    var run=function(p){
      var text=germanText(dua);
      var e=entry(p.german,text);
      if(!e||!e.url)throw new Error("missing-german");
      return playUrl(e.url,"german","Erklärung anhören …");
    };
    if(packs){
      try{return run(packs)}catch(e){return false}
    }
    return loadPacks().then(run).catch(function(){return false});
  }
  function prepare(dua){
    if(!dua)return loadPacks();
    return loadPacks().then(function(p){
      var normal=entry(p.normal,arabicText(dua));
      var slow=entry(p.slow,arabicText(dua));
      var german=entry(p.german,germanText(dua));
      if(normal&&normal.url)warmUrl(normal.url);
      if(slow&&slow.url)warmUrl(slow.url);
      if(german&&german.url)warmUrl(german.url);
      var segs=getSegments(dua);
      for(var i=0;i<Math.min(3,segs.length);i++){
        var w=entry(p.word,segs[i].audioKey||segs[i].arabic);
        if(w&&w.url)warmUrl(w.url);
      }
      return allReady(dua,p);
    });
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
          '<div class="dsl-headcopy"><small>DUʿĀʾ LERNEN</small><strong id="dslTitle">Duʿāʾ lernen</strong><span id="dslSub">Serhat · Fuṣḥā · Wort für Wort</span></div>'+
          '<div class="dsl-count" id="dslCount">1 / 1</div>'+
        '</header>'+
        '<div class="dsl-progress"><i id="dslProgress"></i></div>'+
        '<div class="dsl-scroll">'+
          '<div class="dsl-guide">Tippe ein arabisches Wort oder die Lautschrift an. Du hörst genau dieses Wort als eigene Aufnahme.</div>'+
          '<div class="dsl-arabic" id="dslArabic" dir="rtl" lang="ar"></div>'+
          '<div class="dsl-translit" id="dslTranslit"></div>'+
          '<div class="dsl-focus" id="dslFocus">'+
            '<small>AKTUELLES WORT</small>'+
            '<button type="button" class="dsl-focus-word" data-dsl="repeat">'+
              '<span class="dsl-focus-ar" id="dslFocusAr" dir="rtl" lang="ar"></span>'+
              '<span class="dsl-focus-tr" id="dslFocusTr"></span>'+
            '</button>'+
            '<div class="dsl-focus-hint">Antippen = nur dieses Wort hören</div>'+
          '</div>'+
          '<div class="dsl-controls">'+
            '<button class="dsl-play primary" type="button" data-dsl="full">Ganz hören</button>'+
            '<button class="dsl-play slow" type="button" data-dsl="slow">Langsam hören</button>'+
            '<button class="dsl-play repeat" type="button" data-dsl="repeat">Wort wiederholen</button>'+
          '</div>'+
          '<div class="dsl-speednote">Langsam hören ist eine eigene V4-Aufnahme – keine künstliche Zeitdehnung.</div>'+
          '<div class="dsl-stepnav">'+
            '<button type="button" data-dsl="prev">‹ Vorheriges Wort</button>'+
            '<button type="button" data-dsl="next">Nächstes Wort ›</button>'+
          '</div>'+
          '<div class="dsl-status" id="dslStatus">Audio wird geprüft …</div>'+
        '</div>'+
      '</section>';
    document.body.appendChild(root);
    root.addEventListener("click",onClick);
    return root;
  }
  function render(){
    ensureRoot();
    var segs=getSegments(currentDua);
    document.getElementById("dslTitle").textContent=currentDua?currentDua.title:"Duʿāʾ lernen";
    document.getElementById("dslArabic").innerHTML=segs.map(function(s,i){
      return '<button type="button" class="dsl-word ar" data-seg="'+i+'" aria-label="'+esc(s.transliteration||s.arabic)+'">'+esc(s.arabic)+'</button>';
    }).join(" ");
    document.getElementById("dslTranslit").innerHTML=segs.map(function(s,i){
      return '<button type="button" class="dsl-word tr" data-seg="'+i+'">'+esc(s.transliteration||"•")+'</button>';
    }).join(" ");
    paintSelection();
    paintControls();
  }
  function allReady(dua,p){
    var text=arabicText(dua);
    if(!entry(p.normal,text)||!entry(p.slow,text))return false;
    return getSegments(dua).every(function(s){return !!entry(p.word,s.audioKey||s.arabic)});
  }
  function open(dua){
    if(!dua||!arabicText(dua))return;
    ensureRoot();
    stopAudio();
    currentDua=dua;
    currentIndex=restoreIndex(dua);
    render();
    root.classList.add("open");
    root.setAttribute("aria-hidden","false");
    document.documentElement.classList.add("dua-smart-open");
    document.body.classList.add("dua-smart-open");
    setReady(false);
    setStatus("Serhat-Master-Audios werden geladen …","");
    loadPacks().then(function(p){
      if(currentDua!==dua)return;
      var ok=allReady(dua,p);
      setReady(ok);
      setStatus(ok?"Bereit. Jedes Wort hat eine eigene Fuṣḥā-Aufnahme.":"Einzelne Aufnahmen werden noch vorbereitet.",ok?"good":"");
    }).catch(function(){
      setReady(false);
      setStatus("Die Audio-Pakete konnten noch nicht geladen werden.","bad");
    });
  }
  function close(){
    stopAudio();
    saveProgress();
    if(root){
      root.classList.remove("open");
      root.setAttribute("aria-hidden","true");
    }
    document.documentElement.classList.remove("dua-smart-open");
    document.body.classList.remove("dua-smart-open");
    currentDua=null;
  }
  function onClick(ev){
    var seg=ev.target.closest&&ev.target.closest("[data-seg]");
    if(seg){
      var i=Number(seg.getAttribute("data-seg"));
      playWord(i);
      return;
    }
    var b=ev.target.closest&&ev.target.closest("[data-dsl]");
    if(!b)return;
    var a=b.getAttribute("data-dsl");
    if(a==="close"){close();return}
    if(a==="full"){
      if(playing&&mode==="full"){stopAudio();setStatus("Wiedergabe gestoppt.","")}
      else playWhole(false);
      return;
    }
    if(a==="slow"){
      if(playing&&mode==="slow"){stopAudio();setStatus("Wiedergabe gestoppt.","")}
      else playWhole(true);
      return;
    }
    if(a==="repeat"){
      if(playing&&mode==="word"){stopAudio();setStatus("Wiedergabe gestoppt.","")}
      else playWord(currentIndex);
      return;
    }
    if(a==="prev"){selectIndex(currentIndex-1,{play:true});return}
    if(a==="next"){selectIndex(currentIndex+1,{play:true});return}
  }
  function preview(dua,rate){
    var slow=Number(rate||1)<0.9;
    currentDua=dua;
    var run=function(p){
      var e=entry(slow?p.slow:p.normal,arabicText(dua));
      if(!e||!e.url)throw new Error("missing-preview");
      return playUrl(e.url,slow?"slow":"full",slow?"Langsam zuhören …":"Duʿāʾ anhören …");
    };
    if(packs)return run(packs);
    return loadPacks().then(run);
  }

  document.addEventListener("visibilitychange",function(){if(document.hidden)stopAudio()});
  window.addEventListener("pageshow",function(){
    if(!root||!root.classList.contains("open")){
      document.documentElement.classList.remove("dua-smart-open");
      document.body.classList.remove("dua-smart-open");
    }
  });
  window.DARDuaSmartLearn={
    open:open,
    close:close,
    stop:stopAudio,
    playPreview:preview,
    playGerman:playGerman,
    prepare:prepare,
    isReady:function(){return !!packs}
  };
  loadPacks().catch(function(){});
})();
