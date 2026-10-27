/* DĀR AL TAWḤĪD KIDS – exclusive public V4 ID/part player.
 * Public distribution explicitly owner-authorized 2026-10-27.
 * Human Fuṣḥā/Makhāriǧ listening QA is NOT claimed.
 * No synthesis, no key, no speechSynthesis / legacy fallback. */
(function(root){
"use strict";
var VOICE="DkU7j9uO4ZEtLD2iRZSH";
var DIR="/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/";
var PUBLIC="/kids/data/quiz-v4-full-rebuild-public.json";
var PARTS=["question","correct","retry","explanation"];
var manifest=null, loading=null, state="unloaded", audio=null, active=null;
function isObject(o){return !!o&&typeof o==="object"&&!Array.isArray(o)}
function validSource(src){
  return typeof src==="string"&&(src.indexOf("Qurʾān ")===0||src.indexOf("Ṣaḥīḥ ")===0);
}
function validClip(clip,ownerRoute){
  if(!isObject(clip))return false;
  var approved=ownerRoute
    ?clip.humanListeningApproved===false&&clip.approvedForPlayback===false
    :clip.humanListeningApproved===true&&clip.approvedForPlayback===true;
  if(!isObject(clip)||clip.modelId!=="eleven_v4"||clip.voiceId!==VOICE||
     !approved||
     !/^[0-9a-f]{64}$/.test(String(clip.sha256||""))||
     !Number.isFinite(Number(clip.durationSeconds))||Number(clip.durationSeconds)<=0)return false;
  var url=String(clip.url||"");
  if(!url.startsWith(DIR)||url.indexOf("..")!==-1||/[?#]/.test(url))return false;
  if(!/^\/kids\/assets\/kids-quiz-audio\/v4-full-rebuild-20261026\/(?:4-6|7-8|9-10)\/[0-9a-f]{28}\.mp3$/.test(url))return false;
  return true;
}
function validate(data){
  if(!isObject(data)||data.id!=="TAWHID_KIDS_450_V4_NEW_REBUILD_PUBLIC"||
     data.modelId!=="eleven_v4"||data.voiceId!==VOICE||
     data.releaseEnabled!==true||
     !isObject(data.questions)||Object.keys(data.questions).length!==450)return false;
  var ownerRoute=data.ownerReleaseAuthorized===true&&
     data.ownerAuthorizationDate==="2026-10-27"&&
     data.originReviewManifestSha==="05c9557c2f0d564a06c9b5769740c94ebd195526"&&
     data.qaStatus==="OWNER_AUTHORIZED_V4_TECHNICALLY_VERIFIED_FUSHA_LISTENING_UNVERIFIED"&&
     data.humanListeningApproved===false;
  if(data.humanListeningApproved!==true&&!ownerRoute)return false;
  var counts={"4-6":0,"7-8":0,"9-10":0};
  for(var id in data.questions){
    if(!Object.prototype.hasOwnProperty.call(data.questions,id))return false;
    var q=data.questions[id];
    if(!/^kids-quiz-\d{3}$/.test(id)||!isObject(q)||!Object.prototype.hasOwnProperty.call(counts,q.ageBand)||
       !validSource(q.source)||!isObject(q.clips)||Object.keys(q.clips).length!==4)return false;
    for(var i=0;i<PARTS.length;i++){
      var clip=q.clips[PARTS[i]];
      if(!validClip(clip,ownerRoute)||clip.url.indexOf("/"+q.ageBand+"/")<0)return false;
    }
    counts[q.ageBand]++;
  }
  return counts["4-6"]===150&&counts["7-8"]===150&&counts["9-10"]===150;
}
function load(){
  if(manifest)return Promise.resolve(true);
  if(loading)return loading;
  if(typeof root.fetch!=="function"){state="unavailable";return Promise.resolve(false)}
  state="loading";
  loading=root.fetch(PUBLIC,{cache:"no-store",credentials:"same-origin"})
    .then(function(r){if(!r||!r.ok)throw new Error("v4-not-released");return r.json()})
    .then(function(data){
      if(!validate(data))throw new Error("v4-approval-or-integrity-gate");
      manifest=data;state="ready";
      try{
        if(root.document&&data.ownerReleaseAuthorized===true)
          root.document.documentElement.setAttribute("data-kids-quiz-v4-owner-released","unreviewed-fusha");
      }catch(_){}
      try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")
        root.dispatchEvent(new root.CustomEvent("dar-kids-quiz-v4-approved-ready",{detail:{questions:450,segments:1800}}));
      }catch(_){}
      return true;
    }).catch(function(){state="unavailable";return false})
    .then(function(ok){loading=null;return ok});
  return loading;
}
function get(q,part){
  if(!manifest||!q||!PARTS.includes(part))return null;
  var item=manifest.questions[String(q.id||"")];
  if(!item||q.ageBand!==item.ageBand||String(q.source||"")!==String(item.source||""))return null;
  return item.clips[part]||null;
}
function stop(){
  if(!audio)return;
  try{audio.pause();audio.onended=null;audio.onerror=null;audio.removeAttribute("src");audio.load()}catch(_){}
  active=null;
}
function play(q,part,opts){
  opts=opts||{};
  var clip=get(q,part);
  if(!clip||typeof root.Audio!=="function")return false;
  try{
    if(root.DARKidsOwnerVoice&&typeof root.DARKidsOwnerVoice.stop==="function")
      root.DARKidsOwnerVoice.stop();
    stop();
    if(!audio){audio=new root.Audio();audio.preload="auto";audio.setAttribute("playsinline","");}
    var token={id:q.id,part:part};active=token;
    audio.onended=function(){if(active===token){active=null;if(typeof opts.onended==="function")opts.onended()}};
    audio.onerror=function(){
      if(active!==token)return;
      active=null;if(typeof opts.onerror==="function")opts.onerror(new Error("v4-audio-playback-failed"));
    };
    audio.src=clip.url;audio.currentTime=0;audio.playbackRate=1;
    var task=audio.play();
    if(task&&typeof task.catch==="function")task.catch(function(e){
      if(active!==token)return;active=null;
      if(typeof opts.onerror==="function")opts.onerror(e);
    });
    return true;
  }catch(e){
    active=null;if(typeof opts.onerror==="function")opts.onerror(e);
    return false;
  }
}
root.DARKidsQuizV4Approved={
  load:load,play:play,stop:stop,has:function(q,part){return !!get(q,part)},
  state:function(){return state},get:function(q,part){return get(q,part)},
  isReady:function(){return state==="ready"},
  isOwnerAuthorized:function(){return !!(manifest&&manifest.ownerReleaseAuthorized===true)},
  isHumanListeningApproved:function(){return !!(manifest&&manifest.humanListeningApproved===true)},
  version:"v4-id-owner-authorized-20261027"
};
})(window);
