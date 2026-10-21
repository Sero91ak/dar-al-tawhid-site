#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {glossaryHints}=require("./glossary-hints.cjs");
const concepts=field=>glossaryHints({body:field}).map(x=>x.conceptId);
for(const x of ["Tawḥīd","Tauhid","Tevhid","التوحيد"])assert(concepts("Dies ist "+x+" und Īmān.").includes("tawhid"),x);
assert(!concepts("Der Tagesbericht des Verkehrs in Bonn").includes("tawhid"));
const seen=glossaryHints({title:"Tawḥīd",body:"Was bedeutet Schirk und Īmān?",answers:["Sunnah","Athar"]});
assert(seen.length>=2);
assert(seen.every(x=>x.conceptId&&x.arabicSpelling&&x.domain));
assert(seen.every(x=>!Object.prototype.hasOwnProperty.call(x,"definition")));
console.log("PASS: Unicode spelling anchor recognition, source-restricted selection, no generated legal definitions.");
