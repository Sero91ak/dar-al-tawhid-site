#!/usr/bin/env node
"use strict";
/* KIDS_BIRTH_MONTH_AUTO_AGE_V1431: never collect day or overwrite lessons. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const js=read("kids/kids-birth-month-v1431.js");
const style=read("kids/kids-birth-month-v1431.css");
const app=read("kids/index.html");
const academy=read("kids/akademie/index.html");
const sw=read("kids/sw.js");
for(const path of ["kids/start.html","kids/shell.html"])
  assert.equal(read(path),app,"All production Kids HTML entrypoints must match");
assert(app.includes("/kids/kids-birth-month-v1431.js?v=1431"),"Main app age module missing");
assert(app.includes('id="joinBirthMonth"')&&app.includes('id="joinBirthYear"'),"Registration must ask for month and year");
assert(app.includes('id="parentBirthMonth"')&&app.includes('id="parentBirthYear"'),"Parents must be able to set existing child's birth month");
assert(!app.includes('id="joinBirthDay"')&&!app.includes('id="parentBirthDay"'),"Never demand a child's day of birth");
assert(app.includes('mode==="register"&&!draft.birthMonth'),"Registered account must require month/year");
assert(app.includes('window.DARKidsBirthMonth?.set(p.id,draft.birthMonth)'),"Newly registered child must retain per-profile age metadata");
assert(app.includes('refreshBirthday();rememberCurrent()'),"Long-running main app must refresh at birthday month");
assert(academy.includes('/kids/kids-birth-month-v1431.js?v=1431')&&
       academy.includes('window.DARKidsBirthMonth?.resolve(child.id,child.age)'),"Academy must resolve account age independently");
assert(academy.includes('syncProfile(); /* Month-year ages update'),"Open Academy must check age on day transition");
assert(sw.includes("/kids/kids-birth-month-v1431.js?v=1431")&&
       sw.includes("/kids/kids-birth-month-v1431.css?v=1431")&&
       sw.includes('dar-al-tawhid-kids-'+JSON.parse(read("kids/version.json")).visualSystem.serviceWorkerCache),"Birth module must be offline precached with the current SW cache");
assert(!js.includes("kids.profiles.v1"),"Birth details must not be placed into account sync bag");
assert(js.includes('dar.kids.birthMonth.v1.'),"Birth details must be stored separately");
assert(style.includes('.app[data-gender="girl"]'),"Girl input styling must respect girl's palette");
assert(style.includes("min-height:48px"),"Accessible inputs must remain finger-friendly");
const kv=new Map();
const storage={
 getItem(key){return kv.has(key)?kv.get(key):null},
 setItem(key,value){kv.set(key,String(value))},
 removeItem(key){kv.delete(key)}
};
class FakeDate extends Date{
 constructor(...args){super(...(args.length?args:[2026,9,15]))}
}
const context={window:{},localStorage:storage,Date:FakeDate};
vm.runInNewContext(js,context,{filename:"kids-birth-month-v1431.js"});
const age=context.window.DARKidsBirthMonth;
assert.equal(age.ageAt("2020-11",new FakeDate(2026,9,31)),5);
assert.equal(age.ageAt("2020-11",new FakeDate(2026,10,1)),6);
assert.equal(age.groupAt("2020-11",new FakeDate(2026,9,31)),"4–5");
assert.equal(age.groupAt("2020-11",new FakeDate(2026,10,1)),"6–8");
assert.equal(age.groupAt("2017-11",new FakeDate(2026,9,31)),"6–8");
assert.equal(age.groupAt("2017-11",new FakeDate(2026,10,1)),"9–10");
assert.equal(age.groupAt("2019-05",new FakeDate(2026,4,1)),"6–8");
assert.equal(age.parse("2020-13"),null,"Impossible month must be rejected");
assert.equal(age.isEligible("2027-01"),false,"Future year must be rejected");
assert.equal(age.isEligible("2020-11"),true);
assert.equal(age.set("childA","2020-11"),true);
assert.equal(age.set("childB","2017-11"),true);
assert.equal(age.get("childA"),"2020-11");
assert.equal(age.get("childB"),"2017-11");
assert.equal(age.resolve("childA","9–10"),"4–5","Child A must not receive child B's age");
assert.equal(age.resolve("new-device","6–8"),"6–8","Legacy remote accounts retain previous selection");
assert(app.includes('window.DARKidsBirthMonth?.clear(id)'),"Account removal must delete local birth details");
assert.equal(age.clear("childA"),true,"Deleted child's birth month must be wiped");
assert.equal(age.get("childA"),null);
assert.equal(age.get("childB"),"2017-11","Removing child A cannot erase child B");
assert([...kv.keys()].every(x=>x.startsWith("dar.kids.birthMonth.v1.")),"Birth detail must remain out of kids.* cloud sync");
console.log("KIDS_BIRTH_MONTH_AUTO_AGE_V1431_OK: month boundary, parent/registration, legacy progress, offline, boys/girls");
