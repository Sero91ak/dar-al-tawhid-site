#!/usr/bin/env node
"use strict";
/* Mandatory Frauen translation identity check. Read-only. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),load=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const loc=load("assets/frauen/frauen-entry-locales-v1.json");
const required=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.equal(loc.schemaVersion,1);
assert.deepEqual(loc.languages,required,"Exact nine adult-app languages required");
assert.ok(Object.keys(loc.entries).length>0,"No localized women entries available");
const all=[];
for(const name of fs.readdirSync(path.join(root,"data")).filter(n=>/^frauen-.*\.json$/.test(n))){
 const d=load("data/"+name);
 for(const e of d.eintraege||[])if(e.localeCatalogId)all.push({entry:e,file:name});
}
const used=new Set(),ids=new Set(loc.entryIds);
for(const {entry:e,file} of all){
 assert.ok(e.quellenstatus==="geprueft" || e.quellenstatus==="nicht-anzeigen","Invalid publication status: "+e.kennung);
 assert.equal(e.contentId,e.kennung,"Canonical internal ID must remain the original Frauen kennung");
 assert.equal(e.localeCatalogId,e.kennung,"Locale catalog must use same post ID, not Q number");
 assert.ok(!Object.hasOwn(e,"qNumber")&&!Object.hasOwn(e,"kanonischerQuellenlink"),"Q numbers forbidden unless owner assigns one: "+e.kennung);
 assert.ok(!used.has(e.kennung),"Duplicate localized Frauen ID "+e.kennung);used.add(e.kennung);
 const entry=loc.entries[e.kennung];
 assert.ok(entry,"Missing nine-language catalog for "+e.kennung+" in "+file);
 assert.equal(entry.id,e.kennung);
 assert.equal(entry.sourceUrl,e.direktnachweisUrl,"Source URL must never change across app languages: "+e.kennung);
 assert.ok(/^https?:\/\//.test(entry.sourceUrl)&&!(/\/q\/[1-9]\d*\//.test(entry.sourceUrl)),"No auto-Q source URL: "+e.kennung);
 assert.ok(!Object.hasOwn(entry,"qNumber")&&!Object.hasOwn(entry,"qSourceId"),"No Q number in content manifest");
 for(const code of required){
  const p=entry.locales&&entry.locales[code];
  assert.ok(p,"Missing language "+code+" for "+e.kennung);
  assert.equal(p.lang,code);
  assert.equal(p.dir,["ar","ckb"].includes(code)?"rtl":"ltr");
  for(const key of ["title","statement","preview","lesson","sharh","source"])assert.ok(typeof p[key]==="string"&&p[key].trim().length>=5,"Missing "+code+"."+key+" in "+e.kennung);
  for(const key of ["statement","lesson","source","proof","open","back","share","sharh"])assert.ok(typeof p.labels?.[key]==="string"&&p.labels[key].trim().length>=2,"Missing UI "+code+"."+key);
  assert.ok(!Object.hasOwn(p,"direktnachweisUrl")&&!Object.hasOwn(p,"qNumber"),"Locale may not override source URL or ID");
 }
 assert.equal(entry.locales.de.title,e.titel,"German content title drift");
 assert.equal(entry.locales.de.statement,e.vollstaendigeAussage,"German main statement drift");
 assert.equal(entry.locales.de.lesson,e.lehre,"German lesson drift");
 assert.equal(entry.locales.de.source,e.quellenanzeige.replace(/^Quelle:\s*/i,""),"German source drift");
}
for(const id of ids)assert.ok(used.has(id),"Orphan locale ID with no linked women post: "+id);
assert.equal(used.size,ids.size);
const reg=load("q/_registry/shortlinks.json");
const misnumber=reg.links.find(x=>Number(x.number)===52);
if(misnumber) {
 assert.equal(misnumber.status,"inactive","Auto-created Q52 must not be active");
 assert.equal(misnumber.publicListed,false);
 assert.equal(misnumber.postReference,null);
}
for(const x of reg.links.filter(x=>x.status!=="inactive"))assert.ok(!used.has(x.postReference),"Auto-assigned Q for localized women post");
const js=fs.readFileSync(path.join(root,"assets/frauen/frauen-entry-locale-v1.js"),"utf8");
new vm.Script(js,{filename:"frauen-entry-locale-v1.js"});
assert.ok(js.includes("darAdultPreferredLocaleV1"),"App setting must choose language");
assert.ok(js.includes("data-dar-frauen-content-id"),"Identity attribute absent");
assert.ok(js.includes("dar:frauen-render"),"Native frozen renderer event missing");
const router=fs.readFileSync(path.join(root,"cloudflare/site-router.js"),"utf8");
assert.ok(router.includes("/assets/frauen/frauen-entry-locale-v1.js"),"Native visitor app not loading women's language module");
assert.ok(!router.includes('id="darFrauenCanonicalQShareV1"'),"Old Q-specific share hook still active");
const origin=fs.readFileSync(path.join(root,"assets/frauen/frauen-fiqh.js"),"utf8");
assert.ok(origin.includes("function frauenShareUrl(abschnitt, kennung)"),"Original renderer changed");
console.log("PASS Frauen: "+used.size+" canonical ID(s), 9 complete reader locales, source URLs unmodified, Q52 retired, frozen renderer untouched.");
