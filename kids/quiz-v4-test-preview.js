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
var manifest=null, pending=null, status="unloaded", player=null,seq=0;
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
  if(modal.querySelector("#kidsV4ReviewNotice"))return;
  var note=root.document.createElement("div");note.id="kidsV4ReviewNotice";note.setAttribute("role","status");
  note.style.cssText="color:#fff5dd;background:#693f26;border:1px solid #e8ba76;"+
    "border-radius:13px;margin:8px 10px;padding:11px 14px;font:700 13px/1.5 system-ui;"+
    "position:relative;z-index:90";
  note.textContent="TEST-VORSCHAU · 450 Quizfragen / 1.800 echte ElevenLabs-V4-Tonzuordnungen. "+
    "Arabische Aussprache, Atmung und kindgerechte Wirkung noch nicht menschlich hörgeprüft. "+
    "Nicht zur endgültigen Kinderfreigabe.";
  var parent=modal.querySelector("#quizStage")||modal;
  parent.insertBefore(note,parent.firstChild);
}
var preview={
  isTestPreview:true,version:"review-450x4-test-host-20261026",
  load:function(){
    if(manifest)return Promise.resolve(true);
    if(pending)return pending;
    status="loading";
    pending=root.fetch(SOURCE,{cache:"no-store",credentials:"same-origin"})
      .then(function(r){if(!r.ok)throw new Error("No review manifest");return r.json()})
      .then(function(d){
        if(!valid(d))throw new Error("Invalid human-unapproved V4 review-only audio set");
        manifest=d;status="ready";showNotice();
        try{root.dispatchEvent(new root.CustomEvent("dar-kids-quiz-v4-approved-ready",
          {detail:{preview:true,questions:450,segments:1800,humanListeningApproved:false}}))}
        catch(_){}
        try{root.dispatchEvent(new root.CustomEvent("dar-kids-owner-voice-ready",{detail:{preview:true}}))}catch(_){}
        return true;
      }).catch(function(e){status="unavailable";showNotice();return false})
      .then(function(ok){pending=null;return ok});
    return pending;
  },
  state:function(){return status},
  isReady:function(){return status==="ready"},
  get:clipFor,has:function(q,p){return !!clipFor(q,p)},
  stop:stop,
  play:function(q,p,opts){
    var clip=clipFor(q,p);if(!clip||!root.Audio)return false;
    opts=opts||{};
    try{
      stop();
      if(root.DARKidsOwnerVoice&&root.DARKidsOwnerVoice.stop)root.DARKidsOwnerVoice.stop();
      if(!player){player=new root.Audio();player.preload="auto";}
      var current=seq;player.onended=function(){if(current===seq&&typeof opts.onended==="function")opts.onended()};
      player.onerror=function(){if(current===seq&&typeof opts.onerror==="function")opts.onerror(new Error("Test MP3 missing"))};
      player.src=clip.url;player.playbackRate=1;player.currentTime=0;
      var task=player.play();
      if(task&&task.catch)task.catch(function(e){if(current===seq&&typeof opts.onerror==="function")opts.onerror(e)});
      return true;
    }catch(e){if(typeof opts.onerror==="function")opts.onerror(e);return false}
  }
};
root.DARKidsQuizV4Approved=preview;
preview.load();
if(root.document)root.document.addEventListener("DOMContentLoaded",showNotice,{once:true});
})(window);
