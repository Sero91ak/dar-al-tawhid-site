(() => {
"use strict";

/* DĀR AL TAWḤĪD Kids — reading wake-lock manager v1
   Keeps the display awake only while an actual reading mode is active.
   Pure audio playback deliberately does not acquire a screen wake lock.
*/
const reasons=new Set();
let sentinel=null;
let requesting=false;
let nativeEnabled=false;
let disposed=false;

function postNative(enabled){
  if(nativeEnabled===enabled)return;
  nativeEnabled=enabled;
  try{
    const handler=window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darKidsScreenAwake;
    if(handler&&typeof handler.postMessage==="function"){
      handler.postMessage({enabled:!!enabled,reasons:Array.from(reasons)});
    }
  }catch(_){}
  try{
    if(window.DarNative&&typeof window.DarNative.setScreenAwake==="function"){
      window.DarNative.setScreenAwake(!!enabled);
    }
  }catch(_){}
}

async function requestWake(){
  if(disposed||!reasons.size||document.visibilityState!=="visible")return;
  postNative(true);
  if(sentinel||requesting||!("wakeLock" in navigator)||typeof navigator.wakeLock.request!=="function")return;
  requesting=true;
  try{
    const lock=await navigator.wakeLock.request("screen");
    sentinel=lock;
    lock.addEventListener("release",()=>{
      if(sentinel===lock)sentinel=null;
      if(!disposed&&reasons.size&&document.visibilityState==="visible"){
        setTimeout(requestWake,120);
      }
    },{once:true});
  }catch(_){
    // Native wrapper still keeps the display awake. Browser support may be unavailable.
  }finally{
    requesting=false;
  }
}

function releaseWake(){
  postNative(false);
  const lock=sentinel;
  sentinel=null;
  if(lock){
    try{void lock.release()}catch(_){}
  }
}

function acquire(reason="reading"){
  const key=String(reason||"reading");
  reasons.add(key);
  void requestWake();
}

function release(reason="reading"){
  reasons.delete(String(reason||"reading"));
  if(!reasons.size)releaseWake();
}

function releaseAll(){
  reasons.clear();
  releaseWake();
}

function active(){return reasons.size>0}

document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){
    if(reasons.size)void requestWake();
  }else if(sentinel){
    const lock=sentinel;sentinel=null;
    try{void lock.release()}catch(_){}
  }
});

window.addEventListener("pagehide",()=>{
  disposed=true;
  releaseAll();
},{capture:true});

window.addEventListener("pageshow",()=>{
  disposed=false;
  if(reasons.size)void requestWake();
});

window.addEventListener("dar-kids-reading-start",e=>acquire(e?.detail?.reason||"reading"));
window.addEventListener("dar-kids-reading-stop",e=>release(e?.detail?.reason||"reading"));

window.DARKidsScreenAwake={
  version:1,
  acquire,
  release,
  releaseAll,
  active,
  reasons:()=>Array.from(reasons)
};
})();
