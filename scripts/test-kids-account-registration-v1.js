#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
for(const file of ["kids/start.html","kids/index.html"]){
  const html=fs.readFileSync(file,"utf8");
  for(const id of ["joinName","joinPass","joinSave","joinStatus","joinLoginExisting"]){
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
  const blocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for(const b of blocks){
    if(/\bsrc=/.test(b[1])||/\btype=["']module["']/.test(b[1]))continue;
    new vm.Script(b[2],{filename:file});
  }
}
console.log("KIDS account UI: both visitor entry pages, registration feedback, sign-in and JS syntax OK");
