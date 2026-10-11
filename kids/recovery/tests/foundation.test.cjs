#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../../..");
const sql=fs.readFileSync(path.join(root,"kids/recovery/db/20261011_foundation.sql"),"utf8");
const source=fs.readFileSync(path.join(root,"kids/recovery/gmail/DarKidsSupportIntake.gs"),"utf8");
assert.match(sql,/create table if not exists public\.kids_parent_contacts/i);
assert.match(sql,/create table if not exists public\.kids_account_recovery_requests/i);
assert.match(sql,/create table if not exists public\.kids_recovery_challenges/i);
assert.match(sql,/create table if not exists public\.kids_recovery_audit_events/i);
for(const name of ["kids_parent_contacts","kids_account_recovery_requests","kids_recovery_challenges","kids_recovery_audit_events"]){
  assert.ok(sql.includes("alter table public."+name+" enable row level security"),"RLS missing for "+name);
}
assert.match(sql,/from public, anon, authenticated/);
assert.match(sql,/status not in \('approved','reset_completed'\) or ownership_proven/);
assert.ok(!/create\s+(or replace\s+)?function\s+[^;]*reset_password/i.test(sql),"No unauthenticated reset RPC");
assert.ok(!/\bupdate\s+public\.kids_accounts\b/i.test(sql),"Never rewrite existing kids accounts");

const labels=new Map(),replies=[],threads=[];
const fakeThread={
  labels:new Set(),
  unread:false,
  getMessages(){return [{
    getFrom(){return "Eltern <parent@example.org>"},
    getSubject(){return "DAR AL TAWHID KIDS - Kontohilfe"},
    getPlainBody(){return "Passwort vergessen - bitte helfen."}
  }]},
  addLabel(label){this.labels.add(label.name)},
  markUnread(){this.unread=true}
};
threads.push(fakeThread);
const gmail={
  getUserLabelByName(name){return labels.get(name)||null},
  createLabel(name){const label={name};labels.set(name,label);return label},
  search(query){
    assert.match(query,/in:inbox -in:spam -in:trash/);
    return threads.filter(t=>!t.labels.has("DAR KIDS/01 Automatisch beantwortet"));
  },
  sendEmail(address,subject,body,options){replies.push({address,subject,body,options})}
};
const context={
  GmailApp:gmail,
  Session:{getEffectiveUser(){return {getEmail(){return "dar.al.tauhid91@gmail.com"}}}},
  ScriptApp:{
    getProjectTriggers(){return []},deleteTrigger(){},
    newTrigger(name){assert.equal(name,"darKidsProcessSupportInbox");return {
      timeBased(){return this},everyMinutes(n){assert.equal(n,5);return this},
      create(){return true}
    }}
  }
};
vm.createContext(context);
vm.runInContext(source+"\nthis.__supportTest={run:darKidsProcessSupportInbox,install:darKidsInstallFiveMinuteIntake,clean:darKidsCleanSender_};",context,{filename:"DarKidsSupportIntake.gs"});
context.__supportTest.install();
context.__supportTest.run();
context.__supportTest.run();
assert.equal(replies.length,1,"No duplicate acknowledgement for processed conversation");
assert.equal(replies[0].address,"parent@example.org");
assert.ok(replies[0].body.includes("keine")||replies[0].body.includes("kein"));
assert.ok(!/dein konto existiert|passwort wurde geaendert|zugang aktiviert/i.test(replies[0].body));
assert.ok(fakeThread.labels.has("DAR KIDS/02 Manuell pruefen"));
assert.ok(fakeThread.labels.has("DAR KIDS/Passwort"));
assert.equal(fakeThread.unread,true);
context.Session.getEffectiveUser=()=>({getEmail:()=> "someoneelse@gmail.com"});
assert.throws(()=>context.__supportTest.run(),/falsches Gmail-Konto/);
assert.ok(!/kids_login|kids_save|kids_register|pass_hash/.test(source),"Support script must never access account credentials");
console.log("KIDS recovery staging: RLS schema, support mailbox, neutral answer and idempotent triage OK");
