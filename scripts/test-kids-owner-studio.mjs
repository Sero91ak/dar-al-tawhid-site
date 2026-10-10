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
 ["worker",worker.replace(/export default\\s*\\{/,"const __worker = {")],["owner studio",studio],["academy access",unlock]
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
assert(!nativeProject.includes("de.daraltawhid.kids\n"),"never use the public Bundle ID");
assert.match(native,/OwnerTestConfig\.host/);
assert.match(native,/NSURLAuthenticationMethodHTTPBasic/);
assert(!native.includes('URL(string: "https://dar-al-tawhid.de/kids/start")'),"native must not load live");
console.log("KIDS OWNER TEST STATIC CHECKS OK");
