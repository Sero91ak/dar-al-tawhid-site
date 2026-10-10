#!/usr/bin/env node
/* Offline static + syntax guard. Run BEFORE any owner-test deployment. */
import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const read = path => fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const worker=read("cloudflare/kids-owner-test-worker.js");
const config=read("wrangler.kids-owner-test.toml");
const studio=read("kids/owner-test/owner-studio.js");
const unlock=read("kids/owner-test/academy-unlock.js");
const academy=read("kids/akademie/index.html");
const kids=read("kids/start.html");
const native=read("ios/DarAlTawhidKidsOwnerTest/Sources/KidsOwnerTestApp.swift");
const nativeProject=read("ios/DarAlTawhidKidsOwnerTest/project.yml");
for(const [name,code] of [
 ["worker",worker.replace(/export default\s*\{/,"const __worker = {")],["owner studio",studio],["academy access",unlock]
])assert.doesNotThrow(()=>new vm.Script(code,{filename:name}),name+" must parse");
assert.match(config,/name = "dar-al-tawhid-kids-owner-test"/);
assert.match(config,/main = "cloudflare\/kids-owner-test-worker\.js"/);
assert.match(config,/run_worker_first = true/);
assert.match(config,/watch_paths = \["\.cloudflare-kids-owner-test-manual-only\/\*\*"\]/);
assert(!config.includes('routes = ["/kids'),"must not claim live route");
assert.match(worker,/KIDS_OWNER_TEST_PASSWORD/);
assert.match(worker,/pass\.length<24/);
assert.match(worker,/authorized\(request,env\)/);
assert.match(worker,/request\.method!=="GET"&&request\.method!=="HEAD"/);
assert.match(worker,/return respond\("Testzugang: schreibende APIs gesperrt\.",405/);
assert(!worker.includes('env.ASSETS.fetch(new Request("https://dar-al-tawhid.de'),"test static assets must not come from live");
assert.match(worker,/htmlWithOwnerTools/);
assert.match(academy,/school-progress-v11\.js/);
assert.match(kids,/data-target="stories"/);
assert.match(kids,/id="openDuaButton"/);
assert.match(kids,/id="openQuizButton"/);
assert.match(studio,/location\.hostname/);
assert.match(unlock,/window\.__DAR_KIDS_OWNER_TEST__!==true/);
assert.match(unlock,/state\.access\(id\)==="review"/);
assert.match(nativeProject,/de\.daraltawhid\.kids\.owner\.test/);
assert(!/PRODUCT_BUNDLE_IDENTIFIER:\s*de\.daraltawhid\.kids(?:\s|$)/m.test(nativeProject),"never use the public Bundle ID");
assert.match(native,/OwnerTestConfig\.host/);
assert.match(native,/NSURLAuthenticationMethodHTTPBasic/);
assert(!native.includes('URL(string: "https://dar-al-tawhid.de/kids/start")'),"native must not load live");

// Mocked request tests: test Worker must deny access and writes before touching assets.
const source=worker.replace(/export default\s*\{/,"globalThis.__ownerTestWorker = {");
const context=vm.createContext({
 Response,Request,Headers,URL,Uint8Array,TextEncoder,atob,crypto:(await import("node:crypto")).webcrypto
});
new vm.Script(source,{filename:"kids-owner-test-worker"}).runInContext(context);
const service=context.__ownerTestWorker;
const host="https://dar-al-tawhid-kids-owner-test.sero91ak.workers.dev";
const pwd="isolated-test-credentials-not-live-2026";
let reads=0;
const assetHtml="<html><head></head><body><script src=\"/kids/akademie/school-progress-v11.js?v=20261010-11\"></script></body></html>";
const env={
 KIDS_OWNER_TEST_USERNAME:"test-owner",
 KIDS_OWNER_TEST_PASSWORD:pwd,
 ASSETS:{fetch:async request=>{
  reads++;
  const path=new URL(request.url).pathname;
  return new Response(path.endsWith(".html")?assetHtml:"sample asset",{
   status:200,headers:{"Content-Type":path.endsWith(".html")?"text/html":"application/javascript"}
  });
 }}
};
const auth="Basic "+Buffer.from("test-owner:"+pwd).toString("base64");
const req=(path,opts={})=>new Request(host+path,opts);
let response=await service.fetch(req("/kids/start"),{...env,KIDS_OWNER_TEST_PASSWORD:""});
assert.equal(response.status,503,"No secrets must fail closed");
response=await service.fetch(req("/kids/start"),env);
assert.equal(response.status,401,"Unauthenticated must be 401");
response=await service.fetch(req("/kids/start",{headers:{Authorization:"Basic "+Buffer.from("bad:bad").toString("base64")}}),env);
assert.equal(response.status,401,"Invalid credentials must be 401");
assert.equal(reads,0,"Unauthorized access must not fetch test assets");
response=await service.fetch(req("/kids/start",{method:"POST",headers:{Authorization:auth}}),env);
assert.equal(response.status,405,"All state-changing APIs fail closed");
response=await service.fetch(req("/admin/",{headers:{Authorization:auth}}),env);
assert.equal(response.status,404,"Admin routes must not be served");
response=await service.fetch(new Request("https://dar-al-tawhid.de/kids/start",{headers:{Authorization:auth}}),env);
assert.equal(response.status,421,"Cannot bind test worker to live domain");
response=await service.fetch(req("/kids/start",{headers:{Authorization:auth}}),env);
assert.equal(response.status,200);
assert.match(await response.text(),/owner-studio\.js/,"Owner control appears only in test");
response=await service.fetch(req("/kids/akademie/index.html",{headers:{Authorization:auth}}),env);
assert.equal(response.status,200);
const markup=await response.text();
assert.match(markup,/academy-unlock\.js/,"Lessons unlocked only in test HTML");
assert.match(markup,/kidsOwnerTestBootstrap/,"Test bootstrap must be present");
assert(reads===2,"Only authorized content should reach test static assets");
console.log("KIDS OWNER TEST CHECKS OK – isolation, authentication, write-denial, studio and academy");

