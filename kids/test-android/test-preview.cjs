#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const code=fs.readFileSync("kids/test-android/worker.js","utf8");
const cfg=fs.readFileSync("kids/test-android/wrangler.toml","utf8");
const install=fs.readFileSync("kids/test-install.html","utf8");
assert.match(cfg,/name\s*=\s*"dar-al-tawhid-kids-test"/);
assert.match(cfg,/routes\s*=\s*\[\s*\]/);
assert.match(cfg,/run_worker_first\s*=\s*true/);
assert.match(install,/href="\/kids\/manifest.webmanifest"/);
assert.match(install,/href="\/kids\/start\.html\?env=kids-test"/);
assert.match(install,/serviceWorker\.register\("\/kids\/sw\.js"/);
for(const icon of ["kids/icons/icon-192.png","kids/icons/icon-512.png"])
 assert.ok(fs.statSync(icon).size>1000,"Missing original Kids icon: "+icon);
const handler=new vm.Script(code.replace("export default {","const WORKER = {")+"\nWORKER")
 .runInNewContext({Response,Request,Headers,URL});
let hit=0;
const env={ASSETS:{fetch:async req=>{hit++;if(new URL(req.url).pathname==="/kids/start.html")return new Response(null,{status:308,headers:{Location:"/kids/start"}});return new Response("KIDS-TEST-ASSET",{status:200,headers:{"Content-Type":"text/html"}})}}};
async function get(path,method="GET"){
 return handler.fetch(new Request("https://kids-test.example"+path,{method}),env);
}
(async function(){
 for(const path of ["/test/","/admin/","/index.html","/kids/test-android/worker.js","/kids/creator-test/worker.js","/kids/tools/fake.cjs","/kids/api/recitation/grade"]){
  const r=await get(path);assert.equal(r.status,404,path+" not denied");
 }
 const before=hit;
 assert.equal((await get("/kids/start.html","POST")).status,405);
 assert.equal(hit,before,"POST reached assets unexpectedly");
 assert.match((await get("/")).headers.get("location"),/\/kids\/test-install\.html$/);
 assert.match((await get("/kids/")).headers.get("location"),/\/kids\/start$/);
 const html=await get("/kids/start.html");assert.equal(html.status,200,"Pretty-URL redirect loop returned instead of content");
 assert.equal(await html.text(),"KIDS-TEST-ASSET");
 const m=await get("/kids/manifest.webmanifest");assert.equal(m.status,200);
 const json=await m.json();assert.match(json.name,/KIDS TEST/);
 assert.equal(json.scope,"/kids/");
 assert.equal(json.id,"/kids/test-android-app");
 assert.equal(json.start_url,"/kids/start.html?env=kids-test");
 assert.equal(json.display,"standalone");
 assert.deepEqual(json.icons.map(x=>x.sizes).join(","),"192x192,512x512");
 for(const path of ["/kids/test-install.html","/kids/start.html","/kids/sw.js","/kids/icons/icon-192.png"]){
  const r=await get(path);
  assert.equal(r.status,200);
  assert.equal(r.headers.get("X-Kids-Environment"),"test");
  assert.match(r.headers.get("X-Robots-Tag"),/noindex/);
 }
 console.log("PASS: Android KIDS TEST PWA is isolated from visitor, adult Test and production routes");
})().catch(err=>{console.error(err);process.exit(1);});
