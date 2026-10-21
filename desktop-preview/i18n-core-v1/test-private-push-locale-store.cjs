#!/usr/bin/env node
"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {serverStore}=require("./private-push-locale-store.cjs");
const ORIGIN="https://exampleproject.supabase.co";
const KEY="TEST_FIXTURE_SERVICE_ROLE_NOT_VALID_"+"x".repeat(60);
const APP="786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const SUB="00000000-1111-4222-8333-abcdef012345";
function createFakeStore(){
 const calls=[],db=[];
 function fetchImpl(url,opts){
  calls.push({url,opts});
  assert.ok(url.startsWith(ORIGIN+"/rest/v1/dar_push_subscription_locales"));
  assert.equal(opts.headers.apikey,KEY);
  assert.equal(opts.headers.Authorization,"Bearer "+KEY);
  if(opts.method==="POST"){
   const row=JSON.parse(opts.body)[0];
   db.splice(0,db.length,row);
   return Promise.resolve({ok:true,json:async()=>[row]});
  }
  return Promise.resolve({ok:true,json:async()=>db.slice()});
 }
 return {store:serverStore({supabaseUrl:ORIGIN,serviceRoleKey:KEY,fetchImpl}),calls,db};
}
test("no secret or unsafe origin means no private store",()=>{
 assert.throws(()=>serverStore({supabaseUrl:"http://evil.net",serviceRoleKey:KEY,fetchImpl:()=>{}}),/origin/);
 assert.throws(()=>serverStore({supabaseUrl:ORIGIN,serviceRoleKey:"",fetchImpl:()=>{}}),/credential/);
 assert.throws(()=>serverStore({supabaseUrl:ORIGIN,serviceRoleKey:KEY}),/fetch/);
});
test("store binds exact private app, subscription and explicit French selection",async()=>{
 const x=createFakeStore();
 const response=await x.store.set({onesignalAppId:APP,subscriptionId:SUB,appLocale:"fr-FR"});
 assert.deepEqual(response,{ok:true,subscriptionId:SUB,appLocale:"fr"});
 assert.equal(x.db[0].selection_source,"explicit_app_setting");
 assert.equal(x.calls[0].opts.method,"POST");
 assert.equal(x.calls[0].opts.headers.Prefer,"resolution=merge-duplicates,return=representation");
 const item=await x.store.get({onesignalAppId:APP,subscriptionId:SUB});
 assert.equal(item.appLocale,"fr");
 assert.equal(x.calls[1].opts.method,"GET");
});
test("invalid identities and unsupported locale fail before any request",async()=>{
 const x=createFakeStore();
 await assert.rejects(x.store.set({onesignalAppId:APP,subscriptionId:SUB,appLocale:"fake"}),/Unsupported/);
 await assert.rejects(x.store.set({onesignalAppId:"not-app",subscriptionId:SUB,appLocale:"en"}),/Invalid/);
 await assert.rejects(x.store.get({onesignalAppId:APP,subscriptionId:"invalid"}),/Invalid/);
 assert.equal(x.calls.length,0);
});
test("provider 403 and mismatched returned row are rejected",async()=>{
 const denied=serverStore({supabaseUrl:ORIGIN,serviceRoleKey:KEY,
  fetchImpl:async()=>({ok:false,status:403,json:async()=>[]})});
 await assert.rejects(denied.get({onesignalAppId:APP,subscriptionId:SUB}),/unavailable/);
 const mismatch=serverStore({supabaseUrl:ORIGIN,serviceRoleKey:KEY,
  fetchImpl:async()=>({ok:true,json:async()=>[{onesignal_app_id:APP,subscription_id:"someone-else",app_locale:"de"}]})});
 await assert.rejects(mismatch.set({onesignalAppId:APP,subscriptionId:SUB,appLocale:"fr"}),/does not match/);
 await assert.rejects(mismatch.get({onesignalAppId:APP,subscriptionId:SUB}),/mismatched/);
});
test("all nine locales can be selected without provider network access",async()=>{
 const x=createFakeStore();
 for(const locale of ["de","ar","en","tr","ku","ckb","bs","fr","es"]){
  const item=await x.store.set({onesignalAppId:APP,subscriptionId:SUB,appLocale:locale});
  assert.equal(item.appLocale,locale);
 }
 assert.equal(x.calls.length,9);
});
