/* TAWḤĪD KIDS · Test host ONLY · genuine but human-unapproved 450×4 V4 MP3 preview.
   Never changes a recorded human QA flag or enables public visitor audio release.
   Test-domain-only learning quality audition; public origin remains fail-closed.
*/
(function(root){
"use strict";
var HOST="dar-al-tawhid-test.sero91ak.workers.dev";
if(!root.location||root.location.hostname!==HOST)return;
var VOICE="DkU7j9uO4ZEtLD2iRZSH";
var ROOT="/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/";
var SOURCE="/kids/data/quiz-v4-full-rebuild-review.json";
var PARTS=["question","correct","retry","explanation"];
var manifest=null, pending=null, status="unloaded", player=null,seq=0, lastError="";
function validClip(c,age){
  return c&&c.voiceId===VOICE&&c.modelId==="eleven_v4"
    &&c.humanListeningApproved===false&&c.approvedForPlayback===false
    &&/^[0-9a-f]{64}$/.test(c.sha256||"")
    &&typeof c.url==="string"
    &&new RegExp("^/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/"+
      age+"/[0-9a-f]{28}\\.mp3$").test(c.url)
    &&Number.isFinite(Number(c.durationSeconds))&&Number(c.durationSeconds)>0;
}
function valid(d){
  if(!d||d.releaseEnabled!==false||d.humanListeningApproved!==false
    ||d.modelId!=="eleven_v4"||d.voiceId!==VOICE||!d.questions
    ||Object.keys(d.questions).length!==450)return false;
  var count={"4-6":0,"7-8":0,"9-10":0};
  for(var id of Object.keys(d.questions)){
    var q=d.questions[id];
    if(!/^kids-quiz-\d{3}$/.test(id)||!q||!Object.prototype.hasOwnProperty.call(count,q.ageBand)
        ||!q.clips||Object.keys(q.clips).length!==4||!q.source)return false;
    for(var k of PARTS)if(!validClip(q.clips[k],q.ageBand))return false;
    count[q.ageBand]++;
  }
  return count["4-6"]===150&&count["7-8"]===150&&count["9-10"]===150;
}
function stop(){
  seq++;
  if(player){try{player.pause();player.removeAttribute("src");player.load()}catch(_){}}
}
function clipFor(q,p){
  if(!manifest||!q||!PARTS.includes(p))return null;
  var x=manifest.questions[String(q.id||"")];
  if(!x||x.ageBand!==q.ageBand||String(x.source)!==String(q.source))return null;
  return x.clips[p]||null;
}
function showNotice(){
  var modal=root.document&&root.document.getElementById("quizModal");
  if(!modal)return;
  var note=modal.querySelector("#kidsV4ReviewNotice");
  if(!note){
    note=root.document.createElement("section");
    note.id="kidsV4ReviewNotice";note.setAttribute("role","status");
    note.setAttribute("aria-live","polite");
    note.style.cssText="color:#fff5dd;background:#603f35;border:1px solid #e8ba76;"+
      "border-radius:13px;margin:8px 10px;padding:11px 14px;"+
      "font:700 13px/1.5 system-ui;position:relative;z-index:90";
    var parent=modal.querySelector("#quizStage")||modal;
    parent.insertBefore(note,parent.firstChild);
  }
  // Never render the state as 'ready' before all 450x4 authentic V4
  // manifest entries were validated. The visitor app never runs this file.
  var messages={
    unloaded:"Test-V4 noch nicht geladen. Aufnahmeprüfung starten.",
    loading:"Test-V4 lädt: 450 Fragen, 1.800 Sprachzuordnungen …",
    ready:"TEST · Echte ElevenLabs-V4-Aufnahmen geladen (Frage, Lob, Ermutigung, Erklärung). Hörprüfung Fuṣḥā weiterhin offen.",
    unavailable:"Test-V4 konnte nicht geladen werden ("+String(lastError||"Verbindung")+" ). Keine alte Stimme wird abgespielt."
  };
  var p=note.querySelector("#kidsV4PreviewStatus");
  if(!p){p=root.document.createElement("p");p.id="kidsV4PreviewStatus";p.style.cssText="margin:0 0 8px";note.appendChild(p)}
  p.textContent=(messages[status]||messages.unavailable)+
    (status==="ready"&&lastError?" · "+lastError:"");
  var retry=note.querySelector("#kidsV4PreviewRetry");
  if(!retry){
    retry=root.document.createElement("button");
    retry.id="kidsV4PreviewRetry";retry.type="button";
    retry.style.cssText="min-height:44px;border-radius:10px;padding:9px 15px;border:1px solid #e8ba76;background:#efe0bf;color:#39251d;font-weight:850;touch-action:manipulation";
    retry.addEventListener("click",function(){
      preview.load().then(function(ok){
        if(!ok)return;
        var q=root.kidsQuizPool&&root.kidsQuizPool[0];
        if(q&&root.DARKidsQuizV4Approved.has(q,"question")){
          try{root.dispatchEvent(new root.CustomEvent("dar-kids-quiz-v4-approved-ready",{detail:{preview:true}}))}catch(_){}
        }
      });
    });
    note.appendChild(retry);
  }
  retry.disabled=status==="loading";
  retry.textContent=status==="ready"?"V4-Dateien geladen ✓":"V4 erneut laden";
  retry.hidden=status==="ready";
  var hint=note.querySelector("#kidsV4PreviewInfo");
  if(!hint){
    hint=root.document.createElement("small");hint.id="kidsV4PreviewInfo";
    hint.style.cssText="display:block;margin-top:6px;font-weight:500";
    note.appendChild(hint);
  }
  hint.textContent="Nur Test-App · echte V4-MP3s, Masterstimme Serhat · keine Systemstimme. Nicht als endgültig hörgeprüft freigegeben.";
  var sample=note.querySelector("#kidsV4PreviewSample");
  if(!sample){
    sample=root.document.createElement("button");
    sample.id="kidsV4PreviewSample";sample.type="button";
    sample.style.cssText="min-height:44px;margin:0 10px 4px 0;border-radius:10px;padding:9px 15px;border:1px solid #e8ba76;background:#2c6052;color:#fff9e7;font-weight:850;touch-action:manipulation";
    sample.textContent="▶ Echte V4-Frage 1 hören";
    sample.addEventListener("click",function(){
      var first=manifest&&manifest.questions&&manifest.questions["kids-quiz-001"];
      if(!first){lastError="V4-Daten noch nicht geladen";showNotice();return}
      preview.play({id:"kids-quiz-001",ageBand:first.ageBand,source:first.source},"question",{
        onerror:function(){lastError="Ton nicht gestartet. Bitte Audio-/Stumm-Einstellungen prüfen.";showNotice()}
      });
    });
    note.appendChild(sample);
  }
  sample.hidden=status!=="ready";
  // KIDS_V4_LISTENING_DEVICE_STATUS_V1465: show real started/ended/error state.\n  // Test-only, user-initiated listening controls: make EVERY V4 segment
  // independently audible on iPad Safari, even if autoplay is denied.
  var four=note.querySelector("#kidsV4FourParts");
  if(!four){
    four=root.document.createElement("div");four.id="kidsV4FourParts";
    four.style.cssText="display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:100%;margin-top:8px";
    var label=root.document.createElement("label");
    label.textContent="Altersgruppe ";
    label.style.cssText="color:#fff5dd;font-weight:700;font-size:13px";
    var select=root.document.createElement("select");
    select.id="kidsV4AgeSelect";
    select.style.cssText="min-height:44px;padding:7px;border-radius:10px;background:#203c47;color:#fff";
    ["4-6","7-8","9-10"].forEach(function(b){
      var option=root.document.createElement("option");
      option.value=b;option.textContent=b+" Jahre";select.appendChild(option);
    });
    label.appendChild(select);four.appendChild(label);
    [{part:"question",label:"Frage"},{part:"correct",label:"Lob"},
     {part:"retry",label:"Ermutigung"},{part:"explanation",label:"Erklärung"}].forEach(function(item){
      var button=root.document.createElement("button");
      button.type="button";
      button.textContent="▶ "+item.label+" hören";
      button.style.cssText="min-height:44px;padding:8px 12px;border:1px solid #e8ba76;"+
        "border-radius:10px;background:#174551;color:#fff8e8;font:800 12px/1.3 system-ui;touch-action:manipulation";
      button.addEventListener("click",function(){
        var result=four.querySelector("#kidsV4FourPartStatus");
        if(!manifest){if(result)result.textContent="V4-Manifest nicht geladen.";return}
        var band=select.value||"4-6";
        var id=Object.keys(manifest.questions).find(function(candidate){
          return manifest.questions[candidate].ageBand===band;
        });
        if(!id){lastError="Altersgruppe nicht gefunden";if(result)result.textContent=lastError;showNotice();return}
        var q=manifest.questions[id];
        if(result)result.textContent="V4 · "+band+" · "+item.label+" wird abgespielt …";
        var started=preview.play({id:id,ageBand:q.ageBand,source:q.source},item.part,{
          onended:function(){
            if(result)result.textContent="V4 · "+band+" · "+item.label+" vollständig abgespielt.";
          },
          onerror:function(error){
            lastError="Ton nicht gestartet: "+item.label+".";
            if(result)result.textContent="V4 "+band+" · "+item.label+
              " konnte nicht abgespielt werden: "+String(error&&error.message||"Audiofehler");
            showNotice();
          }
        });
        if(!started&&result)result.textContent="V4 "+band+" · "+item.label+
          ": kein Ton gestartet. Bitte den Audiofehler oben prüfen.";
      });
      four.appendChild(button);
    });
    var playState=root.document.createElement("p");
    playState.id="kidsV4FourPartStatus";playState.setAttribute("role","status");
    playState.setAttribute("aria-live","polite");
    playState.style.cssText="flex:1 1 100%;margin:4px 0 0;color:#fff9e9;"+
      "font:650 12px/1.5 system-ui";
    playState.textContent="Altersgruppe wählen und genau eine V4-Aufnahme antippen.";
    four.appendChild(playState);
    note.appendChild(four);
  }
  four.hidden=status!=="ready";
}
var preview={
  isTestPreview:true,version:"review-450x4-test-host-20261026",
  load:function(){
    if(manifest)return Promise.resolve(true);
    if(pending)return pending;
    status="loading";lastError="";showNotice();
    pending=root.fetch(SOURCE,{cache:"no-store",credentials:"same-origin"})
      .then(function(r){
        if(!r||!r.ok)throw new Error("HTTP "+(r&&r.status||"Netzwerk")+" · V4-Manifest");
        return r.json();
      })
      .then(function(d){
        if(!valid(d))throw new Error("Invalid human-unapproved V4 review-only audio set");
        manifest=d;status="ready";lastError="";showNotice();
        try{root.dispatchEvent(new root.CustomEvent("dar-kids-quiz-v4-approved-ready",
          {detail:{preview:true,questions:450,segments:1800,humanListeningApproved:false}}))}
        catch(_){}
        try{root.dispatchEvent(new root.CustomEvent("dar-kids-owner-voice-ready",{detail:{preview:true}}))}catch(_){}
        return true;
      }).catch(function(e){
        lastError=String(e&&e.message||e||"unbekannt").slice(0,160);
        status="unavailable";showNotice();
        try{root.dispatchEvent(new root.CustomEvent("dar-kids-quiz-v4-preview-error",{detail:{reason:lastError}}))}catch(_){}
        return false;
      })
      .then(function(ok){pending=null;return ok});
    return pending;
  },
  state:function(){return status},
  isReady:function(){return status==="ready"},
  get:clipFor,has:function(q,p){return !!clipFor(q,p)},
  stop:stop,
  play:function(q,p,opts){
    var clip=clipFor(q,p);
    if(!clip||!root.Audio){
      lastError=!clip?"V4-"+String(p||"Clip")+" für Frage "+String(q&&q.id||"?")+" nicht geladen":"Audioplayer im Gerät nicht verfügbar";
      showNotice();return false;
    }
    opts=opts||{};
    try{
      stop();
      if(root.DARKidsOwnerVoice&&root.DARKidsOwnerVoice.stop)root.DARKidsOwnerVoice.stop();
      if(!player){player=new root.Audio();player.preload="auto";}
      var current=seq;player.onended=function(){if(current===seq&&typeof opts.onended==="function")opts.onended()};
      player.onerror=function(){
        if(current!==seq)return;
        lastError="Audio-Datei nicht erreichbar: "+String(q&&q.id||"")+" / "+String(p);
        showNotice();
        if(typeof opts.onerror==="function")opts.onerror(new Error("Test MP3 missing"));
      };
      player.src=clip.url;player.playbackRate=1;player.currentTime=0;
      var task=player.play();
      if(task&&task.catch)task.catch(function(e){
        if(current!==seq)return;
        lastError="Audiowiedergabe blockiert: bitte Hörknopf antippen";
        showNotice();
        if(typeof opts.onerror==="function")opts.onerror(e);
      });
      return true;
    }catch(e){if(typeof opts.onerror==="function")opts.onerror(e);return false}
  }
};
root.DARKidsQuizV4Approved=preview;
preview.load();
if(root.document)root.document.addEventListener("DOMContentLoaded",showNotice,{once:true});
})(window);
