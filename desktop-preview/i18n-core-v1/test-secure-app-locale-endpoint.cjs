#!/usr/bin/env node
"use strict";
/* Pure local request/response tests. No Supabase/OneSignal access. */
const assert=require("node:assert/strict");
const test=require("node:test");
const {createLocalePreferenceApi}=require("./secure-app-locale-endpoint.cjs");
const registry=require("./locales.json");
const APP_ID="786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const SUB="00000000-1111-4222-8333-abcdef012345";
const TOKEN="test-only-mock-token-abcdefghijklmnopqrstuvwxyz";
const input=(appLocale,subscriptionId=SUB)=>({method:"POST",headers:{
 authorization:"Bearer "+TOKEN,"content-type":"application/json"
},body:JSON.stringify({subscriptionId,appLocale})});
function setup(overrides={}){
 const state={calls:[],changes:[]};
 const dependencies={
  registry,allowedAppId:APP_ID,environment:"test",
  verifyBearer:async()=>({verified:true,subject:"mock-account-1"}),
  getAuthorizedSubscription:async ({subscriptionId,appId,environment,subject})=>{
   state.calls.push({subscriptionId,appId,environment,subject});
   return {ownerVerified:true,subject:"mock-account-1",subscriptionId,onesignalAppId:appId,
    environment,enabled:true,pushOptedIn:true};
  },
  persistLocale:async (row)=>{
   state.changes.push(row);
   return {ok:true,subscriptionId:row.subscriptionId,appLocale:row.appLocale};
  },
  ...overrides
 };
 return {handle:createLocalePreferenceApi(dependencies),state};
}
test("cannot construct endpoint without trusted identity, ownership, and store",()=>{
 assert.throws(()=>createLocalePreferenceApi({}),/REQUIRED/);
});
test("French locale is persisted only for proven opted-in TEST subscription",async()=>{
 const x=setup();const response=await x.handle(input("fr-FR"));
 assert.equal(response.status,200);
 assert.deepEqual(JSON.parse(response.body),{ok:true,subscriptionId:SUB,appLocale:"fr"});
 assert.equal(x.state.calls[0].environment,"test");
 assert.equal(x.state.changes[0].appLocale,"fr");
 assert.equal(x.state.changes[0].onesignalAppId,APP_ID);
});
test("reject missing token, invalid locale, other methods, invalid json",async()=>{
 const x=setup();
 const missing=input("fr");delete missing.headers.authorization;
 assert.equal((await x.handle(missing)).status,401);
 assert.equal((await x.handle(input("unknown-lang"))).status,400);
 assert.equal((await x.handle({...input("fr"),method:"GET"})).status,405);
 assert.equal((await x.handle({...input("fr"),body:"{"})).status,400);
 assert.equal(x.state.changes.length,0);
});
test("failed verification, forged subject and wrong app cannot write",async()=>{
 const badAuth=setup({verifyBearer:async()=>({verified:false,subject:"mock"})});
 assert.equal((await badAuth.handle(input("es"))).status,401);
 const wrongSub=setup({getAuthorizedSubscription:async()=>({ownerVerified:true,subject:"mock-account-1",
  subscriptionId:"another-device",onesignalAppId:APP_ID,
  environment:"test",enabled:true,pushOptedIn:true})});
 assert.equal((await wrongSub.handle(input("fr"))).status,403);
 const wrongApp=setup({getAuthorizedSubscription:async()=>({ownerVerified:true,subject:"mock-account-1",
  subscriptionId:SUB,onesignalAppId:"wrong",environment:"test",
  enabled:true,pushOptedIn:true})});
 assert.equal((await wrongApp.handle(input("fr"))).status,403);
 assert.equal(wrongApp.state.changes.length,0);
});
test("owner lookup cannot authorize a different authenticated subject",async()=>{
 const attack=setup({getAuthorizedSubscription:async()=>({
  ownerVerified:true,subject:"not-the-verified-account",subscriptionId:SUB,
  onesignalAppId:APP_ID,environment:"test",enabled:true,pushOptedIn:true
 })});
 assert.equal((await attack.handle(input("fr"))).status,403);
 assert.equal(attack.state.changes.length,0);
});
test("disabled or unsubscribed device cannot change a push preference",async()=>{
 for(const disallowed of [{enabled:false,pushOptedIn:true},{enabled:true,pushOptedIn:false}]){
  const x=setup({getAuthorizedSubscription:async()=>{
   return {ownerVerified:true,subject:"mock-account-1",subscriptionId:SUB,onesignalAppId:APP_ID,
    environment:"test",...disallowed};
  }});
  assert.equal((await x.handle(input("fr"))).status,412);
  assert.equal(x.state.changes.length,0);
 }
});
test("a different environment or unconfirmed database update never returns success",async()=>{
 const wrongEnv=setup({getAuthorizedSubscription:async()=>({
  ownerVerified:true,subject:"mock-account-1",subscriptionId:SUB,onesignalAppId:APP_ID,
  environment:"production",enabled:true,pushOptedIn:true
 })});
 assert.equal((await wrongEnv.handle(input("fr"))).status,403);
 const noAck=setup({persistLocale:async()=>({ok:false})});
 assert.equal((await noAck.handle(input("ar"))).status,503);
});
test("all nine actual locales accepted and language 10 follows registry",async()=>{
 const x=setup();
 for(const code of Object.keys(registry.locales)) {
  assert.equal((await x.handle(input(code))).status,200);
 }
 assert.equal(x.state.changes.length,Object.keys(registry.locales).length);
 const tenth={...registry,locales:{...registry.locales,it:{name:"Italiano",dir:"ltr",messages:{}}}};
 const newer=setup({registry:tenth});
 assert.equal((await newer.handle(input("it"))).status,200);
});
