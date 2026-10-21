#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const registry=require("./locales.json");
const code=fs.readFileSync(path.join(__dirname,"app-locale-push-adapter.js"),"utf8");
function adapter() {
  const context={window:{}};
  vm.runInNewContext(code,context);
  return context.window.DarAppLocalePushDraft;
}
test("only an existing subscription is eligible", async()=>{
  let invoked=false;
  const result=await adapter().syncSelectedAppLocale("fr",{registry,
    oneSignal:{User:{PushSubscription:{id:null},addTags(){invoked=true;}}},
    updateRegistration(){invoked=true;}});
  assert.equal(result.synced,false);
  assert.equal(result.reason,"no_subscription");
  assert.equal(invoked,false);
});
test("an explicit French app preference writes correct subscription and tag",async()=>{
  const records=[],tags=[];
  const result=await adapter().syncSelectedAppLocale("fr-FR",{registry,
    oneSignal:{User:{PushSubscription:{id:"sub-123"},addTags(t){tags.push(t);}}},
    updateRegistration(row){records.push(row);}
  });
  assert.equal(result.synced,true);
  assert.deepEqual(JSON.parse(JSON.stringify(records)),[{subscriptionId:"sub-123",appLocale:"fr"}]);
  assert.deepEqual(JSON.parse(JSON.stringify(tags)),[{dar_app_locale:"fr"}]);
});
test("no false sync without server side registration",async()=>{
  let called=false;
  const result=await adapter().syncSelectedAppLocale("es",{registry,
    oneSignal:{User:{PushSubscription:{id:"sub-123"},addTags(){called=true;}}}
  });
  assert.equal(result.reason,"backend_not_integrated");
  assert.equal(called,false);
});
test("failed registration cannot announce a successful sync",async()=>{
  let tags=false;
  await assert.rejects(adapter().syncSelectedAppLocale("ar",{registry,
    oneSignal:{User:{PushSubscription:{id:"sub-123"},addTags(){tags=true;}}},
    updateRegistration(){throw new Error("server not available");}
  }),/server not available/);
  assert.equal(tags,false);
});
