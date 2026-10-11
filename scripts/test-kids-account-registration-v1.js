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
  assert.match(html,/if\(previous&&\(previous\.name\|\|""\)\.toLowerCase\(\)!==name\.toLowerCase\(\)\)rememberCurrent\(\)/);
  const blocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for(const b of blocks){
    if(/\bsrc=/.test(b[1])||/\btype=["']module["']/.test(b[1]))continue;
    new vm.Script(b[2],{filename:file});
  }
}
console.log("KIDS account UI: all three visitor entry shells, registration feedback, sign-in and JS syntax OK");
