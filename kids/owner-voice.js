(function(){
  "use strict";

  var manifest={entries:{}};
  var loaded=false;
  var pending=null;
  var player=new Audio();
  player.preload="auto";
  player.setAttribute("playsinline","");
  player.setAttribute("webkit-playsinline","");
  player.setAttribute("disableremoteplayback","");
  player.volume=1;

  function normalize(text){
    return String(text||"").replace(/\s+/g," ").trim();
  }
  function stopNativeSpeech(){
    try{if(window.speechSynthesis)window.speechSynthesis.cancel()}catch(e){}
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
    try{player.pause()}catch(e){}
    player.onended=typeof options.onended==="function"?options.onended:null;
    player.onerror=function(){
      emitMissing(key,options.source||"asset-error");
      if(typeof options.onerror==="function")options.onerror(new Error("owner-voice-playback"));
    };
    player.src=String(entry.url);
    player.currentTime=0;
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
  function play(text,options){
    var key=normalize(text);
    if(!key)return false;
    if(!loaded){
      pending={text:key,options:options||{}};
      stopNativeSpeech();
      return true;
    }
    return playNow(key,options);
  }
  function merge(data){
    if(!data||!data.entries)return;
    Object.keys(data.entries).forEach(function(k){
      manifest.entries[normalize(k)]=data.entries[k];
    });
  }
  function finishLoad(){
    loaded=true;
    var queued=pending;
    pending=null;
    if(queued)playNow(queued.text,queued.options);
    try{
      Object.keys(manifest.entries).slice(0,8).forEach(function(k){
        var url=manifest.entries[k]&&manifest.entries[k].url;
        if(url){var a=new Audio();a.preload="metadata";a.src=url}
      });
    }catch(e){}
  }

  Promise.all([
    fetch("/kids/data/owner-voice-audio.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}),
    fetch("/kids/data/quiz-audio.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})
  ]).then(function(parts){
    merge(parts[1]);
    merge(parts[0]);
    finishLoad();
  }).catch(finishLoad);

  window.DARKidsOwnerVoice={
    play:play,
    stop:stop,
    has:function(text){return !!entryFor(text)},
    isReady:function(){return loaded&&Object.keys(manifest.entries||{}).length>0},
    count:function(){return Object.keys(manifest.entries||{}).length},
    entry:function(text){return entryFor(text)}
  };

  window.quizSpeak=function(text){
    play(text,{source:"quiz-or-kids-ui"});
  };
  window.stopKidsOwnerVoice=stop;
})();