"use strict";
/**
 * STANDALONE, NOT WIRED TO LIVE TRAFFIC.
 * Server-side contract for setting a push subscription's app locale.
 *
 * Required, independently implemented and audited dependencies:
 * - verifyBearer: cryptographically checks a nonpublic device/account proof;
 * - getAuthorizedSubscription: joins verified identity to subscription,
 *   returns ONLY a matching owned subscription with SERVER-held consent;
 * - persistLocale: service-role-only upsert of the private mapping table.
 *
 * A caller-supplied OneSignal subscription ID alone NEVER proves ownership.
 * This module has no Supabase/OneSignal credentials, network calls or sender.
 */
const registryDefault = require("./locales.json");
const {normalizeAppLocale,localeCodes} = require("./push-i18n-resolver.cjs");

function result(status, json) {
  return { status, headers: {
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "x-content-type-options":"nosniff"
  }, body:JSON.stringify(json) };
}
function unchangedLocale(v, registry) {
  const s=String(v||"").trim().toLowerCase().replace(/_/g,"-");
  const codes=localeCodes(registry);
  const normalized=normalizeAppLocale(s,registry);
  // Reject accidental unsupported codes; never quietly persist de instead.
  if (!s || (!codes.includes(s) && !codes.includes(s.split("-")[0]))) {
    return "";
  }
  return normalized;
}
function createLocalePreferenceApi(options={}) {
  const {verifyBearer,getAuthorizedSubscription,persistLocale,
    registry=registryDefault,allowedAppId,environment="test"}=options;
  if (typeof verifyBearer!=="function" ||
      typeof getAuthorizedSubscription!=="function" ||
      typeof persistLocale!=="function" ||
      !String(allowedAppId||"").trim() ||
      !["test","production"].includes(environment)) {
    throw new Error("Trusted verifier, owner lookup, private store and app boundary are REQUIRED");
  }
  return async function handle(request={}) {
    const method=String(request.method||"").toUpperCase();
    if(method!=="POST")return result(405,{ok:false,error:"method_not_allowed"});
    const headers=request.headers||{};
    const type=String(headers["content-type"]||headers["Content-Type"]||"").toLowerCase();
    if(!/^application\/json(?:;|$)/.test(type))return result(415,{ok:false,error:"json_required"});
    const auth=String(headers.authorization||headers.Authorization||"");
    const match=/^Bearer ([A-Za-z0-9._~+/-]{24,4096})$/.exec(auth);
    if(!match)return result(401,{ok:false,error:"unauthenticated"});
    const input=String(request.body||"");
    if(input.length>4096)return result(413,{ok:false,error:"body_too_large"});
    let payload;
    try{payload=JSON.parse(input);}catch{return result(400,{ok:false,error:"invalid_json"});}
    if(!payload||typeof payload!=="object"||Array.isArray(payload))return result(400,{ok:false,error:"invalid_body"});
    const subscriptionId=String(payload.subscriptionId||"").trim();
    const locale=unchangedLocale(payload.appLocale,registry);
    if(!/^[A-Za-z0-9_-]{8,255}$/.test(subscriptionId)||!locale){
      return result(400,{ok:false,error:"invalid_subscription_or_locale"});
    }

    let identity;
    try{
      identity=await verifyBearer({credential:match[1],environment,appId:allowedAppId});
    }catch{return result(401,{ok:false,error:"unauthenticated"});}
    if(!identity||identity.verified!==true||!String(identity.subject||"").trim()){
      return result(401,{ok:false,error:"unauthenticated"});
    }

    let own;
    try{
      own=await getAuthorizedSubscription({
        subject:identity.subject,subscriptionId,
        appId:allowedAppId,environment
      });
    }catch{return result(503,{ok:false,error:"lookup_unavailable"});}
    if(!own || own.ownerVerified!==true ||
       own.subscriptionId!==subscriptionId ||
       own.onesignalAppId!==allowedAppId ||
       own.environment!==environment){
      return result(403,{ok:false,error:"subscription_not_owned"});
    }
    if(own.enabled!==true||own.pushOptedIn!==true){
      return result(412,{ok:false,error:"push_not_opted_in"});
    }

    // Never update consent, notification scopes, prayer timers or other
    // subscriptions from this endpoint. Only the locale.
    try{
      const saved=await persistLocale({
        subject:identity.subject,
        onesignalAppId:allowedAppId,
        subscriptionId,appLocale:locale
      });
      if(!saved||saved.ok!==true||saved.subscriptionId!==subscriptionId||saved.appLocale!==locale){
        return result(503,{ok:false,error:"persistence_unconfirmed"});
      }
    }catch{return result(503,{ok:false,error:"persistence_failed"});}
    return result(200,{ok:true,subscriptionId,appLocale:locale});
  };
}
module.exports={createLocalePreferenceApi,unchangedLocale};
