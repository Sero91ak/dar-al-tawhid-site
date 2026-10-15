#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("kids/index.html"),css=read("kids/kids-ui-contract-v1420.css"),dua=read("kids/dua-hub-v1219.js"),academy=read("kids/akademie/index.html"),salaf=read("kids/salaf-library-v1.js");
for(const shell of ["kids/start.html","kids/shell.html"])
  assert.equal(html,read(shell),"All published Kids shells must stay byte-identical");
const nav=html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0];
assert.ok(nav,"Main tab rail missing");
assert.equal((nav.match(/class="nav-btn/g)||[]).length,5,"Exactly 5 main tabs");
const markers=['data-target="today"','data-target="stories"','class="nav-btn kids-academy-tab"','data-target="salaf"','data-target="parents"'];
let cursor=-1;
for(const marker of markers){
  const i=nav.indexOf(marker);
  assert.ok(i>cursor,"Wrong five-tab order: "+marker);
  cursor=i;
}
assert.ok(nav.includes('href="/kids/akademie/index.html"'),"Lernen must open the actual academy");
assert.ok(!nav.includes('data-target="quran"')&&!nav.includes('data-target="dua"'),"No retired or extra tab");
assert.ok(dua.includes("function enhanceHeaderProfile()")&&dua.includes("function enhanceProfileCard()"),"Child avatars must remain active");
assert.ok(dua.includes('!q("#view-today")')&&dua.includes('!q("#view-parents")'),"Profile init needs surviving views only");
assert.ok(!dua.includes('!q("#view-quran")'),"Removed Quran markup must never block profile init");
assert.ok(dua.includes('if (legacy) legacy.remove();'),"Do not inject sixth Du'a tab");
assert.ok(html.includes('const KIDS_QURAN_LEARNING_REMOVED=true'),"Retired Quran lesson must remain retired");
assert.ok(!html.includes('<section id="view-quran"'),"No retired Quran lessons can return");
assert.ok(html.includes('/kids/kids-ui-contract-v1420.css?v=1420'),"Visitor shell missing shared CSS");
assert.ok(academy.includes('/kids/kids-ui-contract-v1420.css?v=1420'),"Academy missing shared CSS");
assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important")&&css.includes("word-break:normal!important"),"Hörwelten cards must not force tiny columns");
assert.ok(css.includes("grid-template-columns:repeat(5,minmax(0,1fr))!important"),"Dock must have five even-size cells");
assert.ok(css.includes("library-real-v12.png"),"Lernen 3D icon missing");
for(const asset of ["salaf-cinema-hero-boy-v1353.jpg","salaf-cinema-hero-girl-v1353.jpg","kids-academy-hero-boys-v1.jpg","kids-academy-hero-girls-v1.jpg"])
  assert.ok(css.includes(asset),"Profile-specific hero missing: "+asset);
assert.ok(salaf.includes('salaf-story-nav kids-detail-appbar'),"Shared reader header lost");
assert.ok(css.includes('#salafDetail.salaf-detail:not([hidden]) > .salaf-story-nav.kids-detail-appbar'),"Salaf reader must use shared header geometry");
console.log("PASS KIDS V1420: profile avatars, five centered tabs, wide cards, gender-aware heroes, consistent Salaf/Academy headers, Quran retirement");
