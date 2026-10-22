"use strict";
/**
 * STAGING-ONLY server-side Supabase locale mapping store.
 * Depends on NON-APPLIED migration push-app-locale-proposed-migration.sql.
 * This module makes no network request at import time.
 * NEVER pass serviceRoleKey, this store, or its responses into web/native app.
 */
const {normalizeAppLocale,localeCodes}=require("./push-i18n-resolver.cjs");
const defaultRegistry=require("./locales.json");
function validateId(v,type){
 const id=String(v||"").trim();
 if(type==="app"&&!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))throw Error("Invalid OneSignal app id");
 if(type==="sub"&&!/^[A-Za-z0-9_-]{8,255}$/.test(id))throw Error("Invalid subscription id");
 return id;
}
function serverStore({supabaseUrl,serviceRoleKey,fetchImpl,registry=defaultRegistry}={}){
 const origin=String(supabaseUrl||"").replace(/\/+$/,"");
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(origin))throw Error("Secure Supabase origin required");
 if(typeof serviceRoleKey!=="string"||serviceRoleKey.length<32)throw Error("Server-only Supabase service role credential required");
 if(typeof fetchImpl!=="function")throw Error("A trusted server fetch implementation is required");
 const endpoint=origin+"/rest/v1/dar_push_subscription_locales";
 function headers(prefer){
  return {
   apikey:serviceRoleKey,Authorization:"Bearer "+serviceRoleKey,
   Accept:"application/json","Content-Type":"application/json",
   ...(prefer?{Prefer:prefer}:{})
  };
 }
 async function readJson(response){
  // Never forward raw provider errors; they may contain user data.
  if(!response||!response.ok)throw Error("Private locale store unavailable");
  let data;
  try{data=await response.json()}catch{throw Error("Invalid private locale store response");}
  if(!Array.isArray(data))throw Error("Expected a list from private locale store");
  return data;
 }
 function allowedLocale(code){
  const text=String(code||"").trim().toLowerCase().replace(/_/g,"-");
  const names=localeCodes(registry);
  if(!names.includes(text)&&!names.includes(text.split("-")[0]))throw Error("Unsupported app locale");
  return normalizeAppLocale(text,registry);
 }
 async function set({onesignalAppId,subscriptionId,appLocale}){
  const app=validateId(onesignalAppId,"app"),sub=validateId(subscriptionId,"sub"),locale=allowedLocale(appLocale);
  const url=endpoint+"?on_conflict=onesignal_app_id,subscription_id";
  const response=await fetchImpl(url,{
   method:"POST",headers:headers("resolution=merge-duplicates,return=representation"),
   body:JSON.stringify([{onesignal_app_id:app,subscription_id:sub,app_locale:locale,
    selection_source:"explicit_app_setting"}])
  });
  const rows=await readJson(response);
  if(rows.length!==1||rows[0].onesignal_app_id!==app||
     rows[0].subscription_id!==sub||rows[0].app_locale!==locale){
    throw Error("Locale store acknowledgement does not match authenticated request");
  }
  return {ok:true,subscriptionId:sub,appLocale:locale};
 }
 async function get({onesignalAppId,subscriptionId}){
  const app=validateId(onesignalAppId,"app"),sub=validateId(subscriptionId,"sub");
  const qs=new URLSearchParams({
   onesignal_app_id:"eq."+app,
   subscription_id:"eq."+sub,
   select:"onesignal_app_id,subscription_id,app_locale,updated_at",
   limit:"1"
  });
  const rows=await readJson(await fetchImpl(endpoint+"?"+qs.toString(),{
   method:"GET",headers:headers()
  }));
  if(rows.length===0)return null;
  if(rows.length!==1||rows[0].onesignal_app_id!==app||rows[0].subscription_id!==sub){
   throw Error("Locale store returned a mismatched subscription");
  }
  return {subscriptionId:sub,appLocale:allowedLocale(rows[0].app_locale),
   updatedAt:rows[0].updated_at||null};
 }
 return Object.freeze({get,set});
}
module.exports={serverStore};
