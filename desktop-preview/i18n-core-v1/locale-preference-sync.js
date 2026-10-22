/* DĀR Adult shared locale preference.
 * Safe bridge for Web, Android WebView/PWA and iOS shell integrations.
 * Requires an authenticated transport to sync between devices; never assumes
 * a local PIN is a server identity. No API calls are made without a transport.
 */
(function(global){"use strict";
 const REGISTERED=new Set(["de","ar","en","tr","ku","ckb","bs","fr","es"]);
 // Only preview-ready UIs may be selected by default. New languages require an
 // explicit availability resolver from the calling app after release checks.
 const PREVIEW_READY=new Set(["de","ar","en","tr","ku","ckb","bs"]);
 const KEY="darAdultPreferredLocaleV1",STATE="darAdultLocaleSyncV1";
 const read=(s,k)=>{try{return s.getItem(k)}catch(_){return null}};
 const put=(s,k,v)=>{try{s.setItem(k,v);return true}catch(_){return false}};
 function create(config){
  if(!config||typeof config.onChange!=="function")throw Error("onChange callback required");
  const store=config.storage||global.localStorage;
  const getSession=config.getSession||(()=>null);
  const network=config.transport||null;
  const available=code=>REGISTERED.has(code)&&
   (PREVIEW_READY.has(code)||config.isAvailable?.(code)===true);
  let current=available(read(store,KEY))?read(store,KEY):"de";
  let last={};try{last=JSON.parse(read(store,STATE)||"{}")}catch(_){};
  let pending=last.locale===current&&last.pending===true,busy=false;
  function emit(code,reason){if(!available(code))return false;current=code;put(store,KEY,code);config.onChange(code,reason);return true}
  function state(){return {locale:current,pending,busy,syncAvailable:!!network,authenticated:!!getSession()?.id}}
  async function pull(){
   const session=getSession();if(!network||!session?.id||typeof network.read!=="function")return {state:"local-only",...state()};
   if(busy)return {state:"busy",...state()};
   busy=true;
   try{
    const answer=await network.read(session);
    if(answer&&available(answer.locale)&&!pending)emit(answer.locale,"remote-account");
    else if(!answer?.locale&&typeof network.write==="function"){await network.write(session,{locale:current});pending=false}
    put(store,STATE,JSON.stringify({locale:current,pending}));
    return {state:"synced",...state()};
   }catch(e){return {state:"error",message:String(e?.message||e),...state()}}finally{busy=false}
  }
  async function select(locale){
   if(!emit(locale,"user"))return {state:"invalid",...state()};
   pending=true;put(store,STATE,JSON.stringify({locale:current,pending}));
   const session=getSession();if(!network||!session?.id||typeof network.write!=="function")return {state:"local-only",...state()};
   try{
    await network.write(session,{locale:current});
    pending=false;put(store,STATE,JSON.stringify({locale:current,pending}));
    return {state:"synced",...state()};
   }catch(e){return {state:"queued",message:String(e?.message||e),...state()}}
  }
  async function retry(){
   if(!pending)return pull();
   const session=getSession();if(!network||!session?.id||typeof network.write!=="function")return {state:"local-only",...state()};
   try{await network.write(session,{locale:current});pending=false;put(store,STATE,JSON.stringify({locale:current,pending}));return {state:"synced",...state()}}
   catch(e){return {state:"queued",...state()}}
  }
  // Native/Web account systems provide read(session)/write(session, {locale})
  // and must authorize requests server-side, scoped to their own user.
  return{select,pull,retry,state,locale:()=>current};
 }
 global.DarAdultLocalePreference={
  create,registeredLocales:[...REGISTERED],defaultAvailable:[...PREVIEW_READY],allowed:[...PREVIEW_READY],
  storageKey:KEY
 };
})(window);
