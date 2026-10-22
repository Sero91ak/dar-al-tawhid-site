/* DĀR adult-only OneSignal language sync.
 * Uses explicit app locale, never device/OS language after a user selection.
 * Updates existing OneSignal user only; NEVER calls optIn/requestPermission,
 * subscribes, changes schedules, or touches location.
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
async function pushLocale(){
 const locale=read();
 // A native WKWebView/Android WebView can expose a Web OneSignal object
 // unrelated to the native SDK that owns the real push subscription.
 // Never synchronize the wrong OneSignal user. Native SDK bridge/release
 // must explicitly implement setLanguage on that native subscription.
 if(global.DAR_IOS_ONESIGNAL_ID || global.DAR_ANDROID_ONESIGNAL_ID ||
    global.webkit?.messageHandlers?.darPushSettings || global.DarNative){
   return {synced:false,locale,reason:"native_sdk_locale_bridge_required"};
 }
 const os=global.OneSignal;
 if(!os?.User || typeof os.User.setLanguage!=="function")
   return {synced:false,reason:"sdk_unavailable",locale};
 // Kurdish needs a per-subscription verified delivery path. Meanwhile,
 // force the current OneSignal user away from any stale language (e.g. tr)
 // to the documented, reviewed German fallback rather than sending Turkish
 // after the app language has changed to Soranî.
 const providerLocale=SUPPORTED.has(locale)?locale:"de";
 const fallback=providerLocale!==locale;
 if(providerLocale===lastApplied)return fallback
   ? {synced:false,locale,reason:"individual_delivery_required",fallbackLocale:"de",unchanged:true}
   : {synced:true,locale,unchanged:true};
 if(providerLocale===pendingLocale && pendingPromise)return pendingPromise;
 const rev=++generation;
 pendingLocale=providerLocale;
 const task=(async()=>{
   try{
     await os.User.setLanguage(providerLocale);
     if(rev!==generation)return {synced:false,locale,reason:"language_changed_during_sync"};
     lastApplied=providerLocale;
     return fallback
       ? {synced:false,locale,reason:"individual_delivery_required",fallbackLocale:"de"}
       : {synced:true,locale};
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
