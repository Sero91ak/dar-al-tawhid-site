/* DĀR adult-only OneSignal language sync.
 * Uses explicit app locale, never device/OS language after a user selection.
 * Updates existing OneSignal user only; NEVER calls optIn/requestPermission,
 * subscribes, changes schedules, or touches location.
 * Publish marker 2026-11-26 t32u: Kurmanci/Sorani copy is in the worker.
 * This line only publishes the visitor worker; it does not opt in or send.
 */
(function(global){
"use strict";
if(global.DARPushLocaleSync)return;
const KEY="darAdultPreferredLocaleV1";
const SUPPORTED=new Set(["de","en","tr","ar","bs","fr","es"]);
const ALL=new Set(["de","ar","en","tr","ku","ckb","bs","fr","es"]);
let generation=0,lastApplied="",pendingLocale="",pendingPromise=null;
function read(){
 let value="";
 try{value=String(global.localStorage?.getItem(KEY)||"").toLowerCase()}catch(_){}
 return ALL.has(value)?value:"de";
}
function postNative(locale){
 try{
  const payload={dar_app_locale:locale,localeOnly:true};
  if(global.webkit?.messageHandlers?.darPushSettings){
   global.webkit.messageHandlers.darPushSettings.postMessage(payload);
  }
 }catch(_){}
 try{
  if(global.DarNative&&typeof global.DarNative.setAppLocale==="function"){
   global.DarNative.setAppLocale(locale);
  }
 }catch(_){}
}
async function pushLocale(){
 const locale=read();
 const providerLocale=SUPPORTED.has(locale)?locale:"de";
 postNative(locale);
 const native=!!(global.DAR_IOS_ONESIGNAL_ID || global.DAR_ANDROID_ONESIGNAL_ID ||
    global.webkit?.messageHandlers?.darPushSettings || global.DarNative);
 if(native){
   return {synced:true,locale,providerLocale,tag:"dar_app_locale",reason:providerLocale===locale?"native_set_language":"native_fallback_de"};
 }
 const os=global.OneSignal;
 if(!os?.User || typeof os.User.setLanguage!=="function")
   return {synced:false,reason:"sdk_unavailable",locale};
 const fallback=providerLocale!==locale;
 if(providerLocale===lastApplied)return fallback
   ? {synced:true,locale,reason:"individual_delivery_required",fallbackLocale:"de",unchanged:true,tag:"dar_app_locale"}
   : {synced:true,locale,unchanged:true,tag:"dar_app_locale"};
 if(providerLocale===pendingLocale && pendingPromise)return pendingPromise;
 const rev=++generation;
 pendingLocale=providerLocale;
 const task=(async()=>{
   try{
     await os.User.setLanguage(providerLocale);
     if(typeof os.User.addTag==="function")await os.User.addTag("dar_app_locale",locale);
     else if(typeof os.User.addTags==="function")await os.User.addTags({dar_app_locale:locale});
     if(rev!==generation)return {synced:false,locale,reason:"language_changed_during_sync"};
     lastApplied=providerLocale;
     return fallback
       ? {synced:true,locale,reason:"fallback_de",fallbackLocale:"de",tag:"dar_app_locale"}
       : {synced:true,locale,tag:"dar_app_locale"};
   }catch(_){
     return {synced:false,locale,reason:"onesignal_language_update_failed"};
   }
 })();
 pendingPromise=task;
 try{return await task}
 finally{
   if(pendingPromise===task){pendingPromise=null;pendingLocale="";}
 }
}

function boot(){
 pushLocale();
 if(Array.isArray(global.OneSignalDeferred)){
   global.OneSignalDeferred.push(function(){void pushLocale()});
 }
}
global.addEventListener("dar-adult-locale-changed",()=>{void pushLocale()});
global.addEventListener("storage",(event)=>{if(event.key===KEY)void pushLocale()});
global.addEventListener("focus",()=>{void pushLocale()});
global.DARPushLocaleSync=Object.freeze({read,pushLocale,supported:()=>[...SUPPORTED]});
if(global.document?.readyState==="loading")global.document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})(window);
