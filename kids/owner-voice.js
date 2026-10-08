(function(){
  "use strict";

  var manifest={entries:{}};
  var entryPriority={};
  var loaded=false;
  var pending=null;
  var player=new Audio();
  var playerAttached=false;
  var preloadCache=new Map();
  var preloadOrder=[];
  var MAX_PRELOAD=18;
  player.preload="auto";
  player.setAttribute("playsinline","");
  player.setAttribute("webkit-playsinline","");
  player.setAttribute("disableremoteplayback","");
  player.volume=1;
  player.muted=false;

  function ensurePlayerAttached(){
    if(playerAttached&&player.isConnected)return;
    var attach=function(){
      if(!document.body)return;
      if(!player.isConnected){
        player.style.display="none";
        player.setAttribute("aria-hidden","true");
        document.body.appendChild(player);
      }
      playerAttached=true;
    };
    if(document.body)attach();
    else document.addEventListener("DOMContentLoaded",attach,{once:true});
  }
  ensurePlayerAttached();

  function normalize(text){
    return String(text||"").normalize("NFC").replace(/\s+/g," ").trim();
  }
  function stopNativeSpeech(){
    try{if(window.speechSynthesis)window.speechSynthesis.cancel()}catch(e){}
  }
  function preload(text){
    var entry=entryFor(text);
    var url=String(entry&&entry.url||"");
    if(!url)return false;
    if(preloadCache.has(url))return true;
    try{
      var audio=new Audio();
      audio.preload="auto";
      audio.setAttribute("playsinline","");
      audio.src=url;
      audio.load();
      preloadCache.set(url,audio);
      preloadOrder.push(url);
      while(preloadOrder.length>MAX_PRELOAD){
        var old=preloadOrder.shift();
        var node=preloadCache.get(old);
        preloadCache.delete(old);
        try{if(node){node.pause();node.removeAttribute("src");node.load()}}catch(e){}
      }
      return true;
    }catch(e){return false}
  }
  function entryFor(text){
    return (manifest.entries||{})[normalize(text)]||null;
  }
  function emitMissing(text,source){
    try{
      window.dispatchEvent(new CustomEvent("dar-kids-owner-voice-missing",{detail:{
        text:normalize(text),source:String(source||"kids"),at:Date.now()
      }}));
    }catch(e){}
  }
  function stop(){
    pending=null;
    stopNativeSpeech();
    try{player.pause();player.removeAttribute("src");player.load()}catch(e){}
  }
  function playNow(text,options){
    options=options||{};
    var key=normalize(text);
    var entry=entryFor(key);
    if(!entry||!entry.url){
      emitMissing(key,options.source);
      if(typeof options.onerror==="function")options.onerror(new Error("owner-voice-missing"));
      return false;
    }
    stopNativeSpeech();
    ensurePlayerAttached();
    try{player.pause()}catch(e){}
    player.muted=false;
    player.volume=1;
    player.onended=typeof options.onended==="function"?options.onended:null;
    player.onerror=function(){
      emitMissing(key,options.source||"asset-error");
      if(typeof options.onerror==="function")options.onerror(new Error("owner-voice-playback"));
    };
    player.src=String(entry.url);
    player.currentTime=0;
    try{player.load()}catch(e){}
    var rate=Number(options.rate||1);
    if(!Number.isFinite(rate))rate=1;
    player.playbackRate=Math.max(.68,Math.min(1.12,rate));
    var p;
    try{p=player.play()}catch(e){
      if(typeof options.onerror==="function")options.onerror(e);
      return false;
    }
    if(p&&typeof p.catch==="function")p.catch(function(err){
      if(typeof options.onerror==="function")options.onerror(err);
    });
    return true;
  }
  function flushPendingIfReady(){
    if(!pending)return;
    var queued=pending;
    if(!entryFor(queued.text))return;
    pending=null;
    playNow(queued.text,queued.options);
  }
  function play(text,options){
    var key=normalize(text);
    if(!key)return false;

    // Spezialisierte Quiz-/Duʿāʾ-Manifeste dürfen sofort spielen, sobald
    // ihr kleiner JSON-Pack geladen ist. Nicht mehr auf das große allgemeine
    // Owner-Voice-Manifest warten.
    if(entryFor(key))return playNow(key,options);

    if(!loaded){
      pending={text:key,options:options||{}};
      stopNativeSpeech();
      return true;
    }
    emitMissing(key,(options||{}).source);
    if(options&&typeof options.onerror==="function")options.onerror(new Error("owner-voice-missing"));
    return false;
  }
  function merge(data,priority){
    if(!data||!data.entries)return;
    Object.keys(data.entries).forEach(function(k){
      var key=normalize(k);
      if(!key)return;
      var current=Number(entryPriority[key]||0);
      if(current>Number(priority||0))return;
      manifest.entries[key]=data.entries[k];
      entryPriority[key]=Number(priority||0);
    });
    flushPendingIfReady();
  }
  function loadManifest(url,priority,validator){
    return fetch(url,{cache:"no-store"})
      .then(function(r){return r.ok?r.json():null})
      .then(function(data){
        if(data&&typeof validator==="function"&&!validator(data))return null;
        merge(data,priority);
        return data;
      })
      .catch(function(){return null});
  }
  function isSerhatV4DuaArabic(data){
    return !!(data&&
      data.modelId==="eleven_v4"&&
      data.voiceProfileId==="serhat-owner-voice-2026"&&
      /Serhat Abu Malik/i.test(String(data.speaker||"")));
  }
  function finishLoad(){
    loaded=true;
    try{
      window.dispatchEvent(new CustomEvent("dar-kids-owner-voice-ready",{detail:{count:Object.keys(manifest.entries||{}).length}}));
    }catch(e){}
    if(pending){
      var queued=pending;
      pending=null;
      if(!playNow(queued.text,queued.options))emitMissing(queued.text,(queued.options||{}).source);
    }
  }

  // Priorität ist absichtlich unabhängig von Netzwerk-Reihenfolge:
  // allgemeiner Pack < Quiz < Duʿāʾ. So überschreibt nie wieder ein alter
  // generischer Clip einen frisch gerenderten Bereichs-Clip.
  Promise.allSettled([
    loadManifest("/kids/data/owner-voice-audio.json?v=2",1),
    loadManifest("/kids/data/quiz-audio.json?v=2",2),
    loadManifest("/kids/data/dua-audio.json?v=8",3),
    loadManifest("/kids/data/dua-arabic-audio.json?v=8",4,isSerhatV4DuaArabic)
  ]).then(finishLoad).catch(finishLoad);

  window.DARKidsOwnerVoice={
    play:play,
    stop:stop,
    preload:preload,
    has:function(text){return !!entryFor(text)},
    isReady:function(){return loaded&&Object.keys(manifest.entries||{}).length>0},
    count:function(){return Object.keys(manifest.entries||{}).length},
    entry:function(text){return entryFor(text)}
  };

  window.quizSpeak=function(text,options){
    options=options||{};
    return play(text,{source:String(options.source||"quiz-or-kids-ui"),onended:options.onended,onerror:options.onerror});
  };
  window.stopKidsOwnerVoice=stop;
})();
