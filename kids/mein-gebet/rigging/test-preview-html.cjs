/* Isolated Mein Gebet HTML preview gate. No network, browser, secrets or deploy. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const base=path.resolve(__dirname,"..");
const pages=["vorschau.html","demo-junge.html","demo-maedchen.html"];
const read=n=>fs.readFileSync(path.join(base,n),"utf8");

for(const file of pages){
 test(file+" is complete UTF-8 HTML with no app install or authentication form",()=>{
  const html=read(file);
  assert.match(html,/^<!doctype html>/i);
  assert.match(html,/<html lang="de">/);
  assert.match(html,/<meta name="viewport"/);
  assert.match(html,/<\/body><\/html>\s*$/);
  assert.doesNotMatch(html,/<form\b|type="password"|serviceWorker\.register|rel="manifest"/i);
 });
 test(file+" has syntactically valid inline JS",()=>{
  const scripts=[...read(file).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new vm.Script(scripts[0][1],{filename:file}));
 });
}
test("Dashboard links to both real on-disk HTML demos",()=>{
 const html=read("vorschau.html");
 for(const file of ["demo-junge.html","demo-maedchen.html"]){
  assert.ok(html.includes('href="'+file+'"'),file+" missing href");
  assert.ok(fs.statSync(path.join(base,file)).size>20000,file+" unexpectedly tiny");
 }
});
test("Dashboard original boy and girl assets are present on the draft branch",()=>{
 const html=read("vorschau.html");
 for(const asset of ["figur-junge-original.png","figur-maedchen-original.png","hero-boy.jpg","hero-girl.jpg"]){
  assert.ok(html.includes("assets/"+asset),asset+" not displayed");
  assert.ok(fs.statSync(path.join(base,"assets",asset)).size>10000,asset+" not real");
 }
});
test("Dashboard status is honest and linked to the isolated draft PR/QA workflow",()=>{
 const html=read("vorschau.html");
 assert.match(html, /3D noch nicht verfügbar/);
 assert.match(html, /Noch gesperrt/);
 assert.match(html, /Noch offen/);
 assert.match(html, /Nicht freigegeben/);
 assert.match(html, /pull\/825/);
 assert.match(html, /kids-mein-gebet-draft-qa\.yml/);
 assert.match(html, /\/pulls\/825/);
 assert.match(html, /head\.sha/);
 assert.doesNotMatch(html, /https:\/\/dar-al-tawhid\.de\//);
});
test("Both demo HTML files support different profile genders and the four categories",()=>{
 for(const [file,gender] of [["demo-junge.html","boy"],["demo-maedchen.html","girl"]]){
  const html=read(file);
  assert.ok(html.includes('data-gender="'+gender+'"'));
  for(const heading of ["Was ist das Gebet?","Warum beten wir?","Wie bete ich?","Mein 3D-Gebet"]){
   assert.ok(html.includes(heading),heading+" missing in "+file);
  }
  assert.match(html,/Original/i);
 }
});
test("The standalone preview pages remain independent from live Kids shell",()=>{
 const html=read("vorschau.html");
 assert.ok(!html.includes("<iframe"));
 assert.ok(!html.includes('src="/kids/'));
 assert.ok(!html.includes("localStorage.setItem"));
 assert.ok(html.includes('href="demo-junge.html"'));
 assert.ok(html.includes('href="demo-maedchen.html"'));
});
