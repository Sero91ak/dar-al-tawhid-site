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
 const os=global.OneSignal;
 if(!os?.User || typeof os.User.setLanguage!=="function")
   return {synced:false,reason:"sdk_unavailable",locale};
 if(!SUPPORTED.has(locale)){
   // OneSignal does not support all Kurdish language keys. Do not silently
   // mark a Kurdish recipient as localized by the built-in provider mapping.
   return {synced:false,reason:"individual_delivery_required",locale};
 }
 if(locale===lastApplied)return {synced:true,locale,unchanged:true};
 if(locale===pendingLocale && pendingPromise)return pendingPromise;
 const rev=++generation;
 pendingLocale=locale;
 const task=(async()=>{
   try{
     await os.User.setLanguage(locale);
     if(rev!==generation)return {synced:false,locale,reason:"language_changed_during_sync"};
     lastApplied=locale;
     return {synced:true,locale};
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
