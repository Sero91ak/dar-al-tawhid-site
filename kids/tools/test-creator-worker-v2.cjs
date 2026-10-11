#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"kids/creator-test/worker.js"),"utf8");
const config=fs.readFileSync(path.join(root,"kids/creator-test/wrangler.toml"),"utf8");
assert.match(config,/name\s*=\s*"dar-al-tawhid-kids-creator"/);
assert.match(config,/routes\s*=\s*\[\s*\]/);
assert.match(config,/run_worker_first\s*=\s*true/);
assert.doesNotMatch(config,/dar-al-tawhid\.de\/kids/);
const program=new vm.Script(source.replace("export default {","const worker = {")+"\nworker", {filename:"kids-creator-worker.js"});
const handler=program.runInNewContext({URL,Headers,Response});
let calls=0;
const env={ASSETS:{fetch:async request=>{
  calls++;
  return new Response("KIDS CONTENT",{
    status:200,
    headers:{"Content-Type":request.url.endsWith(".html")?"text/html":"application/octet-stream",
      "Cache-Control":"public,max-age=3600"}
  });
}}};
const get=(path,method="GET")=>handler.fetch(new Request("https://kids-preview.example"+path,{method}),env);
(async()=>{
  for(const p of ["/","/test","/test/academy/login","/admin/","/index.html","/kids/creator-test/worker.js","/kids/tools/test.cjs","/kids/api/recitation/grade"]){
    const res=await get(p);
    assert.equal(res.status,404,"blocked "+p);
  }
  const before=calls;
  const reject=await get("/kids/start.html","POST");
  assert.equal(reject.status,405);
  assert.equal(calls,before,"blocked requests never reach asset namespace");
  const redirect=await get("/kids/");
  assert.equal(redirect.status,302);
  assert.match(redirect.headers.get("location"),/\/kids\/start$/);
  const canonical=await get("/kids/start");
  assert.equal(canonical.status,200,"Canonical start must not redirect to start.html");
  // Creator console is a staging-only, read-only inventory of public lessons.
  // No external APIs, releases or child progress may be used by this page.
  const consoleHtml=fs.readFileSync(path.join(root,"kids/test-console/index.html"),"utf8");
  const catalogue=JSON.parse(fs.readFileSync(path.join(root,"kids/test-console/catalogue-v1.json"),"utf8"));
  assert.equal(catalogue.weeks,52);
  assert.equal(catalogue.entries.length,208);
  assert.equal(catalogue.entries.filter(e=>e.catalogued).length,38);
  assert.equal(catalogue.entries.filter(e=>!e.catalogued).length,170);
  assert.equal(new Set(catalogue.entries.map(e=>e.slot)).size,208);
  assert.doesNotMatch(consoleHtml,/localStorage|indexedDB|speechSynthesis|creatorSandbox|UserDefaults\.standard/);
  assert.match(consoleHtml,/KIDS TEST · Prüfzentrale/);
  assert.match(consoleHtml,/fetch\("\/kids\/test-console\/catalogue-v1\.json"/);
  const inline=consoleHtml.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(inline,"Creator console must have a real browser script");
  new vm.Script(inline[1],{filename:"kids-test-console-v3.js"});
  const consoleRoute=await get("/kids/test-console/index.html");
  assert.equal(consoleRoute.status,200,"Creator console must remain within KIDS-only Worker");
  const catalogueRoute=await get("/kids/test-console/catalogue-v1.json");
  assert.equal(catalogueRoute.status,200);
  console.log("KIDS CREATOR CONSOLE V3 PASS: 52 weeks, 208 slots, 38 titles, no private records or unsafe unlocks.");
  const home=await get("/kids/start.html");
  assert.equal(home.status,200);
  assert.match(await home.text(),/KIDS CONTENT/);
  assert.match(home.headers.get("x-robots-tag"),/noindex/);
  assert.equal(home.headers.get("cache-control"),"private, no-store, max-age=0");
  const png=await get("/kids/assets/icon.png");
  assert.equal(png.status,200);
  assert.equal(png.headers.get("cache-control"),"public,max-age=3600");
  const head=await get("/kids/start.html","HEAD");
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
  console.log("KIDS CREATOR WORKER V2 PASS: KIDS-only routes, independent domain, no adult/admin/paid APIs, correct cache and HEAD semantics.");
})().catch(e=>{console.error(e);process.exitCode=1});
