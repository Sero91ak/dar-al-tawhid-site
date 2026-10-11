#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const sql=fs.readFileSync("kids/recovery/db/20261012_parent_auth_registration_stage.sql","utf8");
const legacy=fs.readFileSync("kids/recovery/db/20261012_legacy_register_release_gate_REVIEW.sql","utf8");
const edge=fs.readFileSync("kids/recovery/edge/kids-parent-register/index.ts","utf8");
assert.match(sql,/create or replace function public\.kids_register_verified_parent\(/i);
assert.match(sql,/auth\.users u/);
assert.match(sql,/u\.email_confirmed_at is not null/);
assert.match(sql,/u\.id = p_auth_user_id/);
assert.match(sql,/lower\(u\.email\) = e/);
assert.match(sql,/from public,anon,authenticated/);
assert.match(sql,/to service_role/);
assert.match(sql,/perform pg_advisory_xact_lock/);
assert.match(sql,/insert into public\.kids_parent_contacts/);
assert.match(sql,/insert into public\.kids_accounts/);
assert.ok(!/update\s+public\.kids_accounts/i.test(sql),"No password or legacy-learning-progress change");
assert.match(legacy,/create or replace function public\.kids_register\(/i);
assert.ok(!/insert\s+into\s+public\.kids_accounts/i.test(legacy),"Legacy public register must not INSERT");
assert.match(edge,/admin\.auth\.getUser\(tokenMatch\[1\]\)/);
assert.match(edge,/user\.email_confirmed_at/);
assert.match(edge,/user\.email\?\.toLowerCase\(\) !== email/);
assert.match(edge,/admin\.rpc\("kids_register_verified_parent"/);
assert.match(edge,/roleKey = Deno\.env\.get\("SUPABASE_SERVICE_ROLE_KEY"\)/);
assert.match(edge,/form\.parent_consent !== true/);
assert.match(edge,/result\.ok !== true \|\| result\.verified !== true/);
assert.ok(!/smtp_pass|app_password|api_key\s*=\s*["'][^"']{20}/i.test(edge),"No send credentials in repository");

// Test actual UI verification function in isolation using a fake network.
// No Gmail, Supabase user or real child account is touched.
const html=fs.readFileSync("kids/index.html","utf8");
const begin=html.indexOf("  function verifyParentRegistration(){");
const end=html.indexOf("  function step(name){",begin);
assert.ok(begin>0&&end>begin,"actual KIDS verify callback available");
const fn=html.slice(begin,end);
const progress={calls:[],profiles:[],feedback:[],saved:0,completed:0};
let mode="auth-error",pending=false;
const codeField={value:"123456"},ageBtn={click(){}};
const context={
  joinBusy:false,
  joinParentPending:{name:"Test Child",hash:"a".repeat(64),email:"parent@example.org",
    gender:"boy",age:"6–8",data:{}},
  document:{
    getElementById(id){assert.equal(id,"joinParentCode");return codeField},
    querySelector(sel){return sel===".app"?{setAttribute(){}}:ageBtn},
  },
  joinPending(v){pending=v;context.joinBusy=!!v},
  joinFeedback(msg,kind){progress.feedback.push({msg,kind})},
  fetch(url,params){
    progress.calls.push({url,params});
    if(url.endsWith("/verify")){
      return Promise.resolve({ok:mode!=="auth-error",
        json:async()=>({access_token:"signed-test-jwt"})});
    }
    if(url.endsWith("/kids-parent-register")){
      return Promise.resolve({ok:mode!=="edge-error",
        json:async()=>({ok:true,verified:true})});
    }
    throw Error("Unexpected endpoint "+url);
  },
  AUTH_API:"https://test.example/auth/v1/",
  PARENT_REGISTER_EDGE:"https://test.example/functions/v1/kids-parent-register",
  APIKEY:"test-public-key",
  rememberCurrent(){},
  localStorage:{setItem(){}},
  ACTIVE:"kids.activeProfile",
  syncConfirmed:{},
  profileSnapshot(){return "{}"},
  load(){return progress.profiles},
  save(rows){progress.profiles=rows;progress.saved++},
  closeJoin(){progress.completed++},
  renderList(){},
};
vm.createContext(context);
vm.runInContext(fn+"\nthis.testVerify=verifyParentRegistration;",context);
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function run(){
  codeField.value="12";
  context.testVerify();
  assert.equal(progress.calls.length,0,"invalid code must not reach backend");
  codeField.value="123456";
  context.testVerify();await settle();
  assert.equal(progress.profiles.length,0,"failed OTP must not create account");
  assert.equal(progress.calls.length,1,"failed OTP must not call registration endpoint");
  assert.equal(pending,false,"failed OTP must restore UI");

  progress.calls.length=0;
  mode="edge-error";
  context.testVerify();await settle();
  assert.equal(progress.calls.length,2,"valid OTP calls server endpoint exactly once");
  assert.equal(progress.profiles.length,0,"failed authenticated server registration must not create local account");

  progress.calls.length=0;
  mode="success";
  context.testVerify();await settle();
  assert.equal(progress.profiles.length,1,"only success creates a local profile");
  assert.equal(progress.completed,1);
  assert.equal(context.joinParentPending,null);
  const headers=progress.calls[1].params.headers;
  assert.equal(headers.Authorization,"Bearer signed-test-jwt","JWT must be sent to protected server");
  assert.equal(JSON.parse(progress.calls[1].params.body).parent_consent,true);
  console.log("KIDS parent verification: failed-code, failed-backend and success gates OK");
}
run().catch(error=>{console.error(error);process.exitCode=1});
