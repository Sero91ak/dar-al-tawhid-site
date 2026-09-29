(function(){
  "use strict";

  var manifest={entries:{}};
  var ready=false;
  var player=new Audio();
  player.preload="auto";
  player.setAttribute("playsinline","");
  player.setAttribute("webkit-playsinline","");
  player.setAttribute("disableremoteplayback","");
  player.volume=1;

  function inQuiz(){
    var modal=document.getElementById("quizModal");
    return !!(modal&&modal.classList.contains("open"));
  }
  function stopNativeSpeech(){
    try{
      if(window.speechSynthesis)window.speechSynthesis.cancel();
    }catch(e){}
  }
  function entryFor(text){
    var key=String(text||"").replace(/\s+/g," ").trim();
    return manifest&&manifest.entries?manifest.entries[key]||null:null;
  }
  function playSerhat(text){
    var entry=entryFor(text);
    if(!entry||!entry.url)return false;
    stopNativeSpeech();
    try{player.pause()}catch(e){}
    player.src=String(entry.url);
    player.currentTime=0;
    var p;
    try{p=player.play()}catch(e){return false}
    if(p&&typeof p.catch==="function")p.catch(function(){});
    return true;
  }

  var originalQuizSpeak=window.quizSpeak;
  window.quizSpeak=function(text){
    if(inQuiz()){
      // Im Quiz niemals System-TTS benutzen. Entweder Serhat-Master oder still bleiben.
      if(playSerhat(text))return;
      return;
    }
    if(typeof originalQuizSpeak==="function")return originalQuizSpeak(text);
  };

  fetch("/kids/data/quiz-audio.json?v="+Date.now(),{cache:"no-store"})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(d&&d.entries){
        manifest=d;
        ready=true;
        try{
          var urls=Object.keys(d.entries).slice(0,6).map(function(k){return d.entries[k]&&d.entries[k].url}).filter(Boolean);
          urls.forEach(function(url){var a=new Audio();a.preload="metadata";a.src=url});
        }catch(e){}
      }
    })
    .catch(function(){ready=false});

  window.DARKidsQuizVoice={
    play:playSerhat,
    stop:function(){try{player.pause()}catch(e){}},
    isReady:function(){return ready&&Object.keys(manifest.entries||{}).length>0},
    count:function(){return Object.keys(manifest.entries||{}).length}
  };
})();
