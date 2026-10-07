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
    if(inQuiz()&&ready){
      // Sobald der Serhat-Quiz-Pack vorhanden ist, benutzt der Quiz-Bereich
      // ausschließlich die Owner-Voice-Master. Fehlende neue Texte bleiben
      // bewusst still, statt auf eine fremde Systemstimme zurückzufallen.
      if(playSerhat(text))return;
      return;
    }
    // Übergangs-Fallback nur solange noch gar kein Serhat-Quiz-Pack erzeugt wurde.
    if(typeof originalQuizSpeak==="function")return originalQuizSpeak(text);
  };

  fetch("/kids/data/quiz-audio.json?v=4",{cache:"no-store"})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(d&&d.entries){
        manifest=d;
        ready=true;
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
