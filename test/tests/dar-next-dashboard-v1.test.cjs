/* Run: node --test test/tests/dar-next-dashboard-v1.test.cjs
   Stage-1 contract assertions; browser/device E2E remains a separate release gate. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const testRoot = path.resolve(__dirname,"..");
const read = p => fs.readFileSync(path.join(testRoot,p),"utf8");
const html = read("index.html");
const js = read("assets/dar-next-dashboard-v1.js");
const css = read("assets/dar-next-dashboard-v1.css");

test("new TEST architecture is mounted exactly once without replacing the app",()=>{
 assert.equal((html.match(/DAR_NEXT_AI_DASHBOARD_V1/g)||[]).length,1);
 assert.equal((html.match(/dar-next-dashboard-v1\.js\?/g)||[]).length,1);
 assert.equal((html.match(/dar-next-dashboard-v1\.css\?/g)||[]).length,1);
 assert.match(html,/id="appView"/);
 assert.match(html,/id="bottomNav"/);
 assert.match(html,/data-bottom-nav="ilm"/);
 assert.match(html,/headerPrayerStatus/);
});

test("script parses and is restricted to the recovered adult test application",()=>{
 assert.doesNotThrow(()=>new vm.Script(js,{filename:"dar-next-dashboard-v1.js"}));
 assert.match(js,/\/test/);
 assert.match(js,/kids/);
 assert.doesNotMatch(js,/serviceWorker\.register|serviceWorker\.unregister/);
 assert.doesNotMatch(js,/localStorage\.clear|caches\.delete|OneSignal\.send|fetch\s*\(/);
 assert.match(js,/window\.DAR_NEXT_V1/);
 assert.match(js,/location\.hash/);
 assert.match(js,/prefers-reduced-motion|MutationObserver/);
});

test("all referenced 3D icons and hero artwork are present",()=>{
 const matches=[...js.matchAll(/\{id:"[^"]+", title:"[^"]+", sub:"[^"]+", icon:"([^"]+)", art:"([^"]+)"\}/g)];
 assert.ok(matches.length>=15,"expected at least 15 working route tiles");
 for(const match of matches){
  assert.ok(fs.existsSync(path.join(testRoot,"assets/dar-3d-icons",match[1])),match[1]+" missing");
  assert.ok(fs.existsSync(path.join(testRoot,"assets/area-heroes-v1290",match[2])),match[2]+" missing");
 }
 for(const icon of ["ilm.png","dar-home-cinematic-hero.png"])assert.ok(fs.existsSync(path.join(testRoot,"assets/dar-3d-icons",icon)));
});

test("responsive behavior, contrast and reduced-motion handling remain explicit",()=>{
 assert.match(css,/@media\(max-width:699px\)/);
 assert.match(css,/@media\(min-width:1100px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/focus-visible/);
 assert.match(js,/aria-modal/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});

test("no new independent content store or fake AI endpoint introduced",()=>{
 assert.doesNotMatch(js,/https?:\/\/|\/api\/ai|generateCompletion|new WebSocket/);
 assert.match(js,/id:"ilm"/);
 assert.match(js,/window\.DAR_NEXT_V1\.navigate=go/);
 assert.match(js,/aria-modal/);
 assert.match(js,/Escape/);
 assert.match(js,/metaKey/);
});

test("all nine registered adult languages are recognized by the new launcher",()=>{
 for(const locale of ["de","ar","en","tr","ku","ckb","bs","fr","es"]){
  assert.match(js,new RegExp("(?:^|\\s)"+locale+": \\[","m"));
 }
});
