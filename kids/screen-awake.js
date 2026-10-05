(() => {
"use strict";

/* DĀR AL TAWḤĪD Kids — shared reading screen-awake controller v1
   Keeps the display awake only while an explicit reading mode is active.
   Audio-only playback never requests a wake lock.
*/
const reasons=new Set();
let sentinel=null;
let requesting=null;
let retryTimer=0;

function nativeSet(enabled){
  try{
    const handler=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darKidsScreenAwake;
    if(handler&&typeof handler.postMessage==="function"){
      handler.postMessage({enabled:!!enabled,reason:"kids-reading"});
    }
  }catch(_){}
  try{
    if(window.DarNative&&typeof window.DarNative.keepScreenAwake==="function"){
      window.DarNative.keepScreenAwake(!!enabled);
    }
  }catch(_){}
}

function releaseBrowserLock(){
  const current=sentinel;
  sentinel=null;
  if(current&&typeof current.release==="function"){
    try{current.release()}catch(_){}
  }
}

async function requestBrowserLock(){
  if(!reasons.size||document.visibilityState!=="visible")return;
  if(sentinel||requesting)return;
  if(!navigator.wakeLock||typeof navigator.wakeLock.request!=="function")return;
  requesting=navigator.wakeLock.request("screen");
  try{
    const lock=await requesting;
    if(!reasons.size||document.visibilityState!=="visible"){
      try{await lock.release()}catch(_){}
      return;
    }
    sentinel=lock;
    lock.addEventListener("release",()=>{
      if(sentinel===lock)sentinel=null;
      if(reasons.size&&document.visibilityState==="visible"){
        clearTimeout(retryTimer);
        retryTimer=setTimeout(()=>{apply()},180);
      }
    },{once:true});
  }catch(_){
    sentinel=null;
  }finally{
    requesting=null;
  }
}

function apply(){
  const enabled=reasons.size>0;
  document.documentElement.classList.toggle("kids-reading-screen-awake",enabled);
  if(document.visibilityState==="visible"){
    nativeSet(enabled);
    if(enabled)void requestBrowserLock();
    else releaseBrowserLock();
  }else{
    nativeSet(false);
    releaseBrowserLock();
  }
}

function set(enabled,reason="reading"){
  const key=String(reason||"reading");
  if(enabled)reasons.add(key);
  else reasons.delete(key);
  apply();
  return reasons.size>0;
}
function acquire(reason="reading"){return set(true,reason)}
function release(reason="reading"){return set(false,reason)}
function releaseAll(){reasons.clear();apply()}
function active(){return reasons.size>0}

document.addEventListener("visibilitychange",apply,{passive:true});
window.addEventListener("pageshow",apply,{passive:true});
window.addEventListener("pagehide",()=>{nativeSet(false);releaseBrowserLock()},{passive:true});

window.DARKidsScreenAwake={version:1,set,acquire,release,releaseAll,active};
})();