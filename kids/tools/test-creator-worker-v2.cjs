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
  // Only the five existing KIDS academy artwork assets may use the legacy
  // /desktop-preview/assets path. No unrestricted desktop-preview routing.
  const allowedArt=[
    "kids-academy-akhlaq-v1.jpg","kids-academy-adab-v1.jpg",
    "kids-academy-hero-v1.jpg","kids-academy-hero-boys-v1.jpg",
    "kids-academy-hero-girls-v1.jpg"];
  for(const asset of allowedArt){
    assert.ok(fs.existsSync(path.join(root,"kids/assets/academy-stage",asset)),
      "Original Academy image missing from isolated test asset bundle: "+asset);
    assert.ok(fs.existsSync(path.join(root,"desktop-preview/assets",asset)),
      "Missing deployed KIDS artwork source: "+asset);
    const result=await get("/kids/assets/academy-stage/"+asset);
    assert.equal(result.status,200,"Allowed KIDS artwork "+asset);
  }
  assert.equal((await get("/desktop-preview/assets/kids-academy-hero-boys-v1.jpg")).status,404);
  assert.equal((await get("/desktop-preview/assets/secret.html")).status,404);
  assert.equal((await get("/desktop-preview/")).status,404);
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
  assert.match(consoleHtml,/id="openKidsEditor"/,"Simplified three-way KIDS TEST navigation");
  assert.match(consoleHtml,/38 Unterrichte öffnen/);
  assert.match(consoleHtml,/kidstest-editor-details/);
  assert.match(consoleHtml,/selected>38 vorhandene Lektionen/);
  const academySrc=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
  assert.match(academySrc,/KIDS_CREATOR_PREVIEW=location\.hostname===/);
  assert.match(academySrc,/stagingAccess\(lessonId,st\)/);
  assert.match(academySrc,/const access=stagingAccess\(chosen\)/);
  assert.match(academySrc,/kidsCreatorAcademyBar/);
  assert.match(academySrc,/KIDS TEST · 38 Unterrichte frei/);
  assert.match(academySrc,/#academyCreatorVoiceBanner,#academyPilotStatus,#audioDiagnostics/);
  assert.ok(!academySrc.includes('const access=academySchoolState().access(chosen);'));

  assert.match(consoleHtml,/fetch\("\/kids\/test-console\/catalogue-v1\.json"/);
  const scripts=[...consoleHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length>=2,"Creator console must have navigation and lesson JS");
  scripts.forEach((match,i)=>new vm.Script(match[1],{filename:"kids-test-console-v"+i+".js"}));
  const consoleRoute=await get("/kids/test-console/index.html");
  assert.equal(consoleRoute.status,200,"Creator console must remain within KIDS-only Worker");
  const catalogueRoute=await get("/kids/test-console/catalogue-v1.json");
  assert.equal(catalogueRoute.status,200);
  // Installable standalone web app: content and editor stay ONLY on test host.
  const manifest=JSON.parse(fs.readFileSync(path.join(root,"kids/test-console/manifest.webmanifest"),"utf8"));
  const studio=fs.readFileSync(path.join(root,"kids/test-console/studio-v1.js"),"utf8");
  const styles=fs.readFileSync(path.join(root,"kids/test-console/studio-v1.css"),"utf8");
  const sw=fs.readFileSync(path.join(root,"kids/test-console/sw.js"),"utf8");
  const releasePolicy=fs.readFileSync(path.join(root,"kids/creator-test/GLOBAL-RELEASE-LOCK.md"),"utf8");
  assert.equal(manifest.display,"standalone");
  assert.equal(manifest.id,"/kids/test-console/");
  assert.equal(manifest.start_url,"/kids/test-console/");
  assert.equal(manifest.scope,"/kids/","Installed TEST app must also contain the real KIDS interface");
  assert.match(consoleHtml,/href="\/kids\/test-console\/manifest\.webmanifest"/);
  assert.match(consoleHtml,/src="\/kids\/test-console\/studio-v1\.js"/);
  assert.match(consoleHtml,/LIVE-PUSH GESPERRT/);
  assert.match(consoleHtml,/Push-Thread global/);
  assert.match(releasePolicy,/Push-Thread global/);
  assert.match(releasePolicy,/kein Merge|Keine.*Merge|kein.*main/i);
  for(const id of ["studioSlot","studioNotes","studioSave","studioExport","studioImport",
      "testAge","testProfile","testModule","cycleMonday","studioDrafts","studioModules",
      "studioReady","moduleChoose","moduleSave","studioMessage"]){
    assert.match(consoleHtml,new RegExp('id="'+id+'"'),"missing editor "+id);
  }
  new vm.Script(studio,{filename:"kids-test-studio-v1.js"});
  new vm.Script(sw,{filename:"kids-test-sw.js"});
  assert.match(sw,/url\.pathname\.startsWith\("\/kids\/test-console\/"\)/);
  assert.doesNotMatch(sw,/\/kids\/start\.html|\/kids\/akademie/);
  assert.match(studio,/localStorage\.setItem\(STORAGE_KEY/);
  assert.doesNotMatch(studio,/fetch\([^)]*,\s*\{[^}]*method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(studio,/dar-al-tawhid\.de|github\.com\/.*\/pulls|fetch\("\/kids\/api/);
  const bridge=fs.readFileSync(path.join(root,"kids/test-console/return-to-studio.js"),"utf8");
  new vm.Script(bridge,{filename:"kids-test-return-to-studio.js"});
  assert.ok(bridge.includes('location.hostname!==HOST'));
  assert.ok(bridge.includes('button.href="/kids/test-console/"'));
  const realHome=fs.readFileSync(path.join(root,"kids/start.html"),"utf8");
  const realAcademy=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
  for(const doc of [realHome,realAcademy])assert.ok(doc.includes('src="/kids/test-console/return-to-studio.js"'));
  assert.match(styles,/\.release-lock/);
  for(const file of ["manifest.webmanifest","studio-v1.js","studio-v1.css","sw.js","return-to-studio.js"]){
    const response=await get("/kids/test-console/"+file);
    assert.equal(response.status,200,"PWA asset route "+file);
  }
  console.log("KIDS TEST WEB APP V1 PASS: PWA, narrow-scope SW, local-only editing, release lock, all settings wired.");

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
