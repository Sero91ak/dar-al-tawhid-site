#!/usr/bin/env node
"use strict";
/* KIDS_STORE_V1 contract: no cloud accounts, no third-party requests, parental gate present. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const shells=["kids/start.html","kids/index.html","kids/shell.html"];
const first=fs.readFileSync(shells[0],"utf8");
for(const file of shells){
  const html=fs.readFileSync(file,"utf8");
  assert.equal(html,first,file+" must stay byte-identical to start.html");
  // Child accounts are disabled: no passwords, no sign-in, no server calls.
  for(const id of ["joinPass","joinLoginExisting","deviceLoginName","deviceLoginPass","deviceLoginSubmit","profileBring","profileAskFull"]){
    assert.ok(!html.includes('id="'+id+'"'),file+" must not contain the removed account element "+id);
  }
  for(const needle of ["supabase","sb_publishable_","kids_login","kids_register","kids_save","kids_delete_full","rpc(","syncPending","flushProfileSync","crypto.subtle"]){
    assert.ok(!html.includes(needle),file+" must not contain "+needle);
  }
  assert.equal(html.split('id="joinName"').length-1,1);
  assert.equal(html.split('id="joinSave"').length-1,1);
  assert.match(html,/function submitJoin\(\)\{/);
  assert.match(html,/Es gibt keine Anmeldung und kein Konto/);
  // Parents area: one support link behind the gate, privacy link, no account wording.
  assert.equal((html.match(/mailto:dar\.al\.tauhid91@gmail\.com\?/g)||[]).length,1,file+" needs exactly the support link");
  assert.match(html,/data-parent-gate="support"/);
  assert.match(html,/href="\/kids\/datenschutz\.html"/);
  assert.ok(!/Konto komplett löschen|Vorhandenes Kind anmelden|Konto anlegen/.test(html),file+" still offers an account");
  // No third-party requests from the Kids shell.
  for(const host of ["use.typekit.net","fonts.googleapis.com","fonts.gstatic.com","static.cloudflareinsights.com","everyayah.com","dnznrvs05pmza.cloudfront.net","at.adobe.com","geocoding-api.open-meteo.com"]){
    assert.ok(!html.includes(host),file+" still references "+host);
  }
  assert.match(html,/\/kids\/kids-fonts-v1\.css/);
  assert.match(html,/\/kids\/kids-parent-gate-v1\.js/);
  assert.match(html,/\/kids\/kids-local-geocode-v1\.js/);
  const blocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for(const b of blocks){
    if(/\bsrc=/.test(b[1])||/\btype=["']module["']/.test(b[1]))continue;
    new vm.Script(b[2],{filename:file});
  }
}
for(const f of ["kids/kids-parent-gate-v1.js","kids/kids-local-geocode-v1.js","kids/kids-fonts-v1.css","kids/datenschutz.html"])assert.ok(fs.existsSync(f),f+" missing");
const css=fs.readFileSync("kids/section-heroes-v1095.css","utf8");
assert.ok(!css.includes("cloudfront.net"),"expired third-party art must stay removed");
const privacy=fs.readFileSync("kids/datenschutz.html","utf8");
for(const phrase of ["Kein Konto","Keine Werbung","Kein Tracking","Gebetszeiten","Von diesem Gerät löschen","dar.al.tauhid91@gmail.com"])assert.ok(privacy.includes(phrase),"privacy page lacks: "+phrase);
assert.ok(!/serhat/i.test(privacy),"privacy page must not contain the owner's name");
console.log("KIDS store contract: no accounts, no third-party requests, parental gate and privacy page OK");

// Service-only recovery foundation and simulated Gmail intake regression.
require("../kids/recovery/tests/foundation.test.cjs");
