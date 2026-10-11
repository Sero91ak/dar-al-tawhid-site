#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
for(const file of ["kids/start.html","kids/index.html","kids/shell.html"]){
  const html=fs.readFileSync(file,"utf8");
  for(const id of ["joinName","joinPass","joinSave","joinStatus","joinLoginExisting","deviceLoginName","deviceLoginPass","deviceLoginSubmit","deviceLoginStatus","deviceLoginCancel","profileBring"]){
    assert.equal(html.split('id="'+id+'"').length-1,1,file+" duplicate or missing "+id);
  }
  assert.match(html,/id="joinStatus"[^>]*aria-live="polite"/);
  assert.match(html,/\.kids-join \.join-feedback\[hidden\]/);
  assert.match(html,/function joinExistingHint\(msg\)/);
  assert.match(html,/function submitJoin\(mode\)/);
  assert.match(html,/joinPending\(true\)/);
  assert.match(html,/joinPending\(false\)/);
  assert.match(html,/if\(existing&&existing\.ok===true\)\{acceptExistingAccount/);
  assert.match(html,/rpc\("kids_login",\{p_name:name,p_hash:h\}\)/);
  assert.match(html,/rpc\("kids_register",\{p_name:name,p_hash:h/);
  assert.match(html,/joinExistingHint\(\)/);
  assert.match(html,/document\.getElementById\("joinLoginExisting"\)\.addEventListener/);
  assert.ok(!html.includes('if(p.name&&p.pass)rpc("kids_register"'),
    file+" may overwrite existing cloud progress when reopened");
  // Login must never depend on blocking browser-native prompts in iOS WKWebView.
  assert.match(html,/data-step="login" role="group"/);
  assert.match(html,/id="deviceLoginStatus"[^>]*aria-live="polite"/);
  assert.match(html,/id="deviceLoginName"[^>]*autocomplete="username"/);
  assert.match(html,/id="deviceLoginPass"[^>]*autocomplete="current-password"/);
  assert.match(html,/if\(bring\)bring\.addEventListener\("click",function\(\)\{/);
  assert.match(html,/openJoin\("login"\)/);
  assert.match(html,/deviceLoginSubmit\.addEventListener\("click",function\(\)\{submitJoin\("restore"\)\}/);
  assert.ok(!html.includes('window.prompt("Anmeldename")'),file+" still uses native account login prompt");
  assert.ok(!html.includes('var pw=window.prompt("Passwort für "+p.name)'),file+" still uses native profile login prompt");
  assert.match(html,/#view-parents #profileBring\{/);
  assert.match(html,/-webkit-text-fill-color:#fff9eb!important/);
  assert.match(html,/\.app\[data-gender="girl"\] #view-parents #profileBring\{/);
  assert.match(html,/document\.addEventListener\("visibilitychange"/);
  // Save while app is open, retry interrupted network requests, avoid stale uploads.
  assert.match(html,/KIDS ACCOUNT SYNC V3/);
  assert.match(html,/function flushProfileSync\(id\)/);
  assert.match(html,/function profileSnapshot\(p\)/);
  assert.match(html,/setInterval\(function\(\)/);
  assert.match(html,/window\.addEventListener\("online"/);
  assert.match(html,/syncPending\[p\.id\]=true/);
  assert.match(html,/syncConfirmed\[known\.id\]=profileSnapshot\(known\)/);
  assert.match(html,/syncConfirmed\[p\.id\]=profileSnapshot\(p\)/);
  assert.match(html,/delete syncPending\[p\.id\];writeSyncPending\(\)/);
  assert.match(html,/if\(previous&&\(previous\.name\|\|""\)\.toLowerCase\(\)!==name\.toLowerCase\(\)\)rememberCurrent\(\)/);
  const blocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for(const b of blocks){
    if(/\bsrc=/.test(b[1])||/\btype=["']module["']/.test(b[1]))continue;
    new vm.Script(b[2],{filename:file});
  }
}
console.log("KIDS account UI: all three visitor entry shells, registration feedback, sign-in and JS syntax OK");


/* Exercise the actual production sync implementation with mocked browser state.
   No real accounts, passwords or network endpoints are used in this test. */
async function exerciseAccountSync(){
  const html=fs.readFileSync("kids/index.html","utf8");
  const start=html.indexOf("  /* KIDS ACCOUNT SYNC V3");
  const end=html.indexOf("  function renderList(){",start);
  assert.ok(start>0&&end>start,"sync implementation must be extractable");
  const store=new Map(), calls=[];
  let profile={id:"test-child",name:"Testkind",pass:"mock-hash",
    gender:"boy",age:"6–8",data:{"kids.quran.resume":"1"}};
  let progress="1", failNext=false;
  const ctx={
    localStorage:{
      getItem:key=>store.has(key)?store.get(key):null,
      setItem:(key,value)=>store.set(key,String(value))
    },
    document:{querySelector:()=>({getAttribute:()=> "boy"})},
    load:()=>[profile],
    save:rows=>{profile=rows[0]},
    currentProfile:()=>profile,
    bag:()=>({"kids.quran.resume":progress}),
    rpc:(name,params)=>{
      assert.equal(name,"kids_save");
      calls.push(params);
      return Promise.resolve(failNext?{ok:false,error:"offline"}:{ok:true});
    },
    setTimeout:(fn)=>setImmediate(fn)
  };
  vm.createContext(ctx);
  vm.runInContext(html.slice(start,end)+
    "\nthis.syncTest={rememberCurrent,profileSnapshot,flushProfileSync,syncConfirmed,syncPending};",ctx);
  const sync=ctx.syncTest;
  sync.syncConfirmed[profile.id]=sync.profileSnapshot(profile);
  sync.rememberCurrent();
  assert.equal(calls.length,0,"unchanged profile must not write to Supabase");
  progress="2";
  sync.rememberCurrent();
  assert.equal(calls.length,1,"changed learning progress must upload");
  assert.equal(JSON.parse(store.get("dar.kids.account.pendingSync.v1"))[profile.id],true,
    "pending upload must survive app termination");
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(Boolean(sync.syncPending[profile.id]),false,"successful upload must clear pending state");
  failNext=true;
  progress="3";
  sync.rememberCurrent();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(Boolean(sync.syncPending[profile.id]),true,"offline failure must remain queued");
  failNext=false;
  sync.flushProfileSync(profile.id);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(Boolean(sync.syncPending[profile.id]),false,"reconnect must replay pending update");
  assert.equal(calls[calls.length-1].p_data["kids.quran.resume"],"3");
  console.log("KIDS cloud sync: change-only saves, durable pending, offline retry OK");
}
exerciseAccountSync().catch(e=>{console.error(e);process.exitCode=1});
