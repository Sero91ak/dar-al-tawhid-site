#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const registry=require("./locales.json");
const code=fs.readFileSync(path.join(__dirname,"app-locale-push-adapter.js"),"utf8");
function adapter(){
 const context={window:{}};
 vm.runInNewContext(code,context);
 return context.window.DarAppLocalePushDraft;
}
function OS(id="sub-123",optedIn=true){
 return {User:{PushSubscription:{id,optedIn}}};
}
test("no subscription: do not persist or change OneSignal identity", async()=>{
 let called=false;
 const result=await adapter().syncSelectedAppLocale("fr",{
   registry,oneSignal:OS(null),updateRegistration(){called=true;}
 });
 assert.equal(result.synced,false);
 assert.equal(result.reason,"no_subscription");
 assert.equal(called,false);
});
test("no consent: changing app language does not enable push",async()=>{
 let called=false;
 const r=await adapter().syncSelectedAppLocale("es",{
  registry,oneSignal:OS("sub-123",false),updateRegistration(){called=true;}
 });
 assert.equal(r.reason,"push_not_opted_in");
 assert.equal(called,false);
});
test("authenticated backend ack binds locale to the exact subscription",async()=>{
 const records=[];
 const result=await adapter().syncSelectedAppLocale("fr-FR",{
  registry,oneSignal:OS(),
  updateRegistration(row){records.push(row);return {ok:true,subscriptionId:row.subscriptionId,appLocale:row.appLocale};}
 });
 assert.equal(result.synced,true);
 assert.equal(result.locale,"fr");
 assert.equal(result.subscriptionId,"sub-123");
 assert.deepEqual(JSON.parse(JSON.stringify(records)),[{subscriptionId:"sub-123",appLocale:"fr"}]);
});
test("no false success if secure backend not installed",async()=>{
 const r=await adapter().syncSelectedAppLocale("es",{
  registry,oneSignal:OS()
 });
 assert.equal(r.reason,"secure_backend_not_integrated");
 assert.equal(r.synced,false);
});
test("public SDK subscription id alone cannot be a server-side proof",async()=>{
 const r=await adapter().syncSelectedAppLocale("ar",{
  registry,oneSignal:OS(),
  updateRegistration(){return {ok:true,subscriptionId:"somebody-else",appLocale:"ar"};}
 });
 assert.equal(r.reason,"server_ack_invalid");
 assert.equal(r.synced,false);
});
test("backend error cannot be misreported as success",async()=>{
 await assert.rejects(adapter().syncSelectedAppLocale("ku",{
  registry,oneSignal:OS(),
  updateRegistration(){throw Error("authorization failed");}
 }),/authorization failed/);
});
test("all nine explicit app languages normalize locally",()=>{
 for(const locale of Object.keys(registry.locales)) {
  assert.equal(adapter().normalizeLocale(locale,registry),locale);
 }
});
